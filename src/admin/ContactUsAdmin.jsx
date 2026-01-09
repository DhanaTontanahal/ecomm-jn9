// src/pages/ContactUsAdmin.jsx
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
  min-height:220px;
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

export default function ContactUsAdmin() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "appContent", "contactUs");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setText(data?.contactUs || "");
          if (data?.updatedAt?.toDate) {
            const d = data.updatedAt.toDate();
            setLastUpdated(d.toLocaleString());
          }
        }
      } catch (e) {
        console.error("Error loading contact us content:", e);
      }
    })();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      await setDoc(
        doc(db, "appContent", "contactUs"),
        {
          contactUs: text,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      alert("✅ Contact Us content updated successfully");
    } catch (e) {
      console.error("Error saving contact us content:", e);
      alert("❌ Failed to save Contact Us content. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Global />
      <Wrap>
        <div>
          <H1>Manage Contact Us Content</H1>
          <Sub>
            Maintain your official support address, phone numbers, WhatsApp, and timing here.
          </Sub>
        </div>

        <Card>
          <Label>Contact Us Content</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Example:
Conscious Food Support

Email: care@consciousfood.com
Phone / WhatsApp: +91-XXXXXXXXXX
Address: Street, Area, City, State, PIN
Support Hours: Mon–Sat, 10:00 AM – 7:00 PM

For order-related queries, please include:
- Order ID
- Registered mobile number
- Issue details, etc.`}
          />
          <Row>
            {lastUpdated && <Small>Last updated: {lastUpdated}</Small>}
            <SaveBtn onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </SaveBtn>
          </Row>
        </Card>
      </Wrap>
    </>
  );
}
