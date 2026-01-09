// src/components/mobile/BottomTabs.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { FiHome, FiList, FiShoppingBag, FiCreditCard } from "react-icons/fi";

const Bar = styled.nav`
  position: fixed; left: 0; right: 0; bottom: 0;
  z-index: 60;
  background: #fff;
  border-top: 1px solid rgba(16,24,40,.1);
  box-shadow: 0 -8px 24px rgba(0,0,0,.06);
  padding: 10px 10px calc(10px + env(safe-area-inset-bottom, 0));
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  max-width: 560px;
  margin: 0 auto;
`;

const Item = styled(NavLink)`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 8px 6px; border-radius: 12px; text-decoration: none;
  color: #475467; font-size: 12px; line-height: 1;

  svg { font-size: 20px; }

  &.active {
    color: #e86a33; /* accent for active tab */
    background: rgba(232,106,51,.08);
  }
`;

export default function BottomTabs() {
    return (
        <Bar>
            <Row>
                <Item to="/" end>
                    <FiHome />
                    <span>Home</span>
                </Item>
                <Item to="/menu">
                    <FiList />
                    <span>Menu</span>
                </Item>
                <Item to="/my-orders">
                    <FiShoppingBag />
                    <span>Orders</span>
                </Item>
                <Item to="/accounts">
                    <FiCreditCard />
                    <span>Account</span>
                </Item>
            </Row>
        </Bar>
    );
}
