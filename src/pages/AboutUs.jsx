// src/pages/AboutUs.jsx
import React, { useEffect, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { FiChevronRight, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ProductCategories1 from "../components/landingpage/ProductCategories1";

/* ===== Design Tokens ===== */
const TOK = {
  bg: "#f6f7f5",
  paper: "#ffffff",
  text: "#111827",
  sub: "#6b7280",
  green: "#5b7c3a",
  greenTint: "rgba(91,124,58,.08)",
  border: "rgba(16,24,40,.10)",
  ring: "rgba(91,124,58,.25)",
  maxW: "1200px",
  radius: "16px",
  shadowLg: "0 30px 70px rgba(16,24,40,.10), 0 8px 18px rgba(16,24,40,.06)",
  shadowSm: "0 10px 26px rgba(16,24,40,.08), 0 2px 8px rgba(16,24,40,.05)",
};

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px) }
  to   { opacity: 1; transform: none }
`;

const Wrap = styled.div`background:${TOK.bg};`;

const Section = styled.section`
  max-width: ${TOK.maxW};
  margin: 0 auto;
  padding: clamp(20px, 3.6vw, 44px) 16px;
  animation: ${fadeUp} .4s ease both;
`;

const Header = styled.div`
  text-align: center; margin-bottom: clamp(12px, 2.4vw, 18px);
`;

const Eyebrow = styled.div`
  display:inline-block;
  font-weight: 900; letter-spacing:.25px;
  color:${TOK.green}; background:${TOK.greenTint};
  border:1px solid ${TOK.border};
  padding: 6px 10px; border-radius: 999px; margin-bottom: 10px;
  font-size: clamp(11px, 2.6vw, 12px);
`;

const H1 = styled.h1`
  margin: 0;
  color:${TOK.text}; letter-spacing: .2px;
  font-size: clamp(22px, 5.4vw, 34px);
  line-height: 1.15; font-weight: 900;
`;

const SubLead = styled.p`
  margin: 10px auto 0; max-width: 900px;
  color:${TOK.sub}; font-weight: 600;
  font-size: clamp(13px, 3.2vw, 15px);
`;

const HeroGrid = styled.div`
  display:grid; gap: 14px; grid-template-columns: 1fr;
  @media (min-width: 940px){ grid-template-columns: 1fr 1fr; }
`;

const MediaCard = styled.div`
  position:relative; background:${TOK.paper}; border:1px solid ${TOK.border};
  border-radius:${TOK.radius}; overflow:hidden; box-shadow:${TOK.shadowLg};
  isolation:isolate;
