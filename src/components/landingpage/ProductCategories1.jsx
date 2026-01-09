// src/components/ProductCategories.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";

/* ============ Design Tokens ============ */
const TOK = {
  bg: "#eaf5e6",
  card: "#ffffff",
  text: "#1f2a37",
  subtext: "#6b7280",
  pill: "#6b8f4e",
  pillText: "#f5fdf0",
  ring: "rgba(107,143,78,.35)",
  border: "rgba(16,24,40,.08)",
};

const fade = keyframes`
  from { opacity: 0; transform: translateY(6px) }
  to   { opacity: 1; transform: none }
`;

/* ============ Layout ============ */
const Wrap = styled.section`
  background: ${TOK.bg};
  padding: clamp(12px, 3vw, 28px)
           max(12px, env(safe-area-inset-right))
           clamp(16px, 3vw, 32px)
           max(12px, env(safe-area-inset-left));
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
`;

const Max = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 0 0 12px;

  h2 {
    margin: 0;
    color: ${TOK.text};
    font-weight: 800;
    font-size: clamp(17px, 4.4vw, 26px);
    line-height: 1.2;
  }
  span {
    color: ${TOK.subtext};
    font-size: clamp(11px, 3.4vw, 13px);
    line-height: 1.2;
  }

  @media (max-width: 520px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
`;

/* === 2 columns on mobile by default === */
const Grid = styled.div`
  display: grid;
  gap: clamp(8px, 2.4vw, 14px);
  grid-template-columns: repeat(2, minmax(0, 1fr));   /* ← mobile: 2-up */
  width: 100%;
  min-width: 0;

  @media (min-width: 640px)  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (min-width: 1024px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
`;

const Card = styled.button`
  position: relative;
  border: 1px solid ${TOK.border};
  border-radius: 14px;                      /* a bit tighter for small cards */
  overflow: hidden;
  background: ${TOK.card};
  box-shadow: 0 6px 18px rgba(16, 24, 40, .06);
  text-align: left;
  outline: none;
  padding: 0;
  cursor: pointer;
  animation: ${fade} .35s ease both;
  min-width: 0;
  touch-action: manipulation;

  &:focus-visible { box-shadow: 0 0 0 3px ${TOK.ring}; }
`;

/* === Smaller image: square crop + contain with internal padding === */
const ImgWrap = styled.div`
  aspect-ratio: 1 / 1;                      /* square looks better 2-up */
  width: 100%;
  background: #f3f4f6;
  display: grid;
  place-items: center;
  padding: 10px;                             /* creates breathing space */

  img {
    width: 88%;
    height: 88%;
    object-fit: contain;                     /* show whole product */
    object-position: center;
    display: block;
  }
`;

/* === Pill fits inside card, scales for small widths === */
const LabelBar = styled.div`
  position: absolute;
  left: 8px; right: 8px; bottom: 8px;        /* stays inside the card */
  display: grid; place-items: center;
  background: ${TOK.pill};
  color: ${TOK.pillText};
  border-radius: 12px;
  padding: 8px;
  font-weight: 800;
  font-size: clamp(10px, 2.8vw, 12px);       /* slightly smaller for 2-up */
  letter-spacing: .3px;
  text-transform: uppercase;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Skeleton = styled.div`
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid ${TOK.border};
  background: linear-gradient(90deg,#f3f4f6 25%,#eceff3 37%,#f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  aspect-ratio: 1/1;

  @keyframes shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: 0 0; }
  }
`;

/* ============ Component ============ */
export default function ProductCategories1({
  title = "Shop by Category",
  subtitle = "Organic & clean-label pantry essentials",
  onSelect,
  linkBase = "/category",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const q = query(
          collection(db, "productCategories"),
          where("active", "==", true),
          orderBy("order", "asc")
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setItems(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return <Grid>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}</Grid>;
    }
    if (!items.length) {
      return (
        <div style={{ maxWidth: 780, margin: "24px auto", textAlign: "center", color: TOK.subtext, paddingInline: 8 }}>
          No categories yet.
        </div>
      );
    }
    return (
      <Grid>
        {items.map(cat => (
          <Card
            key={cat.id}
            onClick={() => (onSelect ? onSelect(cat) : navigate(`${linkBase}/${cat.slug || cat.id}`))}
            aria-label={`Open ${cat.title}`}
          >
            <ImgWrap>
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt={cat.title} loading="lazy" />
              ) : (
                <div style={{ color: TOK.subtext, fontSize: 12 }}>No Image</div>
              )}
            </ImgWrap>
            <LabelBar>{(cat.displayName || cat.title || "").toUpperCase()}</LabelBar>
          </Card>
        ))}
      </Grid>
    );
  }, [items, loading, navigate, linkBase, onSelect]);

  return (
    <Wrap>
      <Max>
        <TitleRow>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </TitleRow>
        {content}
      </Max>
    </Wrap>
  );
}
