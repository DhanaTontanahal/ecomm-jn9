// src/pages/Accounting.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { toast } from "react-toastify";
import {
    collection, query, where, orderBy, limit, onSnapshot,
    addDoc, serverTimestamp, runTransaction, doc, updateDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
    FiDownload, FiPrinter, FiPlus, FiRefreshCw, FiArrowRightCircle,
    FiCheckCircle, FiFileText, FiShoppingCart, FiCreditCard
} from "react-icons/fi";

/* ===== Theme tokens (aligned with your admin look) ===== */
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
    warn: "#f59e0b",
};

const fade = keyframes`from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}`;

/* ===== UI ===== */
const Page = styled.div`min-height:100dvh;background:${C.bg};color:${C.text};padding:20px;`;
const Bar = styled.div`
  display:grid; gap:12px; grid-template-columns: 1fr;
  max-width: 1300px; margin: 0 auto 14px;
  @media (min-width:900px){ grid-template-columns: 1fr auto auto auto; }
`;
const CardGrid = styled.div`
  display:grid; gap:12px; grid-template-columns:1fr;
  max-width:1300px; margin: 0 auto 14px;
  @media (min-width:900px){ grid-template-columns: repeat(4, 1fr); }
`;
const Kpi = styled.div`
  background:${C.glass}; border:1px solid ${C.border}; border-radius:12px; padding:12px;
  display:grid; gap:6px; animation:${fade} .25s both;
  small{ color:${C.sub}; }
  b{ font-size:20px; }
`;
const Row = styled.div`display:flex; gap:8px; align-items:center; flex-wrap: wrap;`;
const Btn = styled.button`
  display:inline-flex; gap:8px; align-items:center;
  background:${p => p.$danger ? C.danger : p.$ok ? C.ok : C.primary};
  color:#fff; border:none; border-radius:10px; padding:10px 12px; cursor:pointer;
  &:disabled{opacity:.6; cursor:not-allowed}
`;
const BtnGhost = styled.button`
  display:inline-flex; gap:8px; align-items:center;
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; cursor:pointer;
`;
const Select = styled.select`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border}; color-scheme:dark;
  border-radius:10px; padding:10px 12px;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
  option{ background:#121a2b; }
`;
const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; min-width: 200px;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
`;

const Card = styled.div`
  background:${C.glass}; border:1px solid ${C.border}; border-radius:12px;
  padding:12px; max-width:1300px; margin:0 auto 14px; animation:${fade} .3s both;
`;
const Head = styled.div`display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;`;
const Title = styled.h3`margin:0; font-size:16px;`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th,td{border-bottom:1px solid ${C.border}; padding:10px; vertical-align:top}
  th{text-align:left; color:${C.sub}; font-weight:600}
  tbody tr:hover{ background:${C.glass2}; }
`;

const Tag = styled.span`
  padding:4px 8px; border-radius:999px; font-weight:700; font-size:12px; border:1px solid ${C.border};
  background:${p => p.$warn ? "rgba(245,158,11,.18)" : p.$ok ? "rgba(16,185,129,.18)" : C.glass2};
  color:${p => p.$warn ? "#fbbf24" : p.$ok ? "#34d399" : C.text};
`;

/* ===== Helpers & Config ===== */

const money = n => `₹ ${Number(n || 0).toLocaleString("en-IN")}`;

const COLL = {
    invoices: "salesInvoices",     // {customer:{name}, total, paid, status: "DUE"/"PAID", date}
    creditNotes: "creditNotes",    // {customer, amount, date}
    estimates: "estimates",        // {customer, total, status, date}
    salesOrders: "salesOrders",    // {customer, total, status, date, items:[]}
    purchaseOrders: "purchaseOrders", // {vendor:{name}, total, status: "OPEN"/"CONVERTED", date, items:[]}
    bills: "bills",                // {vendor, total, paid, status: "DUE"/"PAID", date, sourcePO?}
    expenses: "expenses"           // {category, amount, date, note}
};

