// lib/calc/sanitaria_types.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";

// --- Entidades del Formulario (lo que el usuario ingresa) ---

export interface EdificioSanitario {
  plantas: number;
  alturaPlanta_m: number;
}

export interface DisposicionFinal {
  tipo: "cloaca" | "estatico";
  profundidadConexion_cm: number;
  distanciaPozo_m: number;
  habitantes: number; // Relevante para pozo/biodigestor
}

export interface AmbienteSanitario {
  id: string;
  nombre: string;
  planta: number; // 0 para PB, 1 para Piso 1, etc.
  artefactos: Record<string, number>; // ej: { inodoro: 1 }
}

export interface Montante {
    id: string;
    nombre: string;
    plantaDescarga: number; // Piso más alto que descarga en él
}

export interface Colectora {
    id: string;
    nombre: string;
    longitud_m: number;
    accesorios: Record<string, number>;
}

// --- Payload completo para la función de cálculo ---
export interface SanitariaPayload {
  edificio: EdificioSanitario;
  disposicion: DisposicionFinal;
  ambientes: AmbienteSanitario[];
  montantes: Montante[];
  colectoras: Colectora[];
  catalogos: {
    pvcPegamento: any;
    pvcJunta: any;
    pendientes: any;
    distanciasMax: any;
  }
}

// --- Entidades del Resultado (lo que la calculadora produce) ---

export interface ResultadoSanitario {
  informe: ResultRow[];
  recomendaciones: string[];
  materiales: MaterialLine[];
}