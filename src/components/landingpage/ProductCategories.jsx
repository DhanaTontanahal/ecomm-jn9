// src/components/ProductCategories.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { db } from "../../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

/* =========================
   Styled Components
========================= */
const Wrapper = styled.div`
  padding: 40px 20px;
  max-width: 1280px;
  margin: 0 auto;
`;

const Grid = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  text-align: center;
  padding: 16px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  }
`;

const Image = styled.img`
  max-width: 100%;
  height: 160px;
  object-fit: contain;
  border-radius: 12px;
`;

const Label = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  background: #678d58; /* green accent */
  color: #fff;
  font-weight: 600;
  border-radius: 8px;
  font-size: 14px;
`;

export default function ProductCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, "productCategories"));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <Wrapper>
      <Grid>
        {categories.map((cat) => (
          <Card key={cat.id}>
            <Image src={cat.imageUrl} alt={cat.name} />
            <Label>{cat.name}</Label>
          </Card>
        ))}
      </Grid>
    </Wrapper>
  );
}
