"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/apiClient";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.username || !form.email || !form.password) {
      setError("⚠️ All fields are required.");
      return;
    }

    try {
      const res = await api.post("/users/register", form);
      setMsg(`✅ Registered as ${res.data.username}. Redirecting to login...`);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      console.error("Registration failed:", err);
      const detail = err.response?.data?.detail;
      setError(`❌ ${detail || "Registration failed."}`);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>

      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
      {msg && <p className="bg-green-100 text-green-700 p-2 rounded mb-4">{msg}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="username"
          placeholder="Username"
          className="border p-2 rounded"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Register
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login here
        </a>
      </p>
    </div>
  );
}
