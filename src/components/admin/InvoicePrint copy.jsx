import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { db } from "../../firebase/firebase";
import {
    doc, getDoc, collection, query, where, getDocs
} from "firebase/firestore";

const P = { text: "#111827", sub: "#6b7280", border: "#e5e7eb", faint: "#f3f4f6" };

const Paper = styled.div`
  background:#fff; color:${P.text}; width: 210mm; min-height: 297mm; margin: 10px auto; padding: 16mm 14mm;
  box-shadow: 0 8px 18px rgba(0,0,0,.12);
  @media print { box-shadow:none; margin:0; width:auto; min-height:auto; padding:0; }
`;
const Row = styled.div`display:flex; gap:14px; align-items:flex-start; justify-content:space-between;`;
const Line = styled.div`height:1px; background:${P.border}; margin:10px 0;`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:12px;
  th,td{ border-bottom:1px solid ${P.border}; padding:8px; vertical-align:top; }
  th{text-align:left; color:${P.sub}; font-weight:600;}
  tfoot td{ font-weight:700; }
`;
const Badge = styled.span`border:1px solid ${P.border}; border-radius:6px; padding:2px 6px; font-size:11px; color:${P.sub}`;
const PrintBar = styled.div`
  display:flex; justify-content:center; gap:8px; margin:12px 0;
  @media print { display:none; }
`;

function money(v) { return `₹ ${Number(v || 0).toLocaleString("en-IN")}`; }

export default function InvoicePrint({ invoiceId, orderId }) {
    const [invoice, setInvoice] = useState(null);

    useEffect(() => {
        (async () => {
            if (invoiceId) {
                const snap = await getDoc(doc(db, "invoices", invoiceId));
                if (snap.exists()) setInvoice({ id: snap.id, ...snap.data() });
            } else if (orderId) {
                const qy = query(collection(db, "invoices"), where("orderId", "==", orderId));
                const s = await getDocs(qy);
                if (!s.empty) {
                    const d = s.docs[0]; setInvoice({ id: d.id, ...d.data() });
                } else {
                    console.warn("No invoice found for this order. Generate first.");
                }
            }
        })();
    }, [invoiceId, orderId]);

    const totals = useMemo(() => ({
        subtotal: Number(invoice?.pricing?.subtotal || 0),
        gst: Number(invoice?.pricing?.gst || 0),
        total: Number(invoice?.pricing?.total || 0),
    }), [invoice]);

    if (!invoice) return (
        <div style={{ padding: 20, color: "#fff" }}>
            <div style={{ margin: "0 auto", maxWidth: 960, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", padding: 12, borderRadius: 12 }}>
                Invoice not found. Generate an invoice from Sales/Orders.
            </div>
        </div>
    );

    const cfg = invoice.billConfig || {};
    const dt = invoice.createdAt?.toDate?.() || null;

    return (
        <>
            <PrintBar>
                <button onClick={() => window.print()} style={{ border: "1px solid #ddd", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>Print</button>
            </PrintBar>

            <Paper>
                {/* Header */}
                <Row>
                    <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ fontSize: 20, fontWeight: 900 }}>{cfg.title || "Invoice"}</div>
                        {cfg.subTitle ? <div style={{ color: P.sub }}>{cfg.subTitle}</div> : null}
                        {cfg.address ? <div style={{ whiteSpace: "pre-wrap", color: P.sub }}>{cfg.address}</div> : null}
                        <div style={{ display: "flex", gap: 12, color: P.sub }}>
                            {cfg.phone ? <div>📞 {cfg.phone}</div> : null}
                            {cfg.email ? <div>✉️ {cfg.email}</div> : null}
                            {cfg.gstin ? <div>GSTIN: {cfg.gstin}</div> : null}
                        </div>
                    </div>
                    {cfg.logoUrl ? (
                        <img alt="logo" src={cfg.logoUrl} style={{ width: 120, height: 60, objectFit: "contain" }} />
                    ) : null}
                </Row>

                <Line />

                {/* Meta */}
                <Row>
                    <div>
                        <div style={{ fontSize: 12, color: P.sub }}>Invoice No</div>
                        <div style={{ fontWeight: 800 }}>{invoice.invoiceNo}</div>
                        <div style={{ fontSize: 12, color: P.sub, marginTop: 6 }}>Invoice Date</div>
                        <div>{dt ? dt.toLocaleDateString() : "-"}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, color: P.sub }}>Order ID</div>
                        <div style={{ fontFamily: "ui-monospace", fontWeight: 700 }}>{invoice.orderId?.slice?.(0, 8)}</div>
                        <div style={{ fontSize: 12, color: P.sub, marginTop: 6 }}>Payment</div>
                        <div>{invoice.payment?.mode} · <Badge>{invoice.payment?.status}</Badge></div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: P.sub }}>Bill To</div>
                        <div>{invoice.customer?.email || "-"}</div>
                    </div>
                </Row>

                {/* Items */}
                <div style={{ marginTop: 12 }}>
                    <Table>
                        <thead>
                            <tr>
                                <th style={{ width: "50%" }}>Item</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(invoice.items || []).map((it, i) => (
                                <tr key={i}>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{it.title}</div>
                                        <div style={{ color: P.sub }}>{it.subtitle || ""} {it.sizeLabel ? `• ${it.sizeLabel}` : ""}</div>
                                    </td>
                                    <td>{it.qty}</td>
                                    <td>{money(it.price)}</td>
                                    <td>{money(Number(it.qty || 0) * Number(it.price || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr><td colSpan={3} style={{ textAlign: "right" }}>Taxable Value</td><td>{money(totals.subtotal)}</td></tr>
                            <tr><td colSpan={3} style={{ textAlign: "right" }}>GST (5%)</td><td>{money(totals.gst)}</td></tr>
                            <tr><td colSpan={3} style={{ textAlign: "right" }}><b>Grand Total</b></td><td><b>{money(totals.total)}</b></td></tr>
                        </tfoot>
                    </Table>
                </div>

                {/* Footer */}
                {cfg.footerNotes || cfg.terms ? (
                    <div style={{ marginTop: 12, fontSize: 12 }}>
                        {cfg.footerNotes ? <div style={{ whiteSpace: "pre-wrap" }}>{cfg.footerNotes}</div> : null}
                        {cfg.terms ? (
                            <>
                                <div style={{ height: 8 }} />
                                <div style={{ color: P.sub }}>Terms & Conditions</div>
                                <div style={{ whiteSpace: "pre-wrap" }}>{cfg.terms}</div>
                            </>
                        ) : null}
                    </div>
                ) : null}
            </Paper>
        </>
    );
}
