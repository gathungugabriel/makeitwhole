"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const makeItWholeCategories = [
  "Electronics", "Fashion", "Computing", "Phones & Tablets", "Gaming", "Appliances",
  "Beauty & Health", "Baby Products", "Home & Office", "Groceries", "Automobile",
  "Books & Stationery", "Sports & Fitness", "Toys & Games", "Musical Instruments",
  "Pet Supplies", "Garden & Outdoors", "Tools & Hardware", "Jewelry & Watches",
  "Furniture", "Cameras & Photography", "Arts & Crafts", "Other",
];

const productConditions = [
  "New", "Like New", "Used - Good", "Used - Fair", "For Parts / Not Working",
];

export default function CreateProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    condition: "",
    have_or_need: "",
    price: "",
    quantity: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length + images.length > 5) {
      alert("You can upload a maximum of 5 images.");
      return;
    }
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImages([...images, ...files]);
    setPreviewImages([...previewImages, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setVideo(file);
      setPreviewVideo(URL.createObjectURL(file));
    }
  };

  const handleRemoveVideo = () => {
    setVideo(null);
    setPreviewVideo(null);
  };

  const handleCancel = () => {
    if (confirm("Cancel product creation? All unsaved data will be lost.")) {
      router.push("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Please log in first.");
      router.push("/login");
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    images.forEach((img) => data.append("images", img));
    if (video) data.append("video", video);

    try {
      const res = await fetch("http://127.0.0.1:8000/products/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) throw new Error("Failed to create product");
      router.push("/dashboard");
    } catch (err) {
      alert("Error creating product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Add a New Product</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Product name" value={formData.name}
            onChange={handleChange} required
            className="w-full border rounded-xl px-4 py-2" />
          <textarea name="description" placeholder="Description" rows={3}
            value={formData.description} onChange={handleChange} required
            className="w-full border rounded-xl px-4 py-2" />

          <select name="category" value={formData.category}
            onChange={handleChange} required
            className="w-full border rounded-xl px-4 py-2">
            <option value="">Select category</option>
            {makeItWholeCategories.map((cat) => <option key={cat}>{cat}</option>)}
          </select>

          <select name="condition" value={formData.condition}
            onChange={handleChange} required
            className="w-full border rounded-xl px-4 py-2">
            <option value="">Select condition</option>
            {productConditions.map((c) => <option key={c}>{c}</option>)}
          </select>

          <select name="have_or_need" value={formData.have_or_need}
            onChange={handleChange} required
            className="w-full border rounded-xl px-4 py-2">
            <option value="">I Have or Need?</option>
            <option value="have">I Have This</option>
            <option value="need">I Need This</option>
          </select>

          <div className="flex gap-4">
            <input type="number" name="price" placeholder="Price (optional)"
              value={formData.price} onChange={handleChange}
              className="w-1/2 border rounded-xl px-4 py-2" />
            <input type="number" name="quantity" placeholder="Quantity" required
              value={formData.quantity} onChange={handleChange}
              className="w-1/2 border rounded-xl px-4 py-2" />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Upload Images (max 5)</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange}
              className="block w-full text-sm text-gray-600" />
            <div className="grid grid-cols-3 gap-2 mt-3">
              {previewImages.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="preview" className="w-full h-24 object-cover rounded-lg" />
                  <button type="button" onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded-full">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Upload Video (optional)</label>
            <input type="file" accept="video/*" onChange={handleVideoChange}
              className="block w-full text-sm text-gray-600" />
            {previewVideo && (
              <div className="relative mt-3">
                <video src={previewVideo} controls className="w-full h-48 rounded-lg" />
                <button type="button" onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">✕</button>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button type="button" onClick={handleCancel}
              className="px-6 py-2 border rounded-xl hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              {loading ? "Saving..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
