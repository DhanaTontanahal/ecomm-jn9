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

const ContentBox = styled(motion.div)`
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
   Pricing Styles
--------------------------------------------- */
const PricingSection = styled(motion.section)`
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  text-align: center;
`;

const PricingHeader = styled.div`
  max-width: 680px;
  margin: 0 auto;

  h2 {
    font-size: 34px;
    font-weight: 800;
    color: ${TOK.text};
    margin-bottom: 10px;
  }

  p {
    font-size: 17px;
    color: ${TOK.subtext};
    line-height: 1.7;
  }
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  width: 100%;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const PlanCard = styled.div`
  background: ${TOK.white};
  border-radius: 22px;
  box-shadow: ${TOK.shadow};
  padding: 24px 22px 26px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;

  &.popular {
    border-color: ${TOK.accent};
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
  }

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: ${TOK.text};
    margin-bottom: 4px;
  }

  p {
    font-size: 14px;
    color: ${TOK.subtext};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 16px;
  right: 18px;
  background: rgba(78, 161, 255, 0.08);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: ${TOK.accentDark};
`;

const Price = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 4px;

  span.amount {
    font-size: 26px;
    font-weight: 800;
    color: ${TOK.text};
  }

  span.period {
    font-size: 13px;
    color: ${TOK.subtext};
  }
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;

  li {
    font-size: 14px;
    color: ${TOK.text};
    display: flex;
    align-items: flex-start;
    gap: 6px;

    &::before {
      content: "•";
      color: ${TOK.accent};
      font-weight: 900;
      margin-top: 1px;
    }
  }
`;

const CTAButton = styled.button`
  margin-top: 18px;
  padding: 10px 16px;
  border-radius: 999px;
  border: none;
  background: ${TOK.accent};
  color: ${TOK.white};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.18s ease-out;

  &:hover {
    background: ${TOK.accentDark};
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
  }
