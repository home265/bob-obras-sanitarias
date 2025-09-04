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
  habitantes: number;
}

export interface AmbienteSanitario {
  id: string;
  nombre: string;
  planta: number;
  artefactos: Record<string, number>;
}

export interface Montante {
    id: string;
    nombre: string;
    plantaDescarga: number;
}

export interface Colectora {
    id: string;
    nombre: string;
    longitud_m: number;
    accesorios: Record<string, number>;
}

export interface TramoVentilacion {
  id: string;
  nombre: string;
  dn_mm: 63 | 110;
  longitud_m: number;
  accesorios: Record<string, number>;
  terminacion: "sombrerete" | "abierto";
}

// --- Tipos para Catálogos ---

interface Pendiente {
  dn_mm: number;
  min: number;
  recom: number;
  max: number;
}

interface DistanciasMax {
  general_m: number;
  a_artefactos_sin_prol_m: number;
}

// --- Payload completo para la función de cálculo ---
export interface SanitariaPayload {
  edificio: EdificioSanitario;
  disposicion: DisposicionFinal;
  ambientes: AmbienteSanitario[];
  montantes: Montante[];
  colectoras: Colectora[];
  ventilaciones: TramoVentilacion[]; // Se añade el sistema de ventilación
  catalogos: {
    pendientes: Pendiente[];
    distanciasMax: DistanciasMax;
    // Los catálogos de PVC no necesitan un tipo estricto aquí
    // porque su estructura es genérica y se usa para buscar materiales
    pvcPegamento: Record<string, any>;
    pvcJunta: Record<string, any>;
  }
}

// --- Entidades del Resultado (lo que la calculadora produce) ---

export interface ResultadoSanitario {
  informe: ResultRow[];
  recomendaciones: string[];
  materiales: MaterialLine[];
}