// src/pages/purchases/Bills.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { PageShell, Head, Input, Select, Btn, Card, Table, C, computeTotals, quickPdfPrint } from "./_shared";
import { FiPlus, FiSearch, FiDownload, FiCheck } from "react-icons/fi";

function DrawerBill({ initial, vendors, onClose }) {
    const [b, setB] = useState(initial ?? { vendorId: "", billNo: "", date: new Date().toISOString().slice(0, 10), taxPct: 0, lines: [{ name: "", qty: 1, rate: 0 }], notes: "", status: "DRAFT" });
    const totals = useMemo(() => computeTotals(b.lines, b.taxPct), [b]);

    function setLine(i, patch) { const lines = [...b.lines]; lines[i] = { ...lines[i], ...patch }; setB({ ...b, lines }); }

    async function save() {
        const payload = { ...b, totals, updatedAt: serverTimestamp(), ...(initial ? {} : { createdAt: serverTimestamp(), openAmount: totals.total }) };
        if (initial?.id) await updateDoc(doc(db, "bills", initial.id), payload);
        else await addDoc(collection(db, "bills"), payload);
        onClose(true);
    }

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", zIndex: 90 }}>
            <div style={{ width: "min(980px,96vw)", maxHeight: "92vh", overflow: "auto", background: "#0d1526", border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3 style={{ margin: 0 }}>{initial ? "Edit" : "New"} Bill</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Btn onClick={save}>Save</Btn>
                        <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => onClose(false)}>Close</Btn>
                    </div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                    <Select value={b.vendorId} onChange={e => setB({ ...b, vendorId: e.target.value })}>
                        <option value="">Select vendor…</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.displayName}</option>)}
                    </Select>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <Input placeholder="Bill No" value={b.billNo} onChange={e => setB({ ...b, billNo: e.target.value })} />
                        <Input type="date" value={b.date} onChange={e => setB({ ...b, date: e.target.value })} />
                    </div>

                    <Table>
                        <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Line Total</th></tr></thead>
                        <tbody>
                            {b.lines.map((l, i) => (
                                <tr key={i}>
                                    <td><Input value={l.name} onChange={e => setLine(i, { name: e.target.value })} /></td>
                                    <td><Input type="number" value={l.qty} onChange={e => setLine(i, { qty: +e.target.value })} /></td>
                                    <td><Input type="number" value={l.rate} onChange={e => setLine(i, { rate: +e.target.value })} /></td>
                                    <td>{(Number(l.qty || 0) * Number(l.rate || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr><td colSpan={4}><Btn as="button" onClick={() => setB({ ...b, lines: [...b.lines, { name: "", qty: 1, rate: 0 }] })}><FiPlus /> Add line</Btn></td></tr>
                        </tbody>
                    </Table>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 10, alignItems: "end" }}>
                        <Input placeholder="Notes (optional)" value={b.notes} onChange={e => setB({ ...b, notes: e.target.value })} />
                        <div>
                            <div style={{ display: "grid", gap: 6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><b>{totals.subtotal.toFixed(2)}</b></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tax %</span><Input type="number" value={b.taxPct} onChange={e => setB({ ...b, taxPct: +e.target.value })} /></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tax</span><b>{totals.tax.toFixed(2)}</b></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total</span><b>{totals.total.toFixed(2)}</b></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function Bills() {
    const [rows, setRows] = useState([]); const [vendors, setVendors] = useState([]);
    const [qstr, setQstr] = useState(""); const [open, setOpen] = useState(null);

    useEffect(() => onSnapshot(query(collection(db, "bills"), orderBy("createdAt", "desc")), s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
    useEffect(() => onSnapshot(query(collection(db, "vendors")), s => setVendors(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);

    const filtered = useMemo(() => {
        const t = qstr.trim().toLowerCase();
        return rows.filter(b => [b.billNo, vendors.find(v => v.id === b.vendorId)?.displayName].some(x => String(x || "").toLowerCase().includes(t)));
    }, [rows, qstr, vendors]);

    async function markPaid(b) {
        await updateDoc(doc(db, "bills", b.id), { status: "PAID", openAmount: 0, updatedAt: serverTimestamp() });
    }

    return (
        <PageShell>
            <Head>
                <div style={{ position: "relative", flex: 1 }}>
                    <Input placeholder="Search bills (vendor / bill no)" value={qstr} onChange={e => setQstr(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
                <Btn onClick={() => setOpen({})}><FiPlus /> New Bill</Btn>
            </Head>

            <Card>
                <Table>
                    <thead><tr><th>Bill No</th><th>Vendor</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(b => {
                            const v = vendors.find(v => v.id === b.vendorId);
                            const totals = b.totals; // always stored
                            return (
                                <tr key={b.id}>
                                    <td><b>{b.billNo || b.id.slice(0, 6)}</b></td>
                                    <td>{v?.displayName || "-"}</td>
                                    <td>{b.date}</td>
                                    <td>{totals?.total?.toFixed(2)}</td>
                                    <td>{b.status || "DRAFT"}</td>
                                    <td style={{ display: "flex", gap: 8 }}>
                                        <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => quickPdfPrint(`Bill ${b.billNo || b.id}`, b)}><FiDownload /> PDF</Btn>
                                        {b.status !== "PAID" && <Btn as="button" onClick={() => markPaid(b)}><FiCheck /> Mark Paid</Btn>}
                                    </td>
                                </tr>
                            );
                        })}
                        {!filtered.length && <tr><td colSpan={6} style={{ color: C.sub, padding: 16 }}>No bills.</td></tr>}
                    </tbody>
                </Table>
            </Card>

            {!!open && <DrawerBill initial={Object.keys(open).length ? open : null} vendors={vendors} onClose={() => setOpen(null)} />}
        </PageShell>
    );
}
