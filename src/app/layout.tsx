import type { Metadata } from "next";
import { headers } from "next/headers";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAVIC – Plataforma Educativa",
  description: "Plataforma SaaS educativa multi-instituto",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const primaryColor = headersList.get("x-institute-primary") ?? "#1A56DB";
  const secondaryColor = headersList.get("x-institute-secondary") ?? "#38BDF8";

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
      </head>
      <body className="min-h-full flex flex-col bg-[#F0F9FF] text-[#050F1F]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
