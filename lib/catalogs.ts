"use client";

/**
 * Carga de catálogos/JSON desde `public/data/*`
 * - Cache en memoria por ruta
 * - Tipado fuerte por archivo
 */

import type {
  AguaCatalog,
  KEquivalente,
  LimitesVelocidad,
  LongitudesAcceso,
  PendientePorDN,
  SanitariaCatalog,
  UnidadesConsumo
} from "./types";

const cache = new Map<string, unknown>();

async function loadJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;

  // Nota: fetch a rutas de /public es relativo al mismo origen
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`No se pudo cargar ${path} (HTTP ${res.status})`);
  }
  const data = (await res.json()) as T;
  cache.set(path, data);
  return data;
}

/* ===== Rutas base ===== */
const A_BASE = "/data/agua";
const S_BASE = "/data/sanitaria";

/* ===== Agua ===== */
export function getUnidadesConsumo(): Promise<UnidadesConsumo> {
  return loadJSON<UnidadesConsumo>(`${A_BASE}/unidades_consumo.json`);
}

export function getLimitesVelocidad(): Promise<LimitesVelocidad> {
  return loadJSON<LimitesVelocidad>(`${A_BASE}/limites_velocidad.json`);
}

export function getKEquivalentes(): Promise<KEquivalente[]> {
  return loadJSON<KEquivalente[]>(`${A_BASE}/k_equivalentes.json`);
}

export function getAguaCatalog(): Promise<AguaCatalog> {
  return loadJSON<AguaCatalog>(`${A_BASE}/catalogo_ppr.json`);
}

/* ===== Sanitaria ===== */
export function getPendientesPorDN(): Promise<PendientePorDN[]> {
  return loadJSON<PendientePorDN[]>(`${S_BASE}/pendientes_por_dn.json`);
}

export function getLongitudesAcceso(): Promise<LongitudesAcceso> {
  return loadJSON<LongitudesAcceso>(`${S_BASE}/long_max_entre_accesos.json`);
}

export function getSanitariaCatalog(system: "pegamento" | "junta"): Promise<SanitariaCatalog> {
  const file =
    system === "pegamento"
      ? "catalogo_pvc_pegamento.json"
      : "catalogo_pvc_junta.json";
  return loadJSON<SanitariaCatalog>(`${S_BASE}/${file}`);
}

/* ===== Helpers útiles para los cálculos ===== */

export async function findAguaPipe(dn_mm: number) {
  const cat = await getAguaCatalog();
  return cat.pipes.find(p => p.dn_mm === dn_mm) || null;
}

export async function getPendienteDefault(dn_mm: number): Promise<number | null> {
  const tabla = await getPendientesPorDN();
  const row = tabla.find(r => r.dn_mm === dn_mm);
  return row ? row.recom : null;
}
