// src/pages/purchases/Vendors.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
    collection, addDoc, updateDoc, doc, onSnapshot, orderBy, query, serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { FiPlus, FiSearch, FiX, FiDownload, FiEdit3 } from "react-icons/fi";

const C = {
    bg: "#0b1220", text: "#e7efff", sub: "#b7c6e6",
    glass: "rgba(255,255,255,.06)", glass2: "rgba(255,255,255,.10)",
    border: "rgba(255,255,255,.14)", ring: "#78c7ff", primary: "#4ea1ff"
};
const fade = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}`;
const Page = styled.div`min-height:100dvh;background:${C.bg};color:${C.text};padding:18px;`;
const Head = styled.div`max-width:1280px;margin:0 auto 12px;display:flex;gap:12px;align-items:center;`;
const Input = styled.input`
  background:${C.glass2}; color:${C.text}; border:1px solid ${C.border}; border-radius:10px; padding:10px 12px; width:100%;
  &:focus{ outline:none; box-shadow:0 0 0 3px ${C.ring}; }
`;
const Btn = styled.button`
  background:${C.primary}; color:#fff; border:0; border-radius:10px; padding:10px 12px; display:inline-flex; gap:8px; align-items:center; cursor:pointer;
`;
const Card = styled.div`max-width:1280px;margin:0 auto;background:${C.glass};border:1px solid ${C.border};border-radius:14px;animation:${fade} .25s both;`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th,td{ border-bottom:1px solid ${C.border}; padding:10px; vertical-align:top; }
  th{ text-align:left; color:${C.sub}; font-weight:600; }
`;
const DrawerWrap = styled.div`
  position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:90;
`;
const Drawer = styled.div`
  width:min(980px,96vw); max-height:92vh; overflow:auto; border:1px solid ${C.border}; background:#0d1526; color:${C.text};
  border-radius:14px; display:grid; grid-template-rows:56px 1fr; 
`;
const DrawerHead = styled.div`display:flex; align-items:center; justify-content:space-between; padding:0 12px; border-bottom:1px solid ${C.border};`;
const Tabs = styled.div`display:flex; gap:8px; padding:10px 12px; border-bottom:1px solid ${C.border}; background:${C.glass2}; flex-wrap:wrap;`;
const Tab = styled.button`
  border:1px solid ${p => p.$on ? C.primary : C.border}; background:${p => p.$on ? C.glass2 : C.glass}; color:${C.text};
  padding:6px 10px; border-radius:999px; cursor:pointer; font-weight:700; font-size:12px;
`;
const Section = styled.div`padding:12px; display:grid; gap:10px;`;
const Two = styled.div`display:grid; gap:10px; grid-template-columns: 1fr 1fr;`;

function validateGSTIN(v) {
    if (!v) return true;
    // very light check (15 alphanum)
    return /^[0-9A-Z]{15}$/i.test(v.trim());
}

