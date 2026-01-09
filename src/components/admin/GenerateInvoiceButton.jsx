import React, { useState } from "react";
import { db } from "../../firebase/firebase";
import {
    addDoc, collection, doc, getDoc, getDocs, limit, query, runTransaction, serverTimestamp, where
} from "firebase/firestore";
import { toast } from "react-toastify";

function formatInvoiceNo(seq, d = new Date()) {
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const s = String(seq).padStart(4, "0");
    return `INV-${yy}-${mm}-${s}`;
}

async function getOrCreateInvoice(orderId) {
    // 1) already has an invoice?
    const qy = query(collection(db, "invoices"), where("orderId", "==", orderId), limit(1));
    const s = await getDocs(qy);
    if (!s.empty) {
        const d = s.docs[0];
        return { id: d.id, ...d.data() };
    }

    // 2) fetch order
    const oSnap = await getDoc(doc(db, "orders", orderId));
    if (!oSnap.exists()) throw new Error("Order not found");
    const order = { id: oSnap.id, ...oSnap.data() };

    // 3) read bill config snapshot
    const cfgSnap = await getDoc(doc(db, "settings", "billConfig"));
    const billConfig = cfgSnap.exists() ? cfgSnap.data() : {};

    // 4) allocate invoice number atomically
    const seq = await runTransaction(db, async (tx) => {
        const ref = doc(db, "counters", "invoiceSeq");
        const snap = await tx.get(ref);
        const current = snap.exists() ? Number(snap.data().value || 0) : 0;
        const next = current + 1;
        tx.set(ref, { value: next }, { merge: true });
        return next;
    });
    const invoiceNo = formatInvoiceNo(seq);

    // 5) write invoice snapshot (immutable)
    const payload = {
        createdAt: serverTimestamp(),
        invoiceNo,
        orderId: order.id,
        customer: order.customer || null,
        items: order.items || [],
        pricing: order.pricing || null,
        payment: order.payment || null,
        statusAtCreation: order.status || "NEW",
        billConfig, // snapshot for historical correctness
    };
    const ref = await addDoc(collection(db, "invoices"), payload);
    return { id: ref.id, ...payload };
}

export default function GenerateInvoiceButton({ orderId, onOpen }) {
    const [busy, setBusy] = useState(false);

    async function onClick() {
        if (!orderId) return;
        setBusy(true);
        try {
            const inv = await getOrCreateInvoice(orderId);
            toast.success(`Invoice ready: ${inv.invoiceNo}`);
            onOpen?.(inv); // parent can route to /admin/invoice/:id or open a modal
            // fallback: open a print view route if you wired it
            // window.open(`/admin/invoice/${inv.id}`, "_blank");
        } catch (e) {
            console.error(e);
            toast.error(e?.message || "Failed to generate invoice");
        } finally { setBusy(false); }
    }

    return (
        <button
            onClick={onClick}
            disabled={busy}
            style={{
                border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.10)",
                color: "#e7efff", borderRadius: 8, padding: "6px 10px", cursor: "pointer"
            }}
            title="Generate / Open invoice"
        >
            {busy ? "Working…" : "Generate Bill"}
        </button>
    );
}
