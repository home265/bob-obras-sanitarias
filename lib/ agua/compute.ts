// lib/agua/compute.ts
// Motor de dimensionado para Agua (PP-R)
// - Selección de DN por velocidad
// - Pérdidas por Hazen–Williams (con Leq por accesorios)
// - BOM agregado (caños en barras + accesorios)

import {
  type AguaCatalog,
  type KEquivalente,
  type LimitesVelocidad,
  type UnidadesConsumo,
  type BOMItem,
} from "@/lib/types";

export type SistemaAgua = "red" | "tanque" | "cisterna_bomba_tanque";

export interface AguaInput {
  sistema: SistemaAgua;
  alturas?: {
    tanque_m?: number;          // cota del agua en tanque respecto del punto de referencia
    punto_critico_m?: number;   // cota del punto más desfavorable
  };
  ramales: Array<{
    id: string;
    nombre?: string;
    distancia_m: number; // traza recta del tramo
    // aparatos por tipo (coinciden con claves de unidades_consumo.json)
    aparatos: Array<{ tipo: string; cantidad: number }>;
    // accesorios por tipo (codo90|codo45|tee_paso|tee_deriv, etc.)
    accesorios: Array<{ tipo: string; cantidad: number }>;
  }>;
}

export interface AguaSegmento {
  id: string;
  nombre?: string;
  dn_mm: number;
  longitud_m: number;    // distancia + leq
  velocidad_ms: number;
  perdida_m: number;     // hf
  caudal_lps: number;
}

export interface AguaOutput {
  segmentos: AguaSegmento[];
  perdidas_totales_m: number;
  margen_presion_m?: number | null; // opcional: si suministraste alturas
  bom: BOMItem[];
  warnings: string[];
}

/* ================= Utilidades hidráulicas ================ */

function lpsToM3s(q_lps: number): number { return q_lps / 1000; }
function mmToM(mm: number): number { return mm / 1000; }

