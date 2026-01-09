// src/pages/purchases/VendorPayments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { FiPlus, FiSearch, FiX, FiDownload, FiEdit3 } from "react-icons/fi";
import { Page, Head, Input, Select, Btn, Card, Table, DrawerWrap, Drawer, DrawerHead, Grid2, C } from "./purchasesUI";

function Form({ initial, vendors, onClose }) {
    const [saving, setSaving] = useState(false);
    const [f, setF] = useState({
        date: initial?.date?.toDate?.()?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
        vendorId: initial?.vendorId || "",
        mode: initial?.mode || "CASH", // CASH/UPI/BANK
        refNo: initial?.refNo || "",
        amount: initial?.amount || 0,
        notes: initial?.notes || ""
    });

    async function save() {
        if (!f.vendorId || !Number(f.amount)) { alert("Vendor and amount required."); return; }
        setSaving(true);
        const payload = {
            vendorId: f.vendorId, mode: f.mode, refNo: f.refNo || null, amount: Number(f.amount || 0),
            notes: f.notes || null, date: new Date(f.date),
            updatedAt: serverTimestamp(), ...(initial?.id ? {} : { createdAt: serverTimestamp() })
        };
        try {
            if (initial?.id) await updateDoc(doc(db, "paymentsMade", initial.id), payload);
            else await addDoc(collection(db, "paymentsMade"), payload);
            onClose(true);
        } finally { setSaving(false); }
    }

    return (
        <DrawerWrap>
            <Drawer>
                <DrawerHead>
                    <h3 style={{ margin: 0 }}>{initial?.id ? "Edit Vendor Payment" : "New Vendor Payment"}</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
                        <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={onClose}><FiX /> Close</Btn>
                    </div>
                </DrawerHead>
                <div style={{ padding: 12, display: "grid", gap: 10 }}>
                    <Grid2>
                        <Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
                        <Select value={f.vendorId} onChange={e => setF({ ...f, vendorId: e.target.value })}>
                            <option value="">Select Vendor</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.displayName}</option>)}
                        </Select>
                    </Grid2>
                    <Grid2>
                        <Select value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}>
                            <option>CASH</option><option>UPI</option><option>BANK</option>
                        </Select>
                        <Input placeholder="Reference No (optional)" value={f.refNo} onChange={e => setF({ ...f, refNo: e.target.value })} />
                    </Grid2>
                    <Input type="number" placeholder="Amount" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
                    <textarea rows={4} style={{ width: "100%", background: C.glass2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }} placeholder="Notes" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
                </div>
            </Drawer>
        </DrawerWrap>
    );
}

export default function VendorPayments() {
    const [rows, setRows] = useState([]); const [vendors, setVendors] = useState([]); const [q, setQ] = useState(""); const [open, setOpen] = useState(null);
    useEffect(() => {
        const u = onSnapshot(query(collection(db, "paymentsMade"), orderBy("date", "desc")), s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const uv = onSnapshot(query(collection(db, "vendors"), orderBy("displayName", "asc")), s => setVendors(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { u(); uv(); };
    }, []);
    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase(); if (!t) return rows;
        return rows.filter(r => [vendors.find(v => v.id === r.vendorId)?.displayName, r.refNo, r.mode].some(x => String(x || "").toLowerCase().includes(t)));
    }, [rows, q, vendors]);
    const vName = id => vendors.find(v => v.id === id)?.displayName || "-";

    function exportPay(r) {
        const w = window.open("", "_blank"); if (!w) return;
        w.document.write(`<html><body style="font-family:system-ui;padding:24px">
      <h2>Vendor Payment</h2>
      <p><b>Date:</b> ${r.date?.toDate?.()?.toLocaleDateString?.() || ""}</p>
      <p><b>Vendor:</b> ${vName(r.vendorId)}</p>
      <p><b>Mode:</b> ${r.mode} &nbsp; <b>Ref:</b> ${r.refNo || "-"}</p>
      <p><b>Amount:</b> ₹ ${r.amount}</p>
      <hr/><pre>${JSON.stringify(r, null, 2)}</pre>
      <script>window.print()</script>
    </body></html>`); w.document.close();
    }

    return (
        <Page>
            <Head>
                <div style={{ position: "relative", flex: 1 }}>
                    <Input placeholder="Search vendor / mode / ref" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
                    <FiSearch style={{ position: "absolute", left: 10, top: 12, color: C.sub }} />
                </div>
                <Btn onClick={() => setOpen({})}><FiPlus /> New Payment</Btn>
            </Head>

            <Card>
                <Table>
                    <thead><tr><th>Date</th><th>Vendor</th><th>Mode</th><th>Ref</th><th>Amount</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r.id}>
                                <td>{r.date?.toDate?.()?.toLocaleDateString?.() || ""}</td>
                                <td>{vName(r.vendorId)}</td>
                                <td>{r.mode}</td>
                                <td>{r.refNo || "-"}</td>
                                <td>₹ {Number(r.amount || 0).toLocaleString("en-IN")}</td>
                                <td style={{ display: "flex", gap: 8 }}>
                                    <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => setOpen(r)}><FiEdit3 /> Edit</Btn>
                                    <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => exportPay(r)}><FiDownload /> PDF</Btn>
                                </td>
                            </tr>
                        ))}
                        {!filtered.length && <tr><td colSpan={6} style={{ color: C.sub, padding: 16 }}>No payments recorded.</td></tr>}
                    </tbody>
                </Table>
            </Card>

            {!!open && <Form initial={Object.keys(open).length ? open : null} vendors={vendors} onClose={() => setOpen(null)} />}
        </Page>
    );
}
