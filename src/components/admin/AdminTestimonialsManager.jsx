import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
    addDoc, collection, deleteDoc, doc, getDocs, orderBy, query,
    serverTimestamp, setDoc, updateDoc, where
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase/firebase";
import { FiPlus, FiTrash2, FiImage, FiSave, FiArrowUp, FiArrowDown, FiToggleLeft, FiToggleRight } from "react-icons/fi";

const Wrap = styled.div`
  max-width: 980px; margin: 24px auto; padding: 20px;
  background:#fff; border:1px solid #e5e7eb; border-radius:14px;
`;
const H = styled.h2`margin:0 0 12px;`;
const Small = styled.small`color:#6b7280;`;
const Grid = styled.div`display:grid; gap:12px;`;
const Card = styled.div`
  border:1px solid #e5e7eb; border-radius:12px; padding:12px;
  display:grid; grid-template-columns: 96px 1fr auto; gap:12px; align-items:center;
`;
const Thumb = styled.img`
  width:96px; height:96px; object-fit:cover; border-radius:12px; background:#f5f6f7;
`;
const Col = styled.div`display:grid; gap:8px;`;
const Row = styled.div`display:grid; grid-template-columns: 1fr 120px 120px; gap:8px;`;
const Input = styled.input`
  border:1px solid #d1d5db; border-radius:10px; padding:10px 12px; outline:none; width:100%;
  &:focus{ border-color:#6e8c53; box-shadow:0 0 0 3px rgba(110,140,83,.15); }
`;
const Textarea = styled.textarea`
  border:1px solid #d1d5db; border-radius:10px; padding:10px 12px; outline:none; width:100%; min-height:72px;
  &:focus{ border-color:#6e8c53; box-shadow:0 0 0 3px rgba(110,140,83,.15); }
`;
const BtnRow = styled.div`display:flex; gap:8px; align-items:center;`;
const Btn = styled.button`
  display:inline-flex; align-items:center; gap:8px; padding:10px 12px; border-radius:10px;
  border:1px solid #d1d5db; background:#fff; cursor:pointer; font-weight:700;
  &:hover{ background:#f9fafb; }
`;
const Primary = styled(Btn)`background:#6e8c53; color:#fff; border-color:#6e8c53;`;
const Ghost = styled(Btn)``;
const Danger = styled(Btn)`color:#b91c1c; border-color:#fecaca;`;
const Toggle = styled(Btn)``;
const Toolbar = styled.div`display:flex; gap:8px; justify-content:flex-end; margin:12px 0;`;
const Uploader = styled.label`
  display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-weight:700;
  input{ display:none; }
`;

const seedDefaults = [
    {
        name: "Amogh Kadam",
        role: "Consumer",
        text: "I’ve tried a lot of brands, but this A2 Desi Cow Ghee is something else. Rich, fragrant, and just perfect for everyday cooking.",
        stars: 5,
        imageUrl: "/assets/human-1.jpg" // optional placeholder
    },
    {
        name: "Gayatri Bajoria",
        role: "Consumer",
        text: "I’m using the jaggery powder to replace white sugar in my coffee — it dissolves well and gives a deep caramel flavor. I really like it.",
        stars: 5,
        imageUrl: "/assets/human-2.jpg"
    },
    {
        name: "Sunaina Agarwal",
        role: "Consumer",
        text: "You can always trust them to deliver quality. The forest honey was rich, thick and packed with natural flavor — nothing artificial here.",
        stars: 5,
        imageUrl: "/assets/human-3.jpg"
    }
];

