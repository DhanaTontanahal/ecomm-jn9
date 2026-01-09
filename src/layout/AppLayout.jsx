// src/layout/AppLayout.jsx
import { Outlet } from "react-router-dom";
import styled from "styled-components";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import Footer from "../components/Footer";

const Shell = styled.div`
  /* Mobile-safe viewport & no sideways scroll */
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;   /* let header/footer size themselves */
  overflow-x: hidden;
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);  /* content can shrink without overflow */
  min-height: 0;   /* allow children to size properly */
  /* collapse to single column on tablets/phones */
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const Aside = styled.aside`
  /* keep sidebar visible when scrolling on desktop */
  position: sticky;
  top: 0;                 /* header is a separate row, so this sticks under it */
  align-self: start;
  height: fit-content;
  max-height: calc(100dvh - 0px);
  overflow: auto;
  border-right: 1px solid rgba(0,0,0,.06);

  /* hide the fixed sidebar on small screens (use your Header drawer instead) */
  @media (max-width: 960px) {
    display: none;
  }
`;

const Content = styled.main`
  padding: clamp(12px, 2.5vw, 20px);
  min-width: 0;            /* critical: prevents horizontal blowouts */
  overflow-x: hidden;       /* belt & suspenders */
  isolation: isolate;       /* fixes z-index oddities with sticky children */
`;

export default function AppLayout() {
  return (
    <Shell>
      <Header />
      <Body>
        <Aside>
          <SideMenu />
        </Aside>
        <Content>
          <Outlet />
        </Content>
      </Body>
      <Footer />
    </Shell>
  );
}
