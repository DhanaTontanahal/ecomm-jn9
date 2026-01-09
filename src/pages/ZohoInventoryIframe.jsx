import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
    FiPlusCircle,
    FiSend,
    FiBox,
    FiShoppingCart,
    FiFileText,
    FiExternalLink,
    FiArrowLeft,
    FiInfo,
} from "react-icons/fi";

const Wrap = styled.div`
  height: calc(100vh - 64px);
  background: #0b1220;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Title = styled.div`
  color: #fff;
  font-weight: 900;
  letter-spacing: 0.2px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

// const TitlePill = styled.span`
//   font-size: 12px;
//   font-weight: 800;
//   color: rgba(255,255,255,.78);
//   border: 1px solid rgba(255,255,255,.14);
//   background: rgba(255,255,255,.06);
//   padding: 4px 8px;
//   border-radius: 999px;
// `;


const TitlePill = styled.span`
  font-size: 12px;
  font-weight: 900;
  color: rgba(255,255,255,.86);
  border: 1px solid rgba(34,197,94,.35);
  background: linear-gradient(180deg, rgba(34,197,94,.18), rgba(255,255,255,.05));
  padding: 4px 8px;
  border-radius: 999px;
`;


const BtnRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const Btn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(255,255,255,.06);
  color: #fff;
  text-decoration: none;
  font-weight: 800;
  font-size: 13px;
  &:hover { background: rgba(255,255,255,.10); }
`;

const BtnGhost = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(255,255,255,.03);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,.08); }
`;

const NoteWrap = styled.div`
  padding: 14px 16px;
  display: grid;
  gap: 10px;
`;

const NoteCard = styled.div`
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.05);
  border-radius: 14px;
  padding: 12px 14px;
  color: rgba(255,255,255,.85);
  font-size: 13px;
  line-height: 1.5;
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const Steps = styled.div`
  display: grid;
  gap: 6px;
`;

const Step = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  .n {
    width: 20px;
    height: 20px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 900;
    background: rgba(255,255,255,.10);
    border: 1px solid rgba(255,255,255,.14);
    flex: 0 0 auto;
    margin-top: 1px;
  }
  .t { color: rgba(255,255,255,.88); }
  .s { color: rgba(255,255,255,.70); }
`;

const CardGrid = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
`;

const Card = styled.div`
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.06);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform .12s ease, background .12s ease;
  &:hover{
    transform: translateY(-2px);
    background: rgba(255,255,255,.075);
  }
`;

const CardHead = styled.div`
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
`;

const CardTitle = styled.div`
  color: #fff;
  font-weight: 900;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

// const IconBadge = styled.div`
//   width: 34px;
//   height: 34px;
//   border-radius: 12px;
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   background: rgba(255,255,255,.08);
//   border: 1px solid rgba(255,255,255,.14);
//   svg { font-size: 18px; }
// `;

const IconBadge = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: ${({ $accent }) => $accent ? "rgba(34,197,94,.16)" : "rgba(255,255,255,.08)"};
  border: 1px solid ${({ $accent }) => $accent ? "rgba(34,197,94,.35)" : "rgba(255,255,255,.14)"};

  svg { font-size: 18px; }
`;


const CardDesc = styled.div`
  font-size: 13px;
  color: rgba(255,255,255,.75);
  line-height: 1.45;
`;

const Hint = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,.65);
  border-top: 1px dashed rgba(255,255,255,.16);
  padding-top: 10px;
  margin-top: 4px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const IframeWrap = styled.div`
  flex: 1;
  min-height: 0;
`;

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
`;

const FallbackCard = styled.div`
  margin: 16px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.9);
`;

