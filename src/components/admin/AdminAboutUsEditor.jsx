import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { db, storage } from "../../firebase/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { FiPlus, FiTrash2, FiSave, FiUpload } from "react-icons/fi";

/* ===== UI ===== */
const Wrap = styled.div`max-width: 1100px; margin: 0 auto; padding: 16px;`;
const Card = styled.div`
  background:#fff; border:1px solid rgba(16,24,40,.10); border-radius:14px;
  padding:16px; margin-bottom:16px;
`;
const Row = styled.div`
  display:grid; grid-template-columns: 1fr 1fr; gap:12px;
  @media (max-width: 800px){ grid-template-columns: 1fr; }
`;
const Label = styled.label`font-size: 12px; color:#6b7280; display:block; margin-bottom:6px;`;
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
const Small = styled.div`font-size:12px; color:#6b7280;`;
const Bar = styled.div`
  height:6px; background:rgba(16,24,40,.08); border-radius:6px; overflow:hidden; margin-top:6px;
  > div{height:100%; background:#5b7c3a;}
`;
const Thumb = styled.img`
  width:100%; height:140px; object-fit:cover; border-radius:10px; border:1px solid rgba(16,24,40,.15);
`;
const Vid = styled.video`
  width:100%; height:140px; object-fit:cover; border-radius:10px; border:1px solid rgba(16,24,40,.15);
`;
const IframeWrap = styled.div`
  position:relative; width:100%; padding-top:56.25%; border-radius:10px; overflow:hidden;
  border:1px solid rgba(16,24,40,.15); background:#000;
  iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; }
`;
const Milestones = styled.div`display:grid; gap:12px;`;
const MilestoneRow = styled.div`
  display:grid; grid-template-columns: 120px 1fr 1fr 260px 42px; gap:8px; align-items:end;
  @media (max-width: 1024px){ grid-template-columns: 100px 1fr 1fr 1fr 42px; }
`;

/* ===== helpers ===== */
const slug = (s = "") => s.toLowerCase().trim()
  .replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").replace(/\-+/g, "-")
  .replace(/^\-+|\-+$/g, "");

// extract a YouTube videoId from most common URL forms
function parseYouTubeId(url = "") {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }
    if (u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }
    // /embed/VIDEOID or /v/VIDEOID
    const m = u.pathname.match(/\/(embed|v)\/([a-zA-Z0-9_-]{6,})/);
    if (m) return m[2];
  } catch { }
  const plain = url.match(/([a-zA-Z0-9_-]{6,})/);
  return plain ? plain[1] : "";
}

function embedUrlFromId(id) {
  return `https://www.youtube.com/embed/${id}`;
}

