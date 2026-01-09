import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
    addDoc, collection, deleteDoc, doc, getDocs, orderBy, query,
    serverTimestamp, setDoc, updateDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase/firebase";
import {
    FiPlus, FiTrash2, FiImage, FiSave, FiArrowUp, FiArrowDown,
    FiToggleLeft, FiToggleRight, FiExternalLink
} from "react-icons/fi";

// (Optional) seed assets (same files you used in the public component)
import cert1 from "../../assets/cert-india-organic.png";
import cert2 from "../../assets/cert-ecocert.png";
import cert3 from "../../assets/cert-jaivik-bharat.png";
import cert4 from "../../assets/cert-usda-organic.png";
import cert5 from "../../assets/cert-haccp.png";
import cert6 from "../../assets/cert-noca.png";

/* ===== UI bits ===== */
const Wrap = styled.div`
  max-width: 980px; margin: 24px auto; padding: 20px;
  background:#fff; border:1px solid #e5e7eb; border-radius:14px;
`;
const H = styled.h2`margin:0 0 12px;`;
const Small = styled.small`color:#6b7280;`;
const Grid = styled.div`display:grid; gap:12px;`;
const Card = styled.div`
  border:1px solid #e5e7eb; border-radius:12px; padding:12px;
  display:grid; grid-template-columns: 120px 1fr auto; gap:12px; align-items:center;
`;
const Thumb = styled.img`
  width:120px; height:90px; object-fit:contain; border-radius:10px; background:#f5f6f7; outline:1px solid rgba(0,0,0,.06);
`;
const Col = styled.div`display:grid; gap:8px;`;
const Row = styled.div`display:grid; grid-template-columns: 1fr 120px 120px; gap:8px;`;
const Input = styled.input`
  border:1px solid #d1d5db; border-radius:10px; padding:10px 12px; outline:none; width:100%;
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
  display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-weight:700; margin-top:8px;
  input{ display:none; }
`;

/* ===== defaults for seeding ===== */
const seedDefaults = [
    { alt: "India Organic", src: cert1, href: "" },
    { alt: "ECOCERT", src: cert2, href: "" },
    { alt: "Jaivik Bharat", src: cert3, href: "" },
    { alt: "USDA Organic", src: cert4, href: "" },
    { alt: "HACCP Certified", src: cert5, href: "" },
    { alt: "NOCA NPOP/NAB/0026", src: cert6, href: "" },
];

export default function AdminCertificationsManager() {
    const coll = collection(db, "siteCertifications");

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
            alt: "",
            href: "",
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
        const normalized = next.map((r, idx) => ({ ...r, order: idx }));
        setRows(normalized);
    };

    const saveOne = async (r) => {
        const dref = doc(db, "siteCertifications", r.id);
        const payload = {
            alt: r.alt || "",
            href: r.href || "",
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
        if (!window.confirm("Delete this certification?")) return;
        if (r.imagePath) {
            try { await deleteObject(ref(storage, r.imagePath)); } catch { }
        }
        await deleteDoc(doc(db, "siteCertifications", r.id));
        await load();
    };

    // Versioned upload + cache control + delete previous
    const uploadImage = async (r, file) => {
        if (!file) return;
        const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const path = `certifications/${r.id}/${safeName}`;
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, file, {
            cacheControl: "public, max-age=3600" // tweak in prod
        });
        task.on("state_changed", () => { }, async (err) => {
            console.error(err); alert("Upload failed");
        }, async () => {
            const url = await getDownloadURL(task.snapshot.ref);

            // delete previous if any
            if (r.imagePath && r.imagePath !== path) {
                try { await deleteObject(ref(storage, r.imagePath)); } catch { }
            }

            await updateDoc(doc(db, "siteCertifications", r.id), {
                imageUrl: url,
                imagePath: path,
                updatedAt: serverTimestamp()
            });
            setRows(prev => prev.map(x => x.id === r.id ? { ...x, imageUrl: url, imagePath: path } : x));
        });
    };

    const toggleActive = async (r) => {
        const nv = !r.active;
        setRows(prev => prev.map(x => x.id === r.id ? { ...x, active: nv } : x));
    };

    const seed = async () => {
        if (!window.confirm("Seed default certifications? This adds new docs.")) return;
        let order = rows.length;
        for (const s of seedDefaults) {
            await addDoc(coll, {
                alt: s.alt, href: s.href,
                imageUrl: s.src || "", imagePath: "",
                active: true, order: order++,
                createdAt: serverTimestamp(), updatedAt: serverTimestamp()
            });
        }
        await load();
    };

    return (
        <Wrap>
            <H>Certifications</H>
            <Small>
                Stored in <code>siteCertifications</code>. Uploads go to <code>storage/certifications/&lt;id&gt;/</code>.
            </Small>

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
                                    <Thumb src={r.imageUrl} alt={r.alt || "logo"} />
                                ) : (
                                    <div style={{
                                        width: 120, height: 90, borderRadius: 10, background: "#f5f6f7",
                                        display: "grid", placeItems: "center", color: "#6b7280"
                                    }}>
                                        No image
                                    </div>
                                )}
                                <Uploader>
                                    <FiImage /> Image
                                    <input type="file" accept="image/*" onChange={e => uploadImage(r, e.target.files?.[0])} />
                                </Uploader>
                            </div>

                            <Col>
                                <Input placeholder="Alt / Title" value={r.alt || ""} onChange={e => onChange(r.id, "alt", e.target.value)} />
                                <Row>
                                    <Input placeholder="Link (optional)" value={r.href || ""} onChange={e => onChange(r.id, "href", e.target.value)} />
                                    <Input placeholder="Order" type="number" value={r.order ?? 0} onChange={e => onChange(r.id, "order", Number(e.target.value))} />
                                    <Input placeholder="Active (true/false)" value={String(!!r.active)} readOnly />
                                </Row>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>
                                    {r.href && <><FiExternalLink style={{ verticalAlign: "-2px" }} /> {r.href}</>}<br />
                                    {r.imagePath || ""}
                                </div>
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
