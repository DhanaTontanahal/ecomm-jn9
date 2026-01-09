// src/pages/PublicOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { collection, onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import { db } from "../firebase/firebase";
import Lottie from "react-lottie-player";
import orderNowAnim from "../assets/ordernow.json";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

/* ========= tokens ========= */
const TOK = {
  bg: "#fff",
  text: "#1f2a37",
  sub: "#6b7280",
  border: "rgba(16,24,40,.12)",
  faint: "rgba(16,24,40,.06)",
  green: "#5b7c3a",
  red: "#ef4444",
  amber: "#f59e0b",
  blue: "#2563eb",
  shadow: "0 12px 28px rgba(16,24,40,.08)",
};

const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;
const shimmer = keyframes`0%{background-position:-200% 0}100%{background-position:200% 0}`;
const float = keyframes`0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)}`;

const Page = styled.div`
  padding: 12px 12px 96px;
  animation: ${fade} .25s ease both;
`;

const HeadRow = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px;
  h2{ margin:0; font-size:18px; color:${TOK.text}; }
  small{ color:${TOK.sub} }
`;

const List = styled.div`display:grid; gap:10px;`;

const GroupDay = styled.div`
  margin: 10px 0 6px; color:${TOK.sub}; font-weight:800; font-size:12px;
`;

const Card = styled.div`
  background:${TOK.bg}; border:1px solid ${TOK.border}; border-radius:14px; box-shadow:${TOK.shadow};
  padding:12px; display:grid; grid-template-columns: auto 1fr auto; gap:10px; align-items:center;
  @media (max-width:420px){ grid-template-columns: 64px 1fr; grid-auto-rows:auto; }
`;

const Thumb = styled.img`
  width:64px; height:64px; object-fit:contain; background:#f5f6f7; border-radius:10px;
`;

const Title = styled.div`font-weight:900; color:${TOK.text};`;
const Meta = styled.div`color:${TOK.sub}; font-size:12px; margin-top:2px;`;
const Total = styled.div`font-weight:900; color:${TOK.text}; white-space:nowrap;`;

const Pill = styled.span`
  display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800;
  background: ${({ $tone }) => ({
    green: "rgba(16,185,129,.12)",
    amber: "rgba(245,158,11,.12)",
    blue: "rgba(37,99,235,.12)",
    red: "rgba(239,68,68,.12)",
    gray: "rgba(107,114,128,.12)",
  }[$tone] || "rgba(107,114,128,.12)")};
  color: ${({ $tone }) => ({
    green: "#047857",
    amber: "#b45309",
    blue: "#1d4ed8",
    red: "#b91c1c",
    gray: "#374151",
  }[$tone] || "#374151")};
`;

const RowRight = styled.div`
  display:grid; justify-items:end; gap:6px;
  @media (max-width:420px){ grid-column: 1 / -1; justify-items:stretch; }
