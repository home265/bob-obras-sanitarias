// Tipos compartidos para toda la app

export type PartidaKind = "agua" | "sanitaria";

export interface BOMItem {
  code: string;
  desc: string;
  qty: number;
  unidad?: string;
  dn_mm?: number;
}

export interface Partida {
  id: string;
  kind: PartidaKind;
  summary: string;          // texto corto (p.ej. "Agua baño PB - 2 ramales")
  params: unknown;          // snapshot de entradas del form
  result: unknown;          // cálculo (segmentos/sizing/validaciones)
  bom: BOMItem[];
  createdAt: string;        // ISO
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;        // ISO
  partidas: Partida[];
  meta?: { version: number };
}

/* ===== Catálogos & parámetros (AGUA) ===== */

export interface AguaPipe {
  dn_mm: number;
  inner_mm: number;   // diámetro interior (mm) para pérdidas
  c_hw: number;       // Hazen-Williams C
  barra_m: number;    // longitud de barra
}
export interface AguaFitting {
  code: string;
  tipo: string;       // codo90 | codo45 | tee_paso | tee_deriv | ...
  dn_mm: number;
}
export interface AguaValve {
  code: string;
  tipo: string;       // llave_paso, etc.
  dn_mm: number;
}
export interface AguaCatalog {
  pipes: AguaPipe[];
  fittings: AguaFitting[];
  valves: AguaValve[];
}

export type UnidadesConsumo = Record<string, number>;

export interface LimitesVelocidad {
  min_ms: number;
  max_ms: number;
}
export interface KEquivalente {
  tipo: string;   // codo90, tee_paso, ...
  dn_mm: number;
  leq_m: number;  // longitud equivalente (m) por accesorio
}

/* ===== Catálogos & parámetros (SANITARIA) ===== */

export interface SanitariaPipe {
  dn_mm: number;
  barra_m: number;
}
export interface SanitariaFitting {
  code: string;
  tipo: string;     // codo90, codo45, tee, ...
  dn_mm: number;
}
export interface SanitariaInsumo {
  code: string;
  tipo: string;     // pegamento_pvc | limpiador_pvc | junta_elastica
  dn_mm?: number;
}

export interface SanitariaCatalog {
  pipes: SanitariaPipe[];
  fittings: SanitariaFitting[];
  insumos: SanitariaInsumo[];
}

export interface PendientePorDN {
  dn_mm: number;
  min: number;      // cm/m
  recom: number;    // cm/m
  max: number;      // cm/m
}

export interface LongitudesAcceso {
  general_m: number;
  a_artefactos_sin_prol_m: number;
}
