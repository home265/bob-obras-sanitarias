// Reglas y heurísticas de Agua (PP-R)
// Podés usar esto para controles rápidos o “autosuggest” de DN mínimo por FU.

export interface LimitesVelocidadAgua {
  min_ms: number;
  max_ms: number;
}

/** Límites de velocidad por defecto (alineados con /data/agua/limites_velocidad.json) */
export const VEL_LIMITS_DEFAULT: LimitesVelocidadAgua = { min_ms: 0.6, max_ms: 2.0 };

/** Sugerencia de DN por unidades de consumo (FU) — heurística suave */
const DN_POR_FU: Array<{ fuMax: number; dn_mm: number }> = [
  { fuMax: 2,  dn_mm: 20 },
  { fuMax: 4,  dn_mm: 25 },
  { fuMax: 8,  dn_mm: 32 },
  { fuMax: 14, dn_mm: 40 },
  { fuMax: 24, dn_mm: 50 },
  { fuMax: 38, dn_mm: 63 },
];

/** Devuelve un DN recomendado por cantidad de FU (si excede tabla, devuelve el mayor DN) */
export function sugerirDNPorFU(fu: number): number {
  if (fu <= 0) return 20;
  const found = DN_POR_FU.find(x => fu <= x.fuMax);
  return found ? found.dn_mm : DN_POR_FU[DN_POR_FU.length - 1].dn_mm;
}

/** Valida si la velocidad está dentro de rango */
export function velocidadEnRango(v_ms: number, lim: LimitesVelocidadAgua = VEL_LIMITS_DEFAULT) {
  if (!isFinite(v_ms)) return { ok: false, motivo: "Velocidad inválida" };
  if (v_ms < lim.min_ms) return { ok: false, motivo: `Velocidad baja (${v_ms.toFixed(2)} < ${lim.min_ms})` };
  if (v_ms > lim.max_ms) return { ok: false, motivo: `Velocidad alta (${v_ms.toFixed(2)} > ${lim.max_ms})` };
  return { ok: true };
}

/** Reserva de presión “comoda” para terminales (m de columna de agua) */
export const RESERVA_PRESION_SUGERIDA_M = 3;