/* Quick “CSV” export */
function exportCsv(filename, rows, headers) {
    const cols = headers.map(h => h.key);
    const headLine = headers.map(h => `"${h.label}"`).join(",");
    const body = rows.map(r => cols.map(c => `"${String(r[c] ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([headLine + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* Print/PDF: print the card area */
function printNode(nodeRef) {
    if (!nodeRef?.current) return;
    // simplest: open print dialog — in most browsers “Save as PDF”
    window.print();
}

/* ===== New Purchase Order Modal ===== */
function NewPOModal({ open, onClose, onCreate }) {
    const [vendor, setVendor] = useState("");
    const [refNo, setRefNo] = useState("");
    const [items, setItems] = useState([{ title: "", qty: 1, price: 0 }]);

    if (!open) return null;

    const total = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.price || 0), 0);

    const addLine = () => setItems(p => [...p, { title: "", qty: 1, price: 0 }]);
    const setLine = (idx, k, v) => setItems(p => p.map((it, i) => i === idx ? { ...it, [k]: k === "title" ? v : Number(v || 0) } : it));
    const rmLine = (idx) => setItems(p => p.filter((_, i) => i !== idx));

    const create = async () => {
        if (!vendor.trim()) return toast.warn("Vendor is required");
        const sane = items.filter(i => i.title.trim() && i.qty > 0);
        if (!sane.length) return toast.warn("Add at least one valid item");
        await onCreate({ vendor: { name: vendor.trim() }, refNo: refNo.trim() || null, items: sane, total });
        onClose();
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", zIndex: 9999 }}>
            <div style={{ width: "min(720px, 96vw)", background: C.glass, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
                <Head>
                    <Title>New Purchase Order</Title>
                    <Row>
                        <BtnGhost onClick={onClose}>Close</BtnGhost>
                        <Btn onClick={create}><FiPlus />Create</Btn>
                    </Row>
                </Head>

                <Row style={{ gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <Input placeholder="Vendor name" value={vendor} onChange={e => setVendor(e.target.value)} />
                    <Input placeholder="Reference No (optional)" value={refNo} onChange={e => setRefNo(e.target.value)} />
                    <Tag>Est. Total: <b style={{ marginLeft: 6 }}>{money(total)}</b></Tag>
                </Row>

                <Card>
                    <Table>
                        <thead><tr><th style={{ width: "50%" }}>Item</th><th>Qty</th><th>Price</th><th>Line Total</th><th /></tr></thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={idx}>
                                    <td><Input value={it.title} onChange={e => setLine(idx, "title", e.target.value)} placeholder="Item title" style={{ width: "100%" }} /></td>
                                    <td><Input type="number" value={it.qty} onChange={e => setLine(idx, "qty", e.target.value)} style={{ width: 90 }} /></td>
                                    <td><Input type="number" value={it.price} onChange={e => setLine(idx, "price", e.target.value)} style={{ width: 120 }} /></td>
                                    <td><b>{money((it.qty || 0) * (it.price || 0))}</b></td>
                                    <td><BtnGhost onClick={() => rmLine(idx)}>Remove</BtnGhost></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Row style={{ marginTop: 10 }}>
                        <BtnGhost onClick={addLine}><FiPlus />Add Line</BtnGhost>
                    </Row>
                </Card>
            </div>
        </div>
    );
}

/* ===== Main Page ===== */
export default function Accounting() {
    const [range, setRange] = useState("30"); // 7 / 30 / 90 / all
    const [newPOOpen, setNewPOOpen] = useState(false);

    // Data holders
    const [invoices, setInvoices] = useState([]);
    const [bills, setBills] = useState([]);
    const [creditNotes, setCreditNotes] = useState([]);
    const [estimates, setEstimates] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [expenses, setExpenses] = useState([]);

    // printable container refs
    const invRef = useRef(null);
    const cnRef = useRef(null);
    const estRef = useRef(null);
    const soRef = useRef(null);
    const poRef = useRef(null);

    // Date filter
    const minDate = useMemo(() => {
        if (range === "all") return 0;
        const days = Number(range || 30);
        return Date.now() - days * 24 * 60 * 60 * 1000;
    }, [range]);

    // Subscribe to collections with date filters where available
    useEffect(() => {
        const subs = [];

        const add = (coll, setter, dateField = "date") => {
            let qy = query(collection(db, coll), orderBy(dateField, "desc"), limit(500));
            subs.push(onSnapshot(qy, snap => {
                const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setter(rows);
            }));
        };

        add(COLL.invoices, setInvoices);        // salesInvoices
        add(COLL.bills, setBills);              // bills (payables)
        add(COLL.creditNotes, setCreditNotes);  // credit notes
        add(COLL.estimates, setEstimates);
        add(COLL.salesOrders, setSalesOrders);
        add(COLL.purchaseOrders, setPurchaseOrders);
        add(COLL.expenses, setExpenses);

        return () => subs.forEach(u => u());
    }, []);

    // Filter by range (client-side; switch to where('date','>=',X) if you keep indexed)
    const byRange = (rows, dateField = "date") =>
        rows.filter(r => !minDate || ((r[dateField]?.seconds ? r[dateField].seconds * 1000 : (r[dateField]?.toDate?.()?.getTime?.() ?? 0)) >= minDate));

    const invInRange = useMemo(() => byRange(invoices), [invoices, minDate]);
    const billsInRange = useMemo(() => byRange(bills), [bills, minDate]);
    const cnInRange = useMemo(() => byRange(creditNotes), [creditNotes, minDate]);
    const estInRange = useMemo(() => byRange(estimates), [estimates, minDate]);
    const soInRange = useMemo(() => byRange(salesOrders), [salesOrders, minDate]);
    const poInRange = useMemo(() => byRange(purchaseOrders), [purchaseOrders, minDate]);
    const expInRange = useMemo(() => byRange(expenses), [expenses, minDate]);

    /* ===== KPIs ===== */
    const receivables = useMemo(() => {
        // sum(outstanding) for invoices with status not PAID
        return invInRange.reduce((s, inv) => {
            const total = Number(inv.total || 0);
            const paid = Number(inv.paid || 0);
            const due = Math.max(0, total - paid);
            const isDue = (inv.status || "DUE") !== "PAID" && due > 0;
            return s + (isDue ? due : 0);
        }, 0);
    }, [invInRange]);

    const payables = useMemo(() => {
        return billsInRange.reduce((s, b) => {
            const total = Number(b.total || 0);
            const paid = Number(b.paid || 0);
            const due = Math.max(0, total - paid);
            const isDue = (b.status || "DUE") !== "PAID" && due > 0;
            return s + (isDue ? due : 0);
        }, 0);
    }, [billsInRange]);

    const income = useMemo(() => {
        // naive: sum of invoices (you can switch to payments collection if you track)
        return invInRange.reduce((s, inv) => s + Number(inv.total || 0), 0);
    }, [invInRange]);

    const expenditure = useMemo(() => {
        // bills + standalone expenses
        const billsTotal = billsInRange.reduce((s, b) => s + Number(b.total || 0), 0);
        const expTotal = expInRange.reduce((s, e) => s + Number(e.amount || 0), 0);
        return billsTotal + expTotal;
    }, [billsInRange, expInRange]);

    const topExpenses = useMemo(() => {
        const agg = new Map();
        expInRange.forEach(e => {
            const k = (e.category || "Uncategorized");
            agg.set(k, (agg.get(k) || 0) + Number(e.amount || 0));
        });
        return Array.from(agg.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [expInRange]);

    /* ===== Actions ===== */

    async function createPO(payload) {
        // payload: { vendor:{name}, refNo, items:[{title,qty,price}], total }
        const docData = {
            ...payload,
            status: "OPEN",
            createdAt: serverTimestamp(),
            date: serverTimestamp()
        };
        const ref = await addDoc(collection(db, COLL.purchaseOrders), docData);
        toast.success(`PO ${ref.id} created`);
    }

    async function convertPOtoBill(po) {
        if (!po?.id) return;
        // creates a bill from the PO; idempotency: mark PO as CONVERTED with billId
        await runTransaction(db, async (tx) => {
            const poRef = doc(db, COLL.purchaseOrders, po.id);
            const fresh = await tx.get(poRef);
            if (!fresh.exists) throw new Error("PO not found");

            const data = fresh.data() || {};
            if (data.status === "CONVERTED" && data.billId) {
                throw new Error(`Already converted to Bill ${data.billId}`);
            }

            const billRef = doc(collection(db, COLL.bills));
            tx.set(billRef, {
                vendor: data.vendor || null,
                sourcePO: { id: po.id, refNo: data.refNo || null },
                items: data.items || [],
                total: Number(data.total || 0),
                paid: 0,
                status: "DUE",
                createdAt: serverTimestamp(),
                date: serverTimestamp()
            });

            tx.update(poRef, {
                status: "CONVERTED",
                billId: billRef.id,
                convertedAt: serverTimestamp()
            });
        });

        toast.success("Converted to Bill");
    }

    /* ===== Render ===== */
    return (
        <Page>
            <h2 style={{ margin: "0 0 10px" }}>Accounting</h2>

            <Bar>
                <Row>
                    <Select value={range} onChange={e => setRange(e.target.value)}>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="all">All time</option>
                    </Select>
                </Row>

                <Row>
                    <BtnGhost onClick={() => window.location.reload()}><FiRefreshCw />Refresh</BtnGhost>
                    <Btn onClick={() => setNewPOOpen(true)}><FiPlus />New Purchase Order</Btn>
                </Row>
            </Bar>

            {/* KPIs */}
            <CardGrid>
                <Kpi>
                    <small>Total Receivables</small>
                    <b>{money(receivables)}</b>
                    <Tag $warn={receivables > 0}>{receivables > 0 ? "Due" : "Clear"}</Tag>
                </Kpi>
                <Kpi>
                    <small>Total Payables</small>
                    <b>{money(payables)}</b>
                    <Tag $warn={payables > 0}>{payables > 0 ? "Due" : "Clear"}</Tag>
                </Kpi>
                <Kpi>
                    <small>Income (range)</small>
                    <b>{money(income)}</b>
                </Kpi>
                <Kpi>
                    <small>Expenditure (range)</small>
                    <b>{money(expenditure)}</b>
                </Kpi>
            </CardGrid>

            {/* Top Expenses */}
            <Card>
                <Head>
                    <Title>Top Expenses</Title>
                    <Row>
                        <BtnGhost onClick={() => exportCsv(
                            "top-expenses.csv",
                            topExpenses,
                            [{ key: "category", label: "Category" }, { key: "amount", label: "Amount" }]
                        )}><FiDownload />CSV</BtnGhost>
                    </Row>
                </Head>
                <Table>
                    <thead><tr><th>Category</th><th style={{ width: 200, textAlign: "right" }}>Amount</th></tr></thead>
                    <tbody>
                        {topExpenses.map((e, i) => (
                            <tr key={i}>
                                <td>{e.category}</td>
                                <td style={{ textAlign: "right" }}><b>{money(e.amount)}</b></td>
                            </tr>
                        ))}
                        {!topExpenses.length && <tr><td colSpan={2} style={{ color: C.sub }}>No expenses in range.</td></tr>}
                    </tbody>
                </Table>
            </Card>

            {/* Sales Invoices */}
            <SectionCard
                title="Sales Invoices"
                icon={<FiFileText />}
                rows={invInRange}
                columns={[
                    { key: "id", label: "Invoice ID" },
                    { key: "customerName", label: "Customer" },
                    { key: "dateTxt", label: "Date" },
                    { key: "status", label: "Status" },
                    { key: "totalTxt", label: "Total" },
                    { key: "dueTxt", label: "Outstanding" },
                ]}
                refEl={invRef}
                mapRow={(r) => ({
                    id: r.id,
                    customerName: r.customer?.name || "-",
                    dateTxt: ts(r.date),
                    status: r.status || "DUE",
                    totalTxt: money(r.total),
                    dueTxt: money(Math.max(0, Number(r.total || 0) - Number(r.paid || 0)))
                })}
            />

            {/* Credit Notes */}
            <SectionCard
                title="Credit Notes"
                icon={<FiCreditCard />}
                rows={cnInRange}
                columns={[
                    { key: "id", label: "Note ID" },
                    { key: "customerName", label: "Customer" },
                    { key: "dateTxt", label: "Date" },
                    { key: "amountTxt", label: "Amount" },
                ]}
                refEl={cnRef}
                mapRow={(r) => ({
                    id: r.id,
                    customerName: r.customer?.name || "-",
                    dateTxt: ts(r.date),
                    amountTxt: money(r.amount)
                })}
            />

            {/* Estimates */}
            <SectionCard
                title="Estimates"
                icon={<FiFileText />}
                rows={estInRange}
                columns={[
                    { key: "id", label: "Estimate ID" },
                    { key: "customerName", label: "Customer" },
                    { key: "dateTxt", label: "Date" },
                    { key: "status", label: "Status" },
                    { key: "totalTxt", label: "Total" },
                ]}
                refEl={estRef}
                mapRow={(r) => ({
                    id: r.id,
                    customerName: r.customer?.name || "-",
                    dateTxt: ts(r.date),
                    status: r.status || "-",
                    totalTxt: money(r.total)
                })}
            />

            {/* Sales Orders */}
            <SectionCard
                title="Sales Orders"
                icon={<FiShoppingCart />}
                rows={soInRange}
                columns={[
                    { key: "id", label: "SO ID" },
                    { key: "customerName", label: "Customer" },
                    { key: "dateTxt", label: "Date" },
                    { key: "status", label: "Status" },
                    { key: "totalTxt", label: "Total" },
                    { key: "lines", label: "Lines" },
                ]}
                refEl={soRef}
                mapRow={(r) => ({
                    id: r.id,
                    customerName: r.customer?.name || "-",
                    dateTxt: ts(r.date),
                    status: r.status || "-",
                    totalTxt: money(r.total),
                    lines: Array.isArray(r.items) ? r.items.length : 0
                })}
            />

            {/* Purchase Orders + Convert to Bill */}
            <Card ref={poRef}>
                <Head>
                    <Title>Purchase Orders</Title>
                    <Row>
                        <BtnGhost onClick={() => exportCsv(
                            "purchase-orders.csv",
                            poInRange.map(r => ({
                                id: r.id, vendor: r.vendor?.name || "-",
                                date: ts(r.date), status: r.status || "OPEN",
                                total: Number(r.total || 0)
                            })),
                            [
                                { key: "id", label: "PO ID" },
                                { key: "vendor", label: "Vendor" },
                                { key: "date", label: "Date" },
                                { key: "status", label: "Status" },
                                { key: "total", label: "Total" }
                            ]
                        )}><FiDownload />CSV</BtnGhost>
                        <BtnGhost onClick={() => printNode(poRef)}><FiPrinter />Print / PDF</BtnGhost>
                        <Btn onClick={() => setNewPOOpen(true)}><FiPlus />New PO</Btn>
                    </Row>
                </Head>
                <Table>
                    <thead>
                        <tr>
                            <th>PO ID</th><th>Vendor</th><th>Date</th><th>Status</th><th>Total</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {poInRange.map(po => (
                            <tr key={po.id}>
                                <td>{po.id}</td>
                                <td>{po.vendor?.name || "-"}</td>
                                <td>{ts(po.date)}</td>
                                <td>
                                    {po.status === "CONVERTED"
                                        ? <Tag $ok>CONVERTED</Tag>
                                        : <Tag>OPEN</Tag>}
                                </td>
                                <td><b>{money(po.total)}</b></td>
                                <td>
                                    {po.status !== "CONVERTED" ? (
                                        <Row>
                                            <Btn onClick={() => convertPOtoBill(po)}><FiArrowRightCircle />Convert to Bill</Btn>
                                        </Row>
                                    ) : (
                                        <span style={{ color: C.sub }}>Bill ID: {po.billId || "-"}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!poInRange.length && (
                            <tr><td colSpan={6} style={{ color: C.sub }}>No purchase orders.</td></tr>
                        )}
                    </tbody>
                </Table>
            </Card>

            {/* Modal */}
            <NewPOModal
                open={newPOOpen}
                onClose={() => setNewPOOpen(false)}
                onCreate={createPO}
            />
        </Page>
    );
}

/* ===== Shared SectionCard (list + CSV + Print/PDF) ===== */

function SectionCard({ title, icon, rows, columns, mapRow, refEl }) {
    const printableRef = refEl || useRef(null);
    const csvRows = rows.map(mapRow);

    return (
        <Card ref={printableRef}>
            <Head>
                <Title style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ opacity: .9 }}>{icon}</span> {title}
                </Title>
                <Row>
                    <BtnGhost onClick={() => exportCsv(
                        `${title.replace(/\s+/g, '-').toLowerCase()}.csv`,
                        csvRows,
                        columns
                    )}><FiDownload />CSV</BtnGhost>
                    <BtnGhost onClick={() => printNode(printableRef)}><FiPrinter />Print / PDF</BtnGhost>
                </Row>
            </Head>
            <Table>
                <thead>
                    <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
                </thead>
                <tbody>
                    {csvRows.map((r, i) => (
                        <tr key={i}>
                            {columns.map(c => <td key={c.key}>{r[c.key]}</td>)}
                        </tr>
                    ))}
                    {!csvRows.length && (
                        <tr><td colSpan={columns.length} style={{ color: C.sub }}>No records.</td></tr>
                    )}
                </tbody>
            </Table>
        </Card>
    );
}

/* ===== tiny util ===== */
function ts(val) {
    if (!val) return "-";
    const d = val?.seconds ? new Date(val.seconds * 1000) : (val?.toDate ? val.toDate() : new Date(val));
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
