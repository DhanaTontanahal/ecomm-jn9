import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { db, storage } from "../../firebase/firebase"; // make sure storage is exported
import {
    doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import {
    ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from "firebase/storage";
import { FiPlus, FiTrash2, FiSave, FiUpload, FiX } from "react-icons/fi";

/* ===== UI ===== */
const Wrap = styled.div`
  max-width: 1100px; margin: 0 auto; padding: 16px;
`;
const Card = styled.div`
  background:#fff; border:1px solid rgba(16,24,40,.10); border-radius:14px;
  padding:16px; margin-bottom:16px;
`;
const Row = styled.div`
  display:grid; grid-template-columns: 1fr 1fr; gap:12px;
  @media (max-width: 800px){ grid-template-columns: 1fr; }
`;
const Label = styled.label`
  font-size: 12px; color:#6b7280; display:block; margin-bottom:6px;
`;
const Input = styled.input`
  width:100%; padding:10px 12px; border:1px solid rgba(16,24,40,.15); border-radius:10px;
`;
const TextArea = styled.textarea`
  width:100%; min-height: 110px; padding:10px 12px; border:1px solid rgba(16,24,40,.15); border-radius:10px;
`;
const Btn = styled.button`
  display:inline-flex; align-items:center; gap:8px; border:none; cursor:pointer; font-weight:700;
  padding:10px 14px; border-radius:10px;
  background:${p => p.$ghost ? "#fff" : "#5b7c3a"}; color:${p => p.$ghost ? "#111" : "#fff"};
  border:${p => p.$ghost ? "1px solid rgba(16,24,40,.2)" : "none"};
`;
const Head = styled.div`display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;`;
const Milestones = styled.div`display:grid; gap:12px;`;
const MilestoneRow = styled.div`
  display:grid; grid-template-columns: 120px 1fr 1fr 260px 42px; gap:8px; align-items:end;
  @media (max-width: 1024px){ grid-template-columns: 100px 1fr 1fr 1fr 42px; }
`;
const Small = styled.div`font-size:12px; color:#6b7280;`;
const Bar = styled.div`
  height:6px; background:rgba(16,24,40,.08); border-radius:6px; overflow:hidden; margin-top:6px;
  > div{height:100%; background:#5b7c3a;}
`;
const Thumb = styled.img`
  width:100%; height:140px; object-fit:cover; border-radius:10px; border:1px solid rgba(16,24,40,.15);
`;

/* ===== Helper ===== */
const slug = (s = "") => s.toLowerCase().trim()
    .replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");

export default function AdminAboutUsEditor() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // content
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [intro, setIntro] = useState("");

    // hero images (url/path + new file + progress)
    const [hero1Url, setHero1Url] = useState("");
    const [hero2Url, setHero2Url] = useState("");
    const [hero1Path, setHero1Path] = useState("");
    const [hero2Path, setHero2Path] = useState("");
    const [hero1File, setHero1File] = useState(null);
    const [hero2File, setHero2File] = useState(null);
    const [hero1Prog, setHero1Prog] = useState(0);
    const [hero2Prog, setHero2Prog] = useState(0);
    const hero1Preview = hero1File ? URL.createObjectURL(hero1File) : (hero1Url || "");
    const hero2Preview = hero2File ? URL.createObjectURL(hero2File) : (hero2Url || "");

    // journey
    const [journeyTitle, setJourneyTitle] = useState("");
    const [journeyIntro, setJourneyIntro] = useState("");
    // milestones: include icon file + progress transiently for upload UX
    const [milestones, setMilestones] = useState([]); // [{year,label,iconUrl,iconPath,_file?,_prog?}]

    useEffect(() => {
        (async () => {
            try {
                const snap = await getDoc(doc(db, "sitePages", "about"));
                if (snap.exists()) {
                    const d = snap.data();
                    setTitle(d.title || "");
                    setSubtitle(d.subtitle || "");
                    setIntro(d.intro || "");
                    setJourneyTitle(d.journeyTitle || "");
                    setJourneyIntro(d.journeyIntro || "");

                    const imgs = Array.isArray(d.heroImages) ? d.heroImages : [];
                    const imgPaths = Array.isArray(d.heroImagePaths) ? d.heroImagePaths : [];
                    setHero1Url(imgs[0] || "");
                    setHero2Url(imgs[1] || "");
                    setHero1Path(imgPaths[0] || "");
                    setHero2Path(imgPaths[1] || "");

                    const ms = Array.isArray(d.milestones) ? d.milestones : [];
                    setMilestones(ms.map(m => ({ ...m, _file: null, _prog: 0 })));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const addMilestone = () => {
        setMilestones(ms => [...ms, { year: "", label: "", iconUrl: "", iconPath: "", _file: null, _prog: 0 }]);
    };
    const removeMilestone = async (i) => {
        // delete icon file if exists
        const m = milestones[i];
        try { if (m?.iconPath) await deleteObject(ref(storage, m.iconPath)); } catch { }
        setMilestones(ms => ms.filter((_, idx) => idx !== i));
    };
    const updateMilestone = (i, key, val) => {
        setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
    };

    /* ===== uploads ===== */
    function uploadWithProgress(file, basePath, onProgress) {
        return new Promise((resolve, reject) => {
            const path = `${basePath}/${Date.now()}-${slug(file.name)}`;
            const storageRef = ref(storage, path);
            const task = uploadBytesResumable(storageRef, file, { cacheControl: "public,max-age=31536000" });
            task.on("state_changed",
                (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                reject,
                async () => {
                    const url = await getDownloadURL(task.snapshot.ref);
                    resolve({ url, path });
                }
            );
        });
    }

    async function uploadHeroIfNeeded(which /* 1 | 2 */) {
        if (which === 1 && hero1File) {
            try { if (hero1Path) await deleteObject(ref(storage, hero1Path)); } catch { }
            const { url, path } = await uploadWithProgress(hero1File, "about/hero", setHero1Prog);
            setHero1Url(url); setHero1Path(path);
            setHero1Prog(100);
        }
        if (which === 2 && hero2File) {
            try { if (hero2Path) await deleteObject(ref(storage, hero2Path)); } catch { }
            const { url, path } = await uploadWithProgress(hero2File, "about/hero", setHero2Prog);
            setHero2Url(url); setHero2Path(path);
            setHero2Prog(100);
        }
    }

    async function uploadMilestoneIconsIfNeeded() {
        // Upload only where _file exists, and delete old iconPath first
        const next = [...milestones];
        for (let i = 0; i < next.length; i++) {
            const m = next[i];
            if (m?._file) {
                try { if (m.iconPath) await deleteObject(ref(storage, m.iconPath)); } catch { }
                const setProg = (p) => updateMilestone(i, "_prog", p);
                const { url, path } = await uploadWithProgress(m._file, "about/milestones", setProg);
                next[i] = { ...m, iconUrl: url, iconPath: path, _file: null, _prog: 100 };
            }
        }
        setMilestones(next);
    }

    async function onSave() {
        try {
            setSaving(true);

            // upload files if selected
            await uploadHeroIfNeeded(1);
            await uploadHeroIfNeeded(2);
            await uploadMilestoneIconsIfNeeded();

            const payload = {
                title: title.trim() || "ABOUT US - OUR JOURNEY",
                subtitle: subtitle.trim() || "Our Journey",
                intro: intro.trim(),
                heroImages: [hero1Url, hero2Url].filter(Boolean),
                heroImagePaths: [hero1Path, hero2Path].filter(Boolean),
                journeyTitle: journeyTitle.trim() || "Our Journey",
                journeyIntro: journeyIntro.trim(),
                milestones: milestones
                    .map(m => ({
                        year: (m.year || "").trim(),
                        label: (m.label || "").trim(),
                        iconUrl: (m.iconUrl || "").trim(),
                        iconPath: (m.iconPath || "").trim(),
                    }))
                    .filter(m => m.year || m.label || m.iconUrl),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, "sitePages", "about"), payload, { merge: true });
            alert("About Us saved.");
        } catch (e) {
            console.error(e);
            alert("Save failed.");
        } finally {
            setSaving(false);
        }
    }

    const clearHero1File = () => { setHero1File(null); setHero1Prog(0); };
    const clearHero2File = () => { setHero2File(null); setHero2Prog(0); };

    if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

    return (
        <Wrap>
            <Card>
                <Head>
                    <h3 style={{ margin: 0 }}>About Us — Content</h3>
                    <Btn onClick={onSave} disabled={saving}><FiSave /> {saving ? "Saving..." : "Save"}</Btn>
                </Head>
                <Row>
                    <div>
                        <Label>Title</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="ABOUT US - OUR JOURNEY" />
                    </div>
                    <div>
                        <Label>Subtitle (small)</Label>
                        <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Our Journey" />
                    </div>
                </Row>
                <div style={{ marginTop: 12 }}>
                    <Label>Intro Paragraph</Label>
                    <TextArea value={intro} onChange={e => setIntro(e.target.value)} placeholder="Your brand story / introduction..." />
                </div>
            </Card>

            <Card>
                <h4 style={{ marginTop: 0 }}>Hero Images (Upload)</h4>

                <Row>
                    {/* Hero 1 */}
                    <div>
                        <Label>Hero Image 1</Label>
                        <input type="file" accept="image/*" onChange={e => setHero1File(e.target.files?.[0] || null)} />
                        {hero1File && (
                            <div style={{ marginTop: 8 }}>
                                <Btn $ghost onClick={clearHero1File}><FiX /> Clear selected</Btn>
                            </div>
                        )}
                        {hero1Prog > 0 && hero1Prog < 100 && (
                            <Small style={{ marginTop: 6 }}>
                                <FiUpload /> Uploading… {hero1Prog}%
                                <Bar><div style={{ width: `${hero1Prog}%` }} /></Bar>
                            </Small>
                        )}
                        <div style={{ marginTop: 8 }}>
                            {hero1Preview ? (
                                <Thumb src={hero1Preview} alt="Hero 1" />
                            ) : (
                                <div style={{ height: 140, borderRadius: 10, border: "1px solid rgba(16,24,40,.15)", background: "#f3f4f6" }} />
                            )}
                        </div>
                    </div>

                    {/* Hero 2 */}
                    <div>
                        <Label>Hero Image 2</Label>
                        <input type="file" accept="image/*" onChange={e => setHero2File(e.target.files?.[0] || null)} />
                        {hero2File && (
                            <div style={{ marginTop: 8 }}>
                                <Btn $ghost onClick={clearHero2File}><FiX /> Clear selected</Btn>
                            </div>
                        )}
                        {hero2Prog > 0 && hero2Prog < 100 && (
                            <Small style={{ marginTop: 6 }}>
                                <FiUpload /> Uploading… {hero2Prog}%
                                <Bar><div style={{ width: `${hero2Prog}%` }} /></Bar>
                            </Small>
                        )}
                        <div style={{ marginTop: 8 }}>
                            {hero2Preview ? (
                                <Thumb src={hero2Preview} alt="Hero 2" />
                            ) : (
                                <div style={{ height: 140, borderRadius: 10, border: "1px solid rgba(16,24,40,.15)", background: "#f3f4f6" }} />
                            )}
                        </div>
                    </div>
                </Row>
            </Card>

            <Card>
                <h4 style={{ marginTop: 0 }}>Our Journey (Timeline)</h4>
                <Row>
                    <div>
                        <Label>Journey Title</Label>
                        <Input value={journeyTitle} onChange={e => setJourneyTitle(e.target.value)} placeholder="Our Journey" />
                    </div>
                    <div>
                        <Label>Journey Intro</Label>
                        <Input value={journeyIntro} onChange={e => setJourneyIntro(e.target.value)} placeholder="Short intro shown above timeline" />
                    </div>
                </Row>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <strong>Milestones</strong>
                    <Btn $ghost onClick={addMilestone}><FiPlus /> Add Milestone</Btn>
                </div>

                <Milestones>
                    {milestones.map((m, i) => (
                        <MilestoneRow key={i}>
                            <div>
                                <Label>Year</Label>
                                <Input value={m.year} onChange={e => updateMilestone(i, "year", e.target.value)} placeholder="1990" />
                            </div>
                            <div>
                                <Label>Label</Label>
                                <Input value={m.label} onChange={e => updateMilestone(i, "label", e.target.value)} placeholder="Founded in" />
                            </div>
                            <div>
                                <Label>Icon (Upload)</Label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => updateMilestone(i, "_file", e.target.files?.[0] || null)}
                                />
                                {m._file && (
                                    <div style={{ marginTop: 6 }}>
                                        <Btn $ghost onClick={() => updateMilestone(i, "_file", null)}><FiX /> Clear selected</Btn>
                                    </div>
                                )}
                                {m._prog > 0 && m._prog < 100 && (
                                    <Small style={{ marginTop: 6 }}>
                                        <FiUpload /> Uploading… {m._prog}%
                                        <Bar><div style={{ width: `${m._prog}%` }} /></Bar>
                                    </Small>
                                )}
                            </div>
                            <div>
                                {(m._file ? URL.createObjectURL(m._file) : (m.iconUrl || "")) ? (
                                    <Thumb
                                        src={m._file ? URL.createObjectURL(m._file) : (m.iconUrl || "")}
                                        alt="icon"
                                    />
                                ) : (
                                    <div style={{ height: 140, borderRadius: 10, border: "1px solid rgba(16,24,40,.15)", background: "#f3f4f6" }} />
                                )}
                            </div>
                            <Btn $ghost onClick={() => removeMilestone(i)} title="Remove"><FiTrash2 /></Btn>
                        </MilestoneRow>
                    ))}
                </Milestones>
            </Card>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn onClick={onSave} disabled={saving}><FiSave /> {saving ? "Saving..." : "Save Changes"}</Btn>
            </div>
        </Wrap>
    );
}
