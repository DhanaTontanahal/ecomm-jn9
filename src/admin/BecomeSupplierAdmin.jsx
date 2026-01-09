// src/pages/BecomeSupplierAdmin.jsx
import React, { useEffect, useState, useMemo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { db } from "../firebase/firebase";
import {
    collection,
    getDocs,
    orderBy,
    query,
    updateDoc,
    doc,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import {
    FiX,
    FiSearch,
    FiEye,
    FiCheckCircle,
    FiAlertCircle,
    FiXCircle,
    FiPhone,
    FiMessageCircle,
} from "react-icons/fi";


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

const HeaderRow = styled.div`
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  flex-wrap:wrap;
`;

const H1 = styled.h1`
  font-weight:900;
  font-size:24px;
  margin:0;
`;

const RightHeader = styled.div`
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
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
  font-size:13px;
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

function formatSize(bytes) {
    if (!bytes) return "";
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
}
function getTypeBadge(type) {
    if (!type) return "File";
    if (type.startsWith("image/")) return "Image";
    if (type.startsWith("video/")) return "Video";
    return "File";
}

/* --- View tabs --- */
const ViewTabs = styled.div`
  display:flex;
  gap:6px;
  padding:4px;
  border-radius:999px;
  background:${TOK.pill};
`;

const ViewTab = styled.button`
  border:0;
  border-radius:999px;
  padding:6px 10px;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
  background:${(p) => (p.$active ? "#fff" : "transparent")};
  color:${(p) => (p.$active ? TOK.ink : TOK.sub)};
`;

/* --- Table view --- */
const TableCard = styled.div`
  background:${TOK.card};
  border:1px solid ${TOK.line};
  border-radius:16px;
  overflow:hidden;
`;

const TableScroll = styled.div`
  max-height:65vh;
  overflow-y:auto;
`;

const Table = styled.table`
  width:100%;
  border-collapse:collapse;
  font-size:13px;

  th, td {
    padding:8px 10px;
    border-bottom:1px solid ${TOK.line};
    vertical-align:top;
  }
  th {
    text-align:left;
    font-weight:800;
    font-size:12px;
    color:${TOK.sub};
    background:#f9fafb;
    position:sticky;
    top:0;
    z-index:1;
  }
`;

/* --- Modal for view in table --- */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-start;          /* start from top, not exact center */
  justify-content: center;
  padding: 150px 12px;              /* space from top/bottom */
  z-index: 120;
  overflow-y: auto;                /* if card taller, whole overlay scrolls */
`;

const ModalCard = styled.div`
  width: min(640px, 96vw);
  max-height: calc(100vh - 48px);  /* always fully inside viewport */
  background: ${TOK.card};
  border-radius: 16px;
  border: 1px solid ${TOK.line};
  padding: 16px;
  display: grid;
  gap: 10px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.25);

  @media (max-width: 600px) {
    padding: 12px;
    border-radius: 14px;
  }
`;


const ModalHead = styled.div`
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
`;

/* --- Search bar --- */
const SearchWrap = styled.div`
  position:relative;
`;

const SearchInput = styled.input`
  width:240px;
  padding:6px 10px 6px 28px;
  border-radius:999px;
  border:1px solid ${TOK.line};
  background:#f9fafb;
  font-size:13px;
  outline:none;
  color:${TOK.ink};

  &:focus {
    border-color:${TOK.green};
    box-shadow:0 0 0 1px ${TOK.green}22;
  }
`;

const SearchIcon = styled(FiSearch)`
  position:absolute;
  left:8px;
  top:6px;
  color:${TOK.sub};
`;

/* --- Icon actions in table --- */
const IconRow = styled.div`
  display:flex;
  gap:6px;
  align-items:center;
`;


const ContactActions = styled.div`
  display:flex;
  gap:6px;
  margin-top:4px;
`;

const IconCircleLink = styled.a`
  width:28px;
  height:28px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid ${TOK.line};
  background:#fff;
  cursor:pointer;
  padding:0;
  color:${TOK.ink};
  text-decoration:none;

  &:hover {
    border-color:${TOK.green};
    box-shadow:0 0 0 1px ${TOK.green}22;
  }
`;



const IconBtn = styled.button`
  width:32px;
  height:32px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid ${TOK.line};
  background:#fff;
  cursor:pointer;
  padding:0;
`;


function getCleanPhone(phone) {
    if (!phone) return "";
    return String(phone).replace(/\D/g, ""); // keep only digits
}

// tel: link uses whatever digits we have
function getTelHref(phone) {
    const digits = getCleanPhone(phone);
    return digits ? `tel:${digits}` : "#";
}

// WhatsApp link – if it's a 10-digit number, prefix India code 91
function getWhatsAppHref(phone) {
    const digits = getCleanPhone(phone);
    if (!digits) return "#";

    let wa = digits;
    if (digits.length === 10) {
        wa = `91${digits}`;
    }
    return `https://wa.me/${wa}`;
}


// Map supplierRequest → vendor payload
function buildVendorPayloadFromRequest(r) {
    const contact = (r.contactName || "").trim();
    const [firstName, ...rest] = contact.split(" ");
    const lastName = rest.join(" ").trim();

    const displayName =
        r.companyName || r.contactName || r.phone || r.email || "New Vendor";

    return {
        // Primary block
        salutation: "",
        firstName: firstName || "",
        lastName: lastName || "",
        companyName: r.companyName || "",
        displayName,
        email: r.email || "",
        phoneWork: "",
        phoneMobile: r.phone || "",
        website: r.website || "",

        // Default / empty structures
        address: {
            billing: { line1: "", line2: "", city: "", state: "", zip: "" },
            shipping: { line1: "", line2: "", city: "", state: "", zip: "" },
        },
        contacts: [],
        custom: {
            fromSupplierRequestId: r.id,
        },
        tags: (r.category && [r.category]) || [],
        remarks: r.message || "",

        // “Other” section defaults
        gstTreatment: "",
        sourceOfSupply: "",
        currency: "INR",
        openingBalance: 0,
        paymentTerms: "Due on Receipt",
        tds: null,
        enablePortal: false,
        portalLanguage: "English",
        gstin: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true,
    };
}

export default function BecomeSupplierAdmin() {
    const [rows, setRows] = useState([]);
    const [viewMode, setViewMode] = useState("table"); // default to table now
    const [viewRow, setViewRow] = useState(null);
    const [search, setSearch] = useState("");

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

    const filteredRows = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return rows;
        return rows.filter((r) =>
            [
                r.companyName,
                r.contactName,
                r.phone,
                r.email,
                r.category,
                r.status,
                r.vendorId,
            ]
                .map((x) => String(x || "").toLowerCase())
                .some((val) => val.includes(t))
        );
    }, [rows, search]);

    // row: supplierRequest document
    const setStatus = async (row, status) => {
        const ref = doc(db, "supplierRequests", row.id);

        let vendorId = row.vendorId || null;

        // When approving, create vendor doc if not already created
        if (status === "APPROVED" && !vendorId) {
            const vendorPayload = buildVendorPayloadFromRequest(row);
            const vendRef = await addDoc(collection(db, "vendors"), vendorPayload);
            vendorId = vendRef.id;
            console.log("Vendor created from supplier request:", vendorId);
        }

        await updateDoc(ref, {
            status,
            ...(vendorId ? { vendorId } : {}),
        });

        setRows((prev) =>
            prev.map((x) =>
                x.id === row.id ? { ...x, status, vendorId } : x
            )
        );

        if (viewRow && viewRow.id === row.id) {
            setViewRow((vr) => (vr ? { ...vr, status, vendorId } : vr));
        }
    };

    const renderCardBody = (r) => (
        <>
            <Row>
                <Label>Company</Label>
                <Strong>{r.companyName}</Strong>
            </Row>
            <Row>
                <Label>Contact</Label>
                <Strong>
                    {r.contactName} • {r.phone}
                </Strong>

                {r.phone && (
                    <ContactActions>
                        <IconCircleLink
                            href={getTelHref(r.phone)}
                            title="Call"
                        >
                            <FiPhone size={14} />
                        </IconCircleLink>
                        <IconCircleLink
                            href={getWhatsAppHref(r.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp"
                        >
                            <FiMessageCircle size={14} />
                        </IconCircleLink>
                    </ContactActions>
                )}
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

            {r.vendorId && (
                <Row>
                    <Label>Linked Vendor</Label>
                    <div style={{ fontSize: 12, color: TOK.sub }}>
                        Vendor ID: {r.vendorId} (visible in Vendors list)
                    </div>
                </Row>
            )}
        </>
    );

    return (
        <>
            <Global />
            <Wrap>
                <HeaderRow>
                    <H1>Supplier Requests</H1>
                    <RightHeader>
                        <SearchWrap>
                            <SearchInput
                                placeholder="Search supplier requests..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <SearchIcon size={14} />
                        </SearchWrap>
                        <ViewTabs>
                            <ViewTab
                                $active={viewMode === "cards"}
                                onClick={() => setViewMode("cards")}
                            >
                                Card View
                            </ViewTab>
                            <ViewTab
                                $active={viewMode === "table"}
                                onClick={() => setViewMode("table")}
                            >
                                Table View
                            </ViewTab>
                        </ViewTabs>
                    </RightHeader>
                </HeaderRow>

                {/* CARD VIEW */}
                {viewMode === "cards" &&
                    filteredRows.map((r) => (
                        <Card key={r.id}>
                            {renderCardBody(r)}

                            <Actions>
                                <Primary onClick={() => setStatus(r, "APPROVED")}>
                                    {r.vendorId ? "Approved (Vendor Created)" : "Approve"}
                                </Primary>
                                <Warn onClick={() => setStatus(r, "REVIEW")}>
                                    Mark Review
                                </Warn>
                                <Btn onClick={() => setStatus(r, "REJECTED")}>Reject</Btn>
                            </Actions>
                        </Card>
                    ))}

                {/* TABLE VIEW */}
                {viewMode === "table" && (
                    <TableCard>
                        <TableScroll>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Contact</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Vendor</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.companyName || "-"}</td>
                                            <td>
                                                <div>{r.contactName || "-"}</div>
                                                <div style={{ fontSize: 12, color: TOK.sub }}>
                                                    {r.phone}
                                                </div>
                                                {r.email && (
                                                    <div style={{ fontSize: 12, color: TOK.sub }}>
                                                        {r.email}
                                                    </div>
                                                )}

                                                {r.phone && (
                                                    <ContactActions>
                                                        <IconCircleLink
                                                            href={getTelHref(r.phone)}
                                                            title="Call"
                                                        >
                                                            <FiPhone size={14} />
                                                        </IconCircleLink>
                                                        <IconCircleLink
                                                            href={getWhatsAppHref(r.phone)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="WhatsApp"
                                                        >
                                                            <FiMessageCircle size={14} />
                                                        </IconCircleLink>
                                                    </ContactActions>
                                                )}
                                            </td>
                                            <td>{r.category || "-"}</td>
                                            <td>{r.status || "NEW"}</td>
                                            <td style={{ fontSize: 12 }}>
                                                {r.vendorId ? (
                                                    <span>Linked: {r.vendorId}</span>
                                                ) : (
                                                    <span style={{ color: TOK.sub }}>Not linked</span>
                                                )}
                                            </td>
                                            <td>
                                                <IconRow>
                                                    <IconBtn
                                                        title="View details"
                                                        onClick={() => setViewRow(r)}
                                                    >
                                                        <FiEye size={16} />
                                                    </IconBtn>
                                                    <IconBtn
                                                        title={
                                                            r.vendorId
                                                                ? "Already approved vendor"
                                                                : "Approve & create vendor"
                                                        }
                                                        onClick={() => setStatus(r, "APPROVED")}
                                                        style={{
                                                            background: TOK.green,
                                                            color: "#fff",
                                                            borderColor: TOK.green,
                                                        }}
                                                    >
                                                        <FiCheckCircle size={16} />
                                                    </IconBtn>
                                                    <IconBtn
                                                        title="Mark for review"
                                                        onClick={() => setStatus(r, "REVIEW")}
                                                        style={{
                                                            background: TOK.pill,
                                                            color: TOK.orange,
                                                            borderColor: TOK.pill,
                                                        }}
                                                    >
                                                        <FiAlertCircle size={16} />
                                                    </IconBtn>
                                                    <IconBtn
                                                        title="Reject"
                                                        onClick={() => setStatus(r, "REJECTED")}
                                                        style={{
                                                            background: "#fee2e2",
                                                            color: "#b91c1c",
                                                            borderColor: "#fecaca",
                                                        }}
                                                    >
                                                        <FiXCircle size={16} />
                                                    </IconBtn>
                                                </IconRow>
                                            </td>
                                        </tr>
                                    ))}
                                    {!filteredRows.length && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{
                                                    padding: 16,
                                                    textAlign: "center",
                                                    color: TOK.sub,
                                                }}
                                            >
                                                No supplier requests found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </TableScroll>
                    </TableCard>
                )}
            </Wrap>

            {/* VIEW MODAL */}
            {viewRow && (
                <ModalOverlay>
                    <ModalCard>
                        <ModalHead>
                            <div>
                                <h3 style={{ margin: 0 }}>Supplier Request Details</h3>
                                <div style={{ fontSize: 12, color: TOK.sub }}>
                                    {viewRow.companyName || viewRow.contactName}
                                </div>
                            </div>
                            <button
                                onClick={() => setViewRow(null)}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    padding: 4,
                                    borderRadius: 999,
                                }}
                                aria-label="Close"
                            >
                                <FiX size={20} />
                            </button>
                        </ModalHead>

                        <div style={{ display: "grid", gap: 10 }}>
                            {renderCardBody(viewRow)}

                            <Actions>
                                <Primary onClick={() => setStatus(viewRow, "APPROVED")}>
                                    {viewRow.vendorId ? "Approved (Vendor Created)" : "Approve"}
                                </Primary>
                                <Warn onClick={() => setStatus(viewRow, "REVIEW")}>
                                    Mark Review
                                </Warn>
                                <Btn onClick={() => setStatus(viewRow, "REJECTED")}>
                                    Reject
                                </Btn>
                            </Actions>
                        </div>
                    </ModalCard>
                </ModalOverlay>
            )}
        </>
    );
}
