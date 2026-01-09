// src/pages/purchases/RecurringExpenses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { FiPlus, FiSearch, FiX, FiPlayCircle, FiEdit3 } from "react-icons/fi";
import { Page, Head, Input, Select, Btn, Card, Table, DrawerWrap, Drawer, DrawerHead, Grid2, C } from "./purchasesUI";

function Form({ initial, vendors, onClose }) {
    const [saving, setSaving] = useState(false);
    const [f, setF] = useState({
        startDate: initial?.startDate?.toDate?.()?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
        frequency: initial?.frequency || "MONTHLY", // DAILY/WEEKLY/MONTHLY/YEARLY
        vendorId: initial?.vendorId || "",
        category: initial?.category || "",
        amount: initial?.amount || 0,
        tax: initial?.tax || 0,
        notes: initial?.notes || "",
        nextOn: initial?.nextOn?.toDate?.()?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
        active: initial?.active ?? true
    });

    async function save() {
        if (!f.vendorId || !f.category || !Number(f.amount)) { alert("Vendor, category, amount required."); return; }
        setSaving(true);
        const payload = {
            vendorId: f.vendorId, category: f.category, amount: Number(f.amount || 0), tax: Number(f.tax || 0),
            notes: f.notes || null, frequency: f.frequency, active: !!f.active,
            startDate: new Date(f.startDate), nextOn: new Date(f.nextOn),
            updatedAt: serverTimestamp(), ...(initial?.id ? {} : { createdAt: serverTimestamp() })
        };
        try {
            if (initial?.id) await updateDoc(doc(db, "recurringExpenses", initial.id), payload);
            else await addDoc(collection(db, "recurringExpenses"), payload);
            onClose(true);
        } finally { setSaving(false); }
    }

    return (
        <DrawerWrap>
            <Drawer>
                <DrawerHead>
                    <h3 style={{ margin: 0 }}>{initial?.id ? "Edit Recurring Expense" : "New Recurring Expense"}</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
                        <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={onClose}><FiX /> Close</Btn>
                    </div>
                </DrawerHead>
                <div style={{ padding: 12, display: "grid", gap: 10 }}>
                    <Grid2>
                        <Input type="date" value={f.startDate} onChange={e => setF({ ...f, startDate: e.target.value })} />
                        <Select value={f.frequency} onChange={e => setF({ ...f, frequency: e.target.value })}>
                            <option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option><option>YEARLY</option>
                        </Select>
                    </Grid2>
                    <Grid2>
                        <Select value={f.vendorId} onChange={e => setF({ ...f, vendorId: e.target.value })}>
                            <option value="">Select Vendor</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.displayName}</option>)}
                        </Select>
                        <Input placeholder="Category" value={f.category} onChange={e => setF({ ...f, category: e.target.value })} />
                    </Grid2>
                    <Grid2>
                        <Input type="number" placeholder="Amount" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
                        <Input type="number" placeholder="Tax" value={f.tax} onChange={e => setF({ ...f, tax: e.target.value })} />
                    </Grid2>
                    <Grid2>
                        <Input type="date" value={f.nextOn} onChange={e => setF({ ...f, nextOn: e.target.value })} />
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> Active</label>
                    </Grid2>
                    <textarea rows={4} style={{ width: "100%", background: C.glass2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }} placeholder="Notes" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
                </div>
            </Drawer>
        </DrawerWrap>
    );
}

export default function RecurringExpenses() {
    const [rows, setRows] = useState([]); const [vendors, setVendors] = useState([]); const [q, setQ] = useState(""); const [open, setOpen] = useState(null);
    useEffect(() => {
        const u = onSnapshot(query(collection(db, "recurringExpenses"), orderBy("startDate", "desc")), s => setRows(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const uv = onSnapshot(query(collection(db, "vendors"), orderBy("displayName", "asc")), s => setVendors(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { u(); uv(); };
    }, []);
    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase(); if (!t) return rows;
        return rows.filter(r => [r.category, vendors.find(v => v.id === r.vendorId)?.displayName].some(x => String(x || "").toLowerCase().includes(t)));
    }, [rows, q, vendors]);
    const vName = id => vendors.find(v => v.id === id)?.displayName || "-";

    async function generateOnce(tpl) {
        // Create a single expense now (manual run)
        await addDoc(collection(db, "expenses"), {
            vendorId: tpl.vendorId, category: tpl.category, reference: `From Recurring ${tpl.id}`,
            amount: tpl.amount, tax: tpl.tax, total: Number(tpl.amount || 0) + Number(tpl.tax || 0),
            notes: tpl.notes || null, status: "BOOKED",
            date: new Date(), createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        alert("Expense generated.");
    }

    return (
        <Page>
            <Head>
                <div style={{ position: "relative", flex: 1 }}>
                    <Input placeholder="Search vendor / category" value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 36 }} />
                    <FiSearch style={{ position: "absolute", left: 10, top: 12, color: C.sub }} />
                </div>
                <Btn onClick={() => setOpen({})}><FiPlus /> New Recurring</Btn>
            </Head>

            <Card>
                <Table>
                    <thead><tr><th>Start</th><th>Vendor</th><th>Category</th><th>Freq</th><th>Amount</th><th>Next On</th><th>Active</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r.id}>
                                <td>{r.startDate?.toDate?.()?.toLocaleDateString?.() || ""}</td>
                                <td>{vName(r.vendorId)}</td>
                                <td>{r.category}</td>
                                <td>{r.frequency}</td>
                                <td>₹ {Number((r.amount || 0) + (r.tax || 0)).toLocaleString("en-IN")}</td>
                                <td>{r.nextOn?.toDate?.()?.toLocaleDateString?.() || ""}</td>
                                <td>{r.active ? "Yes" : "No"}</td>
                                <td style={{ display: "flex", gap: 8 }}>
                                    <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => setOpen(r)}><FiEdit3 /> Edit</Btn>
                                    <Btn as="button" onClick={() => generateOnce(r)}><FiPlayCircle /> Generate Now</Btn>
                                </td>
                            </tr>
                        ))}
                        {!filtered.length && <tr><td colSpan={8} style={{ color: C.sub, padding: 16 }}>No recurring templates.</td></tr>}
                    </tbody>
                </Table>
            </Card>

            {!!open && <Form initial={Object.keys(open).length ? open : null} vendors={vendors} onClose={() => setOpen(null)} />}
        </Page>
    );
}
