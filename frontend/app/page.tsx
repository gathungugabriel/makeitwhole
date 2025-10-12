"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/products/")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Available Products</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-xl p-4 shadow-md hover:shadow-lg transition"
            >
              {product.image_url && (
                <img
                  src={`http://127.0.0.1:8000${product.image_url}`}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-md mb-3"
                />
              )}
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-600">
                {product.description || "No description available"}
              </p>
              <p className="mt-2 text-green-700 font-bold">
                {product.condition || "Unknown condition"}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
