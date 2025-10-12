"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch("http://127.0.0.1:8000/users/login", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access_token); // ✅ consistent key
      alert("✅ Login successful!");
      router.push("/create-product"); // optional redirect
    } else {
      alert("❌ Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-2 p-4 max-w-md mx-auto mt-10 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4 text-center">Login</h2>

      <input
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
      <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition" type="submit">
        Login
      </button>
    </form>
  );
}
