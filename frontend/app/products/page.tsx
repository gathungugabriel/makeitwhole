'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('http://127.0.0.1:8000/products/');
        if (!response.ok) throw new Error('Failed to load products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) return <p className="p-4">Loading products...</p>;
  if (products.length === 0) return <p className="p-4">No products found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Available Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
