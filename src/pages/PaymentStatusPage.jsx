// src/pages/PaymentStatus.jsx
import React, { useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiArrowLeft } from "react-icons/fi";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
`;

const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top, #e5f4ff 0, #f9fafb 40%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
`;

const Card = styled.div`
  width: min(480px, 100%);
  background: #ffffff;
  border-radius: 20px;
  padding: 22px 20px 18px;
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.18);
  animation: ${fadeIn} 0.25s ease-out;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
`;

const Badge = styled.div`
  width: 66px;
  height: 66px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin: 4px auto 12px;
  background: ${({ tone }) => {
        if (tone === "success") return "rgba(34,197,94,.12)";
        if (tone === "pending") return "rgba(234,179,8,.12)";
        if (tone === "failed") return "rgba(239,68,68,.12)";
        return "rgba(148,163,184,.12)";
    }};
  svg {
    width: 32px;
    height: 32px;
    color: ${({ tone }) => {
        if (tone === "success") return "#16a34a";
        if (tone === "pending") return "#eab308";
        if (tone === "failed") return "#ef4444";
        return "#64748b";
    }};
  }
`;

const Title = styled.h1`
  margin: 0;
  text-align: center;
  font-size: 20px;
  letter-spacing: 0.02em;
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 4px 0 16px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
`;

const DetailGrid = styled.div`
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 10px 12px;
  background: #f9fafb;
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 14px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  &:not(:last-child) {
    border-bottom: 1px dashed rgba(148, 163, 184, 0.5);
  }
  span:first-child {
    color: #6b7280;
  }
  span:last-child {
    font-weight: 600;
    color: #111827;
    max-width: 60%;
    text-align: right;
    word-break: break-word;
  }
`;

const Actions = styled.div`
  margin-top: 14px;
  display: grid;
  gap: 8px;
`;

const PrimaryBtn = styled.button`
  height: 44px;
  border-radius: 999px;
  border: none;
  background: #15803d;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:active {
    transform: translateY(1px);
  }
`;

const GhostBtn = styled.button`
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #ffffff;
  color: #111827;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:active {
    transform: translateY(1px);
  }
`;

export default function PaymentStatus() {
    const location = useLocation();
    const navigate = useNavigate();

    const params = useMemo(
        () => new URLSearchParams(location.search),
        [location.search]
    );

    const orderId = params.get("orderId") || "-";
    const status = (params.get("status") || "").toUpperCase();
    const rawStatus = params.get("rawStatus") || "";
    const msg = params.get("msg") || "";

    const tone = (() => {
        if (status === "SUCCESS") return "success";
        if (status === "PENDING") return "pending";
        if (status === "FAILED") return "failed";
        return "unknown";
    })();

    const titleText =
        status === "SUCCESS"
            ? "Payment Successful"
            : status === "PENDING"
                ? "Payment in Progress"
                : status === "FAILED"
                    ? "Payment Failed"
                    : "Payment Status";

    const subtitleText =
        msg ||
        (status === "SUCCESS"
            ? "Thank you for your payment. Your order will be processed shortly."
            : status === "PENDING"
                ? "We are waiting for confirmation from your bank / payment provider."
                : status === "FAILED"
                    ? "We couldn't complete your payment. You can try again or use another payment method."
                    : "We received a response for your payment. Please review the details below.");

    return (
        <Page>
            <Card>
                <Badge tone={tone}>
                    {tone === "success" && <FiCheckCircle />}
                    {tone === "pending" && <FiAlertTriangle />}
                    {tone === "failed" && <FiXCircle />}
                    {tone === "unknown" && <FiAlertTriangle />}
                </Badge>

                <Title>{titleText}</Title>
                <Subtitle>{subtitleText}</Subtitle>

                <DetailGrid>
                    <Row>
                        <span>Order ID</span>
                        <span>{orderId}</span>
                    </Row>
                    <Row>
                        <span>Status</span>
                        <span>{status || "N/A"}</span>
                    </Row>
                    {rawStatus && (
                        <Row>
                            <span>Gateway Status</span>
                            <span>{rawStatus}</span>
                        </Row>
                    )}
                </DetailGrid>

                <Actions>
                    <PrimaryBtn onClick={() => navigate("/my-orders")}>
                        View My Orders
                    </PrimaryBtn>
                    <GhostBtn onClick={() => navigate("/")}>
                        <FiArrowLeft />
                        Back to Home
                    </GhostBtn>
                </Actions>
            </Card>
        </Page>
    );
}
