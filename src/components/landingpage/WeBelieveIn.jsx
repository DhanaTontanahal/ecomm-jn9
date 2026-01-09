import React from "react";
import styled, { keyframes } from "styled-components";
import { TbSpray } from "react-icons/tb";
import { FaGlobeAsia } from "react-icons/fa";
import { GiCow } from "react-icons/gi";
import { MdDoNotDisturbAlt } from "react-icons/md";

/* ====== Tokens ====== */
const TOK = {
  bg: "#f4ecdf",
  circleBg: "#f8f2e7",
  circleRing: "#e3d8c8",
  brown: "#8a6330",
  brownDark: "#6f4f26",
  cardBg: "#8a6330",
  text: "#3a3328",
  white: "#ffffff",
  maxW: "1200px",
  shadow: "0 8px 24px rgba(0,0,0,.08)",
  softRing: "0 2px 0 rgba(0, 0, 0, 0.02), inset 0 0 0 1px #e8dfd2",
};

const rise = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;
const pulse = keyframes`
  0% { transform: scale(1); } 50% { transform: scale(1.04); } 100% { transform: scale(1); }
`;

/* ====== Layout ====== */
const Section = styled.section`
  background: ${TOK.bg};
  padding: clamp(24px, 6vw, 64px)
           max(12px, env(safe-area-inset-left))
           clamp(28px, 6vw, 48px)
           max(12px, env(safe-area-inset-right));
  overflow-x: hidden; /* hard-stop any sideways scroll on mobile */
`;
const Max = styled.div`
  max-width: ${TOK.maxW};
  margin: 0 auto;
`;

const Pill = styled.div`
  width: fit-content;
  margin: 0 auto clamp(22px, 5vw, 36px);
  background: ${TOK.brown};
  color: ${TOK.white};
  font-weight: 900;
  letter-spacing: 1px;
  border-radius: 999px;
  padding: 10px 18px;
  box-shadow: ${TOK.shadow};
  text-transform: uppercase;
  font-size: clamp(14px, 2.6vw, 16px);
`;

const Grid = styled.div`
  display: grid;
  gap: clamp(14px, 3vw, 28px);
  grid-template-columns: 1fr; /* mobile-first: vertical */
  align-items: start;

  @media (min-width: 680px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 1024px){ grid-template-columns: repeat(3, minmax(0, 1fr)); }
`;

/* ====== Item ====== */
const Item = styled.article`
  display: grid;
  grid-template-rows: auto 1fr;
  gap: clamp(12px, 2.5vw, 18px);
  animation: ${rise} .55s ease both;
  min-width: 0;

  @media (prefers-reduced-motion: reduce){
    animation: none;
  }
`;

const Circle = styled.div`
  margin: 0 auto;
  width: clamp(120px, 36vw, 220px);   /* smaller on phones, grows smoothly */
  aspect-ratio: 1 / 1;                /* keeps it perfectly round */
  border-radius: 999px;
  background: ${TOK.circleBg};
  position: relative;
  box-shadow: ${TOK.shadow};
  display: grid;
  place-items: center;
  outline: 2px solid rgba(0,0,0,.03);
  border: 6px solid #f2e7d7;
  touch-action: manipulation;

  &::after {
    content: "";
    position: absolute;
    inset: 10px;
    border-radius: 999px;
    box-shadow: inset 0 0 0 2px ${TOK.circleRing};
    pointer-events: none;
  }

  svg {
    width: 56%;
    height: 56%;
    color: ${TOK.brown};
    filter: drop-shadow(0 1px 0 rgba(0,0,0,.08));
    transition: transform .2s ease;
  }

  @media (hover:hover){
    &:hover svg { transform: scale(1.05); }
  }
`;

const NoChemBadge = styled.div`
  position: absolute;
  right: 16%;
  top: 14%;
  background: ${TOK.brown};
  color: ${TOK.white};
  width: clamp(34px, 9vw, 52px);
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  display: grid;
  place-items: center;
  box-shadow: ${TOK.shadow};
  animation: ${pulse} 3.2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce){
    animation: none;
  }
`;

const Card = styled.div`
  background: ${TOK.cardBg};
  color: ${TOK.white};
  border-radius: 10px;
  padding: clamp(14px, 3.2vw, 22px);
  box-shadow: ${TOK.shadow}, ${TOK.softRing};
  text-align: center;
`;

const Title = styled.h3`
  font-size: clamp(15px, 2.4vw, 20px);
  font-weight: 800;
  margin: 0 0 8px;
  line-height: 1.25;
`;
const Rule = styled.hr`
  width: 140px;
  max-width: 60%;
  margin: 0.25rem auto 0.75rem;
  height: 2px; border: 0; background: rgba(255,255,255,.4);
`;
const Blurb = styled.p`
  margin: 0;
  opacity: .95;
  line-height: 1.55;
  font-size: clamp(13px, 2.2vw, 15px);
`;

/* ====== Data ====== */
const ITEMS = [
  {
    key: "clean",
    title: "Chemical & pesticide free food",
    blurb:
      "Our products are made from the highest quality natural ingredients, without any artificial colors, flavors, or preservatives.",
    renderIcon: () => (
      <>
        <TbSpray aria-hidden="true" focusable="false" />
        <NoChemBadge title="No chemicals">
          <MdDoNotDisturbAlt aria-hidden="true" />
        </NoChemBadge>
      </>
    ),
  },
  {
    key: "sourcing",
    title: "Ethical sourcing of premium ingredients",
    blurb:
      "All our products are natural, whole and unrefined, & retain more nutrients than conventionally produced refined food.",
    renderIcon: () => <GiCow aria-hidden="true" focusable="false" />,
  },
  {
    key: "planet",
    title: "Better for you, better for our planet",
    blurb:
      "Our aim is to support small farmers and the farming communities that produce natural food.",
    renderIcon: () => <FaGlobeAsia aria-hidden="true" focusable="false" />,
  },
];

/* ====== Component ====== */
export default function WeBelieveIn() {
  return (
    <Section aria-label="We believe in">
      <Max>
        <Pill>We Believe In</Pill>

        <Grid>
          {ITEMS.map((it, i) => (
            <Item key={it.key} style={{ animationDelay: `${i * 80}ms` }}>
              <Circle>{it.renderIcon()}</Circle>

              <Card>
                <Title>{it.title}</Title>
                <Rule />
                <Blurb>{it.blurb}</Blurb>
              </Card>
            </Item>
          ))}
        </Grid>
      </Max>
    </Section>
  );
}
