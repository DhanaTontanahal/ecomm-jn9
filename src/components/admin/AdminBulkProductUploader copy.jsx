import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
    collection, getDocs, query, where, orderBy,
    addDoc, doc, serverTimestamp, runTransaction,
} from "firebase/firestore";
import {
    ref, uploadBytesResumable, getDownloadURL,
} from "firebase/storage";
import { db, storage } from "../../firebase/firebase";
import { DEFAULT_PRODUCTS } from "./defaultProducts";
import { FiUpload, FiPackage, FiCheck, FiX, FiSearch } from "react-icons/fi";

/* ===== shared tokens (same vibe as AdminProductManager) ===== */
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
    bg: '#0b1220',
};

const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

const Blocker = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  display: grid; place-items: center;
  z-index: 9888;
`;
const Card = styled.div`
  width: min(92vw, 960px);
  border-radius: 14px;
  border: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.bg};
  color: ${COLORS.text};
  box-shadow: 0 20px 60px rgba(0,0,0,.45);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
`;
const Head = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.glassHeader};
  display:flex; align-items:center; justify-content:space-between;
  h3 { margin:0; font-size: 18px; }
`;
const Body = styled.div`
  padding: 14px 16px; animation: ${fade} .3s both;
`;
const Foot = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${COLORS.glassBorder};
  display:flex; gap:10px; justify-content:flex-end;
`;
const Row = styled.div`display:flex; gap:12px; flex-wrap:wrap; align-items:center;`;
const Select = styled.select`
  background:${COLORS.glassHeader};
  color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder};
  border-radius:10px;
  padding:8px 10px;
  min-width: 260px;
  color-scheme: dark;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${COLORS.ring} };
  option{ background:#121a2b; color:${COLORS.text}; }
`;
const Button = styled.button`
  background:${p => p.$danger ? COLORS.danger : p.$ok ? COLORS.ok : COLORS.primary};
  color:white; border:none;
  border-radius:10px; padding:10px 12px; cursor:pointer;
  &:disabled{opacity:.6; cursor:not-allowed}
  display:inline-flex; align-items:center; gap:8px;
`;
const Input = styled.input`
  background:${COLORS.glassHeader}; color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder}; border-radius:10px; padding:8px 10px;
  &:focus{outline:none; box-shadow:0 0 0 3px ${COLORS.ring}};
`;
const Grid = styled.div`
  display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:12px;
`;
const Item = styled.label`
  border:1px solid ${COLORS.glassBorder};
  background:${COLORS.glassHeader};
  border-radius:12px; padding:10px; cursor:pointer;
  display:grid; grid-template-rows: 140px auto auto; gap:8px;
  input{margin-right:6px}
  img{ width:100%; height:140px; object-fit:cover; border-radius:8px; border:1px solid ${COLORS.glassBorder}; }
  .title{font-weight:700}
  .sub{ color:${COLORS.subtext}; font-size:12px }
