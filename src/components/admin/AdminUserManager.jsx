import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { collection, doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../auth/AuthProvider";
import {
  FiUsers, FiSearch, FiShield, FiAlertTriangle, FiUserX, FiCheckCircle
} from "react-icons/fi";

/* ===== Glass admin tokens (same family) ===== */
const C = {
  bg: "#0b1220",
  glass: "rgba(255,255,255,.06)",
  glass2: "rgba(255,255,255,.10)",
  border: "rgba(255,255,255,.14)",
  text: "#e7efff",
  sub: "#b7c6e6",
  ring: "#78c7ff",
  primary: "#4ea1ff",
  danger: "#ef4444",
  ok: "#10b981",
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

const Page = styled.div`
  min-height: 100dvh; background:${C.bg}; color:${C.text}; padding: 20px;
`;
const Head = styled.div`
  max-width: 1280px; margin: 0 auto 12px;
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  h2{margin:0; display:flex; align-items:center; gap:10px; font-size:20px;}
`;
const Controls = styled.div`
  max-width:1280px; margin:0 auto 12px;
  display:grid; gap:10px; grid-template-columns: 1fr 200px;
  @media (min-width: 900px){ grid-template-columns: 1fr 220px 180px; }
`;
const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring} }
`;
const Select = styled.select`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%; color-scheme:dark;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring} }
  option{ background:#121a2b; color:${C.text}; }
`;
const Card = styled.div`
  background:${C.glass}; border:1px solid ${C.border}; border-radius:14px;
  padding: 14px; max-width: 1280px; margin:0 auto; animation:${fade} .3s both;
`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th,td{ border-bottom:1px solid ${C.border}; padding:10px; vertical-align:middle }
  th{ text-align:left; color:${C.sub}; font-weight:600 }
`;
const Avatar = styled.img`
  width:40px; height:40px; border-radius:999px; object-fit:cover;
  border:1px solid ${C.border}; background:#111827;
`;
const Tag = styled.span`
  border:1px solid ${C.border}; background:${p => p.$bad ? "rgba(239,68,68,.12)" : C.glass2};
  color:${p => p.$bad ? "#fecaca" : C.text}; border-radius:999px; padding:4px 8px; font-size:12px;
`;
const SmallBtn = styled.button`
  display:inline-flex; gap:6px; align-items:center; padding:6px 8px;
  border-radius:8px; border:1px solid ${C.border}; background:${C.glass2}; color:${C.text};
  &:disabled{opacity:.5; cursor:not-allowed}
`;

const ALL_ROLES = [
  "user",
  "SalesAdmin",
  "OrderManagementAdmin",
  "BooksAccountsAdmin",
  "InventoryManagerAdmin",
  "admin",
  "owner",
];
const SUPER = ["admin", "owner"];

export default function AdminUserManager() {
  const { user: me, role: myRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // filters
  const [q, setQ] = useState("");
  // const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(rows);
    });
    return unsub;
  }, []);

  const lastAdminCount = useMemo(
    () => users.filter(u => SUPER.includes(u.role)).length,
    [users]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users
      .filter(u => ["admin", "owner"].includes(u.role)) // <-- show only admins
      .filter(u => s ? (
        (u.email || "").toLowerCase().includes(s) ||
        (u.displayName || "").toLowerCase().includes(s)
      ) : true)
      .sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  }, [users, q]);


  // const filtered = useMemo(() => {
  //   const s = q.trim().toLowerCase();
  //   return users
  //     .filter(u => roleFilter === "ALL" ? true : (u.role === roleFilter))
  //     .filter(u => s ? (
  //       (u.email || "").toLowerCase().includes(s) ||
  //       (u.displayName || "").toLowerCase().includes(s)
  //     ) : true)
  //     .sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  // }, [users, q, roleFilter]);

  function roleOptionsForMe() {
    // Only owners may set owner
    return myRole === "owner" ? ALL_ROLES : ALL_ROLES.filter(r => r !== "owner");
  }

  async function updateRole(u, newRole) {
    if (newRole === u.role) return;

    // Only owners can promote/demote to owner
    if (newRole === "owner" && myRole !== "owner") {
      alert("Only the owner can grant 'owner' role.");
      return;
    }
    if (u.role === "owner" && myRole !== "owner") {
      alert("Only the owner can modify another owner.");
      return;
    }

    // Prevent demoting the last admin/owner
    const becomesNonAdmin = !SUPER.includes(newRole);
    const isOnlyAdmin = SUPER.includes(u.role) && lastAdminCount <= 1;
    if (u.id === me?.uid && becomesNonAdmin && isOnlyAdmin) {
      alert("You are the last admin. Assign another admin first before demoting yourself.");
      return;
    }

    setBusyId(u.id);
    try {
      await updateDoc(doc(db, "users", u.id), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function toggleDisabled(u) {
    if (u.id === me?.uid && !u.isDisabled) {
      // Don't let someone lock themselves out by mistake
      if (!confirm("You are disabling your own account. Continue?")) return;
    }
    setBusyId(u.id);
    try {
      await updateDoc(doc(db, "users", u.id), {
        isDisabled: !!(!u.isDisabled),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Page>
      <Head>
        <h2><FiUsers /> User Manager</h2>
        <Tag>
          {users.length} users • {lastAdminCount} admin(s)
        </Tag>
      </Head>

      <Controls>
        <div style={{ position: "relative" }}>
          <Input
            placeholder="Search name or email"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
          <FiSearch style={{ position: "absolute", left: 10, top: 12, opacity: .85 }} />
        </div>

        {/* <Select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
          <option value="ALL">All roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </Select> */}

        <Select value="admins-only" disabled>
          <option value="admins-only">Admins Only</option>
        </Select>

        <div />
      </Controls>

      <Card>
        <Table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const isMe = u.id === me?.uid;
              const canEditOwner = (u.role === "owner" || roleOptionsForMe().includes("owner")) && myRole === "owner";
              const roleChoices = roleOptionsForMe();

              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {u.photoURL ? (
                        <Avatar src={u.photoURL} alt={u.displayName || u.email} />
                      ) : (
                        <Avatar as="div" />
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {u.displayName || "—"}
                          {isMe && <span style={{ marginLeft: 8, fontSize: 12, opacity: .8 }}>(you)</span>}
                        </div>
                        <div style={{ fontSize: 12, color: C.sub }}>{u.uid}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.email || "—"}</td>
                  <td>
                    <Select
                      value={u.role || "user"}
                      onChange={e => updateRole(u, e.target.value)}
                      disabled={busyId === u.id || (u.role === "owner" && myRole !== "owner")}
                      title={(u.role === "owner" && myRole !== "owner") ? "Only owner can change owner role" : "Change role"}
                    >
                      {roleChoices.map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                  </td>
                  <td>
                    {u.isDisabled ? (
                      <Tag $bad><FiUserX style={{ verticalAlign: "-2px" }} /> Disabled</Tag>
                    ) : (
                      <Tag><FiCheckCircle style={{ verticalAlign: "-2px" }} /> Active</Tag>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <SmallBtn
                        onClick={() => toggleDisabled(u)}
                        disabled={busyId === u.id}
                        title={u.isDisabled ? "Enable user" : "Disable user"}
                      >
                        {u.isDisabled ? <FiShield /> : <FiAlertTriangle />}
                        {u.isDisabled ? "Enable" : "Disable"}
                      </SmallBtn>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filtered.length && (
              <tr>
                <td colSpan={5} style={{ color: C.sub, textAlign: "center", padding: 24 }}>
                  No users found for that filter.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </Page>
  );
}
