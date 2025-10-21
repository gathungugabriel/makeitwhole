'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';

export default function AllProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetch('http://127.0.0.1:8000/products/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch((err) => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading products...</p>;
  if (products.length === 0) return <p>No products found.</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
