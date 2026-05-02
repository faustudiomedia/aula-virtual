import type { Metadata } from "next";
import { headers } from "next/headers";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agorify – Learning Management System",
  description: "Plataforma SaaS educativa multi-instituto",
};

// Inline script to apply saved theme before first paint (prevents FOUC)
const themeScript = `
  try {
    var t = localStorage.getItem('ag-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch(e) {}
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const primaryColor = headersList.get("x-institute-primary") ?? "#1E3A5F";
  const secondaryColor = headersList.get("x-institute-secondary") ?? "#2a4f80";

  const cssVars = `
    
