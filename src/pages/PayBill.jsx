// src/pages/PayBill.jsx
import React, { useMemo, useState } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FiChevronLeft } from "react-icons/fi";

import qrImage from "../assets/govupi.jpg";

/* ===== Tokens (Same as MyAccountPage) ===== */
const TOK = {
  bg: "#ffffff",
  tint: "#fdece6",
  ink: "#2c3137",
  sub: "#707680",
  card: "#ffffff",
  line: "rgba(16,24,40,.10)",
  primary: "#5b7c3a",
  maxW: "680px",
};
const rise = keyframes`from{opacity:0; transform:translateY(6px)}to{opacity:1; transform:none}`;
const GlobalFont = createGlobalStyle`
  body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; }
`;

/* ===== Layout ===== */
const Page = styled.div`min-height:100dvh; background:${TOK.bg}; color:${TOK.ink};`;
const Header = styled.header`
  background:${TOK.tint}; border-bottom-left-radius:28px; border-bottom-right-radius:28px;
  padding:14px 16px 20px; margin-bottom:16px;
`;
const TopBar = styled.div`display:flex; align-items:center; justify-content:space-between;`;
const IconBtn = styled.button`
  border:0; background:transparent; padding:10px; border-radius:12px; cursor:pointer; color:${TOK.ink};
`;
const HeadTitle = styled.h1`
  margin:14px 0 0; font-size: clamp(22px, 4.5vw, 28px); font-weight:900;
`;

const Wrap = styled.div`
  max-width:${TOK.maxW}; margin:0 auto; padding: 0 14px 90px; display:grid; gap:18px;
`;
const Card = styled.div`
  background:${TOK.card}; border:1px solid ${TOK.line}; border-radius:18px;
  padding:16px; animation:${rise} .35s ease; display:grid; gap:12px;
`;

const Input = styled.input`
  height:46px; border:1px solid ${TOK.line}; border-radius:12px;
  padding:0 14px; font-size:15px; outline:none;
`;

const PrimaryBtn = styled.button`
  height:50px; border-radius:14px; border:0; background:${TOK.primary};
  color:#fff; font-weight:800; cursor:pointer; font-size:16px;
  &:disabled { opacity:.4; pointer-events:none; }
`;

const Li = styled.li`
  display:flex; justify-content:space-between; padding:8px 0;
  border-bottom:1px dashed #e5e7eb;
`;

const money = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

export default function PayBill() {
  const cart = useCart();
  const items = cart?.items || [];
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [upiId, setUpiId] = useState("");
  const [placing, setPlacing] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0), [items]);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  const checkout = async () => {
    if (!items.length) return alert("Your cart is empty.");
    if (!user) return nav("/login", { state: { from: loc, next: "/pay-bill" } });
    if (!upiId.trim()) return alert("Enter your UPI transaction ID.");

    try {
      setPlacing(true);
      await addDoc(collection(db, "orders"), {
        createdAt: serverTimestamp(),
        status: "NEW",
        customer: { uid: user.uid, email: user.email || "" },
        items: items.map(it => ({ ...it, price: Number(it.price || 0) })),
        pricing: { subtotal, gst, total },
        payment: { mode: "UPI", upiId: upiId.trim(), status: "PENDING_VERIFICATION", qrUsed: true },
        source: "public-paybill",
      });

      cart.clear();
      alert("Order submitted! We'll confirm payment and reach out.");
      nav("/my-orders");
    } catch (e) {
      console.error(e);
      alert("Could not submit. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Page>
      <GlobalFont />

      <Header>
        <TopBar>
          <IconBtn onClick={() => nav(-1)} aria-label="Back"><FiChevronLeft size={22} /></IconBtn>
          <div />
        </TopBar>
        <HeadTitle>Pay Bill</HeadTitle>
      </Header>

      <Wrap>
        {/* QR */}
        <Card style={{ textAlign: "center" }}>
          <img src={qrImage} alt="UPI QR" style={{ width: 220, height: 220, borderRadius: 8 }} />
          <div style={{ color: TOK.sub, fontSize: 13 }}>
            Scan with any UPI app & complete payment.
          </div>
        </Card>

        {/* Summary */}
        <Card>
          <strong>Order Summary</strong>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map(it => (
              <Li key={it.id}>
                <span>{it.title} × {it.qty}</span>
                <strong>{money(it.price * it.qty)}</strong>
              </Li>
            ))}
            <Li><span>Subtotal</span><strong>{money(subtotal)}</strong></Li>
            <Li><span>GST (5%)</span><strong>{money(gst)}</strong></Li>
            <Li style={{ borderTop: "1px dashed #ccc", paddingTop: 12 }}>
              <span>Total</span><strong>{money(total)}</strong>
            </Li>
          </ul>
        </Card>

        {/* UPI Input & Checkout */}
        <Card>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Enter your UPI Transaction ID</label>
          <Input
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            placeholder="e.g. BAJAPAY1234567"
          />
          <PrimaryBtn disabled={!items.length || placing} onClick={checkout}>
            {placing ? "Submitting…" : `Checkout • ${money(total)}`}
          </PrimaryBtn>
        </Card>
      </Wrap>
    </Page>
  );
}
