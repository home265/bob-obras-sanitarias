// app/layout.tsx
import type { Metadata, Viewport } from "next";
import AppHeader from "@/components/ui/AppHeader";
import RegisterSW from "./register-sw";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obras Sanitarias Calc",
  description: "Cómputo de materiales para instalaciones sanitarias. PWA.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0E8388",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <RegisterSW />
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          {children}
        </main>
      </body>
    </html>
  );
}