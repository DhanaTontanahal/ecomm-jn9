// src/pages/ExportEnquiryPage.jsx
import React, { useState } from "react";
import styled from "styled-components";
import { FiChevronLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const TOK = {
    tint: "#fdece6",
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    maxW: "960px",
    green: "#5b7c3a",
};

const Page = styled.div`min-height:100dvh;background:#fff;`;
const Header = styled.header`
  background:${TOK.tint}; padding:12px 16px 18px;
  border-bottom-left-radius:28px; border-bottom-right-radius:28px;
  display:flex; align-items:center; gap:12px;
`;
const Back = styled.button`
  border:0;background:transparent;padding:8px;border-radius:12px;cursor:pointer;color:${TOK.ink};
`;
const Title = styled.h1`margin:0;font-size:22px;font-weight:900;`;
const Wrap = styled.div`max-width:${TOK.maxW};margin:0 auto;padding:18px;display:grid;gap:14px;`;
const Input = styled.input`
  border:1px solid ${TOK.line}; border-radius:12px; padding:12px; font-size:14px;
`;
const Textarea = styled.textarea`
  border:1px solid ${TOK.line}; border-radius:12px; padding:12px; font-size:14px;
  min-height:120px; resize:vertical;
`;
const Btn = styled.button`
  background:${TOK.green}; color:#fff; border:0; border-radius:12px;
  padding:14px; font-weight:900; cursor:pointer;
`;

export default function ExportEnquiryPage() {
    const nav = useNavigate();
    const { user } = useAuth();
    const [company, setCompany] = useState("");
    const [products, setProducts] = useState("");
    const [message, setMessage] = useState("");

    const submit = async () => {
        if (!user) return nav("/login");
        await addDoc(collection(db, "exportEnquiries"), {
            uid: user.uid,
            email: user.email || "",
            company,
            products,
            message,
            createdAt: serverTimestamp(),
        });
        alert("✅ Request submitted — we will contact you.");
        nav("/accounts");
    };

    return (
        <Page>
            <Header>
                <Back onClick={() => nav(-1)}><FiChevronLeft size={22} /></Back>
                <Title>Export Enquiry</Title>
            </Header>

            <Wrap>
                <Input placeholder="Your Company Name" value={company} onChange={(e) => setCompany(e.target.value)} />
                <Input placeholder="Products Required" value={products} onChange={(e) => setProducts(e.target.value)} />
                <Textarea placeholder="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} />
                <Btn onClick={submit}>Submit Request</Btn>
            </Wrap>
        </Page>
    );
}