`;

const MediaFrame = styled.div`
  position:relative; width:100%; padding-top: min(56.5%, 520px);
  @media (min-width: 940px){ padding-top: min(54%, 520px); }
  background:#0b0b0b;
  img, video, iframe {
    position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border:0;
  }
  video { background:#000; }
`;

const Copy = styled.div`
  max-width: 980px; margin: clamp(12px,2vw,16px) auto 0;
  color:${TOK.text}; line-height: 1.7; font-weight: 600;
  p { margin: 0 0 12px; }
`;

/* ===== Timeline Card ===== */
const JourneyCard = styled(Section)`
  background:${TOK.paper};
  border:1px solid ${TOK.border};
  border-radius:${TOK.radius};
  box-shadow:${TOK.shadowSm};
`;

const JourneyHead = styled.div`
  display:flex; align-items:flex-start; justify-content:space-between; gap: 16px;
  h2{ margin:0; color:${TOK.text}; font-weight:900; letter-spacing:.2px;
      font-size: clamp(18px, 4.4vw, 24px); }
  p { margin: 8px 0 0; color:${TOK.sub}; max-width: 820px; font-weight:600; }
`;

const CTA = styled.button`
  appearance:none; border:1px solid ${TOK.border};
  display:inline-flex; align-items:center; gap:8px;
  color:${TOK.green}; background:#fff; font-weight:900;
  padding:10px 12px; border-radius:12px; cursor:pointer; white-space:nowrap;
  transition: box-shadow .15s ease, transform .05s ease, background .15s ease;
  &:hover{ box-shadow:${TOK.shadowSm}; background:${TOK.greenTint}; }
  &:active{ transform: translateY(1px); }
`;

const Timeline = styled.div`
  margin-top: 18px; display:flex; gap: 16px; overflow:auto; padding: 6px 2px 10px;
  scroll-snap-type: x proximity; scrollbar-width: thin;
`;

const Milestone = styled.div`
  scroll-snap-align: start; flex: 0 0 220px;
  padding: 14px; background:#fbfbfb; border:1px solid ${TOK.border};
  border-radius: 14px; text-align:center;
`;

const Icon = styled.div`
  width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 10px;
  background: #eef2ea; display:grid; place-items:center; overflow:hidden;
  img { width: 46px; height: 46px; object-fit: contain; }
`;

const Year = styled.div`color:${TOK.text}; font-weight: 900; letter-spacing:.3px;`;
const Label = styled.div`color:${TOK.sub}; font-size: 13px; margin-top: 6px; font-weight:700;`;

/* ===== Modal for Categories ===== */
const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(14,18,22,.45);
  display: ${({ open }) => (open ? "block" : "none")};
  z-index: 80;
`;

const Sheet = styled.div`
  position: fixed; inset: 0; display: ${({ open }) => (open ? "grid" : "none")};
  place-items: center; z-index: 90; padding: clamp(10px,2.6vw,16px);
`;

const Panel = styled.div`
  width: min(1100px, 96vw); max-height: 90vh; overflow: auto;
  background: #fff; border-radius: 18px; border: 1px solid ${TOK.border};
  box-shadow: 0 40px 90px rgba(14,18,22,.35);
`;

const PanelHead = styled.div`
  display:flex; align-items:center; justify-content:space-between; padding: 14px 16px;
  border-bottom: 1px solid ${TOK.border};
  h3{ margin:0; color:${TOK.text}; font-weight:900; }
`;

const CloseBtn = styled.button`
  appearance:none; border:0; background:transparent; width:38px; height:38px; border-radius:10px;
  display:grid; place-items:center; cursor:pointer; color:${TOK.text};
  &:hover{ background:#f3f4f6; }
`;

/* ===== Helpers to render media ===== */
const isYouTube = (m) => m?.type === "youtube" || (typeof m?.url === "string" && m.url.includes("youtube.com/embed"));
const isVideo = (m) => m?.type === "video" || (typeof m?.url === "string" && /\.(mp4|webm|ogg)(\?|$)/i.test(m.url));
const isImage = (m) => m?.type === "image" || (!isYouTube(m) && !isVideo(m));

const HeroMedia = ({ media }) => {
  if (!media || !media.url) return (
    <MediaCard><MediaFrame /></MediaCard>
  );

  return (
    <MediaCard>
      <MediaFrame>
        {isYouTube(media) ? (
          <iframe
            src={media.url}
            title="Brand video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : isVideo(media) ? (
          <video src={media.url} controls playsInline preload="metadata" />
        ) : (
          <img src={media.url} alt="About hero" />
        )}
      </MediaFrame>
    </MediaCard>
  );
};

export default function AboutUs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openCats, setOpenCats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "sitePages", "about"));
        setData(snap.exists() ? snap.data() : null);
      } catch (e) {
        console.error("AboutUs load error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Prefer new schema heroMedia; fallback to legacy heroImages
  const heroMediaArr = Array.isArray(data?.heroMedia) ? data.heroMedia : [];
  const heroImagesLegacy = Array.isArray(data?.heroImages) ? data.heroImages : [];
  const heroA = heroMediaArr[0]?.url ? heroMediaArr[0] : (heroImagesLegacy[0] ? { type: "image", url: heroImagesLegacy[0] } : null);
  const heroB = heroMediaArr[1]?.url ? heroMediaArr[1] : (heroImagesLegacy[1] ? { type: "image", url: heroImagesLegacy[1] } : null);

  const milestones = Array.isArray(data?.milestones) ? data.milestones : [];

  const onOpenCats = useCallback(() => setOpenCats(true), []);
  const onCloseCats = useCallback(() => setOpenCats(false), []);
  const onSelectCategory = useCallback((cat) => {
    setOpenCats(false);
    const slug = cat?.slug || cat?.id;
    if (slug) navigate(`/category/${slug}`);
  }, [navigate]);

  // close on ESC
  useEffect(() => {
    if (!openCats) return;
    const onKey = (e) => { if (e.key === "Escape") setOpenCats(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCats]);

  return (
    <Wrap>
      <Section>
        <Header>
          <Eyebrow>{data?.subtitle || "Our Journey"}</Eyebrow>
          <H1>{data?.title || "ABOUT US — OUR JOURNEY"}</H1>
          {data?.intro ? <SubLead>{data.intro}</SubLead> : null}
        </Header>

        <HeroGrid>
          <HeroMedia media={heroA} />
          <HeroMedia media={heroB} />
        </HeroGrid>

        {!data?.intro ? (
          <Copy>
            <p>
              From sourcing organic food from a single farmer to building a community of agriculturists
              nationwide, our journey has been about care, quality, and sustainability.
            </p>
          </Copy>
        ) : null}
      </Section>

      <JourneyCard>
        <JourneyHead>
          <div>
            <h2>{data?.journeyTitle || "Our Journey"}</h2>
            <p>{data?.journeyIntro || "We welcome you to join us for another decade of eating healthier and growing bigger!"}</p>
          </div>
          <CTA onClick={onOpenCats}>
            Shop Products <FiChevronRight />
          </CTA>
        </JourneyHead>

        <Timeline>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Milestone key={i}>
                <Icon />
                <Year>—</Year>
                <Label>Loading…</Label>
              </Milestone>
            ))
            : milestones.map((m, i) => (
              <Milestone key={i}>
                <Icon>{m?.iconUrl ? <img src={m.iconUrl} alt="" /> : null}</Icon>
                <Year>{m?.year || ""}</Year>
                <Label>{m?.label || ""}</Label>
              </Milestone>
            ))}
        </Timeline>
      </JourneyCard>

      {/* Categories Modal */}
      <Backdrop open={openCats} onClick={onCloseCats} />
      <Sheet open={openCats} aria-hidden={!openCats} role="dialog" aria-modal="true">
        <Panel onClick={(e) => e.stopPropagation()}>
          <PanelHead>
            <h3>Shop by Category</h3>
            <CloseBtn aria-label="Close" onClick={onCloseCats}><FiX /></CloseBtn>
          </PanelHead>

          <ProductCategories1
            title="Shop by Category"
            subtitle="Pick a category to continue"
            onSelect={onSelectCategory}
            linkBase="/category"
          />
        </Panel>
      </Sheet>
    </Wrap>
  );
}
