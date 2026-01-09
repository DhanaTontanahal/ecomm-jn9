// src/components/admin/Accounting.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { toast } from "react-toastify";
import { db } from "../../firebase/firebase";
import {
    collection, doc, onSnapshot, orderBy, query, updateDoc, addDoc, serverTimestamp, limit
} from "firebase/firestore";
import { FiSearch, FiDownload, FiClipboard, FiCheck, FiTruck } from "react-icons/fi";

/* ===== Admin tokens (match your glass UI) ===== */
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

/* ===== Layout ===== */
const Page = styled.div`min-height:100dvh;background:${C.bg};color:${C.text};padding:20px;`;
const Head = styled.div`display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;h2{margin:0;font-size:20px}`;
const Card = styled.div`
  background:${C.glass}; border:1px solid ${C.border}; border-radius:14px; padding:12px;
  max-width:1280px; margin:10px auto; animation:${fade} .3s both;
`;
const Grid = styled.div`display:grid;gap:10px;grid-template-columns:1fr;@media(min-width:980px){grid-template-columns:repeat(4,1fr)};`;
const KPI = styled.div`
  border:1px solid ${C.border}; background:${C.glass2}; border-radius:12px; padding:12px; display:grid; gap:6px;
  small{color:${C.sub}} strong{font-size:20px}
`;
const Bar = styled.div`
  display:grid; gap:10px; grid-template-columns:1fr; max-width:1280px; margin:0 auto;
  @media(min-width:980px){grid-template-columns:180px 200px 220px 1fr 160px 140px}
`;
const Select = styled.select`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
  -webkit-text-fill-color:${C.text}; color-scheme:dark;
  option{ background:#121a2b; color:${C.text}; }
`;
const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
`;
const Button = styled.button`
  background:${p => p.$danger ? C.danger : C.primary}; color:#fff; border:none; border-radius:10px; padding:10px 12px; cursor:pointer;
  &:disabled{opacity:.6; cursor:not-allowed}
`;

const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th,td{border-bottom:1px solid ${C.border}; padding:10px; vertical-align:top}
  th{text-align:left; color:${C.sub}; font-weight:600}
  td .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
`;
const RowAction = styled.button`
  border:1px solid ${C.border}; background:${C.glass2}; color:${C.text};
  border-radius:8px; padding:6px 8px; display:inline-flex; gap:6px; align-items:center; cursor:pointer;
  &:disabled{opacity:.6; cursor:not-allowed}
`;

/* ===== Blocker ===== */
const Blocker = styled.div`
  position:fixed; inset:0; background:rgba(0,0,0,.45);
  display:${({ show }) => show ? "grid" : "none"}; place-items:center; z-index:3000;
`;
const Spinner = styled.div`
  width:56px; height:56px; border-radius:50%;
  border:4px solid rgba(255,255,255,.25); border-top-color:${C.primary};
  animation:spin .8s linear infinite; @keyframes spin{to{transform:rotate(360deg)}}
`;

/* ===== Helpers ===== */
const money = n => `₹ ${Number(n || 0).toLocaleString("en-IN")}`;
const isUPIPaid = p => p?.mode === "UPI" && p?.status === "PAID";
const isCODCollected = p => p?.mode === "COD" && p?.status === "COD_COLLECTED";

