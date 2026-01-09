
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase"; // <-- adjust import
import PromoBannerCountdown from "./PromoBannerCountdown";

const Card = styled.div`
  background: rgba(255,255,255,.8);
  border: 1px solid rgba(16,24,40,.12);
  border-radius: 14px;
  padding: 16px;
  display: grid;
  gap: 12px;
`;
const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  @media (max-width: 960px){ grid-template-columns: 1fr; }
`;
const Row = styled.div`
  display: grid;
  gap: 10px;
`;
const Label = styled.label`
  font-weight: 700;
  font-size: 14px;
`;
const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid rgba(16,24,40,.16);
  border-radius: 10px;
  font-size: 14px;
`;
const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid rgba(16,24,40,.16);
  border-radius: 10px;
  font-size: 14px;
  min-height: 84px;
`;
const Actions = styled.div`
  display: flex; gap: 10px; flex-wrap: wrap;
`;
const Btn = styled.button`
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(16,24,40,.14);
  cursor: pointer;
  background: #111827; color: #fff; font-weight: 700;
`;
const Ghost = styled(Btn)`
  background: #fff; color: #111827;
`;
const H3 = styled.h3` margin: 0; `;

export default function PromoBannerAdmin({ docPath = "site_config/promoBanner" }) {
    const ref = useMemo(() => doc(db, ...docPath.split("/")), [docPath]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        headline: "",
        hashtag: "",
        offerText: "",
        subText: "",
        productImgUrl: "",
        bgImageUrl: "",
        endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        isActive: true,
    });

    useEffect(() => {
        (async () => {
            try {
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    const data = snap.data();
                    setForm((f) => ({
                        ...f,
                        ...data,
                        endsAt: Number(data.endsAt ?? (Date.now() + 7 * 24 * 60 * 60 * 1000)),
                    }));
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [ref]);

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    const save = async () => {
        const payload = {
            ...form,
            endsAt: Number(form.endsAt),
            updatedAt: serverTimestamp(),
        };
        await setDoc(ref, payload, { merge: true });
        alert("Saved promo banner");
    };

    const resetToDefaults = () => {
        setForm({
            headline: "Purity in every grain, tradition in every choice",
            hashtag: "#consciousnavratri",
            offerText: "Upto 20% OFF",
            subText: "FLAT 10% off + 10% Cashback",
            productImgUrl: "",
            bgImageUrl: "",
            endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            isActive: true,
        });
    };

    if (loading) return <Card>Loading…</Card>;

    return (
        <Grid>
            <Card>
                <H3>Promo Banner – Admin</H3>
                <Row>
                    <Label>Headline</Label>
                    <Input name="headline" value={form.headline} onChange={onChange} placeholder="Purity in every grain…" />
                </Row>
                <Row>
                    <Label>Hashtag</Label>
                    <Input name="hashtag" value={form.hashtag} onChange={onChange} placeholder="#consciousnavratri" />
                </Row>
                <Row>
                    <Label>Offer Text</Label>
                    <Input name="offerText" value={form.offerText} onChange={onChange} placeholder="Upto 20% OFF" />
                </Row>
                <Row>
                    <Label>Sub Text</Label>
                    <Textarea name="subText" value={form.subText} onChange={onChange} placeholder="FLAT 10% off + 10% Cashback" />
                </Row>
                <Row>
                    <Label>Product Image URL</Label>
                    <Input name="productImgUrl" value={form.productImgUrl} onChange={onChange} placeholder="https://.../pack.png" />
                </Row>
                <Row>
                    <Label>Background Image URL</Label>
                    <Input name="bgImageUrl" value={form.bgImageUrl} onChange={onChange} placeholder="https://.../bg.jpg" />
                </Row>
                <Row>
                    <Label>Ends At (Local Date-Time)</Label>
                    <Input
                        type="datetime-local"
                        name="endsAt"
                        value={new Date(Number(form.endsAt)).toISOString().slice(0, 16)}
                        onChange={(e) => {
                            const dt = new Date(e.target.value).getTime();
                            setForm((f) => ({ ...f, endsAt: dt }));
                        }}
                    />
                </Row>
                <Row>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" name="isActive" checked={!!form.isActive} onChange={onChange} /> Show banner (isActive)
                    </label>
                </Row>
                <Actions>
                    <Btn onClick={save}>Save</Btn>
                    <Ghost onClick={resetToDefaults}>Reset Defaults</Ghost>
                </Actions>
            </Card>

            <div>
                <H3 style={{ marginBottom: 8 }}>Live Preview</H3>
                <div style={{ border: "1px solid rgba(16,24,40,.12)", borderRadius: 14, overflow: "hidden" }}>
                    <PromoBannerCountdown
                        // Override doc with form for preview only
                        docPath={""}
                        endsAt={form.endsAt}
                        headline={form.headline}
                        hashtag={form.hashtag}
                        offerText={form.offerText}
                        subText={form.subText}
                        productImg={form.productImgUrl}
                        bgImage={form.bgImageUrl}
                    />
                </div>
            </div>
        </Grid>
    );
}
