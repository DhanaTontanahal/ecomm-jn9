// src/components/admin/AdminHeaderCarouselManager.jsx
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
    addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query,
    serverTimestamp, setDoc, updateDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase/firebase";
import { FiUpload, FiPlus, FiEdit2, FiTrash2, FiX, FiExternalLink, FiChevronUp, FiChevronDown } from "react-icons/fi";

/* Glass tokens */
const C = {
    bg: "#0b1220", card: "rgba(255,255,255,.06)", card2: "rgba(255,255,255,.10)", border: "rgba(255,255,255,.14)",
    text: "#e7efff", sub: "#b7c6e6", ring: "#78c7ff", primary: "#4ea1ff", danger: "#ef4444"
};

const Page = styled.div`min-height:100dvh; background:${C.bg}; color:${C.text}; padding:20px;`;
const Grid = styled.div`
  display:grid; gap:16px; max-width:1280px; margin:0 auto; grid-template-columns:1fr;
  @media (min-width:1100px){ grid-template-columns:380px 1fr; }
`;
const Card = styled.div`background:${C.card}; border:1px solid ${C.border}; border-radius:14px; padding:14px;`;
const Row = styled.div`display:flex; gap:10px; flex-wrap:wrap; align-items:center;`;
const Label = styled.label`font-size:12px; color:${C.sub}; display:block; margin-bottom:6px;`;
const Input = styled.input`
  background:${C.card2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring} }
`;
const Select = styled.select`
  background:${C.card2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px; width:100%;
  color-scheme:dark; &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring} } option{ background:#121a2b; color:${C.text}; }
`;
const Btn = styled.button`
  background:${p => p.$danger ? C.danger : C.primary}; border:1px solid ${p => p.$danger ? C.danger : C.primary}; color:#fff;
  padding:10px 12px; border-radius:10px; cursor:pointer; &:disabled{opacity:.6}
`;
const Ghost = styled.button`border:1px solid ${C.border}; background:${C.card2}; color:${C.text}; padding:8px 10px; border-radius:10px;`;
const List = styled.div`display:grid; gap:10px;`;
const Item = styled.div`display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; border:1px solid ${C.border}; border-radius:12px; padding:10px;`;
const ItemInfo = styled.div`
  display:flex; gap:12px; align-items:center;
  img{ width:72px; height:54px; object-fit:cover; border-radius:10px; border:1px solid ${C.border}; background:#111827; }
  .meta{ font-size:12px; color:${C.sub} }
`;
const Small = styled.small`color:${C.sub};`;
const toSlug = (s = "") => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-").replace(/^\-+|\-+$/g, "");

