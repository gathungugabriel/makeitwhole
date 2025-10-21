'use client';

import { useEffect, useState } from 'react';

interface ProductForm {
  name: string;
  description: string;
  category: string;
  condition: string;
  price: string;
  quantity: string;
  image: File | null;
  video: File | null;
}

export default function CreateProductPage() {
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    category: '',
    condition: 'New',
    price: '',
    quantity: '1',
    image: null,
    video: null,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const inputStyles =
    'border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded p-3 w-full placeholder-gray-400 text-gray-900';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

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
    setError('');
    setSuccess('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('⚠️ You must be logged in to add a product.');
      return (window.location.href = '/login');
    }

    if (!form.price || isNaN(parseFloat(form.price))) {
      setError('❌ Please enter a valid price.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('condition', form.condition);
      formData.append('price', parseFloat(form.price).toString());
      formData.append('quantity', parseInt(form.quantity).toString());
      if (form.image) formData.append('image', form.image);
      if (form.video) formData.append('video', form.video);

      const res = await fetch('http://127.0.0.1:8000/products/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to create product');
      }

      setSuccess('✅ Product created successfully!');
      setRedirecting(true);
      setTimeout(() => {
        window.location.href = '/dashboard/listings';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error submitting form.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Add a New Product</h1>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
      {success && <p className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</p>}
      {redirecting && <p className="text-blue-600 text-sm text-center">Redirecting...</p>}

      <form onSubmit={handleSubmit} className="space-y-6 text-gray-800">
        {/* Name */}
        <div>
          <label className="block mb-2 font-semibold">Product Name</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className={inputStyles}
            placeholder="E.g. Wireless Earbuds (Missing Case)"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 font-semibold">Description</label>
          <textarea
            name="description"
            required
            value={form.description}
            onChange={handleChange}
            className={inputStyles}
            placeholder="Describe the item and what's missing."
          />
        </div>

        {/* Category */}
        <div>
          <label className="block mb-2 font-semibold">Category</label>
          <input
            type="text"
            name="category"
            required
            value={form.category}
            onChange={handleChange}
            className={inputStyles}
            placeholder="E.g. Electronics, Accessories, Gadgets"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block mb-2 font-semibold">Condition</label>
          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className={inputStyles}
          >
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Used">Used</option>
            <option value="For Parts">For Parts</option>
          </select>
        </div>

        {/* Price & Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Price (USD)</label>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={handleChange}
              className={inputStyles}
              placeholder="e.g. 29.99"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              required
              value={form.quantity}
              onChange={handleChange}
              className={inputStyles}
            />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block mb-2 font-semibold">Product Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            className="text-gray-800"
          />
        </div>

        {/* Video */}
        <div>
          <label className="block mb-2 font-semibold">Optional Product Video</label>
          <input
            type="file"
            name="video"
            accept="video/*"
            onChange={handleFileChange}
            className="text-gray-800"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 text-white font-medium px-6 py-3 rounded hover:bg-blue-700 transition w-full"
        >
          Submit Product
        </button>
      </form>
    </div>
  );
}
