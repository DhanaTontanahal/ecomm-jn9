// src/pages/POS.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import {
    collection, getDocs, query, where, orderBy, limit, addDoc,
    serverTimestamp, doc, getDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../auth/AuthProvider";
import {
    FiSearch, FiPlus, FiMinus, FiTrash2,
    FiDownload, FiPrinter, FiCheckCircle, FiRefreshCw, FiGrid
} from "react-icons/fi";
import ProductCategories1 from "../components/landingpage/ProductCategories1";

/* ====== tokens ====== */
const TOK = {
    panel: "#0d1526",
    glass: "rgba(255,255,255,.06)",
    glassBorder: "rgba(255,255,255,.12)",
    glassHeader: "rgba(255,255,255,.10)",
    text: "#e7efff",
    sub: "#b7c6e6",
    ring: "#78c7ff",
    primary: "#4ea1ff",
    ok: "#10b981",
    red: "#ef4444",
    bg: "#0b1220",
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

/* ====== layout ====== */
const Wrap = styled.div`
  background:${TOK.bg};
  color:${TOK.text};
  border:1px solid ${TOK.glassBorder};
  border-radius:14px;
  margin:18px auto;
  max-width:1400px;
  min-height: calc(100vh - 120px);
  display:grid;
  grid-template-columns: 1fr 420px;
  overflow:hidden;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const Left = styled.div`
  display:grid;
  grid-template-rows: 64px 56px 1fr;   /* Head, Search, scroll area */
  border-right: 1px solid ${TOK.glassBorder};
  min-height: 0;                       /* allow the last row to shrink */
`;


const Right = styled.div`display:grid; grid-template-rows: 64px 1fr auto; min-height:0;`;

const Head = styled.div`
  display:flex; gap:10px; align-items:center; padding:10px 12px;
  border-bottom:1px solid ${TOK.glassBorder}; background:${TOK.glassHeader};
  h2{ margin:0; font-size:18px; }
`;
const SearchBar = styled.div`
  display:flex; gap:8px; padding:8px 12px; border-bottom:1px solid ${TOK.glassBorder};
  background:${TOK.panel};
  input{
    flex:1; background:${TOK.glassHeader}; color:${TOK.text};
    border:1px solid ${TOK.glassBorder}; border-radius:10px; padding:10px 12px;
    &:focus{ outline:none; box-shadow:0 0 0 3px ${TOK.ring}; }
  }
  button{
    background:${TOK.primary}; color:#fff; border:0; border-radius:10px; padding:10px 12px; cursor:pointer;
    display:inline-flex; align-items:center; gap:8px;
  }
`;
const CatRow = styled.div`
  display:flex; gap:8px; padding:8px 12px; align-items:center; overflow:auto;
  border-bottom:1px solid ${TOK.glassBorder};
`;
const CatPill = styled.button`
  border:1px solid ${p => p.$on ? TOK.primary : TOK.glassBorder};
  background:${p => p.$on ? TOK.glassHeader : TOK.panel};
  color:${TOK.text};
  border-radius:999px; padding:8px 12px; font-weight:800; cursor:pointer; white-space:nowrap;
`;

const ProductsWrap = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;                      /* vertical scroll here */
  padding: 12px;
`;


const Grid = styled.div`
  display:grid; gap:10px; grid-template-columns: repeat(5, minmax(0, 1fr));
  @media (max-width: 1360px){ grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 980px){ grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 640px){ grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
const Card = styled.button`
  text-align:left; border:1px solid ${TOK.glassBorder}; background:${TOK.glassHeader};
  color:${TOK.text}; border-radius:12px; padding:10px; cursor:pointer; display:grid; gap:8px; animation:${fade} .25s both;
  &:hover{ outline:2px solid ${TOK.glassBorder}; }
`;
const Img = styled.img`width:100%; aspect-ratio: 1/1; object-fit:contain; background:#111827; border-radius:8px;`;
const Title = styled.div`font-weight:800; font-size:14px; line-height:1.2;`;
const Price = styled.div`font-weight:900;`;
const Small = styled.div`font-size:12px; color:${TOK.sub};`;

const CartHead = styled.div`
  display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid ${TOK.glassBorder};
`;
const CartList = styled.div`overflow:auto; padding:10px 12px;`;
const Row = styled.div`
  display:grid; grid-template-columns: 58px 1fr auto; gap:10px; align-items:center;
  padding:10px 0; border-bottom:1px dashed ${TOK.glassBorder};
`;
const Thumb = styled.img`width:58px; height:58px; object-fit:contain; background:#111827; border-radius:8px;`;
const QtyCtrl = styled.div`display:flex; align-items:center; gap:8px;`;
const IconBtn = styled.button`
  width:28px; height:28px; border-radius:8px; border:1px solid ${TOK.glassBorder};
  background:${TOK.glassHeader}; color:${TOK.text}; display:grid; place-items:center; cursor:pointer;
`;
const Danger = styled.button`
  background:none; border:1px solid ${TOK.glassBorder}; color:${TOK.red};
  border-radius:10px; padding:6px 8px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;
`;

const Totals = styled.div`
  border-top:1px solid ${TOK.glassBorder}; padding:10px 12px; display:grid; gap:6px;
  div{ display:flex; justify-content:space-between; }
  .big{ font-weight:900; font-size:16px; }
`;
const Footer = styled.div`
  border-top:1px solid ${TOK.glassBorder}; background:${TOK.glassHeader}; padding:10px 12px; display:grid; gap:8px;
`;
const Two = styled.div`display:grid; gap:8px; grid-template-columns: 1fr 1fr;`;
const Input = styled.input`
  height:40px; background:${TOK.glassHeader}; color:${TOK.text};
  border:1px solid ${TOK.glassBorder}; border-radius:10px; padding:0 10px;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${TOK.ring}; }
`;
const Select = styled.select`
  height:40px; background:${TOK.glassHeader}; color:${TOK.text};
  border:1px solid ${TOK.glassBorder}; border-radius:10px; padding:0 10px; color-scheme: dark;
`;
const CTA = styled.button`
  height:44px; border:0; border-radius:12px; background:${TOK.ok}; color:#fff; font-weight:900; cursor:pointer;
  &:disabled{ opacity:.6; cursor:not-allowed }
`;
const Secondary = styled.button`
  height:44px; border:1px solid ${TOK.glassBorder}; border-radius:12px; background:${TOK.glassHeader}; color:${TOK.text}; font-weight:900;
`;
const Pill = styled.span`
  padding:4px 8px; border-radius:999px; font-size:12px; font-weight:800; background:${TOK.glassHeader}; color:${TOK.sub};
`;

/* ===== helpers ===== */
const money = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

// Build a single reason per item, prioritizing: out -> insufficient -> low -> unknown
async function validateInventoryForCart(items) {
    const problems = [];
    await Promise.all(items.map(async (it) => {
        try {
            const pRef = doc(db, "products", it.id);
            const snap = await getDoc(pRef);
            if (!snap.exists()) {
                problems.push({ it, reason: "missing", stock: null });
                return;
            }
            const data = snap.data() || {};
            const stock = Number(data.stock);
            if (!Number.isFinite(stock)) {
                problems.push({ it, reason: "unknown", stock: null });
                return;
            }
            if (stock <= 0) {
                problems.push({ it, reason: "out", stock });
                return;
            }
            if (stock < Number(it.qty || 0)) {
                problems.push({ it, reason: "insufficient", stock });
                return;
            }
            if (stock < 5) {
                problems.push({ it, reason: "low", stock });
            }
        } catch {
            problems.push({ it, reason: "unknown", stock: null });
        }
    }));
    return problems;
}

const phoneDigits = (v) => String(v || "").replace(/\D/g, "");
const isPhoneValid = (v) => phoneDigits(v).length >= 10;

export default function POS() {
    const { user } = useAuth?.() || { user: null };

    // categories
    const [cats, setCats] = useState([]);
    const [catId, setCatId] = useState("ALL");
    const [catSheet, setCatSheet] = useState(false);

    // products/search
    const [qstr, setQstr] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    // cart
    const [cart, setCart] = useState([]); // {id,title,price,qty,imageUrl, mrp?, sku?}
    const addToCart = (p) => {
        setCart(prev => {
            const idx = prev.findIndex(x => x.id === p.id);
            if (idx >= 0) {
                const nxt = [...prev]; nxt[idx] = { ...nxt[idx], qty: (nxt[idx].qty || 0) + 1 }; return nxt;
            }
            return [...prev, { id: p.id, title: p.title || p.name, price: Number(p.price || p.salePrice || 0), qty: 1, imageUrl: p.imageUrl || null, mrp: p.mrp || null, sku: p.sku || "", sizeLabel: p.sizeLabel || null }];
        });
    };
    const inc = (id) => setCart(prev => prev.map(x => x.id === id ? { ...x, qty: x.qty + 1 } : x));
    const dec = (id) => setCart(prev => prev.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x));
    const rm = (id) => setCart(prev => prev.filter(x => x.id !== id));
    const clear = () => setCart([]);
    const setLinePrice = (id, val) => setCart(prev => prev.map(x => x.id === id ? { ...x, price: Number(val) || 0 } : x));
    const setLineQty = (id, val) => setCart(prev => prev.map(x => x.id === id ? { ...x, qty: Math.max(1, Number(val) || 1) } : x));

    // customer + payment
    const [custName, setCustName] = useState("");
    const [custPhone, setCustPhone] = useState("");
    const [payMode, setPayMode] = useState("CASH"); // CASH | UPI | CARD
    const [upiTxn, setUpiTxn] = useState("");        // <-- UPI transaction number
    const [note, setNote] = useState("");
    const [placing, setPlacing] = useState(false);

    const subtotal = useMemo(() => cart.reduce((s, x) => s + (Number(x.price || 0) * Number(x.qty || 0)), 0), [cart]);
    const gst = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
    const total = useMemo(() => subtotal + gst, [subtotal, gst]);

    // load categories once
    useEffect(() => {
        (async () => {
            try {
                const snap = await getDocs(query(
                    collection(db, "productCategories"),
                    where("active", "==", true),
                    orderBy("order", "asc")
                ));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setCats(list);
            } catch (e) { console.warn(e); }
        })();
    }, []);

    const fetchProducts = useCallback(async (categoryId, hint = "") => {
        setLoading(true);
        try {
            // Base query
            let qBase = [
                where("active", "==", true),
                orderBy("order", "asc"),
                limit(200)
            ];
            // category filter
            if (categoryId && categoryId !== "ALL") {
                qBase = [where("categoryId", "==", categoryId), ...qBase];
            }
            const snap = await getDocs(query(collection(db, "products"), ...qBase));
            let all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // client-side search (title / sku)
            const t = (hint || qstr || "").trim().toLowerCase();
            if (t) {
                all = all.filter(p =>
                    (p.title || "").toLowerCase().includes(t) ||
                    (p.sku || "").toLowerCase().includes(t)
                );
            }
            setRows(all);
        } finally {
            setLoading(false);
        }
    }, [qstr]);

    // initial products for ALL
    useEffect(() => { fetchProducts("ALL", ""); }, [fetchProducts]);

    // UI handlers
    const onEnterSearch = (e) => { if (e.key === "Enter") fetchProducts(catId); };
    const chooseCat = (c) => { setCatId(c?.id || "ALL"); setCatSheet(false); fetchProducts(c?.id || "ALL"); };

    // ====== place order (with inventory + field validation)
    const placeOrder = async () => {
        if (!cart.length) return;

        // phone required
        if (!isPhoneValid(custPhone)) {
            alert("Customer phone is required (enter at least 10 digits).");
            return;
        }
        // UPI txn id required when UPI selected
        if (payMode === "UPI" && !upiTxn.trim()) {
            alert("Please enter the UPI transaction number.");
            return;
        }

        // Build items payload first
        const items = cart.map(x => ({
            id: x.id,
            title: x.title,
            price: Number(x.price || 0),
            qty: Number(x.qty || 0),
            imageUrl: x.imageUrl || null,
            mrp: Number(x.mrp || 0) || null,
            sku: x.sku || null,
            sizeLabel: x.sizeLabel || null
        }));

        // Validate inventory BEFORE attempting to create an order
        const problems = await validateInventoryForCart(items);
        if (problems.length) {
            const lines = problems.map(({ it, reason, stock }) => {
                const label = `${it.title}${it.sku ? ` (${it.sku})` : ""}`;
                if (reason === "out") return `• ${label}: OUT OF STOCK`;
                if (reason === "insufficient") return `• ${label}: Only ${stock} left, requested ${it.qty}`;
                if (reason === "low") return `• ${label}: Low stock (${stock} available). Min required is 5`;
                if (reason === "missing") return `• ${label}: Product not found`;
                return `• ${label}: Stock not updated in system`;
            }).join("\n");

            alert(
                `Cannot place order.\n\nThe following items have insufficient inventory:\n\n${lines}\n\n` +
                `Please adjust quantities / remove the items, or update inventory in Inventory Manager.`
            );
            return; // STOP here
        }

        try {
            setPlacing(true);

            const payload = {
                createdAt: serverTimestamp(),
                status: "NEW",
                source: "pos",
                cashier: user ? { uid: user.uid, email: user.email || "" } : null,
                customer: {
                    name: (custName || "Guest").trim(),     // <-- default to Guest
                    phone: phoneDigits(custPhone)           // store digits only
                },
                pricing: { subtotal, gst, total },
                payment: (
                    payMode === "UPI"
                        ? { mode: "UPI", status: "PENDING_VERIFICATION", upiTxn: upiTxn.trim() }
                        : { mode: payMode, status: payMode === "CASH" ? "PAID" : "PENDING_VERIFICATION" }
                ),
                items,
                note: (note || "").trim() || null,
                posCategoryId: catId === "ALL" ? null : catId
            };

            const ref = await addDoc(collection(db, "orders"), payload);

            // NOTE: Do NOT decrement stock here. The Cloud Function handles stock + stockTrail.
            clear();
            setCustName(""); setCustPhone(""); setUpiTxn(""); setNote("");
            alert(`Order ${ref.id} placed`);
        } catch (e) {
            console.error(e);
            alert("Could not place order, please try again.");
        } finally {
            setPlacing(false);
        }
    };

    // shortcuts
    useEffect(() => {
        const onKey = (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === "p") { e.preventDefault(); window.print(); }
            if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); clear(); }
            if (e.ctrlKey && e.key.toLowerCase() === "f") {
                e.preventDefault();
                const ip = document.getElementById("pos-search"); ip && ip.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const selectedCat = catId === "ALL" ? { displayName: "All Products" } : cats.find(c => c.id === catId);

    const phoneOk = isPhoneValid(custPhone);
    const upiOk = payMode !== "UPI" || !!upiTxn.trim();

    return (
        <Wrap>
            {/* LEFT: categories -> products */}
            <Left>
                <Head>
                    <h2>POS · Products</h2>
                    <Pill>Ctrl+F focus search</Pill>
                    <Pill>Ctrl+P print</Pill>
                    <Pill>Ctrl+L clear</Pill>
                </Head>

                {/* Search + Browse Categories */}
                <SearchBar>
                    <div style={{ position: "relative", flex: 1 }}>
                        <input
                            id="pos-search"
                            placeholder={`Search in ${selectedCat?.displayName || "Products"} (title / SKU)`}
                            value={qstr}
                            onChange={e => setQstr(e.target.value)}
                            onKeyDown={onEnterSearch}
                        />
                        <FiSearch style={{ position: "absolute", right: 10, top: 12, color: TOK.sub }} />
                    </div>
                    <button onClick={() => fetchProducts(catId)} title="Refresh"><FiRefreshCw /> Refresh</button>
                    <button onClick={() => setCatSheet(true)} title="Browse Categories"><FiGrid /> Browse</button>
                </SearchBar>

                <CatRow>
                    <CatPill $on={catId === "ALL"} onClick={() => chooseCat(null)}>All</CatPill>
                    {cats.map(c => (
                        <CatPill key={c.id} $on={catId === c.id} onClick={() => chooseCat(c)}>
                            {c.displayName || c.title || "Category"}
                        </CatPill>
                    ))}
                </CatRow>

                <div>
                    <ProductsWrap>
                        {loading ? (
                            <div style={{ color: TOK.sub }}>Loading…</div>
                        ) : rows.length === 0 ? (
                            <div style={{ color: TOK.sub }}>
                                No results. {qstr ? "Try clearing search" : "Pick another category"}.
                            </div>
                        ) : (
                            <Grid>
                                {rows.map(p => (
                                    <Card key={p.id} onClick={() => addToCart(p)}>
                                        <Img src={p.imageUrl || ""} alt="" />
                                        <Title>{p.title}</Title>
                                        <Small>{p.sku || p.sizeLabel || ""}</Small>
                                        <Price>{money(p.salePrice ?? p.price ?? 0)}</Price>
                                    </Card>
                                ))}
                            </Grid>
                        )}
                    </ProductsWrap>
                </div>
            </Left>

            {/* RIGHT: cart + checkout */}
            <Right>
                <CartHead>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h2 style={{ margin: 0 }}>Cart</h2>
                        <Pill>{cart.reduce((s, x) => s + x.qty, 0)} items</Pill>
                        {selectedCat ? <Pill>Category: {selectedCat.displayName || selectedCat.title}</Pill> : null}
                    </div>
                    {cart.length > 0 && <Danger onClick={clear}><FiTrash2 /> Clear</Danger>}
                </CartHead>

                <CartList>
                    {cart.length === 0 ? <div style={{ color: TOK.sub }}>Add items from the left.</div> : cart.map(it => (
                        <Row key={it.id}>
                            <Thumb src={it.imageUrl || ""} alt="" />
                            <div>
                                <div style={{ fontWeight: 800 }}>{it.title}</div>
                                <Small>{it.sku || ""}</Small>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <QtyCtrl>
                                            <IconBtn onClick={() => dec(it.id)}><FiMinus /></IconBtn>
                                            <input
                                                value={it.qty}
                                                onChange={e => setLineQty(it.id, e.target.value)}
                                                style={{ width: 48, textAlign: "center", background: TOK.glassHeader, color: TOK.text, border: `1px solid ${TOK.glassBorder}`, borderRadius: 8, height: 28 }}
                                            />
                                            <IconBtn onClick={() => inc(it.id)}><FiPlus /></IconBtn>
                                        </QtyCtrl>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                        <Small>Rate</Small>
                                        <input
                                            value={it.price}
                                            onChange={e => setLinePrice(it.id, e.target.value)}
                                            style={{ width: 92, textAlign: "right", background: TOK.glassHeader, color: TOK.text, border: `1px solid ${TOK.glassBorder}`, borderRadius: 8, height: 28, padding: "0 8px" }}
                                        />
                                        <Danger onClick={() => rm(it.id)}><FiTrash2 /> Remove</Danger>
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: "right", fontWeight: 900 }}>{money((it.price || 0) * (it.qty || 0))}</div>
                        </Row>
                    ))}
                </CartList>

                <div>
                    <Totals>
                        <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
                        <div><span>GST (5%)</span><span>{money(gst)}</span></div>
                        <div className="big"><span>Total</span><span>{money(total)}</span></div>
                    </Totals>

                    <Footer>
                        <Two>
                            <Input
                                placeholder="Customer name (defaults to Guest)"
                                value={custName}
                                onChange={e => setCustName(e.target.value)}
                            />
                            <Input
                                placeholder="Phone (required)"
                                value={custPhone}
                                onChange={e => setCustPhone(e.target.value)}
                                style={{ borderColor: phoneOk ? TOK.glassBorder : TOK.red }}
                            />
                        </Two>

                        {/* UPI transaction entry (only when UPI) */}
                        {payMode === "UPI" && (
                            <Input
                                placeholder="UPI Transaction Number (required for UPI)"
                                value={upiTxn}
                                onChange={e => setUpiTxn(e.target.value)}
                                style={{ borderColor: upiOk ? TOK.glassBorder : TOK.red, marginTop: 8 }}
                            />
                        )}

                        <Input placeholder="Bill notes (optional)" value={note} onChange={e => setNote(e.target.value)} style={{ marginTop: 8 }} />

                        <Two style={{ marginTop: 8 }}>
                            <Select value={payMode} onChange={e => setPayMode(e.target.value)}>
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                            </Select>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <Secondary onClick={() => window.print()}><FiPrinter /> Print</Secondary>
                                <Secondary onClick={() => navigator.clipboard?.writeText(String(total)).catch(() => { })}><FiDownload /> Copy Total</Secondary>
                            </div>
                        </Two>

                        <CTA
                            disabled={
                                !cart.length ||
                                placing ||
                                !phoneOk ||
                                !upiOk
                            }
                            onClick={placeOrder}
                            style={{ marginTop: 8 }}
                        >
                            {placing ? "Placing…" : <><FiCheckCircle style={{ marginRight: 8 }} /> Place Order • {money(total)}</>}
                        </CTA>
                    </Footer>
                </div>
            </Right>
        </Wrap>
    );
}