export default function AdminHeaderCarouselManager() {
    /* Header doc */
    const [brandName, setBrandName] = useState("Prakruti Farms");
    const [brandInitials, setBrandInitials] = useState("PF");
    const [autoplaySec, setAutoplaySec] = useState(5);
    const [savingHdr, setSavingHdr] = useState(false);

    useEffect(() => {
        (async () => {
            const snap = await getDoc(doc(db, "site", "header"));
            if (snap.exists()) {
                const d = snap.data();
                setBrandName(d.brandName || "Prakruti Farms");
                setBrandInitials(d.brandInitials || "PF");
                setAutoplaySec(typeof d.autoplaySec === "number" ? d.autoplaySec : 5);
            }
        })();
    }, []);

    async function saveHeader() {
        setSavingHdr(true);
        try {
            await setDoc(doc(db, "site", "header"), {
                brandName: brandName || "Prakruti Farms",
                brandInitials: brandInitials || "PF",
                autoplaySec: Number(autoplaySec || 5),
                updatedAt: serverTimestamp(), createdAt: serverTimestamp(),
            }, { merge: true });
            alert("Header saved.");
        } finally { setSavingHdr(false); }
    }

    /* Menus */
    const [menus, setMenus] = useState([]);
    const [menEdit, setMenEdit] = useState(null);
    useEffect(() => {
        const qy = query(collection(db, "siteMenu"), orderBy("order", "asc"));
        return onSnapshot(qy, snap => setMenus(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);
    const newMenu = () => {
        const max = menus.length ? Math.max(...menus.map(m => m.order || 0)) : 0;
        return { label: "", url: "#", chevron: false, order: max + 1, active: true };
    };
    async function saveMenu(m) {
        const payload = {
            label: m.label || "", url: m.url || "#", chevron: !!m.chevron, order: Number(m.order || 0),
            active: !!m.active, updatedAt: serverTimestamp()
        };
        if (!m.id) await addDoc(collection(db, "siteMenu"), { ...payload, createdAt: serverTimestamp() });
        else await updateDoc(doc(db, "siteMenu", m.id), payload);
        setMenEdit(null);
    }
    async function deleteMenu(m) { if (!confirm(`Delete "${m.label}"?`)) return; await deleteDoc(doc(db, "siteMenu", m.id)); }
    async function nudgeMenu(m, d) { await updateDoc(doc(db, "siteMenu", m.id), { order: Number((m.order || 0) + d), updatedAt: serverTimestamp() }); }

    /* Slides */
    const [slides, setSlides] = useState([]);
    const [slEdit, setSlEdit] = useState(null);
    useEffect(() => {
        const qy = query(collection(db, "siteSlides"), orderBy("order", "asc"));
        return onSnapshot(qy, snap => setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);
    const newSlide = () => {
        const max = slides.length ? Math.max(...slides.map(s => s.order || 0)) : 0;
        return { imageUrl: "", imagePath: "", alt: "", link: "", order: max + 1, active: true };
    };
    async function uploadImage(file, oldPath) {
        if (!file) return { url: "", path: "" };
        try { if (oldPath) await deleteObject(ref(storage, oldPath)); } catch { }
        const path = `slides/${Date.now()}-${toSlug(file.name)}`;
        const r = ref(storage, path);
        const task = uploadBytesResumable(r, file, { cacheControl: "public,max-age=31536000" });
        await new Promise((res, rej) => task.on("state_changed", null, rej, res));
        const url = await getDownloadURL(task.snapshot.ref);
        return { url, path };
    }
    async function saveSlide(s, file) {
        let next = { ...s };
        if (file) {
            const up = await uploadImage(file, s.imagePath);
            next.imageUrl = up.url; next.imagePath = up.path;
        }
        const payload = {
            imageUrl: next.imageUrl || "", imagePath: next.imagePath || "", alt: next.alt || "", link: next.link || "",
            order: Number(next.order || 0), active: !!next.active, updatedAt: serverTimestamp()
        };
        if (!next.id) await addDoc(collection(db, "siteSlides"), { ...payload, createdAt: serverTimestamp() });
        else await updateDoc(doc(db, "siteSlides", next.id), payload);
        setSlEdit(null);
    }
    async function deleteSlide(s) {
        if (!confirm("Delete this slide?")) return;
        try { if (s.imagePath) await deleteObject(ref(storage, s.imagePath)); } catch { }
        await deleteDoc(doc(db, "siteSlides", s.id));
    }
    async function nudgeSlide(s, d) { await updateDoc(doc(db, "siteSlides", s.id), { order: Number((s.order || 0) + d), updatedAt: serverTimestamp() }); }

    return (
        <Page>
            <h2 style={{ margin: "0 0 14px" }}>Admin · Header & Carousel</h2>
            <Grid>
                {/* Header settings */}
                <Card>
                    <h3 style={{ marginTop: 0 }}>Header Settings</h3>
                    <div style={{ display: "grid", gap: 10 }}>
                        <div><Label>Brand Name</Label><Input value={brandName} onChange={e => setBrandName(e.target.value)} /></div>
                        <div><Label>Brand Initials (Logo circle)</Label><Input value={brandInitials} onChange={e => setBrandInitials(e.target.value)} /></div>
                        <Row>
                            <div style={{ flex: "1 1 180px" }}><Label>Autoplay (seconds)</Label><Input type="number" value={autoplaySec} onChange={e => setAutoplaySec(Number(e.target.value))} /></div>
                            <Btn onClick={saveHeader} disabled={savingHdr}><FiUpload /> Save</Btn>
                        </Row>
                    </div>
                </Card>

                {/* Menus */}
                <Card>
                    <Row style={{ justifyContent: "space-between" }}>
                        <h3 style={{ margin: 0 }}>Menu Links</h3>
                        <Btn onClick={() => setMenEdit(newMenu())}><FiPlus /> Add</Btn>
                    </Row>
                    <List style={{ marginTop: 10 }}>
                        {menus.map(m => (
                            <Item key={m.id}>
                                <ItemInfo>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{m.label} {m.chevron ? <Small>• chevron</Small> : null}</div>
                                        <div className="meta">
                                            <a href={m.url} target="_blank" rel="noreferrer" style={{ color: C.text, textDecoration: "none" }}>
                                                <FiExternalLink style={{ verticalAlign: "-2px" }} /> {m.url}
                                            </a>
                                            <span> • order {m.order ?? 0}</span>
                                            <span> • {m.active ? "active" : "inactive"}</span>
                                        </div>
                                    </div>
                                </ItemInfo>
                                <Row>
                                    <Ghost onClick={() => nudgeMenu(m, -1)} title="Up"><FiChevronUp /></Ghost>
                                    <Ghost onClick={() => nudgeMenu(m, +1)} title="Down"><FiChevronDown /></Ghost>
                                    <Ghost onClick={() => setMenEdit(m)}><FiEdit2 /> Edit</Ghost>
                                    <Ghost onClick={() => deleteMenu(m)} style={{ borderColor: C.danger, color: "#fecaca" }}><FiTrash2 /> Delete</Ghost>
                                </Row>
                            </Item>
                        ))}
                        {!menus.length && <Small>No menu links yet.</Small>}
                    </List>

                    {menEdit && <MenuEditor value={menEdit} onCancel={() => setMenEdit(null)} onSave={saveMenu} />}
                </Card>

                {/* Slides */}
                <Card style={{ gridColumn: "1 / -1" }}>
                    <Row style={{ justifyContent: "space-between" }}>
                        <h3 style={{ margin: 0 }}>Carousel Slides</h3>
                        <Btn onClick={() => setSlEdit(newSlide())}><FiPlus /> Add Slide</Btn>
                    </Row>
                    <List style={{ marginTop: 10 }}>
                        {slides.map(s => (
                            <Item key={s.id}>
                                <ItemInfo>
                                    {s.imageUrl ? <img src={s.imageUrl} alt={s.alt || ""} /> : <div style={{ width: 72, height: 54, borderRadius: 10, border: `1px solid ${C.border}`, background: "#111827" }} />}
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{s.alt || "(no alt text)"}</div>
                                        <div className="meta">
                                            {s.link ? <><FiExternalLink style={{ verticalAlign: "-2px" }} /> {s.link} • </> : null}
                                            order {s.order ?? 0} • {s.active ? "active" : "inactive"}
                                        </div>
                                    </div>
                                </ItemInfo>
                                <Row>
                                    <Ghost onClick={() => nudgeSlide(s, -1)} title="Up"><FiChevronUp /></Ghost>
                                    <Ghost onClick={() => nudgeSlide(s, +1)} title="Down"><FiChevronDown /></Ghost>
                                    <Ghost onClick={() => setSlEdit(s)}><FiEdit2 /> Edit</Ghost>
                                    <Ghost onClick={() => deleteSlide(s)} style={{ borderColor: C.danger, color: "#fecaca" }}><FiTrash2 /> Delete</Ghost>
                                </Row>
                            </Item>
                        ))}
                        {!slides.length && <Small>No slides yet.</Small>}
                    </List>

                    {slEdit && <SlideEditor value={slEdit} onCancel={() => setSlEdit(null)} onSave={saveSlide} />}
                </Card>
            </Grid>
        </Page>
    );
}

/* ---- Editors ---- */
function MenuEditor({ value, onSave, onCancel }) {
    const [form, setForm] = useState(value);
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
    return (
        <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.border}`, borderRadius: 12, background: C.card2 }}>
            <Row>
                <div style={{ flex: "2 1 220px" }}><Label>Label</Label><Input value={form.label} onChange={e => set("label", e.target.value)} /></div>
                <div style={{ flex: "3 1 320px" }}><Label>URL</Label><Input value={form.url} onChange={e => set("url", e.target.value)} /></div>
                <div style={{ flex: "1 1 120px" }}><Label>Order</Label><Input type="number" value={form.order || 0} onChange={e => set("order", Number(e.target.value))} /></div>
                <div style={{ flex: "1 1 120px" }}><Label>Status</Label>
                    <Select value={form.active ? "1" : "0"} onChange={e => set("active", e.target.value === "1")}>
                        <option value="1">Active</option><option value="0">Inactive</option>
                    </Select>
                </div>
                <div style={{ flex: "1 1 140px" }}><Label>Show Chevron?</Label>
                    <Select value={form.chevron ? "1" : "0"} onChange={e => set("chevron", e.target.value === "1")}>
                        <option value="1">Yes</option><option value="0">No</option>
                    </Select>
                </div>
            </Row>
            <Row style={{ justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <Ghost onClick={onCancel}><FiX /> Cancel</Ghost>
                <Btn onClick={() => onSave(form)}><FiUpload /> Save Menu</Btn>
            </Row>
        </div>
    );
}

function SlideEditor({ value, onSave, onCancel }) {
    const [form, setForm] = useState(value);
    const [file, setFile] = useState(null);
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
    const preview = file ? URL.createObjectURL(file) : (form.imageUrl || "");
    return (
        <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.border}`, borderRadius: 12, background: C.card2 }}>
            <Row>
                <div style={{ flex: "3 1 320px" }}><Label>Alt text</Label><Input value={form.alt} onChange={e => set("alt", e.target.value)} /></div>
                <div style={{ flex: "3 1 320px" }}><Label>Link (optional)</Label><Input value={form.link || ""} onChange={e => set("link", e.target.value)} /></div>
                <div style={{ flex: "1 1 120px" }}><Label>Order</Label><Input type="number" value={form.order || 0} onChange={e => set("order", Number(e.target.value))} /></div>
                <div style={{ flex: "1 1 120px" }}><Label>Status</Label>
                    <Select value={form.active ? "1" : "0"} onChange={e => set("active", e.target.value === "1")}>
                        <option value="1">Active</option><option value="0">Inactive</option>
                    </Select>
                </div>
            </Row>
            <Row style={{ alignItems: "flex-end", gap: 12, marginTop: 10 }}>
                <div style={{ flex: "3 1 380px" }}>
                    <Label>Slide Image (recommended ~1600×700)</Label>
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <div style={{ flex: "2 1 220px" }}>
                    {preview ? <img src={preview} alt="preview" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.border}` }} /> :
                        <div style={{ width: "100%", height: 120, borderRadius: 10, border: `1px solid ${C.border}`, background: "#111827" }} />}
                </div>
            </Row>
            <Row style={{ justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <Ghost onClick={onCancel}><FiX /> Cancel</Ghost>
                <Btn onClick={() => onSave(form, file)}><FiUpload /> Save Slide</Btn>
            </Row>
        </div>
    );
}
