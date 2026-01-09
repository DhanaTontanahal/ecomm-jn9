import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
    addDoc, collection, deleteDoc, doc, getDocs, orderBy, query,
    serverTimestamp, updateDoc
} from "firebase/firestore";
import {
    getDownloadURL, ref, uploadBytesResumable, deleteObject
} from "firebase/storage";
import { db } from "../../firebase/firebase";
import { storage } from "../../firebase/firebase";
import { FiUpload, FiTrash2, FiEdit2, FiCheck, FiX, FiPlusCircle } from "react-icons/fi";
import BulkDefaultCategoryUploader from "../admin/BulkDefaultCategoryUploader";



/* ===== Style ===== */
const TOK = {
    bg: "#0b1220", card: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.14)",
    text: "#e7efff", sub: "#b7c6e6", primary: "#4ea1ff", success: "#22c55e", danger: "#ef4444",
};

const Page = styled.div`
  min-height: 100dvh;
  background: radial-gradient(1200px 600px at 20% -10%, #0b1220 0%, #0b1220 40%, #0b1220 100%) fixed;
  color: ${TOK.text};
  padding: 28px 18px 40px;
`;
const H = styled.h2`margin:0;font-size:clamp(18px,2.4vw,26px);`;
const Layout = styled.div`
  display:grid;gap:18px;grid-template-columns:1fr;max-width:1100px;margin:0 auto;
  @media (min-width:1000px){ grid-template-columns:380px 1fr; }
`;
const Card = styled.div`background:${TOK.card};border:1px solid ${TOK.border};border-radius:14px;padding:16px;`;
const Row = styled.div`display:grid;gap:8px;margin-bottom:12px;`;
const Label = styled.label`font-size:12px;color:${TOK.sub};`;
const Input = styled.input`
  background:rgba(255,255,255,.06);color:${TOK.text};border:1px solid ${TOK.border};
  border-radius:10px;padding:10px 12px;width:100%;
`;
const Switch = styled.button`
  border:1px solid ${TOK.border};
  background:${({ $on }) => $on ? "rgba(34,197,94,.16)" : "rgba(255,255,255,.06)"};
  color:${TOK.text};border-radius:999px;padding:6px 10px;width:max-content;
`;
const Actions = styled.div`
  display:flex;gap:8px;flex-wrap:wrap;
  button{border-radius:10px;padding:10px 12px;border:1px solid ${TOK.border};cursor:pointer;}
  .primary{background:${TOK.primary};color:#fff;border-color:${TOK.primary};}
  .ghost{background:transparent;color:${TOK.text};}
  .danger{background:${TOK.danger};color:#fff;border-color:${TOK.danger};}
`;
const List = styled.div`display:grid;gap:12px;`;
const Item = styled.div`
  display:grid;grid-template-columns:68px 1fr auto;gap:12px;align-items:center;
  border:1px solid ${TOK.border};border-radius:12px;padding:10px 12px;
  img{width:68px;height:52px;object-fit:cover;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid ${TOK.border};}
  h4{margin:0;font-size:14px}
  .tags{display:flex;gap:8px;color:${TOK.sub};font-size:12px;flex-wrap:wrap}
`;
const BusyBlocker = styled.div`
  position:fixed;inset:0;background:rgba(0,0,0,.5);
  display:grid;place-items:center;z-index:9999;
`;

/* ===== Helpers ===== */
const toSlug = (s = "") => s.toLowerCase().trim()
    .replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-").replace(/^\-+|\-+$/g, "");

