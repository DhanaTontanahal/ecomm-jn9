// src/pages/DeliveryAddressesPage.jsx
import React, { useMemo, useState } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import { FiChevronLeft, FiMapPin, FiX, FiEdit2, FiTrash2, FiCheck } from "react-icons/fi";
import { useAuth } from "../auth/AuthProvider";
import { useUserAddresses } from "../hooks/useUserAddresses";

/* ===== tokens (match Account page) ===== */
const TOK = {
    maxW: "960px",
    bg: "#fff",
    tint: "#fdece6",
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    card: "#ffffff",
    pill: "rgba(16,24,40,.06)",
    dark: "#111213",
    brand: "#000",
    success: "#10b981",
    danger: "#ef4444",
    blackBtn: "#0f0f10",
};
const rise = keyframes`from{opacity:0; transform:translateY(6px)}to{opacity:1; transform:none}`;
const GlobalFont = createGlobalStyle`
  body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
`;

/* ===== layout ===== */
const Page = styled.div`min-height:100dvh; background:${TOK.bg}; color:${TOK.ink};`;
const Header = styled.header`
  background:${TOK.tint}; border-bottom-left-radius:28px; border-bottom-right-radius:28px; padding:12px 16px 18px;
`;
const TopBar = styled.div`display:flex; align-items:center; justify-content:space-between; gap:8px;`;
const IconBtn = styled.button`
  border:0; background:transparent; padding:10px; border-radius:12px; display:grid; place-items:center; cursor:pointer; color:${TOK.ink};
  &:active{ opacity:.6 }
`;
const HeadBlock = styled.div`
  margin-top:14px; display:grid; gap:4px;
  h1{ font-size: clamp(22px, 4.8vw, 28px); margin:0; color:${TOK.ink}; letter-spacing:.3px; font-weight:900 }
  .sub{ color:${TOK.sub}; font-weight:600 }
`;

const Wrap = styled.div`
  max-width:${TOK.maxW}; margin: 0 auto; padding: 12px 14px 24px; display:grid; gap:14px;
`;

/* ===== cards & list ===== */
const Card = styled.div`
  background:${TOK.card}; border:1px solid ${TOK.line}; border-radius:18px; padding:14px; animation:${rise} .35s ease; display:grid; gap:10px;
`;
const Row = styled.div`display:flex; align-items: flex-start; justify-content: space-between; gap:12px;`;
const AddressText = styled.div`color:${TOK.ink}; font-weight:700; line-height:1.5;`;
const AddressName = styled.div`font-weight:900; letter-spacing:.2px;`;
const Muted = styled.div`font-size:12px; color:${TOK.sub}; font-weight:600;`;
const Badges = styled.div`display:flex; gap:6px; flex-wrap:wrap;`;
const Badge = styled.span`
  background:${TOK.pill}; color:${TOK.ink}; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:900;
`;
const Actions = styled.div`display:flex; gap:8px; flex-wrap:wrap; align-items:center;`;
const PillBtn = styled.button`
  border:1px solid ${TOK.line}; background:#fff; border-radius:12px; padding:8px 12px; font-weight:900; cursor:pointer;
`;
const DangerBtn = styled(PillBtn)`color:${TOK.danger};`;
const Primary = styled.button`
  border:0; background:${TOK.blackBtn}; color:#fff; border-radius:12px; padding:10px 12px; font-weight:900; cursor:pointer;
`;

/* ===== form modal ===== */
const SheetBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: ${({ $open }) => ($open ? "block" : "none")}; z-index: 90;
`;
const Sheet = styled.div`
  position: fixed; inset: auto 0 0 0; margin: 0 auto; max-width: ${TOK.maxW}; background: #fff;
  border-radius: 16px 16px 0 0; border: 1px solid ${TOK.line};
  transform: translateY(${({ $open }) => ($open ? "0" : "100%")});
  transition: transform .25s ease; z-index: 91;
  max-height: 92vh; overflow: auto;
  @media (min-width: 920px){ inset: 10% 0 auto 0; max-width: 720px; border-radius:16px; }
`;
const SheetHead = styled.div`
  position: sticky; top: 0; background: #fff; z-index: 1;
  display:flex; align-items:center; justify-content:space-between; padding: 12px 14px; border-bottom: 1px solid ${TOK.line};
`;
const SheetTitle = styled.h3`margin:0; font-weight:900; color:${TOK.ink};`;
const Form = styled.form`display:grid; gap:10px; padding: 12px 14px 16px;`;
const Two = styled.div`
  display:grid; gap:10px; grid-template-columns: 1fr 1fr;
  @media (max-width:560px){ grid-template-columns: 1fr; }
`;
const Input = styled.input`
  height:44px; border:1px solid ${TOK.line}; border-radius:12px; padding:0 12px; outline:0; font-size:14px;