export default function AdminTestimonialsManager() {
    const coll = collection(db, "siteTestimonials");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingAll, setSavingAll] = useState(false);

    const load = async () => {
        setLoading(true);
        const snap = await getDocs(query(coll, orderBy("order", "asc")));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRows(list);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const addEmpty = async () => {
        const payload = {
            name: "",
            role: "",
            text: "",
            stars: 5,
            imageUrl: "",
            imagePath: "",
            active: true,
            order: (rows?.length || 0),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const dref = await addDoc(coll, payload);
        setRows(prev => [...prev, { id: dref.id, ...payload }]);
    };

    const onChange = (id, key, val) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
    };

    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= rows.length) return;
        const next = [...rows];
        const [a, b] = [next[i], next[j]];
        [next[i], next[j]] = [b, a];
        // normalize order indices
        const normalized = next.map((r, idx) => ({ ...r, order: idx }));
        setRows(normalized);
    };

    const saveOne = async (r) => {
        const dref = doc(db, "siteTestimonials", r.id);
        const payload = {
            name: r.name || "",
            role: r.role || "",
            text: r.text || "",
            stars: Number(r.stars || 5),
            imageUrl: r.imageUrl || "",
            imagePath: r.imagePath || "",
            active: !!r.active,
            order: Number(r.order || 0),
            updatedAt: serverTimestamp(),
            createdAt: r.createdAt || serverTimestamp(),
        };
        await setDoc(dref, payload, { merge: true });
    };

    const saveAll = async () => {
        setSavingAll(true);
        try {
            for (const r of rows) await saveOne(r);
            await load();
            alert("Saved!");
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        } finally {
            setSavingAll(false);
        }
    };

    const remove = async (r) => {
        if (!window.confirm("Delete this testimonial?")) return;
        // delete image file if present
        if (r.imagePath) {
            try { await deleteObject(ref(storage, r.imagePath)); } catch { }
        }
        await deleteDoc(doc(db, "siteTestimonials", r.id));
        await load();
    };

    const uploadImage = (r, file) => {
        if (!file) return;
        const path = `testimonials/${r.id}/${file.name}`;
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, file);
        task.on("state_changed", () => { }, (err) => {
            console.error(err); alert("Upload failed");
        }, async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            // save immediately so refresh won’t lose it
            await updateDoc(doc(db, "siteTestimonials", r.id), {
                imageUrl: url, imagePath: path, updatedAt: serverTimestamp()
            });
            setRows(prev => prev.map(x => x.id === r.id ? { ...x, imageUrl: url, imagePath: path } : x));
        });
    };

    const toggleActive = async (r) => {
        const nv = !r.active;
        setRows(prev => prev.map(x => x.id === r.id ? { ...x, active: nv } : x));
    };

    const seed = async () => {
        if (!window.confirm("Seed default testimonials? This adds new docs.")) return;
        let order = rows.length;
        for (const s of seedDefaults) {
            await addDoc(coll, {
                name: s.name, role: s.role, text: s.text, stars: s.stars,
                imageUrl: s.imageUrl || "", imagePath: "", active: true, order: order++,
                createdAt: serverTimestamp(), updatedAt: serverTimestamp()
            });
        }
        await load();
    };

    return (
        <Wrap>
            <H>Testimonials</H>
            <Small>Stored in <code>siteTestimonials</code>. Uploads go to <code>storage/testimonials/&lt;id&gt;/</code>.</Small>

            <Toolbar>
                <Ghost onClick={seed}><FiPlus /> Seed defaults</Ghost>
                <Primary onClick={addEmpty}><FiPlus /> Add</Primary>
                <Primary onClick={saveAll} disabled={savingAll}><FiSave /> {savingAll ? "Saving..." : "Save All"}</Primary>
            </Toolbar>

            {loading ? "Loading…" : (
                <Grid>
                    {rows.map((r, i) => (
                        <Card key={r.id}>
                            <div>
                                {r.imageUrl ? (
                                    <Thumb src={r.imageUrl} alt={r.name} />
                                ) : (
                                    <div style={{ width: 96, height: 96, borderRadius: 12, background: "#f5f6f7", display: "grid", placeItems: "center", color: "#6b7280" }}>No image</div>
                                )}
                                <Uploader>
                                    <FiImage /> Image
                                    <input type="file" accept="image/*" onChange={e => uploadImage(r, e.target.files?.[0])} />
                                </Uploader>
                            </div>

                            <Col>
                                <Input placeholder="Name" value={r.name || ""} onChange={e => onChange(r.id, "name", e.target.value)} />
                                <Row>
                                    <Input placeholder="Role" value={r.role || ""} onChange={e => onChange(r.id, "role", e.target.value)} />
                                    <Input placeholder="Stars (1-5)" type="number" min={1} max={5} value={r.stars || 5} onChange={e => onChange(r.id, "stars", e.target.value)} />
                                    <Input placeholder="Order" type="number" value={r.order ?? 0} onChange={e => onChange(r.id, "order", Number(e.target.value))} />
                                </Row>
                                <Textarea placeholder="Quote / Text" value={r.text || ""} onChange={e => onChange(r.id, "text", e.target.value)} />
                                <div style={{ fontSize: 12, color: "#6b7280" }}>{r.imagePath || ""}</div>
                            </Col>

                            <BtnRow style={{ justifySelf: "end" }}>
                                <Btn onClick={() => move(i, -1)} title="Move up"><FiArrowUp /></Btn>
                                <Btn onClick={() => move(i, +1)} title="Move down"><FiArrowDown /></Btn>
                                <Toggle onClick={() => toggleActive(r)} title="Toggle active">
                                    {r.active ? <><FiToggleRight /> Active</> : <><FiToggleLeft /> Inactive</>}
                                </Toggle>
                                <Danger onClick={() => remove(r)} title="Delete"><FiTrash2 /> Delete</Danger>
                            </BtnRow>
                        </Card>
                    ))}
                </Grid>
            )}
        </Wrap>
    );
}
