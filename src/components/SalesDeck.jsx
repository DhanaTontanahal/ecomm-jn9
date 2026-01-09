// src/components/admin/SalesDesk.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { toast } from "react-toastify";
import { db } from "../firebase/firebase";
import {
    collection, doc, onSnapshot, orderBy, query, updateDoc, addDoc,
    serverTimestamp, where, limit
} from "firebase/firestore";
import { FiSearch, FiFilter, FiX, FiCheck, FiTruck, FiBox, FiPackage, FiClipboard, FiAlertTriangle } from "react-icons/fi";
import GenerateInvoiceButton from "./admin/GenerateInvoiceButton";

/* ===== Admin tokens to match your glass UI ===== */
const C = {
    bg: "#0b1220",
    glass: "rgba(255,255,255,.06)",
    glass2: "rgba(255,255,255,.10)",
    border: "rgba(255,255,255,.14)",
    text: "#e7efff",
    sub: "#b7c6e6",
    ring: "#78c7ff",
    primary: "#4ea1ff",
    danger: "#ef4444",
    ok: "#10b981",
    amber: "#f59e0b",
};

const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;
const slide = keyframes`from{transform:translateX(10px);opacity:.0}to{transform:none;opacity:1}`;

/* ===== Layout ===== */
const Page = styled.div`
  min-height: 100dvh;
  background: ${C.bg};
  color: ${C.text};
  padding: 20px;
`;

const Head = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 12px;
  h2{ margin:0; font-size: 20px; }
`;

const Bar = styled.div`
  display:grid; gap: 10px; grid-template-columns: 1fr; max-width: 1280px; margin: 0 auto;
  @media (min-width: 980px){ grid-template-columns: 240px 200px 220px 1fr 160px; }
