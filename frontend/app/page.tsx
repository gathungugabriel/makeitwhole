'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/products/')
      .then(res => res.json())
      .then(data => {
        // Show only latest 4 products
        setProducts(data.slice(0, 4));
      })
      .catch(err => console.error('Error fetching products:', err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🛍️ Featured Products</h1>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No products found.</p>
      )}
    </div>
  );
}
