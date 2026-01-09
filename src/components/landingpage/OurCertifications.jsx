
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase"; // <-- adjust

import cert1 from "../../assets/cert-india-organic.png";
import cert2 from "../../assets/cert-ecocert.png";
import cert3 from "../../assets/cert-jaivik-bharat.png";
import cert4 from "../../assets/cert-usda-organic.png";
import cert5 from "../../assets/cert-haccp.png";
import cert6 from "../../assets/cert-noca.png";

/* ============== tokens ============== */
const TOK = {
  maxW: "1200px",
  title: "#6e8c53",
  ring: "rgba(0,0,0,.06)",
  shadow: "0 8px 24px rgba(0,0,0,.06)",
  bg: "#fff",
};

const rise = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ============== layout ============== */
const Section = styled.section`
  background: ${TOK.bg};
  padding: clamp(20px, 6vw, 56px)
           max(12px, env(safe-area-inset-right))
           clamp(20px, 6vw, 56px)
           max(12px, env(safe-area-inset-left));
  overflow-x: hidden;
`;

const Max = styled.div`
  max-width: ${TOK.maxW};
  margin: 0 auto;
`;

const Title = styled.h2`
  margin: 0 0 clamp(16px, 4vw, 28px);
  text-align: center;
  color: ${TOK.title};
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: clamp(18px, 5vw, 36px);
  line-height: 1.15;
`;

const Grid = styled.div`
  display: grid;
  gap: clamp(12px, 3vw, 24px);
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  align-items: stretch;
  justify-items: stretch;
`;

const Tile = styled.a`
  display: grid;
  place-items: center;
  min-width: 0;
  padding: clamp(8px, 2.2vw, 12px);
  border-radius: 12px;
  outline: 1px solid ${TOK.ring};
  box-shadow: ${TOK.shadow};
  background: #fff;
  animation: ${rise} .4s ease both;
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
  aspect-ratio: 4 / 3;
  text-decoration: none;

  &:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(0,0,0,.10); filter: none; }
  &:focus-visible { box-shadow: 0 0 0 3px rgba(110,140,83,.35); }

  @media (prefers-reduced-motion: reduce){ transition: none; }
`;

const LogoImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: grayscale(30%);
`;

// Default assets for graceful fallback
const DEFAULT_ITEMS = [
  { src: cert1, alt: "India Organic" },
  { src: cert2, alt: "ECOCERT" },
  { src: cert3, alt: "Jaivik Bharat" },
  { src: cert4, alt: "USDA Organic" },
  { src: cert5, alt: "HACCP Certified" },
  { src: cert6, alt: "NOCA NPOP/NAB/0026" },
];

export default function OurCertifications({ docPath = "site_config/certifications", items: itemsProp }) {
  const [items, setItems] = useState(itemsProp || DEFAULT_ITEMS);

  useEffect(() => {
    if (!docPath) return; // allow hard-coded items via props
    const ref = doc(db, ...docPath.split("/"));
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const arr = Array.isArray(data.items) ? data.items : [];
        setItems(arr.length ? arr : DEFAULT_ITEMS);
      } else {
        setItems(DEFAULT_ITEMS);
      }
    }, () => setItems(DEFAULT_ITEMS));
    return () => unsub && unsub();
  }, [docPath]);

  return (
    <Section aria-label="Our Certifications">
      <Max>
        <Title>Our Certifications</Title>

        <Grid>
          {items.map((it, i) => {
            const Tag = it.href ? "a" : "div";
            return (
              <Tile
                as={Tag}
                key={i}
                href={it.href}
                target={it.href ? "_blank" : undefined}
                rel={it.href ? "noopener noreferrer" : undefined}
                title={it.alt}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <LogoImg src={it.src} alt={it.alt || "Certification"} loading="lazy" decoding="async" />
              </Tile>
            );
          })}
        </Grid>
      </Max>
    </Section>
  );
}

