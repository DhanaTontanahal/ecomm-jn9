// src/pages/Login.jsx
import React, { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  getAuth,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { FiShield, FiCheckCircle } from "react-icons/fi";
import { useDoc } from "../hooks/useDoc";
import banner from "../../src/assets/channels4_banner.jpg";

/* ============ animations ============ */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to   { opacity: 1; transform: none; }
`;
const float = keyframes`
  0%   { transform: translateY(0px);   opacity: .95; }
  50%  { transform: translateY(-6px);  opacity: 1; }
  100% { transform: translateY(0px);   opacity: .95; }
`;
const spin = keyframes` to { transform: rotate(360deg); }`;

/* ============ layout ============ */
const Page = styled.div`
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: clamp(16px, 4vw, 32px);
  background:
    radial-gradient(1200px 600px at 10% -10%, #e7f5d8 0%, transparent 60%),
    radial-gradient(900px 600px at 100% 0%, #f2f9e9 0%, transparent 60%),
    #ffffff;
`;

const Card = styled.section`
  width: min(1100px, 100%);
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 18px 50px rgba(16, 24, 40, .12);
  display: grid;
  grid-template-columns: 1fr;
  animation: ${fadeIn} .45s ease both;

  @media (min-width: 960px) { grid-template-columns: 1.02fr 0.98fr; }
`;

const Left = styled.div`
  padding: clamp(20px, 4.8vw, 40px);
  display: grid; align-content: center; gap: clamp(14px, 2.8vw, 22px);
`;

const Brand = styled.div`
  display: flex; align-items: center; gap: 10px;
  font-weight: 900; letter-spacing: .8px; color: #202b1f;
  .logo {
    width: 40px; height: 40px; border-radius: 12px;
    display: grid; place-items: center; font-weight: 800;
    background: #eaf5e6; color: #6e8c53; border: 2px solid #ddefd9;
  }
  .name { font-size: clamp(18px, 3.6vw, 20px); }
`;

const Heading = styled.h1`
  margin: 0; color: #1f2a1e; font-weight: 900;
  font-size: clamp(20px, 4.6vw, 28px); letter-spacing: .2px;
`;

const Sub = styled.p`
  margin: 0; color: #4c574b; font-size: clamp(13px, 2.6vw, 15px); line-height: 1.65;
`;

const Bullet = styled.div`
  display: grid; gap: 8px; margin-top: 6px;
  div { display: flex; align-items: center; gap: 10px; color: #2f3a2e; font-size: 14px; }
  svg { color: #6e8c53; flex: 0 0 auto; }
`;

/* ============ right panel ============ */
const Right = styled.div`
  position: relative; display: none; overflow: clip;
  @media (min-width: 960px) { display: block; }

  .img {
    position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%;
    filter: saturate(1.02) contrast(1.02) brightness(0.98);
  }
  /* light tint (removed the heavy look that felt like blur) */
  &::after {
    content: "";
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(180deg, rgba(243,250,238,.15), rgba(237,247,231,.15));
  }

  .float {
    position: absolute; display: grid; place-items: center;
    width: 76px; height: 76px; border-radius: 24px;
    background: #fff; outline: 1px solid rgba(0,0,0,.06);
    box-shadow: 0 10px 30px rgba(16,24,40,.10);
    color: #6e8c53; animation: ${float} 4s ease-in-out infinite;
  }
  .a { top: 18%; left: 16%; animation-delay: .1s; }
  .b { top: 55%; left: 64%; animation-delay: .7s; }
  .c { top: 79%; left: 28%; animation-delay: 1.2s; }
`;

const Panel = styled.div`
  position: absolute; inset: 0; display: grid; place-items: center; padding: 28px;
`;

const PanelInner = styled.div`
  text-align: center; max-width: 520px; color: #233224;
  h3 { margin: 0 0 8px; font-weight: 900; letter-spacing: .6px; }
  p { margin: 0; opacity: .9; line-height: 1.65; font-weight: 700; }
`;

/* ============ inputs / buttons ============ */
const Actions = styled.div` display: grid; gap: 12px; margin-top: 4px; `;
const Row = styled.div`
  display: grid; grid-template-columns: 1fr auto; gap: 10px;
  @media (max-width: 520px){ grid-template-columns: 1fr; }
`;
const Input = styled.input`
  height: 46px; border-radius: 12px; border:1px solid #e5e7eb;
  padding: 0 12px; outline: 0; font-size: 15px;
`;
const Btn = styled.button`
  height: 46px; border-radius: 12px; border: 0;
  background: ${p => p.secondary ? "#f3f4f6" : "#6e8c53"};
  color: ${p => p.secondary ? "#111827" : "#fff"};
  font-weight: 900; padding: 0 16px; cursor: pointer;
  display:flex; align-items:center; justify-content:center; gap:8px;
  &:disabled{ opacity:.6; cursor:not-allowed; }
`;

const GoogleBtn = styled.button`
  appearance: none; border: 1px solid #e5e7eb; background: #fff;
  border-radius: 12px; height: 46px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  cursor: pointer; font-weight: 800; letter-spacing: .2px; color: #1f2937;
  transition: transform .12s ease, box-shadow .18s ease, background .2s ease;
  box-shadow: 0 6px 18px rgba(16,24,40,.06);
  &:hover   { background: #f9fafb; box-shadow: 0 10px 24px rgba(16,24,40,.08); }
  &:active  { transform: translateY(1px); }
  &:disabled{ opacity: .7; cursor: not-allowed; }
  .g {
    width: 18px; height: 18px; display: inline-block;
    background: conic-gradient(from 0deg, #ea4335 0 25%, #fbbc05 0 50%, #34a853 0 75%, #4285f4 0 100%);
    -webkit-mask: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23000' d='M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.3 29.5 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21 21-9.3 21-21c0-1.2-.1-2.3-.4-3.5z'/%3E%3C/svg%3E") center/contain no-repeat;
            mask: url("data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23000' d='M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.3 29.5 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21 21-9.3 21-21c0-1.2-.1-2.3-.4-3.5z'/%3E%3C/svg%3E") center/contain no-repeat;
  }
  .spinner {
    width: 16px; height: 16px; border-radius: 999px;
    border: 2px solid #e5e7eb; border-top-color: #6e8c53; animation: ${spin} .8s linear infinite;
  }
`;

const Fine = styled.div`
  font-size: 12px; color: #6b7280; text-wrap: balance;
  a { color: #2f6f2b; text-decoration: none; font-weight: 700; }
`;

const Alert = styled.div`
  background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;
  border-radius: 10px; padding: 10px 12px; font-size: 13px;
`;

const SmallOr = styled.div`
  text-align:center; color:#6b7280; font-size:13px; position:relative; margin: 6px 0 2px;
  &:before, &:after {
    content:""; position:absolute; top:50%; width:36%; height:1px; background:#e5e7eb;
  }
  &:before{ left:0; } &:after{ right:0; }
`;

/* ============ quotes ============ */
const QUOTES = [
  "Eat clean, live green. 🌱",
  "Nature’s recipe for health is simple: real food.",
  "Short ingredient list, long life list.",
  "Good soil. Good seed. Good you.",
  "Pure food is the first medicine.",
  "From farm to you — nothing in between.",
];

/* ============ component ============ */
export default function Login() {
  const nav = useNavigate();
  const { state } = useLocation();
  const { loginWithGoogle } = useAuth();
  const auth = getAuth();

  // optional: dynamic copy
  const { data: content, loading: contentLoading } = useDoc("appContent", "loginPage");
  const brandName = content?.brandName ?? "Prakruti Farms Bharath !";
  const logoText = content?.logoText ?? "PF";
  const heading = content?.heading ?? "Sign in to your space";
  const sub = content?.sub ?? "Secure access for your self. Use Google account or OTP to continue.";
  const termsUrl = content?.termsUrl ?? "#";
  const privacyUrl = content?.privacyUrl ?? "#";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // phone auth state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const confirmationRef = useRef(null);

  // reCAPTCHA (invisible, managed by Firebase)
  const recaptchaRef = useRef(null);
  const ensureRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(getAuth(), "recaptcha-container", {
        size: "invisible",
        "expired-callback": () => { /* noop */ },
      });
    }
    return recaptchaRef.current;
  };
  const resetRecaptcha = () => {
    try { recaptchaRef.current?.clear?.(); } catch { }
    recaptchaRef.current = null;
  };

  // helpers
  const waitForUser = async () => {
    if (auth.currentUser) return auth.currentUser;
    return await new Promise((resolve, reject) => {
      const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u || null); }, (e) => { unsub(); reject(e); });
    });
  };
  const formatE164 = (raw) => {
    const digits = String(raw || "").replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (digits.startsWith("+")) return digits;
    return `+${digits}`;
  };

  async function ensureUserRecordAndRole(user) {
    const userRef = doc(db, "users", user.uid);
    const metaRef = doc(db, "appMeta", "bootstrap");
    await runTransaction(db, async (tx) => {
      const metaSnap = await tx.get(metaRef);
      const isFirstAdmin = !metaSnap.exists() || metaSnap.data()?.hasAdmin !== true;

      const userSnap = await tx.get(userRef);
      const existing = userSnap.exists() ? userSnap.data() : null;
      const existingRole = existing?.role;

      if (isFirstAdmin) {
        tx.set(metaRef, {
          hasAdmin: true,
          firstAdminUid: user.uid,
          firstAdminEmail: user.email || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      const roleToSet = existingRole ?? (isFirstAdmin ? "admin" : "user");
      const payload = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        phoneNumber: user.phoneNumber || "",
        provider: user.providerData?.[0]?.providerId || "phone",
        isDisabled: existing?.isDisabled ?? false,
        role: roleToSet,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (!existing) payload.createdAt = serverTimestamp();
      tx.set(userRef, payload, { merge: true });
    });
  }

  // Google login
  async function onLoginGoogle() {
    setErr(""); setLoading(true);
    try {
      const cred = await loginWithGoogle();
      const user = cred?.user || (await waitForUser());
      if (!user) throw new Error("Login completed but no user is available.");
      await ensureUserRecordAndRole(user);
      nav((state && state.from && state.from.pathname) || "/", { replace: true });
    } catch (e) {
      console.error("Login failed:", e);
      setErr(e?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Send OTP
  async function onSendOtp() {
    setErr("");
    const formatted = formatE164(phone);
    if (!/^\+\d{10,15}$/.test(formatted)) { setErr("Enter a valid mobile number."); return; }
    try {
      setOtpSending(true);
      const verifier = ensureRecaptcha();
      const confirmation = await signInWithPhoneNumber(getAuth(), formatted, verifier);
      confirmationRef.current = confirmation;
      setOtpSent(true);
    } catch (e) {
      console.error("OTP send error:", e);
      setErr(
        e?.code === "auth/too-many-requests"
          ? "Too many attempts from this device. Please try again later or use a test number while developing."
          : (String(e?.code || "").includes("captcha") ? "Captcha failed. Check Authorized Domains and try again."
            : (e?.message || "Could not send OTP. Try again."))
      );
      resetRecaptcha();
    } finally {
      setOtpSending(false);
    }
  }

  // Verify OTP
  async function onVerifyOtp() {
    setErr("");
    if (!confirmationRef.current) { setErr("Please request an OTP first."); return; }
    if (!otp || otp.length < 4) { setErr("Enter the 6-digit OTP."); return; }
    try {
      setOtpVerifying(true);
      const cred = await confirmationRef.current.confirm(otp);
      const user = cred?.user || (await waitForUser());
      if (!user) throw new Error("Verification succeeded but no user is available.");
      await ensureUserRecordAndRole(user);
      nav((state && state.from && state.from.pathname) || "/", { replace: true });
    } catch (e) {
      console.error("OTP verify error:", e);
      setErr(e?.message || "Invalid OTP. Please try again.");
      resetRecaptcha();
    } finally {
      setOtpVerifying(false);
    }
  }

  // quotes ticker
  const [qIdx, setQIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setQIdx(i => (i + 1) % QUOTES.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <Page>
      {/* Invisible reCAPTCHA mount (keep in DOM; hidden) */}
      <div id="recaptcha-container" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }} />

      <Card>
        {/* LEFT: Phone OTP first */}
        <Left>
          <Brand>
            <div className="logo">{logoText}</div>
            <div className="name">{brandName}</div>
          </Brand>

          <Heading>{heading}</Heading>
          <Sub>{sub}</Sub>

          <Bullet>
            <div><FiCheckCircle /> Be healthy with organic foods</div>
            <div><FiCheckCircle /> Good food , good health</div>
            <div><FiCheckCircle /> Healthy lifestyle and habits with our products</div>
          </Bullet>

          {err && <Alert role="alert">{err}</Alert>}

          <Actions>
            {/* Phone + Send OTP */}
            <Row>
              <Input
                placeholder="Mobile number (India)"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
              />
              <Btn onClick={onSendOtp} disabled={otpSending || otpSent}>
                {otpSending ? "Sending…" : "Send OTP"}
              </Btn>
            </Row>

            {/* OTP verify */}
            {otpSent && (
              <>
                <Row>
                  <Input
                    placeholder="Enter 6-digit OTP"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                  <Btn onClick={onVerifyOtp} disabled={otpVerifying}>
                    {otpVerifying ? "Verifying…" : "Verify & Sign in"}
                  </Btn>
                </Row>

                <Row style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Btn secondary onClick={() => { setOtpSent(false); setOtp(""); }}>
                    Change number
                  </Btn>
                  <Btn onClick={onSendOtp} disabled={otpSending}>
                    Resend OTP
                  </Btn>
                </Row>
              </>
            )}

            <SmallOr>or</SmallOr>

            {/* Google second */}
            <GoogleBtn
              onClick={onLoginGoogle}
              disabled={loading || contentLoading}
              aria-busy={loading || contentLoading}
            >
              {!(loading || contentLoading) ? (
                <>
                  <span className="g" aria-hidden="true" />
                  Continue with Google
                </>
              ) : (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Signing in…
                </>
              )}
            </GoogleBtn>

            <Fine>
              By continuing you agree to our{" "}
              <a href={termsUrl} target="_blank" rel="noreferrer">Terms</a> &{" "}
              <a href={privacyUrl} target="_blank" rel="noreferrer">Privacy</a>.
            </Fine>
          </Actions>
        </Left>

        {/* RIGHT: Banner + quotes */}
        <Right aria-hidden="true">
          <img className="img" src={banner} alt="Organic channels banner" />
          <Panel>
            <PanelInner>
              <h3>Welcome Back !</h3>
              <p style={{color:'white'}}>{QUOTES[qIdx]}</p>
            </PanelInner>
          </Panel>

          <div className="float a"><FiShield size={26} /></div>
          <div className="float b"><FiCheckCircle size={26} /></div>
          <div className="float c"><FiShield size={22} /></div>
        </Right>
      </Card>
    </Page>
  );
}
