"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  condition?: string;
  image_url?: string | string[];
  item_type?: string;
  video_url?: string | null;
  owner_id?: number;
}

async function getProduct(id: string, token?: string): Promise<Product | null> {
  try {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`http://127.0.0.1:8000/products/${id}`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (typeof data.image_url === "string") {
      try {
        const parsed = JSON.parse(data.image_url);
        if (Array.isArray(parsed)) data.image_url = parsed;
      } catch {
        /* ignore parse errors */
      }
    }
    return data;
  } catch (error) {
    console.error("❌ Failed to fetch product:", error);
    return null;
  }
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    const fetchUser = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          setUserId(user.id);
        }
      } catch (err) {
        console.error("❌ Failed to fetch current user:", err);
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    (async () => {
      const p = await getProduct(id, token || undefined);
      if (!p) notFound();
      setProduct(p);
      setLoading(false);
    })();
  }, [id]);

  async function refreshProduct() {
    const updated = await getProduct(id, token || undefined);
    if (updated) setProduct(updated);
  }

  async function handleDeleteImage(imageUrl: string) {
    if (!product || !token) return;
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/products/${product.id}/images`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_url: imageUrl }),
        }
      );

      if (!res.ok) throw new Error("Failed to delete image");
      alert("✅ Image deleted successfully!");
      await refreshProduct();
    } catch (err) {
      console.error("❌ Delete image error:", err);
      alert("❌ Failed to delete image.");
    }
  }

  async function handleReplaceImage(oldUrl: string) {
    if (!product || !token || !newImageFile) {
      alert("Please select a new image file first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("old_image_url", oldUrl);
      formData.append("new_image", newImageFile);

      const res = await fetch(
        `http://127.0.0.1:8000/products/${product.id}/replace-image`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Failed to replace image");
      alert("✅ Image replaced successfully!");
      setNewImageFile(null);
      await refreshProduct();
    } catch (err) {
      console.error("❌ Replace image error:", err);
      alert("❌ Failed to replace image.");
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!product) return notFound();

  const imageUrls: string[] = Array.isArray(product.image_url)
    ? product.image_url.map((url) =>
        url.startsWith("http")
          ? url
          : `http://127.0.0.1:8000${url.startsWith("/") ? "" : "/"}${url}`
      )
    : product.image_url
    ? [
        product.image_url.startsWith("http")
          ? product.image_url
          : `http://127.0.0.1:8000${
              product.image_url.startsWith("/") ? "" : "/"
            }${product.image_url}`,
      ]
    : [];

  const isHave = product.item_type === "have";
  const badgeText = isHave ? "Have" : "Need";
  const badgeColor = isHave ? "bg-green-600" : "bg-yellow-500";
  const isOwner = userId && product.owner_id === userId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {/* Product type badge */}
      <div
        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs text-white font-semibold ${badgeColor} z-10`}
      >
        {badgeText}
      </div>

      {/* Image grid */}
      {imageUrls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {imageUrls.map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt={`${product.name} image ${i + 1}`}
                className="w-full h-64 object-cover rounded-lg shadow cursor-pointer hover:opacity-90 transition"
                onClick={() => setSelectedImage(src)}
              />

              {/* Owner controls */}
              {isOwner && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleDeleteImage(src)}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>

                  <label className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewImageFile(file);
                          handleReplaceImage(src);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-80 flex items-center justify-center bg-gray-100 text-gray-400 mb-6 rounded-lg">
          No image available
        </div>
      )}

      {/* Product info */}
      <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
      {product.description && (
        <p className="text-gray-600 mb-4">{product.description}</p>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-6">
        <div>
          <strong>Price:</strong> ${product.price.toFixed(2)}
        </div>
        {product.category && (
          <div>
            <strong>Category:</strong> {product.category}
          </div>
        )}
        {product.condition && (
          <div>
            <strong>Condition:</strong> {product.condition}
          </div>
        )}
      </div>

      {/* Image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full-size preview"
            className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
          />
          <button
            className="absolute top-5 right-5 text-white text-3xl font-bold"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
