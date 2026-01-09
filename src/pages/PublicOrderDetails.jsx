// src/pages/PublicOrderDetails.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

const TOK = {
  text: "#1f2a37",
  sub: "#6b7280",
  border: "rgba(16,24,40,.10)",
  green: "#5b7c3a",
  faint: "rgba(16,24,40,.06)",
};

const Page = styled.div`
  padding: 14px;
`;

const Title = styled.h2`
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 900;
  color: ${TOK.text};
`;

const BackBtn = styled.button`
  border: none;
  background: none;
  color: ${TOK.green};
  font-weight: 900;
  margin-bottom: 12px;
  cursor: pointer;
`;

const Section = styled.div`
  border: 1px solid ${TOK.border};
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  margin-top: 12px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  border-bottom: 1px dashed ${TOK.faint};
  padding: 10px 0;
  &:last-child {
    border-bottom: none;
  }
`;

const Img = styled.img`
  width: 60px;
  height: 60px;
  object-fit: contain;
  background: #f5f6f7;
  border-radius: 10px;
`;

const Info = styled.div`
  flex: 1;
`;

const Name = styled.div`
  font-weight: 800;
  color: ${TOK.text};
`;

const Sub = styled.div`
  font-size: 12px;
  color: ${TOK.sub};
`;

const Qty = styled.div`
  font-size: 13px;
  color: ${TOK.text};
`;

const TotRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 6px;
  font-weight: 800;
  color: ${TOK.text};
`;

const money = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

export default function PublicOrderDetails() {
  const { state } = useLocation();
  const nav = useNavigate();

  const o = state?.order;
  if (!o) return <Page><p>Order not found</p></Page>;

  return (
    <Page>
      <BackBtn onClick={() => nav(-1)}>← Back</BackBtn>
      <Title>Order Details</Title>

      <Section>
        {o.items?.map((x, i) => (
          <Row key={i}>
            <Img src={x.imageUrl} alt="" />
            <Info>
              <Name>{x.title}</Name>
              {x.subtitle && <Sub>{x.subtitle}</Sub>}
              <Qty>Qty: {x.qty}</Qty>
            </Info>
            <div style={{ fontWeight: 900 }}>{money(x.price * x.qty)}</div>
          </Row>
        ))}

        <TotRow>
          <span>Subtotal</span>
          <span>{money(o?.pricing?.subtotal)}</span>
        </TotRow>

        <TotRow>
          <span>GST</span>
          <span>{money(o?.pricing?.gst)}</span>
        </TotRow>

        <TotRow style={{ borderTop: `1px solid ${TOK.border}`, paddingTop: 10 }}>
          <span style={{ fontWeight: 900 }}>Total</span>
          <span style={{ fontWeight: 900 }}>{money(o?.pricing?.total)}</span>
        </TotRow>
      </Section>
    </Page>
  );
}
