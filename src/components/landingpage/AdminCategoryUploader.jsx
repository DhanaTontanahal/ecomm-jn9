// src/admin/AdminCategoryUploader.jsx
import React, { useState } from "react";
import styled from "styled-components";
import { db, storage } from "../../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const Wrapper = styled.div`
  max-width: 600px;
  margin: 40px auto;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
`;

const Field = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-weight: 600;
    font-size: 14px;
  }

  input {
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #ddd;
    font-size: 14px;
  }
`;

const Button = styled.button`
  background: #678d58;
  color: #fff;
  border: none;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s;

  &:hover {
    background: #567a49;
  }
`;

export default function AdminCategoryUploader() {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!name || !imageFile) return alert("Please fill all fields");

    try {
      const imageRef = ref(storage, `categories/${uuidv4()}-${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      const downloadUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, "productCategories"), {
        name,
        imageUrl: downloadUrl,
        createdAt: new Date(),
      });

      setName("");
      setImageFile(null);
      alert("Category uploaded successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    }
  };

  return (
    <Wrapper>
      <form onSubmit={handleUpload}>
        <Field>
          <label>Category Name</label>
          <input
            type="text"
            placeholder="e.g. Pulses, Spices"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field>
          <label>Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />
        </Field>

        <Button type="submit">Save Category</Button>
      </form>
    </Wrapper>
  );
}
