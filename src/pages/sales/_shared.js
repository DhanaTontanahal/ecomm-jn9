import styled from "styled-components";

export {
  C,
  PageShell,
  Head,
  Input,
  Select,
  Btn,
  Card,
  Table,
  money,
  computeTotals,
  quickPdfPrint,
  nowTs,
} from "../purchases/_shared";

export const SubHead = styled.div`
  max-width: 1280px;
  margin: 0 auto 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

export const KPIGrid = styled.div`
  max-width: 1280px;
  margin: 0 auto 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

export const KPI = styled.div`
  border: 1px solid ${props => props.theme?.colors?.border || "rgba(255,255,255,.14)"};
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 6px;
  small {
    color: rgba(231, 239, 255, 0.7);
    letter-spacing: .2px;
  }
  strong {
    font-size: 22px;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  letter-spacing: .3px;
`;
