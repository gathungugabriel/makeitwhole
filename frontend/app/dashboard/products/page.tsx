// app/dashboard/products/page.tsx
"use client";

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
  // backend may return image_url as string or string[]; we'll normalize to `images`
  image_url?: string | string[];
  images?: string[]; // <- normalized array
  video_url?: string;
}

type Role = "buyer" | "seller";

const makeItWholeCategories = [
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("buyer");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
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

        // Normalize: ensure each product has an `images` array (and keep image_url for compatibility)
        const normalized: Product[] = (data || []).map((p: any) => {
          let imgs: string[] = [];

          if (Array.isArray(p.image_url)) imgs = p.image_url;
          else if (typeof p.image_url === "string" && p.image_url.length > 0) {
            try {
              // try parse if it's JSON string
              const parsed = JSON.parse(p.image_url);
              if (Array.isArray(parsed)) imgs = parsed;
              else if (typeof parsed === "string" && parsed.length > 0) imgs = [parsed];
              else imgs = [p.image_url];
            } catch {
              imgs = [p.image_url];
            }
          } else {
            imgs = [];
          }

          // convert relative upload paths to absolute URLs for frontend display
          imgs = imgs.map((url) =>
            url && url.startsWith("http") ? url : url ? `http://127.0.0.1:8000${url.startsWith("/") ? "" : "/"}${url}` : url
          );

          return {
            ...p,
            images: imgs,
            image_url: p.image_url, // keep original if you rely on it elsewhere
          };
        });

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

  // Filter logic (name, category, description)
  useEffect(() => {
    const lower = search.toLowerCase();
    const results = products.filter(
      (p) =>
        (selectedCategory === "All" ||
          p.category?.toLowerCase() === selectedCategory.toLowerCase()) &&
        (p.name?.toLowerCase().includes(lower) ||
          p.category?.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower))
    );
    setFiltered(results);
  }, [search, selectedCategory, products]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">
          {role === "seller" ? "Your Seller Dashboard" : "Explore Products on MakeItWhole"}
        </h1>

        <Link
          href="/dashboard/create"
          className="flex items-center gap-2 text-blue-600 font-medium border border-blue-600 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition"
        >
          + Add New
        </Link>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search product name, description, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-2/3 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-1/3 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="All">All Categories</option>
          {makeItWholeCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <p className="text-gray-600">Loading products...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((product) => (
            // pass `images` prop expected by ProductCard
            <ProductCard
              key={product.id}
              product={{
                ...product,
                // ProductCard expects `images?: string[]`
                images: product.images ?? [],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
