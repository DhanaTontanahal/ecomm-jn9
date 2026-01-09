// src/pages/BecomeSupplierAdmin.jsx
import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";

const TOK = {
    maxW: "960px",
    bg: "#fff",
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    card: "#fff",
    pill: "rgba(16,24,40,.06)",
    green: "#5b7c3a",
    orange: "#d97706",
};

const Global = createGlobalStyle`
  body{
    font-family:Inter, ui-sans-serif, system-ui;
    color:${TOK.ink};
    background:${TOK.bg}
  }
`;

const Wrap = styled.div`
  max-width:${TOK.maxW};
  margin:16px auto;
  padding:0 14px;
  display:grid;
  gap:12px;
`;

const H1 = styled.h1`
  font-weight:900;
  font-size:24px;
  margin:0;
`;

const Card = styled.div`
  background:${TOK.card};
  border:1px solid ${TOK.line};
  border-radius:16px;
  padding:14px;
  display:grid;
  gap:10px;
`;

const Row = styled.div`
  display:grid;
  gap:4px;
`;

const Label = styled.div`
  font-size:12px;
  color:${TOK.sub};
  font-weight:800;
`;

const Strong = styled.div`
  font-weight:900;
`;

const Actions = styled.div`
  display:flex;
  gap:8px;
  flex-wrap:wrap;
`;

const Btn = styled.button`
  border:1px solid ${TOK.line};
  background:#fff;
  border-radius:10px;
  padding:8px 12px;
  font-weight:900;
  cursor:pointer;
`;

const Primary = styled(Btn)`
  background:${TOK.green};
  color:#fff;
  border:0;
`;

const Warn = styled(Btn)`
  background:${TOK.pill};
  color:${TOK.orange};
  border:1px solid ${TOK.line};
`;

/* --- Attachment UI --- */

const MediaWrap = styled.div`
  display:flex;
  flex-direction:column;
  gap:6px;
`;

const MediaBox = styled.div`
  border-radius:12px;
  border:1px solid ${TOK.line};
  padding:8px;
  background:#fafafa;
  max-width:100%;
`;

const MediaImage = styled.img`
  max-width:100%;
  height:auto;
  border-radius:10px;
  display:block;
`;

const MediaVideo = styled.video`
  max-width:100%;
  border-radius:10px;
  display:block;
`;

const MediaMeta = styled.div`
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  font-size:12px;
  color:${TOK.sub};
  align-items:center;
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

const MediaLink = styled.a`
  font-size:12px;
  font-weight:700;
  text-decoration:underline;
  cursor:pointer;
`;

export default function BecomeSupplierAdmin() {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        (async () => {
            const qy = query(
                collection(db, "supplierRequests"),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(qy);
            setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        })();
    }, []);

    const setStatus = async (id, status) => {
        await updateDoc(doc(db, "supplierRequests", id), { status });
        setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    };

    const formatSize = (bytes) => {
        if (!bytes) return "";
        const mb = bytes / 1024 / 1024;
        return `${mb.toFixed(2)} MB`;
    };

    const getTypeBadge = (type) => {
        if (!type) return "File";
        if (type.startsWith("image/")) return "Image";
        if (type.startsWith("video/")) return "Video";
        return "File";
    };

    return (
        <>
            <Global />
            <Wrap>
                <H1>Supplier Requests</H1>
                {rows.map((r) => (
                    <Card key={r.id}>
                        <Row>
                            <Label>Company</Label>
                            <Strong>{r.companyName}</Strong>
                        </Row>
                        <Row>
                            <Label>Contact</Label>
                            <Strong>
                                {r.contactName} • {r.phone}
                            </Strong>
                        </Row>
                        {r.email && (
                            <Row>
                                <Label>Email</Label>
                                <Strong>{r.email}</Strong>
                            </Row>
                        )}
                        {r.category && (
                            <Row>
                                <Label>Category</Label>
                                <Strong>{r.category}</Strong>
                            </Row>
                        )}
                        {r.website && (
                            <Row>
                                <Label>Website</Label>
                                <Strong>{r.website}</Strong>
                            </Row>
                        )}
                        {r.message && (
                            <Row>
                                <Label>Notes</Label>
                                <div>{r.message}</div>
                            </Row>
                        )}

                        {/* Attachment preview */}
                        {r.attachmentUrl && (
                            <Row>
                                <Label>Attachment</Label>
                                <MediaWrap>
                                    <MediaBox>
                                        {r.attachmentType?.startsWith("video/") ? (
                                            <MediaVideo
                                                src={r.attachmentUrl}
                                                controls
                                                preload="metadata"
                                            />
                                        ) : (
                                            <MediaImage
                                                src={r.attachmentUrl}
                                                alt={r.attachmentName || "Attachment"}
                                            />
                                        )}
                                    </MediaBox>
                                    <MediaMeta>
                                        <Badge>{getTypeBadge(r.attachmentType)}</Badge>
                                        {r.attachmentName && <span>{r.attachmentName}</span>}
                                        {r.attachmentSize && (
                                            <span>• {formatSize(r.attachmentSize)}</span>
                                        )}
                                        <MediaLink
                                            href={r.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Open in new tab
                                        </MediaLink>
                                    </MediaMeta>
                                </MediaWrap>
                            </Row>
                        )}

                        <Row>
                            <Label>Status</Label>
                            <Strong>{r.status || "NEW"}</Strong>
                        </Row>

                        <Actions>
                            <Primary onClick={() => setStatus(r.id, "APPROVED")}>
                                Approve
                            </Primary>
                            <Warn onClick={() => setStatus(r.id, "REVIEW")}>
                                Mark Review
                            </Warn>
                            <Btn onClick={() => setStatus(r.id, "REJECTED")}>Reject</Btn>
                        </Actions>
                    </Card>
                ))}
            </Wrap>
        </>
    );
}
