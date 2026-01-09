// src/components/CartDrawer.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useCart } from "../cart/CartContext";
import { db } from "../firebase/firebase";
import {
  addDoc, collection, serverTimestamp, getDocs, query, where, orderBy, limit, doc
} from "firebase/firestore";
import { FiX, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCategories1 from "./landingpage/ProductCategories1";
import qrImage from "../assets/govupi.jpg";
import Lottie from "react-lottie-player";
import successAnim from "../assets/success.json";

/* ====== tokens ====== */
const TOK = {
  text: "#111827",
  sub: "#6b7280",
  border: "rgba(16,24,40,.10)",
  faint: "rgba(16,24,40,.06)",
  green: "#5b7c3a",
  greenD: "#48652f",
  red: "#ef4444",
  bg: "#ffffff",
};

/* ====== anims ====== */
const slideIn = keyframes`from{transform:translateX(100%)}to{transform:none}`;
const toastIn = keyframes`from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}`;
const pop = keyframes`from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}`;

/* ====== layout (unchanged styles) ====== */
const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.35);
  display: ${({ show }) => (show ? "block" : "none")};
  z-index: 1000;
`;
const Panel = styled.div`
  position: fixed; top: 0; right: 0; height: 100%; width: min(420px, 100vw);
  background: ${TOK.bg}; border-left: 1px solid ${TOK.border};
  z-index: 1010; display: grid;
  grid-template-rows: 56px minmax(38vh, 1fr) auto;
  overflow: hidden;
  transform: translateX(${({ show }) => (show ? "0" : "100%")});
  transition: transform .25s ease; animation: ${slideIn} .25s ease;
  @media (max-height: 700px){ grid-template-rows: 56px minmax(44vh, 1fr) auto; }
`;
const Head = styled.div`
  display:flex; align-items:center; justify-content:space-between; padding: 0 14px;
  border-bottom: 1px solid ${TOK.border};
  strong{ color:${TOK.text}; letter-spacing:.2px }
  button{ appearance:none; border:0; background:transparent; width:32px; height:32px; border-radius:10px; display:grid; place-items:center; cursor:pointer; }
  button:hover{ background:${TOK.faint}; }
`;
const List = styled.div`
  overflow: auto; padding: 10px 14px;
  min-height: 38vh;
  -webkit-overflow-scrolling: touch;
  @media (max-height: 700px){ min-height: 44vh; }
`;
const PayScroll = styled.div`max-height:44vh;overflow:auto;-webkit-overflow-scrolling:touch;padding-right:2px;`;
const Row = styled.div`display:grid;grid-template-columns:64px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px dashed ${TOK.faint};`;
const Img = styled.img`width:64px;height:64px;object-fit:contain;background:#f5f6f7;border-radius:10px;`;
const Title = styled.div`font-weight:800;color:${TOK.text};`;
const Sub = styled.div`font-size:12px;color:${TOK.sub};`;
const QtyWrap = styled.div`display:flex;gap:8px;align-items:center;`;
const QtyBtn = styled.button`width:28px;height:28px;border-radius:8px;border:1px solid ${TOK.border};background:#fff;cursor:pointer;`;
const RemoveBtn = styled.button`margin-left:auto;display:inline-flex;align-items:center;gap:6px;color:${TOK.red};background:none;border:none;cursor:pointer;`;
const Price = styled.div`font-weight:800;color:${TOK.text};`;
const Foot = styled.div`padding:12px 14px;border-top:1px solid ${TOK.border};display:grid;gap:10px;max-height:60vh;overflow:auto;-webkit-overflow-scrolling:touch;`;
const Tot = styled.div`display:flex;justify-content:space-between;padding:6px 0;span{color:${TOK.sub}} strong{color:${TOK.text}}`;
const Divider = styled.div`height:1px;background:${TOK.faint};margin:2px 0 4px;`;

const PayWrap = styled.div`display:grid;gap:8px;`;
const PayRow = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;@media (max-width:420px){grid-template-columns:1fr;}`;
const PayOption = styled.label`
  border:1px solid ${({ $active }) => $active ? TOK.green : TOK.border};
  background:#fff;color:${TOK.text};border-radius:12px;padding:10px 12px;cursor:pointer;
  display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:800;
  transition:border .15s ease, transform .05s ease; &:active{ transform: translateY(1px) }
  small{ color:${TOK.sub}; font-weight:600 } input{ display:none }
