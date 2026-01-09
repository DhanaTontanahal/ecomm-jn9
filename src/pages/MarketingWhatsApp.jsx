import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import Modal from "react-modal";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
    collection, addDoc, getDocs, serverTimestamp,
    query, where, orderBy, doc
} from "firebase/firestore";
import {
    ref as storageRef, uploadBytes, getDownloadURL
} from "firebase/storage";

import { db,storage } from "../firebase/firebase";
import {
    FiArrowLeft, FiImage, FiUpload, FiSave, FiSend, FiPlus, FiSearch
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { sendWaImage } from "../api/callBhash"; // <-- your helper

/* =============================
   Shared glass theme
============================= */
const COLORS = {
    bg: "#0b1220",
    glass: "rgba(255,255,255,.06)",
    glassBorder: "rgba(255,255,255,.12)",
    glassHeader: "rgba(255,255,255,.10)",
    text: "#e7efff",
    subtext: "#b7c6e6",
    ring: "#78c7ff",
    primary: "#4ea1ff",
    danger: "#ef4444",
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px) }
  to   { opacity: 1; transform: translateY(0) }
`;

const Page = styled.div`
  min-height: 100dvh;
  padding: clamp(16px,2.4vw,28px);
  background: radial-gradient(1200px 620px at 20% -10%, ${COLORS.bg} 0%, ${COLORS.bg} 40%, ${COLORS.bg} 100%) fixed;
  color: ${COLORS.text};
`;
const Card = styled.div`
  width: min(1120px, 100%);
  margin: 0 auto;
  border: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.glass};
  backdrop-filter: blur(10px) saturate(140%);
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(3,7,18,.35);
  overflow: clip;
  animation: ${fadeIn} .25s ease both;
`;
const Header = styled.div`
  display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid ${COLORS.glassBorder};
  background: linear-gradient(180deg, ${COLORS.glassHeader}, ${COLORS.glass});
`;
const Back = styled.button`
  display: inline-flex; align-items:center; gap:8px;
  border: 1px solid ${COLORS.glassBorder}; background: rgba(255,255,255,.06);
  color:${COLORS.text}; padding: 8px 10px; border-radius: 10px; cursor: pointer; font-weight: 800;
  &:hover{ background: rgba(255,255,255,.1); }
`;
const Title = styled.h2` margin: 0; font-size: clamp(18px,2.2vw,22px); font-weight: 800; `;
const Stamp = styled.span`
  justify-self: end; font-size: .85rem; color: ${COLORS.subtext};
  background: rgba(255,255,255,.08); border: 1px solid ${COLORS.glassBorder};
  padding: 6px 10px; border-radius: 999px;
`;

const Body = styled.div` padding: 16px; display: grid; gap: 14px; `;
const Section = styled.div`
  border: 1px solid ${COLORS.glassBorder}; border-radius: 14px; padding: 14px; background: rgba(255,255,255,.03);
`;
const Legend = styled.div` font-weight: 800; margin-bottom: 10px; `;
const Grid2 = styled.div`
  display:grid; gap:12px; grid-template-columns: 1fr; 
  @media(min-width:900px){ grid-template-columns: 1fr 1fr; }
`;
const Row = styled.div` display:grid; gap:8px; `;
const Label = styled.label` font-weight:800; `;
const Input = styled.input`
  width: 100%; padding: 12px; border-radius: 12px; 
  border: 1px solid ${COLORS.glassBorder}; background: rgba(255,255,255,.08);
  color:${COLORS.text}; outline:none; transition: border-color .15s, box-shadow .15s;
  &:focus{ border-color:${COLORS.ring}; box-shadow:0 0 0 4px #78c7ff33; }
`;
const Select = styled.select`
  ${Input} 
`;
const Ghost = styled.button`
  border: 1px solid ${COLORS.glassBorder}; background: rgba(255,255,255,.08);
  color:${COLORS.text}; padding:10px 12px; border-radius:10px; cursor:pointer; font-weight:800;
  display:inline-flex; align-items:center; gap:8px; white-space:nowrap;
  &:hover{ background: rgba(255,255,255,.12); }
`;
const Primary = styled(Ghost)` background:${COLORS.primary}; color:#0b1220; border-color: transparent; `;
const Danger = styled(Ghost)` background:${COLORS.danger}; color:#fff; border-color:transparent; `;

const Footer = styled.div`
  position: sticky; bottom: 0; padding: 12px 16px;
  border-top: 1px solid ${COLORS.glassBorder};
  background: linear-gradient(180deg, ${COLORS.glassHeader}, ${COLORS.glass});
  display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;
`;

/* ======= Compact tag list ======= */
const TagList = styled.div` display:flex; gap:6px; flex-wrap:wrap; `;
const Tag = styled.span`
  display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px;
  background:#1f2937; color:${COLORS.text}; border:1px solid ${COLORS.glassBorder}; font-weight:700; font-size:.85rem;
`;
const Help = styled.div` color:${COLORS.subtext}; font-size:.9rem; `;

/* ======= Modal styling ======= */
const modalStyles = {
    overlay: { backgroundColor: "rgba(2, 6, 23, .55)", backdropFilter: "blur(10px) saturate(140%)", zIndex: 50 },
    content: {
        inset: "50% auto auto 50%", transform: "translate(-50%, -50%)",
        border: "1px solid rgba(255,255,255,.18)",
        background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.90))",
        borderRadius: "18px", padding: "16px",
        width: "min(920px, 96vw)", maxHeight: "90vh", overflow: "auto",
    },
};
const ModalHeader = styled.div`
  position:sticky; top:-16px; margin:-16px -16px 12px; padding: 14px 16px;
  background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(255,255,255,.92));
  border-bottom: 1px solid rgba(15,23,42,.1); border-radius:18px 18px 0 0;
  display:flex; align-items:center; justify-content:space-between;
  h3{ margin:0; color:#0b1220; }
`;

