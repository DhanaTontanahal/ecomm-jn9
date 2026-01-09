// src/pages/BecomeBusinessPartner.jsx
import React, { useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";

const TOK = { maxW:"960px", bg:"#fff", tint:"#fdece6", ink:"#2c3137", sub:"#707680", line:"rgba(16,24,40,.10)", card:"#fff", primary:"#5b7c3a" };
const Global = createGlobalStyle`body{font-family:Inter,ui-sans-serif;color:${TOK.ink};background:${TOK.bg}}`;
const Page = styled.div`min-height:100dvh;`;
const Head = styled.header`background:${TOK.tint};border-bottom-left-radius:28px;border-bottom-right-radius:28px;padding:12px 16px 18px;`;
const Bar = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const Back = styled.button`border:0;background:transparent;padding:8px;border-radius:12px;cursor:pointer;color:${TOK.ink};`;
const H1 = styled.h1`margin:12px 0 0;font-size:clamp(22px,4.8vw,28px);font-weight:900;`;
const Wrap = styled.div`max-width:${TOK.maxW};margin:0 auto;padding:12px 14px 24px;display:grid;gap:12px;`;
const Card = styled.div`background:${TOK.card};border:1px solid ${TOK.line};border-radius:18px;padding:16px;display:grid;gap:10px;`;
const Input = styled.input`height:44px;border:1px solid ${TOK.line};border-radius:12px;padding:0 12px;`;
const Area = styled.textarea`min-height:140px;border:1px solid ${TOK.line};border-radius:12px;padding:12px;`;
const Primary = styled.button`border:0;background:${TOK.primary};color:#fff;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer;`;

export default function BecomeBusinessPartner(){
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name:"", phone:"", company:"", message:"" });
  const on = (k)=>(e)=> setForm(s=>({...s,[k]:e.target.value}));

  const submit = async ()=>{
    if (!user) return nav("/login");
    const payload = { ...form, uid:user.uid, email:user.email||"", status:"NEW", createdAt: serverTimestamp() };
    await addDoc(collection(db,"requestsBusinessPartner"), payload);
    alert("Thanks! We'll get back to you.");
    nav(-1);
  };

  return (
    <Page>
      <Global />
      <Head>
        <Bar>
          <Back onClick={()=>nav(-1)}><FiChevronLeft size={22}/></Back><div/>
        </Bar>
        <H1>Become Business Partner</H1>
      </Head>
      <Wrap>
        <Card>
          <Input placeholder="Your name" value={form.name} onChange={on("name")}/>
          <Input placeholder="Phone" value={form.phone} onChange={on("phone")}/>
          <Input placeholder="Company (optional)" value={form.company} onChange={on("company")}/>
          <Area placeholder="Tell us how you'd like to partner" value={form.message} onChange={on("message")}/>
          <Primary onClick={submit}>Submit request</Primary>
          <div style={{color:TOK.sub,fontSize:12}}>Saved at <code>requestsBusinessPartner</code></div>
        </Card>
      </Wrap>
    </Page>
  );
}
