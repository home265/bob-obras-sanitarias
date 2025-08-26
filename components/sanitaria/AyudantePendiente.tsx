"use client";

import { useEffect, useMemo, useState } from "react";
import type { PendientePorDN } from "@/lib/types";

export default function AyudantePendiente(props: {
  tabla: PendientePorDN[];
  initialDn?: number;
}) {
  const [open, setOpen] = useState(false);
  const [dn, setDn] = useState<number>(props.initialDn ?? 110);

  const row = useMemo(() => props.tabla.find(r => r.dn_mm === dn) ?? null, [props.tabla, dn]);

  // Estados sincronizados
  const [cm_m, setCmM] = useState<number | "">("");
  const [ratioX, setRatioX] = useState<number | "">("");
  const [percent, setPercent] = useState<number | "">("");

  // Sincronizar cuando cambia una unidad
  function fromCmM(val: number | "") {
    setCmM(val);
    if (val === "") { setRatioX(""); setPercent(""); return; }
    const v = Number(val);
    setRatioX(v > 0 ? Number((100 / v).toFixed(1)) : "");
    setPercent(Number((v / 100).toFixed(2)));
  }
  function fromRatioX(val: number | "") {
    setRatioX(val);
    if (val === "") { setCmM(""); setPercent(""); return; }
    const v = Number(val);
    setCmM(v > 0 ? Number((100 / v).toFixed(2)) : "");
    setPercent(v > 0 ? Number((1 / v * 100).toFixed(2)) : "");
  }
  function fromPercent(val: number | "") {
    setPercent(val);
    if (val === "") { setCmM(""); setRatioX(""); return; }
    const v = Number(val);
    setCmM(Number((v).toFixed(2)));        // 1% = 1 cm/m
    setRatioX(v > 0 ? Number((100 / v).toFixed(1)) : "");
  }

  useEffect(() => {
    if (row) fromCmM(row.recom); // precarga recomendada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.dn_mm]);

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Ayudante de pendiente</h3>
        <button className="btn btn-ghost" onClick={() => setOpen(o => !o)}>
          {open ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col">
              <span className="text-sm opacity-80">DN (mm)</span>
              <select
                className="px-3 py-2 rounded-xl"
                value={dn}
                onChange={(e) => setDn(Number(e.target.value))}
              >
                {props.tabla.map(t => (
                  <option key={t.dn_mm} value={t.dn_mm}>{t.dn_mm}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className="text-sm opacity-80">cm/m</span>
              <input
                className="px-3 py-2 rounded-xl w-36"
                type="number" step="0.01"
                value={cm_m}
                onChange={(e) => fromCmM(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm opacity-80">Relación 1:X</span>
              <input
                className="px-3 py-2 rounded-xl w-36"
                type="number" step="0.1"
                value={ratioX}
                onChange={(e) => fromRatioX(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>

            <label className="flex flex-col">
              <span className="text-sm opacity-80">%</span>
              <input
                className="px-3 py-2 rounded-xl w-36"
                type="number" step="0.01"
                value={percent}
                onChange={(e) => fromPercent(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
          </div>

          {row && (
            <div className="rounded-lg p-3 text-sm" style={{ background: "var(--muted)" }}>
              <div className="opacity-80">Rango para DN {dn} mm:</div>
              <div>
                mín: <strong>{row.min}</strong> cm/m — recom: <strong>{row.recom}</strong> cm/m — máx: <strong>{row.max}</strong> cm/m
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
