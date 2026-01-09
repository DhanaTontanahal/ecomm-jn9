// src/components/OffersSection.jsx
import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { collection, getDocs, orderBy, query, where, limit } from "firebase/firestore";
import { db } from "../firebase/firebase";

const TOK = {
    bg: "#f6f7f2",
    card: "#fff",
    border: "rgba(16,24,40,.10)",
    text: "#1f2a37",
    pill: "#314c1e",
    pillText: "#ecf7e9",
    shimmerA: "#eef1f4",
    shimmerB: "#e8ecef",
};
const fade = keyframes`from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}`;

const Wrap = styled.section`
  padding: clamp(16px,3vw,28px);
  background: ${TOK.bg};
`;
const Title = styled.h2`
  margin: 0 0 12px; text-align:center; color:${TOK.pill}; letter-spacing:.5px;
`;
const Grid = styled.div`
  max-width:1280px; margin:0 auto; display:grid; gap:12px;
  grid-template-columns: 1fr;
  @media (min-width:640px){ grid-template-columns: repeat(2, 1fr); }
  @media (min-width:1024px){ grid-template-columns: repeat(4, 1fr); }
`;
const Card = styled.a`
  position:relative; display:block; border:1px solid ${TOK.border}; border-radius:18px; overflow:hidden;
  background:${TOK.card}; box-shadow:0 8px 24px rgba(16,24,40,.06); animation:${fade} .35s both;
  text-decoration:none;
  img{ width:100%; aspect-ratio: 5/3; object-fit:cover; display:block; }
`;
const Pill = styled.span`
  position:absolute; top:10px; left:12px; z-index:2;
  background:${TOK.pill}; color:${TOK.pillText}; padding:8px 12px; border-radius:12px; font-weight:800; letter-spacing:.4px;
`;
const Skel = styled.div`
  height: 0; padding-bottom: 60%;
  border:1px solid ${TOK.border}; border-radius:18px; overflow:hidden;
  background: linear-gradient(90deg, ${TOK.shimmerA} 25%, ${TOK.shimmerB} 37%, ${TOK.shimmerA} 63%);
  background-size: 400% 100%; animation: shimmer 1.4s ease infinite;
  @keyframes shimmer { 0% {background-position:100% 0} 100% {background-position:0 0} }
`;

export default function OffersSection({ title = "OFFERS" }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const q = query(
                    collection(db, "siteOffers"),
                    where("active", "==", true),
                    orderBy("order", "asc"),
                    limit(12)
                );
                const s = await getDocs(q);
                setRows(s.docs.map(d => ({ id: d.id, ...d.data() })));
            } finally { setLoading(false); }
        })();
    }, []);

    return (
        <Wrap>
            <Title>{title}</Title>
            <Grid>
                {loading && Array.from({ length: 4 }).map((_, i) => <Skel key={i} />)}
                {!loading && rows.map(o => (
                    <Card key={o.id} href={o.linkUrl || "#"} aria-label={o.title || "Offer"}>
                        {o.title ? <Pill>{o.title}</Pill> : null}
                        {o.imageUrl ? <img src={o.imageUrl} alt={o.title || "Offer banner"} /> : <Skel />}
                    </Card>
                ))}
            </Grid>
        </Wrap>
    );
}
