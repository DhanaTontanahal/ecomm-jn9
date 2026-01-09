import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Btn, C, Card, Head, KPI, KPIGrid, PageShell, SectionTitle } from "./sales/_shared";

const QuickGrid = styled.div`
  max-width: 1280px;
  margin: 0 auto 18px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const QuickLink = styled(Link)`
  border: 1px solid ${C.border};
  border-radius: 14px;
  padding: 16px;
  background: ${C.glass};
  color: inherit;
  text-decoration: none;
  display: grid;
  gap: 8px;
  transition: transform .15s ease, border-color .15s ease;
  &:hover {
    transform: translateY(-2px);
    border-color: ${C.primary};
  }
  small { color: ${C.sub}; }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
`;

const Item = styled.li`
  border: 1px solid ${C.border};
  background: ${C.glass};
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  small { color: ${C.sub}; }
`;

function tsMs(v) {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Date.parse(v);
  if (v?.toDate) return v.toDate().getTime();
  if (v?.seconds) return v.seconds * 1000;
  return 0;
}

function deriveInvoiceStatus(inv) {
  if (inv.status) return inv.status;
  const pay = inv.payment?.status || "";
  if (!pay) return "DUE";
  if (pay === "PAID" || pay === "COD_COLLECTED") return "PAID";
  if (pay.includes("PENDING")) return "PENDING";
  return pay;
}

export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [legacyInvoices, setLegacyInvoices] = useState([]);
  const [customSales, setCustomSales] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  useEffect(() => {
    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(300)),
      snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubInvoices = onSnapshot(
      query(collection(db, "invoices"), orderBy("createdAt", "desc"), limit(300)),
      snap => setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubLegacyInvoices = onSnapshot(
      query(collection(db, "salesInvoices"), orderBy("createdAt", "desc"), limit(200)),
      snap => setLegacyInvoices(snap.docs.map(d => ({ id: d.id, ...d.data(), _legacy: true }))),
      () => {}
    );
    const unsubCustom = onSnapshot(
      query(collection(db, "customSales"), orderBy("createdAt", "desc"), limit(200)),
      snap => setCustomSales(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubPO = onSnapshot(
      query(collection(db, "purchaseOrders"), orderBy("createdAt", "desc"), limit(200)),
      snap => setPurchaseOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubOrders();
      unsubInvoices();
      unsubLegacyInvoices?.();
      unsubCustom();
      unsubPO();
    };
  }, []);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const orders30 = useMemo(() => orders.filter(o => tsMs(o.createdAt) >= thirtyDaysAgo), [orders, thirtyDaysAgo]);
  const gross30 = useMemo(
    () => orders30.reduce((sum, o) => sum + Number(o.pricing?.total || 0), 0),
    [orders30]
  );
  const delivered30 = useMemo(
    () => orders30.filter(o => o.status === "DELIVERED").length,
    [orders30]
  );
    const linkedOrders = useMemo(
      () => orders.filter(o => o.linkedPurchaseOrder?.id).length,
      [orders]
    );

    const allInvoices = useMemo(() => [...invoices, ...legacyInvoices], [invoices, legacyInvoices]);

    const invoiceDue = useMemo(
      () => allInvoices.filter(inv => deriveInvoiceStatus(inv) !== "PAID"),
      [allInvoices]
    );
  const invoiceDueAmt = useMemo(
    () => invoiceDue.reduce((sum, inv) => {
      const total = inv.total ?? inv.pricing?.total ?? 0;
      const paid = inv.paid ?? inv.payment?.status === "PAID" ? total : 0;
      return sum + Math.max(0, Number(total) - Number(paid || 0));
    }, 0),
    [invoiceDue]
  );

  const custom30 = useMemo(
    () => customSales.filter(cs => tsMs(cs.date || cs.createdAt) >= thirtyDaysAgo),
    [customSales, thirtyDaysAgo]
  );
  const custom30Amount = useMemo(
    () => custom30.reduce((sum, cs) => sum + Number(cs.amount || cs.total || 0), 0),
    [custom30]
  );

  const pendingLinks = useMemo(
    () => orders.filter(o => !o.linkedPurchaseOrder).slice(0, 6),
    [orders]
  );

  const recentCustoms = useMemo(() => customSales.slice(0, 6), [customSales]);

  const openPOs = useMemo(() => purchaseOrders.filter(po => po.status !== "CONVERTED"), [purchaseOrders]);

  return (
    <PageShell>
      <Head>
        <div>
          <h2 style={{ margin: 0 }}>Sales Command Center</h2>
          <div style={{ color: C.sub }}>Zoho-style overview connecting Orders, Invoices, Custom Sales, and Purchases.</div>
        </div>
        <Btn as={Link} to="/admin/sales/orders">Go to Sales Orders</Btn>
      </Head>

      <KPIGrid>
        <KPI>
          <small>Orders (30d)</small>
          <strong>{orders30.length}</strong>
          <small>Delivered: {delivered30}</small>
        </KPI>
        <KPI>
          <small>Gross Sales (30d)</small>
          <strong>₹ {gross30.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
        </KPI>
        <KPI>
          <small>Outstanding Invoices</small>
          <strong>₹ {invoiceDueAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
          <small>{invoiceDue.length} open</small>
        </KPI>
        <KPI>
          <small>Custom Sales Logged (30d)</small>
          <strong>₹ {custom30Amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
          <small>{custom30.length} entries</small>
        </KPI>
        <KPI>
          <small>Orders linked to Purchases</small>
          <strong>{linkedOrders}</strong>
          <small>{openPOs.length} purchase orders open</small>
        </KPI>
      </KPIGrid>

      <QuickGrid>
        <QuickLink to="/admin/sales/orders">
          <div style={{ fontWeight: 700 }}>Sales Orders</div>
          <small>Track every ecommerce order with filters & purchase links.</small>
        </QuickLink>
        <QuickLink to="/admin/sales/invoices">
          <div style={{ fontWeight: 700 }}>Invoices</div>
          <small>Pull invoices generated from orders or legacy Books data.</small>
        </QuickLink>
        <QuickLink to="/admin/sales/payments">
          <div style={{ fontWeight: 700 }}>Payments Received</div>
          <small>Verify UPI and COD collections quickly.</small>
        </QuickLink>
        <QuickLink to="/admin/sales/custom-sales">
          <div style={{ fontWeight: 700 }}>Custom Sales</div>
          <small>Record offline / special sales and tie them to purchase orders.</small>
        </QuickLink>
        <QuickLink to="/admin/purchases/purchase-orders">
          <div style={{ fontWeight: 700 }}>Purchases</div>
          <small>Jump to purchase orders to reconcile demand vs supply.</small>
        </QuickLink>
        <QuickLink to="/admin/sales/desk">
          <div style={{ fontWeight: 700 }}>Sales Desk</div>
          <small>Operational board for live order fulfilment.</small>
        </QuickLink>
      </QuickGrid>

      <Card>
        <SectionTitle>Orders awaiting Purchase linkage</SectionTitle>
        <List>
          {pendingLinks.map(o => (
            <Item key={o.id}>
              <div>
                <div style={{ fontWeight: 700 }}>{o.id.slice(0, 8)}</div>
                <small>{o.customer?.email || "No email"} · {o.status}</small>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn as={Link} to="/admin/sales/orders" state={{ highlight: o.id }}>Link Purchase</Btn>
              </div>
            </Item>
          ))}
          {!pendingLinks.length && (
            <div style={{ color: C.sub }}>All recent orders are linked to purchase orders.</div>
          )}
        </List>
      </Card>

      <Card>
        <SectionTitle>Recent Custom Sales</SectionTitle>
        <List>
          {recentCustoms.map(cs => (
            <Item key={cs.id}>
              <div>
                <div style={{ fontWeight: 700 }}>{cs.customerName || cs.channel || "Custom Sale"}</div>
                <small>{cs.date || new Date(tsMs(cs.createdAt)).toLocaleDateString()} · {cs.channel || "Manual"}</small>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>₹ {Number(cs.amount || cs.total || 0).toLocaleString("en-IN")}</div>
                <small>{cs.linkedPurchaseId ? `Linked to PO ${cs.linkedPurchaseId.slice(0, 6)}` : "No PO link"}</small>
              </div>
            </Item>
          ))}
          {!recentCustoms.length && <div style={{ color: C.sub }}>No custom sales logged yet.</div>}
        </List>
      </Card>
    </PageShell>
  );
}