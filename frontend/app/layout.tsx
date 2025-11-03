import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
// import Header from "@/components/Header";   // optional
// import Footer from "@/components/Footer";   // optional

// Font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata (for SEO)
export const metadata: Metadata = {
  title: "Make It Whole Again",
  description:
    "Buy, sell, or trade missing gadget parts — the marketplace for second chances.",
  keywords: [
    "repairs",
    "gadgets",
    "marketplace",
    "spare parts",
    "sustainability",
    "recycling",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

// Root layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {/* ✅ Wrap everything inside AuthProvider for global auth state */}
        <AuthProvider>
          {/* <Header />  // optional global header/navigation */}
          <main className="min-h-screen">{children}</main>
          {/* <Footer />  // optional footer */}
        </AuthProvider>
      </body>
    </html>
  );
}
