// lib/calc/calefaccion_types.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";

// --- Entidades del Formulario (lo que el usuario ingresa) ---

export interface Sistema {
  tipo: "losa_radiante" | "radiadores";
  calderaDual: boolean;
  plantas: number;
}

export interface AmbienteCalefaccion {
  id: string;
  nombre: string;
  planta: number;
  largo_m: number;
  ancho_m: number;
  alto_m: number;
  // Opcionales para cálculo preciso
  vidrio: "simple" | "dvh";
  m2_vidrio: number;
}

export interface DisenoLosa {
  separacion_cm: number;
  longitudMaxima_m: number;
}

export interface DisenoRadiadores {
  // Aquí irían opciones si fueran necesarias, como tipo de radiador
}

// --- Payload completo para la función de cálculo ---
export interface CalefaccionPayload {
  sistema: Sistema;
  ambientes: AmbienteCalefaccion[];
  disenoLosa: DisenoLosa;
  disenoRadiadores: DisenoRadiadores;
}

// --- Entidades del Resultado ---
export interface ResultadoCalefaccion {
  informe: ResultRow[];
  recomendaciones: string[];
  materiales: MaterialLine[];
}