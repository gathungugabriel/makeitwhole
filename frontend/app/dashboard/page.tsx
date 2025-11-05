'use client';

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  quantity: number;
  item_type: "have" | "need";
  images?: string[];
  video_url?: string;
}

type Role = "buyer" | "seller";

const makeItWholeCategories = [
  "All Categories",
  "Electronics",
  "Fashion",
  "Computing",
  "Phones & Tablets",
  "Gaming",
  "Appliances",
  "Beauty & Health",
  "Baby Products",
  "Home & Office",
  "Groceries",
  "Automobile",
  "Books & Stationery",
  "Sports & Fitness",
  "Toys & Games",
  "Musical Instruments",
  "Pet Supplies",
  "Garden & Outdoors",
  "Tools & Hardware",
  "Jewelry & Watches",
  "Furniture",
  "Cameras & Photography",
  "Arts & Crafts",
  "Other",
];

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("buyer");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedRole = localStorage.getItem("user_role") as Role;

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedRole === "seller" || storedRole === "buyer") {
      setRole(storedRole);
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/products/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();

        // ✅ Normalize images so all products have an array of image URLs
        const normalized = data.map((p: any) => ({
          ...p,
          images: Array.isArray(p.image_url)
            ? p.image_url
            : p.image_url
            ? [p.image_url]
            : [],
        }));

        setProducts(normalized);
        setFiltered(normalized);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  // ✅ Live filtering (search + category)
  useEffect(() => {
    const lower = search.toLowerCase();

    const results = products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower) ||
        p.category?.toLowerCase().includes(lower) ||
        p.item_type?.toLowerCase().includes(lower);

      const matchesCategory =
        selectedCategory === "All Categories" ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });

    setFiltered(results);
  }, [search, selectedCategory, products]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">
          {role === "seller"
            ? "Your Seller Dashboard"
            : "Explore Products on MakeItWhole"}
        </h1>

        <Link
          href="/dashboard/create"
          className="flex items-center gap-2 text-blue-600 font-medium border border-blue-600 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition"
        >
          + Add New
        </Link>
      </div>

      {/* ✅ Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, description, category, or have/need..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-2/3 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-1/3 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {makeItWholeCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Product Grid */}
      {loading ? (
        <p className="text-gray-600">Loading products...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
