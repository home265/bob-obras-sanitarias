// lib/calc/agua_types.ts
import { ResultRow } from "@/components/ui/ResultTable";
import type { MaterialLine } from "@/lib/project/types";

// --- Entidades del Formulario (lo que el usuario ingresa) ---

export interface Edificio {
  plantas: number;
  alturaPlanta_m: number;
  alturaTanque_m: number;
  fuenteCaliente: {
    tipo: "termo" | "calefon" | "caldera";
    ubicacion: string;
  };
}

export interface Ambiente {
  id: string;
  nombre: string;
  planta: number; // 0 para PB, 1 para Piso 1, etc.
  artefactos: Record<string, number>;
}

export interface Tramo {
  id: string;
  nombre: string;
  longitud_m: number;
  accesorios: Record<string, number>;
  alimenta: "ambiente" | "tramo";
  idDestino: string;
}

export interface Trazado {
  fria: Tramo[];
  caliente: Tramo[];
}

// --- Payload completo para la función de cálculo ---
export interface AguaPayload {
  edificio: Edificio;
  ambientes: Ambiente[];
  trazado: Trazado;
  catalogos: {
    ppr: any;
    unidadesConsumo: any;
    kEquivalentes: any;
    limitesVelocidad: any;
  }
}

// --- Entidades del Resultado (lo que la calculadora produce) ---

export interface TramoCalculado extends Tramo {
  uc: number;
  caudal_ls: number;
  diametro_mm: number;
  velocidad_ms: number;
  perdida_mca: number;
  presionFinal_mca: number;
}

export interface ResultadoAgua {
  informe: ResultRow[];
  recomendaciones: string[];
  materiales: MaterialLine[];
}