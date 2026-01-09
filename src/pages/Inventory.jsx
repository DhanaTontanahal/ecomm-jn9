// src/pages/Inventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import styled, { keyframes } from "styled-components";
import {
  collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc,
  where, serverTimestamp, runTransaction, limit
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  FiTrendingUp, FiTrendingDown, FiClock, FiAlertTriangle, FiSearch,
} from "react-icons/fi";

/* ===== Admin "glass" tokens ===== */
const C = {
  bg: "#0b1220",
  glass: "rgba(255,255,255,.06)",
  glass2: "rgba(255,255,255,.10)",
  border: "rgba(255,255,255,.14)",
  text: "#e7efff",
  sub: "#b7c6e6",
  ring: "#78c7ff",
  primary: "#4ea1ff",
  danger: "#ef4444",
  ok: "#10b981",
};

const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

const Page = styled.div`
  min-height: 100dvh;
  background: ${C.bg};
  color: ${C.text};
  padding: 20px;
`;
const Bar = styled.div`
  display: grid; gap: 12px; grid-template-columns: 1fr;
  max-width: 1280px; margin: 0 auto 12px;
  @media (min-width:900px){ grid-template-columns: 280px 200px 1fr 180px 180px; }
`;
const Select = styled.select`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
  -webkit-text-fill-color: ${C.text};
  color-scheme: dark;
  option { background: #121a2b; color: ${C.text}; }
`;
const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border};
  border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
`;
const Btn = styled.button`
  background:${p => p.$danger ? C.danger : C.primary}; color:#fff; border:none;
  border-radius:10px; padding:10px 12px; cursor:pointer; width:max-content;
  &:disabled{opacity:.6; cursor:not-allowed}
`;
const Card = styled.div`
  background:${C.glass}; border:1px solid ${C.border}; border-radius:14px;
  padding: 14px; max-width: 1280px; margin:0 auto; animation:${fade} .3s both;
`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th, td { border-bottom: 1px solid ${C.border}; padding: 10px; vertical-align: top; }
  th { text-align:left; color:${C.sub}; font-weight:600; }
  td img { width:56px; height:56px; object-fit:cover; border-radius:8px; border:1px solid ${C.border}; }
`;
const Tag = styled.span`
  border:1px solid ${C.border};
  background:${p => p.$warn ? "rgba(239,68,68,.12)" : C.glass2};
  color:${p => p.$warn ? "#fecaca" : C.text};
  border-radius: 999px; padding: 4px 8px; font-size: 12px;
`;
const RowFlex = styled.div`display:flex; gap:8px; align-items:center; flex-wrap:wrap;`;
const SmallBtn = styled.button`
  display:inline-flex; gap:6px; align-items:center; padding:6px 8px;
  border-radius:8px; border:1px solid ${C.border}; background:${C.glass2}; color:${C.text};
`;
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(4,6,12,.72);
  backdrop-filter: blur(2px);
  z-index: 40000;
  display: flex;
  justify-content: center;
  align-items: flex-start;      /* ⬅ top aligned */
  padding-top: 60px;            /* ⬅ margin from top */
  padding-bottom: 24px;         /* a bit of bottom space too */
`;


const ModalCard = styled.div`
  width: min(1000px, 96vw);
  max-height: calc(100vh - 120px);  /* ⬅ smaller than full height */
  overflow-y: auto;                  /* ⬅ scroll inside modal */
  background: #0d1526;
  color: ${C.text};
  border: 1px solid ${C.border};
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);
  padding: 16px;
`;
const ModalTable = styled(Table)`
  th { color: ${C.text}; opacity: .9; }
  tbody td small { color: ${C.sub}; }
