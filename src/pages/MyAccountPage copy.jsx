// src/pages/MyAccountPage.jsx
import styled, { keyframes } from "styled-components";
import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../firebase/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
    FiChevronLeft, FiMoreVertical, FiHelpCircle, FiChevronRight, FiDownload, FiUsers,
    FiGift, FiHeart, FiBookmark, FiAward, FiShare2, FiFileText, FiShield, FiStar,
    FiTruck, FiCreditCard
} from "react-icons/fi";

import { FaAndroid, FaApple } from "react-icons/fa";


/* ===== tokens ===== */
const TOK = {
    maxW: "960px",
    bg: "#fff",
    tint: "#fdece6",          // soft peach header like screenshot
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    card: "#ffffff",
    pill: "rgba(16,24,40,.06)",
    dark: "#111213",
    brand: "#000",            // primary ink for title
    success: "#10b981",
    blackBtn: "#0f0f10",
};

const rise = keyframes`from{opacity:0; transform:translateY(6px)}to{opacity:1; transform:none}`;

/* ===== layout ===== */
const Page = styled.div`
  min-height: 100dvh;
  background: ${TOK.bg};
  color: ${TOK.ink};
`;
const Header = styled.header`
  background: ${TOK.tint};
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
  padding: 12px 16px 18px;
`;
const TopBar = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:8px;
`;
const IconBtn = styled.button`
  border:0; background:transparent; padding:10px; border-radius:12px;
  display:grid; place-items:center; cursor:pointer; color:${TOK.ink};
  &:active{ opacity:.6 }
`;
const HelpBtn = styled.button`
  border:0; background:#fff; padding:8px 14px; border-radius:20px; font-weight:800;
  color:${TOK.ink}; display:flex; align-items:center; gap:8px;
  box-shadow:0 2px 10px rgba(0,0,0,.06);
`;
const HeadBlock = styled.div`
  margin-top: 14px;
  display:grid; gap:4px;
  h1{ font-size: clamp(22px, 4.8vw, 28px); margin:0; color:${TOK.ink}; letter-spacing:.3px }
  .sub{ color:${TOK.sub}; font-weight:600 }
`;

const Wrap = styled.div`
  max-width:${TOK.maxW}; margin: 0 auto; padding: 12px 14px 24px;
  display:grid; gap:14px;
`;

/* ===== cards ===== */
const Card = styled.div`
  background:${TOK.card}; border:1px solid ${TOK.line}; border-radius:18px; padding:14px;
  animation:${rise} .35s ease;
`;
const Row = styled.button`
  width:100%; display:flex; align-items:center; gap:12px; padding:12px 6px;
  background:transparent; border:0; cursor:pointer; border-bottom:1px solid ${TOK.line};
  &:last-child{ border-bottom:0 }
`;
const LeadingIcon = styled.div`
  width:38px; height:38px; border-radius:12px; background:${TOK.pill};
  display:grid; place-items:center;
  svg{ width:18px; height:18px }
`;
const Title = styled.div` font-weight:900; letter-spacing:.2px `;
const Sub = styled.div` font-size:12px; color:${TOK.sub}; font-weight:600; margin-top:2px `;
const Spacer = styled.div`flex:1`;
const Right = styled.div` color:${TOK.sub}; display:flex; align-items:center; gap:6px; `;

/* ===== “One / Savings” banner ===== */
const SavingsBanner = styled.div`
  background:#fff7ed; border:1px solid #ffe8d1; border-radius:18px; padding:14px;
  display:grid; gap:6px;
`;
const Chip = styled.span`
  font-size:11px; font-weight:900; color:#a86a00;
  background:#fff; border:1px solid #f6d7ae; padding:4px 8px; border-radius:999px;
`;

/* ===== Tabs for past orders ===== */
const Tabs = styled.div`
  display:grid; grid-template-columns: repeat(3,1fr);
  background:${TOK.pill}; border-radius:16px; padding:4px;
