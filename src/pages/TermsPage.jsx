// src/pages/TermsPage.jsx
import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { FiChevronLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

const TOK = {
    tint: "#fdece6",
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    maxW: "960px",
};

const Global = createGlobalStyle`body{font-family:Inter,system-ui;background:#fff;}`;
const Page = styled.div`min-height:100dvh;`;
const Head = styled.header`
 background:${TOK.tint}; padding:12px 16px 18px;
 border-bottom-left-radius:28px; border-bottom-right-radius:28px;
 display:flex; align-items:center; gap:10px;
`;
const Back = styled.button`
 border:0;background:transparent;padding:8px;border-radius:12px;cursor:pointer;color:${TOK.ink};
`;
const Title = styled.h1`margin:0;font-size:22px;font-weight:900;`;
const Wrap = styled.div`max-width:${TOK.maxW};margin:0 auto;padding:18px;line-height:1.55;white-space:pre-wrap;color:${TOK.ink};`;

export default function TermsPage() {
    const nav = useNavigate();
    const [text, setText] = useState("Loading…");

    useEffect(() => {
        (async () => {
            const snap = await getDoc(doc(db, "appContent", "legal"));
            setText(snap.exists() ? snap.data()?.terms || "No terms available." : "No terms available.");
        })();
    }, []);

    return (
        <Page>
            <Global />
            <Head>
                <Back onClick={() => nav(-1)}><FiChevronLeft size={22} /></Back>
                <Title>Terms & Conditions</Title>
            </Head>
            <Wrap>{text}</Wrap>
        </Page>
    );
}
