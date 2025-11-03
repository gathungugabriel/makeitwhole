"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/apiClient";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || !form.email || !form.password) {
      setError("⚠️ All fields are required.");
      return;
    }

    try {
      // Register expects JSON body in your backend
      const res = await api.post("/users/register", {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      setMsg(`✅ Registered as ${res.data.username}. Redirecting to login...`);
      setTimeout(() => router.push("/login"), 1400);
    } catch (err: any) {
      console.error("Registration failed:", err);
      const detail = err.response?.data?.detail || err.message;
      setError(`❌ ${detail}`);
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

        <div className="relative my-4 text-center">
        <span className="text-gray-400 text-sm">or</span>
        </div>

        <a
        href="http://127.0.0.1:8000/auth/google"
        className="flex items-center justify-center gap-2 bg-white border rounded p-2 text-gray-700 hover:bg-gray-100 transition"
        >
        <img src="/google-icon.svg.png" alt="Google"  className="w-5 h-5" />
        Continue with Google
        </a>



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
