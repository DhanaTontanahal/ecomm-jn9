// src/layout/PublicLayout.jsx
import React from "react";
import styled from "styled-components";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Wrap = styled.div`
  min-height: 100dvh;               /* better on mobile than 100vh */
  display: grid;
  grid-template-rows: auto 1fr auto;/* let header/footer size themselves */
`;

const Main = styled.main`
  min-width: 0;                     /* prevent horizontal blowouts */
  overflow-x: hidden;               /* no sideways scroll from children */
  isolation: isolate;               /* fixes some z-index stacking oddities */
`;

export default function PublicLayout({ children }) {
  return (
    <Wrap>
      <Header />
      <Main>{children}</Main>
      <Footer />
    </Wrap>
  );
}
