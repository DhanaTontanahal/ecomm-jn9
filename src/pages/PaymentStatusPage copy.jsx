// src/pages/PaymentStatusPage.jsx
import React, { useMemo } from "react";
import styled from "styled-components";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiClock } from "react-icons/fi";

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  background: #f3f4f6;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
`;

const Card = styled.section`
  width: min(480px, 100%);
  background: #ffffff;
  border-radius: 18px;
  padding: 20px 18px 18px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.3);
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
`;

const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 24px;
  color: ${({ color }) => color};
  background: ${({ color }) => `${color}15`};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #111827;
`;

const Sub = styled.p`
  margin: 2px 0 0;
  font-size: 13px;
  color: #6b7280;
`;

const MessageBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f9fafb;
  font-size: 13px;
  color: #4b5563;
  border: 1px dashed rgba(148, 163, 184, 0.6);
`;

const InfoGrid = styled.dl`
  margin: 14px 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 6px;
  column-gap: 8px;
  font-size: 13px;
`;

const Label = styled.dt`
  font-weight: 600;
  color: #6b7280;
`;

const Value = styled.dd`
  margin: 0;
  font-weight: 700;
  color: #111827;
  word-break: break-all;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${({ bg }) => bg};
  color: ${({ color }) => color};
`;

const Actions = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 18px;
`;

const PrimaryBtn = styled.button`
  height: 42px;
  border-radius: 999px;
  border: none;
  font-weight: 800;
  font-size: 14px;
  background: #16a34a;
  color: #ffffff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: transform 0.08s ease, box-shadow 0.08s ease, opacity 0.15s ease;
  box-shadow: 0 10px 24px rgba(22, 163, 74, 0.35);

  &:active {
    transform: translateY(1px);
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
  }
`;

const SecondaryBtn = styled.button`
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: #ffffff;
  color: #111827;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: grid;
  place-items: center;
`;

const Small = styled.p`
  margin: 10px 0 0;
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
`;

// Map status to icon + colors + title
function useStatusMeta(status) {
    return useMemo(() => {
        switch ((status || "").toUpperCase()) {
            case "SUCCESS":
                return {
                    title: "Payment Successful",
                    color: "#16a34a",
                    pillBg: "#dcfce7",
                    pillColor: "#166534",
                    Icon: FiCheckCircle,
                };
            case "FAILED":
                return {
                    title: "Payment Failed",
                    color: "#dc2626",
                    pillBg: "#fee2e2",
                    pillColor: "#991b1b",
                    Icon: FiXCircle,
                };
            case "PENDING":
                return {
                    title: "Payment Pending",
                    color: "#d97706",
                    pillBg: "#fef3c7",
                    pillColor: "#92400e",
                    Icon: FiClock,
                };
            default:
                return {
                    title: "Payment Status",
                    color: "#4b5563",
                    pillBg: "#e5e7eb",
                    pillColor: "#374151",
                    Icon: FiAlertTriangle,
                };
        }
    }, [status]);
}

const PaymentStatusPage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const orderId = params.get("orderId") || "-";
    const status = params.get("status") || "UNKNOWN";
    const rawStatus = params.get("rawStatus") || "-";
    const msg = params.get("msg") || "";

    const { title, color, pillBg, pillColor, Icon } = useStatusMeta(status);

    return (
        <Page>
            <Card>
                <Header>
                    <IconWrap color={color}>
                        <Icon />
                    </IconWrap>
                    <div>
                        <Title>{title}</Title>
                        <Sub>
                            {status.toUpperCase() === "SUCCESS"
                                ? "Thank you for your payment. A confirmation will be sent shortly."
                                : status.toUpperCase() === "FAILED"
                                    ? "Your payment could not be completed. You may try again or choose another method."
                                    : status.toUpperCase() === "PENDING"
                                        ? "We are waiting for final confirmation from the bank or gateway."
                                        : "We received the response from the payment gateway."}
                        </Sub>
                    </div>
                </Header>

                {msg && <MessageBox>{msg}</MessageBox>}

                <InfoGrid>
                    <Label>Order ID</Label>
                    <Value>{orderId}</Value>

                    <Label>Status</Label>
                    <Value>
                        <Pill bg={pillBg} color={pillColor}>
                            {status}
                        </Pill>
                    </Value>

                    <Label>Gateway Status</Label>
                    <Value>{rawStatus}</Value>
                </InfoGrid>

                <Actions>
                    <PrimaryBtn onClick={() => navigate("/my-orders")}>
                        View My Orders
                    </PrimaryBtn>
                    <SecondaryBtn onClick={() => navigate("/")}>
                        Back to Home
                    </SecondaryBtn>
                </Actions>

                <Small>
                    If this status looks incorrect, please refresh after a few seconds or
                    check your orders page.
                </Small>
            </Card>
        </Page>
    );
};

export default PaymentStatusPage;