export default function Accounting() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    // Filters
    const [dateF, setDateF] = useState("30"); // 7|30|90|ALL
    const [statusF, setStatusF] = useState("DELIVERED_ONLY"); // DELIVERED_ONLY|ALL
    const [payModeF, setPayModeF] = useState("ALL");
    const [payStatF, setPayStatF] = useState("ALL");
    const [q, setQ] = useState("");

    // Live orders (latest 1000)
    useEffect(() => {
        setLoading(true);
        const qy = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(1000));
        const unsub = onSnapshot(qy, snap => {
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsub;
    }, []);

    // Filter helpers
    const now = new Date();
    const cutoff = (days) => { const d = new Date(); d.setDate(now.getDate() - Number(days || 0)); return d; };
    const within = (ts, days) => {
        if (days === "ALL") return true;
        const dt = ts?.toDate?.() || ts;
        return dt ? dt >= cutoff(days) : false;
    };

    const filtered = useMemo(() => {
        const txt = q.trim().toLowerCase();
        return orders.filter(o => {
            if (!within(o.createdAt, dateF)) return false;
            if (statusF === "DELIVERED_ONLY" && o.status !== "DELIVERED") return false;
            if (payModeF !== "ALL" && (o.payment?.mode || "") !== payModeF) return false;
            if (payStatF !== "ALL" && (o.payment?.status || "") !== payStatF) return false;

            if (txt) {
                const bag = [
                    o.id, o.customer?.email, o.customer?.uid,
                    ...(o.items || []).map(i => `${i.title} ${i.subtitle || ""} ${i.sizeLabel || ""}`)
                ].join(" ").toLowerCase();
                if (!bag.includes(txt)) return false;
            }
            return true;
        });
    }, [orders, dateF, statusF, payModeF, payStatF, q]);

    // Summaries
    const sums = useMemo(() => {
        const gross = filtered.reduce((s, o) => s + Number(o.pricing?.total || 0), 0);
        const gst = filtered.reduce((s, o) => s + Number(o.pricing?.gst || 0), 0);
        const net = filtered.reduce((s, o) => s + Number(o.pricing?.subtotal || 0), 0);
        const cnt = filtered.length;

        const upiPaid = filtered.filter(o => isUPIPaid(o.payment)).length;
        const upiPending = filtered.filter(o => o.payment?.mode === "UPI" && o.payment?.status !== "PAID").length;
        const codCollected = filtered.filter(o => isCODCollected(o.payment)).length;
        const codPending = filtered.filter(o => o.payment?.mode === "COD" && o.payment?.status !== "COD_COLLECTED").length;

        return { gross, gst, net, cnt, upiPaid, upiPending, codCollected, codPending };
    }, [filtered]);

    // Group by day for sales report
    const byDay = useMemo(() => {
        const m = new Map();
        filtered.forEach(o => {
            const d = o.createdAt?.toDate?.() || null;
            const key = d ? d.toISOString().slice(0, 10) : "unknown";
            if (!m.has(key)) m.set(key, { date: key, orders: 0, subtotal: 0, gst: 0, total: 0 });
            const row = m.get(key);
            row.orders += 1;
            row.subtotal += Number(o.pricing?.subtotal || 0);
            row.gst += Number(o.pricing?.gst || 0);
            row.total += Number(o.pricing?.total || 0);
        });
        return Array.from(m.values()).sort((a, b) => a.date < b.date ? 1 : -1);
    }, [filtered]);

    // Receivables & Pending
    const upiPendingList = useMemo(() => filtered.filter(o => o.payment?.mode === "UPI" && o.payment?.status !== "PAID"), [filtered]);
    const codPendingList = useMemo(() => filtered.filter(o => o.payment?.mode === "COD" && o.payment?.status !== "COD_COLLECTED"), [filtered]);

    /* ===== Actions ===== */
    async function verifyUPI(o) {
        if (o.payment?.mode !== "UPI" || o.payment?.status === "PAID") return;
        setBusy(true);
        try {
            await updateDoc(doc(db, "orders", o.id), { payment: { ...o.payment, status: "PAID" }, updatedAt: serverTimestamp() });
            await addDoc(collection(db, "orderTrail"), { orderId: o.id, type: "payment", field: "status", from: o.payment?.status, to: "PAID", actor: "admin-ui", at: serverTimestamp() });
            toast.success("UPI marked as PAID");
        } catch (e) { console.error(e); toast.error(e?.message || "Failed to verify UPI"); }
        finally { setBusy(false); }
    }

    async function markCODCollected(o) {
        if (o.payment?.mode !== "COD" || o.payment?.status === "COD_COLLECTED") return;
        setBusy(true);
        try {
            await updateDoc(doc(db, "orders", o.id), { payment: { ...o.payment, status: "COD_COLLECTED" }, updatedAt: serverTimestamp() });
            await addDoc(collection(db, "orderTrail"), { orderId: o.id, type: "payment", field: "status", from: o.payment?.status, to: "COD_COLLECTED", actor: "admin-ui", at: serverTimestamp() });
            toast.success("COD marked as collected");
        } catch (e) { console.error(e); toast.error(e?.message || "Failed to mark COD collected"); }
        finally { setBusy(false); }
    }

    async function addReconNote(o) {
        const note = window.prompt("Add reconciliation note (bank ref / remarks):", "");
        if (note === null) return;
        setBusy(true);
        try {
            await addDoc(collection(db, "reconciliations"), {
                orderId: o.id,
                paymentMode: o.payment?.mode || null,
                paymentStatus: o.payment?.status || null,
                amount: Number(o.pricing?.total || 0),
                note,
                actor: "admin-ui",
                at: serverTimestamp(),
            });
            toast.success("Reconciliation note added");
        } catch (e) { console.error(e); toast.error(e?.message || "Failed to add note"); }
        finally { setBusy(false); }
    }

    /* ===== CSV Export ===== */
    function exportCSV() {
        const cols = [
            "orderId", "createdAt", "status", "email", "paymentMode", "paymentStatus", "items", "subtotal", "gst", "total"
        ];
        const lines = [cols.join(",")];
        filtered.forEach(o => {
            const dt = o.createdAt?.toDate?.()?.toISOString?.() || "";
            const row = [
                o.id,
                dt,
                o.status || "",
                o.customer?.email || "",
                o.payment?.mode || "",
                o.payment?.status || "",
                (o.items || []).length,
                Number(o.pricing?.subtotal || 0),
                Number(o.pricing?.gst || 0),
                Number(o.pricing?.total || 0),
            ].map(v => typeof v === "string" && v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v);
            lines.push(row.join(","));
        });
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `accounting_${dateF}.csv`; a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <Page>
            <Head>
                <h2>Accounting</h2>
                <Button onClick={exportCSV}><FiDownload /> Export CSV</Button>
            </Head>

            {/* KPIs */}
            <Card>
                <Grid>
                    <KPI><small>Gross Sales</small><strong>{money(sums.gross)}</strong></KPI>
                    <KPI><small>GST (Collected)</small><strong>{money(sums.gst)}</strong></KPI>
                    <KPI><small>Net Sales (Taxable)</small><strong>{money(sums.net)}</strong></KPI>
                    <KPI><small>Orders</small><strong>{sums.cnt}</strong></KPI>
                </Grid>
            </Card>

            {/* Controls */}
            <Card>
                <Bar>
                    <Select value={dateF} onChange={e => setDateF(e.target.value)}>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="ALL">All time</option>
                    </Select>

                    <Select value={statusF} onChange={e => setStatusF(e.target.value)}>
                        <option value="DELIVERED_ONLY">Delivered only</option>
                        <option value="ALL">All statuses</option>
                    </Select>

                    <Select value={payModeF} onChange={e => setPayModeF(e.target.value)}>
                        <option value="ALL">Any payment</option>
                        <option value="UPI">UPI</option>
                        <option value="COD">COD</option>
                    </Select>

                    <div style={{ position: "relative" }}>
                        <Input placeholder="Search order id / email / item" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 38 }} />
                        <FiSearch style={{ position: "absolute", left: 10, top: 12, opacity: .8 }} />
                    </div>

                    <Select value={payStatF} onChange={e => setPayStatF(e.target.value)}>
                        <option value="ALL">Any pay status</option>
                        <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                        <option value="PAID">PAID</option>
                        <option value="COD_PENDING">COD_PENDING</option>
                        <option value="COD_COLLECTED">COD_COLLECTED</option>
                    </Select>

                    <div />
                </Bar>
            </Card>

            {/* Payment breakdown */}
            <Card>
                <Grid>
                    <KPI><small>UPI · Paid</small><strong>{sums.upiPaid}</strong></KPI>
                    <KPI><small>UPI · Pending</small><strong>{sums.upiPending}</strong></KPI>
                    <KPI><small>COD · Collected</small><strong>{sums.codCollected}</strong></KPI>
                    <KPI><small>COD · Outstanding</small><strong>{sums.codPending}</strong></KPI>
                </Grid>
            </Card>

            {/* Receivables */}
            <Card>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Outstanding · UPI Pending Verification</div>
                <Table>
                    <thead>
                        <tr><th>Order</th><th>Customer</th><th>Total</th><th>UPI ID</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} style={{ color: C.sub }}>Loading…</td></tr>}
                        {!loading && !upiPendingList.length && <tr><td colSpan={5} style={{ color: C.sub }}>None</td></tr>}
                        {upiPendingList.map(o => (
                            <tr key={o.id}>
                                <td><span className="mono">{o.id.slice(0, 8)}</span><div style={{ color: C.sub, fontSize: 12 }}>{o.status}</div></td>
                                <td>{o.customer?.email || "-"}</td>
                                <td><strong>{money(o.pricing?.total)}</strong></td>
                                <td className="mono">{o.payment?.upiId || "-"}</td>
                                <td>
                                    <RowAction onClick={() => verifyUPI(o)} disabled={busy}><FiClipboard /> Verify UPI</RowAction>{" "}
                                    <RowAction onClick={() => addReconNote(o)} disabled={busy}><FiCheck /> Add Recon</RowAction>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>

            <Card>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Receivables · COD Outstanding</div>
                <Table>
                    <thead>
                        <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} style={{ color: C.sub }}>Loading…</td></tr>}
                        {!loading && !codPendingList.length && <tr><td colSpan={5} style={{ color: C.sub }}>None</td></tr>}
                        {codPendingList.map(o => (
                            <tr key={o.id}>
                                <td><span className="mono">{o.id.slice(0, 8)}</span></td>
                                <td>{o.customer?.email || "-"}</td>
                                <td><strong>{money(o.pricing?.total)}</strong></td>
                                <td>{o.status}</td>
                                <td>
                                    <RowAction onClick={() => markCODCollected(o)} disabled={busy}><FiTruck /> Mark COD Collected</RowAction>{" "}
                                    <RowAction onClick={() => addReconNote(o)} disabled={busy}><FiCheck /> Add Recon</RowAction>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>

            {/* Sales by day */}
            <Card>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Sales by Day</div>
                <Table>
                    <thead>
                        <tr><th>Date</th><th>Orders</th><th>Taxable (Net)</th><th>GST</th><th>Gross</th></tr>
                    </thead>
                    <tbody>
                        {!byDay.length && <tr><td colSpan={5} style={{ color: C.sub }}>No data</td></tr>}
                        {byDay.map(r => (
                            <tr key={r.date}>
                                <td>{r.date}</td>
                                <td>{r.orders}</td>
                                <td>{money(r.subtotal)}</td>
                                <td>{money(r.gst)}</td>
                                <td><strong>{money(r.total)}</strong></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>

            {/* Busy blocker */}
            <Blocker show={busy}>
                <div style={{ display: "grid", gap: 10, justifyItems: "center", color: "#fff" }}>
                    <Spinner /><div>Working…</div>
                </div>
            </Blocker>
        </Page>
    );
}
