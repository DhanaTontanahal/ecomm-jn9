import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../../firebase/firebase";
import { FiUpload, FiX, FiRotateCcw, FiTrash2, FiSearch } from "react-icons/fi";
import { DEFAULT_CATEGORIES } from "./defaultCategories";

/* ===== UI ===== */
const COLORS = {
    glass: "rgba(255,255,255,.06)", glassBorder: "rgba(255,255,255,.12)", glassHeader: "rgba(255,255,255,.10)",
    text: "#e7efff", subtext: "#b7c6e6", ring: "#78c7ff", primary: "#4ea1ff", danger: "#ef4444", ok: "#10b981", bg: "#0b1220",
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;
const Blocker = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:clamp(8px,2vw,16px);z-index:9888;`;
const Card = styled.div`width:min(98vw,1100px);max-height:min(94dvh,880px);border-radius:14px;overflow:hidden;border:1px solid ${COLORS.glassBorder};background:${COLORS.bg};color:${COLORS.text};box-shadow:0 20px 60px rgba(0,0,0,.55);display:grid;grid-template-rows:auto 1fr auto;`;
const Head = styled.div`position:sticky;top:0;z-index:2;padding:12px 14px;border-bottom:1px solid ${COLORS.glassBorder};background:${COLORS.glassHeader};display:flex;align-items:center;justify-content:space-between;h3{margin:0;font-size:18px} >div{display:flex;gap:10px;flex-wrap:wrap}`;
const Body = styled.div`padding:14px 16px;overflow:auto;animation:${fade} .25s both;`;
const Foot = styled.div`position:sticky;bottom:0;z-index:2;padding:10px 14px;border-top:1px solid ${COLORS.glassBorder};background:${COLORS.bg};display:flex;gap:10px;align-items:center;justify-content:flex-end;`;
const Row = styled.div`display:flex;gap:10px;flex-wrap:wrap;align-items:center;`;
const Button = styled.button`background:${p => p.$danger ? COLORS.danger : p.$ok ? COLORS.ok : COLORS.primary};color:#fff;border:none;border-radius:10px;padding:9px 12px;display:inline-flex;gap:8px;align-items:center;cursor:pointer;&:disabled{opacity:.6;cursor:not-allowed}`;
const Input = styled.input`background:${COLORS.glassHeader};color:${COLORS.text};border:1px solid ${COLORS.glassBorder};border-radius:10px;padding:8px 10px;&:focus{outline:none;box-shadow:0 0 0 3px ${COLORS.ring}}`;
const Grid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;`;
const CardItem = styled.div`border:1px solid ${COLORS.glassBorder};background:${COLORS.glassHeader};border-radius:12px;padding:10px;display:grid;grid-template-rows:auto auto auto 1fr auto;gap:8px;`;
const Thumb = styled.div`
  position:relative;
  img{width:100%;height:160px;object-fit:cover;border-radius:8px;border:1px solid ${COLORS.glassBorder};background:#1b2232;}
  input[type=file]{display:none;}
  .overlay{position:absolute;right:8px;top:8px;display:flex;gap:6px;}
  .badge{position:absolute;left:8px;top:8px;font-size:12px;background:${COLORS.bg};color:${COLORS.text};border:1px solid ${COLORS.glassBorder};padding:2px 6px;border-radius:8px;opacity:.9;}
`;
const Tiny = styled.div`font-size:12px;color:${COLORS.subtext};`;

/* ===== helpers ===== */
const toSlug = (s = "") => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-").replace(/^\-+|\-+$/g, "");
const imageModules = import.meta.glob("/src/assets/default-categories/*.{png,jpg,jpeg,webp}", { eager: true });
const useExisting = () => {
    const [cats, setCats] = useState([]);
    useEffect(() => {
        (async () => {
            const s = await getDocs(query(collection(db, "productCategories"), orderBy("order", "asc")));
            setCats(s.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, []);
    return cats;
};

export default function BulkDefaultCategoryUploader({ open, onClose, onComplete }) {
    const existing = useExisting();
    const [items, setItems] = useState(DEFAULT_CATEGORIES.map(c => ({ ...c })));
    const [picked, setPicked] = useState(Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.slug, true])));
    const [customFile, setCustomFile] = useState({}); // slug -> File
    const [search, setSearch] = useState("");
    const [busy, setBusy] = useState(false);
    const [progressNote, setProgressNote] = useState("");

    useEffect(() => {
        if (!open) return;
        setItems(DEFAULT_CATEGORIES.map(c => ({ ...c })));
        setPicked(Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.slug, true])));
        setCustomFile({}); setSearch(""); setProgressNote("");
    }, [open]);

    const filtered = useMemo(() => {
        if (!search) return items;
        const q = search.toLowerCase();
        return items.filter(c => (c.displayName || "").toLowerCase().includes(q) || (c.slug || "").toLowerCase().includes(q));
    }, [items, search]);

    const resolveLocal = (file) => {
        const k = Object.keys(imageModules).find(x => x.endsWith("/" + file));
        if (!k) return ""; const mod = imageModules[k]; return typeof mod === "string" ? mod : mod.default;
    };
    const togglePick = (slug) => setPicked(p => ({ ...p, [slug]: !p[slug] }));
    const removeSelected = () => { setItems(prev => prev.filter(it => !picked[it.slug])); setPicked({}); setCustomFile({}); };
    const resetList = () => { setItems(DEFAULT_CATEGORIES.map(c => ({ ...c }))); setPicked(Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.slug, true]))); setCustomFile({}); };

    async function uploadOne(row) {
        // slug de-dupe
        let slug = row.slug; let n = 2;
        while (existing.find(e => (e.slug || "") === slug)) slug = `${row.slug}-${n++}`;

        // image
        let blob;
        if (customFile[row.slug] instanceof File) { blob = customFile[row.slug]; }
        else {
            const url = resolveLocal(row.file);
            if (!url) throw new Error(`Image not found: ${row.file}`);
            const r = await fetch(url); blob = await r.blob();
        }

        const name = `${Date.now()}-${toSlug(row.file)}`;
        const path = `categories/${name}`;
        const storageRef = ref(storage, path);
        await new Promise((res, rej) => {
            const t = uploadBytesResumable(storageRef, blob, { cacheControl: "public,max-age=31536000" });
            t.on("state_changed", () => { }, rej, res);
        });
        const imageUrl = await getDownloadURL(storageRef);

        const payload = {
            title: row.displayName,
            displayName: row.displayName,
            slug,
            imageUrl,
            order: Number(row.order || 100),
            active: row.active !== false,
            gstRate: Number(row.gstRate || 0),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await addDoc(collection(db, "productCategories"), payload);
    }

    async function handleUpload() {
        const queue = items.filter(it => picked[it.slug]);
        if (!queue.length) { alert("Pick at least one category."); return; }
        setBusy(true);
        try {
            let i = 0;
            for (const row of queue) {
                i++; setProgressNote(`Uploading ${i}/${queue.length}: ${row.displayName}`);
                // eslint-disable-next-line no-await-in-loop
                await uploadOne(row);
            }
            setProgressNote("All selected categories uploaded.");
            onComplete?.();
        } catch (e) { console.error(e); alert(e.message || "Upload failed"); }
        finally { setBusy(false); }
    }

    if (!open) return null;

    return (
        <Blocker onClick={onClose}>
            <Card onClick={(e) => e.stopPropagation()}>
                <Head>
                    <h3>Upload Default Categories</h3>
                    <div>
                        <Button onClick={removeSelected} $danger><FiTrash2 />Remove selected</Button>
                        <Button onClick={resetList}><FiRotateCcw />Reset list</Button>
                        <Button $danger onClick={onClose}><FiX />Close</Button>
                    </div>
                </Head>

                <Body>
                    <Row style={{ marginBottom: 8 }}>
                        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
                            <FiSearch style={{ position: "absolute", left: 10, top: 10, opacity: .7 }} />
                            <Input placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", paddingLeft: 36 }} />
                        </div>
                        <Tiny>Selected: {Object.values(picked).filter(Boolean).length}</Tiny>
                    </Row>

                    <Grid>
                        {filtered.map(row => {
                            const hasCustom = !!customFile[row.slug];
                            const packaged = resolveLocal(row.file);
                            const preview = hasCustom ? URL.createObjectURL(customFile[row.slug]) : packaged;
                            const checked = !!picked[row.slug];
                            return (
                                <CardItem key={row.slug}>
                                    <Thumb>
                                        <img src={preview || ""} alt={row.displayName} />
                                        <div className="badge">{checked ? "Selected" : "Not selected"}</div>
                                        <div className="overlay">
                                            <label>
                                                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCustomFile(prev => ({ ...prev, [row.slug]: f })); }} />
                                                <Button as="span"><FiUpload />Img</Button>
                                            </label>
                                            {hasCustom && <Button $danger onClick={() => setCustomFile(prev => { const n = { ...prev }; delete n[row.slug]; return n; })}><FiX />Clear</Button>}
                                        </div>
                                    </Thumb>
                                    <div style={{ fontWeight: 700 }}>{row.displayName}</div>
                                    <Tiny>/{row.slug} • order {row.order ?? 100} • GST {Number(row.gstRate ?? 0)}%</Tiny>
                                    <Row>
                                        <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                                            <input type="checkbox" checked={checked} onChange={() => togglePick(row.slug)} />
                                            Include
                                        </label>
                                        {hasCustom && <Tiny style={{ marginLeft: "auto" }}>Custom image attached</Tiny>}
                                    </Row>
                                </CardItem>
                            );
                        })}
                    </Grid>
                </Body>

                <Foot>
                    {progressNote && <Tiny style={{ marginRight: "auto" }}>{progressNote}</Tiny>}
                    <Button onClick={handleUpload} disabled={busy}><FiUpload />Upload selected</Button>
                </Foot>
            </Card>
        </Blocker>
    );
}