/* =============================
   Helper: template + preview
============================= */
const TEMPLATES = {
    site_visit_invi_img: {
        label: "Site Visit Invite (Text + Image)",
        text:
            "👋 Hi {{1}}, We are organizing exclusive site visits for {{2}} this weekend. " +
            "📍 Location: {{3}} ✅ Special Launch Offers ✅ Free Pick-up & Drop " +
            "Shall I book a slot for you on [Saturday/Sunday]?",
        placeholders: ["Customer Name", "Project", "Location"],
    },
};
function fillTemplate(tmpl, [p1, p2, p3]) {
    return tmpl
        .replace("{{1}}", p1 || "")
        .replace("{{2}}", p2 || "")
        .replace("{{3}}", p3 || "");
}

/* =============================
   Image Manager Modal
============================= */
function ImageManagerModal({ open, onClose, companyId, currentUser, onPick, apiBase }) {
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [items, setItems] = useState([]);

    const loadItems = async () => {
        if (!companyId || !currentUser?.uid) return;
        const q = query(
            collection(db, `companies/${companyId}/media`),
            where("uploadedByUid", "==", currentUser.uid),
            where("type", "==", "image"),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => { if (open) loadItems(); }, [open]);

    const doUpload = async () => {
        if (!file || !companyId || !currentUser?.uid) return;
        try {
            setBusy(true);

            const fd = new FormData();
            fd.append("file", file);
            fd.append("companyId", companyId);
            fd.append("userId", currentUser.uid);

            const r = await fetch(`${apiBase}/media/upload`, {
                method: "POST",
                body: fd, // don't set Content-Type; browser will set multipart boundary
            });
            const data = await r.json();
            if (!data.ok) throw new Error(data.error || "Upload failed");
            const publicUrl = data.url;

            await addDoc(collection(db, `companies/${companyId}/media`), {
                url: publicUrl,
                name: file.name,
                type: "image",
                uploadedByUid: currentUser.uid,
                uploadedBy: currentUser.email || "",
                createdAt: serverTimestamp(),
            });

            setFile(null);
            await loadItems();
            toast.success("Image uploaded");
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Upload failed");
        } finally {
            setBusy(false);
        }
    };



    return (
        <Modal isOpen={open} onRequestClose={() => onClose(false)} ariaHideApp={false} style={modalStyles}>
            <ModalHeader>
                <h3>Images</h3>
                <Ghost onClick={() => onClose(false)}>Close</Ghost>
            </ModalHeader>

            <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                    <Primary disabled={!file || busy} onClick={doUpload}><FiUpload /> Upload</Primary>
                    <Help>Upload stores image to Google cloud Storage and metadata in Firestore.</Help>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                    {items.map(it => (
                        <button
                            key={it.id}
                            onClick={() => { onPick(it.url); onClose(true); }}
                            style={{
                                border: `1px solid ${COLORS.glassBorder}`,
                                borderRadius: 12,
                                overflow: "hidden",
                                cursor: "pointer",
                                background: "#fff"
                            }}
                            title={it.name}
                        >
                            <img src={it.url} alt={it.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                            <div style={{ padding: 8, fontWeight: 700, fontSize: 12, color: "#0b1220" }}>{it.name}</div>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
}

/* =============================
   Customer Picker (multi-select)
============================= */
function CustomerPickerModal({ open, onClose, list, selectedIds, onChange }) {
    const [qText, setQText] = useState("");
    const filtered = useMemo(() => {
        const ql = qText.trim().toLowerCase();
        if (!ql) return list;
        return list.filter(c =>
            (c.name || "").toLowerCase().includes(ql) ||
            (c.phone || "").includes(ql) ||
            (c.email || "").toLowerCase().includes(ql)
        );
    }, [qText, list]);

    const toggle = (id) => {
        const set = new Set(selectedIds);
        if (set.has(id)) set.delete(id); else set.add(id);
        onChange(Array.from(set));
    };

    return (
        <Modal isOpen={open} onRequestClose={() => onClose(false)} ariaHideApp={false} style={modalStyles}>
            <ModalHeader>
                <h3>Select Customers</h3>
                <Ghost onClick={() => onClose(false)}>Close</Ghost>
            </ModalHeader>

            <div style={{ display: "grid", gap: 12 }}>
                <div style={{ position: "relative" }}>
                    <Input placeholder="Search name/phone/email…" value={qText} onChange={e => setQText(e.target.value)} />
                    <FiSearch style={{ position: "absolute", right: 12, top: 12, opacity: .6 }} />
                </div>

                <div style={{ maxHeight: "52vh", overflow: "auto", display: "grid", gap: 6 }}>
                    {filtered.map(c => (
                        <label
                            key={c.id}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr auto",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 12px",
                                border: `1px solid ${COLORS.glassBorder}`,
                                borderRadius: 12,
                                background: "rgba(255,255,255,.9)",
                                color: "#0b1220"
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(c.id)}
                                onChange={() => toggle(c.id)}
                            />
                            <div style={{ fontWeight: 800 }}>{c.name || "Unnamed"} <span style={{ color: "#475569", fontWeight: 600 }}> · {c.phone || "—"}</span></div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{c.email}</div>
                        </label>
                    ))}
                </div>
            </div>
        </Modal>
    );
}

/* =============================
   New Location Modal
============================= */
function NewLocationModal({ open, onClose, companyId, onSaved }) {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const save = async () => {
        if (!name.trim()) return toast.error("Enter a location name");
        try {
            const ref = await addDoc(collection(db, `companies/${companyId}/locations`), {
                name: name.trim(), address: address.trim(), createdAt: serverTimestamp()
            });
            onSaved({ id: ref.id, name, address });
            onClose(true);
            setName(""); setAddress("");
        } catch (e) {
            console.error(e); toast.error("Failed to save location");
        }
    };

    return (
        <Modal isOpen={open} onRequestClose={() => onClose(false)} ariaHideApp={false} style={modalStyles}>
            <ModalHeader>
                <h3>New Location</h3>
                <Ghost onClick={() => onClose(false)}>Close</Ghost>
            </ModalHeader>

            <div style={{ display: "grid", gap: 10 }}>
                <Row>
                    <Label>Name*</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Downtown Sales Lounge" />
                </Row>
                <Row>
                    <Label>Address</Label>
                    <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Optional full address" />
                </Row>
                <div style={{ justifySelf: "end", display: "flex", gap: 8 }}>
                    <Ghost onClick={() => onClose(false)}>Cancel</Ghost>
                    <Primary onClick={save}><FiSave /> Save</Primary>
                </div>
            </div>
        </Modal>
    );
}

/* =============================
   Main component
============================= */
export default function MarketingWhatsApp() {
    const navigate = useNavigate();
    const crmUser = useSelector(s => s.user);
    // console.log(crmUser)
    const companyId = crmUser?.companyId;
    // const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8080";
    const apiBase="https://pfb-be-staging-1041275605700.us-central1.run.app"
    // console.log("===================================================*******************************")
    // console.log(apiBase)
    // Data lists
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [locations, setLocations] = useState([]);

    // Selections
    const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
    const selectedCustomers = useMemo(
        () => customers.filter(c => selectedCustomerIds.includes(c.id)),
        [customers, selectedCustomerIds]
    );
    const [projectId, setProjectId] = useState("");
    const [locationId, setLocationId] = useState("");
    const projectName = projects.find(p => p.id === projectId)?.name || "";
    const locationName = locations.find(l => l.id === locationId)?.name || "";
    const [imageUrl, setImageUrl] = useState("");

    const [templateKey, setTemplateKey] = useState("site_visit_invi_img");

    // Modals
    const [pickCustOpen, setPickCustOpen] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [locOpen, setLocOpen] = useState(false);

    // Load lists
    useEffect(() => {
        if (!companyId) return;
        (async () => {
            const cs = await getDocs(collection(db, `companies/${companyId}/customers`));
            setCustomers(cs.docs.map(d => ({ id: d.id, ...d.data() })));
            const ps = await getDocs(collection(db, `companies/${companyId}/projects`));
            setProjects(ps.docs.map(d => ({ id: d.id, ...d.data() })));
            const ls = await getDocs(collection(db, `companies/${companyId}/locations`));
            setLocations(ls.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, [companyId]);

    // Preview text
    const previewText = useMemo(() => {
        const tmpl = TEMPLATES[templateKey]?.text || "";
        const firstName = selectedCustomers[0]?.name || "";
        return fillTemplate(tmpl, [firstName, projectName, locationName]);
    }, [templateKey, selectedCustomers, projectName, locationName]);

    const canSend =
        selectedCustomers.length > 0 &&
        projectId &&
        locationId &&
        imageUrl &&
        templateKey;

    const doSend = async () => {
        if (!canSend) return toast.error("Fill all fields and pick an image");
        try {
            for (const cust of selectedCustomers) {
                const phone = String(cust.phone || "").replace(/\D/g, "");
                if (!phone) continue;
                const params = [cust.name || "", projectName, locationName];
                await sendWaImage({
                    apiBase,
                    phone,
                    template: templateKey,
                    params,
                    imageUrl,
                });
                toast.success(`Sent to ${cust.name || phone}`);
            }
        } catch (e) {
            console.error(e);
            toast.error("Send failed");
        }
    };

    return (
        <Page>
            <Card>
                <Header>
                    <Back onClick={() => navigate(-1)}><FiArrowLeft /> Back</Back>
                    <Title>Marketing WhatsApp — Text + Image</Title>
                    <Stamp>{selectedCustomers.length} selected</Stamp>
                </Header>

                <Body>
                    <Section>
                        <Legend>Audience & Content</Legend>
                        <Grid2>
                            <Row>
                                <Label>Customers (multi-select)</Label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <Ghost onClick={() => setPickCustOpen(true)}><FiSearch /> Choose Customers</Ghost>
                                    <TagList>
                                        {selectedCustomers.slice(0, 4).map(c => <Tag key={c.id}>{c.name || c.phone}</Tag>)}
                                        {selectedCustomers.length > 4 && <Tag>+{selectedCustomers.length - 4} more</Tag>}
                                    </TagList>
                                </div>
                                <Help>Phones are fetched from selected customers automatically.</Help>
                            </Row>

                            <Row>
                                <Label>Template</Label>
                                <Select value={templateKey} onChange={e => setTemplateKey(e.target.value)}>
                                    {Object.entries(TEMPLATES).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </Select>
                                <Help>Approved template: <b>{templateKey}</b></Help>
                            </Row>

                            <Row>
                                <Label>Project</Label>
                                <Select value={projectId} onChange={e => setProjectId(e.target.value)}>
                                    <option value="">Select project…</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                            </Row>

                            <Row>
                                <Label>Location</Label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                                    <Select value={locationId} onChange={e => setLocationId(e.target.value)}>
                                        <option value="">Select location…</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </Select>
                                    <Ghost onClick={() => setLocOpen(true)}><FiPlus /> New Location</Ghost>
                                </div>
                            </Row>

                            <Row>
                                <Label>Image</Label>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                    <Ghost onClick={() => setImageOpen(true)}><FiImage /> Choose / Upload</Ghost>
                                    {imageUrl && (
                                        <img
                                            src={imageUrl}
                                            alt="picked"
                                            style={{ height: 60, width: 100, objectFit: "cover", borderRadius: 10, border: `1px solid ${COLORS.glassBorder}` }}
                                        />
                                    )}
                                </div>
                                <Help>Pick from your uploaded images or upload a new one.</Help>
                            </Row>
                        </Grid2>
                    </Section>

                    <Section>
                        <Legend>Preview</Legend>
                        <div style={{
                            border: `1px solid ${COLORS.glassBorder}`,
                            borderRadius: 12, padding: 12, background: "rgba(255,255,255,.05)"
                        }}>
                            <Help style={{ marginBottom: 6 }}>
                                Variables: <code>{'{{}}'}</code> → <code>{'{{1}}=Name'}</code>, <code>{'{{2}}=Project'}</code>, <code>{'{{3}}=Location'}</code>
                            </Help>

                        </div>
                    </Section>
                </Body>

                <Footer>
                    <Ghost onClick={() => navigate(-1)}><FiArrowLeft /> Cancel</Ghost>
                    <Primary onClick={doSend} disabled={!canSend}>
                        <FiSend /> Send WhatsApp
                    </Primary>
                </Footer>
            </Card>

            {/* Modals */}
            <CustomerPickerModal
                open={pickCustOpen}
                onClose={() => setPickCustOpen(false)}
                list={customers}
                selectedIds={selectedCustomerIds}
                onChange={setSelectedCustomerIds}
            />
            <ImageManagerModal
                open={imageOpen}
                onClose={() => setImageOpen(false)}
                companyId={companyId}
                currentUser={crmUser}
                onPick={(url) => setImageUrl(url)}
                apiBase={apiBase}
            />
            <NewLocationModal
                open={locOpen}
                onClose={() => setLocOpen(false)}
                companyId={companyId}
                onSaved={(loc) => { setLocations(prev => [loc, ...prev]); setLocationId(loc.id); }}
            />
        </Page>
    );
}