`;
const Tab = styled.button`
  border:0; background:${p => p.$on ? TOK.blackBtn : "transparent"};
  color:${p => p.$on ? "#fff" : TOK.ink}; border-radius:12px; padding:10px 12px; font-weight:900;
`;

const OrderCard = styled.div`
  border:1px solid ${TOK.line}; border-radius:16px; padding:12px; display:grid; gap:10px; background:#fff;
`;
const Status = styled.span`
  font-size:12px; font-weight:900; color:${TOK.success}; background:rgba(16,185,129,.08);
  border-radius:999px; padding:3px 8px; display:inline-flex; align-items:center; gap:6px;
`;

/* ===== Footer links ===== */
const FooterNote = styled.div`
  color:${TOK.sub}; text-align:center; font-size:12px; margin-top:6px;
`;

/* ===== component ===== */
export default function MyAccountPage({ onBack, onHelp }) {

    const { user } = useAuth();
    const uid = user?.uid;
    const nav = useNavigate();

    const [profile, setProfile] = useState({ name: "", phone: "", email: "" });
    const [addresses, setAddresses] = useState([]);
    const [pastOrders, setPastOrders] = useState([]);
    const [totalSavings, setTotalSavings] = useState(0);

    const [tab, setTab] = useState("Yesterday");

    const maskedEmail = useMemo(() => user?.email ?? "", [user]);

    useEffect(() => {
        if (!uid) return;

        // Fetch profile
        (async () => {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) setProfile(snap.data());
        })();

        // Fetch addresses
        (async () => {
            const list = await getDocs(collection(db, "addresses", uid, "list"));
            setAddresses(list.docs.map(d => ({ id: d.id, ...d.data() })));
        })();

        // Fetch orders (sorted latest first)
        (async () => {
            const q = query(collection(db, "orders", uid), orderBy("createdAt", "desc"));
            const out = await getDocs(q);
            setPastOrders(out.docs.map(d => ({ id: d.id, ...d.data() })));
        })();

    }, [uid]);


    return (
        <Page>
            <Header>
                <TopBar>
                    <IconBtn aria-label="Back" onClick={()=>window.location.href="/"}><FiChevronLeft /></IconBtn>
                    <HelpBtn onClick={()=>alert("Contact Admin from home page")}><FiHelpCircle /> Help</HelpBtn>
                    <IconBtn aria-label="More"><FiMoreVertical /></IconBtn>
                </TopBar>

                <HeadBlock>
                    <h1>{profile?.name || "Customer"}</h1>
                    <div className="sub">{profile?.phone}</div>
                    <div className="sub">{profile?.email}</div>
                </HeadBlock>
            </Header>

            <Wrap>
                {/* Savings banner like screenshot */}
                <SavingsBanner>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <img alt="" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='10' cy='10' r='10' fill='%23ff5a2a'/></svg>" />
                        <Chip>EXPIRED</Chip>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>
                        ₹{Number(totalSavings).toLocaleString("en-IN")} saved with previous plan
                    </div>
                    <div style={{ color: TOK.sub, fontWeight: 700 }}>Renew now to unlock exclusive benefits</div>
                </SavingsBanner>

                {/* Quick grid (example) */}
                <Card>
                    <Row onClick={() => nav("/addresses")}>
                        <LeadingIcon><FiTruck /></LeadingIcon>
                        <div>
                            <Title>Saved Address</Title>
                            <Sub>Manage delivery locations</Sub>
                        </div>
                        <Spacer />
                        <Right><FiChevronRight /></Right>
                    </Row>
                    <Row onClick={() => nav("/pay-bill")}>
                        <LeadingIcon><FiCreditCard /></LeadingIcon>
                        <div>
                            <Title>Payment Modes</Title>
                            <Sub>UPI, cards & refunds</Sub>
                        </div>
                        <Spacer />
                        <Right><FiChevronRight /></Right>
                    </Row>

                    {/* <Row>
                        <LeadingIcon><FiFileText /></LeadingIcon>
                        <div>
                            <Title>Account Details</Title>
                            <Sub>Personal info & invoices</Sub>
                        </div>
                        <Spacer />
                        <Right><FiChevronRight /></Right>
                    </Row> */}
                </Card>

                {/* Required options list */}
                <Card>
                    {/* <Row>
                        <LeadingIcon><FiAward /></LeadingIcon>
                        <div>
                            <Title>Total Savings</Title>
                            <Sub>See how much you’ve saved</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row> */}

                    <Row onClick={() => nav("/export")}>
                        <LeadingIcon><FiDownload /></LeadingIcon>
                        <div>
                            <Title>Export</Title>
                            <Sub>Download statements/orders</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                     <Row onClick={() => nav("/become-supplier")}>
                        <LeadingIcon><FiUsers /></LeadingIcon>
                        <div>
                            <Title>Become Supplier</Title>
                            <Sub>Sell your organic products</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                    {/* <Row>
                        <LeadingIcon><FiGift /></LeadingIcon>
                        <div>
                            <Title>Rewards</Title>
                            <Sub>Track and redeem rewards</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                    <Row>
                        <LeadingIcon><FiHeart /></LeadingIcon>
                        <div>
                            <Title>Favourites</Title>
                            <Sub>Your saved stores & items</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                    <Row>
                        <LeadingIcon><FiBookmark /></LeadingIcon>
                        <div>
                            <Title>Wishlists</Title>
                            <Sub>Shortlist and plan purchases</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row> */}

                     <Row onClick={() => nav("/refer")}>
                        <LeadingIcon><FiShare2 /></LeadingIcon>
                        <div>
                            <Title>Refer & Earn</Title>
                            <Sub>Invite friends and get perks</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                    <Row onClick={() => nav("/privacy")}>
                        <LeadingIcon><FiShield /></LeadingIcon>
                        <div>
                            <Title>Privacy Policy</Title>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                      <Row onClick={() => nav("/terms")}>
                        <LeadingIcon><FiFileText /></LeadingIcon>
                        <div>
                            <Title>Terms</Title>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                    {/* <Row>
                        <LeadingIcon><FiStar /></LeadingIcon>
                        <div>
                            <Title>Rate Us</Title>
                            <Sub>Share feedback on the store</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row> */}

                    <Row>
                        <LeadingIcon><FaAndroid /></LeadingIcon>
                        <div>
                            <Title>Android App</Title>
                            <Sub>Download from Play Store</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                    <Row>
                        <LeadingIcon><FaApple /></LeadingIcon>
                        <div>
                            <Title>iOS App</Title>
                            <Sub>Get it on the App Store</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>

                     <Row onClick={() => nav("/become-business-partner")}>

                        <LeadingIcon><FiUsers /></LeadingIcon>
                        <div>
                            <Title>Become Business Partner</Title>
                            <Sub>Join our partner network</Sub>
                        </div>
                        <Spacer /><Right><FiChevronRight /></Right>
                    </Row>
                </Card>

                {/* Past Orders section */}
                {/* <div>
                    <div style={{ fontWeight: 900, letterSpacing: ".3px", margin: "6px 2px 10px" }}>PAST ORDERS</div>
                    <Tabs>
                        {["Yesterday", "Last week", "Last Month"].map(t => (
                            <Tab key={t} $on={tab === t} onClick={() => setTab(t)}>{t}</Tab>
                        ))}
                    </Tabs>
                </div>

                {pastOrders.map(o => (
                    <OrderCard key={o.id}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: TOK.pill }} />
                                <div>
                                    <div style={{ fontWeight: 900 }}>{o.store}</div>
                                    <div style={{ color: TOK.sub, fontWeight: 700, fontSize: 12 }}>{o.area}</div>
                                </div>
                            </div>
                            <Status>{o.status}</Status>
                        </div>
                        <div style={{ color: TOK.ink, fontWeight: 700 }}>{o.items}</div>
                    </OrderCard>
                ))} */}


                {/* <FooterNote>Version 1.0 • Prakruti Farms Bharat</FooterNote> */}
            </Wrap>
        </Page>
    );
}
