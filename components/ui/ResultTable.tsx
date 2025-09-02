"use client";

export type ResultRow = {
  label: string;
  qty: number | string;
  unit?: string;
  hint?: string;
};

function fmt(n: number | string) {
  if (typeof n !== "number") return n;
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(n);
}

export default function ResultTable({ items }: { items: ResultRow[] }) {
  if (!items?.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-foreground/60">
          <tr className="border-b border-border">
            <th className="py-2 pr-2 font-normal text-left">Concepto</th>
            <th className="py-2 pr-2 font-normal text-right">Cantidad</th>
            <th className="py-2 pr-2 font-normal text-left">Unidad</th>
            <th className="py-2 pr-2 font-normal text-left">Notas</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={`${r.label}-${i}`} className="border-b border-border">
              <td className="py-2 pr-2">{r.label}</td>
              <td className="py-2 pr-2 text-right">{fmt(r.qty)}</td>
              <td className="py-2 pr-2">{r.unit ?? ""}</td>
              <td className="py-2 pr-2 text-xs opacity-80">{r.hint ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}