`;

/* ===== page ===== */
export default function DeliveryAddressesPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const { user } = useAuth();
    const {
        addresses, defaultAddressId, loading,
        addAddress, updateAddress, removeAddress, setDefaultAddress,
    } = useUserAddresses();

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState(null); // address being edited

    const title = useMemo(() => "Delivery Addresses", []);

    return (
        <Page>
            <GlobalFont />

            <Header>
                <TopBar>
                    <IconBtn aria-label="Back" onClick={() => nav(-1)}><FiChevronLeft /></IconBtn>
                    <div />
                    <div />
                </TopBar>
                <HeadBlock>
                    <h1>{title}</h1>
                    <div className="sub">{user?.email || "Guest"}</div>
                </HeadBlock>
            </Header>

            <Wrap>
                <Card>
                    <Row>
                        <div style={{ display: "grid", gap: 6 }}>
                            <AddressName>Saved Delivery Addresses</AddressName>
                            <Muted>Set a default address for faster checkout.</Muted>
                        </div>
                        <Primary onClick={() => { setEditing(null); setSheetOpen(true); }}>
                            <FiMapPin style={{ verticalAlign: -2 }} /> Add New
                        </Primary>
                    </Row>
                </Card>

                {loading ? (
                    <Card>Loading…</Card>
                ) : addresses.length === 0 ? (
                    <Card>No addresses yet. Click <strong>Add New</strong> to create one.</Card>
                ) : (
                    addresses.map(a => (
                        <Card key={a.id}>
                            <Row>
                                <div style={{ display: "grid", gap: 6 }}>
                                    <Badges>
                                        <Badge>{a.tag || "Other"}</Badge>
                                        {defaultAddressId === a.id && <Badge>Default</Badge>}
                                    </Badges>
                                    <AddressText>
                                        <div style={{ marginBottom: 4 }}><strong>{a.name}</strong> {a.phone && <span>• {a.phone}</span>}</div>
                                        {(a.formattedAddress ||
                                            [a.line1, a.line2, a.landmark].filter(Boolean).join(", ")) || ""}
                                        {(a.city || a.pincode) ? <div>{a.city}{a.city && a.pincode ? " - " : ""}{a.pincode}</div> : null}
                                    </AddressText>
                                </div>

                                <Actions>
                                    {defaultAddressId !== a.id && (
                                        <PillBtn title="Set Default" onClick={() => setDefaultAddress(a.id)}>
                                            <FiCheck /> Set Default
                                        </PillBtn>
                                    )}
                                    <PillBtn title="Edit" onClick={() => { setEditing(a); setSheetOpen(true); }}>
                                        <FiEdit2 /> Edit
                                    </PillBtn>
                                    <DangerBtn title="Remove" onClick={() => removeAddress(a.id)}>
                                        <FiTrash2 /> Remove
                                    </DangerBtn>
                                </Actions>
                            </Row>
                        </Card>
                    ))
                )}
            </Wrap>

            {/* Add/Edit Sheet */}
            <SheetBackdrop $open={sheetOpen} onClick={() => setSheetOpen(false)} />
            <Sheet
                $open={sheetOpen}
                role="dialog" aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <SheetHead>
                    <SheetTitle>{editing ? "Edit Address" : "Add Delivery Address"}</SheetTitle>
                    <IconBtn aria-label="Close" onClick={() => setSheetOpen(false)}><FiX /></IconBtn>
                </SheetHead>

                <Form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;

                    const form = new FormData(e.currentTarget);
                    const payload = {
                        name: String(form.get("name") || "").trim(),
                        phone: String(form.get("phone") || "").trim(),
                        line1: String(form.get("line1") || "").trim(),
                        line2: String(form.get("line2") || "").trim(),
                        landmark: String(form.get("landmark") || "").trim(),
                        city: String(form.get("city") || "").trim(),
                        pincode: String(form.get("pincode") || "").trim(),
                        tag: (form.get("tag") || "Home").toString().trim(),
                    };

                    // rudimentary validation
                    if (!payload.name || !payload.phone || !payload.line1 || !payload.city || !payload.pincode) return;

                    if (editing) {
                        await updateAddress(editing.id, payload);
                    } else {
                        await addAddress(payload);
                    }
                    setSheetOpen(false);
                    setEditing(null);
                    e.currentTarget.reset();
                }}>
                    <Two>
                        <Input name="name" placeholder="Full name" defaultValue={editing?.name || ""} />
                        <Input name="phone" placeholder="Phone number" defaultValue={editing?.phone || ""} />
                    </Two>
                    <Input name="line1" placeholder="House / Flat / Street (Line 1)" defaultValue={editing?.line1 || ""} />
                    <Input name="line2" placeholder="Area / Locality (Line 2) — optional" defaultValue={editing?.line2 || ""} />
                    <Input name="landmark" placeholder="Landmark — optional" defaultValue={editing?.landmark || ""} />
                    <Two>
                        <Input name="city" placeholder="City" defaultValue={editing?.city || ""} />
                        <Input name="pincode" placeholder="Pincode" inputMode="numeric" defaultValue={editing?.pincode || ""} />
                    </Two>
                    <Input name="tag" placeholder="Tag (Home / Work / Other)" defaultValue={editing?.tag || "Home"} />
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <Primary type="submit">{editing ? "Save Changes" : "Save Address"}</Primary>
                        <PillBtn type="button" onClick={() => { setSheetOpen(false); setEditing(null); }}>Cancel</PillBtn>
                    </div>
                </Form>
            </Sheet>
        </Page>
    );
}
