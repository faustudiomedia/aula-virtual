import type { Metadata } from "next";
import { headers } from "next/headers";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agorify – Learning Management System",
  description: "Plataforma SaaS educativa multi-instituto",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const primaryColor = headersList.get("x-institute-primary") ?? "#1E3A5F";
  const secondaryColor = headersList.get("x-institute-secondary") ?? "#2a4f80";

  const cssVars = `
    :root {
      --inst-primary: ${primaryColor};
      --inst-secondary: ${secondaryColor};
    }
  `;

  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "var(--ag-bg)", color: "var(--ag-text)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
