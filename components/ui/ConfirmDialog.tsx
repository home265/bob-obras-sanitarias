// components/ui/ConfirmDialog.tsx
"use client";
import { useEffect } from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirmar",
  message = "¿Estás seguro?",
  confirmLabel = "Sí",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="card p-6 rounded-lg w-[min(92vw,420px)] shadow-xl" role="alertdialog">
        <h3 className="text-lg font-medium mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-foreground/70 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}