// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  condition?: string;
  image_url?: string;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/products/${id}`, {
      cache: 'no-store', // always fresh
    });

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) return notFound();

  const imageSrc = product.image_url
    ? product.image_url.startsWith('http')
      ? product.image_url
      : `http://127.0.0.1:8000${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {imageSrc ? (
        <img src={imageSrc} alt={product.name} className="w-full h-80 object-cover rounded-lg mb-6" />
      ) : (
        <div className="w-full h-80 flex items-center justify-center bg-gray-100 text-gray-400 mb-6 rounded-lg">
          No image available
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
      <p className="text-gray-600 mb-4">{product.description}</p>

      <div className="flex gap-4 text-sm text-gray-700 mb-6">
        <div>
          <strong>Price:</strong> ${product.price.toFixed(2)}
        </div>
        {product.category && (
          <div>
            <strong>Category:</strong> {product.category}
          </div>
        )}
        {product.condition && (
          <div>
            <strong>Condition:</strong> {product.condition}
          </div>
        )}
      </div>

      {/* 🔒 Future: Add Message Seller Button here */}
      {/* <button className="bg-blue-600 text-white px-4 py-2 rounded">Message Seller</button> */}
    </div>
  );
}
