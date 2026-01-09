
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase"; // <-- adjust import to your project
import products from "../../assets/product-pack.png";

/* ====== tokens ====== */
const TOK = {
    maxW: "1280px",
    brown: "#8e6a32",
    brownDark: "#6d4f22",
    copy: "#5b382e",
    greenBar: "#6f8551",
    greenText: "#f5fff0",
    ring: "rgba(0,0,0,.06)",
    shadow: "0 12px 28px rgba(0,0,0,.12)",
};

/* ====== layout ====== */
const Wrap = styled.section`
  background: linear-gradient(100deg, #fff4de 0%, #ffe9c7 52%, #ffe2b6 100%);
  position: relative;
  overflow-x: hidden;
  width: 100%;
`;

const Max = styled.div`
  max-width: min(${TOK.maxW}, 100%);
  width: 100%;
  margin-inline: auto;
  padding: clamp(14px, 5vw, 36px) clamp(12px, 5vw, 24px) 0;
  box-sizing: border-box;
`;

const Hero = styled.div`
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: end;
  gap: clamp(8px, 3vw, 28px);
  min-width: 0;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    align-items: center;
    text-align: center;
  }
`;

const Copy = styled.div`
  color: ${TOK.copy};
  padding: clamp(2px, 1vw, 8px) 0 clamp(8px, 2vw, 12px);
  min-width: 0;
  word-break: break-word;
`;

const Hashtag = styled.div`
  font-size: clamp(14px, 3.8vw, 24px);
  font-weight: 800;
  color: ${TOK.copy};
  margin-top: 6px;
`;

const Headline = styled.h2`
  margin: 0 0 10px;
  font-size: clamp(18px, 4.8vw, 34px);
  line-height: 1.25;
  color: ${TOK.copy};
  font-weight: 800;
`;

const OfferPill = styled.div`
  display: inline-block;
  margin-top: clamp(6px, 1.4vw, 12px);
  background: ${TOK.brown};
  color: #fff;
  font-weight: 900;
  padding: 10px 16px;
  border-radius: 14px;
  font-size: clamp(15px, 5vw, 28px);
  position: relative;
  box-shadow: ${TOK.shadow};
  letter-spacing: 0.4px;
  line-height: 1;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 -3px 0 ${TOK.brownDark};
    opacity: 0.8;
    pointer-events: none;
  }
`;

const Sub = styled.div`
  margin-top: 8px;
  font-size: clamp(12px, 3.6vw, 16px);
  color: ${TOK.copy};
  font-weight: 700;
`;

const PackShot = styled.img`
  width: min(560px, 92vw);
  max-width: 100%;
  height: auto;
  object-fit: contain;
  transform: translateY(6px);
  filter: drop-shadow(0 10px 20px rgba(0,0,0,.12));
  justify-self: end;

  @media (max-width: 900px) {
    justify-self: center;
    transform: translateY(2px);
  }
`;

/* ====== countdown bar ====== */
const Bar = styled.div`
  background: ${TOK.greenBar};
  margin-top: clamp(12px, 3vw, 20px);
  color: ${TOK.greenText};
  width: 100%;
  overflow: hidden;
`;

const BarMax = styled.div`
  max-width: min(${TOK.maxW}, 100%);
  width: 100%;
  margin-inline: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid rgba(255,255,255,.18);
  border-bottom: 1px solid rgba(0,0,0,.08);
  box-sizing: border-box;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Cell = styled.div`
  position: relative;
  padding: clamp(10px, 3.8vw, 18px);
  text-align: center;
  min-width: 0;

  &::after {
    content: "";
    position: absolute;
    top: 18%;
    right: 0;
    bottom: 18%;
    width: 1px;
    background: rgba(255,255,255,.25);
  }
  &:last-child::after { display: none; }

  @media (max-width: 640px) {
    border-bottom: 1px solid rgba(255,255,255,.18);
    &::after { display: none; }
    &:nth-child(3),
    &:nth-child(4) { border-bottom: 0; }
  }
`;

const Num = styled.div`
  font-size: clamp(22px, 8vw, 40px);
  font-weight: 900;
  line-height: 1;
`;

const Unit = styled.div`
  margin-top: 6px;
  font-weight: 800;
  letter-spacing: 1.4px;
  font-size: clamp(10px, 3.2vw, 13px);
  opacity: 0.95;
`;

/* ====== utilities ====== */
const two = (n) => String(n).padStart(2, "0");
const getParts = (ms) => {
    const t = Math.max(0, ms);
    const d = Math.floor(t / 86400000);
    const h = Math.floor((t % 86400000) / 3600000);
    const m = Math.floor((t % 3600000) / 60000);
    const s = Math.floor((t % 60000) / 1000);
    return { d, h, m, s };
};

/**
 * Props:
 * - docPath (string) eg: "site_config/promoBanner"
 * - endsAt, headline, hashtag, offerText, subText, productImg, bgImage (fallbacks)
 */
export default function PromoBannerCountdown({
    docPath = "site_config/promoBanner",
    endsAt,
    headline = "Purity in every grain, tradition in every choice",
    hashtag = "#consciousnavratri",
    offerText = "Upto 20% OFF",
    subText = "FLAT 10% off + 10% Cashback",
    productImg = products,
    bgImage,
}) {
    const [live, setLive] = useState(null);

    useEffect(() => {
        if (!docPath) return;
        const ref = doc(db, ...docPath.split("/"));
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setLive(snap.data());
            }
        });
        return () => unsub();
    }, [docPath]);

    const effective = {
        headline,
        hashtag,
        offerText,
        subText,
        productImgUrl: productImg,
        bgImageUrl: bgImage,
        endsAt: endsAt ? new Date(endsAt).getTime() : undefined,
        isActive: true,
        ...live,
    };

    const endTs = useMemo(() => {
        if (effective?.endsAt) return Number(effective.endsAt);
        return Date.now() + 7 * 24 * 60 * 60 * 1000;
    }, [effective?.endsAt]);

    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    const { d, h, m, s } = getParts(endTs - now);

    // Hide if doc says inactive
    if (live && live.isActive === false) return null;

    const bgStyle = effective?.bgImageUrl
        ? {
            backgroundImage: `url(${effective.bgImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
        }
        : undefined;

    return (
        <Wrap style={bgStyle}>
            <Max>
                <Hero>
                    <Copy>
                        <Headline>{effective.headline}</Headline>
                        <Hashtag>{effective.hashtag}</Hashtag>
                        <OfferPill>{effective.offerText}</OfferPill>
                        <Sub>{effective.subText}</Sub>
                    </Copy>

                    {effective?.productImgUrl && (
                        <PackShot src={effective.productImgUrl} alt="Offer products" />
                    )}
                </Hero>
            </Max>

            <Bar>
                <BarMax role="timer" aria-live="polite">
                    <Cell>
                        <Num>{two(d)}</Num>
                        <Unit>DAYS</Unit>
                    </Cell>
                    <Cell>
                        <Num>{two(h)}</Num>
                        <Unit>HOURS</Unit>
                    </Cell>
                    <Cell>
                        <Num>{two(m)}</Num>
                        <Unit>MINS</Unit>
                    </Cell>
                    <Cell>
                        <Num>{two(s)}</Num>
                        <Unit>SECS</Unit>
                    </Cell>
                </BarMax>
            </Bar>
        </Wrap>
    );
}
