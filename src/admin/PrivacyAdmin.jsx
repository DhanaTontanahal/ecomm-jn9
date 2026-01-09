// src/admin/PrivacyAdmin.jsx
import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { db } from "../firebase/firebase";
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";

/* ===== Account-style tokens ===== */
const TOK = {
    maxW: "960px",
    bg: "#fff",
    tint: "#fdece6",
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    card: "#ffffff",
    primary: "#5b7c3a",
    radius: "18px",
};
const rise = keyframes`from{opacity:0; transform:translateY(6px)}to{opacity:1; transform:none}`;
const Global = createGlobalStyle` body{font-family:Inter, ui-sans-serif, system-ui; color:${TOK.ink}; background:${TOK.bg}; }`;

/* layout */
const Page = styled.div`min-height:100dvh;`;
const Head = styled.header`
  background:${TOK.tint}; border-bottom-left-radius:28px; border-bottom-right-radius:28px;
  padding:12px 16px 18px; margin-bottom:12px;
`;
const Bar = styled.div`display:flex; align-items:center; justify-content:space-between;`;
const Back = styled.button`border:0;background:transparent;padding:8px;border-radius:12px;cursor:pointer;color:${TOK.ink};`;
const H1 = styled.h1`margin:12px 0 0; font-size: clamp(22px, 4.8vw, 28px); font-weight:900;`;
const Wrap = styled.div`max-width:${TOK.maxW}; margin:0 auto; padding:12px 14px 24px; display:grid; gap:12px;`;
const Card = styled.div`background:${TOK.card}; border:1px solid ${TOK.line}; border-radius:${TOK.radius}; padding:14px; animation:${rise} .35s ease; display:grid; gap:10px;`;

const Label = styled.label`font-weight:800; font-size:14px; color:${TOK.sub};`;
const Input = styled.input`
  height:44px; border:1px solid ${TOK.line}; border-radius:12px; padding:0 12px; font-size:14px; outline:0;
`;
const Textarea = styled.textarea`
  min-height:320px; border:1px solid ${TOK.line}; border-radius:12px; padding:12px; font-size:14px; outline:0; resize:vertical;
`;
const Row = styled.div`display:flex; gap:10px; flex-wrap:wrap;`;
const Primary = styled.button`
  border:0; background:${TOK.primary}; color:#fff; border-radius:12px; padding:10px 14px; font-weight:900; cursor:pointer;
`;
const Danger = styled.button`
  border:1px solid ${TOK.line}; background:#fff; color:#ef4444; border-radius:12px; padding:10px 14px; font-weight:900; cursor:pointer;
`;
const Subtle = styled.div`font-size:12px; color:${TOK.sub};`;

const DEFAULT_DOC = {
    title: "Privacy Policy",
    version: "1.0",
    body: `# Privacy Policy

We respect your privacy. This policy explains how we collect and use your data when you use Prakruti Farms Bharat apps and services.

**What we collect:** Name, contact details, delivery addresses, order history.
**Why we collect:** Process orders, deliver products, and improve the service.
**Sharing:** We don't sell your data. We only share with logistics & payment partners to fulfill your orders.

_Last updated: {DATE}_`,
};

export default function PrivacyAdmin() {
    const nav = useNavigate();
    const [title, setTitle] = useState(DEFAULT_DOC.title);
    const [version, setVersion] = useState(DEFAULT_DOC.version);
    const [body, setBody] = useState(DEFAULT_DOC.body.replace("{DATE}", new Date().toLocaleDateString("en-IN")));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const ref = doc(db, "siteContent", "privacy");
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const d = snap.data();
                setTitle(d.title || DEFAULT_DOC.title);
                setVersion(d.version || DEFAULT_DOC.version);
                setBody(d.body || DEFAULT_DOC.body);
            }
            setLoading(false);
        })();
    }, []);

    const save = async () => {
        const ref = doc(db, "siteContent", "privacy");
        await setDoc(ref, { title, version, body, updatedAt: serverTimestamp(), published: true }, { merge: true });
        alert("Privacy Policy saved.");
    };
    const resetDefault = async () => {
        setTitle(DEFAULT_DOC.title);
        setVersion(DEFAULT_DOC.version);
        setBody(DEFAULT_DOC.body.replace("{DATE}", new Date().toLocaleDateString("en-IN")));
    };
    const remove = async () => {
        if (!confirm("Delete saved policy? (Users will see default content)")) return;
        await deleteDoc(doc(db, "siteContent", "privacy"));
        resetDefault();
    };

    return (
        <Page>
            <Global />
            <Head>
                <Bar>
                    <Back onClick={() => nav(-1)} aria-label="Back"><FiChevronLeft size={22} /></Back>
                    <div />
                </Bar>
                <H1>Privacy Policy — Admin</H1>
            </Head>

            <Wrap>
                <Card>
                    <Label>Title</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} />
                    <Label>Version</Label>
                    <Input value={version} onChange={e => setVersion(e.target.value)} />
                    <Label>Body (Markdown supported)</Label>
                    <Textarea value={body} onChange={e => setBody(e.target.value)} />
                    <Row>
                        <Primary onClick={save} disabled={loading}>Save</Primary>
                        <Danger onClick={remove} disabled={loading}>Delete</Danger>
                        <button onClick={resetDefault}>Reset to default</button>
                    </Row>
                    <Subtle>Saved in Firestore: <code>siteContent / privacy</code></Subtle>
                </Card>
            </Wrap>
        </Page>
    );
}