`;

const Select = styled.select`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
  -webkit-text-fill-color: ${C.text};
  color-scheme: dark;
  option{ background:#121a2b; color:${C.text}; }
`;
const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
`;

const Card = styled.div`
  background:${C.glass}; border:1px solid ${C.border}; border-radius:14px;
  padding: 12px; max-width: 1280px; margin: 10px auto; animation:${fade} .3s both;
`;

const Summary = styled.div`
  display:grid; gap: 10px; grid-template-columns: repeat(2,1fr);
  @media (min-width: 720px){ grid-template-columns: repeat(4,1fr); }
`;
const SumBox = styled.div`
  border:1px solid ${C.border}; background:${C.glass2}; border-radius:12px; padding:12px;
  display:grid; gap:6px;
  small{ color:${C.sub} }
  strong{ font-size:20px }
`;

/* ===== Orders Table ===== */
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th, td { border-bottom: 1px solid ${C.border}; padding: 10px; vertical-align: top; }
  th { text-align:left; color:${C.sub}; font-weight:600; }
  td .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
  tr:hover td { background: rgba(255,255,255,.02); }
`;

const RowAction = styled.button`
  border:1px solid ${C.border}; background:${C.glass2}; color:${C.text};
  border-radius:8px; padding:6px 8px; display:inline-flex; gap:6px; align-items:center; cursor:pointer;
  &:disabled{ opacity:.6; cursor:not-allowed }
`;

/* ===== Drawer ===== */
const Drawer = styled.div`
  position: fixed; top: 0; right: 0; height: 100%; width: min(520px, 100vw);
  background: ${C.bg}; border-left: 1px solid ${C.border}; z-index: 1010; display: grid;
  grid-template-rows: 56px minmax(0,1fr);
  transform: translateX(${({ open }) => open ? "0" : "100%"});
  transition: transform .25s ease; animation: ${slide} .25s ease;
`;
const DHead = styled.div`
  display:flex; align-items:center; justify-content:space-between; padding: 0 14px; border-bottom: 1px solid ${C.border};
  strong{ color:${C.text}; letter-spacing:.2px }
  button{ appearance:none; border:0; background:transparent; width:32px; height:32px; border-radius:10px; display:grid; place-items:center; cursor:pointer; color:${C.text}; }
  button:hover{ background:${C.glass2}; }
`;
const DBody = styled.div` overflow:auto; padding: 12px 14px; display:grid; gap: 10px; `;

const Tag = styled.span`
  border:1px solid ${C.border};
  background:${p => p.$warn ? "rgba(239,68,68,.12)" : p.$ok ? "rgba(16,185,129,.12)" : C.glass2};
  color:${p => p.$warn ? "#fecaca" : p.$ok ? "#b2f5ea" : C.text};
  border-radius: 999px; padding: 2px 8px; font-size: 12px;
`;

/* ===== Blocker / Spinner ===== */
const Blocker = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: ${({ show }) => show ? "grid" : "none"}; place-items: center; z-index: 2000;
`;
const Spinner = styled.div`
  width: 56px; height: 56px; border-radius: 50%;
  border: 4px solid rgba(255,255,255,.25);
  border-top-color: ${C.primary};
  animation: spin .8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ===== Helpers ===== */
const money = n => `₹ ${Number(n || 0).toLocaleString("en-IN")}`;
const shortId = id => id?.slice?.(0, 8) || id;

const STATUS_FLOW = ["NEW", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];
const NEXT_STATUS = {
    "NEW": "CONFIRMED",
    "CONFIRMED": "PACKED",
    "PACKED": "SHIPPED",
    "SHIPPED": "DELIVERED",
};

const PAYMENT_OK = (p) =>
    (p?.mode === "UPI" && p?.status === "PAID") ||
    (p?.mode === "COD" && (p?.status === "COD_COLLECTED" || p?.status === "DELIVERED"));

/* ===== Component ===== */
export default function SalesDesk() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [statusF, setStatusF] = useState("ALL");
    const [payModeF, setPayModeF] = useState("ALL");
    const [payStatF, setPayStatF] = useState("ALL");
    const [dateF, setDateF] = useState("30"); // 7 | 30 | 90 | ALL
    const [q, setQ] = useState("");

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    const [busy, setBusy] = useState(false);

    // Live subscription (pull latest 500 by default)
    useEffect(() => {
        setLoading(true);
        const qy = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(500));
        const unsub = onSnapshot(qy, snap => {
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsub;
    }, []);

    // Filters
    const filtered = useMemo(() => {
        const now = new Date();
        const cutoff = (days) => {
            const d = new Date(); d.setDate(now.getDate() - Number(days || 0)); return d;
        };
        const within = (ts, days) => {
            if (days === "ALL") return true;
            const dt = ts?.toDate?.() || ts;
            if (!dt) return false;
            return dt >= cutoff(days);
        };
        const txt = q.trim().toLowerCase();
        return orders.filter(o => {
            if (statusF !== "ALL" && (o.status || "") !== statusF) return false;
            if (payModeF !== "ALL" && (o.payment?.mode || "") !== payModeF) return false;
            if (payStatF !== "ALL" && (o.payment?.status || "") !== payStatF) return false;
            if (!within(o.createdAt, dateF)) return false;

            if (txt) {
                const bag = [
                    o.id,
                    o.customer?.email,
                    o.customer?.uid,
                    ...(o.items || []).map(i => `${i.title} ${i.subtitle || ""} ${i.sizeLabel || ""}`),
                ].join(" ").toLowerCase();
                if (!bag.includes(txt)) return false;
            }
            return true;
        });
    }, [orders, statusF, payModeF, payStatF, dateF, q]);

    // Summary cards
    const todayKey = new Date().toDateString();
    const sums = useMemo(() => {
        const today = filtered.filter(o => (o.createdAt?.toDate?.()?.toDateString?.() || "") === todayKey);
        const newCount = filtered.filter(o => o.status === "NEW").length;
        const pendingPay = filtered.filter(o => o.payment?.mode === "UPI" ? o.payment?.status !== "PAID" : o.payment?.status !== "COD_COLLECTED").length;
        const delivered = filtered.filter(o => o.status === "DELIVERED").length;
        return { today: today.length, news: newCount, pendingPay, delivered };
    }, [filtered, todayKey]);

    function openOrder(o) {
        setSelected(o);
        setOpen(true);
    }

    /* ===== Trail writer ===== */
    async function writeTrail(orderId, payload) {
        await addDoc(collection(db, "orderTrail"), {
            orderId,
            at: serverTimestamp(),
            actor: "admin-ui",
            ...payload,
        });
    }

    /* ===== Actions ===== */
    async function updateStatus(o, next, note = "") {
        if (!next || o.status === next) return;
        setBusy(true);
        try {
            await updateDoc(doc(db, "orders", o.id), { status: next, updatedAt: serverTimestamp() });
            await writeTrail(o.id, { type: "status", from: o.status, to: next, note });
            toast.success(`Status → ${next}`);
        } catch (e) {
            console.error(e);
            toast.error(e?.message || "Failed to update status");
        } finally { setBusy(false); }
    }

    async function verifyUPI(o) {
        if (o.payment?.mode !== "UPI") return;
        setBusy(true);
        try {
            await updateDoc(doc(db, "orders", o.id), { payment: { ...o.payment, status: "PAID" }, updatedAt: serverTimestamp() });
            await writeTrail(o.id, { type: "payment", field: "status", from: o.payment?.status, to: "PAID", note: "UPI verified" });
            toast.success("UPI marked as PAID");
        } catch (e) {
            console.error(e);
            toast.error(e?.message || "Failed to verify UPI");
        } finally { setBusy(false); }
    }

    async function markCodCollected(o) {
        if (o.payment?.mode !== "COD") return;
        setBusy(true);
        try {
            await updateDoc(doc(db, "orders", o.id), { payment: { ...o.payment, status: "COD_COLLECTED" }, updatedAt: serverTimestamp() });
            await writeTrail(o.id, { type: "payment", field: "status", from: o.payment?.status, to: "COD_COLLECTED", note: "COD collected" });
            toast.success("COD marked as collected");
        } catch (e) {
            console.error(e);
            toast.error(e?.message || "Failed to mark COD collected");
        } finally { setBusy(false); }
    }

    async function cancelOrder(o) {
        if (!window.confirm("Cancel this order?")) return;
        setBusy(true);
        try {
            await updateDoc(doc(db, "orders", o.id), { status: "CANCELLED", updatedAt: serverTimestamp() });
            await writeTrail(o.id, { type: "status", from: o.status, to: "CANCELLED", note: "Cancelled by admin" });
            toast.success("Order cancelled");
        } catch (e) {
            console.error(e);
            toast.error(e?.message || "Failed to cancel order");
        } finally { setBusy(false); }
    }

    function nextStatusOf(o) {
        return NEXT_STATUS[o.status] || null;
    }

    return (
        <Page>
            <Head>
                <h2>Sales Desk</h2>
            </Head>

            {/* Summary */}
            <Card>
                <Summary>
                    <SumBox><small>Today</small><strong>{sums.today}</strong></SumBox>
                    <SumBox><small>New</small><strong>{sums.news}</strong></SumBox>
                    <SumBox><small>Pending Payment</small><strong>{sums.pendingPay}</strong></SumBox>
                    <SumBox><small>Delivered</small><strong>{sums.delivered}</strong></SumBox>
                </Summary>
            </Card>

            {/* Controls */}
            <Card>
                <Bar>
                    <Select value={statusF} onChange={e => setStatusF(e.target.value)}>
                        <option value="ALL">All Status</option>
                        <option>NEW</option>
                        <option>CONFIRMED</option>
                        <option>PACKED</option>
                        <option>SHIPPED</option>
                        <option>DELIVERED</option>
                        <option>CANCELLED</option>
                    </Select>

                    <Select value={payModeF} onChange={e => setPayModeF(e.target.value)}>
                        <option value="ALL">All Payments</option>
                        <option value="UPI">UPI</option>
                        <option value="COD">COD</option>
                    </Select>

                    <Select value={payStatF} onChange={e => setPayStatF(e.target.value)}>
                        <option value="ALL">Any Pay Status</option>
                        <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                        <option value="PAID">PAID</option>
                        <option value="COD_PENDING">COD_PENDING</option>
                        <option value="COD_COLLECTED">COD_COLLECTED</option>
                    </Select>

                    <div style={{ position: "relative" }}>
                        <Input placeholder="Search order id / email / item" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 38 }} />
                        <FiSearch style={{ position: "absolute", left: 10, top: 12, opacity: .8 }} />
                    </div>

                    <Select value={dateF} onChange={e => setDateF(e.target.value)}>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="ALL">All time</option>
                    </Select>
                </Bar>
            </Card>

            {/* Orders Table */}
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>When</th>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={8} style={{ color: C.sub }}>Loading…</td></tr>
                        )}
                        {!loading && !filtered.length && (
                            <tr><td colSpan={8} style={{ color: C.sub }}>No orders.</td></tr>
                        )}
                        {filtered.map(o => {
                            const dt = o.createdAt?.toDate?.() || null;
                            return (
                                <tr key={o.id}>
                                    <td>
                                        <div>{dt ? dt.toLocaleDateString() : "-"}</div>
                                        <div style={{ color: C.sub, fontSize: 12 }}>{dt ? dt.toLocaleTimeString() : ""}</div>
                                    </td>
                                    <td>
                                        <div className="mono">{shortId(o.id)}</div>
                                        <div style={{ fontSize: 12, color: C.sub }}>{(o.items || []).map(i => i.sizeLabel).filter(Boolean).slice(0, 2).join(", ")}</div>
                                    </td>
                                    <td>
                                        <div>{o.customer?.email || "-"}</div>
                                        <div style={{ fontSize: 12, color: C.sub }}>{o.customer?.uid || ""}</div>
                                    </td>
                                    <td>{(o.items || []).length}</td>
                                    <td><strong>{money(o.pricing?.total)}</strong></td>
                                    <td>
                                        <div>{o.payment?.mode || "-"}</div>
                                        <div style={{ fontSize: 12, color: PAYMENT_OK(o.payment) ? C.ok : C.amber }}>
                                            {o.payment?.status || ""}
                                        </div>
                                    </td>
                                    <td>
                                        <Tag $ok={o.status === "DELIVERED"} $warn={o.status === "CANCELLED"}>
                                            {o.status}
                                        </Tag>
                                    </td>
                                    <td>
                                        <RowAction onClick={() => openOrder(o)}><FiFilter /> View</RowAction>
                                        <GenerateInvoiceButton
                                            orderId={o.id}
                                            onOpen={(inv) => window.open(`/admin/invoice/${inv.id}`, "_blank")}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Card>

            {/* Detail Drawer */}
            <Drawer open={open}>
                <DHead>
                    <strong>Order · {selected ? shortId(selected.id) : "-"}</strong>
                    <button onClick={() => setOpen(false)} aria-label="Close"><FiX /></button>
                </DHead>
                <DBody>
                    {!selected ? (
                        <div style={{ color: C.sub }}>Select an order from the table.</div>
                    ) : (
                        <>
                            {/* Top summary */}
                            <div style={{ display: "grid", gap: 8 }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <Tag>{selected.payment?.mode} / {selected.payment?.status}</Tag>
                                    <Tag $ok={selected.status === "DELIVERED"} $warn={selected.status === "CANCELLED"}>{selected.status}</Tag>
                                    {selected.payment?.mode === "UPI" && selected.payment?.upiId ? (
                                        <span className="mono" title="UPI transaction">{selected.payment.upiId}</span>
                                    ) : null}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "start" }}>
                                    <div>
                                        <div style={{ fontWeight: 800 }}>₹ {Number(selected.pricing?.total || 0).toLocaleString("en-IN")}</div>
                                        <div style={{ fontSize: 12, color: C.sub }}>
                                            Subtotal {money(selected.pricing?.subtotal)} · GST {money(selected.pricing?.gst)}
                                        </div>
                                    </div>
                                    {/* Status progression quick-actions */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "end" }}>
                                        {selected.status !== "CANCELLED" && selected.status !== "DELIVERED" && nextStatusOf(selected) && (
                                            <RowAction disabled={busy} onClick={() => updateStatus(selected, nextStatusOf(selected))}>
                                                {selected.status === "NEW" && <FiCheck />}
                                                {selected.status === "CONFIRMED" && <FiBox />}
                                                {selected.status === "PACKED" && <FiPackage />}
                                                {selected.status === "SHIPPED" && <FiTruck />}
                                                Next: {nextStatusOf(selected)}
                                            </RowAction>
                                        )}
                                        {selected.payment?.mode === "UPI" && selected.payment?.status !== "PAID" && selected.status !== "CANCELLED" && (
                                            <RowAction disabled={busy} onClick={() => verifyUPI(selected)}>
                                                <FiClipboard /> Verify UPI
                                            </RowAction>
                                        )}
                                        {selected.payment?.mode === "COD" && selected.payment?.status !== "COD_COLLECTED" && selected.status === "DELIVERED" && (
                                            <RowAction disabled={busy} onClick={() => markCodCollected(selected)}>
                                                <FiClipboard /> COD Collected
                                            </RowAction>
                                        )}
                                        {selected.status !== "CANCELLED" && selected.status !== "DELIVERED" && (
                                            <RowAction disabled={busy} onClick={() => cancelOrder(selected)} style={{ borderColor: C.danger, color: "#fecaca" }}>
                                                <FiAlertTriangle /> Cancel
                                            </RowAction>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Customer */}
                            <Card>
                                <div style={{ fontWeight: 800, marginBottom: 6 }}>Customer</div>
                                <div>{selected.customer?.email || "-"}</div>
                                {selected.customer?.uid ? <div style={{ fontSize: 12, color: C.sub }}>UID: {selected.customer.uid}</div> : null}
                                {selected.source ? <div style={{ fontSize: 12, color: C.sub }}>Source: {selected.source}</div> : null}
                            </Card>

                            {/* Items */}
                            <Card>
                                <div style={{ fontWeight: 800, marginBottom: 6 }}>Items ({(selected.items || []).length})</div>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ color: C.sub, fontSize: 12 }}>
                                            <th style={{ textAlign: "left", padding: "6px 0" }}>Product</th>
                                            <th style={{ textAlign: "right", padding: "6px 0" }}>Qty</th>
                                            <th style={{ textAlign: "right", padding: "6px 0" }}>Price</th>
                                            <th style={{ textAlign: "right", padding: "6px 0" }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selected.items || []).map((it, idx) => (
                                            <tr key={idx}>
                                                <td style={{ padding: "6px 0" }}>
                                                    <div style={{ fontWeight: 700 }}>{it.title}</div>
                                                    <div style={{ fontSize: 12, color: C.sub }}>
                                                        {it.subtitle || ""} {it.sizeLabel ? `• ${it.sizeLabel}` : ""}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "right" }}>{it.qty}</td>
                                                <td style={{ textAlign: "right" }}>{money(it.price)}</td>
                                                <td style={{ textAlign: "right" }}>{money(Number(it.price || 0) * Number(it.qty || 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>

                            {/* Timestamps */}
                            <Card>
                                <div style={{ fontWeight: 800, marginBottom: 6 }}>Timestamps</div>
                                <div style={{ display: "grid", gap: 4 }}>
                                    <div><small style={{ color: C.sub }}>Created</small><div>{selected.createdAt?.toDate?.()?.toLocaleString?.() || "-"}</div></div>
                                    {selected.updatedAt ? (
                                        <div><small style={{ color: C.sub }}>Updated</small><div>{selected.updatedAt?.toDate?.()?.toLocaleString?.() || "-"}</div></div>
                                    ) : null}
                                </div>
                            </Card>
                        </>
                    )}
                </DBody>
            </Drawer>

            {/* Busy blocker */}
            <Blocker show={busy}>
                <div style={{ display: "grid", gap: 10, justifyItems: "center", color: "#fff" }}>
                    <Spinner />
                    <div>Working…</div>
                </div>
            </Blocker>
        </Page>
    );
}
