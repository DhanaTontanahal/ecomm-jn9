// src/pages/purchases/Expenses.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import {
    FiPlus,
    FiSearch,
    FiX,
    FiDownload,
    FiEdit3,
} from "react-icons/fi";
import {
    Page,
    Head,
    Input,
    Select,
    Btn,
    Card,
    Table,
    DrawerWrap,
    Drawer,
    DrawerHead,
    Grid2,
    C,
} from "./purchasesUI";

/* ================= Expense Form ================= */

function ExpenseForm({ initial, vendors, expenseAccounts, onClose }) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        date:
            initial?.date?.toDate?.()?.toISOString().slice(0, 10) ||
            new Date().toISOString().slice(0, 10),
        vendorId: initial?.vendorId || "",
        category: initial?.category || "",
        reference: initial?.reference || "",
        amount: initial?.amount || 0,
        tax: initial?.tax || 0,
        notes: initial?.notes || "",
        attachmentUrl: initial?.attachmentUrl || "",
        status: initial?.status || "BOOKED", // BOOKED | PAID
        expenseAccountId: initial?.expenseAccountId || "",
        paymentMode: initial?.paymentMode || "BANK", // BANK | CASH (for PAID)
    });

    const onChange = (field) => (e) => {
        setForm((f) => ({
            ...f,
            [field]: e.target.value,
        }));
    };

    async function save() {
        if (!form.vendorId || !form.category || !Number(form.amount)) {
            alert("Vendor, category and amount are required.");
            return;
        }
        if (!form.expenseAccountId) {
            alert("Please select an Expense Account (COA).");
            return;
        }

        setSaving(true);

        const amountNum = Number(form.amount || 0);
        const taxNum = Number(form.tax || 0);
        const total = amountNum + taxNum;

        const payload = {
            vendorId: form.vendorId,
            category: form.category,
            reference: form.reference || null,
            amount: amountNum,
            tax: taxNum,
            total,
            notes: form.notes || null,
            attachmentUrl: form.attachmentUrl || null,
            status: form.status,
            expenseAccountId: form.expenseAccountId,
            paymentMode: form.paymentMode || "BANK",
            date: new Date(form.date),
            updatedAt: serverTimestamp(),
            ...(initial?.id ? {} : { createdAt: serverTimestamp() }),
        };

        try {
            if (initial?.id) {
                await updateDoc(doc(db, "expenses", initial.id), payload);
            } else {
                await addDoc(collection(db, "expenses"), payload);
            }
            onClose(true);
        } finally {
            setSaving(false);
        }
    }

    return (
        <DrawerWrap>
            <Drawer>
                <DrawerHead>
                    <h3 style={{ margin: 0 }}>
                        {initial?.id ? "Edit Expense" : "New Expense"}
                    </h3>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Btn onClick={save} disabled={saving}>
                            {saving ? "Saving…" : "Save"}
                        </Btn>
                        <Btn
                            as="button"
                            style={{
                                background: "transparent",
                                border: `1px solid ${C.border}`,
                                color: C.text,
                            }}
                            onClick={onClose}
                        >
                            <FiX /> Close
                        </Btn>
                    </div>
                </DrawerHead>

                <div style={{ padding: 12, display: "grid", gap: 10 }}>
                    <Grid2>
                        <Input
                            type="date"
                            value={form.date}
                            onChange={onChange("date")}
                        />
                        <Select
                            value={form.vendorId}
                            onChange={onChange("vendorId")}
                        >
                            <option value="">Select Vendor</option>
                            {vendors.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.displayName}
                                </option>
                            ))}
                        </Select>
                    </Grid2>

                    <Grid2>
                        <Input
                            placeholder="Category (e.g., Office Supplies)"
                            value={form.category}
                            onChange={onChange("category")}
                        />
                        <Input
                            placeholder="Reference (optional)"
                            value={form.reference}
                            onChange={onChange("reference")}
                        />
                    </Grid2>

                    {/* Expense Account (COA) + Payment Mode */}
                    <Grid2>
                        <Select
                            value={form.expenseAccountId}
                            onChange={onChange("expenseAccountId")}
                        >
                            <option value="">Select Expense Account (COA)</option>
                            {expenseAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code ? `${acc.code} – ${acc.name}` : acc.name}
                                </option>
                            ))}
                        </Select>
                        <Select
                            value={form.paymentMode}
                            onChange={onChange("paymentMode")}
                        >
                            <option value="BANK">Bank / UPI</option>
                            <option value="CASH">Cash</option>
                        </Select>
                    </Grid2>

                    <Grid2>
                        <Input
                            type="number"
                            placeholder="Amount"
                            value={form.amount}
                            onChange={onChange("amount")}
                        />
                        <Input
                            type="number"
                            placeholder="Tax"
                            value={form.tax}
                            onChange={onChange("tax")}
                        />
                    </Grid2>

                    <Grid2>
                        <Select
                            value={form.status}
                            onChange={onChange("status")}
                        >
                            <option>BOOKED</option>
                            <option>PAID</option>
                        </Select>
                        <Input
                            placeholder="Attachment URL (optional)"
                            value={form.attachmentUrl}
                            onChange={onChange("attachmentUrl")}
                        />
                    </Grid2>

                    <textarea
                        rows={5}
                        style={{
                            width: "100%",
                            background: C.glass2,
                            color: C.text,
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                            padding: 10,
                        }}
                        placeholder="Notes"
                        value={form.notes}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, notes: e.target.value }))
                        }
                    />
                </div>
            </Drawer>
        </DrawerWrap>
    );
}

