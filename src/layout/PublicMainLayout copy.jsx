// src/layout/PublicLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import styled from "styled-components";
import BottomTabs from "../components/mobile/BottomTabs";

const Wrap = styled.div`
  min-height: 100dvh;
  /* leave room for the tab bar on mobile */
  padding-bottom: 76px;

  @media (min-width: 769px) {
    padding-bottom: 0;
  }
`;

export default function PublicMainLayout({ children }) {
    return (
        <Wrap>
            {children ?? <Outlet />}
            <BottomTabs />
        </Wrap>
    );
}
