import "./globals.css";
import type { Metadata, Viewport } from "next";
import RegisterSW from "./register-sw";


export const metadata: Metadata = {
  title: {
    default: "Instalaciones • Agua & Sanitarios",
    template: "Instalaciones • %s",
  },
  description:
    "Calculadoras de materiales para instalaciones de agua (fría/caliente) y sanitarias/cloacales.",
  applicationName: "Instalaciones",
};

export const viewport: Viewport = {
  themeColor: "#0E8388",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <RegisterSW />
        <header className="sticky top-0 z-50 border-b border-[--color-border]" style={{ background: "var(--color-secondary)" }}>
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-3">
              <span className="inline-block h-7 w-7 rounded-xl" style={{ background: "var(--color-accent)" }} />
              <span className="font-semibold leading-none" style={{ color: "var(--color-neutral)" }}>
                Instalaciones
              </span>
              <span className="ml-2 text-xs opacity-80" style={{ color: "var(--color-neutral)" }}>
                Agua & Sanitarios
              </span>
            </a>
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              <a href="/proyecto/nuevo/agua" className="hover:opacity-90" style={{ color: "var(--color-base)" }}>Agua</a>
              <a href="/proyecto/nuevo/sanitaria" className="hover:opacity-90" style={{ color: "var(--color-base)" }}>Sanitaria</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