`;

const SmallNote = styled.div`
  font-size: 13px;
  color: ${TOK.subtext};
  max-width: 720px;
  margin: 0 auto;
  line-height: 1.7;

  strong {
    color: ${TOK.text};
  }

  ul {
    margin: 6px 0 10px;
    padding-left: 18px;
  }

  li {
    margin-bottom: 2px;
  }
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
                            <li>
                                <Icon>
                                    <FiSettings />
                                </Icon>
                                Drag &amp; drop landing page editor
                            </li>
                            <li>
                                <Icon>
                                    <FiSmartphone />
                                </Icon>
                                Instant mobile preview
                            </li>
                            <li>
                                <Icon>
                                    <FiBarChart2 />
                                </Icon>
                                A/B testing &amp; analytics included
                            </li>
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
                            <li>
                                <Icon>
                                    <FiShoppingCart />
                                </Icon>
                                Auto Category &amp; Product Manager
                            </li>
                            <li>
                                <Icon>
                                    <FiTruck />
                                </Icon>
                                Order &amp; Delivery Automation
                            </li>
                            <li>
                                <Icon>
                                    <FiBarChart2 />
                                </Icon>
                                Stock insights, accounting &amp; CRM
                            </li>
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
                        <h2>POS, Sales Dashboards &amp; Accounting Suite</h2>
                        <p>
                            A complete financial toolkit built in—POS billing, GST overview,
                            P&amp;L statements, Ledgers, Journals, Sales charts, and performance
                            insights.
                        </p>
                        <ul>
                            <li>
                                <Icon>
                                    <FiBarChart2 />
                                </Icon>
                                GST Dashboard &amp; Journal Entries
                            </li>
                            <li>
                                <Icon>
                                    <FiSettings />
                                </Icon>
                                POS Configuration for Stores
                            </li>
                            <li>
                                <Icon>
                                    <FiSmartphone />
                                </Icon>
                                Real-time performance reports
                            </li>
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
                            <li>
                                <Icon>
                                    <FiTruck />
                                </Icon>
                                Assign &amp; Track Deliveries Live
                            </li>
                            <li>
                                <Icon>
                                    <FiSettings />
                                </Icon>
                                Custom delivery rules
                            </li>
                            <li>
                                <Icon>
                                    <FiBarChart2 />
                                </Icon>
                                Agent performance analytics
                            </li>
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
                            <li>
                                <Icon>
                                    <FiSmartphone />
                                </Icon>
                                Play Store deployment
                            </li>
                            <li>
                                <Icon>
                                    <FiSettings />
                                </Icon>
                                Your branding, your identity
                            </li>
                            <li>
                                <Icon>
                                    <FiBarChart2 />
                                </Icon>
                                Real-time sync with backend
                            </li>
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
                            <li>
                                <Icon>
                                    <FiSettings />
                                </Icon>
                                Business domain hosting
                            </li>
                            <li>
                                <Icon>
                                    <FiSmartphone />
                                </Icon>
                                Play Store setup
                            </li>
                            <li>
                                <Icon>
                                    <FiBarChart2 />
                                </Icon>
                                Realtime infra monitoring
                            </li>
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
                            offers, customer queries &amp; delivery updates.
                        </p>
                        <ul>
                            <li>
                                <Icon>
                                    <FiMail />
                                </Icon>
                                Email automation templates
                            </li>
                            <li>
                                <Icon>
                                    <FiMessageCircle />
                                </Icon>
                                WhatsApp Order Updates
                            </li>
                            <li>
                                <Icon>
                                    <FiSettings />
                                </Icon>
                                Custom triggers &amp; workflows
                            </li>
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
                            <li>
                                <Icon>
                                    <FiMessageCircle />
                                </Icon>
                                Order tracking &amp; product queries
                            </li>
                            <li>
                                <Icon>
                                    <FiSettings />
                                </Icon>
                                Deep integration with ecommerce backend
                            </li>
                            <li>
                                <Icon>
                                    <FiSmartphone />
                                </Icon>
                                Works 24×7 without downtime
                            </li>
                        </ul>
                    </ContentBox>

                    <ImageBox variants={fadeUp}>
                        <img src="/images/ai-whatsapp.png" alt="AI WhatsApp Agent" />
                    </ImageBox>
                </Section>

                {/* ---------------------------------------------------- */}
                {/* 9. Pricing Section */}
                {/* ---------------------------------------------------- */}
                <PricingSection
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                >
                    <PricingHeader>
                        <h2>Simple Pricing for Serious Businesses</h2>
                        <p>
                            Choose a plan that matches your stage. All plans include hosting,
                            SSL, secure backend and access to the full ecommerce core.
                        </p>
                    </PricingHeader>

                    <PlansGrid>
                        {/* Starter */}
                        <PlanCard>
                            <h3>Starter</h3>
                            <p>For single-store businesses taking their first step online.</p>
                            <Price>
                                <span className="amount">₹1,499</span>
                                <span className="period">/ month</span>
                            </Price>
                            <PlanFeatures>
                                <li>Customer-facing ecommerce website</li>
                                <li>Product, category &amp; order management</li>
                                <li>Basic WhatsApp &amp; email notifications</li>
                                <li>Standard analytics dashboard</li>
                            </PlanFeatures>
                            <CTAButton>Book a demo</CTAButton>
                        </PlanCard>

                        {/* Growth (Popular) */}
                        <PlanCard className="popular">
                            <Badge>Most Popular</Badge>
                            <h3>Growth</h3>
                            <p>
                                For growing brands that need automation, POS and mobile-ready
                                experiences.
                            </p>
                            <Price>
                                <span className="amount">₹3,999</span>
                                <span className="period">/ month</span>
                            </Price>
                            <PlanFeatures>
                                <li>Everything in Starter</li>
                                <li>Advanced admin automation &amp; workflows</li>
                                <li>POS billing &amp; stock management</li>
                                <li>Delivery agent dashboard &amp; tracking</li>
                                <li>Offer engine, coupons &amp; campaigns</li>
                            </PlanFeatures>
                            <CTAButton>Talk to us</CTAButton>
                        </PlanCard>

                        {/* Pro / Enterprise */}
                        <PlanCard>
                            <h3>Pro / Enterprise</h3>
                            <p>
                                For multi-location, high-volume operations that need AI and full
                                customisation.
                            </p>
                            <Price>
                                <span className="amount">₹7,999+</span>
                                <span className="period">/ month</span>
                            </Price>
                            <PlanFeatures>
                                <li>Everything in Growth</li>
                                <li>AI WhatsApp bot fully integrated</li>
                                <li>Multi-branch, multi-warehouse setup</li>
                                <li>Custom workflows &amp; reporting</li>
                                <li>Priority onboarding &amp; support SLAs</li>
                            </PlanFeatures>
                            <CTAButton>Schedule a strategy call</CTAButton>
                        </PlanCard>
                    </PlansGrid>

                    <SmallNote>
                        <strong>One-time implementation (project setup) typically includes:</strong>
                        <ul>
                            <li>Customer-facing web app with your branding</li>
                            <li>Admin ERP dashboard (inventory, POS, accounting, CRM)</li>
                            <li>Android &amp; iOS apps (React Native) with store deployment</li>
                            <li>Domain, hosting, SSL and basic CI/CD setup</li>
                            <li>Payment gateway, WhatsApp &amp; email integrations</li>
                        </ul>

                        Typical full-stack implementations for serious businesses start from{" "}
                        <strong>₹2,50,000 – ₹4,00,000</strong>, depending on scope and custom workflows.
                        <br />
                        <br />
                        <strong>Annual Maintenance (AMC / Support):</strong> usually{" "}
                        <strong>10–15% of implementation value per year</strong> for updates,
                        monitoring and priority support, or optional monthly support plans
                        starting from <strong>₹4,999/month</strong>.
                    </SmallNote>

                </PricingSection>
            </Container>
        </Wrapper>
    );
}
