// src/admin/AdminFooter.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { FiPlus, FiTrash2, FiSave, FiRefreshCw, FiImage } from "react-icons/fi";

/* ============ Tokens ============ */
const TOK = {
    bg: "#f7faf5",
    card: "#ffffff",
    ring: "rgba(16,24,40,.10)",
    faint: "rgba(16,24,40,.06)",
    text: "#1f2a37",
    sub: "#6b7280",
    green: "#5b7c3a",
    greenD: "#48652f",
    red: "#ef4444",
    maxW: "980px",
    shadow: "0 12px 28px rgba(16,24,40,.08)",
};

/* ============ Anim ============ */
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;

/* ============ Layout ============ */
const Wrap = styled.div`
  background: ${TOK.bg};
  min-height: 100dvh;
  padding: clamp(14px, 4vw, 24px);
`;
const Head = styled.div`
  max-width: ${TOK.maxW};
  margin: 0 auto clamp(12px, 2.6vw, 18px);
  display: grid; gap: 6px;
  h1 { margin: 0; font-size: clamp(18px, 4vw, 22px); color: ${TOK.text}; }
  p { margin: 0; color: ${TOK.sub}; }
`;
const Grid = styled.div`
  max-width: ${TOK.maxW};
  margin: 0 auto;
  display: grid; gap: 12px;
  grid-template-columns: 1.1fr 1fr;
  @media (max-width: 920px){ grid-template-columns: 1fr; }
`;
const Card = styled.div`
  background: ${TOK.card};
  border: 1px solid ${TOK.ring};
  border-radius: 14px;
  box-shadow: ${TOK.shadow};
  padding: clamp(12px, 2.8vw, 16px);
  animation: ${fade} .25s ease both;
`;
const SectionTitle = styled.div`
  font-weight: 900; color: ${TOK.text}; letter-spacing: .2px;
  margin-bottom: 10px;
`;

const Row = styled.div`
  display: grid; gap: 8px;
  grid-template-columns: 1fr 1fr;
  @media (max-width: 560px){ grid-template-columns: 1fr; }
`;
const Field = styled.label`
  display: grid; gap: 6px;
  font-size: 12px; color: ${TOK.sub}; font-weight: 700;
`;
const Input = styled.input`
  height: 42px; padding: 0 12px; border: 1px solid ${TOK.ring}; border-radius: 10px;
  color: ${TOK.text}; outline: none; font-size: 14px; background: #fff;
  &:focus { border-color: ${TOK.green}; box-shadow: 0 0 0 3px rgba(91,124,58,.12); }
`;
const Textarea = styled.textarea`
  min-height: 94px; padding: 10px 12px; border: 1px solid ${TOK.ring}; border-radius: 10px;
  color: ${TOK.text}; outline: none; font-size: 14px; background: #fff; resize: vertical;
  &:focus { border-color: ${TOK.green}; box-shadow: 0 0 0 3px rgba(91,124,58,.12); }
`;
const Small = styled.div` color:${TOK.sub}; font-size: 12px; `;

const LinkRow = styled.div`
  display: grid; gap: 8px; align-items: center;
  grid-template-columns: 1.1fr 1.3fr auto;
  @media (max-width: 560px){ grid-template-columns: 1fr; }
`;
const GhostBtn = styled.button`
  border: 1px solid ${TOK.ring}; background: #fff; color: ${TOK.text};
  height: 36px; padding: 0 12px; border-radius: 10px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 8px; font-weight: 800;
  &:active{ transform: translateY(1px) }
`;
const Danger = styled(GhostBtn)`
  color: ${TOK.red}; border-color: rgba(239,68,68,.35);
  @media (max-width: 560px){ justify-content: center; }
`;
const AddBtn = styled(GhostBtn)`
  color: ${TOK.green}; border-color: rgba(91,124,58,.35);
`;

const Actions = styled.div`
  position: sticky; bottom: 0; z-index: 5;
  margin-top: 12px;
  background: linear-gradient(180deg, transparent 0%, ${TOK.bg} 40%, ${TOK.bg} 100%);
  padding-top: 8px;
  display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: end;
  @media (max-width: 560px){ grid-template-columns: 1fr; }
`;
const Primary = styled.button`
  height: 44px; border: 0; border-radius: 12px; cursor: pointer;
  background: ${TOK.green}; color:#fff; font-weight: 900; letter-spacing:.2px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  &:disabled{ opacity:.6; cursor:not-allowed }
  &:active{ transform: translateY(1px); }
`;
const Secondary = styled(GhostBtn)`
  height: 44px; font-weight: 900;
`;

