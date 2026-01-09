// src/components/admin/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import {
  collection, onSnapshot, orderBy, query, limit, getDocs, where
} from "firebase/firestore";
import { FiTrendingUp, FiShoppingBag, FiUsers, FiAlertTriangle, FiTruck, FiZap, FiFilter } from "react-icons/fi";

/* ===== tokens (match your admin glass UI) ===== */
const C = {
  bg: "#0b1220",
  glass: "rgba(255,255,255,.06)",
  glass2: "rgba(255,255,255,.10)",
  border: "rgba(255,255,255,.14)",
  text: "#e7efff",
  sub: "#b7c6e6",
  ring: "#78c7ff",
  primary: "#4ea1ff",
  ok: "#10b981",
  danger: "#ef4444",
  amber: "#f59e0b",
};

const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

/* ===== layout ===== */
const Page = styled.div`min-height:100dvh;background:${C.bg};color:${C.text};padding:20px;`;
const Head = styled.div`display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;h2{margin:0;font-size:20px}`;
const Card = styled.div`
  background:${C.glass}; border:1px solid ${C.border}; border-radius:14px; padding:12px;
  max-width:1280px; margin:10px auto; animation:${fade} .3s both;
`;
const Grid = styled.div`
  display:grid; gap:10px; grid-template-columns:1fr;
  @media(min-width:980px){ grid-template-columns:repeat(4,1fr); }
`;
const KPI = styled.div`
  border:1px solid ${C.border}; background:${C.glass2}; border-radius:12px; padding:12px; display:grid; gap:6px;
  small{ color:${C.sub}; }
  strong{ font-size:22px; }
  .row{ display:flex; align-items:center; gap:8px; }
`;
const Bar = styled.div`
  display:grid; gap:10px; grid-template-columns:1fr; max-width:1280px; margin:0 auto;
  @media(min-width:980px){ grid-template-columns:140px 180px 1fr; }
`;
const Select = styled.select`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
  -webkit-text-fill-color:${C.text}; color-scheme:dark;
  option{ background:#121a2b; color:${C.text}; }
`;
const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
`;

const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th,td{border-bottom:1px solid ${C.border}; padding:10px; vertical-align:top}
  th{text-align:left; color:${C.sub}; font-weight:600}
  td .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
`;

