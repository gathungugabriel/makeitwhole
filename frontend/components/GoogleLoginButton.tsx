"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/apiClient";

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleLoginButton() {
  const router = useRouter();

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        {
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          shape: "pill",
        }
      );
    }
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      const res = await api.post("/users/google-login", {
        token: response.credential,
      });

      const data = res.data;
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_role", data.role || "buyer");
      router.push("/dashboard");
    } catch (err) {
      console.error("Google login failed:", err);
      alert("Google login failed, please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center my-4">
      <div id="googleSignInDiv"></div>
    </div>
  );
}
