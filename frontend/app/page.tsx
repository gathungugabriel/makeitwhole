"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div
            onClick={() => router.push("/")}
            className="text-2xl font-bold text-blue-700 cursor-pointer"
          >
            Make It Whole Again
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex items-center gap-6">
            <button
              onClick={() => router.push("/login")}
              className="text-gray-700 hover:text-blue-700 transition"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/register")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 border rounded-md hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="material-icons">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden flex flex-col px-6 pb-4 gap-2 bg-white border-t">
            <button
              onClick={() => {
                router.push("/login");
                setMenuOpen(false);
              }}
              className="text-gray-700 text-left hover:text-blue-700 transition"
            >
              Login
            </button>
            <button
              onClick={() => {
                router.push("/register");
                setMenuOpen(false);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-left hover:bg-blue-700 transition"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-16 bg-gradient-to-b from-blue-100 to-white">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Make It Whole Again
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mb-8">
          Lost a charger, an earbud, or a matching strap? Don’t replace — complete your gear.  
          Join the marketplace built for second chances.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => router.push("/register")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Get Early Access
          </button>
          <button
            onClick={() => router.push("/login")}
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            List a Missing Item
          </button>
        </div>

        <div className="mt-12">
          <Image
            src="/images/incomplete-items.svg"
            alt="Incomplete gadgets illustration"
            width={420}
            height={300}
            className="mx-auto"
          />
        </div>
      </section>

      {/* Why Make It Whole Section */}
      <section className="py-20 px-8 bg-white border-t border-gray-100">
        <h2 className="text-3xl font-semibold text-center mb-10">
          Why Make It Whole?
        </h2>

        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Every year, millions of perfectly good gadgets and accessories are discarded
              just because one small part is missing — a lost earbud, a missing charger,
              a single strap.
            </p>
            <p className="text-gray-700 mb-4 leading-relaxed">
              <strong>Make It Whole Again</strong> connects people who have those missing
              pieces. Save money, reduce waste, and help the planet one match at a time.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Whether you're a buyer looking to complete your item, or a seller hoping to
              give your leftover piece a new life — we make it simple, safe, and rewarding.
            </p>
          </div>

          <div className="flex justify-center">
            <Image
              src="/images/why-make-it-whole.svg"
              alt="Sustainability illustration"
              width={420}
              height={320}
              className="rounded-lg shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-8 bg-gray-50 border-t border-gray-100">
        <h2 className="text-3xl font-semibold text-center mb-12">
          How It Works
        </h2>

        <div className="grid sm:grid-cols-3 gap-10 max-w-5xl mx-auto">
          <div className="text-center">
            <span className="text-4xl mb-3 block">📸</span>
            <h3 className="text-xl font-semibold mb-2">
              Post What You’re Missing
            </h3>
            <p className="text-gray-600">
              Upload a photo and describe the part or item you’re looking for — or have lying around.
            </p>
          </div>

          <div className="text-center">
            <span className="text-4xl mb-3 block">🔗</span>
            <h3 className="text-xl font-semibold mb-2">We Match You</h3>
            <p className="text-gray-600">
              Our system connects you with people who have the exact match — no endless searching.
            </p>
          </div>

          <div className="text-center">
            <span className="text-4xl mb-3 block">💡</span>
            <h3 className="text-xl font-semibold mb-2">Complete Your Gear</h3>
            <p className="text-gray-600">
              Trade, buy, or swap to finish what you started — no waste, no hassle.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Make It Whole Again — Built with ❤️
      </footer>
    </main>
  );
}
