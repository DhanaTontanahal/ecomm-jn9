// src/components/WhatsappChatFab.jsx
import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { FiMessageCircle, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { db } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";

/* tokens */
const TOK = {
  wa: "#25D366",
  waD: "#1ebe5d",
  dark: "#111827",
  on: "#fff",
  ring: "rgba(16,24,40,.12)",
  shadow: "0 14px 32px rgba(0,0,0,.20)",
};

/* anims */
const pop = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to   { opacity: 1; transform: none; }
`;
const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(37,211,102,.35); }
  70%  { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
  100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
`;

/* layout */
const Dock = styled.div`
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: calc(var(--bottom-nav-offset, 88px) + 12px + env(safe-area-inset-bottom));
  z-index: 12000;
  display: grid;
  gap: 10px;
  justify-items: end;
  animation: ${pop} .18s ease both;
  pointer-events: none; /* only children clickable */
`;

const Fab = styled.div`
  pointer-events: auto;
  width: 52px; height: 52px; border-radius: 999px;
  display: grid; place-items: center;
  border: 0;
  color: ${TOK.on};
  background: ${TOK.dark};
  outline: 1px solid ${TOK.ring};
  box-shadow: ${TOK.shadow};
  transition: transform .1s ease, background .12s ease, opacity .2s ease;

  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(1px); }

  ${({ $open }) =>
    !$open &&
    css`
      animation: ${pulse} 2.2s ease 1.2s 2;
    `}
`;

const WaBtn = styled.button`
  pointer-events: auto;
  width: 48px; height: 48px; border-radius: 999px;
  display: grid; place-items: center;
  border: 0;
  color: ${TOK.on};
  background: ${TOK.wa};
  outline: 1px solid ${TOK.ring};
  box-shadow: ${TOK.shadow};
  transition: transform .18s cubic-bezier(.22,.61,.36,1), opacity .18s;
  transform: ${({ $open }) => ($open ? "translateY(0) scale(1)" : "translateY(8px) scale(.96)")};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};

  &:hover { background: ${TOK.waD}; transform: translateY(-1px) scale(1.02); }
  &:active { transform: translateY(1px) scale(.98); }
`;

/* helpers */
const digits = (s) => String(s || "").replace(/\D/g, "");
const normalizePhoneForWaParam = (raw) => {
  // For the WhatsApp "phone=" param, accept 10-digit and convert to 91xxxxxxxxxx
  const d = digits(raw);
  if (!d) return "";
  return d.length === 10 ? `91${d}` : d;
};
const toE164 = (raw) => {
  const d = digits(raw);
  if (!d) return "";
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  return `+${d}`;
};

export default function WhatsappChatFab({
  /** Optional overrides; if omitted we use Firestore values */
  phone,                         // e.g. "+91 9876543210" or "9876543210"
  message,                       // e.g. "Hello! I’m interested…"
  bottomOffset,                  // e.g. 92
}) {
  const [open, setOpen] = useState(false);

  // Live Firestore config (site/whatsapp)
  const [cfg, setCfg] = useState({
    phone: "+91 9999999999",
    message: "Hi! Update this message and number in admin panel",
    bottomOffset: 92,
  });

  useEffect(() => {
    const ref = doc(db, "site", "whatsapp");
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data() || {};
      setCfg((prev) => ({
        phone: d.phone || prev.phone,
        message: d.message || prev.message,
        bottomOffset: typeof d.bottomOffset === "number" ? d.bottomOffset : prev.bottomOffset,
      }));
    });
    return () => unsub();
  }, []);

  // apply bottom offset (prop override wins)
  useEffect(() => {
    const off = bottomOffset ?? cfg.bottomOffset ?? 92;
    document.documentElement.style.setProperty("--bottom-nav-offset", `${off}px`);
  }, [bottomOffset, cfg.bottomOffset]);

  const launchWhatsApp = () => {
    const effectivePhone = phone ?? cfg.phone;
    const effectiveMsg = message ?? cfg.message;

    const waParam = normalizePhoneForWaParam(effectivePhone);
    if (!waParam) return;

    const text = encodeURIComponent(effectiveMsg || "");
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // App deep link param expects digits; web prefers wa.me/<digits>
    const appUrl = `whatsapp://send?phone=${waParam}&text=${text}`;
    const webUrl = `https://wa.me/${digits(toE164(effectivePhone))}?text=${text}`;

    if (isMobile) {
      window.location.href = appUrl;
      setTimeout(() => {
        window.location.href = webUrl; // fallback if app didn’t open
      }, 700);
    } else {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dock>
      <WaBtn
        type="button"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        onClick={launchWhatsApp}
        $open={open}
      >
        <FaWhatsapp size={22} />
      </WaBtn>

      <Fab
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open chat"}
        title={open ? "Close" : "Chat"}
        onClick={() => setOpen((v) => !v)}
        $open={open}
      >
        {open ? <FiX size={24} /> : <FiMessageCircle size={22} />}
      </Fab>
    </Dock>
  );
}
