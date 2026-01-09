// src/pages/RefundPolicyAdmin.jsx
import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { db } from "../firebase/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const TOK = {
    maxW: "960px",
    bg: "#fff",
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    card: "#fff",
    green: "#5b7c3a",
};

const Global = createGlobalStyle`
  body {
    background:${TOK.bg};
    color:${TOK.ink};
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
`;

const Wrap = styled.div`
  max-width:${TOK.maxW};
  margin:0 auto;
  padding:20px;
  display:grid;
  gap:16px;
`;

const H1 = styled.h1`
  font-weight:900;
  margin:0 0 8px;
`;

const Sub = styled.p`
  margin:0 0 12px;
  color:${TOK.sub};
  font-size:14px;
`;

const Card = styled.div`
  background:${TOK.card};
  border:1px solid ${TOK.line};
  border-radius:16px;
  padding:16px;
  display:grid;
  gap:12px;
`;

const Label = styled.div`
  font-weight:900;
`;

const Textarea = styled.textarea`
  min-height:320px;
  border:1px solid ${TOK.line};
  border-radius:12px;
  padding:12px;
  font-size:14px;
  resize:vertical;
  outline:none;
  width:100%;
`;

const Row = styled.div`
  display:flex;
  gap:10px;
  align-items:center;
  justify-content:flex-end;
`;

const SaveBtn = styled.button`
  background:${TOK.green};
  color:#fff;
  border:0;
  border-radius:12px;
  padding:10px 18px;
  font-weight:900;
  cursor:pointer;
  font-size:14px;
`;

const Small = styled.span`
  font-size:12px;
  color:${TOK.sub};
`;

export default function RefundPolicyAdmin() {
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const ref = doc(db, "appContent", "refundPolicy");
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    setText(data?.refundPolicy || "");
                    if (data?.updatedAt?.toDate) {
                        const d = data.updatedAt.toDate();
                        setLastUpdated(d.toLocaleString());
                    }
                }
            } catch (e) {
                console.error("Error loading refund policy:", e);
            }
        })();
    }, []);

    const save = async () => {
        try {
            setSaving(true);
            await setDoc(
                doc(db, "appContent", "refundPolicy"),
                {
                    refundPolicy: text,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
            alert("✅ Refund Policy updated successfully");
        } catch (e) {
            console.error("Error saving refund policy:", e);
            alert("❌ Failed to save refund policy. Check console for details.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Global />
            <Wrap>
                <div>
                    <H1>Manage Refund Policy</H1>
                    <Sub>
                        Update the refund & returns policy shown to customers on the
                        Refund Policy page.
                    </Sub>
                </div>

                <Card>
                    <Label>Refund Policy Content</Label>
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`Paste or type your full refund policy here...

Example:
- Refunds for non-perishable items (30 days)
- No returns for perishable items
- Damages & issues handling
- Exceptions / non-returnable items
- Exchange policy
- Contact information, etc.`}
                    />
                    <Row>
                        {lastUpdated && (
                            <Small>Last updated: {lastUpdated}</Small>
                        )}
                        <SaveBtn onClick={save} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </SaveBtn>
                    </Row>
                </Card>
            </Wrap>
        </>
    );
}