`;
const InputLabel = styled.label`font-size:13px;font-weight:800;color:${TOK.text};`;
const TextInput = styled.input`
  height:44px;padding:0 12px;border:1px solid ${({ $error }) => $error ? TOK.red : TOK.border};
  border-radius:10px;outline:none;font-size:14px;
`;
const Hint = styled.div`font-size:12px;color:${TOK.sub};`;
const ErrorText = styled.div`font-size:12px;color:${TOK.red};`;

const CTA = styled.button`
  width:100%;height:44px;border:none;border-radius:12px;background:${TOK.green};
  color:#fff;font-weight:900;cursor:pointer;transition:transform .05s ease,opacity .2s;
  &:active{ transform:translateY(1px) } &:disabled{ opacity:.6; cursor:not-allowed }
`;
const Secondary = styled.button`
  width:100%;height:44px;border:1px solid ${TOK.border};border-radius:12px;
  background:#fff;color:${TOK.text};font-weight:900;cursor:pointer;
`;
const StickyActions = styled.div`position:sticky;bottom:0;background:#fff;padding-top:8px;`;

const PopBackdrop = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.45);display:${({ $open }) => $open ? "block" : "none"};z-index:1020;`;
const PopSheet = styled.div`
  position:fixed;inset:auto 0 0 0;background:#fff;border-radius:14px 14px 0 0;border:1px solid ${TOK.border};
  transform:translateY(${({ $open }) => $open ? "0" : "100%"});transition:transform .25s ease;z-index:1030;max-height:92vh;overflow:auto;
  @media (min-width:920px){ inset:6% 0 auto 0; max-width:980px; margin:0 auto; border-radius:14px; }
`;
const PopHead = styled.div`position:sticky;top:0;background:#fff;padding:12px 14px;border-bottom:1px solid ${TOK.border};display:flex;align-items:center;justify-content:space-between;z-index:1;h3{margin:0;font-size:16px;}`;

const SuccessOverlay = styled.div`position:fixed;inset:0;background:rgba(17,24,39,.58);z-index:4000;display:${({ $open }) => $open ? 'grid' : 'none'};place-items:center;animation:${toastIn} .2s ease;`;
const SuccessCard = styled.div`width:min(420px,92vw);background:#fff;border-radius:16px;padding:18px 16px 16px;text-align:center;position:relative;animation:${pop} .25s ease;box-shadow:0 18px 36px rgba(0,0,0,.18);`;
const CloseX = styled.button`position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:10px;border:1px solid ${TOK.border};background:#fff;display:grid;place-items:center;cursor:pointer;&:hover{background:#f8fafc}`;
const SuccessTitle = styled.div`font-weight:900;color:${TOK.text};margin-top:6px;`;
const SuccessMsg = styled.div`color:${TOK.sub};font-size:13px;margin-top:4px;`;

/* ====== helpers ====== */
const money = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

/**
 * 🔹 NEW: Accept selectedAddress as prop
 * - expected shape (example):
 *   {
 *     id: string,
 *     label?: string,
 *     addressLine1?: string,
 *     addressLine2?: string,
 *     city?: string,
 *     pincode?: string,
 *     coords?: { lat: number, lng: number } | GeoPoint,
 *     landmark?: string
 *   }
 */