/* ========= Confirm (TOK) ========= */
function useConfirmTOK() {
    const [state, setState] = useState({ open: false, title: "", body: "", confirmText: "Confirm", cancelText: "Cancel", danger: false, resolver: null });
    function confirm({ title, body, confirmText = "Confirm", cancelText = "Cancel", danger = false } = {}) {
        return new Promise(resolve => { setState({ open: true, title, body, confirmText, cancelText, danger, resolver: resolve }); });
    }
    function close(result) { state.resolver?.(result); setState(s => ({ ...s, open: false, resolver: null })); }
    const ConfirmModal = state.open ? (
        <div role="dialog" aria-modal="true" onClick={() => close(false)}
            style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,.45)", zIndex: 10010 }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: "min(92vw,440px)", borderRadius: 14, border: `1px solid ${TOK.border}`,
                background: TOK.bg, color: TOK.text, boxShadow: "0 20px 60px rgba(0,0,0,.45)"
            }}>
                <div style={{ padding: 16, borderBottom: `1px solid ${TOK.border}`, background: "rgba(255,255,255,.06)" }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{state.title || "Are you sure?"}</h3>
                </div>
                <div style={{ padding: 16, color: TOK.sub, lineHeight: 1.5 }}>{state.body || "This action cannot be undone."}</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: 12, borderTop: `1px solid ${TOK.border}` }}>
                    <button onClick={() => close(false)} style={{ borderRadius: 10, padding: "10px 12px", border: `1px solid ${TOK.border}`, background: "transparent", color: TOK.text }}>{state.cancelText}</button>
                    <button onClick={() => close(true)} style={{
                        borderRadius: 10, padding: "10px 12px",
                        background: state.danger ? TOK.danger : TOK.primary,
                        border: `1px solid ${state.danger ? TOK.danger : TOK.primary}`, color: "#fff"
                    }}>{state.confirmText}</button>
                </div>
            </div>
        </div>
    ) : null;
    React.useEffect(() => {
        if (!state.open) return; const onKey = e => { if (e.key === "Escape") close(false); if (e.key === "Enter") close(true); };
        window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
    }, [state.open]);
    return { confirm, ConfirmModal };
}

