"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

      const res = await fetch("http://127.0.0.1:8000/users/login", {
        method: "POST",
        body: formData, // ✅ matches your backend (Form(...))
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token); // ✅ consistent key
        setMessage("✅ Login successful!");
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        const errText = await res.text();
        console.error("Login failed:", errText);
        setMessage("❌ Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Error connecting to backend:", err);
      setMessage("⚠️ Server connection error.");
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
      </form>

      {message && (
        <p
          className={`mt-4 text-sm text-center ${
            message.startsWith('✅')
              ? 'text-green-600'
              : message.startsWith('❌')
              ? 'text-red-600'
              : 'text-gray-600'
          }`}
        >
    {message}
  </p>
)}

    </div>
  );
}
