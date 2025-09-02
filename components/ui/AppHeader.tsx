// components/ui/AppHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/lib/nav";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export default function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isActive = (href?: string) =>
    !!href && (pathname === href || pathname?.startsWith(href + "/"));

  return (
      <header className="header sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4">
          <div className="h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg text-foreground hover:opacity-90">
              Obras Sanitarias
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {NAV_ITEMS.map((it) => (
                <Link
                  key={it.label}
                  href={it.href!}
                  className={cx(
                    "text-sm",
                    isActive(it.href)
                      ? "font-medium underline decoration-[var(--color-base)] underline-offset-4"
                      : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  {it.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="btn btn-secondary px-3 py-2 md:!hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
  
        {mounted &&
          open &&
          createPortal(
            <div className="fixed inset-0 z-[1000] md:hidden">
              <div
                className="absolute inset-0 bg-black/55"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <aside
                role="dialog"
                aria-label="Menú"
                className="absolute left-0 top-0 h-full w-[min(22rem,90vw)]
                           bg-background text-foreground
                           border-r border-border shadow-2xl
                           flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/70">
                  <span className="font-semibold text-[var(--color-base)]">Menú</span>
                  <button
                    type="button"
                    aria-label="Cerrar menú"
                    onClick={() => setOpen(false)}
                    className="btn btn-ghost px-3 py-2"
                  >
                    <X size={16} />
                  </button>
                </div>
  
                <nav className="px-2 py-3 overflow-y-auto">
                  <ul className="space-y-1">
                    {NAV_ITEMS.map((it) => (
                      <li key={it.label}>
                        <Link
                          href={it.href!}
                          onClick={() => setOpen(false)}
                          className={cx(
                            "block rounded px-3 py-2 text-sm bg-card/60 hover:bg-muted border border-border",
                            isActive(it.href) && "bg-muted text-[var(--color-base)]"
                          )}
                        >
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
  
                <div className="mt-auto px-4 py-3 text-xs text-foreground/60 border-t border-border">
                  PWA — funciona offline
                </div>
              </aside>
            </div>,
            document.body
          )}
      </header>
    );
}