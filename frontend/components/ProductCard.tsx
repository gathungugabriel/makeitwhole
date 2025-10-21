'use client';

import Link from 'next/link';

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  condition?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const imageSrc = product.image_url
    ? product.image_url.startsWith('http')
      ? product.image_url
      : `http://127.0.0.1:8000${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`
    : null;

  return (
    <Link href={`/dashboard/products/${product.id}`} className="block">
      <div className="border rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
            No image
          </div>
        )}

        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2">{product.name}</h2>
          <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-green-600 font-semibold">
              ${product.price.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">
              {product.category || 'Uncategorized'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
