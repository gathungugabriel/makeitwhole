"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    condition: "New",
    price: "",
    quantity: "1",
    image: null as File | null,
    video: null as File | null,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Redirect to login if token is missing
  useEffect(() => {
    const token = localStorage.getItem("access_token"); // ✅ Correct key
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("access_token"); // ✅ Correct key
    if (!token) {
      setError("⚠️ You must be logged in to add a product.");
      return router.push("/login");
    }

    if (!form.price || isNaN(parseFloat(form.price))) {
      setError("❌ Please enter a valid price.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("condition", form.condition);
      formData.append("price", parseFloat(form.price).toString());
      formData.append("quantity", parseInt(form.quantity).toString());
      if (form.image) formData.append("image", form.image);
      if (form.video) formData.append("video", form.video);

      const res = await fetch("http://127.0.0.1:8000/products/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to create product");
      }

      setSuccess("✅ Product created successfully!");
      setTimeout(() => router.push("/products"), 1500);
    } catch (err: any) {
      setError(err.message || "Error submitting form.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Add a New Product</h1>

      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
      {success && <p className="bg-green-100 text-green-700 p-2 rounded mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Product Name</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            placeholder="E.g. Diamond Climber Earring"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            name="description"
            required
            value={form.description}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            placeholder="Brief details about the product"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Category</label>
          <input
            type="text"
            name="category"
            required
            value={form.category}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            placeholder="E.g. Luxury Jewelry"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Condition</label>
          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          >
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Used">Used</option>
            <option value="For Parts">For Parts</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium">Price (USD)</label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              placeholder="e.g. 1090"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              required
              value={form.quantity}
              onChange={handleChange}
              className="border rounded p-2 w-full"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 font-medium">Product Image</label>
          <input type="file" name="image" accept="image/*" onChange={handleFileChange} />
        </div>

        <div>
          <label className="block mb-2 font-medium">Optional Product Video</label>
          <input type="file" name="video" accept="video/*" onChange={handleFileChange} />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full"
        >
          Submit Product
        </button>
      </form>
    </div>
  );
}
