// src/pages/purchases/_shared.js
import styled from "styled-components";
import { serverTimestamp } from "firebase/firestore";

export const C = {
    bg: "#0b1220", text: "#e7efff", sub: "#b7c6e6",
    glass: "rgba(255,255,255,.06)", glass2: "rgba(255,255,255,.10)",
    border: "rgba(255,255,255,.14)", ring: "#78c7ff", primary: "#4ea1ff",
    ok: "#10b981", danger: "#ef4444"
};

export const PageShell = styled.div`min-height:100dvh;background:${C.bg};color:${C.text};padding:18px;`;
export const Head = styled.div`max-width:1280px;margin:0 auto 12px;display:flex;gap:12px;align-items:center;`;
export const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
`;
export const Select = styled.select`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; } color-scheme:dark;
`;
export const Btn = styled.button`
  background:${p => p.$danger ? C.danger : C.primary}; color:#fff; border:0; border-radius:10px; padding:10px 12px; display:inline-flex; gap:8px; align-items:center; cursor:pointer;
`;
export const Card = styled.div`max-width:1280px;margin:0 auto;background:${C.glass};border:1px solid ${C.border};border-radius:14px;`;
export const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th,td{ border-bottom:1px solid ${C.border}; padding:10px; vertical-align:top; }
  th{ text-align:left; color:${C.sub}; font-weight:600; }
`;

export function nowTs() { return serverTimestamp(); }

export function money(n, cur = "₹") {
    return `${cur} ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// very small print-to-PDF (browser)
export function quickPdfPrint(title, payload) {
    const w = window.open("", "_blank"); if (!w) return;
    const html = `
  <html><head><title>${title}</title>
  <style>body{font-family:system-ui;padding:24px} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ccc;padding:6px}</style>
  </head>
  <body>
    <h2>${title}</h2>
    <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
    <script>window.print()</script>
  </body></html>`;
    w.document.write(html); w.document.close();
}

function escapeHtml(s) { return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) }

// Line items editor -----------------------------------------------------------
export function computeTotals(lines, taxPct = 0) {
    const subtotal = lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.rate || 0), 0);
    const tax = subtotal * (Number(taxPct || 0) / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
}