export default function ZohoInventoryIframe() {
    const navigate = useNavigate();

    const ZOHO_NEW_ITEM_URL =
        "https://inventory.zoho.in/app/60042800489#/inventory/items/new";

    const ZOHO_ACCENT = "#22c55e"; // professional green accent



    const ZOHO_LINKS = useMemo(
        () => ({
            // ✅ ORDER: Add Item -> Publish -> Others
            newItem: {
                title: "Add New Zoho Item",
                url: ZOHO_NEW_ITEM_URL,
                desc: "Create a new item in Zoho (name, SKU, price, stock rules).",
                cardLabel: "Add Item",
                icon: FiPlusCircle,
                kind: "external",
                how: "Step 1: Add the product in Zoho first.",
            },
            publish: {
                title: "Publish to Sale (Admin)",
                url: "/admin/zoho-items",
                desc: "Import Zoho items here and publish them into your Firestore products for selling.",
                cardLabel: "Publish to Sale",
                icon: FiSend,
                kind: "internal",
                how: "Step 2: Open Zoho Items in admin and click “Publish to Sale”.",
            },
            items: {
                title: "Zoho Inventory – Items",
                url:
                    "https://inventory.zoho.in/app/60042800489#/inventory/items?filter_by=Status.Active&per_page=25&sort_column=created_time&sort_order=D",
                desc: "View and manage all active inventory items in Zoho Inventory.",
                cardLabel: "Zoho Items",
                icon: FiBox,
                kind: "external",
                how: "Reference: See all items in Zoho.",
            },
            salesOrders: {
                title: "Zoho Inventory – Sales Orders",
                url:
                    "https://inventory.zoho.in/app/60042800489#/salesorders?filter_by=Status.All&per_page=25&sort_column=created_time&sort_order=D",
                desc: "Track order status, fulfillment and customer details.",
                cardLabel: "Sales Orders",
                icon: FiShoppingCart,
                kind: "external",
                how: "Step 3: Check orders synced/created in Zoho.",
            },
            invoices: {
                title: "Zoho Inventory – Invoices",
                url:
                    "https://inventory.zoho.in/app/60042800489#/invoices?filter_by=Status.All&per_page=25&sort_column=created_time&sort_order=D",
                desc: "View invoices, payment status and export documents.",
                cardLabel: "Invoices",
                icon: FiFileText,
                kind: "external",
                how: "Step 4: View invoices in Zoho.",
            },
        }),
        []
    );

    const [selectedKey, setSelectedKey] = useState(null);
    const [showIframe, setShowIframe] = useState(false);

    const active = selectedKey ? ZOHO_LINKS[selectedKey] : null;

    useEffect(() => {
        setShowIframe(false);
    }, [selectedKey]);

    const openAction = (entry) => {
        if (!entry) return;
        if (entry.kind === "internal") {
            navigate(entry.url);
            return;
        }
        window.open(entry.url, "_blank", "noopener,noreferrer");
    };

    return (
        <Wrap>
            <TopBar>
                <Title>
                    {active ? active.title : "Zoho Inventory"}
                    <TitlePill>Quick actions</TitlePill>
                </Title>

                {active ? (
                    <BtnRow>
                        {active.kind === "external" ? (
                            <Btn href={active.url} target="_blank" rel="noreferrer">
                                <FiExternalLink /> Open in Zoho
                            </Btn>
                        ) : (
                            <BtnGhost onClick={() => navigate(active.url)}>
                                <FiExternalLink /> Open Page
                            </BtnGhost>
                        )}

                        {/* Embed only makes sense for external; internal routes are React pages */}
                        {active.kind === "external" && (
                            <BtnGhost onClick={() => setShowIframe((s) => !s)}>
                                {showIframe ? "Hide Embed" : "Try Embed"}
                            </BtnGhost>
                        )}

                        <BtnGhost onClick={() => setSelectedKey(null)}>
                            <FiArrowLeft /> Back
                        </BtnGhost>
                    </BtnRow>
                ) : null}
            </TopBar>

            {/* HOW IT WORKS (professional notes + ordered steps) */}
            {!selectedKey && (
                <NoteWrap>
                    <NoteCard>
                        <FiInfo style={{ marginTop: 2, opacity: 0.85 }} />
                        <div>
                            <div style={{ fontWeight: 900, marginBottom: 4 }}>How it works</div>
                            <Steps>
                                <Step>
                                    <span className="n">1</span>
                                    <div className="t">
                                        <b>Add Item</b> in Zoho Inventory
                                        <div className="s">Create SKU, rate, tax rules, stock tracking (Zoho).</div>
                                    </div>
                                </Step>
                                <Step>
                                    <span className="n">2</span>
                                    <div className="t">
                                        <b>Publish to Sale</b> in your Admin panel
                                        <div className="s">Go to “Zoho Items” page and publish items into Firestore products.</div>
                                    </div>
                                </Step>
                                <Step>
                                    <span className="n">3</span>
                                    <div className="t">
                                        Use Zoho pages for <b>Items / Sales Orders / Invoices</b>
                                        <div className="s">These open in a new tab (Zoho blocks iframe sometimes).</div>
                                    </div>
                                </Step>
                            </Steps>
                        </div>
                    </NoteCard>
                </NoteWrap>
            )}

            {/* CARDS (kept in the order defined above) */}
            {!selectedKey && (
                <CardGrid>
                    {Object.entries(ZOHO_LINKS).map(([key, v]) => {
                        const Icon = v.icon;
                        return (
                            <Card key={key}>
                                <CardHead>
                                    <CardTitle>

                                        <IconBadge $accent={key === "newItem" || key === "publish"}>
                                            <Icon />
                                        </IconBadge>

                                        {v.cardLabel}
                                    </CardTitle>
                                </CardHead>

                                <CardDesc>{v.desc}</CardDesc>

                                <Hint>{v.how}</Hint>

                                <CardActions>
                                    {/* Primary action */}
                                    {v.kind === "external" ? (
                                        <Btn href={v.url} target="_blank" rel="noreferrer">
                                            <FiExternalLink /> Open ↗
                                        </Btn>
                                    ) : (
                                        <BtnGhost onClick={() => navigate(v.url)}>
                                            <FiExternalLink /> Open
                                        </BtnGhost>
                                    )}

                                    {/* Secondary action */}
                                    {v.kind === "external" ? (
                                        <BtnGhost onClick={() => setSelectedKey(key)}>
                                            View Here
                                        </BtnGhost>
                                    ) : (
                                        <BtnGhost onClick={() => navigate(v.url)}>
                                            Go to Page
                                        </BtnGhost>
                                    )}
                                </CardActions>
                            </Card>
                        );
                    })}
                </CardGrid>
            )}

            {/* Selected view */}
            {selectedKey && active && active.kind === "external" && !showIframe && (
                <FallbackCard>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Embedding not supported</div>
                    <div style={{ opacity: 0.9 }}>
                        Zoho may refuse iframe embedding. Use <b>Open in Zoho</b> to open <b>{active.cardLabel}</b> in a new tab.
                    </div>
                </FallbackCard>
            )}

            {selectedKey && active && active.kind === "external" && showIframe && (
                <IframeWrap>
                    <Iframe
                        src={active.url}
                        title={active.title}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                </IframeWrap>
            )}

            {/* If someone selected an internal key by mistake, just navigate */}
            {selectedKey && active && active.kind === "internal" && (
                <FallbackCard>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Opening…</div>
                    <div style={{ opacity: 0.9 }}>
                        This is an internal admin page. Click below if it doesn’t open automatically.
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <BtnGhost onClick={() => navigate(active.url)}>
                            <FiExternalLink /> Open Page
                        </BtnGhost>
                    </div>
                </FallbackCard>
            )}
        </Wrap>
    );
}
