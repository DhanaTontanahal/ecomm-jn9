// src/components/admin/BulkDefaultProductUploader.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
    collection, getDocs, query, where, orderBy,
    addDoc, doc, serverTimestamp, runTransaction
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/firebase";
import { DEFAULT_PRODUCTS } from "./defaultProducts";
import { FiUpload, FiPackage, FiCheck, FiX, FiSearch, FiTrash2, FiRotateCcw } from "react-icons/fi";

/* ===== tokens ===== */
const COLORS = {
    glass: "rgba(255,255,255,.06)",
    glassBorder: "rgba(255,255,255,.12)",
    glassHeader: "rgba(255,255,255,.10)",
    text: "#e7efff",
    subtext: "#b7c6e6",
    ring: "#78c7ff",
    primary: "#4ea1ff",
    danger: "#ef4444",
    ok: "#10b981",
    bg: "#0b1220",
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

/* ===== layout (viewport-safe) ===== */
const Blocker = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  display: grid; place-items: center;
  padding: clamp(8px, 2vw, 16px);
  z-index: 9888;
`;
const Card = styled.div`
  width: min(98vw, 1100px);
  max-height: min(94dvh, 880px);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.bg};
  color: ${COLORS.text};
  box-shadow: 0 20px 60px rgba(0,0,0,.55);
  display: grid;
  grid-template-rows: auto 1fr auto;
`;
const Head = styled.div`
  position: sticky; top: 0; z-index: 2;
  padding: 12px 14px;
  border-bottom: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.glassHeader};
  display:flex; align-items:center; justify-content:space-between;
  h3{margin:0; font-size:18px}
  >div{display:flex; gap:10px; flex-wrap:wrap}
`;
const Body = styled.div`
  padding: 14px 16px;
  overflow: auto;
  animation: ${fade} .25s both;
`;
const Foot = styled.div`
  position: sticky; bottom: 0; z-index: 2;
  padding: 10px 14px;
  border-top: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.bg};
  display:flex; gap:10px; align-items:center; justify-content:flex-end;