`;


const Blocker = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: grid;
  place-items: center;
  z-index: 41000;           /* ⬅️ also above everything */
`;
const Spinner = styled.div`
width: 56px; height: 56px; border - radius: 50 %;
border: 4px solid rgba(255, 255, 255, .25); border - top - color: ${C.primary};
animation: spin .8s linear infinite; @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ========= Helpers ========= */
const money = n => `₹ ${Number(n || 0).toLocaleString("en-IN")} `;
const REASONS = [
  { id: "receive", label: "Receive (Purchase)" },
  { id: "return", label: "Customer Return" },
  { id: "damage", label: "Damage / Expired" },
  { id: "sale", label: "Sale (manual adj.)" },
  { id: "adjust", label: "Manual Adjustment" },
];

/* ========= Per-product History Modal ========= */
function HistoryModal({ product, onClose }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!product?.id) return;
    const qy = query(
      collection(db, "stockTrail"),
      where("productId", "==", product.id),
      orderBy("at", "desc")
    );
    const unsub = onSnapshot(qy, snap => {
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [product?.id]);

  return (
    <ModalBackdrop>
      <ModalCard style={{ width: "min(800px, 92vw)" }}>
        <RowFlex style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div><b>History — </b>{product?.title} <small>({product?.sizeLabel})</small></div>
          <SmallBtn onClick={onClose}>Close</SmallBtn>
        </RowFlex>
        <ModalTable>
          <thead>
            <tr><th>When</th><th>Delta</th><th>Reason</th><th>Note / Ref</th><th>After</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.at?.toDate?.().toLocaleString?.() || ""}</td>
                <td style={{ color: r.delta >= 0 ? C.ok : C.danger, fontWeight: 700 }}>
                  {r.delta > 0 ? '+' : ''}{r.delta}
                </td>
                <td>{r.reason}</td>
                <td>
                  <div>{r.note || "-"}</div>
                  {r.refNo && <small>Ref: {r.refNo}</small>}
                </td>
                <td>{r.afterStock ?? "-"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={5} style={{ color: C.sub }}>No movements yet.</td></tr>
            )}
          </tbody>
        </ModalTable>
      </ModalCard>
    </ModalBackdrop>
  );
}

/* ========= All-products Stock Trail Modal (grouped by product) ========= */
function StockTrailModalAll({ onClose }) {
  const [rows, setRows] = useState([]);
  const [qstr, setQstr] = useState("");
  const [range, setRange] = useState("all"); // all | 1 | 7 | 30

  useEffect(() => {
    const qy = query(
      collection(db, "stockTrail"),
      orderBy("at", "desc"),
      limit(500)
    );
    const unsub = onSnapshot(qy, snap => {
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const groups = useMemo(() => {
    const byProduct = new Map();
    const now = Date.now();
    const cutoffMap = {
      "1": now - 1 * 24 * 60 * 60 * 1000,
      "7": now - 7 * 24 * 60 * 60 * 1000,
      "30": now - 30 * 24 * 60 * 60 * 1000,
      "all": 0
    };
    const cutoff = cutoffMap[range] ?? 0;
    const t = qstr.trim().toLowerCase();

    for (const r of rows) {
      const ts = r.at?.toDate?.()?.getTime?.() ?? 0;
      if (cutoff && ts < cutoff) continue;

      const title = (r.snap?.title || "").toLowerCase();
      const sku = (r.snap?.sku || "").toLowerCase();
      if (t && !(title.includes(t) || sku.includes(t))) continue;

      const k = r.productId || "unknown";
      if (!byProduct.has(k)) {
        byProduct.set(k, {
          meta: {
            title: r.snap?.title || "Unknown",
            sizeLabel: r.snap?.sizeLabel || "",
            sku: r.snap?.sku || ""
          },
          items: []
        });
      }
      byProduct.get(k).items.push(r);
    }

    return Array.from(byProduct.entries()).map(([productId, data]) => ({ productId, ...data }));
  }, [rows, qstr, range]);

  return (
    <ModalBackdrop>
      <ModalCard>
        <RowFlex style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontWeight: 900 }}>Stock Trail (latest 500)</div>
          <SmallBtn onClick={onClose}>Close</SmallBtn>
        </RowFlex>

        <RowFlex style={{ gap: 8, marginBottom: 10 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
            <Input
              placeholder="Search product title / SKU"
              value={qstr}
              onChange={e => setQstr(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
            <FiSearch style={{ position: "absolute", left: 10, top: 12, opacity: .8 }} />
          </div>
          <Select value={range} onChange={e => setRange(e.target.value)} style={{ width: 160 }}>
            <option value="all">All time</option>
            <option value="1">Last 1 day</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </Select>
        </RowFlex>

        {groups.length === 0 && <div style={{ color: C.sub }}>No stock movements match the filters.</div>}

        {groups.map(g => (
          <div key={g.productId} style={{ marginBottom: 16, border: `1px solid ${C.border} `, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", background: C.glass2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b>{g.meta.title}</b> {g.meta.sizeLabel ? <small style={{ opacity: .75 }}>• {g.meta.sizeLabel}</small> : null}
                {g.meta.sku ? <small style={{ marginLeft: 8, color: C.sub }}>SKU: {g.meta.sku}</small> : null}
              </div>
              <Tag>{g.items.length} moves</Tag>
            </div>
            <div style={{ padding: 10 }}>
              <ModalTable>
                <thead>
                  <tr>
                    <th style={{ width: 180 }}>When</th>
                    <th style={{ width: 90 }}>Delta</th>
                    <th style={{ width: 140 }}>Reason</th>
                    <th>Note / Ref</th>
                    <th style={{ width: 90 }}>After</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map(r => (
                    <tr key={r.id}>
                      <td>{r.at?.toDate?.().toLocaleString?.() || ""}</td>
                      <td style={{ color: r.delta >= 0 ? C.ok : C.danger, fontWeight: 700 }}>
                        {r.delta > 0 ? '+' : ''}{r.delta}
                      </td>
                      <td>{r.reason}</td>
                      <td>
                        <div>{r.note || "-"}</div>
                        {r.refNo && <small>Ref: {r.refNo}</small>}
                      </td>
                      <td>{r.afterStock ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </ModalTable>
            </div>
          </div>
        ))}
      </ModalCard>
    </ModalBackdrop>
  );
}

/* ========= Main Inventory ========= */
export default function Inventory() {
  const [cats, setCats] = useState([]);
  const [catId, setCatId] = useState("ALL");
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [trailOpen, setTrailOpen] = useState(false);

  // Load categories
  useEffect(() => {
    (async () => {
      const s = await getDocs(query(collection(db, "productCategories"), orderBy("order", "asc")));
      const list = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setCats([{ id: "ALL", displayName: "All Categories" }, ...list]);
    })();
  }, []);

  // Live products for selected category
  useEffect(() => {
    let qy;
    if (catId === "ALL") {
      qy = query(collection(db, "products"), where("active", "==", true), orderBy("order", "asc"));
    } else {
      qy = query(
        collection(db, "products"),
        where("active", "==", true),
        where("categoryId", "==", catId),
        orderBy("order", "asc")
      );
    }
    const unsub = onSnapshot(qy, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data(), minStock: d.data().minStock ?? 0 })));
    });
    return unsub;
  }, [catId]);

  const filtered = useMemo(() => {
    let arr = [...items];
    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter(p =>
        (p.title || "").toLowerCase().includes(s) ||
        (p.subtitle || "").toLowerCase().includes(s) ||
        (p.sizeLabel || "").toLowerCase().includes(s)
      );
    }
    if (lowOnly) {
      arr = arr.filter(p => Number(p.stock || 0) < Number(p.minStock || 0));
    }
    return arr;
  }, [items, search, lowOnly]);

  async function setMinStock(prod, value) {
    await updateDoc(doc(db, "products", prod.id), { minStock: Number(value || 0) });
  }

  async function moveStock(prod, delta, reason, note = "", refNo = "") {
    const n = Number(delta || 0);
    if (!n) { toast?.warn?.("Enter a non-zero quantity."); return; }
    if (!reason) { toast?.warn?.("Pick a reason."); return; }
    setBusyId(prod.id);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "products", prod.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Product not found");

        const curr = Number(snap.data().stock || 0);
        const next = curr + n;
        if (next < 0) throw new Error("Stock cannot go below 0");

        tx.update(ref, { stock: next, updatedAt: serverTimestamp() });

        const trailRef = doc(collection(db, "stockTrail"));
        tx.set(trailRef, {
          productId: prod.id,
          delta: n,
          reason,
          note,
          refNo,
          afterStock: next,
          at: serverTimestamp(),
          actor: "admin-ui",
          snap: { title: prod.title ?? null, sku: prod.sku ?? null, sizeLabel: prod.sizeLabel ?? null }
        });
      });
      toast?.success?.("Inventory updated.");
    } catch (e) {
      toast?.error?.(e?.message || "Failed to update inventory.");
      console.error(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Page>
      <h2 style={{ margin: "0 0 10px" }}>Inventory Manager</h2>

      {/* Controls */}
      <Bar>
        <Select value={catId} onChange={e => setCatId(e.target.value)}>
          {cats.map(c => <option key={c.id} value={c.id}>{c.displayName || c.title}</option>)}
        </Select>

        <Select value={lowOnly ? "low" : "all"} onChange={e => setLowOnly(e.target.value === "low")}>
          <option value="all">All Items</option>
          <option value="low">Low Stock</option>
        </Select>

        <div style={{ position: "relative" }}>
          <Input
            placeholder="Search title / subtitle / size"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
          <FiSearch style={{ position: "absolute", left: 10, top: 12, opacity: .8 }} />
        </div>

        <Tag $warn={lowOnly}>
          <FiAlertTriangle style={{ verticalAlign: "-2px" }} /> {filtered.filter(p => (p.stock || 0) < (p.minStock || 0)).length} low
        </Tag>

        {/* Page-level Stock Trail viewer */}
        <Btn onClick={() => setTrailOpen(true)}>View Stock Trail</Btn>
      </Bar>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Pricing</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Adjust</th>
              <th>History</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <Row key={p.id} p={p} busy={busyId === p.id} onMinChange={setMinStock} onMove={moveStock} onHistory={() => setHistoryFor(p)} />
            ))}
            {!filtered.length && (
              <tr><td colSpan={6} style={{ color: C.sub }}>No items.</td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Per-product modal */}
      {historyFor && <HistoryModal product={historyFor} onClose={() => setHistoryFor(null)} />}

      {/* All-products grouped trail modal */}
      {trailOpen && <StockTrailModalAll onClose={() => setTrailOpen(false)} />}

      {!!busyId && (
        <Blocker aria-label="Updating inventory">
          <div style={{ display: "grid", gap: 10, justifyItems: "center", color: "#fff" }}>
            <Spinner />
            <div>Updating inventory…</div>
          </div>
        </Blocker>
      )}
    </Page>
  );
}

/* ========= Row component ========= */
function Row({ p, busy, onMinChange, onMove, onHistory }) {
  const [min, setMin] = useState(p.minStock ?? 0);
  const [qtyAdd, setQtyAdd] = useState("");   // ⬅️ separate for Add
  const [qtySub, setQtySub] = useState("");   // ⬅️ separate for Sub
  const [reason, setReason] = useState(REASONS[0].id);
  const [note, setNote] = useState("");
  const [refNo, setRefNo] = useState("");

  useEffect(() => setMin(p.minStock ?? 0), [p.minStock]);

  const low = Number(p.stock || 0) < Number(min || 0);

  return (
    <tr>
      <td>
        <RowFlex>
          {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <div style={{ width: 56, height: 56, borderRadius: 8, border: `1px solid ${C.border} `, background: "#1b2232" }} />}
          <div>
            <div style={{ fontWeight: 700 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: C.sub }}>{p.subtitle}</div>
            <div style={{ fontSize: 12 }}>{p.sizeLabel}</div>
            {low && <div style={{ marginTop: 6 }}><Tag $warn><FiAlertTriangle /> Low</Tag></div>}
          </div>
        </RowFlex>
      </td>
      <td>
        <div><span style={{ opacity: .8 }}>MRP</span>: {money(p.mrp)}</div>
        <div><b>Price</b>: {money(p.price)}</div>
      </td>
      <td><b>{p.stock ?? 0}</b></td>
      <td>
        <Input
          type="number" value={min}
          onChange={e => setMin(e.target.value)}
          onBlur={() => onMinChange(p, min)}
          style={{ width: 100 }}
        />
      </td>
      <td>
        <RowFlex>
          {/* ADD side */}
          <Input
            disabled={busy}
            type="number"
            value={qtyAdd}
            onChange={e => setQtyAdd(e.target.value)}
            placeholder="Qty"
            style={{ width: 90 }}
          />
          <SmallBtn
            disabled={busy || !qtyAdd}
            onClick={() => {
              onMove(p, +Math.abs(Number(qtyAdd || 0)), reason, note, refNo);
              setQtyAdd(""); // clear after use (optional)
            }}
          >
            <FiTrendingUp /> Add
          </SmallBtn>

          {/* SUBTRACT side */}
          <Input
            disabled={busy}
            type="number"
            value={qtySub}
            onChange={e => setQtySub(e.target.value)}
            placeholder="Qty"
            style={{ width: 90 }}
          />
          <SmallBtn
            disabled={busy || !qtySub}
            onClick={() => {
              onMove(p, -Math.abs(Number(qtySub || 0)), reason, note, refNo);
              setQtySub(""); // clear after use (optional)
            }}
          >
            <FiTrendingDown /> Sub
          </SmallBtn>

          <Select
            disabled={busy}
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: 180 }}
          >
            {REASONS.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </Select>

          <Input
            disabled={busy}
            value={refNo}
            onChange={e => setRefNo(e.target.value)}
            placeholder="Ref No (optional)"
            style={{ width: 150 }}
          />
          <Input
            disabled={busy}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note (optional)"
            style={{ width: 200 }}
          />

          <SmallBtn onClick={onHistory}>
            <FiClock /> View
          </SmallBtn>
        </RowFlex>
      </td>
      <td>
        <SmallBtn onClick={onHistory}><FiClock /> View</SmallBtn>
      </td>
    </tr>
  );
}
