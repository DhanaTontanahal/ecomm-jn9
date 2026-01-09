import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
    doc, onSnapshot, setDoc, updateDoc, serverTimestamp,
    addDoc, collection, query, orderBy, deleteDoc
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { FiTrash2, FiPhone, FiPlus, FiCheckCircle } from "react-icons/fi";

/* ====== tokens ====== */
const TOK = {
    maxW: "720px",
    text: "#1f2a37",
    sub: "#6b7280",
    card: "#fff",
    border: "rgba(16,24,40,.12)",
    green: "#5b7c3a",
    greenD: "#48652f",
    red: "#ef4444",
    shadow: "0 12px 28px rgba(16,24,40,.08)",
};

const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;
const pulse = keyframes`0%{transform:scale(1)}50%{transform:scale(1.03)}100%{transform:scale(1)}`;

const Page = styled.div`
  max-width: ${TOK.maxW};
  margin: 0 auto;
  padding: clamp(14px, 4vw, 24px);
  color: ${TOK.text};
`;

const Title = styled.h2`
  margin: 0 0 4px;
  font-size: clamp(18px, 4.5vw, 22px);
`;

const Sub = styled.p`
  margin: 0 0 14px;
  color: ${TOK.sub};
  font-size: 14px;
`;

const Card = styled.div`
  background: ${TOK.card};
  border: 1px solid ${TOK.border};
  border-radius: 14px;
  box-shadow: ${TOK.shadow};
  padding: clamp(12px, 3vw, 16px);
  animation: ${fade} .25s ease both;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  align-items: center;

  @media (min-width: 520px) {
    grid-template-columns: 1fr 1fr auto; /* name | phone | add */
  }
`;

const InputBase = styled.input`
  height: 44px; width: 100%;
  border: 1px solid ${TOK.border};
  border-radius: 12px;
  padding: 0 12px;
  font-size: 14px; outline: 0; background: #fff;
`;

const NameInput = styled(InputBase)``;

const PhoneInput = styled(InputBase)`
  padding-left: 40px;
  background: #fff url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 16.92v3a2 2 0 0 1-2.18 2c-9.06-.5-16.26-7.7-16.76-16.76a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.88 6.88l1.27-1.27a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z'/%3E%3C/svg%3E") 12px 50% no-repeat;
`;

const AddBtn = styled.button`
  height: 44px;
  border: 0; border-radius: 12px;
  background: ${TOK.green};
  color: #fff; font-weight: 900;
  padding: 0 14px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform .08s ease;
  &:active { transform: translateY(1px); }
  &:disabled { opacity:.6; cursor:not-allowed; }
`;

const List = styled.ul`
  list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 8px;
`;

const Item = styled.li`
  border: 1px solid ${TOK.border};
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
  display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;
`;

const Phone = styled.div`
  display: flex; align-items: center; gap: 8px; font-weight: 800;
  svg { color: ${TOK.greenD}; }
`;

const Name = styled.div`
  font-weight: 900; color: ${TOK.text};
`;

const Delete = styled.button`
  border: 1px solid ${TOK.border};
  background: #fff; color: ${TOK.red};
  padding: 8px 10px; border-radius: 10px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
`;

const InlineMsg = styled.div`
  margin-top: 10px; font-size: 12px; color: ${TOK.sub};
`;

const Toast = styled.div`
  display: inline-flex; align-items:center; gap: 8px;
  color: ${TOK.green}; font-weight: 800; margin-top: 10px;
  svg { color: ${TOK.green}; }
  animation: ${pulse} 1.8s ease infinite;
`;

const ErrorText = styled.div`
  margin-top: 10px; color: ${TOK.red}; font-size: 13px;
`;

/* ====== helpers ====== */
const normalizePhone = (raw) => {
    if (!raw) return "";
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;       // 10-digit (IN) -> +91
    if (raw.trim().startsWith("+")) return `+${digits}`;   // keep +
    return digits ? `+${digits}` : "";
};
const isValidPhone = (p) => /^\+\d{10,15}$/.test(p);

