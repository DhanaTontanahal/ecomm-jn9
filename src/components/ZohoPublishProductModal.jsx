// src/components/zoho/ZohoPublishProductModal.jsx
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
    addDoc,
    collection,
    doc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytesResumable,
} from "firebase/storage";
import { db } from "../firebase/firebase";
import { storage } from "../firebase/firebase";
import { FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

/* --- tokens & small styled bits (local) --- */
const COLORS = {
    glass: "rgba(255,255,255,.06)",
    glassBorder: "rgba(255,255,255,.12)",
    glassHeader: "rgba(255,255,255,.10)",
    text: "#e7efff",
    subtext: "#b7c6e6",
    primary: "#4ea1ff",
    bg: "#0b1220",
};

// const Overlay = styled.div`
//   position: fixed;
//   inset: 0;
//   background: rgba(0, 0, 0, 0.55);
//   display: flex;
//   justify-content: center;
//   align-items: center;            /* center vertically instead of flex-start */
//   padding: 24px 12px;             /* a bit less padding, more balanced */
//   overflow: hidden;               /* outer overlay doesn't scroll */
//   z-index: 999999;
// `;

// const Card = styled.div`
//   width: min(96vw, 920px);
//   max-height: calc(90vh - 80px); /* keeps card shorter than full screen */
//   overflow-y: auto;               /* scroll inside card if content is tall */
//   background: ${COLORS.bg};
//   border-radius: 14px;
//   border: 1px solid ${COLORS.glassBorder};
//   padding: 16px;
//   color: ${COLORS.text};
// `;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 80px 12px 32px; /* ⬅ more space from top header */
  z-index: 999999;
`;

const Card = styled.div`
  width: min(96vw, 920px);
  max-height: calc(100vh - 120px);  /* ⬅ avoid going behind top/bottom */
  background: ${COLORS.bg};
  border-radius: 14px;
  border: 1px solid ${COLORS.glassBorder};
  padding: 16px;
  color: ${COLORS.text};
  overflow-y: auto;                /* ⬅ internal scroll */
`;



const Row = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  background: ${COLORS.glassHeader};
  color: ${COLORS.text};
  border: 1px solid ${COLORS.glassBorder};
  border-radius: 10px;
  padding: 8px 10px;
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(78, 161, 255, 0.6);
  }
`;

const Select = styled.select`
  width: 100%;
  background: ${COLORS.glassHeader};
  color: ${COLORS.text};
  border: 1px solid ${COLORS.glassBorder};
  border-radius: 10px;
  padding: 8px 10px;
  color-scheme: dark;
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(78, 161, 255, 0.6);
  }
  option {
    background: #121a2b;
    color: ${COLORS.text};
  }
`;

const Label = styled.label`
  font-size: 12px;
  color: ${COLORS.subtext};
  display: block;
  margin-bottom: 6px;
`;

const SmallBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid ${COLORS.glassBorder};
  background: ${COLORS.glassHeader};
  color: ${COLORS.text};
`;

const Button = styled.button`
  background: ${(p) => (p.$secondary ? COLORS.glassHeader : COLORS.primary)};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 500;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/* --- helpers (copied logic from AdminProductManager) --- */
const toSlug = (s = "") =>
    s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .replace(/^\-+|\-+$/g, "");

// "MIL-241211-0007"
function makeSku(categorySlug = "gen", seq = 1, d = new Date()) {
    const prefix = (categorySlug || "gen")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3)
        .padEnd(3, "X");
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const s = String(seq).padStart(4, "0");
    return `${prefix}-${yy}${mm}${dd}-${s}`;
}

async function getNextProductSeq(db) {
    const ref = doc(db, "counters", "productSeq");
    const seq = await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists() ? snap.data().value || 0 : 0;
        const next = current + 1;
        tx.set(ref, { value: next }, { merge: true });
        return next;
    });
    return seq;
}

function mapZohoUnitToSizeLabel(unitRaw) {
    if (!unitRaw) return "L";
    const u = String(unitRaw).trim().toLowerCase();
    if (["l", "ltr", "liter", "litre"].includes(u)) return "L";
    if (["kg", "kilogram", "kgs"].includes(u)) return "KG";
    if (["pcs", "piece", "unit", "nos", "no"].includes(u)) return "Piece";
    return "Piece";
}

