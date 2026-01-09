// src/pages/TermsAdmin.jsx
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
 body { background:${TOK.bg}; color:${TOK.ink}; font-family: Inter, system-ui; }
`;

const Wrap = styled.div`
 max-width:${TOK.maxW}; margin:0 auto; padding:20px; display:grid; gap:16px;
`;
const H1 = styled.h1` font-weight:900; margin:0 0 8px; `;
const Card = styled.div` background:${TOK.card}; border:1px solid ${TOK.line}; border-radius:16px; padding:16px; display:grid; gap:12px; `;
const Label = styled.div` font-weight:900; `;
const Textarea = styled.textarea`
 min-height:320px; border:1px solid ${TOK.line}; border-radius:12px;
 padding:12px; font-size:14px; resize:vertical; outline:none;
`;
const SaveBtn = styled.button`
 background:${TOK.green}; color:#fff; border:0; border-radius:12px;
 padding:12px 16px; font-weight:900; cursor:pointer;
`;

export default function TermsAdmin() {
    const [text, setText] = useState("");

    useEffect(() => {
        (async () => {
            const ref = doc(db, "appContent", "legal");
            const snap = await getDoc(ref);
            if (snap.exists()) setText(snap.data()?.terms || "");
        })();
    }, []);

    const save = async () => {
        await setDoc(doc(db, "appContent", "legal"), {
            terms: text,
            updatedAt: serverTimestamp(),
        }, { merge: true });
        alert("✅ Terms updated successfully");
    };

    return (
        <>
            <Global />
            <Wrap>
                <H1>Manage Terms & Conditions</H1>
                <Card>
                    <Label>Terms Content</Label>
                    <Textarea value={text} onChange={(e) => setText(e.target.value)} />
                    <SaveBtn onClick={save}>Save</SaveBtn>
                </Card>
            </Wrap>
        </>
    );
}