`;

const Skel = styled.div`
  border:1px solid ${TOK.border}; border-radius:14px; height:84px; position:relative; overflow:hidden;
  background-image: linear-gradient(90deg, #f3f4f6 0px, #eceef1 40px, #f3f4f6 80px);
  background-size: 600px 100%;
  animation:${shimmer} 1.2s infinite linear;
`;

const EmptyWrap = styled.div`
  display:grid; place-items:center; padding: clamp(20px,6vw,36px) 12px 90px;
`;
const EmptyCard = styled.div`
  width:100%; max-width:620px; border:1px solid ${TOK.border}; background:#fff; border-radius:18px; box-shadow:${TOK.shadow};
  padding: clamp(16px,4vw,28px); text-align:center;
`;
const AnimBox = styled.div`
  display:grid; place-items:center; margin:6px 0 12px; > * { animation:${float} 3s ease-in-out infinite; }
`;
const EmptyTitle = styled.h3`margin:8px 0 4px; font-size: clamp(18px,5vw,22px); color:${TOK.text}; font-weight:900;`;
const EmptySub = styled.p`margin:0 0 14px; color:${TOK.sub}; font-size:14px;`;
const CTA = styled.button`
  border:0; border-radius:12px; background:${TOK.green}; color:#fff; font-weight:900; padding:12px 16px; cursor:pointer; min-width:160px;
  box-shadow:0 10px 24px rgba(91,124,58,.25);
`;

/* ========= helpers ========= */
const money = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

const fmtDay = (d) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtTime = (d) =>
  d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const statusTone = (s = "") => {
  const t = (s || "").toString().toUpperCase();
  if (["DELIVERED", "COMPLETED", "FULFILLED"].includes(t)) return "green";
  if (["PENDING_VERIFICATION", "NEW"].includes(t)) return "amber";
  if (["CONFIRMED", "DISPATCHED", "PROCESSING"].includes(t)) return "blue";
  if (["CANCELLED", "FAILED"].includes(t)) return "red";
  return "gray";
};

/** SAFE: works for undefined/null/non-string */
const emailCandidates = (raw) => {
  const e = (raw ?? "").toString().trim();
  if (!e) return [];
  const set = new Set([e, e.toLowerCase()]);
  const low = e.toLowerCase();
  if (low.endsWith("@gmail.com")) set.add(low.replace("@gmail.com", "@googlemail.com"));
  if (low.endsWith("@googlemail.com")) set.add(low.replace("@googlemail.com", "@gmail.com"));
  return [...set];
};

/* ========= component ========= */
export default function PublicOrders() {
  const { user } = useAuth?.() || { user: null };
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  // filters (kept for easy future enablement)
  // const [tab, setTab] = useState("ALL"); // ALL | ACTIVE | DELIVERED | CANCELLED
  // const [range, setRange] = useState("ALL"); // 30 | 90 | ALL

  const sortDesc = (a, b) => {
    const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return tb - ta;
  };

  // fetch user orders live (by email aliases + uid fallback)
  useEffect(() => {
    const hasUid = !!user?.uid;
    const emails = emailCandidates(user?.email);

    if (!hasUid && emails.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const merged = new Map();

    const apply = (snap) => {
      snap.docs.forEach(d => merged.set(d.id, { id: d.id, ...d.data() }));
      setOrders(Array.from(merged.values()).sort(sortDesc));
      setLoading(false);
    };
    const onErr = (err) => {
      console.error("Orders query error:", err?.message || err);
      setLoading(false);
    };

    const unsubs = [];

    // email listeners
    for (const em of emails) {
      const qEm = query(
        collection(db, "orders"),
        where("customer.email", "==", em),
        orderBy("createdAt", "desc"),
        limit(500)
      );
      unsubs.push(onSnapshot(qEm, apply, onErr));
    }

    // uid listener
    if (hasUid) {
      const qUid = query(
        collection(db, "orders"),
        where("customer.uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(500)
      );
      unsubs.push(onSnapshot(qUid, apply, onErr));
    }

    return () => unsubs.forEach(u => typeof u === "function" && u());
  }, [user?.email, user?.uid]);

  // (Optional) filtering skeleton kept as a reference:
  // const filtered = useMemo(() => {
  //   const now = new Date();
  //   const cutoff = (() => {
  //     if (range === "ALL") return null;
  //     const days = range === "30" ? 30 : 90;
  //     const d = new Date(now); d.setDate(d.getDate() - days); return d;
  //   })();
  //   return orders.filter(o => {
  //     const ts = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt || new Date(0));
  //     if (cutoff && ts < cutoff) return false;
  //     if (tab === "DELIVERED") return (o.status || "").toUpperCase() === "DELIVERED";
  //     if (tab === "CANCELLED") return (o.status || "").toUpperCase() === "CANCELLED";
  //     if (tab === "ACTIVE") {
  //       const s = (o.status || "").toUpperCase();
  //       return !["DELIVERED", "CANCELLED", "FAILED"].includes(s);
  //     }
  //     return true;
  //   });
  // }, [orders, tab, range]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const o of orders) {
      const dt = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
      const key = fmtDay(dt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(o);
    }
    return Array.from(map.entries());
  }, [orders]);

  if (!user) {
    return (
      <EmptyWrap>
        <EmptyCard>
          <EmptyTitle>Please login to view your orders</EmptyTitle>
          <EmptySub>Your past orders will appear here once you sign in.</EmptySub>
          <CTA onClick={() => nav("/login")}>Login</CTA>
        </EmptyCard>
      </EmptyWrap>
    );
  }

  return (
    <Page>
      <HeadRow>
        <h2 style={{ color: 'white' }}>My Orders</h2>
        <small>{orders.length ? `${orders.length} record${orders.length > 1 ? "s" : ""}` : ""}</small>
      </HeadRow>

      {loading && (
        <div style={{ display: "grid", gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skel key={i} />)}
        </div>
      )}

      {!loading && groups.length === 0 && (
        <EmptyWrap>
          <EmptyCard>
            <AnimBox>
              <Lottie play loop={false} animationData={orderNowAnim} style={{ width: 220, height: 220 }} />
            </AnimBox>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptySub>Hungry already? Browse the menu and place your first order.</EmptySub>
            <CTA onClick={() => nav("/menu")} aria-label="Go to Menu">Click to order</CTA>
          </EmptyCard>
        </EmptyWrap>
      )}

      {!loading && groups.length > 0 && (
        <List>
          {groups.map(([day, rows]) => (
            <div key={day}>
              <GroupDay>{day}</GroupDay>
              {rows.map(o => {
                const dt = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
                const firstItem = o.items?.[0];
                const itemsCount = o.items?.reduce((s, x) => s + (Number(x?.qty || 0)), 0) ?? 0;
                const tone = statusTone(o.status);
                const label = ((o.status || "NEW").toString())
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/(^|\s)\S/g, s => s.toUpperCase());

                const payMode = (o?.payment?.mode || "—").toString();
                const upiId = (o?.payment?.upiId ?? "").toString().trim();

                return (
                  <Card key={o.id} onClick={() => nav(`/my-orders/${o.id}`, { state: { order: o } })} style={{ cursor: "pointer" }}>

                    {firstItem?.imageUrl
                      ? <Thumb src={firstItem.imageUrl} alt={firstItem.title || "Order item"} />
                      : <div style={{ width: 64, height: 64, background: "#f3f4f6", borderRadius: 10 }} />
                    }

                    <div>
                      <Title>{itemsCount} item{itemsCount > 1 ? "s" : ""} • {payMode}</Title>
                      <Meta>
                        {fmtTime(dt)} • {(o?.customer?.email ?? "guest")}
                        {payMode === "UPI" && upiId ? ` • UPI: ${upiId}` : ""}
                      </Meta>
                      <div style={{ marginTop: 6 }}>
                        <Pill $tone={tone}>{label}</Pill>
                      </div>
                    </div>

                    <RowRight>
                      <Total>{o?.pricing?.total != null ? money(o.pricing.total) : money(0)}</Total>
                    </RowRight>
                  </Card>
                );
              })}
            </div>
          ))}
        </List>
      )}
    </Page>
  );
}
