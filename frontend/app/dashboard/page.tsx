'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  quantity: number;
  image_url?: string;
  // Extend as needed
}

type Role = 'buyer' | 'seller';

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>('buyer'); // default role
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedRole = localStorage.getItem('user_role') as Role;

    if (!token) {
      router.push('/login');
      return;
    }

    if (storedRole === 'seller' || storedRole === 'buyer') {
      setRole(storedRole);
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/products/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">
        {role === 'seller' ? 'Your Seller Dashboard' : 'Explore Products on MakeItWhole'}
      </h1>

      {loading ? (
        <p className="text-gray-600">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
