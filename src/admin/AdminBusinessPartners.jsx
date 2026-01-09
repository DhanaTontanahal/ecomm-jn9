// src/admin/AdminBusinessPartners.jsx
import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";

const TOK = { maxW: "960px", bg: "#fff", tint: "#fdece6", ink: "#2c3137", sub: "#707680", line: "rgba(16,24,40,.10)", card: "#fff", primary: "#5b7c3a" };
const Global = createGlobalStyle`body{font-family:Inter,ui-sans-serif;color:${TOK.ink};background:${TOK.bg}}`;
const Page = styled.div`min-height:100dvh;`;
const Head = styled.header`background:${TOK.tint};border-bottom-left-radius:28px;border-bottom-right-radius:28px;padding:12px 16px 18px;`;
const Bar = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const Back = styled.button`border:0;background:transparent;padding:8px;border-radius:12px;cursor:pointer;color:${TOK.ink};`;
const H1 = styled.h1`margin:12px 0 0;font-size:clamp(22px,4.8vw,28px);font-weight:900;`;
const Wrap = styled.div`max-width:${TOK.maxW};margin:0 auto;padding:12px 14px 24px;display:grid;gap:12px;`;
const Card = styled.div`background:${TOK.card};border:1px solid ${TOK.line};border-radius:18px;padding:12px;display:grid;gap:6px;`;
const Row = styled.div`display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;`;
const Btn = styled.button`border:1px solid ${TOK.line};background:#fff;border-radius:10px;padding:8px 10px;font-weight:800;cursor:pointer;`;

export default function AdminBusinessPartners() {
    const nav = useNavigate();
    const [rows, setRows] = useState([]);

    useEffect(() => {
        (async () => {
            const qy = query(collection(db, "requestsBusinessPartner"), orderBy("createdAt", "desc"));
            const snap = await getDocs(qy);
            setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, []);

    const mark = async (id, status) => {
        await updateDoc(doc(db, "requestsBusinessPartner", id), { status });
        setRows(s => s.map(r => r.id === id ? { ...r, status } : r));
    };
    const remove = async (id) => {
        if (!confirm("Delete this request?")) return;
        await deleteDoc(doc(db, "requestsBusinessPartner", id));
        setRows(s => s.filter(r => r.id !== id));
    };

    return (
        <Page>
            <Global />
            <Head>
                <Bar>
                    <Back onClick={() => nav(-1)}><FiChevronLeft size={22} /></Back><div />
                </Bar>
                <H1>Partner Requests</H1>
            </Head>
            <Wrap>
                {rows.map(r => (
                    <Card key={r.id}>
                        <Row><strong>{r.name}</strong><span style={{ color: TOK.sub }}>{r.phone}</span></Row>
                        <div style={{ color: TOK.sub, fontSize: 12 }}>{r.company}</div>
                        <div>{r.message}</div>
                        <Row>
                            <span style={{ fontSize: 12, color: TOK.sub }}>Status: <b>{r.status || "NEW"}</b></span>
                            <div style={{ display: "flex", gap: 6 }}>
                                <Btn onClick={() => mark(r.id, "CONTACTED")}>Contacted</Btn>
                                <Btn onClick={() => mark(r.id, "APPROVED")}>Approve</Btn>
                                <Btn onClick={() => remove(r.id)} style={{ color: "#ef4444" }}>Delete</Btn>
                            </div>
                        </Row>
                    </Card>
                ))}
            </Wrap>
        </Page>
    );
}
