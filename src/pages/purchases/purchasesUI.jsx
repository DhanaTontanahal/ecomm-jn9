// src/pages/purchases/purchasesUI.js
import styled, { keyframes } from "styled-components";

export const C = {
    bg: "#0b1220", text: "#e7efff", sub: "#b7c6e6",
    glass: "rgba(255,255,255,.06)", glass2: "rgba(255,255,255,.10)",
    border: "rgba(255,255,255,.14)", ring: "#78c7ff", primary: "#4ea1ff", danger: "#ef4444"
};
export const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

export const Page = styled.div`min-height:100dvh;background:${C.bg};color:${C.text};padding:18px;`;
export const Head = styled.div`max-width:1280px;margin:0 auto 12px;display:flex;gap:12px;align-items:center;`;
export const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
`;
export const Select = styled.select`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px;
  color-scheme: dark; option{ background:#121a2b; color:${C.text}; }
`;
export const Btn = styled.button`
  background:${p => p.$danger ? C.danger : C.primary}; color:#fff; border:0; border-radius:10px; padding:10px 12px; display:inline-flex; gap:8px; align-items:center; cursor:pointer;
`;
export const Card = styled.div`max-width:1280px;margin:0 auto;background:${C.glass};border:1px solid ${C.border};border-radius:14px;animation:${fade} .25s both;`;
export const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th,td{ border-bottom:1px solid ${C.border}; padding:10px; vertical-align:top; }
  th{ text-align:left; color:${C.sub}; font-weight:600; }
`;
export const DrawerWrap = styled.div`position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:90;`;
export const Drawer = styled.div`
  width:min(980px,96vw); max-height:92vh; overflow:auto; border:1px solid ${C.border}; background:#0d1526; color:${C.text};
  border-radius:14px; display:grid; grid-template-rows:56px 1fr;
`;
export const DrawerHead = styled.div`display:flex; align-items:center; justify-content:space-between; padding:0 12px; border-bottom:1px solid ${C.border};`;
export const Grid2 = styled.div`display:grid; gap:10px; grid-template-columns: 1fr 1fr;`;
