// src/components/landingpage/SiteFooter.jsx
import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FiInstagram, FiYoutube } from "react-icons/fi";

const Footer = styled.footer`
  background: #0f172a;
  color: #e5e7eb;
  padding: 48px 16px;
  margin-top: 64px;
`;

const FooterGrid = styled.div`
  max-width: 1200px;
  margin: auto;
  display: grid;
  gap: 32px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const SectionTitle = styled.h4`
  font-size: 15px;
  margin-bottom: 14px;
  color: #fff;
`;

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FooterLink = styled(Link)`
  color: #cbd5f5;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;

  &:hover {
    color: #38bdf8;
  }
`;

const SocialRow = styled.div`
  display: flex;
  gap: 14px;
  margin-top: 10px;
`;

const SocialIcon = styled.a`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 18px;
  transition: 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    background: ${({ type }) =>
    type === "youtube" ? "#ff0000" : "#e1306c"};
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  }
`;

const BottomBar = styled.div`
  text-align: center;
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.12);
  font-size: 13px;
  color: #9ca3af;
`;

export default function SiteFooter({ policyLinks = [] }) {
  return (
    <Footer>
      <FooterGrid>
        {/* Brand Info */}
        <div>
          <SectionTitle>Prakruti Farms Bharat</SectionTitle>
          <p style={{ fontSize: 14, lineHeight: "1.6" }}>
            Fresh. Organic. Ethical. Delivered directly from our farms to your home.
          </p>

          {/* ✅ Social Icons */}
          <SocialRow>
            <SocialIcon
              href="https://www.instagram.com/prakrutifarmsbharat/"
              target="_blank"
              rel="noopener noreferrer"
              type="instagram"
              aria-label="Instagram"
            >
              <FiInstagram />
            </SocialIcon>

            <SocialIcon
              href="https://www.youtube.com/@prakrutiFarmsBH"
              target="_blank"
              rel="noopener noreferrer"
              type="youtube"
              aria-label="YouTube"
            >
              <FiYoutube />
            </SocialIcon>
          </SocialRow>
        </div>

        {/* Legal */}
        <div>
          <SectionTitle>Legal & Support</SectionTitle>
          <LinkList>
            {policyLinks.map((item) => (
              <FooterLink key={item.to} to={item.to}>
                {item.icon}
                {item.label}
              </FooterLink>
            ))}
          </LinkList>
        </div>
      </FooterGrid>

      <BottomBar>
        © {new Date().getFullYear()} Prakruti Farms Bharat. All rights reserved.
      </BottomBar>
    </Footer>
  );
}