`;
const Row = styled.div`display:flex; gap:10px; flex-wrap:wrap; align-items:center;`;
const Select = styled.select`
  background:${COLORS.glassHeader}; color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder}; border-radius:10px; padding:8px 10px; min-width: 240px;
  &:focus{outline:none; box-shadow:0 0 0 3px ${COLORS.ring}};
  option{background:#121a2b; color:${COLORS.text}};
`;
const Button = styled.button`
  background:${p => p.$danger ? COLORS.danger : p.$ok ? COLORS.ok : COLORS.primary}; color:white;
  border:none; border-radius:10px; padding:9px 12px; cursor:pointer;
  display:inline-flex; gap:8px; align-items:center;
  &:disabled{opacity:.6; cursor:not-allowed}
`;
const Input = styled.input`
  background:${COLORS.glassHeader}; color:${COLORS.text};
  border:1px solid ${COLORS.glassBorder}; border-radius:10px; padding:8px 10px;
  &:focus{outline:none; box-shadow:0 0 0 3px ${COLORS.ring}};
`;
const Grid = styled.div`
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap:12px;
`;
const CardItem = styled.div`
  border:1px solid ${COLORS.glassBorder};
  background:${COLORS.glassHeader};
  border-radius:12px; padding:10px;
  display:grid; grid-template-rows: auto auto auto 1fr auto; gap:8px;
`;
const Thumb = styled.div`
  position: relative;
  img{ width:100%; height:160px; object-fit:cover; border-radius:8px; border:1px solid ${COLORS.glassBorder}; background:#1b2232; }
  input[type="file"]{ display:none; }
  .overlay{ position:absolute; right:8px; top:8px; display:flex; gap:6px; }
  .badge{
    position:absolute; left:8px; top:8px; font-size:12px;
    background:${COLORS.bg}; color:${COLORS.text}; border:1px solid ${COLORS.glassBorder};
    padding:2px 6px; border-radius:8px; opacity:.9;
  }
`;
const Tiny = styled.div`font-size:12px; color:${COLORS.subtext};`;

/* ===== helpers ===== */
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
async function getNextProductSeq(db) {
    const refDoc = doc(db, "counters", "productSeq");
    return await runTransaction(db, async (tx) => {
        const snap = await tx.get(refDoc);
        const cur = snap.exists() ? (snap.data().value || 0) : 0;
        const n = cur + 1;
        tx.set(refDoc, { value: n }, { merge: true });
        return n;
    });
}

/* local images via Vite */
const imageModules = import.meta.glob("/src/assets/default-products/*.{png,jpg,jpeg,webp}", { eager: true });

function useActiveCategories() {
    const [cats, setCats] = useState([]);
    useEffect(() => {
        (async () => {
            const s = await getDocs(
                query(collection(db, "productCategories"), where("active", "==", true), orderBy("order", "asc"))
            );
            setCats(s.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, []);
    return cats;
}

/* ============ Component ============ */
export default function AdminBulkProductUploader({
    open,
    onClose,
    onComplete,
    defaultCategoryId = "",
    defaultCategorySlug = "",
}) {
    const cats = useActiveCategories();

    const [mode, setMode] = useState("upload"); // upload | existing
    const [catId, setCatId] = useState(defaultCategoryId);
    const [catSlug, setCatSlug] = useState(defaultCategorySlug);
    const [busy, setBusy] = useState(false);
    const [progressNote, setProgressNote] = useState("");

    // --- defaults working set (select/remove)
    const [items, setItems] = useState(DEFAULT_PRODUCTS.map(p => ({ ...p })));
    const [picked, setPicked] = useState(() =>
        Object.fromEntries(DEFAULT_PRODUCTS.map(p => [p.file, true]))
    );
    const [customFile, setCustomFile] = useState({}); // fileName -> File
    const [search, setSearch] = useState("");

    // existing mode
    const [existing, setExisting] = useState([]);
    const [existingPick, setExistingPick] = useState({});

    // close on Esc
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        // reset on open
        setMode("upload");
        setItems(DEFAULT_PRODUCTS.map(p => ({ ...p })));
        setPicked(Object.fromEntries(DEFAULT_PRODUCTS.map(p => [p.file, true])));
        setCustomFile({});
        setExisting([]);
        setExistingPick({});
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
            const s = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
            setExisting(s.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, [mode, open]);

    const filteredDefaults = useMemo(() => {
        if (!search) return items;
        const q = search.toLowerCase();
        return items.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.subtitle.toLowerCase().includes(q) ||
            p.file.toLowerCase().includes(q)
        );
    }, [items, search]);

    const filteredExisting = useMemo(() => {
        if (!search) return existing;
        const q = search.toLowerCase();
        return existing.filter(p =>
            (p.title || "").toLowerCase().includes(q) ||
            (p.subtitle || "").toLowerCase().includes(q) ||
            (p.sku || "").toLowerCase().includes(q)
        );
    }, [existing, search]);

    const resolveLocalImageUrl = (fileName) => {
        const key = Object.keys(imageModules).find(k => k.endsWith("/" + fileName));
        if (!key) return "";
        const mod = imageModules[key];
        return typeof mod === "string" ? mod : mod.default;
    };

    function togglePickDefault(file) {
        setPicked(prev => ({ ...prev, [file]: !prev[file] }));
    }

    function removeSelectedDefaults() {
        setItems(prev => prev.filter(p => !picked[p.file]));
        setPicked({});
        setCustomFile(prev => {
            const cp = { ...prev };
            Object.keys(cp).forEach(k => { if (!picked[k]) delete cp[k]; });
            return cp;
        });
    }

    function resetDefaults() {
        setItems(DEFAULT_PRODUCTS.map(p => ({ ...p })));
        setPicked(Object.fromEntries(DEFAULT_PRODUCTS.map(p => [p.file, true])));
        setCustomFile({});
    }

    // Enable/disable logic
    const hasPickedDefaults = useMemo(
        () => Object.entries(picked).some(([, v]) => !!v),
        [picked]
    );
    const hasPickedExisting = useMemo(
        () => Object.entries(existingPick).some(([, v]) => !!v),
        [existingPick]
    );
    const canUpload = !!catId && !busy && hasPickedDefaults;
    const canCopy = !!catId && !busy && hasPickedExisting;

    async function uploadOne(row) {
        // 1) pick blob: custom file OR packaged image
        let blob;
        if (customFile[row.file] instanceof File) {
            blob = customFile[row.file];
        } else {
            const url = resolveLocalImageUrl(row.file);
            if (!url) throw new Error(`Image not found: ${row.file}`);
            const r = await fetch(url);
            blob = await r.blob();
        }

        // 2) storage path
        const fname = `${Date.now()}-${toSlug(row.file)}`;
        const folder = `products/${catSlug || "uncategorized"}`;
        const path = `${folder}/${fname}`;
        const storageRef = ref(storage, path);

        await new Promise((resolve, reject) => {
            const t = uploadBytesResumable(storageRef, blob, { cacheControl: "public,max-age=31536000" });
            t.on("state_changed", () => { }, reject, resolve);
        });
        const downloadUrl = await getDownloadURL(storageRef);

        // 3) product doc
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

    async function handleUpload() {
        if (!catId) { alert("Choose a category first."); return; }
        const queue = items.filter(p => picked[p.file]);
        if (!queue.length) { alert("Select at least one default."); return; }

        setBusy(true);
        try {
            let i = 0;
            for (const row of queue) {
                i++;
                setProgressNote(`Uploading ${i}/${queue.length}: ${row.title}`);
                // eslint-disable-next-line no-await-in-loop
                await uploadOne(row);
            }
            setProgressNote("All selected defaults uploaded.");
            onComplete?.();
        } catch (e) {
            console.error(e);
            alert(e.message || "Upload failed");
        } finally {
            setBusy(false);
        }
    }

    async function handleCopyExisting() {
        if (!catId) { alert("Choose a category first."); return; }
        const queue = filteredExisting.filter(p => !!existingPick[p.id]);
        if (!queue.length) { alert("Pick at least one existing product."); return; }
        setBusy(true);
        try {
            let i = 0;
            for (const prod of queue) {
                i++;
                setProgressNote(`Copying ${i}/${queue.length}: ${prod.title}`);
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
        <Blocker onClick={onClose} aria-modal="true" role="dialog">
            <Card onClick={(e) => e.stopPropagation()}>
                <Head>
                    <h3>{mode === "upload" ? "Upload Default Products" : "Select From Existing Products"}</h3>
                    <div>
                        <Select value={catId ?? ""} onChange={e => setCatId(String(e.target.value))} required>
                            <option value="">Select category…</option>
                            {cats.map(c => <option key={c.id} value={c.id}>{c.displayName || c.title}</option>)}
                        </Select>
                        <Button onClick={() => setMode("upload")} $ok={mode === "upload"}><FiUpload />Defaults</Button>
                        <Button onClick={() => setMode("existing")} $ok={mode === "existing"}><FiPackage />Existing</Button>
                        <Button $danger onClick={onClose}><FiX />Close</Button>
                    </div>
                </Head>

                <Body>
                    <Row style={{ marginBottom: 8 }}>
                        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                            <FiSearch style={{ position: "absolute", left: 10, top: 10, opacity: .7 }} />
                            <Input
                                style={{ width: "100%", paddingLeft: 36 }}
                                placeholder={mode === "upload" ? "Search defaults…" : "Search existing…"}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        {mode === "upload" && (
                            <>
                                <Button onClick={removeSelectedDefaults} $danger title="Remove selected from this list (not from disk)">
                                    <FiTrash2 /> Remove selected
                                </Button>
                                <Button onClick={resetDefaults} title="Restore original default list">
                                    <FiRotateCcw /> Reset list
                                </Button>
                            </>
                        )}
                    </Row>

                    {mode === "upload" ? (
                        <Grid>
                            {filteredDefaults.map(p => {
                                const localUrl = resolveLocalImageUrl(p.file);
                                const hasCustom = !!customFile[p.file];
                                const previewUrl = hasCustom ? URL.createObjectURL(customFile[p.file]) : localUrl;
                                const checked = !!picked[p.file];

                                return (
                                    <CardItem key={p.file}>
                                        <Thumb>
                                            <img src={previewUrl || ""} alt={p.title} />
                                            <div className="badge">{checked ? "Selected" : "Not selected"}</div>
                                            <div className="overlay">
                                                <label>
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.webp"
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) setCustomFile(prev => ({ ...prev, [p.file]: f }));
                                                        }}
                                                    />
                                                    <Button as="span" title="Upload custom image"><FiUpload />Img</Button>
                                                </label>
                                                {hasCustom && (
                                                    <Button
                                                        $danger
                                                        title="Clear custom image"
                                                        onClick={() => setCustomFile(prev => { const cp = { ...prev }; delete cp[p.file]; return cp; })}
                                                    >
                                                        <FiX />Clear
                                                    </Button>
                                                )}
                                            </div>
                                        </Thumb>

                                        <div style={{ fontWeight: 700 }}>{p.title}</div>
                                        <Tiny>{p.subtitle}</Tiny>
                                        <Tiny>MRP ₹{p.mrp} • Price <b>₹{p.price}</b> • {p.sizeLabel}</Tiny>

                                        <Row>
                                            <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => togglePickDefault(p.file)}
                                                />
                                                Include
                                            </label>
                                            {hasCustom && <Tiny style={{ marginLeft: "auto" }}>Custom image attached</Tiny>}
                                        </Row>
                                    </CardItem>
                                );
                            })}
                        </Grid>
                    ) : (
                        <Grid>
                            {filteredExisting.map(p => (
                                <CardItem key={p.id}>
                                    <img
                                        src={p.imageUrl || ""}
                                        alt=""
                                        style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.glassBorder}` }}
                                    />
                                    <div style={{ fontWeight: 700 }}>{p.title}</div>
                                    <Tiny>₹{p.price}{p.sizeLabel ? ` / ${p.sizeLabel}` : ""} • SKU: {p.sku || "-"}</Tiny>
                                    <div style={{ marginTop: 6 }}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={!!existingPick[p.id]}
                                                onChange={() => setExistingPick(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                            /> Pick
                                        </label>
                                    </div>
                                </CardItem>
                            ))}
                        </Grid>
                    )}
                </Body>

                <Foot>
                    {progressNote && <Tiny style={{ marginRight: "auto" }}>{progressNote}</Tiny>}
                    {!catId && <Tiny style={{ marginRight: "auto" }}>Pick a category to enable actions.</Tiny>}
                    {catId && mode === "upload" && !hasPickedDefaults && (
                        <Tiny style={{ marginRight: "auto" }}>Select at least one default.</Tiny>
                    )}
                    {catId && mode === "existing" && !hasPickedExisting && (
                        <Tiny style={{ marginRight: "auto" }}>Pick at least one existing product.</Tiny>
                    )}

                    {mode === "upload" ? (
                        <Button onClick={handleUpload} disabled={!canUpload}><FiUpload /> Upload selected defaults</Button>
                    ) : (
                        <Button onClick={handleCopyExisting} disabled={!canCopy}><FiCheck /> Add selected</Button>
                    )}
                </Foot>
            </Card>
        </Blocker>
    );
}
