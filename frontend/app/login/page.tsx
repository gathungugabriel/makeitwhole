"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/apiClient"; // your axios instance

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      // Use api (axios). Axios will set multipart headers automatically for FormData.
      const res = await api.post("/users/login", formData);

      // your backend returns access_token and refresh_token
      const data = res.data;
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      if (data.user_id) {
        localStorage.setItem("user_id", String(data.user_id));
      }

      setMessage("✅ Login successful!");
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err: any) {
      console.error("Login failed:", err);
      const errMsg = err.response?.data?.detail || err.message || "Invalid credentials";
      setMessage(`❌ ${errMsg}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-center mb-6">Login</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Email or username"
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition"
        >
          Login
        </button>

        <div className="relative my-4 text-center">
        <span className="text-gray-400 text-sm">or</span>
        </div>

        <a
          href="http://127.0.0.1:8000/auth/google"
          className="flex items-center justify-center gap-2 bg-white border rounded p-2 text-gray-700 hover:bg-gray-100 transition"
        >
          <img src="/google-icon.svg.png" alt="Google" className="w-5 h-5" />
          Continue with Google
        </a>

      </form>

      {message && (
        <p
          className={`mt-4 text-sm text-center ${
            message.startsWith("✅") ? "text-green-600" :
            message.startsWith("❌") ? "text-red-600" : "text-gray-600"
          }`}
        >
          {message}
        </p>
      )}

      <p className="text-sm text-center mt-4">
        Don’t have an account?{" "}
        <a href="/register" className="text-blue-600 hover:underline">
          Register here
        </a>
      </p>
    </div>
  );
}
