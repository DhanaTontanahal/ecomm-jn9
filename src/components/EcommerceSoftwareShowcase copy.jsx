// src/components/EcommerceSoftwareShowcase.jsx
import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
    FiSettings,
    FiSmartphone,
    FiShoppingCart,
    FiTruck,
    FiMail,
    FiBarChart2,
    FiMessageCircle,
} from "react-icons/fi";

/* --------------------------------------------
   TOKENS (colors, shadows, fonts)
--------------------------------------------- */
const TOK = {
    bg: "#f8fafc",
    text: "#1e293b",
    subtext: "#475569",
    accent: "#4ea1ff",
    accentDark: "#0b6cb8",
    white: "#ffffff",
    shadow: "0 8px 28px rgba(0,0,0,0.08)",
    radius: "18px",
    maxW: "1200px",
};

/* --------------------------------------------
   Layout Containers
--------------------------------------------- */
const Wrapper = styled.div`
  width: 100%;
  background: ${TOK.bg};
  padding: 40px 18px;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  max-width: ${TOK.maxW};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 80px;
  padding-top: 20px;
`;

const Section = styled(motion.section)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const ImageBox = styled(motion.div)`
  background: ${TOK.white};
  padding: 12px;
  border-radius: ${TOK.radius};
  box-shadow: ${TOK.shadow};
  overflow: hidden;

  img {
    width: 100%;
    border-radius: ${TOK.radius};
  }
`;

const ContentBox = styled.div`
  h2 {
    font-size: 32px;
    color: ${TOK.text};
    font-weight: 700;
    margin-bottom: 16px;
  }

  p {
    font-size: 18px;
    color: ${TOK.subtext};
    line-height: 1.7;
    margin-bottom: 24px;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 12px;

    li {
      font-size: 17px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: ${TOK.text};
    }
  }
`;

const Icon = styled.div`
  font-size: 24px;
  color: ${TOK.accent};
`;

/* --------------------------------------------
   Animation Variants
--------------------------------------------- */
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