/* ============ Helpers ============ */
const newLink = () => ({ label: "", href: "" });
const DEFAULT_DATA = {
    logoUrl: "",
    company: "Prakruti Farms PVT LTD",
    address: "Kadapa, Andhra Pradesh",
    phone: "+91 9949295511",
    sections: [
        {
            id: "business", title: "Business", links: [
                // { label: "Collaborations", href: "#" },
                { label: "Sourcing", href: "#" },
                { label: "Export", href: "#" },
            ]
        },
        {
            id: "support", title: "Support", links: [
                { label: "Contact Us", href: "#" },
                { label: "Shipping & Returns", href: "#" },
                { label: "FAQs", href: "#" },
                { label: "Mobile: +91 9949295511", href: "tel:+919949295511" },
            ]
        },
    ],
    subscribeEnabled: true,
};

const sanitizeHref = (href = "") => {
    const v = href.trim();
    if (!v) return "";
    if (v.startsWith("#") || v.startsWith("mailto:") || v.startsWith("tel:")) return v;
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
};

/* ============ Component ============ */
export default function AdminFooter() {
    const [form, setForm] = useState(DEFAULT_DATA);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const ref = useMemo(() => doc(db, "settings", "siteFooter"), []);

    useEffect(() => {
        (async () => {
            try {
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    setForm({ ...DEFAULT_DATA, ...data });
                } else {
                    setForm(DEFAULT_DATA);
                }
            } catch (e) {
                console.error("Footer load failed", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [ref]);

    const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const setSectionTitle = (id, title) => {
        setForm(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === id ? { ...s, title } : s),
        }));
    };

    const addLink = (id) => {
        setForm(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === id ? { ...s, links: [...(s.links || []), newLink()] } : s),
        }));
    };

    const updateLink = (id, idx, patch) => {
        setForm(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== id) return s;
                const links = [...(s.links || [])];
                links[idx] = { ...links[idx], ...patch };
                return { ...s, links };
            }),
        }));
    };

    const removeLink = (id, idx) => {
        setForm(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== id) return s;
                const links = [...(s.links || [])];
                links.splice(idx, 1);
                return { ...s, links };
            }),
        }));
    };

    const reset = () => { setForm(DEFAULT_DATA); setMessage(""); };

    const save = async () => {
        try {
            setSaving(true);
            // sanitize URLs
            const payload = {
                ...form,
                sections: (form.sections || []).map(sec => ({
                    ...sec,
                    title: (sec.title || "").trim() || "Untitled",
                    links: (sec.links || []).map(l => ({
                        label: (l.label || "").trim(),
                        href: sanitizeHref(l.href || ""),
                    })).filter(l => l.label),
                })),
            };
            await setDoc(ref, payload, { merge: true });
            setMessage("Saved!");
            setTimeout(() => setMessage(""), 2000);
        } catch (e) {
            console.error("Footer save failed", e);
            setMessage("Failed to save. Check console.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Wrap>
                <Head>
                    <h1>Footer Settings</h1>
                    <p>Loading…</p>
                </Head>
                <Grid>
                    <Card style={{ height: 220 }} />
                    <Card style={{ height: 220 }} />
                </Grid>
            </Wrap>
        );
    }

    const business = form.sections?.find(s => s.id === "business") || { id: "business", title: "Business", links: [] };
    const support = form.sections?.find(s => s.id === "support") || { id: "support", title: "Support", links: [] };

    return (
        <Wrap>
            <Head>
                <h1>Footer Settings</h1>
                <p>Manage footer sections, brand info, and contact details. Changes are saved to <code>settings/siteFooter</code>.</p>
            </Head>

            <Grid>
                {/* Brand / Company */}
                <Card>
                    <SectionTitle>Brand & Company</SectionTitle>
                    <Row>
                        <Field>
                            Logo URL
                            <Input
                                placeholder="https://…/logo.png"
                                value={form.logoUrl}
                                onChange={e => setField("logoUrl", e.target.value)}
                            />
                            <Small>Add a transparent PNG/SVG. Left empty to show the wordmark.</Small>
                        </Field>
                        <div style={{ display: "grid", alignItems: "end" }}>
                            <div style={{
                                border: `1px solid ${TOK.ring}`, borderRadius: 12, padding: 10,
                                minHeight: 76, display: "grid", placeItems: "center"
                            }}>
                                {form.logoUrl ? (
                                    <img src={form.logoUrl} alt="Logo preview" style={{ maxWidth: 180, maxHeight: 60, objectFit: "contain" }} />
                                ) : (
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: TOK.sub }}>
                                        <FiImage /> No logo — wordmark will show
                                    </div>
                                )}
                            </div>
                        </div>
                    </Row>

                    <Row>
                        <Field>
                            Company Name
                            <Input
                                placeholder="Prakruti Farms PVT LTD"
                                value={form.company}
                                onChange={e => setField("company", e.target.value)}
                            />
                        </Field>
                        <Field>
                            Phone (Link)
                            <Input
                                placeholder="+91 9949295511"
                                value={form.phone}
                                onChange={e => setField("phone", e.target.value)}
                            />
                            <Small>Shown in Support → “Mobile: …” and used for tel: link.</Small>
                        </Field>
                    </Row>

                    <Field style={{ marginTop: 6 }}>
                        Address
                        <Textarea
                            placeholder="Kadapa, Andhra Pradesh"
                            value={form.address}
                            onChange={e => setField("address", e.target.value)}
                        />
                    </Field>
                </Card>

                {/* Subscribe / Misc */}
                <Card>
                    <SectionTitle>Subscribe</SectionTitle>
                    <Row>
                        <Field>
                            Subscribe Block
                            <select
                                value={String(form.subscribeEnabled)}
                                onChange={(e) => setField("subscribeEnabled", e.target.value === "true")}
                                style={{
                                    height: 42, borderRadius: 10, border: `1px solid ${TOK.ring}`,
                                    padding: "0 12px", color: TOK.text, background: "#fff"
                                }}
                            >
                                <option value="true">Enabled</option>
                                <option value="false">Hidden</option>
                            </select>
                            <Small>Controls the “Subscribe to our emails” block visibility.</Small>
                        </Field>
                    </Row>
                </Card>

                {/* Business Links */}
                <Card>
                    <SectionTitle>{business.title}</SectionTitle>
                    <Field>
                        Section Title
                        <Input
                            value={business.title}
                            onChange={e => setSectionTitle("business", e.target.value)}
                        />
                    </Field>

                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                        {(business.links || []).map((lnk, i) => (
                            <LinkRow key={`business-${i}`}>
                                <Input
                                    placeholder="Label (e.g., Collaborations)"
                                    value={lnk.label}
                                    onChange={e => updateLink("business", i, { label: e.target.value })}
                                />
                                <Input
                                    placeholder="URL (https://, /path, #hash, tel:, mailto:)"
                                    value={lnk.href}
                                    onChange={e => updateLink("business", i, { href: e.target.value })}
                                />
                                <Danger type="button" onClick={() => removeLink("business", i)}>
                                    <FiTrash2 /> Remove
                                </Danger>
                            </LinkRow>
                        ))}

                        <AddBtn type="button" onClick={() => addLink("business")}>
                            <FiPlus /> Add Link
                        </AddBtn>
                    </div>
                </Card>

                {/* Support Links */}
                <Card>
                    <SectionTitle>{support.title}</SectionTitle>
                    <Field>
                        Section Title
                        <Input
                            value={support.title}
                            onChange={e => setSectionTitle("support", e.target.value)}
                        />
                    </Field>

                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                        {(support.links || []).map((lnk, i) => (
                            <LinkRow key={`support-${i}`}>
                                <Input
                                    placeholder="Label (e.g., Contact Us)"
                                    value={lnk.label}
                                    onChange={e => updateLink("support", i, { label: e.target.value })}
                                />
                                <Input
                                    placeholder="URL (https://, /path, #hash, tel:, mailto:)"
                                    value={lnk.href}
                                    onChange={e => updateLink("support", i, { href: e.target.value })}
                                />
                                <Danger type="button" onClick={() => removeLink("support", i)}>
                                    <FiTrash2 /> Remove
                                </Danger>
                            </LinkRow>
                        ))}

                        <AddBtn type="button" onClick={() => addLink("support")}>
                            <FiPlus /> Add Link
                        </AddBtn>
                    </div>
                </Card>
            </Grid>

            <Actions>
                <Small>{message}</Small>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Secondary type="button" onClick={reset}><FiRefreshCw /> Reset</Secondary>
                    <Primary type="button" onClick={save} disabled={saving}>
                        <FiSave /> {saving ? "Saving…" : "Save Settings"}
                    </Primary>
                </div>
            </Actions>
        </Wrap>
    );
}
