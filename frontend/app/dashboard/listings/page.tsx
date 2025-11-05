'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: number;
  name: string;
  description?: string;
  category?: string;
  condition?: string;
  price: number;
  quantity: number;
  images?: string[];
  video_url?: string;
  item_type?: 'have' | 'need';
}

export default function MyProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [replaceImages, setReplaceImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchMyProducts();
  }, []);

  async function fetchMyProducts() {
    try {
      const res = await fetch('http://127.0.0.1:8000/products/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load your products');
      const data = await res.json();

      // ✅ Normalize image structure
      const normalized = data.map((p: any) => ({
        ...p,
        images: Array.isArray(p.image_url)
          ? p.image_url
          : p.image_url
          ? [p.image_url]
          : [],
      }));

      setProducts(normalized);
    } catch (err) {
      console.error(err);
      setError('⚠️ Failed to load your products.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(productId: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete product');
      alert('✅ Product deleted successfully!');
      fetchMyProducts();
    } catch (err) {
      console.error('Delete error:', err);
      alert('❌ Failed to delete product.');
    }
  }

  function handleEdit(product: Product) {
    setSelectedProduct(product);
    setNewImages([]);
    setReplaceImages(false);
    setShowModal(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', selectedProduct.name);
      if (selectedProduct.description)
        formData.append('description', selectedProduct.description);
      if (selectedProduct.category)
        formData.append('category', selectedProduct.category);
      if (selectedProduct.condition)
        formData.append('condition', selectedProduct.condition);
      formData.append('price', selectedProduct.price.toString());
      formData.append('quantity', selectedProduct.quantity.toString());

      if (replaceImages) formData.append('replace_images', 'true');
      newImages.forEach((file) => formData.append('images', file));

      const res = await fetch(`http://127.0.0.1:8000/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to update product');
      alert('✅ Product updated successfully!');
      setShowModal(false);
      setNewImages([]);
      fetchMyProducts();
    } catch (err) {
      console.error('Update error:', err);
      alert('❌ Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-700">Loading your products...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Listings</h1>

      {products.length === 0 && <p className="text-gray-600">You have no products listed yet.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition bg-white group"
          >
            <ProductCard product={product} />
            <div className="absolute top-3 right-3 hidden group-hover:flex gap-2">
              <button
                onClick={() => handleEdit(product)}
                className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Edit Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg relative overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <input
                type="text"
                value={selectedProduct.name}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, name: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Product name"
              />
              <textarea
                value={selectedProduct.description || ''}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, description: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Description"
              ></textarea>
              <input
                type="text"
                value={selectedProduct.category || ''}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, category: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Category"
              />
              <input
                type="text"
                value={selectedProduct.condition || ''}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, condition: e.target.value })
                }
                className="w-full border rounded p-2"
                placeholder="Condition"
              />
              <input
                type="number"
                value={selectedProduct.price}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    price: parseFloat(e.target.value),
                  })
                }
                className="w-full border rounded p-2"
                placeholder="Price"
              />

              {/* ✅ Image Upload Section with Preview */}
              <div className="space-y-2">
                <label className="block font-medium text-gray-700">Upload New Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setNewImages(Array.from(e.target.files || []))}
                  className="w-full border rounded p-2"
                />

                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={replaceImages}
                    onChange={(e) => setReplaceImages(e.target.checked)}
                  />
                  <span className="text-gray-700 text-sm">
                    Replace existing images instead of adding
                  </span>
                </label>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {Array.isArray(selectedProduct.images) &&
                    !replaceImages &&
                    selectedProduct.images.map((url, idx) => {
                      const src = url.startsWith('http')
                        ? url
                        : `http://127.0.0.1:8000${url.startsWith('/') ? '' : '/'}${url}`;
                      return (
                        <img
                          key={idx}
                          src={src}
                          alt="Existing"
                          className="h-24 w-full object-cover rounded"
                        />
                      );
                    })}

                  {newImages.map((file, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(file)}
                      alt="New"
                      className="h-24 w-full object-cover rounded border"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewImages([]);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