function VendorForm({ initial, onClose }) {
    const [tab, setTab] = useState("other");
    const [saving, setSaving] = useState(false);

    const [primary, setPrimary] = useState({
        salutation: initial?.salutation || "",
        firstName: initial?.firstName || "",
        lastName: initial?.lastName || "",
        companyName: initial?.companyName || "",
        displayName: initial?.displayName || "",
        email: initial?.email || "",
        phoneWork: initial?.phoneWork || "",
        phoneMobile: initial?.phoneMobile || "",
        website: initial?.website || "",
    });

    const [other, setOther] = useState({
        gstTreatment: initial?.gstTreatment || "",
        sourceOfSupply: initial?.sourceOfSupply || "",
        currency: initial?.currency || "INR",
        openingBalance: initial?.openingBalance || 0,
        paymentTerms: initial?.paymentTerms || "Due on Receipt",
        tds: initial?.tds || "",
        enablePortal: initial?.enablePortal || false,
        portalLanguage: initial?.portalLanguage || "English",
        gstin: initial?.gstin || "",
    });

    const [address, setAddress] = useState({
        billing: initial?.address?.billing || { line1: "", line2: "", city: "", state: "", zip: "" },
        shipping: initial?.address?.shipping || { line1: "", line2: "", city: "", state: "", zip: "" },
    });

    const [contacts, setContacts] = useState(initial?.contacts || []); // [{name, email, phone}]
    const [custom, setCustom] = useState(initial?.custom || {});       // free-form key/val
    const [tags, setTags] = useState(initial?.tags || []);             // array of strings
    const [remarks, setRemarks] = useState(initial?.remarks || "");

    const invalidGST = !validateGSTIN(other.gstin);

    async function save() {
        if (!primary.displayName.trim()) { alert("Vendor Display Name is required"); return; }
        if (invalidGST) { alert("Please enter a valid 15-char GSTIN, or leave it blank."); return; }

        const payload = {
            ...primary,
            address,
            contacts,
            custom,
            tags,
            remarks,
            gstTreatment: other.gstTreatment,
            sourceOfSupply: other.sourceOfSupply,
            currency: other.currency,
            openingBalance: Number(other.openingBalance || 0),
            paymentTerms: other.paymentTerms,
            tds: other.tds || null,
            enablePortal: !!other.enablePortal,
            portalLanguage: other.portalLanguage,
            gstin: other.gstin?.trim() || null,
            updatedAt: serverTimestamp(),
            ...(initial?.id ? {} : { createdAt: serverTimestamp(), active: true }),
        };

        setSaving(true);
        try {
            if (initial?.id) {
                await updateDoc(doc(db, "vendors", initial.id), payload);
            } else {
                await addDoc(collection(db, "vendors"), payload);
            }
            onClose(true);
        } finally {
            setSaving(false);
        }
    }

    return (
        <DrawerWrap>
            <Drawer>
                <DrawerHead>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h3 style={{ margin: 0 }}>{initial?.id ? "Edit Vendor" : "New Vendor"}</h3>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <Btn onClick={save} disabled={saving || invalidGST}>{saving ? "Saving…" : "Save"}</Btn>
                        <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={onClose}><FiX /> Close</Btn>
                    </div>
                </DrawerHead>

                <div>
                    <Tabs>
                        <Tab $on={tab === "other"} onClick={() => setTab("other")}>Other Details</Tab>
                        <Tab $on={tab === "addr"} onClick={() => setTab("addr")}>Address</Tab>
                        <Tab $on={tab === "contacts"} onClick={() => setTab("contacts")}>Contact Persons</Tab>
                        <Tab $on={tab === "custom"} onClick={() => setTab("custom")}>Custom Fields</Tab>
                        <Tab $on={tab === "tags"} onClick={() => setTab("tags")}>Reporting Tags</Tab>
                        <Tab $on={tab === "remarks"} onClick={() => setTab("remarks")}>Remarks</Tab>
                    </Tabs>

                    {/* Primary (top of form, like Zoho) */}
                    <Section>
                        <Two>
                            <Input placeholder="Salutation" value={primary.salutation} onChange={e => setPrimary({ ...primary, salutation: e.target.value })} />
                            <Two>
                                <Input placeholder="First Name" value={primary.firstName} onChange={e => setPrimary({ ...primary, firstName: e.target.value })} />
                                <Input placeholder="Last Name" value={primary.lastName} onChange={e => setPrimary({ ...primary, lastName: e.target.value })} />
                            </Two>
                        </Two>
                        <Input placeholder="Company Name" value={primary.companyName} onChange={e => setPrimary({ ...primary, companyName: e.target.value })} />
                        <Input placeholder="Vendor Display Name *" value={primary.displayName} onChange={e => setPrimary({ ...primary, displayName: e.target.value })} />
                        <Two>
                            <Input placeholder="Vendor Email" value={primary.email} onChange={e => setPrimary({ ...primary, email: e.target.value })} />
                            <Two>
                                <Input placeholder="Work Phone" value={primary.phoneWork} onChange={e => setPrimary({ ...primary, phoneWork: e.target.value })} />
                                <Input placeholder="Mobile" value={primary.phoneMobile} onChange={e => setPrimary({ ...primary, phoneMobile: e.target.value })} />
                            </Two>
                        </Two>
                        <Input placeholder="Website" value={primary.website} onChange={e => setPrimary({ ...primary, website: e.target.value })} />
                    </Section>

                    {tab === "other" && (
                        <Section>
                            <Two>
                                <Input placeholder="GST Treatment" value={other.gstTreatment} onChange={e => setOther({ ...other, gstTreatment: e.target.value })} />
                                <Input placeholder="Source of Supply" value={other.sourceOfSupply} onChange={e => setOther({ ...other, sourceOfSupply: e.target.value })} />
                            </Two>
                            <Two>
                                <Input placeholder="Currency" value={other.currency} onChange={e => setOther({ ...other, currency: e.target.value })} />
                                <Input placeholder="Opening Balance" type="number" value={other.openingBalance} onChange={e => setOther({ ...other, openingBalance: e.target.value })} />
                            </Two>
                            <Two>
                                <Input placeholder="Payment Terms" value={other.paymentTerms} onChange={e => setOther({ ...other, paymentTerms: e.target.value })} />
                                <Input placeholder="TDS" value={other.tds} onChange={e => setOther({ ...other, tds: e.target.value })} />
                            </Two>
                            <Two>
                                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input type="checkbox" checked={other.enablePortal} onChange={e => setOther({ ...other, enablePortal: e.target.checked })} />
                                    Enable portal access
                                </label>
                                <Input placeholder="Portal Language" value={other.portalLanguage} onChange={e => setOther({ ...other, portalLanguage: e.target.value })} />
                            </Two>
                            <Input placeholder="GSTIN (15 chars)" value={other.gstin} onChange={e => setOther({ ...other, gstin: e.target.value.toUpperCase() })} style={invalidGST ? { borderColor: "#ef4444" } : undefined} />
                            {invalidGST && <div style={{ color: "#ef4444", fontSize: 12 }}>Invalid GSTIN.</div>}
                        </Section>
                    )}

                    {tab === "addr" && (
                        <Section>
                            <h4 style={{ margin: "6px 0" }}>Billing</h4>
                            <Two>
                                <Input placeholder="Line 1" value={address.billing.line1} onChange={e => setAddress({ ...address, billing: { ...address.billing, line1: e.target.value } })} />
                                <Input placeholder="Line 2" value={address.billing.line2} onChange={e => setAddress({ ...address, billing: { ...address.billing, line2: e.target.value } })} />
                            </Two>
                            <Two>
                                <Input placeholder="City" value={address.billing.city} onChange={e => setAddress({ ...address, billing: { ...address.billing, city: e.target.value } })} />
                                <Two>
                                    <Input placeholder="State" value={address.billing.state} onChange={e => setAddress({ ...address, billing: { ...address.billing, state: e.target.value } })} />
                                    <Input placeholder="PIN" value={address.billing.zip} onChange={e => setAddress({ ...address, billing: { ...address.billing, zip: e.target.value } })} />
                                </Two>
                            </Two>

                            <h4 style={{ margin: "10px 0 6px" }}>Shipping</h4>
                            <Two>
                                <Input placeholder="Line 1" value={address.shipping.line1} onChange={e => setAddress({ ...address, shipping: { ...address.shipping, line1: e.target.value } })} />
                                <Input placeholder="Line 2" value={address.shipping.line2} onChange={e => setAddress({ ...address, shipping: { ...address.shipping, line2: e.target.value } })} />
                            </Two>
                            <Two>
                                <Input placeholder="City" value={address.shipping.city} onChange={e => setAddress({ ...address, shipping: { ...address.shipping, city: e.target.value } })} />
                                <Two>
                                    <Input placeholder="State" value={address.shipping.state} onChange={e => setAddress({ ...address, shipping: { ...address.shipping, state: e.target.value } })} />
                                    <Input placeholder="PIN" value={address.shipping.zip} onChange={e => setAddress({ ...address, shipping: { ...address.shipping, zip: e.target.value } })} />
                                </Two>
                            </Two>
                        </Section>
                    )}

                    {tab === "contacts" && (
                        <Section>
                            {(contacts || []).map((c, idx) => (
                                <Two key={idx}>
                                    <Input placeholder="Name" value={c.name || ""} onChange={e => {
                                        const a = [...contacts]; a[idx] = { ...a[idx], name: e.target.value }; setContacts(a);
                                    }} />
                                    <Two>
                                        <Input placeholder="Email" value={c.email || ""} onChange={e => {
                                            const a = [...contacts]; a[idx] = { ...a[idx], email: e.target.value }; setContacts(a);
                                        }} />
                                        <Input placeholder="Phone" value={c.phone || ""} onChange={e => {
                                            const a = [...contacts]; a[idx] = { ...a[idx], phone: e.target.value }; setContacts(a);
                                        }} />
                                    </Two>
                                </Two>
                            ))}
                            <Btn onClick={() => setContacts([...(contacts || []), { name: "", email: "", phone: "" }])}><FiPlus /> Add Contact</Btn>
                        </Section>
                    )}

                    {tab === "custom" && (
                        <Section>
                            <Input placeholder="Custom field (key:value, comma separated)" value={Object.entries(custom).map(([k, v]) => `${k}:${v}`).join(", ")}
                                onChange={e => {
                                    const obj = {}; e.target.value.split(",").map(s => s.trim()).filter(Boolean).forEach(p => {
                                        const [k, ...rest] = p.split(":"); obj[k?.trim() || ""] = rest.join(":").trim();
                                    }); setCustom(obj);
                                }} />
                        </Section>
                    )}

                    {tab === "tags" && (
                        <Section>
                            <Input placeholder="Tags (comma separated)" value={(tags || []).join(", ")} onChange={e => setTags(e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
                        </Section>
                    )}

                    {tab === "remarks" && (
                        <Section>
                            <textarea rows={6} style={{ width: "100%", background: C.glass2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}
                                placeholder="Remarks / notes" value={remarks} onChange={e => setRemarks(e.target.value)} />
                        </Section>
                    )}
                </div>
            </Drawer>
        </DrawerWrap>
    );
}

export default function Vendors() {
    const [rows, setRows] = useState([]);
    const [qstr, setQstr] = useState("");
    const [openForm, setOpenForm] = useState(null); // null | {} new | vendor doc

    useEffect(() => {
        const qy = query(collection(db, "vendors"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(qy, snap => setRows(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return unsub;
    }, []);

    const filtered = useMemo(() => {
        const t = qstr.trim().toLowerCase();
        if (!t) return rows;
        return rows.filter(r => [
            r.displayName, r.companyName, r.email, r.phoneMobile, r.phoneWork, r.gstin
        ].some(x => String(x || "").toLowerCase().includes(t)));
    }, [rows, qstr]);

    function exportVendor(v) {
        // Simple printable sheet (browser print to PDF)
        const w = window.open("", "_blank");
        if (!w) return;
        const html = `
      <html><head><title>Vendor – ${v.displayName}</title></head>
      <body style="font-family:system-ui;padding:24px">
        <h2>Vendor – ${v.displayName}</h2>
        <p><b>Company:</b> ${v.companyName || "-"}</p>
        <p><b>Email:</b> ${v.email || "-"} &nbsp; <b>Phone:</b> ${v.phoneWork || v.phoneMobile || "-"}</p>
        <p><b>GSTIN:</b> ${v.gstin || "-"} &nbsp; <b>Currency:</b> ${v.currency || "INR"}</p>
        <hr/>
        <pre>${JSON.stringify(v, null, 2)}</pre>
        <script>window.print()</script>
      </body></html>`;
        w.document.write(html); w.document.close();
    }

    return (
        <Page>
            <Head>
                <div style={{ position: "relative", flex: 1 }}>
                    <Input placeholder="Search vendors (name / company / phone / email / GSTIN)" value={qstr} onChange={e => setQstr(e.target.value)} style={{ paddingLeft: 36 }} />
                    <FiSearch style={{ position: "absolute", left: 10, top: 12, color: C.sub }} />
                </div>
                <Btn onClick={() => setOpenForm({})}><FiPlus /> New Vendor</Btn>
            </Head>

            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Display Name</th>
                            <th>Company</th>
                            <th>Contacts</th>
                            <th>GST / Currency</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(v => (
                            <tr key={v.id}>
                                <td style={{ fontWeight: 700 }}>{v.displayName}</td>
                                <td>{v.companyName || "-"}</td>
                                <td>
                                    <div style={{ color: C.sub, fontSize: 12 }}>{v.email || "-"}</div>
                                    <div>{v.phoneWork || v.phoneMobile || "-"}</div>
                                </td>
                                <td>
                                    <div>GSTIN: {v.gstin || "-"}</div>
                                    <div style={{ color: C.sub, fontSize: 12 }}>Currency: {v.currency || "INR"}</div>
                                </td>
                                <td style={{ display: "flex", gap: 8 }}>
                                    <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => setOpenForm(v)}><FiEdit3 /> Edit</Btn>
                                    <Btn as="button" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text }} onClick={() => exportVendor(v)}><FiDownload /> PDF</Btn>
                                </td>
                            </tr>
                        ))}
                        {!filtered.length && <tr><td colSpan={5} style={{ color: C.sub, padding: 16 }}>No vendors yet.</td></tr>}
                    </tbody>
                </Table>
            </Card>

            {!!openForm && <VendorForm initial={Object.keys(openForm).length ? openForm : null} onClose={() => setOpenForm(null)} />}
        </Page>
    );
}