/* --------------------------------------------
   Component
--------------------------------------------- */
export default function EcommerceSoftwareShowcase() {
    return (
        <Wrapper>
            <Container>

                {/* -------------------------------------- */}
                {/* MAIN TITLE */}
                {/* -------------------------------------- */}
                <motion.h1
                    initial={{ opacity: 0, y: -25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        textAlign: "center",
                        fontSize: "42px",
                        color: TOK.text,
                        fontWeight: 800,
                    }}
                >
                    End-to-End Ecommerce & Business Automation Software
                </motion.h1>

                {/* ---------------------------------------------------- */}
                {/* 1. Business Owners Custom Landing Page */}
                {/* ---------------------------------------------------- */}
                <Section initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <ImageBox variants={fadeUp}>
                        <img src="/images/landing-editor.png" alt="Landing Page Builder" />
                    </ImageBox>

                    <ContentBox variants={fadeUp}>
                        <h2>Create Beautiful Landing Pages Instantly</h2>
                        <p>
                            No coding required. Business owners can easily draft their own
                            landing pages—upload images, banners, product highlights, business
                            story, testimonials and more.
                        </p>
                        <ul>
                            <li><Icon><FiSettings /></Icon>Drag & drop landing page editor</li>
                            <li><Icon><FiSmartphone /></Icon>Instant mobile preview</li>
                            <li><Icon><FiBarChart2 /></Icon>A/B testing & analytics included</li>
                        </ul>
                    </ContentBox>
                </Section>

                {/* ---------------------------------------------------- */}
                {/* 2. Admin Automation Section */}
                {/* ---------------------------------------------------- */}
                <Section initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <ContentBox variants={fadeUp}>
                        <h2>Automate Every Business Operation</h2>
                        <p>
                            From categories to products, orders, inventory, accounting, CRM
                            and custom workflows—everything is streamlined and automated with
                            powerful admin tools.
                        </p>
                        <ul>
                            <li><Icon><FiShoppingCart /></Icon>Auto Category & Product Manager</li>
                            <li><Icon><FiTruck /></Icon>Order & Delivery Automation</li>
                            <li><Icon><FiBarChart2 /></Icon>Stock insights, accounting & CRM</li>
                        </ul>
                    </ContentBox>

                    <ImageBox variants={fadeUp}>
                        <img src="/images/admin-dashboard.png" alt="Admin Dashboard" />
                    </ImageBox>
                </Section>

                {/* ---------------------------------------------------- */}
                {/* 3. POS & Accounting Dashboards */}
                {/* ---------------------------------------------------- */}
                <Section initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <ImageBox variants={fadeUp}>
                        <img src="/images/pos-dashboard.png" alt="POS and Accounting" />
                    </ImageBox>

                    <ContentBox variants={fadeUp}>
                        <h2>POS, Sales Dashboards & Accounting Suite</h2>
                        <p>
                            A complete financial toolkit built in—POS billing, GST overview,
                            P&L statements, Ledgers, Journals, Sales charts, and performance
                            insights.
                        </p>
                        <ul>
                            <li><Icon><FiBarChart2 /></Icon>GST Dashboard & Journal Entries</li>
                            <li><Icon><FiSettings /></Icon>POS Configuration for Stores</li>
                            <li><Icon><FiSmartphone /></Icon>Real-time performance reports</li>
                        </ul>
                    </ContentBox>
                </Section>

                {/* ---------------------------------------------------- */}
                {/* 4. Delivery Agent Management */}
                {/* ---------------------------------------------------- */}
                <Section initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <ContentBox variants={fadeUp}>
                        <h2>Delivery Agent Management System</h2>
                        <p>
                            Track delivery agents, assign orders, monitor status, and manage
                            delivery performance with advanced real-time dashboards.
                        </p>
                        <ul>
                            <li><Icon><FiTruck /></Icon>Assign & Track Deliveries Live</li>
                            <li><Icon><FiSettings /></Icon>Custom delivery rules</li>
                            <li><Icon><FiBarChart2 /></Icon>Agent performance analytics</li>
                        </ul>
                    </ContentBox>

                    <ImageBox variants={fadeUp}>
                        <img src="/images/delivery-tracking.png" alt="Delivery Tracking" />
                    </ImageBox>
                </Section>

                {/* ---------------------------------------------------- */}
                {/* 5. Android App Development */}
                {/* ---------------------------------------------------- */}
                <Section initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <ImageBox variants={fadeUp}>
                        <img src="/images/mobile-app.png" alt="Android Ecommerce App" />
                    </ImageBox>

                    <ContentBox variants={fadeUp}>
                        <h2>Custom Android App for Every Business</h2>
                        <p>
                            Get your branded ecommerce Android app deployed on the Play Store.
                            Fully synced with your admin dashboard and ecommerce backend.
                        </p>
                        <ul>
                            <li><Icon><FiSmartphone /></Icon>Play Store deployment</li>
                            <li><Icon><FiSettings /></Icon>Your branding, your identity</li>
                            <li><Icon><FiBarChart2 /></Icon>Real-time sync with backend</li>
                        </ul>
                    </ContentBox>
                </Section>

                {/* ---------------------------------------------------- */}
                {/* 6. End-to-End Hosting & Setup */}
                {/* ---------------------------------------------------- */}
                <Section initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <ContentBox variants={fadeUp}>
                        <h2>Complete End-to-End Deployment</h2>
                        <p>
                            We set up everything—domain mapping, hosting, backend pipelines,
                            Play Store release, SSL, integrations and dedicated business
                            dashboard.
                        </p>
                        <ul>
                            <li><Icon><FiSettings /></Icon>Business domain hosting</li>
                            <li><Icon><FiSmartphone /></Icon>Play Store setup</li>
                            <li><Icon><FiBarChart2 /></Icon>Realtime infra monitoring</li>
                        </ul>
                    </ContentBox>

                    <ImageBox variants={fadeUp}>
                        <img src="/images/hosting-setup.png" alt="Hosting Setup" />
                    </ImageBox>
                </Section>

                {/* ---------------------------------------------------- */}
                {/* 7. WhatsApp & Email Integrations */}
                {/* ---------------------------------------------------- */}
                <Section initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <ImageBox variants={fadeUp}>
                        <img src="/images/communication.png" alt="Communication Automation" />
                    </ImageBox>

                    <ContentBox variants={fadeUp}>
                        <h2>WhatsApp + Email + Notifications</h2>
                        <p>
                            Full communication automation—order updates, payment reminders,
                            offers, customer queries & delivery updates.
                        </p>
                        <ul>
                            <li><Icon><FiMail /></Icon>Email automation templates</li>
                            <li><Icon><FiMessageCircle /></Icon>WhatsApp Order Updates</li>
                            <li><Icon><FiSettings /></Icon>Custom triggers & workflows</li>
                        </ul>
                    </ContentBox>
                </Section>

                {/* ---------------------------------------------------- */}
                {/* 8. AI WhatsApp Agent */}
                {/* ---------------------------------------------------- */}
                <Section initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <ContentBox variants={fadeUp}>
                        <h2>24×7 AI-Powered WhatsApp Bot</h2>
                        <p>
                            Let AI handle customer queries, order status requests, product
                            information, FAQs, support messages and follow-ups—fully automated
                            with your ecommerce database.
                        </p>
                        <ul>
                            <li><Icon><FiMessageCircle /></Icon>Order tracking & product queries</li>
                            <li><Icon><FiSettings /></Icon>Deep integration with ecommerce backend</li>
                            <li><Icon><FiSmartphone /></Icon>Works 24×7 without downtime</li>
                        </ul>
                    </ContentBox>

                    <ImageBox variants={fadeUp}>
                        <img src="/images/ai-whatsapp.png" alt="AI WhatsApp Agent" />
                    </ImageBox>
                </Section>

            </Container>
        </Wrapper>
    );
}
