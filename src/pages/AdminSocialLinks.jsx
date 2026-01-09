// src/pages/AdminSocialLinks.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../auth/AuthProvider";

const Page = styled.div`
  min-height: 100vh;
  padding: 24px 16px;
  background: #f3f4f6;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  width: 100%;
  max-width: 720px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 14px 45px rgba(15, 23, 42, 0.12);
  padding: 24px 20px 28px;
  border: 1px solid rgba(15, 23, 42, 0.06);
`;

const Title = styled.h1`
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 0 0 18px;
  font-size: 14px;
  color: #6b7280;
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Input = styled.input`
  height: 44px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;

  &:focus {
    border-color: #7a974b;
    box-shadow: 0 0 0 1px rgba(122, 151, 75, 0.35);
  }
`;

const Helper = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const ActionsRow = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const PrimaryBtn = styled.button`
  border: 0;
  background: #7a974b;
  color: #ffffff;
  font-weight: 800;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s ease, transform 0.06s ease;

  &:hover {
    background: #5b7c3a;
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
    transform: none;
  }
`;

const GhostBtn = styled.button`
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
  cursor: pointer;
`;

const StatusText = styled.div`
  font-size: 13px;
  color: ${({ $error }) => ($error ? "#b91c1c" : "#047857")};
`;

const Meta = styled.div`
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
`;

const SOCIAL_DOC_REF = doc(db, "site", "social");

export default function AdminSocialLinks() {
    const { user } = useAuth() || {};
    const [instagramUrl, setInstagramUrl] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [meta, setMeta] = useState({ updatedAt: null, updatedBy: "" });

    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                const snap = await getDoc(SOCIAL_DOC_REF);
                if (snap.exists() && isMounted) {
                    const data = snap.data() || {};
                    setInstagramUrl(data.instagramUrl || "");
                    setYoutubeUrl(data.youtubeUrl || "");
                    setMeta({
                        updatedAt: data.updatedAt?.toDate
                            ? data.updatedAt.toDate()
                            : null,
                        updatedBy: data.updatedBy || "",
                    });
                }
            } catch (e) {
                console.error("Error loading social links", e);
                if (isMounted) {
                    setError("Could not load current links. You can still save new ones.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    const validateUrl = (url) => {
        if (!url) return true; // allow empty
        try {
            const u = new URL(url);
            return ["http:", "https:"].includes(u.protocol);
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("");
        setError("");

        if (!validateUrl(instagramUrl) || !validateUrl(youtubeUrl)) {
            setError("Please enter valid URLs (must start with http:// or https://).");
            return;
        }

        try {
            setSaving(true);
            await setDoc(
                SOCIAL_DOC_REF,
                {
                    instagramUrl: instagramUrl.trim(),
                    youtubeUrl: youtubeUrl.trim(),
                    updatedAt: serverTimestamp(),
                    updatedBy: user?.email || user?.uid || "admin",
                },
                { merge: true }
            );
            setStatus("Links saved successfully.");
        } catch (err) {
            console.error("Error saving social links", err);
            setError("Failed to save links. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setInstagramUrl("");
        setYoutubeUrl("");
        setStatus("");
        setError("");
    };

    return (
        <Page>
            <Card>
                <Title>Social Links – Instagram & YouTube</Title>
                <Subtitle>
                    These links will be used in the site footer and header navigation.
                    Update them whenever your social profiles change.
                </Subtitle>

                {loading ? (
                    <p style={{ fontSize: 14 }}>Loading current links…</p>
                ) : (
                    <>
                        <Form onSubmit={handleSubmit}>
                            <Label>
                                Instagram URL
                                <Input
                                    type="url"
                                    placeholder="https://www.instagram.com/yourprofile"
                                    value={instagramUrl}
                                    onChange={(e) => setInstagramUrl(e.target.value)}
                                />
                                <Helper>Full Instagram profile link.</Helper>
                            </Label>

                            <Label>
                                YouTube URL
                                <Input
                                    type="url"
                                    placeholder="https://www.youtube.com/@yourchannel"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                />
                                <Helper>Channel or custom handle URL.</Helper>
                            </Label>

                            <ActionsRow>
                                <PrimaryBtn type="submit" disabled={saving}>
                                    {saving ? "Saving…" : "Save Links"}
                                </PrimaryBtn>
                                <GhostBtn type="button" onClick={handleReset}>
                                    Reset form
                                </GhostBtn>

                                {status && <StatusText>{status}</StatusText>}
                                {error && <StatusText $error>{error}</StatusText>}
                            </ActionsRow>
                        </Form>

                        {meta.updatedAt && (
                            <Meta>
                                Last updated on{" "}
                                {meta.updatedAt.toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
                                {meta.updatedBy && ` by ${meta.updatedBy}`}
                            </Meta>
                        )}
                    </>
                )}
            </Card>
        </Page>
    );
}
