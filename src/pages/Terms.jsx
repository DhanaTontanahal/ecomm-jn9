// src/pages/Terms.jsx
import React, { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";

const TOK = {
    maxW: "960px",
    bg: "#fff",
    tint: "#fdece6",
    ink: "#2c3137",
    sub: "#707680",
    line: "rgba(16,24,40,.10)",
    card: "#fff",
};
const Global = createGlobalStyle`
  body{ font-family: Inter, ui-sans-serif, system-ui; color:${TOK.ink}; background:${TOK.bg}; }
`;
const Page = styled.div`min-height:100dvh;`;
const Head = styled.header`
  background:${TOK.tint};
  border-bottom-left-radius:28px; border-bottom-right-radius:28px;
  padding:12px 16px 18px;
`;
const Bar = styled.div`display:flex; align-items:center; justify-content:space-between;`;
const Back = styled.button`
  border:0; background:transparent; padding:8px; border-radius:12px; cursor:pointer; color:${TOK.ink};
`;
const H1 = styled.h1`
  margin:12px 0 0; font-size: clamp(22px, 4.8vw, 28px); font-weight:900;
`;
const Wrap = styled.div`
  max-width:${TOK.maxW}; margin:0 auto; padding:12px 14px 24px;
`;
const Card = styled.div`
  background:${TOK.card}; border:1px solid ${TOK.line}; border-radius:18px; padding:16px;
`;
const Body = styled.div`
  line-height:1.7; font-weight:600; color:${TOK.ink};
  h1,h2,h3{font-weight:900}
  code{background:#f6f7f8; padding:2px 6px; border-radius:6px}
`;

const FALLBACK = `# Terms & Conditions

By using Prakruti Farms Bharat, you agree to these terms.

**Orders & Pricing:** Prices and availability may change.  
**Payments:** UPI/cards supported as available.  
**Deliveries & Returns:** See store policy for timelines and eligibility.

_Last updated: ${new Date().toLocaleDateString("en-IN")}_`;

export default function Terms() {
    const nav = useNavigate();
    const [title, setTitle] = useState("Terms & Conditions");
    const [body, setBody] = useState(FALLBACK);

    useEffect(() => {
        (async () => {
            const snap = await getDoc(doc(db, "siteContent", "terms"));
            if (snap.exists()) {
                setTitle(snap.data().title || "Terms & Conditions");
                setBody(snap.data().body || FALLBACK);
            }
        })();
    }, []);

    return (
        <Page>
            <Global />
            <Head>
                <Bar>
                    <Back onClick={() => nav(-1)} aria-label="Back"><FiChevronLeft size={22} /></Back>
                    <div />
                </Bar>
                <H1>{title}</H1>
            </Head>

            <Wrap>
                <Card>
                    {/* Simple HTML render; switch to react-markdown if you prefer */}
                    <Body dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, "<br/>") }} />
                </Card>
            </Wrap>
        </Page>
    );
}