// Hazen–Williams (SI): hf = 10.67 * L * Q^1.852 / (C^1.852 * D^4.87)
// Q en m3/s, D en m, L en m, hf en mca
function hazenWilliams_hf(L_m: number, Q_m3s: number, C: number, D_m: number): number {
  if (Q_m3s <= 0 || D_m <= 0 || C <= 0 || L_m <= 0) return 0;
  return 10.67 * L_m * Math.pow(Q_m3s, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
}

function velocidad_ms(Q_m3s: number, D_m: number): number {
  if (Q_m3s <= 0 || D_m <= 0) return 0;
  const area = Math.PI * Math.pow(D_m / 2, 2);
  return Q_m3s / area;
}

// Conversión simple de "unidades de consumo" a caudal probable (L/s).
// Aproximación suave (estilo Hunter): q = a * FU^b  (a=0.07, b=0.8) con mínimo práctico.
function unidadesAcaudal(unidades: number): number {
  if (unidades <= 0) return 0;
  const q = 0.07 * Math.pow(unidades, 0.8); // L/s
  return Math.max(q, 0.15); // evitar caudales ridículos
}

// Suma de unidades por lista de aparatos
function sumUnidades(aparatos: Array<{ tipo: string; cantidad: number }>, tabla: UnidadesConsumo): number {
  return aparatos.reduce((acc, a) => acc + (tabla[a.tipo] || 0) * a.cantidad, 0);
}

// Leq total según DN (si no hay match exacto, intenta por tipo sin DN y asume 0 si no encuentra)
function leqTotalPorDN(accesorios: Array<{ tipo: string; cantidad: number }>, klist: KEquivalente[], dn_mm: number): number {
  let total = 0;
  for (const acc of accesorios) {
    const row = klist.find(k => k.tipo === acc.tipo && k.dn_mm === dn_mm)
           ?? klist.find(k => k.tipo === acc.tipo); // fallback muy básico
    if (row) total += row.leq_m * acc.cantidad;
  }
  return total;
}

function chooseDN(
  q_lps: number,
  distancia_m: number,
  klist: KEquivalente[],
  catalog: AguaCatalog,
  lim: LimitesVelocidad
): { dn_mm: number; v_ms: number; Ltotal_m: number; hf_m: number } {

  let best: { dn_mm: number; v_ms: number; Ltotal_m: number; hf_m: number } | null = null;

  // probá DN por orden ascendente y quedate con el más chico que cumpla v<=max
  const pipes = [...catalog.pipes].sort((a, b) => a.dn_mm - b.dn_mm);
  const Q = lpsToM3s(q_lps);

  for (const p of pipes) {
    const D = mmToM(p.inner_mm);
    const Leq = leqTotalPorDN([], klist, p.dn_mm); // base 0; se recalcula fuera por accesorios reales
    const L = distancia_m + Leq;
    const v = velocidad_ms(Q, D);
    const hf = hazenWilliams_hf(L, Q, p.c_hw, D);
    const candidate = { dn_mm: p.dn_mm, v_ms: v, Ltotal_m: L, hf_m: hf };

    if (v <= lim.max_ms) {
      best = candidate;
      break;
    }
  }

  // si ninguno cumple v<=max, quedate con el mayor DN
  if (!best && pipes.length > 0) {
    const p = pipes[pipes.length - 1];
    const D = mmToM(p.inner_mm);
    const Leq = leqTotalPorDN([], klist, p.dn_mm);
    const L = distancia_m + Leq;
    const v = velocidad_ms(Q, D);
    const hf = hazenWilliams_hf(L, Q, p.c_hw, D);
    best = { dn_mm: p.dn_mm, v_ms: v, Ltotal_m: L, hf_m: hf };
  }

  return best!;
}

/* =================== API principal =================== */

export function computeAgua(
  input: AguaInput,
  ctx: {
    catalog: AguaCatalog;
    unidades: UnidadesConsumo;
    klist: KEquivalente[];
    limites: LimitesVelocidad;
  }
): AguaOutput {
  const warnings: string[] = [];
  const segmentos: AguaSegmento[] = [];
  const bom: BOMItem[] = [];

  let perdidasTot = 0;

  for (const r of input.ramales) {
    const FU = sumUnidades(r.aparatos, ctx.unidades);
    const q_lps = unidadesAcaudal(FU);

    // Selección tentativo de DN por velocidad (sin accesorios)
    let { dn_mm } = chooseDN(q_lps, r.distancia_m, ctx.klist, ctx.catalog, ctx.limites);

    // Recalcular con Leq según ese DN y ajustar si hace falta
    const pipe = ctx.catalog.pipes.find(p => p.dn_mm === dn_mm)!;
    const D = mmToM(pipe.inner_mm);
    const Q = lpsToM3s(q_lps);
    const Leq = leqTotalPorDN(r.accesorios, ctx.klist, dn_mm);
    let L = r.distancia_m + Leq;
    let v = velocidad_ms(Q, D);
    let hf = hazenWilliams_hf(L, Q, pipe.c_hw, D);

    // Si velocidad > max, intentar subir DN hasta entrar en rango
    let idx = ctx.catalog.pipes.findIndex(p => p.dn_mm === dn_mm);
    while (v > ctx.limites.max_ms && idx < ctx.catalog.pipes.length - 1) {
      idx++;
      dn_mm = ctx.catalog.pipes[idx].dn_mm;
      const p2 = ctx.catalog.pipes[idx];
      const D2 = mmToM(p2.inner_mm);
      L = r.distancia_m + leqTotalPorDN(r.accesorios, ctx.klist, dn_mm);
      v = velocidad_ms(Q, D2);
      hf = hazenWilliams_hf(L, Q, p2.c_hw, D2);
    }

    if (v < ctx.limites.min_ms) {
      warnings.push(
        `Ramal "${r.nombre ?? r.id}" con velocidad baja (${v.toFixed(2)} m/s < ${ctx.limites.min_ms} m/s).`
      );
    }
    if (v > ctx.limites.max_ms) {
      warnings.push(
        `Ramal "${r.nombre ?? r.id}" excede velocidad (${v.toFixed(2)} m/s > ${ctx.limites.max_ms} m/s).`
      );
    }

    segmentos.push({
      id: r.id,
      nombre: r.nombre,
      dn_mm,
      longitud_m: Number(L.toFixed(2)),
      velocidad_ms: Number(v.toFixed(2)),
      perdida_m: Number(hf.toFixed(2)),
      caudal_lps: Number(q_lps.toFixed(2)),
    });
    perdidasTot += hf;

    // ===== BOM por ramal =====
    // Caños: barras según L total
    const barra_m = pipe.barra_m ?? 4;
    const barras = Math.ceil(L / barra_m);
    bom.push({
      code: `PPR-Pipe-${dn_mm}`,
      desc: `Caño PP-R DN ${dn_mm} mm (barras ${barra_m} m)`,
      qty: barras,
      unidad: "barra",
      dn_mm,
    });

    // Accesorios: tal cual los ingresó el usuario, pero anotando DN
    for (const a of r.accesorios) {
      bom.push({
        code: `PPR-${a.tipo}-${dn_mm}`,
        desc: `${a.tipo.replace("_", " ")} PP-R DN ${dn_mm} mm`,
        qty: a.cantidad,
        dn_mm,
      });
    }
  }

  // Agregar BOM por código (acumular cantidades)
  const bomAggMap = new Map<string, BOMItem>();
  for (const item of bom) {
    const key = item.code;
    const prev = bomAggMap.get(key);
    if (prev) bomAggMap.set(key, { ...prev, qty: prev.qty + item.qty });
    else bomAggMap.set(key, { ...item });
  }
  const bomAgg = Array.from(bomAggMap.values());

  // Margen de presión (opcional, si hay alturas)
  let margen: number | null = null;
  if (input.alturas?.tanque_m != null && input.alturas?.punto_critico_m != null) {
    const Hdisp = input.alturas.tanque_m - input.alturas.punto_critico_m; // mca aproximada por altura
    margen = Number((Hdisp - perdidasTot).toFixed(2));
  }

  return {
    segmentos,
    perdidas_totales_m: Number(perdidasTot.toFixed(2)),
    margen_presion_m: margen,
    bom: bomAgg,
    warnings,
  };
}
