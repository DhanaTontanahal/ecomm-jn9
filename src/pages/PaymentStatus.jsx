// src/pages/PaymentStatus.jsx
import React, { useMemo } from "react";
import styled from "styled-components";
import { useSearchParams, Link } from "react-router-dom";
import { FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";

const Wrap = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top, #ecfdf5 0, #f9fafb 55%, #e5e7eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
`;

const Card = styled.div`
  width: min(480px, 100%);
  background: #ffffff;
  border-radius: 18px;
  padding: 22px 20px 20px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(15, 23, 42, 0.05);
  text-align: center;
`;

const IconCircle = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 999px;
  margin: 0 auto 10px;
  display: grid;
  place-items: center;
  font-size: 30px;
  color: ${({ tone }) =>
        tone === "success" ? "#16a34a" : tone === "pending" ? "#f59e0b" : "#dc2626"};
  background: ${({ tone }) =>
        tone === "success"
            ? "rgba(22,163,74,.06)"
            : tone === "pending"
                ? "rgba(245,158,11,.06)"
                : "rgba(220,38,38,.06)"};
`;

const Title = styled.h1`
  font-size: 20px;
  margin: 4px 0 2px;
  color: #111827;
`;

const Sub = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 14px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #4b5563;
  padding: 6px 0;
  border-top: 1px dashed rgba(148, 163, 184, 0.5);

  strong {
    color: #111827;
  }
`;

const BtnRow = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 16px;

  @media (min-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const PrimaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  border-radius: 999px;
  background: #16a34a;
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  border: none;
`;

const SecondaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  border-radius: 999px;
  background: #ffffff;
  color: #111827;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  border: 1px solid rgba(148, 163, 184, 0.8);
`;

export default function PaymentStatus() {
    const [params] = useSearchParams();

    const orderId = params.get("orderId") || "";
    const status = (params.get("status") || "").toUpperCase();
    const rawStatus = params.get("rawStatus") || "";
    const msg = params.get("msg") || "";

    const view = useMemo(() => {
        if (status === "SUCCESS") {
            return {
                tone: "success",
                title: "Payment Successful 🎉",
                subtitle: "Thank you for your order. We’re preparing your items.",
            };
        }
        if (status === "PENDING") {
            return {
                tone: "pending",
                title: "Payment In Progress",
                subtitle:
                    "We haven’t received a final confirmation yet. If you were charged, your order will be updated soon.",
            };
        }
        if (status === "FAILED") {
            return {
                tone: "failed",
                title: "Payment Failed",
                subtitle:
                    "Your payment didn’t go through. You can retry with a different method.",
            };
        }
        return {
            tone: "pending",
            title: "Payment Status",
            subtitle: "We could not determine the final status. Please check your orders.",
        };
    }, [status]);

    return (
        <Wrap>
            <Card>
                <IconCircle tone={view.tone}>
                    {view.tone === "success" && <FiCheckCircle />}
                    {view.tone === "pending" && <FiClock />}
                    {view.tone === "failed" && <FiAlertCircle />}
                </IconCircle>

                <Title>{view.title}</Title>
                <Sub>{msg || view.subtitle}</Sub>

                {orderId ? (
                    <>
                        <InfoRow>
                            <span>Order ID</span>
                            <strong>{orderId}</strong>
                        </InfoRow>
                        <InfoRow>
                            <span>Gateway Status</span>
                            <strong>{rawStatus || status || "N/A"}</strong>
                        </InfoRow>
                    </>
                ) : null}

                <BtnRow>
                    <PrimaryBtn to="/my-orders">View My Orders</PrimaryBtn>
                    <SecondaryBtn to="/">Back to Home</SecondaryBtn>
                </BtnRow>
            </Card>
        </Wrap>
    );
}
