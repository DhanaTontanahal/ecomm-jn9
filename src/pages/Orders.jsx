// src/pages/Orders.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  collection, doc, getDocs, query, orderBy, limit,
  updateDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  FiRefreshCw, FiSearch, FiEye, FiCheckCircle, FiMinusCircle, FiTruck, FiX,
  FiMail, FiUser, FiPhone
} from "react-icons/fi";

/* ===== Admin glass tokens ===== */
const COLORS = {
  glass: 'rgba(255,255,255,.06)',
  glassBorder: 'rgba(255,255,255,.12)',
  glassHeader: 'rgba(255,255,255,.10)',
  text: '#e7efff',
  subtext: '#b7c6e6',
  ring: '#78c7ff',
  primary: '#4ea1ff',
  danger: '#ef4444',
  ok: '#10b981',
  warn: '#f59e0b',
  bg: '#0b1220',
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

const Wrap = styled.div`
  background:${COLORS.bg};
  color:${COLORS.text};
  padding: clamp(16px,3vw,24px);
  border:1px solid ${COLORS.glassBorder};
  border-radius:14px;
  margin:18px auto;
  max-width:1280px;
`;
const Head = styled.div`
  display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;
  h2{margin:0; font-size:20px}
`;
const Row = styled.div`display:flex; gap:12px; flex-wrap:wrap; align-items:center;`;
const Input = styled.input`
  background:${COLORS.glassHeader}; color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder}; border-radius:10px; padding:9px 10px;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${COLORS.ring} }
`;
const Select = styled.select`
  background:${COLORS.glassHeader}; color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder}; border-radius:10px; padding:9px 10px;
  color-scheme: dark;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${COLORS.ring} }
  option{ background:#121a2b; color:${COLORS.text}; }
`;
const Button = styled.button`
  background:${p => p.$danger ? COLORS.danger : (p.$ok ? COLORS.ok : COLORS.primary)};
  color:#fff; border:none; border-radius:10px; padding:9px 12px; cursor:pointer;
  display:inline-flex; align-items:center; gap:8px;
  &:disabled{opacity:.6; cursor:not-allowed}
`;
const SmallBtn = styled.button`
  background:${COLORS.glassHeader}; color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder}; border-radius:10px; padding:8px 10px; cursor:pointer;
  display:inline-flex; align-items:center; gap:6px;
`;

const Table = styled.table`
  width:100%; border-collapse:collapse; margin-top:12px; font-size:14px; animation:${fade} .35s both;
  th,td{border-bottom:1px solid ${COLORS.glassBorder}; padding:10px; vertical-align:top}
  th{text-align:left; color:${COLORS.subtext}; font-weight:600}
  tbody tr:hover{ background:${COLORS.glassHeader}; }
`;

const StatusBadge = styled.span`
  padding:4px 8px; border-radius:999px; font-weight:700; font-size:12px;
  background:${p => ({
    NEW: "rgba(78,161,255,.18)",
    PROCESSING: "rgba(245,158,11,.18)",
    FULFILLED: "rgba(16,185,129,.18)",
    CANCELLED: "rgba(239,68,68,.18)",
  }[p.$s] || COLORS.glassHeader)};
  color:${p => ({
    NEW: "#93c5fd",
    PROCESSING: "#fbbf24",
    FULFILLED: "#34d399",
    CANCELLED: "#f87171",
  }[p.$s] || COLORS.subtext)};
`;

/* ===== Drawer ===== */
const Backdrop = styled.div`
  position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:80; display:${p => p.$open ? "block" : "none"};
`;
const Drawer = styled.div`
  position:fixed; top:0; right:0; height:100%; width:min(520px, 100vw);
  background:#0d1526; border-left:1px solid ${COLORS.glassBorder}; z-index:90;
  transform: translateX(${p => p.$open ? "0" : "100%"}); transition: transform .25s ease;
  display:grid; grid-template-rows:56px 1fr;
`;
const DrawerHead = styled.div`
  display:flex; align-items:center; justify-content:space-between; padding:0 16px;
  border-bottom:1px solid ${COLORS.glassBorder};
`;
const DrawerBody = styled.div`overflow:auto; padding:12px 16px;`;
const Box = styled.div`
  border:1px solid ${COLORS.glassBorder}; border-radius:12px; padding:12px; background:${COLORS.glassHeader}; margin-bottom:12px;
`;

/* ===== Utils ===== */
function formatTs(ts) {
  if (!ts) return "-";
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : (ts?.toDate ? ts.toDate() : new Date(ts));
  return d.toLocaleString();
}
function custPrimary(c) {
  return (c?.email || c?.name || "—");
}
function custSecondary(c) {
  return (c?.uid || c?.phone || "");
}
function sourceBadgeColor(src) {
  return src === "pos" ? "#fbbf24" : "#93c5fd"; // amber for POS, blue for web/cart
}

async function fetchDeliveryBoys() {
  const qs = await getDocs(query(collection(db, "deliveryBoys"), orderBy("name")));
  return qs.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => b.isActive);
}

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [qstr, setQstr] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // delivery boys
  const [boys, setBoys] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const s = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(500)));
      const list = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setRows(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { fetchDeliveryBoys().then(setBoys).catch(() => setBoys([])); }, []);

  const filtered = useMemo(() => {
    let arr = [...rows];
    if (filterStatus !== "ALL") arr = arr.filter(r => (r.status || "NEW") === filterStatus);
    if (qstr.trim()) {
      const t = qstr.trim().toLowerCase();
      arr = arr.filter(r => {
        const f = [
          r.id,
          r.customer?.email,
          r.customer?.uid,
          r.customer?.name,
          r.customer?.phone
        ].map(x => String(x || "").toLowerCase());
        return f.some(x => x.includes(t));
      });
    }
    if (from) {
      const d = new Date(from + "T00:00:00");
      arr = arr.filter(r => (r.createdAt?.seconds || 0) * 1000 >= d.getTime());
    }
    if (to) {
      const d = new Date(to + "T23:59:59");
      arr = arr.filter(r => (r.createdAt?.seconds || 0) * 1000 <= d.getTime());
    }
    return arr;
  }, [rows, filterStatus, qstr, from, to]);

  const totals = useMemo(() => ({
    count: filtered.length,
    totalAmt: filtered.reduce((s, r) => s + Number(r.pricing?.total || 0), 0),
    gst: filtered.reduce((s, r) => s + Number(r.pricing?.gst || 0), 0)
  }), [filtered]);

  // ✅ update status util
  async function setOrderStatus(id, next, extra = {}) {
    const ref = doc(db, "orders", id);
    const patch = {
      status: next,
      updatedAt: serverTimestamp(),
      ...(next === "FULFILLED" ? { fulfilledAt: serverTimestamp() } : {}),
      ...(next === "CANCELLED" ? { cancelledAt: serverTimestamp() } : {}),
      ...extra,
    };
    await updateDoc(ref, patch);
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...patch } : prev);
  }

  // ✅ assign/override delivery boy
  async function assignDelivery(orderId, boyId) {
    const boy = boys.find(b => b.id === boyId);
    if (!boy) return alert("Invalid delivery boy");
    const patch = {
      deliveryAssignee: { id: boy.id, name: boy.name, phone: boy.phone },
      assignedAt: serverTimestamp()
    };
    await updateDoc(doc(db, "orders", orderId), patch);
    setRows(prev => prev.map(r => r.id === orderId ? { ...r, ...patch } : r));
    if (selected?.id === orderId) setSelected(prev => prev ? { ...prev, ...patch } : prev);
  }

  return (
    <Wrap>
      <Head>
        <h2>Admin · Orders</h2>
        <Row>
          <SmallBtn onClick={load}><FiRefreshCw /> Refresh</SmallBtn>
        </Row>
      </Head>

      {/* Filters */}
      <Row style={{ marginBottom: 10 }}>
        <div style={{ position: "relative" }}>
          <Input
            placeholder="Search order id / email / uid / name / phone"
            value={qstr}
            onChange={e => setQstr(e.target.value)}
            style={{ paddingLeft: 34, minWidth: 300 }}
          />
          <FiSearch style={{ position: "absolute", left: 10, top: 10, color: COLORS.subtext }} />
        </div>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="NEW">NEW</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="FULFILLED">FULFILLED</option>
          <option value="CANCELLED">CANCELLED</option>
        </Select>
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <div style={{ marginLeft: "auto", color: COLORS.subtext }}>
          Showing <b>{totals.count}</b> • Total ₹ <b>{totals.totalAmt}</b> • GST ₹ <b>{totals.gst}</b>
        </div>
      </Row>

      {/* Table */}
      <Table>
        <thead>
          <tr>
            <th>Order</th>
            <th>ZohoItemID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Amounts</th>
            <th>Status / Delivery</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!loading && filtered.map(o => {
            const items = Array.isArray(o.items) ? o.items : [];
            return (
              <tr key={o.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{o.id}</div>
                  {o.pricing?.refNo ? <div style={{ fontSize: 12, color: COLORS.subtext }}>Ref: {o.pricing.refNo}</div> : null}
                </td>
                <td>
                  {o?.zohoItemId}
                </td>
                <td>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      {o.customer?.email ? <FiMail /> : <FiUser />}
                      <span>{custPrimary(o.customer)}</span>
                    </div>
                    {custSecondary(o.customer) && (
                      <div style={{ fontSize: 12, color: COLORS.subtext, display: "flex", alignItems: "center", gap: 6 }}>
                        {o.customer?.uid ? <FiUser /> : <FiPhone />}
                        <span>{custSecondary(o.customer)}</span>
                      </div>
                    )}
                    {o.source && (
                      <div style={{
                        fontSize: 11, fontWeight: 800, width: "fit-content",
                        padding: "2px 8px", borderRadius: 999, color: "#0b1220",
                        background: sourceBadgeColor(o.source)
                      }}>
                        {o.source.toUpperCase()}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div><b>{items.reduce((s, i) => s + Number(i.qty || 0), 0)}</b> pcs</div>
                  <div style={{ fontSize: 12, color: COLORS.subtext }}>{items.length} lines</div>
                </td>
                <td>
                  <div>Subtotal: ₹ {o.pricing?.subtotal ?? 0}</div>
                  <div>GST: ₹ {o.pricing?.gst ?? 0}</div>
                  <div style={{ fontWeight: 700 }}>Total: ₹ {o.pricing?.total ?? 0}</div>
                </td>
                <td>
                  <StatusBadge $s={o.status || "NEW"}>{o.status || "NEW"}</StatusBadge>
                  <div style={{ marginTop: 6, fontSize: 12, color: COLORS.subtext }}>
                    {o.deliveryAssignee?.name
                      ? <>Rider: <b>{o.deliveryAssignee.name}</b> ({o.deliveryAssignee.phone})</>
                      : <>Rider: <i>Unassigned</i></>}
                  </div>
                </td>
                <td>
                  <div>{formatTs(o.createdAt)}</div>
                  {o.fulfilledAt ? <div style={{ fontSize: 12, color: COLORS.subtext }}>Fulfilled: {formatTs(o.fulfilledAt)}</div> : null}
                </td>
                <td>
                  <Row>
                    <SmallBtn onClick={() => setSelected(o)}><FiEye /> View</SmallBtn>
                    {(o.status !== "FULFILLED" && o.status !== "CANCELLED") && (
                      <>
                        <SmallBtn onClick={() => setOrderStatus(o.id, "PROCESSING")}><FiTruck /> Processing</SmallBtn>
                        <SmallBtn onClick={() => setOrderStatus(o.id, "FULFILLED")}><FiCheckCircle /> Fulfill</SmallBtn>
                        <SmallBtn onClick={() => setOrderStatus(o.id, "CANCELLED")}><FiMinusCircle /> Cancel</SmallBtn>
                      </>
                    )}
                  </Row>
                </td>
              </tr>
            );
          })}
          {loading && (
            <tr><td colSpan={7} style={{ color: COLORS.subtext, padding: 16 }}>Loading orders…</td></tr>
          )}
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={7} style={{ color: COLORS.subtext, padding: 16 }}>No orders match the filters.</td></tr>
          )}
        </tbody>
      </Table>

      {/* Drawer: order details */}
      <Backdrop $open={!!selected} onClick={() => setSelected(null)} />
      <Drawer $open={!!selected} onClick={e => e.stopPropagation()}>
        <DrawerHead>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Order Details</h3>
            {selected && <StatusBadge $s={selected.status || "NEW"}>{selected.status || "NEW"}</StatusBadge>}
          </div>
          <SmallBtn onClick={() => setSelected(null)}><FiX /> Close</SmallBtn>
        </DrawerHead>
        <DrawerBody>
          {!selected ? null : (
            <>
              <Box>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ color: COLORS.subtext, fontSize: 12 }}>Order ID</div>
                    <div style={{ fontWeight: 700 }}>{selected.id}</div>
                  </div>
                  <div>
                    <div style={{ color: COLORS.subtext, fontSize: 12 }}>Placed</div>
                    <div>{formatTs(selected.createdAt)}</div>
                  </div>
                  <div>
                    <div style={{ color: COLORS.subtext, fontSize: 12 }}>Customer</div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        {selected.customer?.email ? <FiMail /> : <FiUser />}
                        <span>{custPrimary(selected.customer)}</span>
                      </div>
                      {custSecondary(selected.customer) && (
                        <div style={{ fontSize: 12, color: COLORS.subtext, display: "flex", alignItems: "center", gap: 6 }}>
                          {selected.customer?.uid ? <FiUser /> : <FiPhone />}
                          <span>
                            {selected.customer?.phone
                              ? <a href={`tel:${selected.customer.phone}`} style={{ color: COLORS.text, textDecoration: "underline" }}>{selected.customer.phone}</a>
                              : custSecondary(selected.customer)}
                          </span>
                        </div>
                      )}
                      {selected.source && (
                        <div style={{
                          fontSize: 11, fontWeight: 800, width: "fit-content",
                          padding: "2px 8px", borderRadius: 999, color: "#0b1220",
                          background: sourceBadgeColor(selected.source)
                        }}>
                          {selected.source.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: COLORS.subtext, fontSize: 12 }}>Fulfilled</div>
                    <div>{selected.fulfilledAt ? formatTs(selected.fulfilledAt) : "—"}</div>
                  </div>
                </div>
              </Box>

              <Box>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Items</div>
                {(selected.items || []).map((it, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "64px 1fr auto", gap: 10, padding: "8px 0", borderBottom: `1px dashed ${COLORS.glassBorder}` }}>
                    {it.imageUrl ? <img src={it.imageUrl} alt="" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 8, background: "#111827" }} /> : <div style={{ width: 64, height: 64, background: "#111827", borderRadius: 8 }} />}
                    <div>
                      <div style={{ fontWeight: 700 }}>{it.title}</div>
                      <div style={{ fontSize: 12, color: COLORS.subtext }}>{it.subtitle} {it.sizeLabel ? `• ${it.sizeLabel}` : ""}</div>
                      <div style={{ fontSize: 12 }}>₹ {it.price} × {it.qty}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>₹ {Number(it.price || 0) * Number(it.qty || 0)}</div>
                  </div>
                ))}
              </Box>

              {/* Delivery assignment box */}
              <Box>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ color: COLORS.subtext, fontSize: 12 }}>Assigned Delivery Boy</div>
                    <div style={{ fontWeight: 700 }}>
                      {selected?.deliveryAssignee?.name || "Unassigned"}
                      {selected?.deliveryAssignee?.phone ? ` — ${selected.deliveryAssignee.phone}` : ""}
                    </div>
                  </div>
                  <div>
                    <Select
                      value={selected?.deliveryAssignee?.id || ""}
                      onChange={(e) => assignDelivery(selected.id, e.target.value)}
                    >
                      <option value="">Select delivery boy…</option>
                      {boys.map(b => (
                        <option key={b.id} value={b.id}>{b.name} — {b.phone}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </Box>

              <Box>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>Subtotal</div><div style={{ textAlign: "right" }}>₹ {selected.pricing?.subtotal ?? 0}</div>
                  <div>GST</div><div style={{ textAlign: "right" }}>₹ {selected.pricing?.gst ?? 0}</div>
                  <div style={{ fontWeight: 700 }}>Total</div><div style={{ textAlign: "right", fontWeight: 700 }}>₹ {selected.pricing?.total ?? 0}</div>
                </div>
              </Box>

              <Box>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(selected.status !== "FULFILLED" && selected.status !== "CANCELLED") && (
                    <>
                      <Button onClick={() => setOrderStatus(selected.id, "PROCESSING")}><FiTruck /> Mark Processing</Button>
                      <Button $ok onClick={() => setOrderStatus(selected.id, "FULFILLED")}><FiCheckCircle /> Mark Fulfilled</Button>
                      <Button $danger onClick={() => setOrderStatus(selected.id, "CANCELLED")}><FiMinusCircle /> Cancel Order</Button>
                    </>
                  )}
                </div>
              </Box>
            </>
          )}
        </DrawerBody>
      </Drawer>
    </Wrap>
  );
}
