import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../../firebase/firebase";
import {
    doc, getDoc, setDoc, serverTimestamp
} from "firebase/firestore";
import { toast } from "react-toastify";

const C = {
    bg: "#0b1220", glass: "rgba(255,255,255,.06)", glass2: "rgba(255,255,255,.10)",
    border: "rgba(255,255,255,.14)", text: "#e7efff", sub: "#b7c6e6", ring: "#78c7ff", primary: "#4ea1ff"
};

const Wrap = styled.div`background:${C.bg}; color:${C.text}; padding:20px;`;
const Card = styled.div`background:${C.glass}; border:1px solid ${C.border}; border-radius:14px; padding:14px; max-width:960px; margin:0 auto;`;
const Row = styled.div`display:grid; grid-template-columns:1fr 1fr; gap:10px; @media(max-width:860px){grid-template-columns:1fr}`;
const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px; width:100%;
  &:focus{outline:none; box-shadow:0 0 0 3px ${C.ring}};
`;
const TextArea = styled.textarea`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px; width:100%; min-height:110px;
  &:focus{outline:none; box-shadow:0 0 0 3px ${C.ring}};
`;
const Label = styled.label`font-size:12px; color:${C.sub}; display:block; margin:6px 0 4px;`;
const Button = styled.button`
  background:${C.primary}; color:#fff; border:none; border-radius:10px; padding:10px 12px; cursor:pointer; margin-top:10px;
`;

export default function BillConfig() {
    const [form, setForm] = useState({
        title: "Your Company Pvt Ltd",
        subTitle: "Quality Goods · Fast Delivery",
        address: "Street, City, State, PIN",
        phone: "+91 98xxxxxxx",
        email: "support@example.com",
        gstin: "22AAAAA0000A1Z5",
        logoUrl: "",
        footerNotes: "Thank you for your purchase!",
        terms: "Goods once sold will not be taken back. Subject to local jurisdiction.",
    });
    const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => {
        (async () => {
            const ref = doc(db, "settings", "billConfig");
            const snap = await getDoc(ref);
            if (snap.exists()) setForm({ ...form, ...snap.data() });
        })();
        // eslint-disable-next-line
    }, []);

    async function save() {
        try {
            await setDoc(doc(db, "settings", "billConfig"), { ...form, updatedAt: serverTimestamp() }, { merge: true });
            toast.success("Bill configuration saved");
        } catch (e) {
            console.error(e); toast.error("Failed to save config");
        }
    }

    return (
        <Wrap>
            <h2 style={{ margin: "0 0 10px" }}>Bill Configuration</h2>
            <Card>
                <Row>
                    <div>
                        <Label>Title (Company / Store Name)</Label>
                        <Input value={form.title} onChange={e => setF("title", e.target.value)} />
                    </div>
                    <div>
                        <Label>Subtitle / Tagline</Label>
                        <Input value={form.subTitle} onChange={e => setF("subTitle", e.target.value)} />
                    </div>
                </Row>

                <Row>
                    <div>
                        <Label>Address</Label>
                        <TextArea value={form.address} onChange={e => setF("address", e.target.value)} />
                    </div>
                    <div>
                        <Label>Logo URL (optional)</Label>
                        <Input value={form.logoUrl} onChange={e => setF("logoUrl", e.target.value)} placeholder="https://.../logo.png" />
                        <Label>GSTIN</Label>
                        <Input value={form.gstin} onChange={e => setF("gstin", e.target.value)} />
                        <Label>Phone</Label>
                        <Input value={form.phone} onChange={e => setF("phone", e.target.value)} />
                        <Label>Email</Label>
                        <Input value={form.email} onChange={e => setF("email", e.target.value)} />
                    </div>
                </Row>

                <Row>
                    <div>
                        <Label>Footer Notes</Label>
                        <TextArea value={form.footerNotes} onChange={e => setF("footerNotes", e.target.value)} />
                    </div>
                    <div>
                        <Label>Terms & Conditions</Label>
                        <TextArea value={form.terms} onChange={e => setF("terms", e.target.value)} />
                    </div>
                </Row>

                <Button onClick={save}>Save</Button>
            </Card>
        </Wrap>
    );
}
