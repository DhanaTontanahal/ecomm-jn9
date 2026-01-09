// src/pages/Customers.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { FiUsers, FiSearch, FiCheckCircle, FiUserX } from "react-icons/fi";

/* ===== Glass admin tokens (same family) ===== */
const C = {
    bg: "#0b1220",
    glass: "rgba(255,255,255,.06)",
    glass2: "rgba(255,255,255,.10)",
    border: "rgba(255,255,255,.14)",
    text: "#e7efff",
    sub: "#b7c6e6",
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

const Page = styled.div`min-height:100dvh;background:${C.bg};color:${C.text};padding:20px;`;
const Head = styled.div`
  max-width:1280px;margin:0 auto 12px;display:flex;align-items:center;justify-content:space-between;gap:12px;
  h2{margin:0;display:flex;align-items:center;gap:10px;font-size:20px;}
`;
const Controls = styled.div`
  max-width:1280px;margin:0 auto 12px;display:grid;gap:10px;grid-template-columns:1fr 240px;
  @media (min-width:900px){ grid-template-columns:1fr 280px; }
`;
const Input = styled.input`
  background:${C.glass2};color:${C.text};border:1px solid ${C.border};
  border-radius:10px;padding:10px 12px;width:100%;
  &:focus{outline:none;box-shadow:0 0 0 3px rgba(120,199,255,.35)}
`;
const Card = styled.div`
  background:${C.glass};border:1px solid ${C.border};border-radius:14px;
  padding:14px;max-width:1280px;margin:0 auto;animation:${fade} .3s both;
`;
const Table = styled.table`
  width:100%;border-collapse:collapse;font-size:14px;
  th,td{border-bottom:1px solid ${C.border};padding:10px;vertical-align:middle}
  th{text-align:left;color:${C.sub};font-weight:600}
`;
const Avatar = styled.img`
  width:40px;height:40px;border-radius:999px;object-fit:cover;
  border:1px solid ${C.border};background:#111827;
`;
const Tag = styled.span`
  border:1px solid ${C.border};
  background:${p => p.$bad ? "rgba(239,68,68,.12)" : C.glass2};
  color:${p => p.$bad ? "#fecaca" : C.text};
  border-radius:999px;padding:4px 8px;font-size:12px;
`;

export default function Customers() {
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState("");

    useEffect(() => {
        // Only users with role === "user"
        const qRef = query(
            collection(db, "users"),
            where("role", "==", "user"),
            orderBy("email")
        );
        const unsub = onSnapshot(qRef, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setRows(list);
        });
        return unsub;
    }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return rows.filter(u => s
            ? ((u.email || "").toLowerCase().includes(s) || (u.displayName || "").toLowerCase().includes(s))
            : true
        );
    }, [rows, q]);

    return (
        <Page>
            <Head>
                <h2><FiUsers /> Customers</h2>
                <Tag>{rows.length} total</Tag>
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
                <div />
            </Controls>

            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>UID</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        {u.photoURL ? <Avatar src={u.photoURL} alt={u.displayName || u.email} /> : <Avatar as="div" />}
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{u.displayName || "—"}</div>
                                            <div style={{ fontSize: 12, color: C.sub }}>{u.phoneNumber || ""}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{u.email || "—"}</td>
                                <td style={{ fontFamily: "monospace" }}>{u.uid || u.id}</td>
                                <td>
                                    {u.isDisabled
                                        ? <Tag $bad><FiUserX style={{ verticalAlign: "-2px" }} /> Disabled</Tag>
                                        : <Tag><FiCheckCircle style={{ verticalAlign: "-2px" }} /> Active</Tag>
                                    }
                                </td>
                            </tr>
                        ))}

                        {!filtered.length && (
                            <tr>
                                <td colSpan={4} style={{ color: C.sub, textAlign: "center", padding: 24 }}>
                                    No customers found for that search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Card>
        </Page>
    );
}
