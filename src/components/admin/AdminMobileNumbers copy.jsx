import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
    doc, onSnapshot, setDoc, updateDoc,
    arrayUnion, arrayRemove, serverTimestamp
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
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  @media (min-width: 640px) {
    grid-template-columns: 1fr 140px;
  }
`;

const Input = styled.input`
  height: 44px;
  width: 100%;
  border: 1px solid ${TOK.border};
  border-radius: 12px;
  padding: 0 12px 0 40px;
  background: #fff url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 16.92v3a2 2 0 0 1-2.18 2c-9.06-.5-16.26-7.7-16.76-16.76a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.88 6.88l1.27-1.27a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z'/%3E%3C/svg%3E") 12px 50% no-repeat;
  font-size: 14px;
  outline: 0;
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
    // If Indian 10-digit, prefix +91
    if (digits.length === 10) return `+91${digits}`;
    if (raw.trim().startsWith("+")) return `+${digits}`;
    return digits ? `+${digits}` : "";
};

const isValidPhone = (p) => /^\+\d{10,15}$/.test(p);

/* ====== component ====== */
export default function AdminMobileNumbers() {
    const [phones, setPhones] = useState([]);
    const [enabled, setEnabled] = useState(true);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    const ref = useMemo(() => doc(db, "settings", "notificationConfig"), []);

    useEffect(() => {
        const unsub = onSnapshot(ref, (snap) => {
            const d = snap.data() || {};
            setPhones(Array.isArray(d.adminPhones) ? d.adminPhones : []);
            setEnabled(d.enabled !== false); // default true
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, [ref]);

    async function ensureDoc() {
        await setDoc(ref, { adminPhones: [], enabled: true, updatedAt: serverTimestamp() }, { merge: true });
    }

    async function addPhone() {
        setErr(""); setMsg("");
        const p = normalizePhone(input);
        if (!isValidPhone(p)) {
            setErr("Enter a valid phone in E.164 format (e.g., +919876543210). 10-digit Indian numbers are auto-prefixed with +91.");
            return;
        }
        if (phones.includes(p)) {
            setErr("This number is already in the list.");
            return;
        }
        try {
            await ensureDoc();
            await updateDoc(ref, { adminPhones: arrayUnion(p), updatedAt: serverTimestamp() });
            setInput("");
            setMsg("Number added.");
            setTimeout(() => setMsg(""), 1500);
        } catch (e) {
            setErr("Could not save. Please try again.");
            console.error(e);
        }
    }

    async function removePhone(p) {
        setErr(""); setMsg("");
        try {
            await ensureDoc();
            await updateDoc(ref, { adminPhones: arrayRemove(p), updatedAt: serverTimestamp() });
            setMsg("Number removed.");
            setTimeout(() => setMsg(""), 1500);
        } catch (e) {
            setErr("Could not remove. Please try again.");
            console.error(e);
        }
    }

    async function toggleEnabled(next) {
        setErr(""); setMsg("");
        try {
            await ensureDoc();
            await updateDoc(ref, { enabled: next, updatedAt: serverTimestamp() });
            setMsg(next ? "Notifications enabled" : "Notifications disabled");
            setTimeout(() => setMsg(""), 1500);
        } catch (e) {
            setErr("Update failed. Please try again.");
            console.error(e);
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
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="+91XXXXXXXXXX"
                        aria-label="Admin phone number"
                    />
                    <AddBtn onClick={addPhone} disabled={loading}>
                        <FiPlus /> Add Number
                    </AddBtn>
                </Row>

                {msg && (
                    <Toast><FiCheckCircle /> {msg}</Toast>
                )}
                {err && <ErrorText>{err}</ErrorText>}

                {/* list */}
                <List>
                    {loading ? (
                        <InlineMsg>Loading numbers…</InlineMsg>
                    ) : phones.length === 0 ? (
                        <InlineMsg>No admin numbers saved yet.</InlineMsg>
                    ) : (
                        phones.map((p) => (
                            <Item key={p}>
                                <Phone><FiPhone /> {p}</Phone>
                                <Delete onClick={() => removePhone(p)}><FiTrash2 /> Remove</Delete>
                            </Item>
                        ))
                    )}
                </List>

                <InlineMsg style={{ marginTop: 12 }}>
                    Tip: Use E.164 format (e.g., <b>+919876543210</b>). Indian 10-digit numbers are auto-prefixed with <b>+91</b>.
                </InlineMsg>
            </Card>
        </Page>
    );
}
