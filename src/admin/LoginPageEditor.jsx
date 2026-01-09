// src/admin/LoginPageEditor.jsx
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useDoc } from "../hooks/useDoc";
import { FiPlus, FiTrash2, FiSave, FiRefreshCcw } from "react-icons/fi";

const Wrap = styled.div`
  max-width: 880px; margin: 24px auto; padding: 24px;
  background:#fff; border:1px solid #e5e7eb; border-radius:14px;
`;
const Row = styled.div`display:grid; gap:8px; margin:14px 0;`;
const Label = styled.label`font-weight:700; color:#111827;`;
const Input = styled.input`
  border:1px solid #d1d5db; border-radius:10px; padding:10px 12px; outline:none; width:100%;
  &:focus{ border-color:#6e8c53; box-shadow:0 0 0 3px rgba(110,140,83,.15); }
`;
const Textarea = styled.textarea`
  border:1px solid #d1d5db; border-radius:10px; padding:10px 12px; outline:none; width:100%; min-height:100px;
  &:focus{ border-color:#6e8c53; box-shadow:0 0 0 3px rgba(110,140,83,.15); }
`;
const H = styled.h2`margin:0 0 10px;`;
const Small = styled.small`color:#6b7280;`;
const Actions = styled.div`display:flex; gap:10px; align-items:center; margin-top:16px;`;
const Btn = styled.button`
  display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px;
  border:1px solid transparent; cursor:pointer; font-weight:800;
  background:#6e8c53; color:#fff;
  &:disabled{ opacity:.7; cursor:not-allowed; }
`;
const Ghost = styled(Btn)`background:#fff; color:#111827; border-color:#d1d5db;`;
const BulletLine = styled.div`display:flex; gap:10px; align-items:center; margin:6px 0;`;
const Hint = styled.span`margin-left:auto; color:#6b7280; font-size:12px;`;

export default function LoginPageEditor() {
    const { data, initializing, refreshing, err, saveDoc } = useDoc("appContent", "loginPage");

    const [draft, setDraft] = useState(null);
    const model = useMemo(() => draft ?? data ?? {}, [draft, data]);
    const dirty = !!draft;

    function setField(k, v) { setDraft((d) => ({ ...(d ?? data ?? {}), [k]: v })); }
    function addBullet() { setField("bullets", [...(model.bullets ?? []), ""]); }
    function setBullet(i, v) {
        const arr = [...(model.bullets ?? [])]; arr[i] = v; setField("bullets", arr);
    }
    function removeBullet(i) {
        const arr = [...(model.bullets ?? [])]; arr.splice(i, 1); setField("bullets", arr);
    }

    async function onSave() {
        if (!model.brandName?.trim()) return alert("Brand Name is required");
        if (!model.logoText?.trim()) return alert("Logo Text is required");

        const payload = {
            brandName: model.brandName || "Prakruti Admin",
            logoText: model.logoText || "PF",
            heading: model.heading || "Sign in to your workspace",
            sub: model.sub || "",
            bullets: (model.bullets ?? []).filter(Boolean),
            rightTitle: model.rightTitle || "",
            rightText: model.rightText || "",
            termsUrl: model.termsUrl || "",
            privacyUrl: model.privacyUrl || ""
        };

        await saveDoc(payload, { optimistic: true, refetch: true }); // no flicker
        setDraft(null);
    }

    // Only block UI on very first load
    if (initializing) return <Wrap>Loading…</Wrap>;
    if (err) return <Wrap>Error: {err}</Wrap>;

    return (
        <Wrap>
            <H>Login Page Content</H>
            <Small>Edits are saved to <code>appContent/loginPage</code>. The Login page reads these values dynamically.</Small>

            <Row>
                <Label>Brand Name</Label>
                <Input value={model.brandName ?? ""} onChange={e => setField("brandName", e.target.value)} />
            </Row>
            <Row>
                <Label>Logo Text (2–3 letters)</Label>
                <Input value={model.logoText ?? ""} onChange={e => setField("logoText", e.target.value)} />
            </Row>
            <Row>
                <Label>Heading</Label>
                <Input value={model.heading ?? ""} onChange={e => setField("heading", e.target.value)} />
            </Row>
            <Row>
                <Label>Subtitle</Label>
                <Textarea value={model.sub ?? ""} onChange={e => setField("sub", e.target.value)} />
            </Row>

            <Row>
                <Label>Bullets</Label>
                {(model.bullets ?? []).map((b, i) => (
                    <BulletLine key={i}>
                        <Input value={b} onChange={e => setBullet(i, e.target.value)} placeholder="e.g., Role-based access" />
                        <Ghost type="button" onClick={() => removeBullet(i)}><FiTrash2 /> Remove</Ghost>
                    </BulletLine>
                ))}
                <Ghost type="button" onClick={addBullet}><FiPlus /> Add bullet</Ghost>
            </Row>

            <Row>
                <Label>Right Panel Title</Label>
                <Input value={model.rightTitle ?? ""} onChange={e => setField("rightTitle", e.target.value)} />
            </Row>
            <Row>
                <Label>Right Panel Text</Label>
                <Textarea value={model.rightText ?? ""} onChange={e => setField("rightText", e.target.value)} />
            </Row>

            <Row>
                <Label>Terms URL</Label>
                <Input value={model.termsUrl ?? ""} onChange={e => setField("termsUrl", e.target.value)} />
            </Row>
            <Row>
                <Label>Privacy URL</Label>
                <Input value={model.privacyUrl ?? ""} onChange={e => setField("privacyUrl", e.target.value)} />
            </Row>

            <Actions>
                <Btn onClick={onSave} disabled={!dirty}><FiSave /> Save</Btn>
                <Ghost onClick={() => setDraft(null)} disabled={!dirty}><FiRefreshCcw /> Reset</Ghost>
                {refreshing && <Hint>Syncing…</Hint>}
            </Actions>
        </Wrap>
    );
}