`;

/* ===== local utils (duplicate of AdminProductManager’s logic, kept self-contained) ===== */
const toSlug = (s = "") =>
    s.toLowerCase().trim()
        .replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-")
        .replace(/^\-+|\-+$/g, "");

function makeSku(categorySlug = "gen", seq = 1, d = new Date()) {
    const prefix = (categorySlug || "gen").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3).padEnd(3, "X");
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const s = String(seq).padStart(4, "0");
    return `${prefix}-${yy}${mm}${dd}-${s}`;
}
// Global monotonic product sequence
async function getNextProductSeq(db) {
    const refDoc = doc(db, "counters", "productSeq");
    const next = await runTransaction(db, async (tx) => {
        const snap = await tx.get(refDoc);
        const cur = snap.exists() ? (snap.data().value || 0) : 0;
        const n = cur + 1;
        tx.set(refDoc, { value: n }, { merge: true });
        return n;
    });
    return next;
}

/* ===== image bucket via Vite (pull all local images) ===== */
const imageModules = import.meta.glob("/src/assets/default-products/*.{png,jpg,jpeg,webp}", { eager: true });

function useActiveCategories() {
    const [cats, setCats] = useState([]);
    useEffect(() => {
        (async () => {
            const cSnap = await getDocs(
                query(collection(db, "productCategories"), where("active", "==", true), orderBy("order", "asc"))
            );
            setCats(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, []);
    return cats;
}

/** Props:
 * open: boolean
 * onClose: () => void
 * onComplete?: () => void   // callback to refresh table in parent after upload/copy
 * defaultCategoryId?: string
 * defaultCategorySlug?: string
 */
export default function AdminBulkProductUploader({ open, onClose, onComplete, defaultCategoryId, defaultCategorySlug }) {
    const cats = useActiveCategories();
    const [mode, setMode] = useState("upload"); // "upload" | "existing"
    const [catId, setCatId] = useState(defaultCategoryId || "");
    const [catSlug, setCatSlug] = useState(defaultCategorySlug || "");
    const [busy, setBusy] = useState(false);
    const [progressNote, setProgressNote] = useState("");

    // existing products (from previous uploads)
    const [existing, setExisting] = useState([]);
    const [selected, setSelected] = useState({});
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open) return;
        setMode("upload");
        setSelected({});
        setSearch("");
        setProgressNote("");
    }, [open]);

    useEffect(() => {
        if (!catId) return;
        const c = cats.find(x => x.id === catId);
        setCatSlug(c?.slug || "");
    }, [catId, cats]);

    useEffect(() => {
        if (mode !== "existing" || !open) return;
        (async () => {
            // Load all products uploaded earlier (any category)
            const s = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
            setExisting(s.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, [mode, open]);

    const filteredExisting = useMemo(() => {
        if (!search) return existing;
        const q = search.toLowerCase();
        return existing.filter(p =>
            (p.title || "").toLowerCase().includes(q) ||
            (p.subtitle || "").toLowerCase().includes(q) ||
            (p.sku || "").toLowerCase().includes(q)
        );
    }, [existing, search]);

    const togglePick = (id) =>
        setSelected(prev => ({ ...prev, [id]: !prev[id] }));

    async function uploadOneDefault(row) {
        // 1) Resolve the local image url from /src/assets/default-products
        //    DEFAULT_PRODUCTS uses "file" like "cold-pressed-gingelly-oil-1L.jpg"
        const match = Object.entries(imageModules).find(([fullPath]) =>
            fullPath.endsWith("/" + row.file)
        );
        if (!match) {
            throw new Error(`Image not found for ${row.title} (${row.file})`);
        }
        const [, mod] = match;
        // vite eager module gives a URL string on default
        const url = typeof mod === "string" ? mod : mod.default;
        const resp = await fetch(url);
        const blob = await resp.blob();

        // 2) Upload to Storage
        const fname = `${Date.now()}-${toSlug(row.file)}`;
        const folder = `products/${catSlug || "uncategorized"}`;
        const path = `${folder}/${fname}`;
        const storageRef = ref(storage, path);

        await new Promise((resolve, reject) => {
            const t = uploadBytesResumable(storageRef, blob, { cacheControl: "public,max-age=31536000" });
            t.on("state_changed", () => { }, reject, resolve);
        });
        const downloadUrl = await getDownloadURL(storageRef);

        // 3) Create product doc
        const seq = await getNextProductSeq(db);
        const sku = makeSku(catSlug || "gen", seq, new Date());
        const payload = {
            active: !!row.active,
            categoryId: catId,
            categorySlug: catSlug,
            title: row.title || "",
            subtitle: row.subtitle || "",
            imageUrl: downloadUrl,
            imagePath: path,
            sizeLabel: row.sizeLabel || "L",
            mrp: Number(row.mrp || 0),
            price: Number(row.price || 0),
            cashbackAmount: row.cashbackAmount === "" ? null : Number(row.cashbackAmount || 0),
            rating: { avg: 4.8, count: 0 },
            stock: Number(row.stock || 0),
            order: Number(row.order || 999),
            sku,
            createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, "products"), payload);
    }

    async function handleUploadDefaults() {
        if (!catId) {
            alert("Please choose a category first.");
            return;
        }
        setBusy(true);
        try {
            let done = 0;
            for (const row of DEFAULT_PRODUCTS) {
                setProgressNote(`Uploading: ${row.title}`);
                // eslint-disable-next-line no-await-in-loop
                await uploadOneDefault(row);
                done++;
                setProgressNote(`Uploaded ${done}/${DEFAULT_PRODUCTS.length}`);
            }
            setProgressNote("All default products uploaded.");
            onComplete?.();
        } catch (e) {
            console.error(e);
            alert(e.message || "Upload failed");
        } finally {
            setBusy(false);
        }
    }

    async function handleCopySelectedFromExisting() {
        if (!catId) {
            alert("Please choose a category first.");
            return;
        }
        const picked = filteredExisting.filter(p => selected[p.id]);
        if (!picked.length) {
            alert("Select at least one product.");
            return;
        }
        setBusy(true);
        try {
            let idx = 0;
            for (const prod of picked) {
                idx++;
                setProgressNote(`Copying ${idx}/${picked.length}: ${prod.title}`);
                // We “copy” the product into the chosen category with a new SKU
                const seq = await getNextProductSeq(db);
                const sku = makeSku(catSlug || "gen", seq, new Date());
                const payload = {
                    active: true,
                    categoryId: catId,
                    categorySlug: catSlug,
                    title: prod.title || "",
                    subtitle: prod.subtitle || "",
                    imageUrl: prod.imageUrl || "",
                    imagePath: prod.imagePath || "",
                    sizeLabel: prod.sizeLabel || "L",
                    mrp: Number(prod.mrp || 0),
                    price: Number(prod.price || 0),
                    cashbackAmount: prod.cashbackAmount === "" ? null : Number(prod.cashbackAmount || 0),
                    rating: { avg: 4.8, count: 0 },
                    stock: Number(prod.stock || 0),
                    order: Number(prod.order || 999),
                    sku,
                    createdAt: serverTimestamp(),
                };
                // eslint-disable-next-line no-await-in-loop
                await addDoc(collection(db, "products"), payload);
            }
            setProgressNote("Selected products copied.");
            onComplete?.();
        } catch (e) {
            console.error(e);
            alert(e.message || "Copy failed");
        } finally {
            setBusy(false);
        }
    }

    if (!open) return null;

    return (
        <Blocker onClick={onClose}>
            <Card onClick={(e) => e.stopPropagation()}>
                <Head>
                    <h3>{mode === "upload" ? "Upload Default Products (from local images)" : "Select From Existing Products"}</h3>
                    <Row>
                        <Select value={catId} onChange={(e) => setCatId(e.target.value)} required>
                            <option value="">Select category…</option>
                            {cats.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.displayName || c.title}
                                </option>
                            ))}
                        </Select>
                        <Button onClick={() => setMode("upload")} $ok={mode === "upload"}><FiUpload /> Upload defaults</Button>
                        <Button onClick={() => setMode("existing")} $ok={mode === "existing"}><FiPackage /> Select from existing</Button>
                        <Button $danger onClick={onClose}><FiX /> Close</Button>
                    </Row>
                </Head>

                <Body>
                    {mode === "upload" && (
                        <>
                            <p style={{ color: COLORS.subtext, margin: 0 }}>
                                We’ll upload <b>{DEFAULT_PRODUCTS.length}</b> products from <code>/src/assets/default-products/</code> into the selected category.
                            </p>
                            <div style={{ height: 8 }} />
                            <Grid>
                                {DEFAULT_PRODUCTS.map((p) => {
                                    const key = Object.keys(imageModules).find(k => k.endsWith("/" + p.file));
                                    const img = key ? (typeof imageModules[key] === "string" ? imageModules[key] : imageModules[key].default) : "";
                                    return (
                                        <div key={p.file} style={{ border: `1px solid ${COLORS.glassBorder}`, background: COLORS.glassHeader, borderRadius: 12, padding: 10 }}>
                                            {img ? <img src={img} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.glassBorder}` }} /> : <div style={{ height: 140, borderRadius: 8, background: "#1b2232" }} />}
                                            <div style={{ marginTop: 8, fontWeight: 700 }}>{p.title}</div>
                                            <div style={{ color: COLORS.subtext, fontSize: 12 }}>{p.subtitle}</div>
                                            <div style={{ fontSize: 12, marginTop: 6 }}>
                                                MRP: ₹{p.mrp} / <b>Price: ₹{p.price}</b> <span style={{ color: COLORS.subtext }}> · {p.sizeLabel}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </Grid>
                        </>
                    )}

                    {mode === "existing" && (
                        <>
                            <Row>
                                <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                                    <FiSearch style={{ position: "absolute", left: 10, top: 10, opacity: .7 }} />
                                    <Input
                                        style={{ width: "100%", paddingLeft: 36 }}
                                        placeholder="Search by title / subtitle / SKU"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div style={{ color: COLORS.subtext }}>Showing {filteredExisting.length}</div>
                            </Row>
                            <div style={{ height: 10 }} />
                            <Grid>
                                {filteredExisting.map(p => (
                                    <Item key={p.id}>
                                        <div>
                                            {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <div style={{ height: 140, borderRadius: 8, background: "#1b2232" }} />}
                                        </div>
                                        <div className="title">{p.title}</div>
                                        <div className="sub">
                                            ₹{p.price} {p.sizeLabel ? ` / ${p.sizeLabel}` : ""} · SKU: {p.sku || "-"}
                                        </div>
                                        <div style={{ marginTop: 6 }}>
                                            <input type="checkbox" checked={!!selected[p.id]} onChange={() => togglePick(p.id)} /> Pick
                                        </div>
                                    </Item>
                                ))}
                            </Grid>
                        </>
                    )}
                </Body>

                <Foot>
                    {progressNote && <div style={{ marginRight: "auto", color: COLORS.subtext }}>{progressNote}</div>}
                    {mode === "upload" ? (
                        <Button onClick={handleUploadDefaults} disabled={!catId || busy}>
                            <FiUpload /> Upload default products
                        </Button>
                    ) : (
                        <Button onClick={handleCopySelectedFromExisting} disabled={!catId || busy}>
                            <FiCheck /> Add selected to this category
                        </Button>
                    )}
                </Foot>
            </Card>
        </Blocker>
    );
}