/* ===== component ===== */
export default function AdminAboutUsEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // content
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [intro, setIntro] = useState("");

  // hero media slots: { type:'image'|'video'|'youtube', url, path, prog, youtubeUrl? }
  const [hero1, setHero1] = useState({ type: "image", url: "", path: "", prog: 0, youtubeUrl: "" });
  const [hero2, setHero2] = useState({ type: "image", url: "", path: "", prog: 0, youtubeUrl: "" });

  // journey
  const [journeyTitle, setJourneyTitle] = useState("");
  const [journeyIntro, setJourneyIntro] = useState("");

  // milestones: image icon only (unchanged)
  const [milestones, setMilestones] = useState([]); // [{year,label,iconUrl,iconPath,_prog?}]

  /* ===== load existing ===== */
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

          // prefer new heroMedia; fallback to legacy heroImages
          const media = Array.isArray(d.heroMedia) ? d.heroMedia : [];
          if (media.length) {
            const [m1 = {}, m2 = {}] = media;
            setHero1({ type: m1.type || "image", url: m1.url || "", path: m1.path || "", prog: 0, youtubeUrl: m1.type === "youtube" ? m1.url : "" });
            setHero2({ type: m2.type || "image", url: m2.url || "", path: m2.path || "", prog: 0, youtubeUrl: m2.type === "youtube" ? m2.url : "" });
          } else {
            const imgs = Array.isArray(d.heroImages) ? d.heroImages : [];
            const imgPaths = Array.isArray(d.heroImagePaths) ? d.heroImagePaths : [];
            setHero1({ type: "image", url: imgs[0] || "", path: imgPaths[0] || "", prog: 0, youtubeUrl: "" });
            setHero2({ type: "image", url: imgs[1] || "", path: imgPaths[1] || "", prog: 0, youtubeUrl: "" });
          }

          const ms = Array.isArray(d.milestones) ? d.milestones : [];
          setMilestones(ms.map(m => ({ ...m, _prog: 0 })));
        }
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load About Us data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ===== storage upload ===== */
  function uploadWithProgress(file, basePath, onProgress) {
    return new Promise((resolve, reject) => {
      const path = `${basePath}/${Date.now()}-${slug(file.name)}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file, {
        cacheControl: "public,max-age=31536000",
        contentType: file.type || undefined,
      });
      task.on(
        "state_changed",
        s => onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
        err => reject(err),
        async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path })
      );
    });
  }

  async function replaceFile(prevPath) {
    if (prevPath) {
      try { await deleteObject(ref(storage, prevPath)); } catch { /* ignore */ }
    }
  }

  const onHeroFilePick = async (slot, file) => {
    if (!file) return;
    const isVideo = (file.type || "").startsWith("video/");
    const setHero = slot === 1 ? setHero1 : setHero2;
    const current = slot === 1 ? hero1 : hero2;

    try {
      setHero({ ...current, prog: 1 });
      await replaceFile(current.path);

      const { url, path } = await uploadWithProgress(file, "about/hero", p => setHero(h => ({ ...h, prog: p })));
      setHero({ type: isVideo ? "video" : "image", url, path, prog: 100, youtubeUrl: "" });
    } catch (e) {
      console.error(e);
      setHero(h => ({ ...h, prog: 0 }));
      alert("Upload failed. Check console & Storage rules.");
    }
  };

  const clearHero = async (slot) => {
    const setHero = slot === 1 ? setHero1 : setHero2;
    const current = slot === 1 ? hero1 : hero2;
    if (current.type !== "youtube" && current.path) { try { await deleteObject(ref(storage, current.path)); } catch { } }
    setHero({ type: "image", url: "", path: "", prog: 0, youtubeUrl: "" });
  };

  const setYouTubeForHero = async (slot, value) => {
    const id = parseYouTubeId(value || "");
    if (!id) { alert("Enter a valid YouTube URL or video ID."); return; }
    const url = embedUrlFromId(id);
    const setHero = slot === 1 ? setHero1 : setHero2;
    const current = slot === 1 ? hero1 : hero2;

    // cleanup any prior uploaded file
    if (current.type !== "youtube" && current.path) { try { await deleteObject(ref(storage, current.path)); } catch { } }
    setHero({ type: "youtube", url, path: "", prog: 0, youtubeUrl: value.trim() });
  };

  // Milestone icon upload (image only)
  const onMilestoneIconPick = async (i, file) => {
    if (!file) return;
    try {
      setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, _prog: 1 } : m));
      const current = milestones[i];
      if (current?.iconPath) { try { await deleteObject(ref(storage, current.iconPath)); } catch { } }

      const { url, path } = await uploadWithProgress(file, "about/milestones",
        p => setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, _prog: p } : m))
      );
      setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, iconUrl: url, iconPath: path, _prog: 100 } : m));
    } catch (e) {
      console.error(e);
      setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, _prog: 0 } : m));
      alert("Milestone icon upload failed.");
    }
  };

  const addMilestone = () => setMilestones(ms => [...ms, { year: "", label: "", iconUrl: "", iconPath: "", _prog: 0 }]);
  const removeMilestone = async (i) => {
    const m = milestones[i];
    if (m?.iconPath) { try { await deleteObject(ref(storage, m.iconPath)); } catch { } }
    setMilestones(ms => ms.filter((_, idx) => idx !== i));
  };
  const updateMilestone = (i, key, val) =>
    setMilestones(ms => ms.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)));

  async function onSave() {
    try {
      setSaving(true);
      setError("");

      // new richer schema
      const heroMedia = [hero1, hero2]
        .filter(h => !!h.url)
        .map(h => ({ type: h.type, url: h.url, path: h.path || "" }));

      // legacy compatibility (images only)
      const heroImages = heroMedia.filter(m => m.type === "image").map(m => m.url);
      const heroImagePaths = heroMedia.filter(m => m.type === "image").map(m => m.path);

      const payload = {
        title: (title || "ABOUT US - OUR JOURNEY").trim(),
        subtitle: (subtitle || "Our Journey").trim(),
        intro: (intro || "").trim(),
        heroMedia,            // NEW
        heroImages,           // legacy
        heroImagePaths,       // legacy
        journeyTitle: (journeyTitle || "Our Journey").trim(),
        journeyIntro: (journeyIntro || "").trim(),
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
      setError(e.message || "Save failed.");
      alert("Save failed. See console for details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  const HeroSlot = ({ slot, state, setState }) => (
    <div>
      <Label>{`Hero ${slot} — image/video upload OR YouTube link`}</Label>

      {/* File upload: image or video */}
      <input
        type="file"
        accept="image/*,video/*"
        onChange={e => onHeroFilePick(slot, e.target.files?.[0] || null)}
      />

      {state.prog > 0 && state.prog < 100 && (
        <Small style={{ marginTop: 6 }}>
          <FiUpload /> Uploading… {state.prog}%
          <Bar><div style={{ width: `${state.prog}%` }} /></Bar>
        </Small>
      )}

      {/* YouTube URL setter */}
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 }}>
        <Input
          placeholder="Paste YouTube URL (e.g., https://youtu.be/VIDEOID)"
          value={state.youtubeUrl}
          onChange={e => setState(h => ({ ...h, youtubeUrl: e.target.value }))}
        />
        <Btn $ghost onClick={() => setYouTubeForHero(slot, state.youtubeUrl)}>Use YouTube</Btn>
        <Btn $ghost onClick={() => clearHero(slot)} title="Clear">Clear</Btn>
      </div>

      {/* Preview */}
      <div style={{ marginTop: 8 }}>
        {state.url ? (
          state.type === "youtube" ? (
            <IframeWrap>
              <iframe
                src={state.url}
                title={`Hero ${slot} YouTube`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </IframeWrap>
          ) : state.type === "video" ? (
            <Vid controls muted playsInline src={state.url} />
          ) : (
            <Thumb src={state.url} alt={`Hero ${slot}`} />
          )
        ) : (
          <div style={{ height: 140, borderRadius: 10, border: "1px solid rgba(16,24,40,.15)", background: "#f3f4f6" }} />
        )}
      </div>
    </div>
  );

  return (
    <Wrap>
      <Card>
        <Head>
          <h3 style={{ margin: 0 }}>About Us — Content</h3>
          <Btn onClick={onSave} disabled={saving}><FiSave /> {saving ? "Saving..." : "Save"}</Btn>
        </Head>
        {error && <div style={{ color: "#b91c1c", marginBottom: 8 }}>{error}</div>}
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
        <h4 style={{ marginTop: 0 }}>Hero Media</h4>
        <Row>
          <HeroSlot slot={1} state={hero1} setState={setHero1} />
          <HeroSlot slot={2} state={hero2} setState={setHero2} />
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
                <Label>Icon (Image upload)</Label>
                <input type="file" accept="image/*" onChange={e => onMilestoneIconPick(i, e.target.files?.[0] || null)} />
                {m._prog > 0 && m._prog < 100 && (
                  <Small style={{ marginTop: 6 }}>
                    <FiUpload /> Uploading… {m._prog}%
                    <Bar><div style={{ width: `${m._prog}%` }} /></Bar>
                  </Small>
                )}
              </div>
              <div>
                {m.iconUrl ? (
                  <Thumb src={m.iconUrl} alt="icon" />
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
