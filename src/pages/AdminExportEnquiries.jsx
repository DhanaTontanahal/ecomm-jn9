// src/pages/AdminExportEnquiries.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const TOK = {
  ink: "#2c3137",
  sub: "#707680",
  line: "rgba(16,24,40,.10)",
  maxW: "960px",
};

const Wrap = styled.div`max-width:${TOK.maxW};margin:0 auto;padding:20px;display:grid;gap:12px;`;
const Card = styled.div`
  border:1px solid ${TOK.line}; border-radius:14px; padding:14px; background:#fff;
  display:grid; gap:6px;
`;

export default function AdminExportEnquiries() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "exportEnquiries"), orderBy("createdAt", "desc"));
      const out = await getDocs(q);
      setRows(out.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  return (
    <Wrap>
      <h2 style={{ fontWeight: 900 }}>Export Enquiries</h2>

      {rows.map(r => (
        <Card key={r.id}>
          <div style={{ fontWeight: 900 }}>{r.company}</div>
          <div style={{ color: TOK.sub }}>{r.email}</div>
          <div>Products: {r.products}</div>
          {r.message && <div>Message: {r.message}</div>}
        </Card>
      ))}
    </Wrap>
  );
}
