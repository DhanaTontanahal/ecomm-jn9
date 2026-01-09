import React, { useState } from "react";
import styled from "styled-components";
import { FiArrowRight } from "react-icons/fi";
import ScrollTopFab from "../ScrollTopFab";

/* ========= tokens ========= */
const TOK = {
  bg: "#e9f4db",
  text: "#34433a",
  muted: "#5e6a63",
  heading: "#3f4f44",
  ring: "rgba(0,0,0,.08)",
  maxW: "1240px",
  white: "#fff",
  focus: "#6e8c53",
  shadow: "0 10px 28px rgba(0,0,0,.06)",
};

/* ========= layout ========= */
const FooterWrap = styled.footer`
  background: ${TOK.bg};
  color: ${TOK.text};
  border-top: 1px solid ${TOK.ring};
  /* safe-area + stop sideways scroll on tiny phones */
  padding: clamp(24px, 6vw, 56px)
           max(12px, env(safe-area-inset-left))
           clamp(28px, 6vw, 64px)
           max(12px, env(safe-area-inset-right));
  overflow-x: hidden;
`;

const Max = styled.div`
  max-width: ${TOK.maxW};
  margin: 0 auto;
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  grid-template-columns: 1.1fr 1.1fr 1.1fr 1.4fr;

  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 560px)  { grid-template-columns: 1fr; }
`;

const Col = styled.div`min-width: 0;`;

const H = styled.h4`
  margin: 0 0 12px;
  font-weight: 900;
  letter-spacing: 1px;
  color: ${TOK.heading};
  text-transform: uppercase;
  font-size: clamp(13px, 2.4vw, 15px);
`;

const List = styled.ul`
  list-style: none;
  padding: 0; margin: 0;
  display: grid;
  gap: 10px;
`;

const A = styled.a`
  color: ${TOK.text};
  text-decoration: none;
  font-size: clamp(14px, 2.8vw, 15px);
  opacity: .92;
  transition: color .15s ease, opacity .15s ease, outline-offset .1s;
  &:hover { color: ${TOK.focus}; opacity: 1; }
  &:focus-visible { outline: 2px solid ${TOK.focus}; outline-offset: 2px; border-radius: 4px; }
`;

const Brand = styled.div`display: grid; gap: 8px; justify-items: start;`;

const Logo = styled.div`
  display: grid; place-items: center; gap: 6px; margin-bottom: 6px;
  img { width: clamp(110px, 28vw, 130px); height: auto; object-fit: contain; }
  .wordmark { font-weight: 900; letter-spacing: 1.5px; font-size: clamp(18px, 4.6vw, 20px); }
`;

const Company = styled.div`font-weight: 800; letter-spacing: .4px; font-size: clamp(14px, 2.6vw, 15px);`;

const Address = styled.address`
  font-style: normal;
  opacity: .95;
  line-height: 1.6;
  font-size: clamp(13px, 2.6vw, 14px);
`;

const SubscribeBlock = styled.div`
  grid-column: 1 / span 2;
  margin-top: clamp(8px, 1.2vw, 12px);
  @media (max-width: 560px) { grid-column: 1/-1; }
`;

const Label = styled.div`
  font-weight: 800;
  margin-bottom: 10px;
  color: ${TOK.text};
  font-size: clamp(14px, 2.8vw, 15px);
`;

const SubscribeForm = styled.form`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: stretch;
  background: ${TOK.white};
  border-radius: 10px;
  overflow: hidden;
  outline: 1px solid ${TOK.ring};
  box-shadow: ${TOK.shadow};
  max-width: 560px;

  input{
    border: 0;
    padding: clamp(12px, 3.2vw, 14px) 14px;
    font-size: clamp(14px, 2.8vw, 15px);
    outline: none;
    color: ${TOK.text};
    min-width: 0; /* prevent form blowout */
  }

  button{
    border: 0;
    background: transparent;
    width: clamp(48px, 10vw, 52px);
    display: grid; place-items: center;
    cursor: pointer;
    color: ${TOK.focus};
    transition: transform .12s ease, background .12s ease;
    touch-action: manipulation;
  }
  button:active { transform: translateY(1px); }
  button:focus-visible { outline: 2px solid ${TOK.focus}; outline-offset: -2px; }
`;

const Small = styled.div`
  font-size: 12px;
  margin-top: 6px;
  color: ${TOK.muted};
`;

/* ========= component ========= */
export default function SiteFooter({ logoSrc }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setMsg(ok ? "Thanks! You’re subscribed." : "Please enter a valid email.");
    if (ok) setEmail("");
  };

  return (
    <>
      <FooterWrap role="contentinfo">
        <Max>


          {/* <Col>
            <H>Business</H>
            <List>
              <li><A href="#">Collaborations</A></li>
              <li><A href="#">Sourcing</A></li>
              <li><A href="#">Export</A></li>
            </List>
          </Col> */}

          {/* <Col>
            <H>Support</H>
            <List>
              <li><A href="#">Contact Us</A></li>
              <li><A href="#">Shipping & Returns</A></li>
              <li><A href="#">FAQs</A></li>
              <li><A href="tel:+919949295511">Mobile: +91 9949295511</A></li>
            </List>
          </Col> */}

          {/* <Col> */}
            {/* <Brand> */}
              {/* <Logo>
                {logoSrc ? (
                  <img src={logoSrc} alt="Brand logo" />
                ) : (
                  <>
                    <div className="wordmark">Prakruti</div>
                    <div className="wordmark">Farms</div>
                  </>
                )}
              </Logo> */}
              {/* <Company>Prakruti Farms PVT LTD</Company> */}
              {/* <Address>Kadapa, Andhra Pradesh</Address> */}
            {/* </Brand> */}
          {/* </Col> */}

          {/* <SubscribeBlock>
            <Label>Subscribe to our emails</Label>
            <SubscribeForm onSubmit={submit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button aria-label="Subscribe">
                <FiArrowRight size={20} />
              </button>
            </SubscribeForm>
            {msg && <Small aria-live="polite">{msg}</Small>}
          </SubscribeBlock> */}
        </Max>

      </FooterWrap>

      {/* <ScrollTopFab revealWithin={240} bottomOffset={92} /> */}
    </>
  );
}
