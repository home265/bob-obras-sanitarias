// Reglas y utilidades de Sanitaria (cloacas)

import type { PendientePorDN } from "@/lib/types";

/** Chequea si la pendiente (cm/m) está en el rango para un DN dado según la tabla */
export function pendienteEnRango(
  dn_mm: number,
  pendiente_cm_m: number,
  tabla: PendientePorDN[]
): { ok: boolean; motivo?: string; rango?: PendientePorDN } {
  const row = tabla.find(r => r.dn_mm === dn_mm);
  if (!row) return { ok: false, motivo: `DN ${dn_mm} sin registro en tabla` };
  if (pendiente_cm_m < row.min) return { ok: false, motivo: `Pendiente < mínimo (${row.min} cm/m)` , rango: row };
  if (pendiente_cm_m > row.max) return { ok: true,  motivo: `Pendiente > máximo recomendado (${row.max} cm/m)`, rango: row };
  return { ok: true, rango: row };
}

/** Sugiere posiciones de accesos cada 'paso_m' a lo largo de una longitud 'L' */
export function sugerirAccesos(L_m: number, paso_m: number): number[] {
  const pos: number[] = [];
  for (let x = paso_m; x < L_m; x += paso_m) pos.push(Number(x.toFixed(1)));
  return pos;
}

/** DN mínimo sugerido para colector principal en vivienda */
export const DN_MIN_COLECTOR_MM = 110;
