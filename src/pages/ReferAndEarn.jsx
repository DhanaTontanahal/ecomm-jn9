// src/pages/ReferAndEarn.jsx
import React, { useMemo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";

const TOK = { maxW: "960px", bg: "#fff", tint: "#fdece6", ink: "#2c3137", sub: "#707680", line: "rgba(16,24,40,.10)", card: "#fff", primary: "#5b7c3a" };
const Global = createGlobalStyle`body{font-family:Inter,ui-sans-serif;color:${TOK.ink};background:${TOK.bg}}`;
const Page = styled.div`min-height:100dvh;`;
const Head = styled.header`background:${TOK.tint};border-bottom-left-radius:28px;border-bottom-right-radius:28px;padding:12px 16px 18px;`;
const Bar = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const Back = styled.button`border:0;background:transparent;padding:8px;border-radius:12px;cursor:pointer;color:${TOK.ink};`;
const H1 = styled.h1`margin:12px 0 0;font-size:clamp(22px,4.8vw,28px);font-weight:900;`;
const Wrap = styled.div`max-width:${TOK.maxW};margin:0 auto;padding:12px 14px 24px;display:grid;gap:12px;`;
const Card = styled.div`background:${TOK.card};border:1px solid ${TOK.line};border-radius:18px;padding:16px;display:grid;gap:10px;`;
const Row = styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const Input = styled.input`height:44px;border:1px solid ${TOK.line};border-radius:12px;padding:0 12px;flex:1;`;
const Btn = styled.button`border:1px solid ${TOK.line};background:#fff;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer;`;
const Primary = styled.button`border:0;background:${TOK.primary};color:#fff;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer;`;

export default function ReferAndEarn() {
    const { user } = useAuth();
    const nav = useNavigate();

    const site = window.location.origin;
    const link = useMemo(() => user?.uid ? `${site}/ref?u=${user.uid}` : site, [user, site]);
    const text = `Hey! Check out Prakruti Farms Bharat. Get pure organic products & offers. Join via my link: ${link}`;

    const share = async () => {
        if (navigator.share) {
            await navigator.share({ title: "Prakruti Farms Bharat", text, url: link });
        } else {
            alert("Share not supported on this device. Use the buttons below.");
        }
    };

    const copy = async () => {
        await navigator.clipboard.writeText(link);
        alert("Referral link copied!");
    };

    return (
        <Page>
            <Global />
            <Head>
                <Bar>
                    <Back onClick={() => nav(-1)} aria-label="Back"><FiChevronLeft size={22} /></Back>
                    <div />
                </Bar>
                <H1>Refer & Earn</H1>
            </Head>

            <Wrap>
                <Card>
                    <div style={{ fontWeight: 900 }}>Invite friends and earn perks!</div>
                    <div style={{ color: TOK.sub, fontWeight: 700 }}>Share your referral link below.</div>
                    <Row>
                        <Input readOnly value={link} />
                        <Btn onClick={copy}>Copy</Btn>
                        <Primary onClick={share}>Share</Primary>
                    </Row>
                    <Row>
                        <Btn onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")}>WhatsApp</Btn>
                        <Btn onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, "_blank")}>Telegram</Btn>
                        <Btn onClick={() => window.open(`mailto:?subject=${encodeURIComponent("Prakruti Farms Bharat")}&body=${encodeURIComponent(text)}`)}>Email</Btn>
                    </Row>
                </Card>
            </Wrap>
        </Page>
    );
}