export default function CartDrawer({ selectedAddress }) {
  const cart = useCart();
  const { user } = useAuth?.() || { user: null };
  const nav = useNavigate();
  const loc = useLocation();

  const [preOrderId, setPreOrderId] = useState(null);
  const [preOrderForHash, setPreOrderForHash] = useState(""); // to know when cart changed


  const [placing, setPlacing] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  // const [paymentMode, setPaymentMode] = useState("UPI"); // "UPI" | "COD" | "GATEWAY"
  const [paymentMode, setPaymentMode] = useState("COD"); // default

  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");

  const [doneOpen, setDoneOpen] = useState(false);
  const [doneText, setDoneText] = useState("");

  // fetch one active cat for "shop products" fallback
  const [defaultCatSlug, setDefaultCatSlug] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const cSnap = await getDocs(
          query(
            collection(db, "productCategories"),
            where("active", "==", true),
            orderBy("order", "asc"),
            limit(1)
          )
        );
        if (!cSnap.empty) setDefaultCatSlug(cSnap.docs[0].data()?.slug || null);
      } catch { }
    })();
  }, []);

  // ESC closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") (catsOpen ? setCatsOpen(false) : cart.closeCart()); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catsOpen, cart.open]);

  /* ===== Load categories → GST map ===== */
  const [cats, setCats] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const s = await getDocs(
          query(collection(db, "productCategories"), where("active", "==", true))
        );
        setCats(s.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.warn("categories load failed", e); }
    })();
  }, []);
  const gstByCategoryId = useMemo(() => {
    const m = {};
    for (const c of cats) { m[c.id] = Number(c.gstRate ?? 0); }
    return m;
  }, [cats]);
  const gstBySlug = useMemo(() => {
    const m = {};
    for (const c of cats) { if (c.slug) m[c.slug] = Number(c.gstRate ?? 0); }
    return m;
  }, [cats]);

  /* ===== GST calculations (per category) ===== */
  const gstBreakdown = useMemo(() => {
    const acc = {};
    for (const it of cart.items) {
      const lineBase = Number(it.price || 0) * Number(it.qty || 0);
      const rate =
        (it.categoryId && Number.isFinite(gstByCategoryId[it.categoryId]) ? Number(gstByCategoryId[it.categoryId]) :
          (it.categorySlug && Number.isFinite(gstBySlug[it.categorySlug]) ? Number(gstBySlug[it.categorySlug]) : 0));
      const amt = Math.round(lineBase * (rate / 100));
      if (rate > 0) {
        acc[rate] = (acc[rate] || 0) + amt;
      }
    }
    return acc;
  }, [cart.items, gstByCategoryId, gstBySlug]);

  const gst = useMemo(
    () => Object.values(gstBreakdown).reduce((a, b) => a + b, 0),
    [gstBreakdown]
  );
  const total = useMemo(() => cart.subtotal + gst, [cart.subtotal, gst]);

  const showEmpty = cart.items.length === 0;
  const isDesktop = window.innerWidth >= 920;

  const openShop = () => setCatsOpen(true);
  const onPickCategory = (cat) => { setCatsOpen(false); cart.closeCart(); nav(`/category/${cat.slug || cat.id}`); };
  const loginToCheckout = () => { cart.closeCart(); nav("/login", { state: { from: loc } }); };

  /* ===== WhatsApp notify helpers (unchanged) ===== */
  const WA_ENDPOINT = "https://pfb-be-staging-1041275605700.us-central1.run.app/send";
  const PAYMENT_API_BASE = import.meta.env.VITE_PAYMENT_API_BASE || "https://pfb-be-staging-1041275605700.us-central1.run.app";
  // const PAYMENT_API_BASE = "http://localhost:8080"

  // 🔹 NEW: helper to sync order to Zoho (for COD / UPI flows)
  const syncOrderToZoho = async (orderId, orderData) => {
    try {
      const res = await fetch(`${PAYMENT_API_BASE}/zoho/sync-order`, {   // ⬅ change here

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          order: orderData,
        }),
      });

      if (!res.ok) {
        console.error("syncOrderToZoho HTTP error:", res.status);
        return;
      }

      // optional: inspect response
      const data = await res.json().catch(() => null);
      console.log("Zoho sync successful:", data);
    } catch (err) {
      console.error("syncOrderToZoho failed:", err);
    }
  }


  const toApiPhone = (p) => { const d = String(p || "").replace(/\D/g, ""); return d.length >= 10 ? d.slice(-10) : d; };
  const fetchAdminPhones = async () => {
    const cfgRef = doc(db, "settings", "notificationConfig");
    try {
      const snap = await getDocs(collection(cfgRef, "admins"));
      const list = snap.docs.map(d => d.data()?.phone).filter(Boolean);
      if (list.length) return list;
    } catch (e) { console.warn("admins subcollection fetch failed", e); }
    try {
      const cfgSnap = await getDocs(collection(db, "settings"));
      const cfgDoc = cfgSnap.docs.find(d => d.id === "notificationConfig");
      const arr = cfgDoc?.data()?.adminPhones;
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    } catch { return []; }
  };
  const notifyAdminsNewOrder = async ({ email, total }) => {
    const phones = await fetchAdminPhones();
    if (!phones.length) return;
    const paramsCsv = [email || "unknown", String(Math.round(Number(total || 0)))];
    await Promise.allSettled(
      phones.map(p =>
        fetch(WA_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: toApiPhone(p), text: "ecomm_orders_placed", paramsCsv, sanitize: true }),
        }).then(r => { if (!r.ok) throw new Error(`WA ${r.status}`); })
      )
    );
  };

  /* ====== checkout ====== */
  const handleCheckout = async () => {
    if (!cart.items.length) return;
    if (!user) { loginToCheckout(); return; }

    // if (paymentMode === "UPI") {
    //   const v = (upiId || "").trim();
    //   if (!v) {
    //     setUpiError("UPI transaction ID is required.");
    //     return;
    //   }
    //   setUpiError("");
    // }

    // 🔹 Build delivery block with coords from selectedAddress
    const deliveryBlock =
      selectedAddress
        ? {
          addressId: selectedAddress.id || null,
          label: selectedAddress.label || null,
          addressLine1:
            selectedAddress.addressLine1 || selectedAddress.line1 || "",
          addressLine2:
            selectedAddress.addressLine2 || selectedAddress.line2 || "",
          city: selectedAddress.city || "",
          pincode: selectedAddress.pincode || selectedAddress.zip || "",
          landmark: selectedAddress.landmark || "",
          // { lat: number, lng: number } OR a Firestore GeoPoint
          coords: selectedAddress.coords || selectedAddress.location || null,
        }
        : null;

    try {
      setPlacing(true);

      const payload = {
        createdAt: serverTimestamp(),
        status: "NEW",

        // ✅ FIXED CUSTOMER DATA
        customer: (() => {
          const rawPhone = (user?.phoneNumber || "").replace(/\D/g, "");
          const cleanPhone =
            rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
          const safeEmail =
            user?.email && user.email.trim()
              ? user.email.trim()
              : cleanPhone
                ? `${cleanPhone}@user.com`
                : "guest@user.com";
          return {
            uid: user?.uid || null,
            email: safeEmail,
            phone: user?.phoneNumber || null,
          };
        })(),

        items: cart.items.map((x) => ({
          id: x.id,
          title: x.title,
          price: Number(x.price || 0),
          qty: x.qty,

          // ✅ ADD THIS (already available in UI)
          zohoItemId: x.zohoItemId || null,


          imageUrl: x.imageUrl || null,
          mrp: Number(x.mrp || 0) || null,
          sizeLabel: x.sizeLabel || null,
          subtitle: x.subtitle || null,
          categoryId: x.categoryId || null,
          categorySlug: x.categorySlug || null,
        })),

        pricing: {
          subtotal: cart.subtotal,
          gst,
          total,
          gstBreakdown,
        },

        source: "cart-drawer",

        // attach delivery if present
        ...(deliveryBlock ? { delivery: deliveryBlock } : {}),

        payment: {
          mode: paymentMode === "COD" ? "COD" : "GATEWAY",
          status: paymentMode === "COD" ? "COD_PENDING" : "PENDING",
        },


        // ...(paymentMode === "UPI"
        //   ? {
        //     payment: {
        //       mode: "UPI",
        //       upiId: upiId.trim(),
        //       status: "PENDING_VERIFICATION",
        //       qrUsed: true,
        //     },
        //   }
        //   : {
        //     payment: {
        //       mode: paymentMode === "COD" ? "COD" : "OTHER",
        //       status: paymentMode === "COD" ? "COD_PENDING" : "PENDING",
        //     },
        //   }),
      };

      // 🔸 1) Save to Firestore
      const docRef = await addDoc(collection(db, "orders"), payload);
      const orderId = docRef.id;

      // 🔸 2) Build a Zoho-safe payload (no serverTimestamp)
      const zohoOrderPayload = {
        id: orderId,
        status: payload.status,
        customer: payload.customer,
        items: payload.items,
        pricing: payload.pricing,
        source: payload.source,
        payment: payload.payment,
        ...(deliveryBlock ? { delivery: deliveryBlock } : {}),
        createdAt: new Date().toISOString(), // human-friendly timestamp
      };

      // 🔸 3) Sync to Zoho for UPI / COD
      try {
        console.log("=================================================================================================================================================================================")
        await syncOrderToZoho(orderId, zohoOrderPayload);
      } catch (e) {
        // already logged inside syncOrderToZoho
      }

      // 🔸 4) WhatsApp notify admins
      await notifyAdminsNewOrder({ email: payload.customer.email, total });

      // 🔸 5) UI cleanup
      cart.clear();
      cart.closeCart();

      setDoneText(
        paymentMode === "COD"
          ? "Order placed! Pay cash on delivery to our agent."
          : "Redirecting to online payment."
      );


      // setDoneText(
      //   paymentMode === "UPI"
      //     ? "Order submitted! We’ll confirm your payment soon."
      //     : "Order placed! Pay cash on delivery to our agent."
      // );
      setDoneOpen(true);
    } catch (e) {
      console.error("Checkout error:", e);
      alert("Could not submit order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };


  const buildOrderPayload = () => {
    // build deliveryBlock same as handleCheckout
    const deliveryBlock =
      selectedAddress
        ? {
          addressId: selectedAddress.id || null,
          label: selectedAddress.label || null,
          addressLine1: selectedAddress.addressLine1 || selectedAddress.line1 || "",
          addressLine2: selectedAddress.addressLine2 || selectedAddress.line2 || "",
          city: selectedAddress.city || "",
          pincode: selectedAddress.pincode || selectedAddress.zip || "",
          landmark: selectedAddress.landmark || "",
          coords: selectedAddress.coords || selectedAddress.location || null,
        }
        : null;

    const rawPhone = (user?.phoneNumber || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const safeEmail =
      user?.email && user.email.trim()
        ? user.email.trim()
        : cleanPhone
          ? `${cleanPhone}@user.com`
          : "guest@user.com";

    return {
      status: "NEW",
      customer: {
        uid: user?.uid || null,
        email: safeEmail,
        phone: user?.phoneNumber || null,
      },
      items: cart.items.map((x) => ({
        id: x.id,
        title: x.title,
        price: Number(x.price || 0),
        qty: x.qty,
        imageUrl: x.imageUrl || null,
        mrp: Number(x.mrp || 0) || null,
        sizeLabel: x.sizeLabel || null,
        subtitle: x.subtitle || null,
        categoryId: x.categoryId || null,
        categorySlug: x.categorySlug || null,
      })),
      pricing: {
        subtotal: cart.subtotal,
        gst,
        total,
        gstBreakdown,
      },
      source: "cart-drawer",
      ...(deliveryBlock ? { delivery: deliveryBlock } : {}),
      payment: {
        mode: "GATEWAY",
        status: "PENDING", // will be updated to PAID in backend
      },
    };
  };

  const computeCartHash = () => {
    // stable string that changes when cart changes
    return JSON.stringify(
      cart.items
        .map((i) => ({ id: i.id, qty: i.qty }))
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    );
  };

  const createPreOrder = async () => {
    if (!cart.items.length) throw new Error("Cart empty");
    if (!user) throw new Error("Not logged in");

    const rawPhone = (user?.phoneNumber || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const safeEmail =
      user?.email && user.email.trim()
        ? user.email.trim()
        : cleanPhone
          ? `${cleanPhone}@user.com`
          : "guest@user.com";

    // IMPORTANT: do NOT send amount/total
    const payload = {
      customer: {
        id: user?.uid || cleanPhone || "guest",
        email: safeEmail,
        phone: cleanPhone || null,
      },
      items: cart.items.map((x) => ({
        productId: x.id,     // assuming x.id is your product doc id
        qty: Number(x.qty || 1),
      })),
      deliveryAddressId: selectedAddress?.id || null, // ✅ match backend

      delivery: selectedAddress
        ? {
          addressId: selectedAddress.id || null,
          pincode: selectedAddress.pincode || selectedAddress.zip || "",
        }
        : null,
      // optional: snapshot for UI/debug only (backend should ignore)
      clientSnapshot: {
        subtotal: cart.subtotal,
        gst,
        total,
        gstBreakdown,
      },
    };

    const res = await fetch(`${PAYMENT_API_BASE}/createPreOrder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`createPreOrder failed: ${res.status} ${t}`);
    }

    // const data = await res.json();
    // if (!data?.success || !data?.orderIntentId) {
    //   throw new Error("createPreOrder: invalid response");
    // }

    const data = await res.json();
    if (!data?.orderIntentId) {
      throw new Error(`createPreOrder: invalid response ${JSON.stringify(data)}`);
    }


    setPreOrderId(data.orderIntentId);
    setPreOrderForHash(computeCartHash());
    return data.orderIntentId;
  };

  const startGatewayPayment = async () => {
    if (!cart.items.length) return;
    if (!user) { loginToCheckout(); return; }

    try {
      setPlacing(true);

      // ensure preOrder exists and matches latest cart
      let intentId = preOrderId;
      if (!intentId || computeCartHash() !== preOrderForHash) {
        intentId = await createPreOrder();
      }


      const rawPhone = (user?.phoneNumber || "").replace(/\D/g, "");
      const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;

      const safeEmail =
        user?.email && user.email.trim()
          ? user.email.trim()
          : cleanPhone
            ? `${cleanPhone}@user.com`
            : "guest@user.com";

      const customer = {
        id: user?.uid || cleanPhone || "guest",
        email: safeEmail,
        phone: cleanPhone || null,
      };

      const res = await fetch(`${PAYMENT_API_BASE}/initiatePayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIntentId: intentId, customer }), // ✅ add customer
      });

      if (!res.ok) {
        console.error("initiatePayment failed:", res.status);
        alert("Could not start online payment. Please try again.");
        return;
      }

      const data = await res.json();
      if (!data.success || !data.paymentUrl) {
        console.error("payment API returned error:", data);
        alert("Payment could not be started. Please try again.");
        return;
      }

      cart.closeCart();
      window.location.href = data.paymentUrl;
    } catch (e) {
      console.error("startGatewayPayment error:", e);
      alert("Error initiating online payment. Please try again.");
    } finally {
      setPlacing(false);
    }
  };



  // const startGatewayPayment = async () => {
  //   if (!cart.items.length) return;
  //   if (!user) {
  //     loginToCheckout();
  //     return;
  //   }

  //   try {
  //     setPlacing(true);

  //     const rawPhone = (user?.phoneNumber || "").replace(/\D/g, "");
  //     const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
  //     const safeEmail =
  //       user?.email && user.email.trim()
  //         ? user.email.trim()
  //         : cleanPhone
  //           ? `${cleanPhone}@user.com`
  //           : "guest@user.com";

  //     const orderPayload = buildOrderPayload(); // 🔹 snapshot of the order

  //     const payload = {
  //       amount: Math.round(total), // INR
  //       customer: {
  //         id: user?.uid || cleanPhone || "guest",
  //         email: safeEmail,
  //         phone: cleanPhone || null,
  //       },
  //       orderPayload, // 🔹 send to backend
  //     };

  //     const res = await fetch(`${PAYMENT_API_BASE}/initiatePayment`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!res.ok) {
  //       console.error("initiatePayment failed:", res.status);
  //       alert("Could not start online payment. Please try again.");
  //       return;
  //     }

  //     const data = await res.json();
  //     if (!data.success || !data.paymentUrl) {
  //       console.error("payment API returned error:", data);
  //       alert("Payment could not be started. Please try again.");
  //       return;
  //     }

  //     cart.closeCart();
  //     window.location.href = data.paymentUrl;
  //   } catch (e) {
  //     console.error("startGatewayPayment error:", e);
  //     alert("Error initiating online payment. Please try again.");
  //   } finally {
  //     setPlacing(false);
  //   }
  // };


  useEffect(() => {
    if (!preOrderId) return;
    const nowHash = computeCartHash();
    if (preOrderForHash && nowHash !== preOrderForHash) {
      // cart modified after preOrder was created
      setPreOrderId(null);
      setPreOrderForHash("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items]);



  // const startGatewayPayment = async () => {
  //   if (!cart.items.length) return;
  //   if (!user) {
  //     loginToCheckout();
  //     return;
  //   }

  //   try {
  //     setPlacing(true);

  //     const rawPhone = (user?.phoneNumber || "").replace(/\D/g, "");
  //     const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
  //     const safeEmail =
  //       user?.email && user.email.trim()
  //         ? user.email.trim()
  //         : cleanPhone
  //           ? `${cleanPhone}@user.com`
  //           : "guest@user.com";

  //     const payload = {
  //       amount: Math.round(total), // in INR
  //       customer: {
  //         id: user?.uid || cleanPhone || "guest",
  //         email: safeEmail,
  //         phone: cleanPhone || null,
  //       },
  //     };

  //     const res = await fetch(`${PAYMENT_API_BASE}/initiatePayment`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!res.ok) {
  //       console.error("initiatePayment failed:", res.status);
  //       alert("Could not start online payment. Please try again.");
  //       return;
  //     }

  //     const data = await res.json();
  //     if (!data.success || !data.paymentUrl) {
  //       console.error("payment API returned error:", data);
  //       alert("Payment could not be started. Please try again.");
  //       return;
  //     }

  //     cart.closeCart();
  //     window.location.href = data.paymentUrl;
  //   } catch (e) {
  //     console.error("startGatewayPayment error:", e);
  //     alert("Error initiating online payment. Please try again.");
  //   } finally {
  //     setPlacing(false);
  //   }
  // };

  return (
    <>
      {/* Success modal */}
      <SuccessOverlay $open={doneOpen} role="dialog" aria-modal="true">
        <SuccessCard>
          <CloseX onClick={() => setDoneOpen(false)} aria-label="Close"><FiX /></CloseX>
          <div style={{ width: 110, height: 110, margin: "8px auto 4px" }}>
            <Lottie loop={false} play animationData={successAnim} style={{ width: "100%", height: "100%" }} />
          </div>
          <SuccessTitle>Hooray!</SuccessTitle>
          <SuccessMsg>{doneText}</SuccessMsg>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <CTA onClick={() => { setDoneOpen(false); nav("/my-orders"); }}>View My Orders</CTA>
            <Secondary onClick={() => { setDoneOpen(false); }}>Keep Shopping</Secondary>
          </div>
        </SuccessCard>
      </SuccessOverlay>

      <Backdrop show={cart.open} onClick={() => setCatsOpen(false) || cart.closeCart()} />
      <Panel show={cart.open} onClick={e => e.stopPropagation()}>
        <Head>
          <strong>Your Cart ({cart.totalQty})</strong>
          <button onClick={cart.closeCart} title="Close"><FiX /></button>
        </Head>

        <List>
          {cart.items.length === 0 ? (
            <div style={{ color: TOK.sub }}>
              Your cart is empty.
              <div style={{ marginTop: 12 }}>
                <Secondary onClick={openShop}>Shop Products</Secondary>
              </div>
            </div>
          ) : cart.items.map(it => (
            <Row key={it.id}>
              <Img src={it.imageUrl} alt={it.title} />
              <div>
                <Title>{it.title}</Title>
                {it.subtitle ? <Sub>{it.subtitle}</Sub> : null}
                <QtyWrap style={{ marginTop: 6 }}>
                  <QtyBtn onClick={() => cart.dec(it.id)}>-</QtyBtn>
                  <div style={{ minWidth: 20, textAlign: "center", fontWeight: 800, color: TOK.text }}>{it.qty}</div>
                  <QtyBtn onClick={() => cart.inc(it.id)}>+</QtyBtn>
                  <RemoveBtn onClick={() => cart.remove(it.id)} title="Remove"><FiTrash2 /> Remove</RemoveBtn>
                </QtyWrap>
              </div>
              <Price>{money(Number(it.price || 0) * it.qty)}</Price>
            </Row>
          ))}
        </List>

        {cart.items.length > 0 && (
          <Foot>
            <Tot><span>Subtotal</span><strong>{money(cart.subtotal)}</strong></Tot>

            <Tot><span>GST</span><strong>{money(gst)}</strong></Tot>
            {Object.keys(gstBreakdown).length > 1 && (
              <div style={{ fontSize: 12, color: TOK.sub, marginTop: -6 }}>
                {Object.entries(gstBreakdown)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([rate, amt]) => (
                    <div key={rate} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>• {rate}%</span><span style={{ fontWeight: 700, color: TOK.text }}>{money(amt)}</span>
                    </div>
                  ))}
              </div>
            )}

            <Divider />
            <Tot><span style={{ fontWeight: 900, color: TOK.text }}>Total</span><strong>{money(total)}</strong></Tot>

            <PayWrap>
              <InputLabel>Payment Method</InputLabel>
              <PayRow>
                {/* <PayOption $active={paymentMode === "UPI"}>
                  <span>
                    UPI <small>Scan & pay</small>
                  </span>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMode === "UPI"}
                    onChange={() => setPaymentMode("UPI")}
                  />
                </PayOption> */}
                <PayOption $active={paymentMode === "COD"}>
                  <span>
                    Cash on Delivery <small>Pay at doorstep</small>
                  </span>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMode === "COD"}
                    onChange={() => setPaymentMode("COD")}
                  />
                </PayOption>
              </PayRow>

              <PayRow style={{ marginTop: 8 }}>
                <PayOption $active={paymentMode === "GATEWAY"}>
                  <span>
                    Online Payment <small>Cards / UPI / NetBanking</small>
                  </span>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMode === "GATEWAY"}
                    // onChange={() => setPaymentMode("GATEWAY")}
                    onChange={async () => {
                      setPaymentMode("GATEWAY");

                      // create preOrder immediately on selecting gateway
                      try {
                        setPlacing(true);
                        await createPreOrder();
                      } catch (e) {
                        console.error(e);
                        alert("Could not prepare online payment. Please try again.");
                        setPaymentMode("COD"); // fallback
                      } finally {
                        setPlacing(false);
                      }
                    }}

                  />
                </PayOption>
              </PayRow>

              {/* {paymentMode === "UPI" && (
                <PayScroll>
                  <div style={{ border: `1px solid ${TOK.border}`, borderRadius: 12, padding: 12, display: "grid", placeItems: "center", background: "#fff" }}>
                    <img src={qrImage} alt="Scan to pay UPI QR" style={{ width: 180, height: 180, objectFit: "contain" }} />
                    <div style={{ marginTop: 6, color: TOK.sub, fontSize: 12 }}>
                      Scan the QR with any UPI app and complete the payment.
                    </div>
                  </div>

                  <InputLabel htmlFor="upi" style={{ marginTop: 8 }}>Enter Your UPI transaction ID</InputLabel>
                  <TextInput id="upi" value={upiId}
                    onChange={(e) => { setUpiId(e.target.value); setUpiError(""); }}
                    placeholder="e.g. GHD45463465" $error={!!upiError} />
                  {upiError ? <ErrorText>{upiError}</ErrorText> : <Hint>Required after completing payment in your UPI app.</Hint>}
                </PayScroll>
              )} */}
            </PayWrap>

            {user ? (
              <StickyActions>
                <CTA
                  // disabled={
                  //   !cart.items.length ||
                  //   placing ||
                  //   (paymentMode === "UPI" && !upiId.trim())
                  // }

                  disabled={!cart.items.length || placing}

                  onClick={() => {
                    if (paymentMode === "GATEWAY") {
                      startGatewayPayment();
                    } else {
                      handleCheckout();
                    }
                  }}
                >
                  {placing
                    ? paymentMode === "GATEWAY"
                      ? "Redirecting to payment…"
                      : "Submitting…"
                    : paymentMode === "GATEWAY"
                      ? `Pay Online • ${money(total)}`
                      : `Place Order • ${money(total)}`}
                </CTA>

                <Secondary onClick={cart.closeCart}>Continue Shopping</Secondary>
              </StickyActions>
            ) : (
              <StickyActions>
                <CTA onClick={loginToCheckout}>Login to Checkout</CTA>
                <Secondary onClick={openShop}>Continue Shopping</Secondary>
              </StickyActions>
            )}
          </Foot>
        )}
      </Panel>

      {/* Categories popup (mobile only) */}
      {!isDesktop && (
        <>
          <PopBackdrop $open={catsOpen} onClick={() => setCatsOpen(false)} />
          <PopSheet $open={catsOpen} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <PopHead>
              <h3>Shop by Category</h3>
              <button onClick={() => setCatsOpen(false)} style={{ background: "none", border: 0, cursor: "pointer" }} aria-label="Close"><FiX /></button>
            </PopHead>
            <div style={{ padding: 12 }}>
              <ProductCategories1 onSelect={onPickCategory} />
            </div>
          </PopSheet>
        </>
      )}
    </>
  );
}
