import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

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
  font-weight: 800;
  letter-spacing: 0.2px;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
  font-weight: 700;
  font-size: 13px;
  &:hover { background: rgba(255,255,255,.10); }
`;

const Note = styled.div`
  padding: 14px 16px;
  color: rgba(255,255,255,.78);
  font-size: 13px;
  line-height: 1.5;
`;

/* --- Cards --- */
const CardGrid = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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
`;

const CardTitle = styled.div`
  color: #fff;
  font-weight: 800;
  font-size: 15px;
`;

const CardDesc = styled.div`
  font-size: 13px;
  color: rgba(255,255,255,.75);
  line-height: 1.4;
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
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
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,.08); }
`;

/* --- Iframe / fallback --- */
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

    const ZOHO_NEW_ITEM_URL =
        "https://inventory.zoho.in/app/60042800489#/inventory/items/new";


    const ZOHO_LINKS = useMemo(
        () => ({
            items: {
                title: "Zoho Inventory – Items",
                url:
                    "https://inventory.zoho.in/app/60042800489#/inventory/items?filter_by=Status.Active&per_page=25&sort_column=created_time&sort_order=D",
                desc: "View and manage all active inventory items in Zoho Inventory.",
                cardLabel: "Items",
            },
            salesOrders: {
                title: "Zoho Inventory – Sales Orders",
                url:
                    "https://inventory.zoho.in/app/60042800489#/salesorders?filter_by=Status.All&per_page=25&sort_column=created_time&sort_order=D",
                desc: "View, track, and manage all sales orders in Zoho Inventory.",
                cardLabel: "Sales Orders",
            },
            invoices: {
                title: "Zoho Inventory – Invoices",
                url:
                    "https://inventory.zoho.in/app/60042800489#/invoices?filter_by=Status.All&per_page=25&sort_column=created_time&sort_order=D",
                desc: "View, track, and manage all invoices in Zoho Inventory.",
                cardLabel: "Invoices",
            },
            newItem: {
                title: "Zoho Inventory – New Item",
                url: "https://inventory.zoho.in/app/60042800489#/inventory/items/new",
                desc: "Create a brand new item in Zoho Inventory.",
                cardLabel: "Add New Item",
            },
            viewItems: {
                title: "View added Items",
                url: "/admin/zoho-items",
                desc: "View zoho items added by admin and publish for sale",
                cardLabel: "View Item and publish for sale",
            },

        }),
        []
    );

    // null => show cards screen
    const [selectedKey, setSelectedKey] = useState(null); // "items" | "salesOrders" | "invoices" | null
    const [showIframe, setShowIframe] = useState(false);


    const active = selectedKey ? ZOHO_LINKS[selectedKey] : null;

    useEffect(() => {
        // reset iframe toggle when switching pages
        setShowIframe(false);
    }, [selectedKey]);

    return (
        <Wrap>
            <TopBar>
                <Title>{active ? active.title : "Zoho Inventory"}</Title>

                {/* Buttons only when a card is selected */}
                {/* {active ? (
                    <BtnRow>
                        <Btn href={active.url} target="_blank" rel="noreferrer">
                            Open in Zoho ↗
                        </Btn>

                        <BtnGhost onClick={() => setShowIframe((s) => !s)}>
                            {showIframe ? "Hide Embed" : "Try Embed"}
                        </BtnGhost>

                        <BtnGhost onClick={() => setSelectedKey(null)}>
                            Back
                        </BtnGhost>
                    </BtnRow>
                ) : null} */}

                {active ? (
                    <BtnRow>
                        {/* ✅ show only for Items */}
                        {selectedKey === "items" && (
                            <Btn href={ZOHO_NEW_ITEM_URL} target="_blank" rel="noreferrer">
                                + Add New Zoho Item ↗
                            </Btn>
                        )}

                        <Btn href={active.url} target="_blank" rel="noreferrer">
                            Open in Zoho ↗
                        </Btn>

                        <BtnGhost onClick={() => setShowIframe((s) => !s)}>
                            {showIframe ? "Hide Embed" : "Try Embed"}
                        </BtnGhost>

                        <BtnGhost onClick={() => setSelectedKey(null)}>
                            Back
                        </BtnGhost>
                    </BtnRow>
                ) : null}


            </TopBar>

            <Note>
                Zoho Inventory often blocks embedding inside other websites for security reasons.
                Recommended: <b>Open in Zoho ↗</b>. “Try Embed” may show “refused to connect”.
            </Note>

            {/* 1) Cards list */}
            {!selectedKey && (
                <CardGrid>
                    {Object.entries(ZOHO_LINKS).map(([key, v]) => (
                        <Card key={key}>
                            <CardTitle>{v.cardLabel}</CardTitle>
                            <CardDesc>{v.desc}</CardDesc>

                            <CardActions>
                                <Btn href={v.url} target="_blank" rel="noreferrer">
                                    Open ↗
                                </Btn>
                                <BtnGhost onClick={() => setSelectedKey(key)}>
                                    View Here
                                </BtnGhost>
                            </CardActions>
                        </Card>
                    ))}
                </CardGrid>
            )}

            {/* 2) Selected view (fallback or iframe) */}
            {selectedKey && !showIframe && (
                <FallbackCard>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Embedding not supported</div>
                    <div style={{ opacity: 0.9 }}>
                        Click <b>Open in Zoho ↗</b> to open <b>{active?.cardLabel}</b> in a new tab.
                    </div>
                </FallbackCard>
            )}

            {selectedKey && showIframe && (
                <IframeWrap>
                    <Iframe
                        src={active.url}
                        title={active.title}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                </IframeWrap>
            )}
        </Wrap>
    );
}