/* --- main component --- */
export default function ZohoPublishProductModal({
    open,
    zohoItem,
    categories,
    onClose,
    onSaved,
}) {
    const [categoryId, setCategoryId] = useState("");
    const [categorySlug, setCategorySlug] = useState("");
    const [form, setForm] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);


    const originalZohoImageUrl =
        zohoItem?.image_url ||
        zohoItem?.image ||
        zohoItem?.product_image ||
        zohoItem?.product_image_url ||
        "";


    useEffect(() => {
        if (!open || !zohoItem) {
            setForm(null);
            setCategoryId("");
            setCategorySlug("");
            setFile(null);
            return;
        }

        const unit =
            zohoItem.unit ||
            zohoItem.unit_name ||
            zohoItem.unit_code ||
            zohoItem.unit_of_measure;

        const sizeLabel = mapZohoUnitToSizeLabel(unit);
        const zohoImageUrl =
            zohoItem.image_url ||
            zohoItem.image ||
            zohoItem.product_image ||
            zohoItem.product_image_url ||
            "";

        const base = {
            active: true,
            categoryId: null,
            categorySlug: "",
            // 🔹 Title & subtitle from Zoho
            title: zohoItem.name || "",
            subtitle: zohoItem.description || zohoItem.name || "",
            sizeLabel,
            order: 999,
            sku: zohoItem.sku || "",
            mrp: Number(zohoItem.rate || 0),
            price: Number(zohoItem.rate || 0),
            cashbackAmount: 0,
            stock: Number(zohoItem.stock_on_hand || 0),
            imageUrl: zohoImageUrl,
            imagePath: "",
            zohoItemId: zohoItem.item_id,
            zohoItemSku: zohoItem.sku || "",
        };

        setForm(base);
    }, [open, zohoItem]);


    if (!open || !zohoItem || !form) return null;

    const previewUrl = file
        ? URL.createObjectURL(file)
        : form.imageUrl || "";

    const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

    const handleCatChange = (e) => {
        const id = e.target.value;
        setCategoryId(id);
        const cat = categories.find((c) => c.id === id);
        const slug =
            cat?.slug || toSlug(cat?.displayName || cat?.title || "gen");
        setCategorySlug(slug);
    };

    async function uploadImageIfNeeded() {
        if (!file) return { url: form.imageUrl || "", path: form.imagePath || "" };

        try {
            if (form.imagePath) await deleteObject(ref(storage, form.imagePath));
        } catch (_) { }

        const basePath = `products/${categorySlug || "uncategorized"}`;
        const path = `${basePath}/${Date.now()}-${toSlug(file.name)}`;
        const storageRef = ref(storage, path);

        setUploading(true);
        setProgress(0);

        const task = uploadBytesResumable(storageRef, file, {
            cacheControl: "public,max-age=31536000",
        });

        await new Promise((resolve, reject) => {
            task.on(
                "state_changed",
                (snap) => {
                    setProgress(
                        Math.round(
                            (snap.bytesTransferred / snap.totalBytes) * 100
                        )
                    );
                },
                reject,
                resolve
            );
        });

        const url = await getDownloadURL(task.snapshot.ref);
        setUploading(false);
        return { url, path };
    }

    async function handleSave() {
        if (!categoryId) {
            toast.warn("Please select a category.");
            return;
        }

        try {
            setSaving(true);

            const { url, path } = await uploadImageIfNeeded();

            // use Zoho SKU if provided, else generate
            let sku = (form.sku || "").trim();
            if (!sku) {
                const seq = await getNextProductSeq(db);
                sku = makeSku(categorySlug || "gen", seq, new Date());
            }

            const docData = {
                ...form,
                categoryId,
                categorySlug,
                sku,
                imageUrl: url,
                imagePath: path,
                mrp: Number(form.mrp || 0),
                price: Number(form.price || 0),
                cashbackAmount:
                    form.cashbackAmount === ""
                        ? null
                        : Number(form.cashbackAmount || 0),
                stock: Number(form.stock || 0),
                order: Number(form.order || 0),
                active: !!form.active,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, "products"), docData);

            toast.success("Product published to store.");
            setSaving(false);
            onSaved?.();
            onClose?.();
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Failed to save product.");
            setSaving(false);
        }
    }

    const clearSelectedFile = () => {
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    return (
        <Overlay aria-modal="true" role="dialog">
            <Card>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: 18 }}>
                        Publish Zoho Item to Store
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            border: "none",
                            background: "transparent",
                            color: COLORS.subtext,
                            fontSize: 20,
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                <p style={{ fontSize: 13, color: COLORS.subtext, marginBottom: 12 }}>
                    Zoho Item: <b>{zohoItem.name}</b> (SKU:{" "}
                    {zohoItem.sku || "—"})
                </p>

                {/* Category selector */}
                <div style={{ marginBottom: 12 }}>
                    <Label>Category (for your store)</Label>
                    <Select value={categoryId} onChange={handleCatChange}>
                        <option value="">Select category…</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.displayName || c.title}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Product form — independent editor just for Zoho publish */}
                <div
                    style={{
                        marginTop: 8,
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${COLORS.glassBorder}`,
                        background: COLORS.glassHeader,
                    }}
                >
                    <Row style={{ marginBottom: 10 }}>
                        <div style={{ flex: 2 }}>
                            <Label>Title</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => set("title", e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 2 }}>
                            <Label>Subtitle</Label>
                            <Input
                                value={form.subtitle}
                                onChange={(e) => set("subtitle", e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Label>Size Label</Label>
                            <Select
                                value={form.sizeLabel}
                                onChange={(e) => set("sizeLabel", e.target.value)}
                            >
                                <option value="L">L</option>
                                <option value="KG">KG</option>
                                <option value="Piece">Piece</option>
                            </Select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Label>Order</Label>
                            <Input
                                type="number"
                                value={form.order}
                                onChange={(e) =>
                                    set("order", Number(e.target.value || 0))
                                }
                            />
                        </div>
                    </Row>

                    <Row style={{ marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                            <Label>SKU</Label>
                            <Input
                                value={form.sku || ""}
                                onChange={(e) => set("sku", e.target.value)}
                                placeholder="Zoho SKU or auto-generated on save"
                            />
                        </div>
                    </Row>

                    <Row style={{ marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                            <Label>
                                MRP {form.sizeLabel ? `(/ ${form.sizeLabel})` : ""}
                            </Label>
                            <Input
                                type="number"
                                value={form.mrp}
                                onChange={(e) =>
                                    set("mrp", Number(e.target.value || 0))
                                }
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Label>
                                Sale Price{" "}
                                {form.sizeLabel ? `(/ ${form.sizeLabel})` : ""}
                            </Label>
                            <Input
                                type="number"
                                value={form.price}
                                onChange={(e) =>
                                    set("price", Number(e.target.value || 0))
                                }
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Label>Cashback Amount (₹)</Label>
                            <Input
                                type="number"
                                value={
                                    form.cashbackAmount === null
                                        ? ""
                                        : form.cashbackAmount
                                }
                                onChange={(e) =>
                                    set(
                                        "cashbackAmount",
                                        e.target.value === ""
                                            ? null
                                            : Number(e.target.value || 0)
                                    )
                                }
                                placeholder="optional"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Label>
                                Enter n: Stock{" "}
                                {form.sizeLabel
                                    ? `(in order of n * ${form.sizeLabel})`
                                    : ""}
                            </Label>
                            <Input
                                type="number"
                                value={form.stock}
                                onChange={(e) =>
                                    set("stock", Number(e.target.value || 0))
                                }
                            />
                        </div>
                    </Row>

                    {/* Image upload + preview */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1.4fr 1fr",
                            gap: 12,
                            alignItems: "flex-start",
                            marginBottom: 12,
                        }}
                    >
                        <div>
                            <Label>Product Image</Label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />

                            {uploading && (
                                <div style={{ marginTop: 8, fontSize: 12 }}>
                                    <FiUpload /> Uploading… {progress}%
                                    <div
                                        style={{
                                            height: 6,
                                            background: "rgba(255,255,255,.06)",
                                            borderRadius: 6,
                                            overflow: "hidden",
                                            marginTop: 6,
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "100%",
                                                width: `${progress}%`,
                                                background: COLORS.primary,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {!!file && (
                                <div style={{ marginTop: 8 }}>
                                    <SmallBtn type="button" onClick={clearSelectedFile}>
                                        <FiX /> Clear selected file
                                    </SmallBtn>
                                </div>
                            )}

                            {/* 🔹 Optional: use original Zoho image again */}
                            {originalZohoImageUrl && (
                                <div style={{ marginTop: 10, fontSize: 12 }}>
                                    <div style={{ marginBottom: 4, color: COLORS.subtext }}>
                                        Zoho image detected
                                    </div>
                                    <SmallBtn
                                        type="button"
                                        onClick={() => {
                                            set("imageUrl", originalZohoImageUrl);
                                            clearSelectedFile();
                                        }}
                                    >
                                        Use Zoho image
                                    </SmallBtn>
                                </div>
                            )}
                        </div>

                        <div>
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="preview"
                                    style={{
                                        width: "100%",
                                        height: 160,
                                        objectFit: "cover",
                                        borderRadius: 10,
                                        border: `1px solid ${COLORS.glassBorder}`,
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: 160,
                                        borderRadius: 10,
                                        border: `1px solid ${COLORS.glassBorder}`,
                                        background: "#1b2232",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 12,
                                        color: COLORS.subtext,
                                        textAlign: "center",
                                        padding: 8,
                                    }}
                                >
                                    No image received from Zoho for this item.
                                </div>
                            )}
                        </div>

                    </div>


                    <Row style={{ marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                            <Label>Active</Label>
                            <Select
                                value={form.active ? "1" : "0"}
                                onChange={(e) =>
                                    set("active", e.target.value === "1")
                                }
                            >
                                <option value="1">Yes</option>
                                <option value="0">No</option>
                            </Select>
                        </div>
                    </Row>

                    <Row style={{ justifyContent: "flex-end", gap: 8 }}>
                        <Button
                            $secondary
                            type="button"
                            onClick={onClose}
                            disabled={saving || uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || uploading}
                        >
                            <FiUpload /> {saving ? "Saving…" : "Save"}
                        </Button>
                    </Row>
                </div>
            </Card>
        </Overlay>
    );
}
