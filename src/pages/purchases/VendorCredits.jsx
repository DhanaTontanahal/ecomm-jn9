// src/pages/purchases/VendorCredits.jsx
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
        reason: initial?.reason || "Return/Overpayment",
        amount: initial?.amount || 0,
        balance: (initial?.balance ?? initial?.amount) ?? 0,
        reference: initial?.reference || "",
        notes: initial?.notes || ""
    });

    async function save() {
        if (!f.vendorId || !Number(f.amount)) { alert("Vendor and amount required."); return; }
        setSaving(true);
        const payload = {
            vendorId: f.vendorId, reason: f.reason, amount: Number(f.amount || 0),
            balance: Number((f.balance ?? f.amount) ?? 0),
            reference: f.reference || null, notes: f.notes || null,
            date: new Date(f.date), updatedAt: serverTimestamp(), ...(initial?.id ? {} : { createdAt: serverTimestamp() })
        };
        try {
            if (initial?.id) await updateDoc(doc(db, "vendorCredits", initial.id), payload);
            else await addDoc(collection(db, "vendorCredits"), payload);
            onClose(true);
        } finally { setSaving(false); }
    }

    return (
        <DrawerWrap>
            <Drawer>
                <DrawerHead>
                    <h3 style={{ margin: 0 }}>{initial?.id ? "Edit Vendor Credit" : "New Vendor Credit"}</h3>
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
                        <Input placeholder="Reason" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} />
                        <Input placeholder="Reference (optional)" value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} />
                    </Grid2>
                    <Grid2>
                        <Input type="number" placeholder="Amount" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
                        <Input type="number" placeholder="Balance (unapplied)" value={f.balance} onChange={e => setF({ ...f, balance: e.target.value })} />
                    </Grid2>
                    <textarea rows={4} style={{ width: "100%", background: C.glass2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }} placeholder="Notes" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
                </div>
            </Drawer>
        </DrawerWrap>
    );
}

export default function VendorCredits() {
    const [rows, setRows] = useState([]); const [vendors, setVendors] = useState([]); const [q, setQ] = useState(""); const [open, setOpen] = useState(null);
    useEffect(() => {
        const u = onSnapshot(query(collection(db, "vendorCredits"), orderBy("date", "desc")), s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const uv = onSnapshot(query(collection(db, "vendors"), orderBy("displayName", "asc")), s => setVendors(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { u(); uv(); };
    }, []);
    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase(); if (!t) return rows;
        return rows.filter(r => [vendors.find(v => v.id === r.vendorId)?.displayName, r.reason, r.reference].some(x => String(x || "").toLowerCase().includes(t)));
    }, [rows, q, vendors]);
    const vName = id => vendors.find(v => v.id === id)?.displayName || "-";

    function exportCredit(r) {
        const w = window.open("", "_blank"); if (!w) return;
        w.document.write(`<html><body style="font-family:system-ui;padding:24px">
      <h2>Vendor Credit Note</h2>
      <p><b>Date:</b> ${r.date?.toDate?.()?.toLocaleDateString?.() || ""}</p>
      <p><b>Vendor:</b> ${vName(r.vendorId)}</p>
      <p><b>Reason:</b> ${r.reason}</p>
      <p><b>Amount:</b> ₹ ${r.amount} &nbsp; <b>Unapplied:</b> ₹ ${r.balance}</p>
      <p><b>Reference:</b> ${r.reference || "-"}</p>
      <hr/><pre>${JSON.stringify(r, null, 2)}</pre>
      <script>window.print()</script>
    </body></html>`); w.document.close();
    }

    return (
        <Page>
            <Head>
                <div style={{ position: "relative", flex: 1 }}>
                    <Input placeholder="Search vendor / reason / ref" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
                    <FiSearch style={{ position: "absolute", left: 10, top: 12, color: C.sub }} />
                </div>
                <Btn onClick={() => setOpen({})}><FiPlus /> New Vendor Credit</Btn>
            </Head>

            <Card>
                <Table>
                    <thead><tr><th>Date</th><th>Vendor</th><th>Reason</th><th>Amount</th><th>Unapplied</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r.id}>
                                <td>{r.date?.toDate?.()?.toLocaleDateString?.() || ""}</td>
                                <td>{vName(r.vendorId)}</td>
                                <td>{r.reason}</td>
                                <td>₹ {Number(r.amount || 0).toLocaleString("en-IN")}</td>
                                <td>₹ {Number(r.balance || 0).toLocaleString("en-IN")}</td>
                                <td style={{ display: "flex", gap: 8 }}>
                                    <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => setOpen(r)}><FiEdit3 /> Edit</Btn>
                                    <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => exportCredit(r)}><FiDownload /> PDF</Btn>
                                </td>
                            </tr>
                        ))}
                        {!filtered.length && <tr><td colSpan={6} style={{ color: C.sub, padding: 16 }}>No vendor credits yet.</td></tr>}
                    </tbody>
                </Table>
            </Card>

            {!!open && <Form initial={Object.keys(open).length ? open : null} vendors={vendors} onClose={() => setOpen(null)} />}
        </Page>
    );
}
