import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref as sRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/firebase";
import OurCertifications from "../landingpage/OurCertifications";

const Wrap = styled.div`
  display: grid; gap: 16px; align-items: start;
  grid-template-columns: 1fr 1fr;
  @media (max-width: 1080px){ grid-template-columns: 1fr; }
`;
const Card = styled.div`
  background: #fff; border: 1px solid rgba(16,24,40,.12);
  border-radius: 14px; padding: 16px; display: grid; gap: 12px;
`;
const Row = styled.div` display: grid; gap: 8px; `;
const Label = styled.label` font-weight: 700; font-size: 13px; `;
const Input = styled.input`
  padding: 10px 12px; border: 1px solid rgba(16,24,40,.16); border-radius: 10px; font-size: 14px;
`;
const Actions = styled.div` display:flex; gap:10px; flex-wrap:wrap; `;
const Btn = styled.button`
  padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(16,24,40,.14);
  background: #111827; color: #fff; font-weight: 700; cursor: pointer;
`;
const Ghost = styled(Btn)` background: #fff; color: #111827; `;
const Small = styled.small` color: #6b7280; `;
const List = styled.div` display: grid; gap: 12px; `;
const Item = styled.div`
  display: grid; gap: 10px; grid-template-columns: auto 1fr auto; align-items: center;
  border: 1px dashed rgba(16,24,40,.18); border-radius: 12px; padding: 10px; background:#fcfcfc;
`;
const Thumb = styled.img`
  width: 72px; height: 54px; object-fit: contain; background:#fff; border:1px solid rgba(16,24,40,.08); border-radius: 8px;
`;

export default function OurCertificationsAdmin({ docPath = "site_config/certifications" }) {
    const ref = useMemo(() => doc(db, ...docPath.split("/")), [docPath]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    setItems(Array.isArray(data.items) ? data.items : []);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [ref]);

    const addEmpty = () => setItems((arr) => [...arr, { src: "", alt: "", href: "" }]);
    const removeAt = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));
    const updateAt = (idx, patch) => setItems((arr) => arr.map((it, i) => i === idx ? { ...it, ...patch } : it));

    const uploadAt = (idx, file) => {
        if (!file) return;
        const ext = (file.name.split('.').pop() || 'png').toLowerCase();
        const path = `certifications/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const task = uploadBytesResumable(sRef(storage, path), file, { contentType: file.type || `image/${ext}` });
        updateAt(idx, { _uploadPct: 0 });
        task.on('state_changed', (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            updateAt(idx, { _uploadPct: pct });
        }, (err) => {
            console.error(err);
            updateAt(idx, { _uploadPct: undefined });
            alert('Upload failed');
        }, async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            updateAt(idx, { src: url, _uploadPct: undefined });
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            const clean = items
                .map(({ src, alt, href }) => ({ src, alt: alt || '', href: href || '' }))
                .filter(it => it.src);
            await setDoc(ref, { items: clean, updatedAt: serverTimestamp() }, { merge: true });
            alert('Saved certifications');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Card>Loading…</Card>;

    return (
        <Wrap>
            <Card>
                <h3 style={{ margin: 0 }}>Our Certifications — Admin</h3>
                <Small>Upload images (PNG/SVG/JPG), add optional link and alt text. Drag reorder can be added later.</Small>
                <Actions>
                    <Btn onClick={addEmpty}>+ Add Item</Btn>
                    <Ghost disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Ghost>
                </Actions>

                <List>
                    {items.map((it, idx) => (
                        <Item key={idx}>
                            <div>
                                <Thumb src={it.src || 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"90\"><rect width=\"100%\" height=\"100%\" fill=\"%23f3f4f6\"/></svg>'} alt={it.alt || 'preview'} />
                            </div>

                            <div style={{ display: 'grid', gap: 8 }}>
                                <Row>
                                    <Label>Upload Image</Label>
                                    <Input type="file" accept="image/*" onChange={(e) => uploadAt(idx, e.target.files?.[0])} />
                                    {typeof it._uploadPct === 'number' && <Small>Uploading… {it._uploadPct}%</Small>}
                                </Row>
                                <Row>
                                    <Label>Alt text</Label>
                                    <Input value={it.alt || ''} onChange={(e) => updateAt(idx, { alt: e.target.value })} placeholder="USDA Organic" />
                                </Row>
                                <Row>
                                    <Label>Optional link (href)</Label>
                                    <Input value={it.href || ''} onChange={(e) => updateAt(idx, { href: e.target.value })} placeholder="https://example.org" />
                                </Row>
                            </div>

                            <div>
                                <button onClick={() => removeAt(idx)} style={{ background: 'transparent', border: '1px solid rgba(16,24,40,.2)', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>Remove</button>
                            </div>
                        </Item>
                    ))}
                </List>

                <Actions>
                    <Ghost disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</Ghost>
                </Actions>
            </Card>

            <div>
                <h3 style={{ margin: '0 0 8px' }}>Live Preview</h3>
                <div style={{ border: "1px solid rgba(16,24,40,.12)", borderRadius: 14, overflow: "hidden" }}>
                    <OurCertifications docPath="" items={items} />
                </div>
            </div>
        </Wrap>
    );
}