/* ===== Component ===== */
export default function AdminCategoryManager() {
    const { confirm, ConfirmModal } = useConfirmTOK();
    const [bulkOpen, setBulkOpen] = useState(false); // 👉 NEW

    const [list, setList] = useState([]);
    const [busy, setBusy] = useState(false);

    const [title, setTitle] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [slug, setSlug] = useState("");
    const [order, setOrder] = useState(100);
    const [active, setActive] = useState(true);
    const [gstRate, setGstRate] = useState(5);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState("");
    const [editId, setEditId] = useState(null);
    const fileRef = useRef();

    const load = async () => {
        const qy = query(collection(db, "productCategories"), orderBy("order", "asc"));
        const snap = await getDocs(qy);
        setList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    useEffect(() => { load(); }, []);
    useEffect(() => { setSlug(toSlug(displayName || title)); }, [title, displayName]);

    const reset = () => {
        setTitle(""); setDisplayName(""); setSlug("");
        setOrder(100); setActive(true); setGstRate(5);
        setImageFile(null); setImageUrl(""); setEditId(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const uploadImage = async (file) => {
        if (!file) return "";
        const path = `categories/${Date.now()}-${toSlug(file.name)}`;
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, file, { cacheControl: "public, max-age=31536000", contentType: file.type });
        await new Promise((res, rej) => { task.on("state_changed", null, rej, res); });
        return await getDownloadURL(task.snapshot.ref);
    };

    const handleSave = async () => {
        try {
            setBusy(true);
            let uploadedURL = imageUrl;
            if (imageFile) uploadedURL = await uploadImage(imageFile);

            const payload = {
                title: title || displayName,
                displayName, slug,
                order: Number(order) || 100,
                active: !!active,
                imageUrl: uploadedURL || "",
                gstRate: Number(gstRate) || 0,
                updatedAt: serverTimestamp(),
            };

            if (editId) {
                await updateDoc(doc(db, "productCategories", editId), payload);
            } else {
                await addDoc(collection(db, "productCategories"), { ...payload, createdAt: serverTimestamp() });
            }
            await load(); reset();
        } finally { setBusy(false); }
    };

    const handleEdit = (it) => {
        setEditId(it.id);
        setTitle(it.title || "");
        setDisplayName(it.displayName || "");
        setSlug(it.slug || "");
        setOrder(it.order ?? 100);
        setActive(!!it.active);
        setGstRate(it.gstRate ?? 0);
        setImageUrl(it.imageUrl || "");
        if (fileRef.current) fileRef.current.value = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (it) => {
        const ok = await confirm({
            title: "Delete this category?",
            body: `This will permanently delete "${it.displayName || it.title}". If products reference this category, they may become orphaned.`,
            confirmText: "Delete", cancelText: "Cancel", danger: true,
        });
        if (!ok) return;
        try {
            if (it.imageUrl?.includes("/o/")) {
                const decoded = decodeURIComponent(it.imageUrl.split("/o/")[1].split("?")[0]);
                await deleteObject(ref(storage, decoded));
            }
        } catch { }
        await deleteDoc(doc(db, "productCategories", it.id));
        await load();
    };

    return (
        <Page>
            {/* Header with bulk button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <H>Product Categories — Admin</H>
                <button
                    className="primary"
                    onClick={() => setBulkOpen(true)}
                    style={{ borderRadius: 10, padding: "10px 12px", border: `1px solid ${TOK.primary}`, background: TOK.primary, color: "#fff", display: "inline-flex", gap: 8, alignItems: "center" }}
                >
                    <FiPlusCircle /> Bulk upload defaults
                </button>
            </div>

            <Layout>
                {busy && (
                    <BusyBlocker>
                        <div style={{ background: TOK.card, padding: 20, borderRadius: 12, color: TOK.text, border: `1px solid ${TOK.border}` }}>
                            <span className="spinner" /> Saving category...
                        </div>
                    </BusyBlocker>
                )}

                {/* Form */}
                <Card>
                    <Row>
                        <Label>Display Name (shown on the green pill)</Label>
                        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ghee & Oils" />
                    </Row>

                    <Row>
                        <Label>Internal Title (optional)</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ghee and Oils" />
                    </Row>

                    <Row>
                        <Label>Slug (auto from name, can edit)</Label>
                        <Input value={slug} onChange={e => setSlug(toSlug(e.target.value))} placeholder="ghee-and-oils" />
                    </Row>

                    <Row style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                        <div>
                            <Label>Order</Label>
                            <Input type="number" value={order} onChange={e => setOrder(e.target.value)} />
                        </div>
                        <div>
                            <Label>Status</Label><br />
                            <Switch $on={active} aria-pressed={active} onClick={() => setActive(v => !v)}>
                                {active ? <><FiCheck /> Active</> : <><FiX /> Inactive</>}
                            </Switch>
                        </div>
                        <div>
                            <Label>GST (%)</Label>
                            <Input type="number" step="0.1" min="0" max="28" value={gstRate} onChange={e => setGstRate(e.target.value)} placeholder="e.g. 5" />
                        </div>
                    </Row>

                    <Row>
                        <Label>Image (4:3 works best)</Label>
                        <input ref={fileRef} type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                        {imageUrl && (
                            <div style={{ marginTop: 8 }}>
                                <img src={imageUrl} alt="current" style={{ width: 180, borderRadius: 10, border: `1px solid ${TOK.border}` }} />
                            </div>
                        )}
                    </Row>

                    <Actions>
                        <button className="primary" onClick={handleSave}>
                            <FiUpload /> {editId ? "Update Category" : "Create Category"}
                        </button>
                        <button className="ghost" onClick={reset}>Reset</button>
                    </Actions>
                </Card>

                {/* List */}
                <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                        <h3 style={{ margin: 0 }}>All Categories</h3>
                        <small style={{ color: TOK.sub }}>{list.length} items</small>
                    </div>
                    <List>
                        {list.map(it => (
                            <Item key={it.id}>
                                <img src={it.imageUrl || ""} alt={it.displayName || it.title} />
                                <div>
                                    <h4>{it.displayName || it.title}</h4>
                                    <div className="tags">
                                        <span>/{it.slug}</span>
                                        <span>• order {it.order ?? 100}</span>
                                        <span>• {it.active ? "active" : "inactive"}</span>
                                        <span>• GST {Number(it.gstRate ?? 0)}%</span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button title="Edit" onClick={() => handleEdit(it)}><FiEdit2 /></button>
                                    <button title="Delete" className="danger" onClick={() => handleDelete(it)}><FiTrash2 /></button>
                                </div>
                            </Item>
                        ))}
                        {!list.length && <div style={{ color: TOK.sub }}>No categories yet.</div>}
                    </List>
                </Card>
            </Layout>

            {/* 👉 Bulk modal */}
            <BulkDefaultCategoryUploader
                open={bulkOpen}
                onClose={() => setBulkOpen(false)}
                onComplete={() => { setBulkOpen(false); load(); }}
            />

            {ConfirmModal}
        </Page>
    );
}
