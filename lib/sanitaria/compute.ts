// lib/sanitaria/compute.ts
// Motor Sanitaria (cloacas) para vivienda
// - Valida pendiente por DN (cm/m) usando tabla
// - Sugiere accesos cada N metros
// - Genera BOM por sistema: PVC (pegamento) o PVC con junta elástica

import type {
  BOMItem,
  PendientePorDN,
  SanitariaCatalog,
} from "@/lib/types";

export type SistemaSanitaria = "pegamento" | "junta";

export interface SanitariaTramoIn {
  id: string;
  nombre?: string;
  dn_mm: number;
  longitud_m: number;
  pendiente_cm_m: number;   // positiva hacia el colector
  accesorios: {
    codo90?: number;
    codo45?: number;
    tee?: number;
  };
}

export interface SanitariaInput {
  sistema: SistemaSanitaria;
  tramos: SanitariaTramoIn[];
}

export interface SanitariaTramoOut {
  id: string;
  nombre?: string;
  dn_mm: number;
  longitud_m: number;
  pendiente_cm_m: number;
  ok: boolean;
  motivo?: string; // por qué falló (si falla)
}

export interface SanitariaOutput {
  tramos: SanitariaTramoOut[];
  accesos_sugeridos: Array<{ tramoId: string; posiciones_m: number[] }>;
  bom: BOMItem[];
  warnings: string[];
}

function rangoPendiente(dn: number, tabla: PendientePorDN[]): PendientePorDN | null {
  return tabla.find(r => r.dn_mm === dn) ?? null;
}

function ensurePositivo(n: number): number {
  if (!isFinite(n)) return 0;
  return Math.max(0, n);
}

function toInt(n: number): number {
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

export function computeSanitaria(
  input: SanitariaInput,
  ctx: {
    catalog: SanitariaCatalog;
    pendientes: PendientePorDN[];
    longitudesAcceso: { general_m: number; a_artefactos_sin_prol_m: number };
  }
): SanitariaOutput {
  const warnings: string[] = [];
  const outTramos: SanitariaTramoOut[] = [];
  const accesos: Array<{ tramoId: string; posiciones_m: number[] }> = [];
  const bomTmp: BOMItem[] = [];

  // Reglas de insumos (heurística simple, afinable):
  // - Pegamento/limpiador: 1 kit cada ~20 uniones (barras + fittings)
  // - Juntas elásticas: 1 por unión (aprox. barras + fittings) por DN
  const unionesPorKit = 20;

  for (const t of input.tramos) {
    const dn = toInt(t.dn_mm);
    const L = ensurePositivo(t.longitud_m);
    const slope = ensurePositivo(t.pendiente_cm_m);

    const regla = rangoPendiente(dn, ctx.pendientes);
    let ok = true;
    let motivo = "";

    if (!regla) {
      ok = false;
      motivo = `DN ${dn} mm sin tabla de pendiente.`;
    } else {
      if (slope < regla.min) {
        ok = false;
        motivo = `Pendiente menor al mínimo para DN ${dn} (min ${regla.min} cm/m).`;
      } else if (slope > regla.max) {
        // No invalida, pero advierte por riesgo de separación de fases
        warnings.push(`Tramo "${t.nombre ?? t.id}" con pendiente alta (${slope} cm/m > ${regla.max} cm/m).`);
      }
    }

    outTramos.push({
      id: t.id,
      nombre: t.nombre,
      dn_mm: dn,
      longitud_m: Number(L.toFixed(2)),
      pendiente_cm_m: Number(slope.toFixed(2)),
      ok,
      motivo: ok ? undefined : motivo,
    });

    // ===== Accesos sugeridos
    const paso = ctx.longitudesAcceso.general_m;
    const puntos: number[] = [];
    if (L > paso) {
      for (let x = paso; x < L; x += paso) {
        puntos.push(Number(x.toFixed(1)));
      }
    }
    accesos.push({ tramoId: t.id, posiciones_m: puntos });

    // ===== BOM: caños (barras)
    const pipe = ctx.catalog.pipes.find(p => p.dn_mm === dn);
    const barra_m = pipe?.barra_m ?? 3;
    const barras = Math.ceil(L / barra_m);
    const pipeCodePrefix = input.sistema === "pegamento" ? "PVC" : "PVCJ";
    bomTmp.push({
      code: `${pipeCodePrefix}-Pipe-${dn}`,
      desc: `Caño PVC DN ${dn} mm (${barra_m} m)`,
      qty: barras,
      unidad: "barra",
      dn_mm: dn,
    });

    // ===== BOM: accesorios (por tipo)
    const accs = t.accesorios || {};
    const tipos: Array<["codo90" | "codo45" | "tee", number]> = [
      ["codo90", toInt(accs.codo90 ?? 0)],
      ["codo45", toInt(accs.codo45 ?? 0)],
      ["tee", toInt(accs.tee ?? 0)],
    ];
    for (const [tipo, cant] of tipos) {
      if (cant <= 0) continue;
      // Buscar código exacto del catálogo; si no hay, usar genérico
      const fit = ctx.catalog.fittings.find(f => f.tipo === tipo && f.dn_mm === dn);
      const code = fit?.code ?? `${pipeCodePrefix}-${tipo.toUpperCase()}-${dn}`;
      bomTmp.push({
        code,
        desc: `${tipo.replace("_", " ")} DN ${dn} mm`,
        qty: cant,
        dn_mm: dn,
      });
    }

    // ===== Insumos por sistema
    const unionesAprox = barras + tipos.reduce((s, [, c]) => s + c, 0);

    if (input.sistema === "pegamento") {
      const kits = Math.max(1, Math.ceil(unionesAprox / unionesPorKit));
      // Buscar códigos si existen
      const peg = ctx.catalog.insumos.find(i => i.tipo === "pegamento_pvc");
      const lim = ctx.catalog.insumos.find(i => i.tipo === "limpiador_pvc");
      bomTmp.push({
        code: peg?.code ?? "PVC-PEG-01",
        desc: "Pegamento PVC",
        qty: kits,
      });
      bomTmp.push({
        code: lim?.code ?? "PVC-LIM-01",
        desc: "Limpiador PVC",
        qty: kits,
      });
    } else {
      // Juntas elásticas por DN
      const juntas = Math.max(1, unionesAprox);
      const aro = ctx.catalog.insumos.find(i => i.tipo === "junta_elastica" && (i.dn_mm ?? dn) === dn);
      bomTmp.push({
        code: aro?.code ?? `PVCJ-ARO-${dn}`,
        desc: `Junta elástica DN ${dn} mm`,
        qty: juntas,
        dn_mm: dn,
      });
    }
  }

  // Agregar BOM por código + unidad + dn
  const bomAgg = aggregateBOM(bomTmp);

  return {
    tramos: outTramos,
    accesos_sugeridos: accesos,
    bom: bomAgg,
    warnings,
  };
}

/* ===== Helpers internos ===== */

function aggregateBOM(items: BOMItem[]): BOMItem[] {
  const map = new Map<string, BOMItem>();
  for (const i of items) {
    const key = [i.code, i.unidad ?? "", i.dn_mm ?? ""].join("|");
    const prev = map.get(key);
    if (prev) map.set(key, { ...prev, qty: prev.qty + i.qty });
    else map.set(key, { ...i });
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}
