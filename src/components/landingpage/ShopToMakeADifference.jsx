// src/components/landingpage/ShopToMakeADifference.jsx
import React from "react";
import styled, { keyframes } from "styled-components";
import { FaRecycle, FaMapMarkerAlt, FaPaw, FaHeart } from "react-icons/fa";
import { MdGroups } from "react-icons/md";

const TOK = {
  maxW: "1200px",
  green: "#6e8c53",
  icon: "#4e9a3c",
  circleBg: "#efe8da",
  ring: "rgba(0,0,0,.06)",
  shadow: "0 10px 26px rgba(0,0,0,.08)",
};

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px) }
  to   { opacity: 1; transform: none }
`;


const Max = styled.div`
  max-width: ${TOK.maxW};
  margin: 0 auto;
  width: 100%;
`;

const Section = styled.section`
  background: #fff;
  /* top/bottom then left/right with safe-area guards */
  padding-block: clamp(16px, 5vw, 48px) clamp(20px, 6vw, 60px);
  padding-inline: max(12px, env(safe-area-inset-left))
                  max(12px, env(safe-area-inset-right));
  overflow-x: hidden; /* defensive: never let the section create a horizontal bar */
`;

const Title = styled.h2`
  /* mobile defaults */
  margin: 0 0 clamp(12px, 3.6vw, 22px);
  padding-inline: 2px;            /* tiny buffer so letters don't touch the edge */
  text-align: left;               /* ✅ left on phones */
  color: #6e8c53;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.12;

  /* scale + spacing tuned for small screens */
  font-size: clamp(16px, 5vw, 22px);
  letter-spacing: .4px;

  /* make wrapping always possible, no clipped last letters */
  word-break: break-word;
  overflow-wrap: anywhere;
  text-wrap: balance;

  /* tighten even more for very narrow devices (e.g., iPhone SE) */
  @media (max-width: 360px){
    font-size: 16px;
    letter-spacing: .3px;
  }

  /* from tablets up, go back to a larger, centered heading */
  @media (min-width: 640px){
    text-align: center;
    font-size: clamp(20px, 3.6vw, 32px);
    letter-spacing: .6px;
    margin-bottom: clamp(14px, 3vw, 26px);
  }
`;




/* Vertical list on phones, 2 cols ≥640px, 4 cols ≥1024px */
const Grid = styled.div`
  display: grid;
  gap: clamp(10px, 3vw, 18px);
  grid-template-columns: 1fr;
  @media (min-width: 640px){ grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px){ grid-template-columns: repeat(4, 1fr); }
`;

const Item = styled.article`
  display: flex;
  align-items: center;
  gap: clamp(10px, 3.2vw, 16px);
  padding: clamp(8px, 2.8vw, 14px);
  border: 1px solid ${TOK.ring};
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 6px 14px rgba(0,0,0,.04);
  animation: ${rise} .35s ease both;
  min-width: 0;
`;

const Circle = styled.div`
  flex: 0 0 auto;
  width: clamp(64px, 18vw, 120px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  background: ${TOK.circleBg};
  display: grid;
  place-items: center;
  outline: 1px solid ${TOK.ring};
  box-shadow: ${TOK.shadow};

  svg { width: 60%; height: 60%; color: #4e9a3c; }

  .overlay{
    position: absolute; right: 16%; top: 14%;
    width: 22%; aspect-ratio: 1 / 1; border-radius: 999px;
    display: grid; place-items: center; background: #6fb65e; color: #fff;
    box-shadow: ${TOK.shadow};
  }
`;

const Text = styled.div`min-width: 0; display: grid;`;
const Label = styled.h3`
  margin: 0;
  color: ${TOK.green};
  font-weight: 800;
  line-height: 1.2;
  font-size: clamp(15px, 3.6vw, 20px);
  word-break: break-word;
`;

const ITEMS = [
  { label: "Recyclable Packaging", icon: FaRecycle },
  { label: "Sourced Locally", icon: FaMapMarkerAlt, overlay: true },
  { label: "80% Women Workforce", icon: MdGroups },
  { label: "Cruelty Free", icon: FaPaw },
];

export default function ShopToMakeADifference() {
  return (
    <Section aria-label="Shop to make a difference">
      <Max>
        <Title>Shop to Make a Difference</Title>
        <Grid>
          {ITEMS.map((it, i) => {
            const Icon = it.icon;
            return (
              <Item key={it.label} style={{ animationDelay: `${i * 60}ms` }}>
                <Circle>
                  <Icon aria-hidden="true" focusable="false" />
                  {/* {it.overlay && <span className="overlay" aria-hidden="true"><FaHeart /></span>} */}
                </Circle>
                <Text><Label>{it.label}</Label></Text>
              </Item>
            );
          })}
        </Grid>
      </Max>
    </Section>
  );
}
