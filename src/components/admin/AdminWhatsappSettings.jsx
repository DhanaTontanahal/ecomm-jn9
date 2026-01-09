// src/components/admin/AdminWhatsappSettings.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import WhatsappChatFab from "../WhatsappChatFab";

const Wrap = styled.div`max-width:720px;margin:18px auto;padding:0 12px;display:grid;gap:12px;`;
const Card = styled.div`background:#fff;border:1px solid rgba(16,24,40,.1);border-radius:12px;padding:14px;`;
const Row = styled.div`display:grid;gap:8px;grid-template-columns:140px 1fr;align-items:center;`;
const Input = styled.input`height:42px;border:1px solid rgba(16,24,40,.12);border-radius:10px;padding:0 12px;`;
const Text = styled.textarea`min-height:84px;border:1px solid rgba(16,24,40,.12);border-radius:10px;padding:10px 12px;`;
const Save = styled.button`justify-self:start;background:#5b7c3a;color:#fff;border:0;border-radius:12px;padding:10px 14px;font-weight:900;cursor:pointer;`;
const H = styled.h2`margin:6px 0 2px;`;

export default function AdminWhatsappSettings() {
    const [phone, setPhone] = useState("+91 8374170674");
    const [message, setMessage] = useState("Hello! I’m interested in your products.");
    const [bottomOffset, setBottomOffset] = useState(92);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            const ref = doc(db, "site", "whatsapp");
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const d = snap.data() || {};
                if (d.phone) setPhone(d.phone);
                if (d.message) setMessage(d.message);
                if (typeof d.bottomOffset === "number") setBottomOffset(d.bottomOffset);
            }
        })();
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            const ref = doc(db, "site", "whatsapp");
            await setDoc(ref, { phone: phone.trim(), message: message.trim(), bottomOffset: Number(bottomOffset) || 92 }, { merge: true });
            alert("WhatsApp settings saved.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Wrap>
            <H>WhatsApp Chat Settings</H>
            <Card>
                <Row>
                    <label>WhatsApp Phone</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210 or 9876543210" />
                </Row>
                <Row>
                    <label>Default Message</label>
                    <Text value={message} onChange={(e) => setMessage(e.target.value)} />
                </Row>
                <Row>
                    <label>Bottom Offset</label>
                    <Input type="number" value={bottomOffset} onChange={(e) => setBottomOffset(e.target.value)} />
                </Row>
                <Save onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Save>
            </Card>

            <Card>
                <div style={{ marginBottom: 8, fontWeight: 800 }}>Preview</div>
                <div style={{ position: "relative", minHeight: 200, borderRadius: 12, background: "#f8fafc" }}>
                    {/* Preview uses state directly via overrides */}
                    <WhatsappChatFab phone={phone} message={message} bottomOffset={bottomOffset} />
                </div>
            </Card>
        </Wrap>
    );
}
