// components/ui/HelpModal.tsx
"use client";

import { useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function HelpModal({ isOpen, onClose, title, children }: Props) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="card m-4 w-full max-w-lg p-6 space-y-4 border-2 border-[var(--color-base)] animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="help-modal-title" className="text-lg font-semibold text-[var(--color-base)]">{title}</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost p-2 h-auto"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="text-sm text-foreground/80 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}