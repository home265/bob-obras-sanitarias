// lib/calc/calefaccion_types.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";

// --- Entidades del Formulario (lo que el usuario ingresa) ---

export interface Sistema {
  tipo: "losa_radiante" | "radiadores";
  calderaDual: boolean;
  plantas: number;
  zonaClimaticaId: string; // ID de la zona climática (ej: "templada_fria")
}

export interface AmbienteCalefaccion {
  id: string;
  nombre: string;
  planta: number;
  largo_m: number;
  ancho_m: number;
  alto_m: number;
  
  // Campos para el cálculo de balance térmico preciso
  tipoMuro: string; // key del tipo de muro
  m2_muro_exterior: number;
  tipoTecho: string; // key del tipo de techo (si es último piso)
  m2_techo_ultimo_piso: number;
  tipoVidrio: "simple" | "dvh";
  m2_vidrio: number;
}

export interface DisenoLosa {
  separacion_cm: number;
  longitudMaxima_m: number;
}

export interface DisenoRadiadores {
  // Aquí irían opciones si fueran necesarias, como tipo de radiador
}

// --- Tipos para Catálogos ---

interface ZonaClimatica {
    id: string;
    nombre: string;
    temperatura_diseno_invierno_c: number;
}

interface CoeficienteTransmitancia {
    key: string;
    label: string;
    k: number; // W/m²K
}

// --- Payload completo para la función de cálculo ---
export interface CalefaccionPayload {
  sistema: Sistema;
  ambientes: AmbienteCalefaccion[];
  disenoLosa: DisenoLosa;
  disenoRadiadores: DisenoRadiadores;
  catalogos: {
    zonasClimaticas: ZonaClimatica[];
    coeficientes: {
        muros: CoeficienteTransmitancia[];
        techos: CoeficienteTransmitancia[];
        vidrios: CoeficienteTransmitancia[];
        pisos: CoeficienteTransmitancia[];
    }
  }
}

// --- Entidades del Resultado ---
export interface ResultadoCalefaccion {
  informe: ResultRow[];
  recomendaciones: string[];
  materiales: MaterialLine[];
}