/* ===== sparkline ===== */
const Spark = styled.svg`width:100%; height:52px;`;
function Sparkline({ data=[] }){
  if (!data.length) return <Spark />;
  const w = 280, h = 52, pad = 4;
  const max = Math.max(...data, 1);
  const step = (w - pad*2) / Math.max(data.length - 1, 1);
  const pts = data.map((v,i) => {
    const x = pad + i*step;
    const y = h - pad - (v/max)*(h - pad*2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <Spark viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={C.primary} strokeWidth="2" points={pts}/>
    </Spark>
  );
}

/* ===== helpers ===== */
const money = n => `₹ ${Number(n||0).toLocaleString("en-IN")}`;
const isSellStatus = s => ["CONFIRMED","PACKED","SHIPPED","DELIVERED"].includes(s) || s==="NEW"; // relax for early pipeline
const todayKey = () => new Date().toDateString();

/* ===== Dashboard ===== */
export default function Dashboard(){
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [range, setRange] = useState("30"); // 7|30|90|ALL
  const [statusScope, setStatusScope] = useState("ALL"); // ALL|DELIVERED_ONLY
  const [q, setQ] = useState("");

  /* ---- live orders (latest 1000) ---- */
  useEffect(() => {
    setLoading(true);
    const qy = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(1000));
    const unsub = onSnapshot(qy, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ---- products (for low stock) ---- */
  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, "products"), where("active","==", true)));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data(), minStock: d.data().minStock ?? 0 })));
    })();
  }, []);

  /* ---- filtering ---- */
  const now = new Date();
  const cutoff = (days) => { const d = new Date(); d.setDate(now.getDate() - Number(days||0)); return d; };
  const within = (ts, days) => {
    if (days==="ALL") return true;
    const dt = ts?.toDate?.() || ts;
    return dt ? dt >= cutoff(days) : false;
  };

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return orders.filter(o => {
      if (!within(o.createdAt, range)) return false;
      if (statusScope==="DELIVERED_ONLY" && o.status!=="DELIVERED") return false;
      if (text){
        const bag = [
          o.id, o.customer?.email, o.customer?.uid,
          ...(o.items||[]).map(i => `${i.title} ${i.subtitle||""} ${i.sizeLabel||""}`)
        ].join(" ").toLowerCase();
        if (!bag.includes(text)) return false;
      }
      return true;
    });
  }, [orders, range, statusScope, q]);

  /* ---- KPIs ---- */
  const sums = useMemo(() => {
    // overall (filtered)
    const ord = filtered;
    const gross = ord.reduce((s,o)=> s + Number(o.pricing?.total||0), 0);
    const net   = ord.reduce((s,o)=> s + Number(o.pricing?.subtotal||0), 0);
    const gst   = ord.reduce((s,o)=> s + Number(o.pricing?.gst||0), 0);
    const count = ord.length;
    const customers = new Set(ord.map(o => o.customer?.uid || o.customer?.email || o.id)).size;
    const aov = count ? Math.round(gross / count) : 0;

    // today
    const tKey = todayKey();
    const today = ord.filter(o => (o.createdAt?.toDate?.()?.toDateString?.() || "") === tKey);
    const tGross = today.reduce((s,o)=> s + Number(o.pricing?.total||0), 0);
    const tOrders = today.length;
    const tAov = tOrders ? Math.round(tGross / tOrders) : 0;

    // payments & ops
    const upiPending = ord.filter(o => o.payment?.mode==="UPI" && o.payment?.status!=="PAID").length;
    const codPending = ord.filter(o => o.payment?.mode==="COD" && o.payment?.status!=="COD_COLLECTED").length;

    return { gross, net, gst, count, customers, aov, tGross, tOrders, tAov, upiPending, codPending };
  }, [filtered]);

  const lowStockCount = useMemo(
    () => products.filter(p => Number(p.stock||0) < Number(p.minStock||0)).length,
    [products]
  );

  /* ---- trend sparkline (gross by day) ---- */
  const byDay = useMemo(() => {
    const m = new Map(); // key: YYYY-MM-DD
    filtered.forEach(o => {
      if (statusScope==="DELIVERED_ONLY" && o.status!=="DELIVERED") return;
      if (!isSellStatus(o.status)) return;
      const d = o.createdAt?.toDate?.();
      if (!d) return;
      const key = d.toISOString().slice(0,10);
      m.set(key, (m.get(key)||0) + Number(o.pricing?.total||0));
    });
    // ensure chronological for chart
    return Array.from(m.entries()).sort((a,b)=> a[0]<b[0] ? -1 : 1).map(([,v])=>v);
  }, [filtered, statusScope]);

  /* ---- top products (qty & revenue) ---- */
  const topProducts = useMemo(() => {
    const map = new Map(); // id/title -> {title, qty, rev}
    filtered.forEach(o => {
      if (o.status==="CANCELLED") return;
      (o.items||[]).forEach(it => {
        const key = it.id || it.title;
        if (!map.has(key)) map.set(key, { title: it.title, size: it.sizeLabel || "", qty: 0, rev: 0 });
        const k = map.get(key);
        k.qty += Number(it.qty||0);
        k.rev += Number(it.qty||0) * Number(it.price||0);
      });
    });
    return Array.from(map.values()).sort((a,b)=> b.rev - a.rev).slice(0, 5);
  }, [filtered]);

  /* ---- recent orders (show 8) ---- */
  const recentOrders = useMemo(() => {
    return [...filtered]
      .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0))
      .slice(0, 8);
  }, [filtered]);

  const goSales = () => nav("/admin/sales");
  const goInventory = () => nav("/admin/inventory");
  const goAccounting = () => nav("/admin/accounting");

  return (
    <Page>
      <Head>
        <h2>Dashboard</h2>
      </Head>

      {/* quick filters */}
      <Card>
        <Bar>
          <Select value={range} onChange={e=>setRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="ALL">All time</option>
          </Select>
          <Select value={statusScope} onChange={e=>setStatusScope(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="DELIVERED_ONLY">Delivered only</option>
          </Select>
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search id / email / item" />
        </Bar>
      </Card>

      {/* today snapshot */}
      <Card>
        <Grid>
          <KPI>
            <div className="row"><FiTrendingUp /> <small>Today · Sales</small></div>
            <strong>{money(sums.tGross)}</strong>
          </KPI>
          <KPI>
            <div className="row"><FiShoppingBag /> <small>Today · Orders</small></div>
            <strong>{sums.tOrders}</strong>
          </KPI>
          <KPI>
            <div className="row"><FiZap /> <small>Today · AOV</small></div>
            <strong>{money(sums.tAov)}</strong>
          </KPI>
          <KPI>
            <div className="row"><FiUsers /> <small>Customers (range)</small></div>
            <strong>{sums.customers}</strong>
          </KPI>
        </Grid>
      </Card>

      {/* main KPIs */}
      <Card>
        <Grid>
          <KPI><small>Total Sales (range)</small><strong>{money(sums.gross)}</strong></KPI>
          <KPI><small>GST (collected)</small><strong>{money(sums.gst)}</strong></KPI>
          <KPI><small>Net Sales (taxable)</small><strong>{money(sums.net)}</strong></KPI>
          <KPI><small>Orders (range)</small><strong>{sums.count}</strong></KPI>
        </Grid>
      </Card>

      {/* ops alerts */}
      <Card>
        <Grid>
          <KPI>
            <div className="row"><FiAlertTriangle/> <small>UPI · Pending verification</small></div>
            <strong>{sums.upiPending}</strong>
            <div style={{fontSize:12, color:C.sub, marginTop:4}}>Go to <a onClick={goAccounting} style={{cursor:"pointer", color:C.text, textDecoration:"underline"}}>Accounting</a></div>
          </KPI>
          <KPI>
            <div className="row"><FiTruck/> <small>COD · Outstanding</small></div>
            <strong>{sums.codPending}</strong>
            <div style={{fontSize:12, color:C.sub, marginTop:4}}>Reconcile in <a onClick={goAccounting} style={{cursor:"pointer", color:C.text, textDecoration:"underline"}}>Accounting</a></div>
          </KPI>
          <KPI>
            <div className="row"><FiAlertTriangle/> <small>Low stock</small></div>
            <strong>{lowStockCount}</strong>
            <div style={{fontSize:12, color:C.sub, marginTop:4}}>Review in <a onClick={goInventory} style={{cursor:"pointer", color:C.text, textDecoration:"underline"}}>Inventory</a></div>
          </KPI>
          <KPI>
            <div className="row"><FiFilter/> <small>Trend (gross)</small></div>
            <Sparkline data={byDay}/>
          </KPI>
        </Grid>
      </Card>

      {/* top products */}
      <Card>
        <div style={{fontWeight:800, marginBottom:6}}>Top Products (by revenue)</div>
        <Table>
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Revenue</th></tr>
          </thead>
          <tbody>
            {!topProducts.length && <tr><td colSpan={3} style={{color:C.sub}}>No data</td></tr>}
            {topProducts.map((p,i)=>(
              <tr key={i}>
                <td>
                  <div style={{fontWeight:700}}>{p.title}</div>
                  {p.size ? <div style={{fontSize:12, color:C.sub}}>{p.size}</div> : null}
                </td>
                <td>{p.qty}</td>
                <td><strong>{money(p.rev)}</strong></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* recent orders */}
      <Card>
        <div style={{fontWeight:800, marginBottom:6}}>Recent Orders</div>
        <Table>
          <thead>
            <tr>
              <th>When</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{color:C.sub}}>Loading…</td></tr>}
            {!loading && !recentOrders.length && <tr><td colSpan={8} style={{color:C.sub}}>No orders.</td></tr>}
            {recentOrders.map(o=>{
              const d = o.createdAt?.toDate?.();
              return (
                <tr key={o.id}>
                  <td>
                    <div>{d ? d.toLocaleDateString() : "-"}</div>
                    <div style={{fontSize:12, color:C.sub}}>{d ? d.toLocaleTimeString() : ""}</div>
                  </td>
                  <td className="mono">{o.id.slice(0,8)}</td>
                  <td>{o.customer?.email || "-"}</td>
                  <td>{(o.items||[]).length}</td>
                  <td><strong>{money(o.pricing?.total)}</strong></td>
                  <td>{o.status}</td>
                  <td>{o.payment?.mode} · <span style={{color:o.payment?.status==="PAID"||o.payment?.status==="COD_COLLECTED"?C.ok:C.amber}}>{o.payment?.status}</span></td>
                  <td><a onClick={goSales} style={{cursor:"pointer", color:C.text, textDecoration:"underline"}}>View</a></td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </Page>
  );
}