/* ====== component ====== */
export default function AdminMobileNumbers() {
    // toggles doc
    const configRef = useMemo(() => doc(db, "settings", "notificationConfig"), []);
    // admins subcollection
    const adminsCol = useMemo(
        () => collection(db, "settings", "notificationConfig", "admins"),
        []
    );

    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    const [admins, setAdmins] = useState([]); // [{id, name, phone}]
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    // Load toggle
    useEffect(() => {
        const unsub = onSnapshot(
            configRef,
            (snap) => {
                const d = snap.data() || {};
                setEnabled(d.enabled !== false); // default true
            },
            () => { }
        );
        return () => unsub();
    }, [configRef]);

    // Load admins list (live)
    useEffect(() => {
        const q = query(adminsCol, orderBy("createdAt", "asc"));
        const unsub = onSnapshot(
            q,
            (snap) => {
                setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setLoading(false);
            },
            () => setLoading(false)
        );
        return () => unsub();
    }, [adminsCol]);

    async function ensureDoc() {
        await setDoc(
            configRef,
            { enabled: true, updatedAt: serverTimestamp() },
            { merge: true }
        );
    }

    async function addAdmin() {
        setErr(""); setMsg("");

        const nm = name.trim();
        const ph = normalizePhone(phone);

        if (!nm) {
            setErr("Please enter admin name.");
            return;
        }
        if (!isValidPhone(ph)) {
            setErr("Enter a valid phone in E.164 format (e.g., +919876543210). 10-digit Indian numbers are auto-prefixed with +91.");
            return;
        }

        try {
            await ensureDoc();
            await addDoc(adminsCol, { name: nm, phone: ph, createdAt: serverTimestamp() });
            setName(""); setPhone("");
            setMsg("Admin added.");
            setTimeout(() => setMsg(""), 1500);
        } catch (e) {
            console.error(e);
            setErr("Could not save. Please try again.");
        }
    }

    async function removeAdmin(id) {
        setErr(""); setMsg("");
        try {
            await deleteDoc(doc(db, "settings", "notificationConfig", "admins", id));
            setMsg("Admin removed.");
            setTimeout(() => setMsg(""), 1500);
        } catch (e) {
            console.error(e);
            setErr("Could not remove. Please try again.");
        }
    }

    async function toggleEnabled(next) {
        setErr(""); setMsg("");
        try {
            await ensureDoc();
            await updateDoc(configRef, { enabled: next, updatedAt: serverTimestamp() });
            setMsg(next ? "Notifications enabled" : "Notifications disabled");
            setTimeout(() => setMsg(""), 1500);
        } catch (e) {
            console.error(e);
            setErr("Update failed. Please try again.");
        }
    }

    return (
        <Page>
            <Title>Admin WhatsApp Numbers</Title>
            <Sub>
                Update these admin numbers so that a WhatsApp notification is triggered when a new order is placed by customers.
            </Sub>

            <Card>
                {/* enable/disable toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontWeight: 800 }}>WhatsApp order alerts</div>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => toggleEnabled(e.target.checked)}
                        />
                        <span style={{ fontSize: 13, color: TOK.sub }}>{enabled ? "Enabled" : "Disabled"}</span>
                    </label>
                </div>

                {/* add row */}
                <Row>
                    <NameInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Admin name"
                        aria-label="Admin name"
                    />
                    <PhoneInput
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAdmin(); } }}
                        placeholder="+91XXXXXXXXXX"
                        aria-label="Admin phone number"
                    />
                    <AddBtn onClick={addAdmin}>
                        <FiPlus /> Add Admin
                    </AddBtn>
                </Row>

                {msg && <Toast><FiCheckCircle /> {msg}</Toast>}
                {err && <ErrorText>{err}</ErrorText>}

                {/* list */}
                <List>
                    {loading ? (
                        <InlineMsg>Loading admins…</InlineMsg>
                    ) : admins.length === 0 ? (
                        <InlineMsg>No admin numbers added yet.</InlineMsg>
                    ) : (
                        admins.map((a) => (
                            <Item key={a.id}>
                                <div>
                                    <Name>{a.name}</Name>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                                        <FiPhone /> <span style={{ fontWeight: 700 }}>{a.phone}</span>
                                    </div>
                                </div>
                                <Delete onClick={() => removeAdmin(a.id)}><FiTrash2 /> Remove</Delete>
                            </Item>
                        ))
                    )}
                </List>

                <InlineMsg style={{ marginTop: 12 }}>
                    Use E.164 format (e.g., <b>+919876543210</b>). Indian 10-digit numbers are auto-prefixed with <b>+91</b>.
                </InlineMsg>
            </Card>
        </Page>
    );
}
