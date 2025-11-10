"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Product {
  id: number;
  name: string;
  description?: string;
  category?: string;
  condition?: string;
  price: number;
  quantity: number;
  images?: string[];
  video_url?: string;
  item_type?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const placeholder = "/placeholder.png";

export default function ProductCard({ product }: { product: Product }) {
  const firstImage =
    product.images && product.images.length > 0
      ? product.images[0].startsWith("http")
        ? product.images[0]
        : `${API_BASE_URL}${product.images[0].startsWith("/") ? "" : "/"}${product.images[0]}`
      : null;

  const videoSrc = product.video_url
    ? product.video_url.startsWith("http")
      ? product.video_url
      : `${API_BASE_URL}${product.video_url.startsWith("/") ? "" : "/"}${product.video_url}`
    : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="border rounded-2xl shadow-md p-4 flex flex-col hover:shadow-lg bg-white overflow-hidden"
    >
      <div className="relative w-full h-52 rounded-xl overflow-hidden mb-3 bg-gray-100">
        {firstImage ? (
          <img
            src={firstImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : videoSrc ? (
          <video
            src={videoSrc}
            controls
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <img
            src={placeholder}
            alt="No media"
            className="w-full h-full object-cover"
          />
        )}

        {/* Item type badge */}
        {product.item_type && (
          <span
            className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full shadow ${
              product.item_type === "have"
                ? "bg-green-600 text-white"
                : "bg-yellow-500 text-white"
            }`}
          >
            {product.item_type === "have" ? "I Have" : "I Need"}
          </span>
        )}
      </div>

      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{product.description}</p>

        <div className="flex justify-between items-center text-sm text-gray-700 mb-2">
          <span className="bg-gray-100 px-2 py-1 rounded-lg">
            {product.category || "Uncategorized"}
          </span>
          <span className="font-bold text-blue-700">
            ${product.price?.toFixed(2) ?? "—"}
          </span>
        </div>

        {product.condition && (
          <p className="text-xs text-gray-500 italic">Condition: {product.condition}</p>
        )}
      </div>

      <Link
        href={`/dashboard/products/${product.id}`}
        className="mt-4 text-center bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
      >
        View Details
      </Link>
    </motion.div>
  );
}
