import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

const CRM_URL = "https://salesdesk.pro/";

const Wrap = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 68px); /* adjust if your header height differs */
  background: ${({ theme }) => theme.colors.panel};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const Title = styled.div`
  font-weight: 600;
  flex: 1;
`;

const Btn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
`;

const FrameWrap = styled.div`
  position: relative;
  flex: 1;
`;

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
`;

const Loading = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export default function CrmEmbed() {
    const [loading, setLoading] = useState(true);
    const [blocked, setBlocked] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        // If the iframe never fires onLoad within 4s, assume X-Frame-Options / CSP blocked
        timerRef.current = setTimeout(() => {
            if (loading) setBlocked(true);
        }, 4000);
        return () => clearTimeout(timerRef.current);
    }, [loading]);

    return (
        <Wrap>
            <TopBar>
                <Title>Embedded CRM</Title>
                <Btn onClick={() => window.open(CRM_URL, "_blank", "noopener,noreferrer")}>
                    Open in new tab
                </Btn>
            </TopBar>

            <FrameWrap>
                {loading && !blocked && <Loading>Loading CRM…</Loading>}
                {blocked && (
                    <Loading>
                        It looks like this site can’t be embedded (blocked by X-Frame-Options or CSP).
                        <div style={{ marginTop: 10 }}>
                            <Btn onClick={() => window.open(CRM_URL, "_blank", "noopener,noreferrer")}>
                                Open CRM in new tab
                            </Btn>
                        </div>
                    </Loading>
                )}

                {!blocked && (
                    <Iframe
                        src={CRM_URL}
                        allow="clipboard-read; clipboard-write; fullscreen; geolocation; microphone; camera"
                        referrerPolicy="no-referrer-when-downgrade"
                        onLoad={() => {
                            setLoading(false);
                            clearTimeout(timerRef.current);
                        }}
                    />
                )}
            </FrameWrap>
        </Wrap>
    );
}
