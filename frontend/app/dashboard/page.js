"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function fetchProducts() {
      try {
        const res = await fetch("http://127.0.0.1:8000/products/");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) return <p className="p-4">Loading products...</p>;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col justify-between">
        <div>
          <div className="p-4 text-xl font-bold">Dashboard</div>
          <nav className="flex flex-col gap-2 p-4">
            <button onClick={() => router.push("/create-product")} className="text-left hover:bg-gray-700 p-2 rounded">
              ➕ Create Product
            </button>
            <button onClick={() => router.push("/my-products")} className="text-left hover:bg-gray-700 p-2 rounded">
              📦 My Products
            </button>
            <button onClick={() => router.push("/products")} className="text-left hover:bg-gray-700 p-2 rounded">
              🛒 Browse All
            </button>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="m-4 p-2 bg-red-600 hover:bg-red-700 rounded text-center"
        >
          🚪 Logout
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-semibold mb-4">Featured Products</h1>
        {products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
