'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';

// ✅ Define the Product type
interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  quantity: number;
  image_url?: string;
  // Add more fields as needed
}

export default function MyProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login'; // ✅ Keep client-safe redirect
      return;
    }

    fetch('http://127.0.0.1:8000/products/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized or failed to fetch');
        return res.json();
      })
      .then((data: Product[]) => setProducts(data))
      .catch((err) => {
        console.error('Error loading user products:', err);
        setError('⚠️ Failed to load your products.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-700">
        <p className="text-blue-600 font-medium">Loading your products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="bg-red-100 text-red-700 p-4 rounded">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-6 text-gray-700">
        <p className="text-gray-700 font-medium">You have no products listed.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Listings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
