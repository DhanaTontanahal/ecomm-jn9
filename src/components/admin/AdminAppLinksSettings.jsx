// src/components/admin/AdminAppLinksSettings.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const Wrap = styled.div`
  max-width: 720px;
  margin: 18px auto;
  padding: 0 12px 24px;
  display: grid;
  gap: 12px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid rgba(16, 24, 40, 0.1);
  border-radius: 12px;
  padding: 14px;
`;

const Row = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 140px 1fr;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  height: 42px;
  border: 1px solid rgba(16, 24, 40, 0.12);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
`;

const Save = styled.button`
  justify-self: start;
  margin-top: 14px;
  background: #111827;
  color: #fff;
  border: 0;
  border-radius: 12px;
  padding: 10px 16px;
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
    box-shadow: none;
    transform: none;
  }
`;

const H = styled.h2`
  margin: 6px 0 2px;
`;

const SmallNote = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
  line-height: 1.5;
`;

export default function AdminAppLinksSettings() {
  const [androidUrl, setAndroidUrl] = useState("");
  const [iosUrl, setIosUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // Using a single site-level doc to store app links
      const ref = doc(db, "site", "apps");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data() || {};
        if (d.androidUrl) setAndroidUrl(d.androidUrl);
        if (d.iosUrl) setIosUrl(d.iosUrl);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "site", "apps");
      await setDoc(
        ref,
        {
          androidUrl: androidUrl.trim(),
          iosUrl: iosUrl.trim(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      alert("App links saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap>
      <H>Mobile App Links</H>
      <Card>
        <Row>
          <label>Android App Link</label>
          <Input
            value={androidUrl}
            onChange={(e) => setAndroidUrl(e.target.value)}
            placeholder="https://play.google.com/store/apps/details?id=..."
          />
        </Row>

        <Row style={{ marginTop: 10 }}>
          <label>iOS App Link</label>
          <Input
            value={iosUrl}
            onChange={(e) => setIosUrl(e.target.value)}
            placeholder="https://apps.apple.com/app/idXXXXXXXXX"
          />
        </Row>

        <Save onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save App Links"}
        </Save>

        <SmallNote>
          These links will be shown on the <strong>My Account</strong> page under
          “Android App” and “iOS App”. Leave a field empty if that app is not
          live yet – the customer will see a “Coming soon” message.
        </SmallNote>
      </Card>
    </Wrap>
  );
}
