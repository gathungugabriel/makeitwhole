"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";

export default function MyProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://127.0.0.1:8000/products/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch((err) => {
        console.error("Error loading user products:", err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <p className="p-4">Loading your products...</p>;
  if (products.length === 0) return <p className="p-4">You have no products listed.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
