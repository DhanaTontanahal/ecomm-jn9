// src/pages/BecomeSupplier.jsx
import React, { useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { db, storage } from "../firebase/firebase"; // ⬅️ ensure storage is exported
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // ⬅️ storage helpers
import { useAuth } from "../auth/AuthProvider";

const TOK = {
    maxW: "960px",
    bg: "#fff",
    tint: "#fdece6",
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    card: "#fff",
    pill: "rgba(16,24,40,.06)",
    green: "#5b7c3a",
    red: "#ef4444",
};

const Global = createGlobalStyle`
  body{ font-family: Inter, ui-sans-serif, system-ui; color:${TOK.ink}; background:${TOK.bg}; }
`;

const Page = styled.div`min-height:100dvh;`;
const Head = styled.header`
  background:${TOK.tint};
  border-bottom-left-radius:28px; border-bottom-right-radius:28px;
  padding:12px 16px 18px;
`;
const Bar = styled.div`display:flex; align-items:center; justify-content:space-between;`;
const Back = styled.button`
  border:0; background:transparent; padding:8px; border-radius:12px; cursor:pointer; color:${TOK.ink};
`;
const H1 = styled.h1`
  margin:12px 0 0; font-size: clamp(22px, 4.8vw, 28px); font-weight:900;
`;
const Wrap = styled.div`max-width:${TOK.maxW}; margin:0 auto; padding:12px 14px 24px;`;
const Card = styled.div`
  background:${TOK.card}; border:1px solid ${TOK.line}; border-radius:18px; padding:16px;
  display:grid; gap:12px;
`;
const Row = styled.div`display:grid; gap:8px;`;
const Label = styled.label`font-weight:900; font-size:14px;`;
const Input = styled.input`
  height:44px; border:1px solid ${TOK.line}; border-radius:12px; padding:0 12px; outline:0; font-size:14px;
`;
const Textarea = styled.textarea`
  min-height:110px; border:1px solid ${TOK.line}; border-radius:12px; padding:10px 12px; outline:0; font-size:14px; resize:vertical;
`;
const Actions = styled.div`display:flex; gap:10px; flex-wrap:wrap;`;
const Primary = styled.button`
  border:0; background:${TOK.green}; color:#fff; border-radius:12px; padding:10px 16px; font-weight:900; cursor:pointer;
  opacity:${(p) => (p.disabled ? 0.7 : 1)}; pointer-events:${(p) => (p.disabled ? "none" : "auto")};
`;
const Secondary = styled.button`
  border:1px solid ${TOK.line}; background:#fff; border-radius:12px; padding:10px 16px; font-weight:900; cursor:pointer;
`;
const Note = styled.div`color:${TOK.sub}; font-weight:600;`;

/* === Attachment styling === */
const FileWrap = styled.div`
  display:flex;
  flex-direction:column;
  gap:8px;
`;

const FileInput = styled.input`
  font-size:13px;
  padding:8px 10px;
  border-radius:10px;
  border:1px dashed ${TOK.line};
  background: #fafafa;
`;

const FileMeta = styled.div`
  font-size:12px;
  color:${TOK.sub};
  background:${TOK.pill};
  border-radius:999px;
  padding:4px 10px;
  display:inline-flex;
  align-items:center;
  gap:6px;
`;

const Badge = styled.span`
  font-size:11px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.03em;
  padding:2px 8px;
  border-radius:999px;
  background:rgba(91,124,58,.08);
  color:${TOK.green};
`;

export default function BecomeSupplier() {
    const nav = useNavigate();
    const { user } = useAuth() || {};

    const [form, setForm] = useState({
        companyName: "",
        contactName: "",
        phone: "",
        email: user?.email || "",
        category: "",
        website: "",
        message: "",
    });

    const [saving, setSaving] = useState(false);

    // New: attachment state
    const [attachmentFile, setAttachmentFile] = useState(null);

    const onChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setAttachmentFile(null);
            return;
        }

        // Optional: basic size limit (e.g., 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("File size should be less than 10MB.");
            e.target.value = "";
            return;
        }

        setAttachmentFile(file);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!user)
            return nav("/login", { state: { next: "/become-supplier" } });

        if (!form.companyName || !form.contactName || !form.phone)
            return alert("Please fill required fields.");

        try {
            setSaving(true);

            let attachmentUrl = "";
            let attachmentType = "";
            let attachmentName = "";
            let attachmentSize = 0;

            if (attachmentFile) {
                const path = `supplierRequests/${user.uid}/${Date.now()}-${attachmentFile.name}`;
                const fileRef = ref(storage, path);
                await uploadBytes(fileRef, attachmentFile);
                attachmentUrl = await getDownloadURL(fileRef);
                attachmentType = attachmentFile.type || "";
                attachmentName = attachmentFile.name;
                attachmentSize = attachmentFile.size;
            }

            await addDoc(collection(db, "supplierRequests"), {
                ...form,
                uid: user.uid,
                status: "NEW",
                createdAt: serverTimestamp(),
                attachmentUrl: attachmentUrl || null,
                attachmentType: attachmentType || null,
                attachmentName: attachmentName || null,
                attachmentSize: attachmentSize || null,
            });

            alert("Thanks! We received your supplier request.");
            nav("/accounts");
        } catch (err) {
            console.error(err);
            alert("Could not submit. Try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Page>
            <Global />
            <Head>
                <Bar>
                    <Back onClick={() => nav(-1)} aria-label="Back">
                        <FiChevronLeft size={22} />
                    </Back>
                    <div />
                </Bar>
                <H1>Become a Supplier</H1>
            </Head>

            <Wrap>
                <Card as="form" onSubmit={submit}>
                    <Row>
                        <Label>Company / Brand *</Label>
                        <Input
                            name="companyName"
                            value={form.companyName}
                            onChange={onChange}
                            placeholder="e.g., Soami Organic Foods"
                        />
                    </Row>
                    <Row>
                        <Label>Contact Person *</Label>
                        <Input
                            name="contactName"
                            value={form.contactName}
                            onChange={onChange}
                            placeholder="Your full name"
                        />
                    </Row>
                    <Row>
                        <Label>Phone *</Label>
                        <Input
                            name="phone"
                            value={form.phone}
                            onChange={onChange}
                            placeholder="10-digit mobile"
                            inputMode="tel"
                        />
                    </Row>
                    <Row>
                        <Label>Email</Label>
                        <Input
                            name="email"
                            value={form.email}
                            onChange={onChange}
                            placeholder="name@company.com"
                        />
                    </Row>
                    <Row>
                        <Label>Product Category</Label>
                        <Input
                            name="category"
                            value={form.category}
                            onChange={onChange}
                            placeholder="e.g., Cold-pressed oils, Millets"
                        />
                    </Row>
                    <Row>
                        <Label>Website / Social</Label>
                        <Input
                            name="website"
                            value={form.website}
                            onChange={onChange}
                            placeholder="https://example.com"
                        />
                    </Row>
                    <Row>
                        <Label>Notes</Label>
                        <Textarea
                            name="message"
                            value={form.message}
                            onChange={onChange}
                            placeholder="Tell us about your products, certifications, etc."
                        />
                    </Row>

                    {/* New: attachment field */}
                    <Row>
                        <Label>Attach photo / video (optional)</Label>
                        <FileWrap>
                            <FileInput
                                type="file"
                                accept="image/*,video/*"
                                onChange={onFileChange}
                            />
                            {attachmentFile && (
                                <FileMeta>
                                    <Badge>
                                        {attachmentFile.type.startsWith("video/") ? "Video" : "Image"}
                                    </Badge>
                                    <span>{attachmentFile.name}</span>
                                    <span>
                                        {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </FileMeta>
                            )}
                        </FileWrap>
                    </Row>

                    <Actions>
                        <Primary type="submit" disabled={saving}>
                            {saving ? "Submitting…" : "Submit Request"}
                        </Primary>
                        <Secondary type="button" onClick={() => nav("/accounts")}>
                            Cancel
                        </Secondary>
                    </Actions>
                    <Note>
                        Submitted under your account. Our team will contact you soon.
                    </Note>
                </Card>
            </Wrap>
        </Page>
    );
}