/* ================= Page ================= */

export default function Expenses() {
    const [rows, setRows] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [expenseAccounts, setExpenseAccounts] = useState([]);
    const [qstr, setQstr] = useState("");
    const [open, setOpen] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, "expenses"), orderBy("date", "desc")),
            (s) => setRows(s.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        const unsubV = onSnapshot(
            query(collection(db, "vendors"), orderBy("displayName", "asc")),
            (s) => setVendors(s.docs.map((d) => ({ id: d.id, ...d.data() })))
        );

        // load COA expense accounts (active)
        const unsubCoa = onSnapshot(
            collection(db, "chartOfAccounts"),
            (s) => {
                const all = s.docs.map((d) => ({ id: d.id, ...d.data() }));
                const onlyExpense = all.filter(
                    (a) => a.type === "EXPENSE" && a.isActive !== false
                );
                setExpenseAccounts(
                    onlyExpense.sort((a, b) =>
                        String(a.code || "").localeCompare(String(b.code || ""))
                    )
                );
            }
        );

        return () => {
            unsub();
            unsubV();
            unsubCoa();
        };
    }, []);

    const filtered = useMemo(() => {
        const t = qstr.trim().toLowerCase();
        if (!t) return rows;
        return rows.filter((r) => {
            const v = vendors.find((v) => v.id === r.vendorId);
            return [r.category, r.reference, v?.displayName]
                .some((x) =>
                    String(x || "")
                        .toLowerCase()
                        .includes(t)
                );
        });
    }, [rows, qstr, vendors]);

    const vendorName = (id) =>
        vendors.find((v) => v.id === id)?.displayName || "-";

    const accountName = (id) =>
        expenseAccounts.find((a) => a.id === id)?.name || "-";

    function exportExpense(r) {
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(`<html><body style="font-family:system-ui;padding:24px">
      <h2>Expense</h2>
      <p><b>Date:</b> ${r.date?.toDate?.()?.toLocaleDateString?.() || ""
            }</p>
      <p><b>Vendor:</b> ${vendorName(r.vendorId)}</p>
      <p><b>Category:</b> ${r.category}</p>
      <p><b>Expense Account (COA):</b> ${accountName(
                r.expenseAccountId
            )}</p>
      <p><b>Reference:</b> ${r.reference || "-"}</p>
      <p><b>Amount:</b> ₹ ${r.amount} &nbsp; <b>Tax:</b> ₹ ${r.tax
            } &nbsp; <b>Total:</b> ₹ ${r.total}</p>
      <p><b>Status:</b> ${r.status} &nbsp; <b>Payment Mode:</b> ${r.paymentMode || "-"
            }</p>
      <hr/><pre>${JSON.stringify(r, null, 2)}</pre>
      <script>window.print()</script>
    </body></html>`);
        w.document.close();
    }

    return (
        <Page>
            <Head>
                <div style={{ position: "relative", flex: 1 }}>
                    <Input
                        placeholder="Search vendor / category / ref"
                        value={qstr}
                        onChange={(e) => setQstr(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                    <FiSearch
                        style={{
                            position: "absolute",
                            left: 10,
                            top: 12,
                            color: C.sub,
                        }}
                    />
                </div>
                <Btn onClick={() => setOpen({})}>
                    <FiPlus /> New Expense
                </Btn>
            </Head>

            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Vendor</th>
                            <th>Category</th>
                            <th>Account</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((r) => (
                            <tr key={r.id}>
                                <td>
                                    {r.date?.toDate?.()?.toLocaleDateString?.() || ""}
                                </td>
                                <td>{vendorName(r.vendorId)}</td>
                                <td>{r.category}</td>
                                <td>{accountName(r.expenseAccountId)}</td>
                                <td>
                                    ₹ {Number(r.total || 0).toLocaleString("en-IN")}
                                </td>
                                <td>{r.status}</td>
                                <td style={{ display: "flex", gap: 8 }}>
                                    <Btn
                                        as="button"
                                        style={{
                                            background: "transparent",
                                            border: `1px solid ${C.border}`,
                                            color: C.text,
                                        }}
                                        onClick={() => setOpen(r)}
                                    >
                                        <FiEdit3 /> Edit
                                    </Btn>
                                    <Btn
                                        as="button"
                                        style={{
                                            background: "transparent",
                                            border: `1px solid ${C.border}`,
                                            color: C.text,
                                        }}
                                        onClick={() => exportExpense(r)}
                                    >
                                        <FiDownload /> PDF
                                    </Btn>
                                </td>
                            </tr>
                        ))}
                        {!filtered.length && (
                            <tr>
                                <td
                                    colSpan={7}
                                    style={{ color: C.sub, padding: 16 }}
                                >
                                    No expenses yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Card>

            {!!open && (
                <ExpenseForm
                    initial={Object.keys(open).length ? open : null}
                    vendors={vendors}
                    expenseAccounts={expenseAccounts}
                    onClose={() => setOpen(null)}
                />
            )}
        </Page>
    );
}
