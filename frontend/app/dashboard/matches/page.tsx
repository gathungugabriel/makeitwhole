"use client";

import { useEffect, useState } from "react";
import api from "@/lib/apiClient";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await api.get("/matches/my");
        setMatches(res.data);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  if (loading) return <p className="text-gray-600 p-6">Loading matches...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Your Matches</h1>

      {matches.length === 0 ? (
        <p className="text-gray-600">No matches yet. Add more products!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((m) => (
            <div key={m.id} className="p-4 bg-white rounded-xl shadow">
              <p className="font-medium mb-2">
                {m.product_a.name} ↔ {m.product_b.name}
              </p>
              <p className="text-sm text-gray-500">
                Similarity: {m.similarity.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
