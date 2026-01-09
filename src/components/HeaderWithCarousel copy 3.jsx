// src/components/HeaderWithCarousel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import {
  FiChevronDown, FiSearch, FiUser, FiShoppingBag, FiMenu, FiX,
  FiChevronLeft, FiChevronRight, FiPause, FiPlay, FiMapPin,
  FiInfo, FiBookOpen, FiImage, FiLogIn, FiInstagram, FiYoutube
} from "react-icons/fi";

import { useNavigate, useLocation } from "react-router-dom";
import {
  collection, doc, getDoc, getDocs, onSnapshot,
  orderBy, query, where, addDoc, deleteDoc, setDoc, serverTimestamp, writeBatch,
  startAt, endAt, limit as qLimit, GeoPoint
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../auth/AuthProvider";
import { useCart } from "../cart/CartContext";
import ProductCategories1 from "./landingpage/ProductCategories1";
import { getAuth, signOut } from "firebase/auth";

import landing1 from "../assets/landing-5.png";
import landing2 from "../assets/landing-2.png";
import landing3 from "../assets/landing-3.png";
import landing4 from "../assets/landing-4.png";

/* =========================
   Account-page themed tokens
========================= */
const TOK = {
  maxW: "1280px",
  headerH: "68px",
  topH: "36px",
  radius: "14px",
  radiusLg: "16px",
  ring: "rgba(16,24,40,.10)",
  topBg: "rgba(255,255,255,.72)",
  topGrad: "linear-gradient(180deg, rgba(255,255,255,.86), rgba(255,255,255,.62))",
  hairline: "rgba(0,0,0,.06)",
  brand: "#1e293b",
  text: "#27303b",
  subtext: "#6b7280",
  link: "#222831",
  border: "rgba(0,0,0,.08)",
  pill: "rgba(16,24,40,.04)",
  accent: "#7a974b",
  green: "#5b7c3a",
  red: "#ef4444",
  bgGlass: "rgba(255,255,255,.78)",
};
const shadowSm = "0 10px 24px rgba(16,24,40,.06)";
const shadowMd = "0 12px 30px rgba(0,0,0,.12)";

/* ====== Global (Account page parity) ====== */
const GlobalFont = createGlobalStyle`
  :root{
    --tok-radius:${TOK.radius};
    --tok-radius-lg:${TOK.radiusLg};
  }
  html, body, #root { max-width: 100%; overflow-x: hidden; }
  * { -webkit-tap-highlight-color: transparent; }
  body {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: ${TOK.text};
    background: #fff;
  }
  ::selection { background: rgba(123, 151, 75, .18); }
`;

/* ====== Layout ====== */
const Viewport = styled.div`width:100%; overflow-x:hidden;`;

/* —— Location Modal (top sheet on mobile, centered card on desktop) —— */
const LocModalBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: ${({ $open }) => ($open ? "block" : "none")};
  z-index: 140;
`;
const LocModal = styled.div`
  position: fixed; inset: 0;
  display: flex; justify-content: center; align-items: flex-start; padding-top: 10px;
  @media (min-width: 920px){ align-items: center; padding-top: 0; }
  z-index: 141; pointer-events: none;
`;
const LocCard = styled.div`
  pointer-events: auto;
  width: 100%; max-width: 640px; max-height: 86vh;
  margin-top: ${({ $open }) => ($open ? "0" : "-100%")};
  transition: margin-top .28s cubic-bezier(.22,.61,.36,1);
  @media (min-width: 920px){
    margin-top: 0;
    transform: translateY(${({ $open }) => ($open ? "0" : "-10%")});
    transition: transform .28s cubic-bezier(.22,.61,.36,1);
  }
  background: #fff; border: 1px solid ${TOK.border}; border-radius: var(--tok-radius-lg);
  box-shadow: ${shadowMd}; overflow: hidden; display: grid; grid-template-rows: auto 1fr;
`;
const LocCardHead = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-bottom: 1px solid ${TOK.border};
  background: ${TOK.bgGlass}; backdrop-filter: saturate(1.2) blur(6px);
`;
const LocLogo = styled.div`
  width: 34px; height: 34px; border-radius: 999px; border: 2px solid ${TOK.brand};
  display: grid; place-items: center; font-weight: 900; color: ${TOK.brand}; background: #fff;
`;
const LocHeadTitle = styled.div`
  font-weight: 900; color: ${TOK.text}; letter-spacing: .2px; font-size: 16px;
`;
const LocCardBody = styled.div`
  padding: 14px; display: grid; gap: 10px; overflow: auto;
`;

const TopStrip = styled.div`
  z-index: 70;
  background: ${TOK.topGrad};
  backdrop-filter: saturate(1.2) blur(10px);
  -webkit-backdrop-filter: saturate(1.2) blur(10px);
  box-shadow: 0 1px 0 ${TOK.hairline}, 0 10px 24px rgba(16,24,40,.04);
`;

const TopInner = styled.div`
  height: ${TOK.topH}; max-width: ${TOK.maxW}; margin: 0 auto;
  display: grid; grid-template-columns: auto 1fr auto; align-items: center;
  padding: 0 14px; column-gap: 10px;
`;

const BrandCapsule = styled.button`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 999px; border: 1px solid ${TOK.border};
  background: #fff; box-shadow: 0 6px 14px rgba(16,24,40,.06);
  cursor: pointer; transition: transform .08s ease, box-shadow .2s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(16,24,40,.08); }
`;
const BrandDot = styled.div`
  width: 40px; height: 22px; border-radius: 999px; border: 2px solid ${TOK.brand};
  display: grid; place-items: center; font-weight: 900; font-size: 11px; line-height: 1; color: ${TOK.brand}; background: #fff;
`;
const BrandWordmark = styled.div`
  font-weight: 900; letter-spacing: .2px; color: ${TOK.brand};
  font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80vw;
  @media (min-width: 920px){ max-width: none; }
`;

const TopActions = styled.div`display:flex; align-items:center; justify-content:flex-end; gap:6px;`;
const ActionBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 999px; border: 1px solid ${TOK.border};
  background: rgba(255,255,255,.9);
  font-weight: 800; font-size: 12px; color: ${TOK.link};
  cursor: pointer; transition: background .15s, transform .08s;
  &:hover { background: ${TOK.pill}; }
  &:active { transform: translateY(1px); }
  svg{ width: 16px; height: 16px; }
  @media (max-width: 420px){
    padding: 6px 8px;
    span { display: none; }
  }
`;
const Sep = styled.span`width:1px; height:18px; background:${TOK.hairline}; display:inline-block;`;

/* ================ Header =============== */
const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 80;
  background: ${TOK.bgGlass};
  backdrop-filter: saturate(1.2) blur(8px);
  box-shadow: 0 1px 0 ${TOK.hairline};
`;

const Bar = styled.div`
  height: ${TOK.headerH}; max-width: ${TOK.maxW}; margin: 0 auto;
  display: grid; align-items: center; padding: 0 16px;
  grid-template-columns: auto 1fr auto; column-gap: 12px;
`;

const Nav = styled.nav`display:flex; align-items:center; justify-content:center; @media (max-width:980px){ display:none; }`;
const NavList = styled.ul`
  position: relative; display:flex; align-items:center; justify-content:center;
  gap:22px; margin:0; padding:0; list-style:none;
`;
const NavItem = styled.li`
  position:relative; white-space:nowrap;
  a, button {
    background:none; border:0; cursor:pointer; font-size:15px; font-weight:800;
    letter-spacing:.2px; color:${TOK.link}; padding:6px 0; border-bottom:2px solid transparent;
    transition:all .2s ease; display:inline-flex; align-items:center; gap:6px;
  }
  a:hover, button:hover { color:${TOK.green}; border-color:${TOK.green}; }
`;
const MoreWrap = styled.div`position:relative;`;
const Dropdown = styled.div`
  position:absolute; top:calc(100% + 10px); left:0; background:#fff; border:1px solid ${TOK.border};
  border-radius:var(--tok-radius); box-shadow:${shadowSm}; min-width:220px; padding:8px;
  display:${p => p.$open ? 'grid' : 'none'}; gap:2px; z-index:100;
`;
const DropBtn = styled.button`
  width:100%; text-align:left; padding:10px 12px; border-radius:10px; border:0; background:transparent; cursor:pointer;
  font-weight:800; color:${TOK.link}; &:hover{ background:${TOK.pill}; color:${TOK.green}; }
`;

/* Right controls (Account page tone) */
const Right = styled.div`display:flex; justify-content:end; align-items:center; gap:8px; min-width:0;`;
const IconBtn = styled.button`
  appearance:none; border:0; background:transparent; width:38px; height:38px; border-radius:999px;
  display:grid; place-items:center; cursor:pointer; color:${TOK.link}; transition:background .15s, transform .05s;
  &:hover{ background:${TOK.pill}; } &:active{ transform: translateY(1px); }
  svg{ width:20px; height:20px; }
  @media (max-width:420px){ width:34px; height:34px; svg{ width:18px; height:18px; } }
`;
const CartWrap = styled.div`position:relative;`;
const CartBadge = styled.span`
  position:absolute; top:2px; right:2px; font-size:11px; background:${TOK.link}; color:#fff;
  border-radius:999px; padding:2px 6px; line-height:1;
`;

/* Desktop search */
const DesktopSearch = styled.div`display:flex; justify-content:flex-end; position:relative; @media (max-width:980px){ display:none; }`;
const SearchWrap = styled.div`
  position:relative; width:260px; max-width:40vw;
  input{
    width:100%; height:38px; border-radius:12px; border:1px solid ${TOK.border};
    padding:0 12px 0 32px; font-size:14px; outline:none; background:#fff;
  }
  svg{ position:absolute; top:50%; left:10px; transform:translateY(-50%); color:#666; }
`;
const AutoWrap = styled.div`
  position:absolute; top:42px; left:0; right:0; z-index:80;
  background:#fff; border:1px solid ${TOK.border}; border-radius:12px; box-shadow:${shadowSm};
  max-height:360px; overflow:auto; padding:6px;
`;
const AutoItem = styled.button`
  width:100%; display:grid; grid-template-columns: 40px 1fr auto; align-items:center; gap:10px;
  padding:8px 10px; border-radius:10px; border:0; background:transparent; cursor:pointer; text-align:left;
  &:hover{ background:${TOK.pill}; }
`;
const Thumb = styled.img`
  width:40px; height:40px; object-fit:cover; border-radius:8px; border:1px solid ${TOK.border};
`;

/* Mobile search sheet */
const MobileOnly = styled.div`display:none; @media (max-width:980px){ display:block; }`;
const MobileSearchSheet = styled.div`
  position: fixed; inset: 0 0 auto 0; top: 0; z-index: 95;
  transform: translateY(${p => p.$open ? "0%" : "-100%"}); transition: transform .25s ease;
  background:#fff; border-bottom: 1px solid ${TOK.border};
`;
const MobileSearchBar = styled.div`
  max-width:${TOK.maxW}; margin: 0 auto; padding: 10px 12px; display:flex; align-items:center; gap:8px;
  input{
    flex:1; height:40px; border-radius:12px; border:1px solid ${TOK.border};
    padding:0 12px 0 34px; font-size:14px; outline:none;
    background:#fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>') no-repeat 10px center;
    background-size:18px;
  }
`;

/* ============= Carousel ============ */
const fadeIn = keyframes`from{opacity:0; transform:scale(1.01)} to{opacity:1}`;
// const Hero = styled.section`
//   position: relative; overflow: hidden; height: clamp(210px, 62vw, 520px);
//   background: #f6f6f4; isolation: isolate;
//   @media (max-width:640px){ margin:8px 12px 0; border-radius:var(--tok-radius); box-shadow:0 8px 22px rgba(16,24,40,.06); }
//   &::after{ content:""; position:absolute; inset:auto 0 0 0; height:64px;
//     background: linear-gradient(0deg, rgba(0,0,0,.22), rgba(0,0,0,0)); z-index:2; pointer-events:none; }
// `;

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  height: clamp(210px, 62vw, 520px);
  background: #f6f6f4;
  isolation: isolate;
  margin-top: calc(${TOK.topH} + ${TOK.headerH});

  @media (max-width:640px){
    margin: calc(${TOK.topH} + ${TOK.headerH}) 12px 0;
    border-radius: var(--tok-radius);
    box-shadow: 0 8px 22px rgba(16,24,40,.06);
  }

  &::after{
    content:"";
    position:absolute;
    inset:auto 0 0 0;
    height:64px;
    background: linear-gradient(0deg, rgba(0,0,0,.22), rgba(0,0,0,0));
    z-index:2;
    pointer-events:none;
  }
`;


const Track = styled.div`
  height:100%; display:flex; width:${({ $count }) => `${$count * 100}%`};
  transform:${({ $index, $count }) => `translateX(-${($index * 100) / $count}%)`};
  transition: transform .55s cubic-bezier(.22,.61,.36,1);
  will-change: transform; backface-visibility:hidden; touch-action: pan-y; z-index:1;
`;
const Slide = styled.figure`
  margin:0; height:100%; position:relative; flex:0 0 ${({ $count }) => `${100 / $count}%`};
  animation:${fadeIn} .45s ease;
  img{ width:100%; height:100%; object-fit:cover; object-position:center; display:block; }
`;
const Arrow = styled.button`
  position:absolute; top:50%; transform:translateY(-50%); appearance:none; border:0;
  width:40px; height:40px; border-radius:999px; display:grid; place-items:center;
  background:rgba(255,255,255,.92); box-shadow:0 6px 14px rgba(0,0,0,.06);
  cursor:pointer; transition: transform .15s ease; z-index:4;
  &:hover{ transform: translateY(-50%) scale(1.05); }
  svg{ width:20px; height:20px; }
  @media (max-width:640px){ width:34px; height:34px; svg{ width:18px; height:18px; } }
`;
const ArrowLeft = styled(Arrow)`left:clamp(6px,2vw,12px);`;
const ArrowRight = styled(Arrow)`right:clamp(6px,2vw,12px);`;
const Dots = styled.div`
  position:absolute; bottom:clamp(8px,2.2vw,14px); left:50%; transform:translateX(-50%);
  display:flex; gap:8px; align-items:center; justify-content:center; z-index:4; pointer-events:none;
`;
const Dot = styled.button`
  pointer-events:auto; width:8px; height:8px; border-radius:999px; border:0;
  background:${p => p.$active ? TOK.accent : "rgba(255,255,255,.88)"}; outline:2px solid rgba(0,0,0,.06);
  transform:scale(${p => p.$active ? 1.15 : 1}); transition: transform .15s, background .15s;
  @media (max-width:400px){ width:7px; height:7px; }
`;
const FloatingControls = styled.div`position:absolute; right:10px; bottom:10px; display:flex; gap:8px; z-index:4;`;

/* ============= Reusable bits matching Account page ============= */
const Section = styled.div` padding: 12px 14px; `;
const RowSpace = styled.div` display:flex; justify-content:space-between; align-items:center; gap:10px; `;
const Avatar = styled.div`
  width:42px; height:42px; border-radius: 999px; background:${TOK.pill}; color:${TOK.text};
  display:grid; place-items:center; font-weight:900;
`;
const PillBtn = styled.button`
  border:1px solid ${TOK.border}; background:#fff; border-radius:12px; padding:8px 12px; font-weight:800; cursor:pointer;
`;
const Primary = styled.button`
  border:0; background:${TOK.green}; color:#fff; border-radius:12px; padding:10px 12px; font-weight:900; cursor:pointer;
`;


const SocialCircle = styled.a`
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid ${TOK.border};
  background: #ffffff;
  color: ${TOK.link};
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.08s ease;

  &:hover {
    background: ${TOK.pill};
    transform: translateY(-1px);
  }

  @media (max-width: 420px) {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
`;



/* ===== Helpers ===== */
const initialsFrom = (user) => {
  const s = (user?.displayName || user?.email || "U").trim();
  const [a = "", b = ""] = s.split(" ");
  return (a[0] || "U").toUpperCase() + (b[0] || "").toUpperCase();
};
const slugify = (s = "") =>
  s.toString().toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
const debounce = (fn, ms = 250) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

/* =========================
   Component
========================= */

const SOCIAL_DOC_REF = doc(db, "site", "social");

const DEFAULT_INSTAGRAM = "https://www.instagram.com/";
const DEFAULT_YOUTUBE = "https://www.youtube.com/";

export default function HeaderWithCarousel() {


  const [socialLinks, setSocialLinks] = useState({
    instagramUrl: DEFAULT_INSTAGRAM,
    youtubeUrl: DEFAULT_YOUTUBE,
  });

  // 🔗 Social links (Instagram + YouTube) shared with footer
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const snap = await getDoc(SOCIAL_DOC_REF);
        if (!snap.exists() || !isMounted) return;
        const data = snap.data() || {};
        setSocialLinks({
          instagramUrl: data.instagramUrl || DEFAULT_INSTAGRAM,
          youtubeUrl: data.youtubeUrl || DEFAULT_YOUTUBE,
        });
      } catch (e) {
        console.error("Error loading social links for header", e);
        // keep defaults on error
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);



  const userCtx = useAuth?.() || {};
  const [accountDesktopOpen, setAccountDesktopOpen] = useState(false);

  const nav = useNavigate();
  const loc = useLocation();
  let cart = null; try { cart = useCart(); } catch { cart = null; }
  const { user } = useAuth?.() || { user: null };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const [brand, setBrand] = useState({ name: "Prakruti Farms Bharat", initials: "PFB", autoplaySec: 5 });
  const [slides, setSlides] = useState([]);

  // dynamic categories
  const [cats, setCats] = useState([]);

  // categories & account sheets
  const [catsOpen, setCatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // address form
  const [addrFormOpen, setAddrFormOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [defaultAddrId, setDefaultAddrId] = useState(null);

  // mobile categories visible count
  const [mobileVisibleCount, setMobileVisibleCount] = useState(5);


  // More dropdown (desktop)
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // NEW: Location popover / modal
  const [locPopoverOpen, setLocPopoverOpen] = useState(false);
  const locRef = useRef(null);

  useEffect(() => {
    const away = (e) => { if (!locRef.current) return; if (!locRef.current.contains(e.target)) setLocPopoverOpen(false); };
    document.addEventListener("click", away);
    return () => document.removeEventListener("click", away);
  }, []);

  useEffect(() => {
    if (!moreRef.current) return;
    const away = (e) => { if (!moreRef.current) return; if (!moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener("click", away);
    return () => document.removeEventListener("click", away);
  }, []);

  // mobile detection
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width: 919px)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 919px)");
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange);
    };
  }, []);

  const closeCats = () => setCatsOpen(false);

  // ESC closes things
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (addrFormOpen) setAddrFormOpen(false);
        else if (accountOpen) setAccountOpen(false);
        else if (catsOpen) setCatsOpen(false);
        else if (moreOpen) setMoreOpen(false);
        else if (mobileSearchOpen) setMobileSearchOpen(false);
        else if (locPopoverOpen) setLocPopoverOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catsOpen, accountOpen, addrFormOpen, moreOpen, mobileSearchOpen, locPopoverOpen]);

  // lock scroll when any sheet open (mobile only)
  useEffect(() => {
    const open = catsOpen || accountOpen || addrFormOpen || locPopoverOpen;
    if (!isMobile) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [catsOpen, accountOpen, addrFormOpen, locPopoverOpen, isMobile]);

  // fetch brand + slides
  useEffect(() => {
    (async () => {
      try {
        const sdoc = await getDoc(doc(db, "site", "header"));
        if (sdoc.exists()) {
          const d = sdoc.data();
          setBrand({
            name: d.brandName || "Prakruti Farms Bharat",
            initials: d.brandInitials || "PFB",
            autoplaySec: typeof d.autoplaySec === "number" ? d.autoplaySec : 5,
          });
        }
        const slSnap = await getDocs(query(collection(db, "siteSlides"), where("active", "==", true), orderBy("order", "asc")));
        setSlides(slSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        setSlides([
          { imageUrl: landing1, alt: "Rooted in tradition – crafted with care" },
          { imageUrl: landing2, alt: "Raw, real, unprocessed and unheated" },
          { imageUrl: landing3, alt: "Sustainable choices, better living" },
          { imageUrl: landing4, alt: "Great choices, Sustainable living" },
        ]);
      }
    })();
  }, []);

  // LIVE categories from Firestore
  useEffect(() => {
    const qy = query(
      collection(db, "productCategories"),
      where("active", "==", true),
      orderBy("order", "asc")
    );
    const unsub = onSnapshot(qy, (snap) => {
      const rows = snap.docs.map(d => {
        const x = d.data() || {};
        const name = (x.displayName || x.title || x.name || "Category").toString();
        const slug = (x.slug && String(x.slug)) || slugify(name);
        return { id: d.id, name, slug, order: x.order ?? 999 };
      });
      setCats(rows);
    }, () => setCats([]));
    return () => unsub();
  }, []);

  // split categories for desktop "More"
  const DESKTOP_LIMIT = 7;
  const { headCats, tailCats } = useMemo(() => {
    const head = (cats || []).slice(0, DESKTOP_LIMIT);
    const tail = (cats || []).slice(DESKTOP_LIMIT);
    return { headCats: head, tailCats: tail };
  }, [cats]);

  // addresses live
  useEffect(() => {
    if (!user) return;
    const addrCol = collection(db, "users", user.uid, "addresses");
    const unsubA = onSnapshot(query(addrCol, orderBy("createdAt", "asc")), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAddresses(rows);
    });
    const unsubU = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setDefaultAddrId(snap.data()?.defaultAddressId || null);
    });
    return () => { unsubA(); unsubU(); };
  }, [user]);

  // carousel
  const count = Math.max(1, (slides && slides.length) ? slides.length : 0);
  useEffect(() => {
    if (!autoplay || !count) return;
    const ms = Math.max(1, Number(brand.autoplaySec || 5)) * 1000;
    const id = setInterval(() => setIdx((i) => (i + 1) % count), ms);
    return () => clearInterval(id);
  }, [autoplay, count, brand.autoplaySec]);
  const go = (n) => setIdx((i) => (i + n + count) % count);

  const goToLogin = () => nav("/login", { state: { from: loc } });
  const handleUserClick = () => { if (!user) { goToLogin(); return; } if (isMobile) setAccountOpen(true); else setAccountDesktopOpen(true); };

  const doLogout = async () => {
    try {
      if (typeof userCtx.logout === "function") await userCtx.logout();
      else await signOut(getAuth());
    } finally {
      setAccountDesktopOpen(false);
      nav("/");
    }
  };

  const openCats = () => setCatsOpen(true);
  const handleCartClick = () => { if (cart && cart.totalQty > 0) { cart.openCart?.(); return; } openCats(); };
  const onPickCategory = (cat) => { setCatsOpen(false); nav(`/category/${cat.slug || cat.id}`); };

  /* =========================
     🔍 Search (desktop + mobile)
  ========================== */
  const [qText, setQText] = useState("");
  const [autoOpen, setAutoOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [selIndex, setSelIndex] = useState(-1);

  const doSearch = async (text) => {
    const q = (text || "").trim().toLowerCase();
    setSelIndex(-1);
    if (!q) { setResults([]); return; }

    try {
      const ref = collection(db, "products");
      const qy = query(
        ref,
        where("active", "==", true),
        orderBy("nameLower"),
        startAt(q),
        endAt(q + "\uf8ff"),
        qLimit(10)
      );
      const snap = await getDocs(qy);
      const rows = snap.docs.map(d => {
        const x = d.data() || {};
        return {
          id: d.id,
          name: x.name || x.title || "Product",
          nameLower: (x.nameLower || (x.name || "")).toString().toLowerCase(),
          price: x.price,
          imageUrl: x.imageUrl || x.thumbnailUrl,
          categorySlug: x.categorySlug || (x.category && slugify(x.category)),
        };
      });
      setResults(rows);
      return;
    } catch { /* fallback below */ }

    const ref = collection(db, "products");
    const snap = await getDocs(query(ref, where("active", "==", true), orderBy("createdAt", "desc"), qLimit(60)));
    const rows = snap.docs
      .map(d => ({ id: d.id, ...(d.data() || {}) }))
      .map(x => ({
        id: x.id,
        name: x.name || x.title || "Product",
        nameLower: (x.name || "").toString().toLowerCase(),
        price: x.price,
        imageUrl: x.imageUrl || x.thumbnailUrl,
        categorySlug: x.categorySlug || (x.category && slugify(x.category)),
      }))
      .filter(p => p.nameLower.includes(q))
      .slice(0, 10);
    setResults(rows);
  };
  const debouncedSearch = useRef(debounce(doSearch, 220)).current;

  const goToSearchPage = (term) => {
    const text = (term ?? qText).trim();
    if (!text) return;
    nav(`/search?q=${encodeURIComponent(text)}`);
    setAutoOpen(false);
    setMobileSearchOpen(false);
  };
  const onSelectResult = (r) => {
    nav(`/search?q=${encodeURIComponent(r?.name || qText)}`);
    setAutoOpen(false);
    setMobileSearchOpen(false);
  };

  // desktop static links
  const staticLinks = useMemo(() => ([
    { type: "link", label: "About", to: "/about" },
    { type: "link", label: "Blog", to: "/blog" },
    { type: "link", label: "Gallery", to: "/gallery" },
    { type: "link", label: "Login", to: "/login" },
  ]), []);

  /* =========================
     📍 Live Location (no key required)
  ========================== */
  const [liveLoc, setLiveLoc] = useState({ lat: null, lng: null, city: "", pincode: "", formatted: "", fromGPS: false });
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  async function reverseGeocodeOSM(lat, lng) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      ).then(res => res.json());
      return {
        formatted: r.display_name || "",
        city: r.address?.city || r.address?.town || r.address?.village || "",
        pincode: r.address?.postcode || ""
      };
    } catch {
      return { formatted: "", city: "", pincode: "" };
    }
  }

  async function getLiveLocation({ alsoPrefillForm = false } = {}) {
    if (!navigator.geolocation) { setLocError("Location not supported on this device."); return; }
    setLocLoading(true); setLocError("");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = Number(pos.coords.latitude?.toFixed(6));
      const lng = Number(pos.coords.longitude?.toFixed(6));
      const { formatted, city, pincode } = await reverseGeocodeOSM(lat, lng);
      setLiveLoc({ lat, lng, formatted, city, pincode, fromGPS: true });
      setLocLoading(false);

      if (alsoPrefillForm) {
        setAddrFormOpen(true);
        setTimeout(() => {
          try {
            const form = document.querySelector('[data-addr-form="1"]');
            if (!form) return;
            const [name, phone, line1, , , cityInput, pin] = form.querySelectorAll("input");
            if (formatted) line1.value = formatted.split(",").slice(0, 2).join(", ").trim();
            if (city && cityInput) cityInput.value = city;
            if (pincode && pin) pin.value = pincode;
          } catch { }
        }, 0);
      }
    }, (err) => {
      setLocLoading(false);
      setLocError(err?.message || "Could not fetch location.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }

  async function saveQuickAddressFromGPS() {
    if (!user || !liveLoc.lat || !liveLoc.lng) return;
    const colRef = collection(db, "users", user.uid, "addresses");
    const docRef = await addDoc(colRef, {
      name: user.displayName || "Current Location",
      phone: "",
      line1: liveLoc.formatted?.split(",").slice(0, 2).join(", ").trim() || "",
      line2: "",
      landmark: "",
      city: liveLoc.city || "",
      pincode: liveLoc.pincode || "",
      tag: "GPS",
      createdAt: serverTimestamp(),
      formattedAddress: liveLoc.formatted || "",
      geo: new GeoPoint(liveLoc.lat, liveLoc.lng),
      fromGPS: true
    });
    if (addresses.length === 0) {
      await setDoc(doc(db, "users", user.uid), { defaultAddressId: docRef.id, updatedAt: serverTimestamp() }, { merge: true });
    }
  }

  return (
    <Viewport>
      <GlobalFont />

      {/* Mobile search sheet */}
      <MobileSearchSheet $open={mobileSearchOpen}>
        <MobileSearchBar>
          <input
            autoFocus
            placeholder="Search products"
            value={qText}
            onChange={(e) => { setQText(e.target.value); debouncedSearch(e.target.value); }}
            onFocus={() => setAutoOpen(true)}
            onKeyDown={(e) => {
              if (!autoOpen || results.length === 0) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setSelIndex(i => (i + 1) % results.length); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setSelIndex(i => (i - 1 + results.length) % results.length); }
              else if (e.key === "Enter") { e.preventDefault(); if (selIndex >= 0) onSelectResult(results[selIndex]); else goToSearchPage(); }
            }}
          />
          <Primary onClick={() => goToSearchPage()}>Go</Primary>
          <PillBtn onClick={() => setMobileSearchOpen(false)}><FiX /> Close</PillBtn>
        </MobileSearchBar>
        {autoOpen && results.length > 0 && (
          <div style={{ maxWidth: TOK.maxW, margin: "6px auto 10px", padding: "0 12px 12px" }}>
            <AutoWrap style={{ position: "relative", top: 0, left: 0, right: 0 }}>
              {results.map((r, i) => (
                <AutoItem
                  key={r.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectResult(r)}
                  style={{ background: i === selIndex ? TOK.pill : "transparent" }}
                >
                  <Thumb src={r.imageUrl || landing1} alt="" />
                  <div>
                    <div style={{ fontWeight: 800 }}>{r.name}</div>
                    {r.price != null && <div style={{ fontSize: 12, color: TOK.subtext }}>₹ {Number(r.price).toLocaleString("en-IN")}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: TOK.subtext }}>{r.categorySlug || ""}</div>
                </AutoItem>
              ))}
              <DropBtn onClick={() => goToSearchPage()}>See more results for “{qText}”</DropBtn>
            </AutoWrap>
          </div>
        )}
      </MobileSearchSheet>

      <Header>
        <TopStrip>
          <TopInner>
            {/* Left: Brand */}
            <BrandCapsule onClick={() => nav("/")}>
              <BrandDot>{(brand?.initials || "PFB").slice(0, 3)}</BrandDot>
              <BrandWordmark>{brand?.name || "Prakruti Farms Bharat"}</BrandWordmark>
            </BrandCapsule>

            {/* Center spacer (kept minimal for Account vibe) */}
            <div />

            {/* Right: utility chips */}
            <TopActions>
              {/* 🔗 Social icons (from Firestore) */}
              {socialLinks.instagramUrl && (
                <SocialCircle
                  href={socialLinks.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <FiInstagram />
                </SocialCircle>
              )}

              {socialLinks.youtubeUrl && (
                <SocialCircle
                  href={socialLinks.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  title="YouTube"
                >
                  <FiYoutube />
                </SocialCircle>
              )}

              <Sep />
              <ActionBtn onClick={() => nav("/offers")} title="View offers">
                <FiChevronDown /> <span>Offers</span>
              </ActionBtn>
            </TopActions>

          </TopInner>
        </TopStrip>

        <Bar>
          {/* Center: Desktop / Tablet menu */}
          <Nav aria-label="Primary">
            <NavList>
              {headCats.map(c => (
                <NavItem key={c.slug}>
                  <a
                    href={`/category/${c.slug}`}
                    onClick={(e) => { e.preventDefault(); nav(`/category/${c.slug}`); }}
                  >
                    <span>{c.name}</span>
                  </a>
                </NavItem>
              ))}
              {tailCats.length > 0 && (
                <NavItem ref={moreRef}>
                  <MoreWrap>
                    <button
                      aria-haspopup="menu"
                      aria-expanded={moreOpen}
                      onClick={() => setMoreOpen(v => !v)}
                      onMouseEnter={() => setMoreOpen(true)}
                    >
                      More <FiChevronDown />
                    </button>
                    <Dropdown $open={moreOpen} role="menu" onMouseLeave={() => setMoreOpen(false)}>
                      {tailCats.map(c => (
                        <DropBtn
                          key={c.slug}
                          role="menuitem"
                          onClick={() => { setMoreOpen(false); nav(`/category/${c.slug}`); }}
                        >
                          {c.name}
                        </DropBtn>
                      ))}
                      {staticLinks.map(m => (
                        <NavItem key={m.label}>
                          <a href={m.to} onClick={(e) => { e.preventDefault(); nav(m.to); }}>
                            <span>{m.label}</span>
                          </a>
                        </NavItem>
                      ))}
                    </Dropdown>
                  </MoreWrap>
                </NavItem>
              )}
            </NavList>
          </Nav>

          <Right>
            {/* Mobile menu icon */}
            <MobileOnly>
              <IconBtn aria-label="Open menu" onClick={() => setDrawerOpen(true)}><FiMenu /></IconBtn>
            </MobileOnly>

            {/* Location chip + modal trigger */}
            <div ref={locRef} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <DeliverToLabel
                title={liveLoc.formatted || (liveLoc.lat && liveLoc.lng ? `${liveLoc.lat}, ${liveLoc.lng}` : "Set delivery location")}
                onClick={(e) => { e.stopPropagation(); setLocPopoverOpen(v => !v); }}
              >
                {liveLoc.formatted || (liveLoc.lat && liveLoc.lng)
                  ? <>Deliver to: {liveLoc.city || liveLoc.formatted}{liveLoc.pincode ? ` — ${liveLoc.pincode}` : ""}</>
                  : "Live location"}
              </DeliverToLabel>
              <IconBtn
                aria-label="Location"
                title="live location"
                onClick={(e) => { e.stopPropagation(); setLocPopoverOpen(v => !v); }}
              >
                <FiMapPin />
              </IconBtn>
            </div>

            {/* Desktop search */}
            <DesktopSearch>
              <SearchWrap>
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search products"
                  value={qText}
                  onChange={(e) => { setQText(e.target.value); debouncedSearch(e.target.value); }}
                  onFocus={() => setAutoOpen(true)}
                  onBlur={() => setTimeout(() => setAutoOpen(false), 150)}
                  onKeyDown={(e) => {
                    if (!autoOpen || results.length === 0) return;
                    if (e.key === "ArrowDown") { e.preventDefault(); setSelIndex(i => (i + 1) % results.length); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setSelIndex(i => (i - 1 + results.length) % results.length); }
                    else if (e.key === "Enter") { e.preventDefault(); if (selIndex >= 0) onSelectResult(results[selIndex]); else goToSearchPage(); }
                  }}
                />
                {autoOpen && results.length > 0 && (
                  <AutoWrap>
                    {results.map((r, i) => (
                      <AutoItem
                        key={r.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onSelectResult(r)}
                        style={{ background: i === selIndex ? TOK.pill : "transparent" }}
                      >
                        <Thumb src={r.imageUrl || landing1} alt="" />
                        <div>
                          <div style={{ fontWeight: 800 }}>{r.name}</div>
                          {r.price != null && <div style={{ fontSize: 12, color: TOK.subtext }}>₹ {Number(r.price).toLocaleString("en-IN")}</div>}
                        </div>
                        <div style={{ fontSize: 12, color: TOK.subtext }}>{r.categorySlug || ""}</div>
                      </AutoItem>
                    ))}
                    <DropBtn onClick={() => goToSearchPage()}>See more results for “{qText}”</DropBtn>
                  </AutoWrap>
                )}
              </SearchWrap>
            </DesktopSearch>

            {/* Mobile search icon */}
            <MobileOnly>
              <IconBtn aria-label="Open search" onClick={() => { setMobileSearchOpen(true); setTimeout(() => setAutoOpen(true), 50); }}>
                <FiSearch />
              </IconBtn>
            </MobileOnly>

            {/* Account & Cart */}
            <IconBtn aria-label="Account / Profile" onClick={handleUserClick}><FiUser /></IconBtn>
            <CartWrap onClick={handleCartClick}>
              <IconBtn aria-label="Cart"><FiShoppingBag /></IconBtn>
              <CartBadge>{cart?.totalQty ?? 0}</CartBadge>
            </CartWrap>
          </Right>
        </Bar>
      </Header>

      {/* Mobile Drawer */}
      <Drawer $open={drawerOpen} aria-hidden={!drawerOpen}>
        <DrawerHead>
          <BrandText>Menu</BrandText>
          <IconBtn
            aria-label="Close menu"
            onClick={() => {
              setDrawerOpen(false);
              setMobileVisibleCount(5);
            }}
          >
            <FiX />
          </IconBtn>

        </DrawerHead>
        <DrawerBody>
          {/* Categories: show 5 at a time, then progressively more */}
          {cats.slice(0, mobileVisibleCount).map(c => (
            <DrawerLink
              key={c.slug}
              onClick={() => {
                setDrawerOpen(false);
                setMobileVisibleCount(5);
                nav(`/category/${c.slug}`);
              }}
            >
              {c.name}
            </DrawerLink>
          ))}

          {cats.length > 5 && (
            <DrawerToggle
              onClick={() => {
                if (mobileVisibleCount >= cats.length) {
                  // reset back to first 5
                  setMobileVisibleCount(5);
                } else {
                  // show 5 more
                  setMobileVisibleCount(v => Math.min(cats.length, v + 5));
                }
              }}
            >
              {mobileVisibleCount >= cats.length
                ? "Show fewer categories"
                : `Show more categories (+${Math.max(0, cats.length - mobileVisibleCount)})`}
            </DrawerToggle>
          )}

          {/* Static pages with icons */}
          {[
            { label: "About", to: "/about", icon: <FiInfo /> },
            { label: "Login", to: "/login", icon: <FiLogIn /> },
          ].map(it => (
            <DrawerLink
              key={it.label}
              onClick={() => {
                setDrawerOpen(false);
                setMobileVisibleCount(5);
                nav(it.to);
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {it.icon}
                {it.label}
              </span>
            </DrawerLink>
          ))}
        </DrawerBody>

      </Drawer>

      {/* Hero Carousel */}
      <Hero>
        <Track $index={idx} $count={count} role="listbox" aria-label="Promotions">
          {(slides && slides.length ? slides : [
            { imageUrl: landing1, alt: "Rooted in tradition – crafted with care" },
            { imageUrl: landing2, alt: "Raw, real, unprocessed and unheated" },
            { imageUrl: landing3, alt: "Sustainable choices, better living" },
            { imageUrl: landing4, alt: "Great choices, Sustainable living" },
          ]).map((s, i) => (
            <Slide key={i} $count={count} role="option" aria-selected={i === idx}>
              <img src={s.imageUrl || s.src} alt={s.alt || ""} />
            </Slide>
          ))}
        </Track>

        {count > 1 && (
          <>
            <ArrowLeft aria-label="Previous slide" onClick={() => go(-1)}><FiChevronLeft /></ArrowLeft>
            <ArrowRight aria-label="Next slide" onClick={() => go(+1)}><FiChevronRight /></ArrowRight>
            <Dots>
              {Array.from({ length: count }).map((_, i) => (
                <Dot key={i} $active={i === idx} aria-label={`Go to slide ${i + 1}`} onClick={() => setIdx(i)} />
              ))}
            </Dots>
            <FloatingControls>
              <IconBtn aria-label={autoplay ? "Pause autoplay" : "Play autoplay"} onClick={() => setAutoplay(a => !a)} title={autoplay ? "Pause" : "Play"}>
                {autoplay ? <FiPause /> : <FiPlay />}
              </IconBtn>
            </FloatingControls>
          </>
        )}
      </Hero>

      {/* ===== Categories Sheet (mobile) ===== */}
      {isMobile && (
        <>
          <Sheet
            $open={catsOpen}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-hidden={!catsOpen}
          >
            <SheetHead>
              <SheetTitle>Browse Categories</SheetTitle>
              <IconBtn aria-label="Close" onClick={() => setCatsOpen(false)}><FiX /></IconBtn>
            </SheetHead>
            <div style={{ padding: 12 }}>
              <ProductCategories1 onSelect={onPickCategory} />
            </div>
          </Sheet>
          <SheetBackdrop $open={catsOpen} onClick={closeCats} />
        </>
      )}

      {/* ===== Account / Profile Sheet (mobile) ===== */}
      <SheetBackdrop $open={accountOpen} onClick={() => setAccountOpen(false)} />
      {isMobile && (
        <Sheet
          $open={accountOpen}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-hidden={!accountOpen}
        >
          <SheetHead>
            <SheetTitle>Your Profile</SheetTitle>
            <IconBtn aria-label="Close" onClick={() => setAccountOpen(false)}><FiX /></IconBtn>
          </SheetHead>

          <Section>
            {user ? (
              <>
                <RowSpace>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar>{initialsFrom(user)}</Avatar>
                    <div>
                      <ProfileName>{user.displayName || "Customer"}</ProfileName>
                      <ProfileEmail>{user.email}</ProfileEmail>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <PillBtn onClick={() => nav("/my-orders")}>My Orders</PillBtn>
                    <PillBtn onClick={() => getLiveLocation({ alsoPrefillForm: true })}>
                      <FiMapPin /> Use current location
                    </PillBtn>
                  </div>
                </RowSpace>
                {locError && <Inline style={{ color: TOK.red }}>{locError}</Inline>}
              </>
            ) : (
              <RowSpace>
                <div>You're not logged in.</div>
                <Primary onClick={() => nav("/login", { state: { from: loc } })}>Login</Primary>
              </RowSpace>
            )}
          </Section>

          {/* Delivery addresses */}
          <Section>
            <RowSpace>
              <SectionTitle>Delivery Addresses</SectionTitle>
              <Primary onClick={() => setAddrFormOpen(true)}><FiMapPin /> Add New</Primary>
            </RowSpace>
            <AddrList>
              {addresses.length === 0 ? (
                <Inline>No saved addresses yet. Add one to speed up checkout.</Inline>
              ) : (
                addresses.map(a => (
                  <Card key={a.id}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <AddressName>{a.name}</AddressName>
                        <Badge>{a.tag || "Other"}</Badge>
                        {defaultAddrId === a.id && <Badge>Default</Badge>}
                      </div>
                      <Inline style={{ marginTop: 4 }}>{a.phone}</Inline>
                      <AddressLine>
                        {(a.formattedAddress || `${a.line1}${a.line2 ? `, ${a.line2}` : ""}`) || ""}
                        {a.landmark ? `, ${a.landmark}` : ""}{(a.city || a.pincode) ? `, ${a.city} - ${a.pincode}` : ""}
                      </AddressLine>
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {defaultAddrId !== a.id && (
                        <PillBtn onClick={() => {
                          const batch = writeBatch(db);
                          batch.set(doc(db, "users", user.uid), { defaultAddressId: a.id, updatedAt: serverTimestamp() }, { merge: true });
                          addresses.forEach(z => {
                            batch.set(doc(db, "users", user.uid, "addresses", z.id), { isDefault: z.id === a.id }, { merge: true });
                          });
                          batch.commit();
                          setDefaultAddrId(a.id);
                        }}>Set Default</PillBtn>
                      )}
                      <Danger onClick={async () => {
                        await deleteDoc(doc(db, "users", user.uid, "addresses", a.id));
                        if (defaultAddrId === a.id) {
                          const newDefault = addresses.find(r => r.id !== a.id)?.id || null;
                          await setDoc(doc(db, "users", user.uid), { defaultAddressId: newDefault, updatedAt: serverTimestamp() }, { merge: true });
                        }
                      }}><FiX /> Remove</Danger>
                    </div>
                  </Card>
                ))
              )}
            </AddrList>
          </Section>
        </Sheet>
      )}

      {/* Address form */}
      <SheetBackdrop $open={addrFormOpen} onClick={() => setAddrFormOpen(false)} />
      {isMobile && (
        <Sheet
          $open={addrFormOpen}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-hidden={!addrFormOpen}
        >
          <SheetHead>
            <SheetTitle>Add Delivery Address</SheetTitle>
            <IconBtn aria-label="Close" onClick={() => setAddrFormOpen(false)}><FiX /></IconBtn>
          </SheetHead>

          <Section>
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <PillBtn onClick={() => getLiveLocation({ alsoPrefillForm: true })}>
                <FiMapPin /> Use current location
              </PillBtn>
              {liveLoc.formatted && (
                <span style={{ fontSize: 12, color: TOK.subtext }}>
                  {liveLoc.formatted}
                </span>
              )}
            </div>

            <Form data-addr-form="1" onSubmit={async (e) => {
              e.preventDefault();
              if (!user) return;
              const form = e.target;
              const payload = {
                name: form[0].value.trim(),
                phone: form[1].value.trim(),
                line1: form[2].value.trim(),
                line2: form[3].value.trim(),
                landmark: form[4].value.trim(),
                city: form[5].value.trim() || liveLoc.city || "",
                pincode: form[6].value.trim() || liveLoc.pincode || "",
                tag: "Home",
                createdAt: serverTimestamp(),
                formattedAddress: liveLoc.formatted || "",
                geo: (liveLoc.lat && liveLoc.lng) ? new GeoPoint(liveLoc.lat, liveLoc.lng) : null,
                fromGPS: !!liveLoc.fromGPS
              };
              if (!payload.name || !payload.phone || !payload.line1 || !payload.city || !payload.pincode) return;
              const colRef = collection(db, "users", user.uid, "addresses");
              const docRef = await addDoc(colRef, payload);
              if (addresses.length === 0) {
                await setDoc(doc(db, "users", user.uid), { defaultAddressId: docRef.id, updatedAt: serverTimestamp() }, { merge: true });
              }
              setAddrFormOpen(false);
            }}>
              <Two>
                <Input placeholder="Full name" />
                <Input placeholder="Phone number" />
              </Two>
              <Input placeholder="House / Flat / Street (Line 1)" />
              <Input placeholder="Area / Locality (Line 2) — optional" />
              <Input placeholder="Landmark — optional" />
              <Two>
                <Input placeholder="City" />
                <Input placeholder="Pincode" inputMode="numeric" />
              </Two>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <Primary type="submit">Save Address</Primary>
                <PillBtn type="button" onClick={() => setAddrFormOpen(false)}>Cancel</PillBtn>
              </div>
            </Form>
          </Section>
        </Sheet>
      )}

      {/* Desktop account drawer (desktop only) */}
      <DesktopOnly>
        <DeskDrawerBackdrop
          $open={accountDesktopOpen}
          onClick={() => setAccountDesktopOpen(false)}
          aria-hidden={!accountDesktopOpen}
        />
        <DeskDrawer $open={accountDesktopOpen} aria-hidden={!accountDesktopOpen} role="dialog" aria-modal="true">
          <DeskHead>
            <BrandText>Your Account</BrandText>
            <IconBtn aria-label="Close" onClick={() => setAccountDesktopOpen(false)}><FiX /></IconBtn>
          </DeskHead>
          <DeskBody>
            {user && (
              <>
                <DeskRow>
                  <DeskAvatar>{initialsFrom(user)}</DeskAvatar>
                  <div>
                    <DeskName>{user.displayName || "Customer"}</DeskName>
                    <DeskEmail>{user.email}</DeskEmail>
                  </div>
                </DeskRow>

                <DeskAction onClick={() => { setAccountDesktopOpen(false); nav("/my-orders"); }}>
                  My Orders
                </DeskAction>
                <DeskAction onClick={() => { setAccountDesktopOpen(false); nav("/profile"); }}>
                  Profile & Addresses
                </DeskAction>

                <DeskPrimary onClick={doLogout}>Logout</DeskPrimary>
              </>
            )}
          </DeskBody>
        </DeskDrawer>
      </DesktopOnly>

      {/* Location modal (shared) */}
      <LocModalBackdrop $open={locPopoverOpen} onClick={() => setLocPopoverOpen(false)} />
      {locPopoverOpen && (
        <LocModal onClick={(e) => e.stopPropagation()}>
          <LocCard $open={locPopoverOpen} role="dialog" aria-modal="true" aria-label="Delivery location">
            <LocCardHead>
              <LocLogo>{(brand?.initials || "PFB").slice(0, 3)}</LocLogo>
              <LocHeadTitle>Set Delivery Location</LocHeadTitle>
              <div style={{ marginLeft: "auto" }}>
                <IconBtn aria-label="Close" onClick={() => setLocPopoverOpen(false)}><FiX /></IconBtn>
              </div>
            </LocCardHead>

            <LocCardBody>
              {locLoading ? (
                <LocLine>Locating…</LocLine>
              ) : (liveLoc.formatted || (liveLoc.lat && liveLoc.lng)) ? (
                <>
                  <LocTitle>Current selection</LocTitle>
                  <LocLine>
                    <strong>{liveLoc.city || liveLoc.formatted}</strong>
                    {liveLoc.pincode ? ` — ${liveLoc.pincode}` : ""}
                  </LocLine>

                  <LocActions>
                    <PillBtn onClick={() => getLiveLocation({ alsoPrefillForm: false })}>Refresh location</PillBtn>

                    {user ? (
                      <Primary onClick={async () => { await saveQuickAddressFromGPS(); setLocPopoverOpen(false); }}>
                        Save as default
                      </Primary>
                    ) : (
                      <PillBtn onClick={() => { setLocPopoverOpen(false); nav("/login", { state: { from: loc } }); }}>
                        Login to save
                      </PillBtn>
                    )}

                    <PillBtn onClick={() => { setLocPopoverOpen(false); setAddrFormOpen(true); }}>
                      Enter address manually
                    </PillBtn>
                  </LocActions>
                </>
              ) : (
                <>
                  {locError && <LocLine style={{ color: TOK.red }}>{locError}</LocLine>}
                  <LocTitle>Choose how to set your location</LocTitle>
                  <LocActions>
                    <Primary onClick={() => getLiveLocation({ alsoPrefillForm: true })}>Use current location</Primary>
                    <PillBtn onClick={() => { setLocPopoverOpen(false); setAddrFormOpen(true); }}>Enter address manually</PillBtn>
                  </LocActions>
                  <LocLine>We’ll prefill your address form or save it if you’re logged in.</LocLine>
                </>
              )}
            </LocCardBody>
          </LocCard>
        </LocModal>
      )}
    </Viewport>
  );
}

/* ===== Additional styled (Account page parity) ===== */
const DesktopOnly = styled.div`display:none; @media (min-width:920px){ display:block; }`;

const DeliverToLabel = styled.button`
  display:inline-flex; align-items:center; gap:6px; max-width:52vw;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  border:1px solid ${TOK.border}; background:${TOK.pill}; border-radius:999px;
  padding:6px 10px; font-weight:800; font-size:12px; color:${TOK.text};
  @media (max-width:420px){ max-width:34vw; }
  @media (max-width:360px){ display:none; }
`;

const LocActions = styled.div` display:flex; gap:8px; flex-wrap:wrap; `;
const LocTitle = styled.div` font-weight:900; color:${TOK.text}; margin-bottom:6px; font-size:14px; `;
const LocLine = styled.div` font-size:12px; color:${TOK.subtext}; margin:6px 0 10px; word-break:break-word; `;

const SheetBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: ${({ $open }) => ($open ? "block" : "none")};
  z-index: 90;
`;
const Sheet = styled.div`
  position: fixed; inset: auto 0 0 0; margin: 0 auto; max-width: ${TOK.maxW}; background: #fff;
  border-radius: var(--tok-radius) var(--tok-radius) 0 0; border: 1px solid ${TOK.border};
  transform: translateY(${({ $open }) => ($open ? "0" : "100%")});
  transition: transform .25s ease; z-index: 91;
  max-height: 92vh; overflow: auto;
  @media (min-width: 920px){
    inset: 8% 0 auto 0; max-width: 720px; border-radius: var(--tok-radius);
  }
`;
const SheetHead = styled.div`
  position: sticky; top: 0; background: ${TOK.bgGlass}; backdrop-filter: blur(8px);
  z-index: 1; display:flex; align-items:center; justify-content:space-between;
  padding: 12px 14px; border-bottom: 1px solid ${TOK.border};
  h3{ margin:0; font-size:16px; }
`;

const SheetTitle = styled.h3` margin: 0; color: ${TOK.text}; font-weight: 900; letter-spacing: .2px; font-size: clamp(18px, 4.2vw, 20px);`;
const SectionTitle = styled.h4` margin: 4px 0; color: ${TOK.text}; font-weight: 900; letter-spacing: .2px; font-size: clamp(16px, 4vw, 18px);`;
const ProfileName = styled.div` font-weight: 900; color: ${TOK.text}; letter-spacing: .2px; font-size: clamp(15px, 4vw, 18px);`;
const ProfileEmail = styled.div` color: ${TOK.subtext}; font-weight: 600; letter-spacing: .2px; font-size: clamp(12px, 3.4vw, 13px);`;

const AddrList = styled.div`display:grid; gap:10px;`;
const Card = styled.div`
  border:1px solid ${TOK.border}; border-radius:var(--tok-radius); padding:10px; background:#fff;
  display:grid; grid-template-columns: 1fr auto; gap:8px; align-items:center;
`;
const Badge = styled.span`
  background:${TOK.pill}; color:${TOK.text}; border-radius: 999px; padding:2px 8px; font-size:12px; font-weight:800;
`;
const Danger = styled.button`
  border:1px solid ${TOK.border}; background:#fff; color:${TOK.red}; border-radius:10px; padding:8px 10px; cursor:pointer;
`;
const Inline = styled.div` color:${TOK.subtext}; font-size:12px; `;
const AddressName = styled.div` font-weight: 900; color: ${TOK.text}; letter-spacing: .2px; font-size: clamp(14px, 3.8vw, 16px);`;
const AddressLine = styled.div` margin-top: 6px; color: ${TOK.text}; font-weight: 700; line-height: 1.55; font-size: clamp(13px, 3.6vw, 14px);`;

const Form = styled.form` display:grid; gap:10px; `;
const Two = styled.div`
  display:grid; gap:10px; grid-template-columns: 1fr 1fr;
  @media (max-width:560px){ grid-template-columns: 1fr; }
`;
const Input = styled.input`
  height:44px; border:1px solid ${TOK.border}; border-radius:12px; padding:0 12px; outline:0; font-size:14px;
`;

const Drawer = styled.aside`
  position: fixed;
  inset: 0 0 0 auto;
  width: min(82vw, 360px);
  background: #fff;
  transform: translateX(${p => (p.$open ? "0%" : "100%")});
  transition: transform 0.25s ease;
  box-shadow: ${shadowSm};
  z-index: 150; /* 👈 higher than Header (80), search sheet (95), and location modal (141) */
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
`;

const DrawerHead = styled.div`
  height:${TOK.headerH}; display:flex; align-items:center; justify-content:space-between;
  padding:0 14px; border-bottom:1px solid ${TOK.border};
`;
const BrandText = styled.div`
  font-weight: 900;
  letter-spacing: .4px;
  color: ${TOK.brand};
  font-size: 16px;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;

  @media (max-width: 980px) {
    max-width: calc(100vw - 180px);
  }
`;

const DrawerBody = styled.div`
  padding: 12px 14px 80px;  /* 👈 was 24px, now 80px */
  overflow: auto;
  max-width: 100%;
`;

const DrawerLink = styled.button`
  width:100%; text-align:left; display:flex; align-items:center; justify-content:space-between;
  padding:12px 10px; background:none; border:0; cursor:pointer; color:${TOK.link}; border-bottom:1px dashed ${TOK.border}; font-weight:800;
`;
const DrawerToggle = styled.button`
  margin-top:8px; width:100%; border:1px solid ${TOK.border}; background:#fff;
  padding:10px 12px; border-radius:10px; font-weight:800; cursor:pointer;
`;

/* Desktop Account Drawer bits */
const DeskDrawerBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.35);
  display: ${({ $open }) => ($open ? "block" : "none")};
  z-index: 98;
`;
const DeskDrawer = styled.aside`
  position: fixed; inset: 0 0 0 auto; width: 360px; max-width: 90vw;
  background: #fff; border-left: 1px solid ${TOK.border};
  transform: translateX(${p => p.$open ? "0%" : "100%"}); transition: transform .25s ease;
  box-shadow: ${shadowSm}; z-index: 99; display: flex; flex-direction: column;
  border-top-left-radius: var(--tok-radius);
  border-bottom-left-radius: var(--tok-radius);
`;
const DeskHead = styled.div`
  height: ${TOK.headerH}; display:flex; align-items:center; justify-content:space-between;
  padding: 0 14px; border-bottom: 1px solid ${TOK.border};
  background:${TOK.bgGlass}; backdrop-filter: blur(8px);
`;
const DeskBody = styled.div`padding: 14px; display: grid; gap: 12px; overflow: auto;`;
const DeskRow = styled.div`display:flex; align-items:center; gap: 10px;`;
const DeskAvatar = styled.div`
  width: 48px; height: 48px; border-radius: 999px; background: ${TOK.pill};
  color: ${TOK.text}; font-weight: 900; display: grid; place-items: center;
`;
const DeskName = styled.div`font-weight: 900; color: ${TOK.text};`;
const DeskEmail = styled.div`color: ${TOK.subtext}; font-weight: 600; font-size: 12px;`;
const DeskAction = styled.button`
  border: 1px solid ${TOK.border}; background: #fff; border-radius: 12px;
  padding: 10px 12px; font-weight: 900; cursor: pointer; width: 100%; text-align: left;
`;
const DeskPrimary = styled.button`
  border: 0; background: ${TOK.green}; color: #fff; border-radius: 12px;
  padding: 10px 12px; font-weight: 900; cursor: pointer; width: 100%;
`;
