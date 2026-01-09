// src/components/admin/InvoicePrint.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { db } from "../../firebase/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const G = createGlobalStyle`
  /* Print tuning */
  @page { size: A4; margin: 12mm; }
  @media print {
    body { background: #fff !important; }
    #print-actions { display:none !important; }
    a { color: inherit; text-decoration: none; }
  }
`;

const P = {
  text: "#0f172a",
  sub: "#475569",
  border: "#e2e8f0",
  faint: "#f8fafc",
  accent: "#0ea5e9",
  ok: "#10b981",
  warn: "#f59e0b",
  danger: "#ef4444",
};

const Shell = styled.div`
  background:#111827; min-height: 100dvh; padding: 12px;
  @media print { background: #fff; padding:0; }
`;

const Paper = styled.div`
  width: 210mm; min-height: 297mm; margin: 0 auto; background:#fff;
  color:${P.text}; padding: 16mm 14mm; box-shadow: 0 12px 28px rgba(0,0,0,.18);
  border-radius: 12px;
  @media print { box-shadow:none; border-radius:0; width:auto; min-height:auto; padding:0; }
`;

const Actions = styled.div`
  display:flex; justify-content:center; gap:8px; margin:12px 0;
  button{
    border:1px solid ${P.border}; background:#fff; color:${P.text};
    padding:10px 14px; border-radius:10px; cursor:pointer;
  }
`;

const Row = styled.div`display:flex; justify-content:space-between; align-items:flex-start; gap: 18px;`;
const Col = styled.div`display:grid; gap:6px;`;
const Hr = styled.div`height:1px; background:${P.border}; margin:12px 0;`;

const Title = styled.div`font-weight: 900; font-size: 22px; letter-spacing:.2px;`;
const Sub = styled.div`color:${P.sub};`;
const MetaLabel = styled.div`font-size:12px; color:${P.sub};`;
const MetaValue = styled.div`font-weight: 800;`;

const Badge = styled.span`
  border: 1px solid ${P.border};
  background: ${({ $tone }) =>
    $tone === "ok"
      ? "rgba(16,185,129,.10)"
      : $tone === "danger"
      ? "rgba(239,68,68,.10)"
      : "rgba(234,179,8,.10)"};
  color: ${({ $tone }) =>
    $tone === "ok" ? P.ok : $tone === "danger" ? P.danger : P.warn};
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
`;


const HeaderBand = styled.div`
  display:flex; justify-content:space-between; gap:16px;
  .info { display:grid; gap:6px; }
  .contacts { display:flex; gap:14px; color:${P.sub}; flex-wrap: wrap; }
  img { width: 120px; height: 60px; object-fit: contain; }
`;

const MetaGrid = styled.div`
  display:grid; grid-template-columns: repeat(3, 1fr); gap:16px;
  @media (max-width: 820px){ grid-template-columns: 1fr; }
`;

const Card = styled.div`
  border:1px solid ${P.border}; background:${P.faint};
  border-radius: 10px; padding: 10px 12px; display:grid; gap:4px;
`;

const Table = styled.table`
  width:100%; border-collapse: collapse; font-size: 12px;
  th, td { padding: 10px 8px; vertical-align: top; }
  thead th {
    text-align:left; color:${P.sub}; font-weight: 700; border-bottom:1px solid ${P.border};
    background:#fff;
  }
  tbody tr:nth-child(even) td { background:${P.faint}; }
  tbody td { border-bottom:1px solid ${P.border}; }
  tfoot td { border-top:2px solid ${P.border}; font-weight:700; }
  .right { text-align:right; }
`;

const TotalsNote = styled.div`font-size: 12px; color:${P.sub};`;

const Footer = styled.div`
  margin-top: 14px; font-size: 12px; display: grid; gap: 10px;
  .section-title { color:${P.sub}; font-weight:700; }
`;

const Signatures = styled.div`
  display:grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px;
  .box{
    border:1px dashed ${P.border}; border-radius:10px; min-height: 70px; padding: 10px 12px;
    display:flex; align-items:end; justify-content:space-between; color:${P.sub}; font-size:12px;
  }
  @media (max-width: 820px){ grid-template-columns:1fr; }
`;

const Watermark = styled.div`
  position:absolute; inset:0; display:grid; place-items:center; pointer-events:none;
  font-size: 80px; font-weight: 900; color:${P.ok};
  opacity:.06; transform: rotate(-18deg);
`;

function money(v){ return `₹ ${Number(v||0).toLocaleString("en-IN")}`; }
const short = (s) => s?.slice?.(0,8) || "-";

export default function InvoicePrint({ invoiceId, orderId }){
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    (async () => {
      if (invoiceId){
        const snap = await getDoc(doc(db,"invoices", invoiceId));
        if (snap.exists()) setInvoice({ id:snap.id, ...snap.data() });
      } else if (orderId){
        const qy = query(collection(db,"invoices"), where("orderId","==", orderId));
        const s = await getDocs(qy);
        if (!s.empty){
          const d = s.docs[0]; setInvoice({ id:d.id, ...d.data() });
        }
      }
    })();
  }, [invoiceId, orderId]);

  const hasHsn = useMemo(
    () => !!(invoice?.items||[]).find(it => it.hsn || it.sac),
    [invoice]
  );

  const totals = useMemo(() => ({
    subtotal: Number(invoice?.pricing?.subtotal||0),
    gst: Number(invoice?.pricing?.gst||0),
    total: Number(invoice?.pricing?.total||0),
  }), [invoice]);

  if (!invoice) {
    return (
      <Shell>
        <G />
        <div style={{
          maxWidth: 960, margin: "24px auto", padding: 16,
          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)",
          color:"#e7efff", borderRadius: 12
        }}>
          Invoice not found. Generate an invoice from <b>Sales</b> using <i>Generate Bill</i>.
        </div>
      </Shell>
    );
  }

  const cfg = invoice.billConfig || {};
  const dt = invoice.createdAt?.toDate?.() || null;
  const paid =
    (invoice.payment?.mode === "UPI" && invoice.payment?.status === "PAID") ||
    (invoice.payment?.mode === "COD" && invoice.payment?.status === "COD_COLLECTED");

  const tone =
    paid ? "ok" : (invoice.payment?.status?.includes("PENDING") ? "warn" : undefined);

  return (
    <Shell>
      <G />
      <div id="print-actions">
        <Actions>
          <button onClick={()=>window.print()}>Print</button>
        </Actions>
      </div>

      <div style={{ position:"relative" }}>
        {paid && <Watermark>PAID</Watermark>}
        <Paper>
          {/* Header */}
          <HeaderBand>
            <div className="info">
              <Title>{cfg.title || "Invoice"}</Title>
              {cfg.subTitle && <Sub>{cfg.subTitle}</Sub>}
              {cfg.address && <Sub style={{ whiteSpace:"pre-wrap" }}>{cfg.address}</Sub>}
              <div className="contacts">
                {cfg.phone && <div>📞 {cfg.phone}</div>}
                {cfg.email && <div>✉️ {cfg.email}</div>}
                {cfg.gstin && <div>GSTIN: {cfg.gstin}</div>}
              </div>
            </div>
            {cfg.logoUrl ? <img src={cfg.logoUrl} alt="logo" /> : null}
          </HeaderBand>

          <Hr />

          {/* Meta */}
          <MetaGrid>
            <Card>
              <MetaLabel>Invoice No</MetaLabel>
              <MetaValue>{invoice.invoiceNo}</MetaValue>
              <MetaLabel style={{ marginTop: 6 }}>Invoice Date</MetaLabel>
              <div>{dt ? dt.toLocaleDateString() : "-"}</div>
            </Card>

            <Card>
              <MetaLabel>Order ID</MetaLabel>
              <MetaValue style={{ fontFamily:"ui-monospace" }}>{short(invoice.orderId)}</MetaValue>
              <MetaLabel style={{ marginTop: 6 }}>Payment</MetaLabel>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div>{invoice.payment?.mode || "-"}</div>
                <Badge $tone={tone}>{invoice.payment?.status}</Badge>
              </div>
            </Card>

            <Card>
              <MetaLabel>Bill To</MetaLabel>
              <div>{invoice.customer?.email || "-"}</div>
            </Card>
          </MetaGrid>

          {/* Items */}
          <div style={{ marginTop: 14 }}>
            <Table>
              <thead>
                <tr>
                  <th style={{ width: "48%" }}>Item</th>
                  {hasHsn && <th>HSN/SAC</th>}
                  <th className="right">Qty</th>
                  <th className="right">Rate</th>
                  <th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((it, i) => {
                  const amt = Number(it.qty||0) * Number(it.price||0);
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{it.title}</div>
                        <div style={{ color: P.sub }}>{[it.subtitle, it.sizeLabel].filter(Boolean).join(" · ")}</div>
                      </td>
                      {hasHsn && <td>{it.hsn || it.sac || "-"}</td>}
                      <td className="right">{it.qty}</td>
                      <td className="right">{money(it.price)}</td>
                      <td className="right">{money(amt)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={hasHsn ? 3 : 2}></td>
                  <td className="right">Taxable Value</td>
                  <td className="right">{money(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={hasHsn ? 3 : 2}></td>
                  <td className="right">GST (5%)</td>
                  <td className="right">{money(totals.gst)}</td>
                </tr>
                <tr>
                  <td colSpan={hasHsn ? 3 : 2}></td>
                  <td className="right"><b>Grand Total</b></td>
                  <td className="right"><b>{money(totals.total)}</b></td>
                </tr>
              </tfoot>
            </Table>

            <TotalsNote style={{ marginTop: 6 }}>
              Amount in words: <b>
                {Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })
                  .format(totals.total)
                  .replace("₹", "Rupees")}
              </b>
            </TotalsNote>
          </div>

          {/* Footer */}
          {(cfg.footerNotes || cfg.terms) && (
            <Footer>
              {cfg.footerNotes && <div>{cfg.footerNotes}</div>}
              {cfg.terms && (
                <>
                  <div className="section-title">Terms & Conditions</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{cfg.terms}</div>
                </>
              )}
            </Footer>
          )}

          {/* Signatures */}
          <Signatures>
            <div className="box"><span>Received By</span><span>Signature</span></div>
            <div className="box"><span>Authorised Signatory</span><span>Seal & Signature</span></div>
          </Signatures>
        </Paper>
      </div>
    </Shell>
  );
}
