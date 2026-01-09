// src/pages/BecomeSupplierAdmin.jsx
import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";

const TOK = {
    maxW: "960px", bg: "#fff", ink: "#2c3137", sub: "#707680", line: "rgba(16,24,40,.10)", card: "#fff", pill: "rgba(16,24,40,.06)",
    green: "#5b7c3a", orange: "#d97706"
};
const Global = createGlobalStyle`body{font-family:Inter, ui-sans-serif, system-ui; color:${TOK.ink}; background:${TOK.bg}}`;
const Wrap = styled.div`max-width:${TOK.maxW}; margin:16px auto; padding:0 14px; display:grid; gap:12px;`;
const H1 = styled.h1`font-weight:900; font-size:24px; margin:0;`;
const Card = styled.div`background:${TOK.card}; border:1px solid ${TOK.line}; border-radius:16px; padding:14px; display:grid; gap:10px;`;
const Row = styled.div`display:grid; gap:4px;`;
const Label = styled.div`font-size:12px; color:${TOK.sub}; font-weight:800;`;
const Strong = styled.div`font-weight:900;`;
const Actions = styled.div`display:flex; gap:8px; flex-wrap:wrap;`;
const Btn = styled.button`
  border:1px solid ${TOK.line}; background:#fff; border-radius:10px; padding:8px 12px; font-weight:900; cursor:pointer;
`;
const Primary = styled(Btn)`background:${TOK.green}; color:#fff; border:0;`;
const Warn = styled(Btn)`background:${TOK.pill}; color:${TOK.orange}; border:1px solid ${TOK.line};`;

export default function BecomeSupplierAdmin() {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        (async () => {
            const qy = query(collection(db, "supplierRequests"), orderBy("createdAt", "desc"));
            const snap = await getDocs(qy);
            setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, []);

    const setStatus = async (id, status) => {
        await updateDoc(doc(db, "supplierRequests", id), { status });
        setRows((r) => r.map(x => x.id === id ? { ...x, status } : x));
    };

    return (
        <>
            <Global />
            <Wrap>
                <H1>Supplier Requests</H1>
                {rows.map(r => (
                    <Card key={r.id}>
                        <Row><Label>Company</Label><Strong>{r.companyName}</Strong></Row>
                        <Row><Label>Contact</Label><Strong>{r.contactName} • {r.phone}</Strong></Row>
                        {r.email && <Row><Label>Email</Label><Strong>{r.email}</Strong></Row>}
                        {r.category && <Row><Label>Category</Label><Strong>{r.category}</Strong></Row>}
                        {r.website && <Row><Label>Website</Label><Strong>{r.website}</Strong></Row>}
                        {r.message && <Row><Label>Notes</Label><div>{r.message}</div></Row>}
                        <Row><Label>Status</Label><Strong>{r.status || "NEW"}</Strong></Row>

                        <Actions>
                            <Primary onClick={() => setStatus(r.id, "APPROVED")}>Approve</Primary>
                            <Warn onClick={() => setStatus(r.id, "REVIEW")}>Mark Review</Warn>
                            <Btn onClick={() => setStatus(r.id, "REJECTED")}>Reject</Btn>
                        </Actions>
                    </Card>
                ))}
            </Wrap>
        </>
    );
}
