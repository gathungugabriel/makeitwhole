"use client";

import React from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  quantity: number;
  images?: string[];
  video_url?: string;
  item_type?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const firstImage =
    product.images && product.images.length > 0
      ? product.images[0].startsWith("http")
        ? product.images[0]
        : `http://127.0.0.1:8000${product.images[0]}`
      : null;

  const videoSrc = product.video_url
    ? product.video_url.startsWith("http")
      ? product.video_url
      : `http://127.0.0.1:8000${product.video_url}`
    : null;

  const placeholder = "/placeholder.png";

  return (
    <div className="border rounded-2xl shadow-md p-4 flex flex-col hover:shadow-lg transition bg-white overflow-hidden">
      <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3">
        {firstImage ? (
          <img src={firstImage} alt={product.name} className="w-full h-full object-cover" />
        ) : videoSrc ? (
          <video src={videoSrc} controls className="w-full h-full object-cover" />
        ) : (
          <img src={placeholder} alt="No media" className="w-full h-full object-cover" />
        )}
      </div>

      <h3 className="text-lg font-semibold truncate">{product.name}</h3>
      <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>

      <div className="flex justify-between items-center mt-2 text-sm text-gray-700">
        <span className="bg-gray-100 px-2 py-1 rounded-lg">{product.category}</span>
        <span className="font-semibold text-blue-700">${product.price ?? "—"}</span>
      </div>

      {product.item_type && (
        <div
          className={`mt-2 text-sm font-medium px-3 py-1 rounded-lg text-center ${
            product.item_type === "have"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {product.item_type === "have" ? "I Have This" : "I Need This"}
        </div>
      )}

      <Link
        href={`/dashboard/products/${product.id}`}
        className="mt-4 text-center bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
      >
        View Details
      </Link>
    </div>
  );
}
