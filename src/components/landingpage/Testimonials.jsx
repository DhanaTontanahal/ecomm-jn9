import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";

import human1 from "../../assets/human-1.jpg";
import human2 from "../../assets/human-2.jpg";
import human3 from "../../assets/human-3.jpg";

/* ===== tokens ===== */
const TOK = {
  maxW: "1280px",
  title: "#6e8c53",
  cardBg: "#ffffff",
  cardRing: "rgba(0,0,0,.06)",
  text: "#3b3f3b",
  muted: "#6b726b",
  star: "#7b9b59",
  arrowBg: "#f2f3f2",
  arrowFg: "#5e605e",
  shadow: "0 10px 30px rgba(0,0,0,.08)",
};

const fade = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ===== layout ===== */
const Section = styled.section`
  background: #f5f6f4;
  padding: clamp(24px, 6vw, 64px) max(12px, env(safe-area-inset-left))
           clamp(28px, 6vw, 64px) max(12px, env(safe-area-inset-right));
  overflow-x: hidden;
`;
const Max = styled.div`max-width:${TOK.maxW}; margin:0 auto;`;
const Title = styled.h2`
  margin: 0 0 clamp(14px, 3vw, 24px);
  text-align: center; font-weight: 900;
  letter-spacing: clamp(1px, 0.6vw, 3px);
  color: ${TOK.title}; font-size: clamp(18px, 4.6vw, 36px);
  text-transform: uppercase;
`;

/* ===== carousel ===== */
const Wrap = styled.div`
  position: relative; margin: 0 auto; overflow: hidden; padding: 8px 0; touch-action: pan-y;
`;
const Track = styled.div`
  display: flex; gap: var(--gap, 16px); will-change: transform;
  transition: transform 420ms cubic-bezier(.22,.61,.36,1);
`;
const Card = styled.article`
  flex: 0 0 100%;
  background: ${TOK.cardBg};
  border-radius: 12px; box-shadow: ${TOK.shadow};
  outline: 1px solid ${TOK.cardRing};
  padding: clamp(16px, 4vw, 24px); text-align: center; animation: ${fade} .5s ease both; min-width: 0;
  @media (min-width: 640px)  { flex-basis: 82%; }
  @media (min-width: 1100px) { flex-basis: 58%; }
`;
const Stars = styled.div`
  display: inline-flex; gap: 6px; color: ${TOK.star};
  margin-bottom: clamp(8px, 2vw, 12px);
  svg { width: 14px; height: 14px; }
`;
const Quote = styled.p`
  color: ${TOK.text}; line-height: 1.65; font-size: clamp(14px, 2.6vw, 16px);
  margin: 0 auto clamp(12px, 3vw, 20px); max-width: 56ch;
`;
const Avatar = styled.img`
  width: clamp(88px, 28vw, 160px); height: clamp(88px, 28vw, 160px);
  border-radius: 999px; object-fit: cover; display: block; margin: 0 auto clamp(10px, 2.4vw, 16px);
  box-shadow: ${TOK.shadow};
`;
const Name = styled.h4`margin:0; font-size:clamp(14px,2.6vw,18px); font-weight:800; color:${TOK.text};`;
const Role = styled.div`color:${TOK.muted}; font-size:12px; margin-top:4px;`;
const Arrow = styled.button`
  position:absolute; top:50%; transform:translateY(-50%); appearance:none; border:0; cursor:pointer;
  width:38px; height:38px; border-radius:999px; display:grid; place-items:center; background:${TOK.arrowBg};
  color:${TOK.arrowFg}; box-shadow:${TOK.shadow}; transition: transform .15s ease, opacity .2s ease; z-index:2;
  &:hover{ transform: translateY(-50%) scale(1.05); }
  &.left{ left:max(6px, env(safe-area-inset-left)); }
  &.right{ right:max(6px, env(safe-area-inset-right)); }
  @media (max-width:640px){ width:34px; height:34px; }
`;

/* ===== default (fallback) ===== */
const DEFAULTS = [
  {
    imageUrl: human1, name: "Amogh Kadam", role: "Consumer",
    text: "I’ve tried a lot of brands, but this A2 Desi Cow Ghee is something else. Rich, fragrant, and just perfect for everyday cooking.", stars: 5
  },
  {
    imageUrl: human2, name: "Gayatri Bajoria", role: "Consumer",
    text: "I’m using the jaggery powder to replace white sugar in my coffee — it dissolves well and gives a deep caramel flavor. I really like it.", stars: 5
  },
  {
    imageUrl: human3, name: "Sunaina Agarwal", role: "Consumer",
    text: "You can always trust them to deliver quality. The forest honey was rich, thick and packed with natural flavor — nothing artificial here.", stars: 5
  },
];

export default function Testimonials() {
  const GAP = 16;
  const [idx, setIdx] = useState(1);
  const [slideW, setSlideW] = useState(0);
  const firstCardRef = useRef(null);

  const [items, setItems] = useState(DEFAULTS);

  // Live Firestore data (active + ordered). Falls back to DEFAULTS if none.
  useEffect(() => {
    const q = query(
      collection(db, "siteTestimonials"),
      where("active", "==", true),
      orderBy("order", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setItems(DEFAULTS);
        setIdx(DEFAULTS.length > 1 ? 1 : 0);
        return;
      }
      const rows = snap.docs.map(d => {
        const r = d.data();
        return {
          id: d.id,
          imageUrl: r.imageUrl || "",
          name: r.name || "",
          role: r.role || "",
          text: r.text || "",
          stars: Number(r.stars || 5),
          updatedAt: r.updatedAt || null, // used for cache busting
        };
      });
      setItems(rows);
      setIdx(rows.length > 1 ? 1 : 0);
    });

    return () => unsub();
  }, []);

  // Measure slide width so offset = (width + gap) * idx
  useEffect(() => {
    const measure = () => {
      if (!firstCardRef.current) return;
      setSlideW(firstCardRef.current.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (firstCardRef.current) ro.observe(firstCardRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const max = items.length - 1;
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(max, i + 1));
  const offset = idx * (slideW + GAP);

  return (
    <Section aria-label="Testimonials">
      <Max>
        <Title>TESTIMONIALS</Title>

        <Wrap>
          <Track style={{ transform: `translateX(-${offset}px)`, "--gap": `${GAP}px` }}>
            {items.map((t, i) => {
              // cache-bust image using updatedAt (works even if filename stays the same)
              const v = t.updatedAt?.seconds ?? t.updatedAt?._seconds ?? null;
              const base = t.imageUrl || human1;
              const src = v ? (base.includes("?") ? `${base}&v=${v}` : `${base}?v=${v}`) : base;

              return (
                <Card key={`${t.id || t.name}-${i}`} ref={i === 0 ? firstCardRef : undefined}>
                  <Stars aria-label={`${t.stars} stars`}>
                    {Array.from({ length: t.stars }).map((_, s) => <FaStar key={s} />)}
                  </Stars>

                  <Quote>“{t.text}”</Quote>

                  <Avatar src={src} alt={`${t.name} photo`} loading="lazy" />
                  <Name>{t.name}</Name>
                  <Role>{t.role}</Role>
                </Card>
              );
            })}
          </Track>

          {items.length > 1 && (
            <>
              <Arrow className="left" onClick={prev} aria-label="Previous"><FaChevronLeft /></Arrow>
              <Arrow className="right" onClick={next} aria-label="Next"><FaChevronRight /></Arrow>
            </>
          )}
        </Wrap>
      </Max>
    </Section>
  );
}
