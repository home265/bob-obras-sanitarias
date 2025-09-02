// lib/calc/calefaccion.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";
import type { CalefaccionPayload, ResultadoCalefaccion, AmbienteCalefaccion } from "./calefaccion_types";

// --- Constantes y Reglas de Diseño ---
// Factor de pérdida de calor simplificado en W/m³. Aumentar para zonas más frías.
const WATTS_POR_M3 = 50; 
const KCAL_POR_WATT = 0.86;

// --- El "Cerebro" de la Calculadora ---
export function calcularCalefaccion(input: CalefaccionPayload): ResultadoCalefaccion {
  const { sistema, ambientes, disenoLosa, disenoRadiadores } = input;
  
  const informe: ResultRow[] = [];
  const recomendaciones: string[] = [];
  const materiales: MaterialLine[] = [];
  const materialesAgrupados: Record<string, number> = {};

  let balanceTermicoTotal_kcal = 0;

  // 1. Calcular Balance Térmico y Diseño por Ambiente
  for (const ambiente of ambientes) {
    const volumen = ambiente.largo_m * ambiente.ancho_m * ambiente.alto_m;
    const perdida_watts = volumen * WATTS_POR_M3; // Cálculo simplificado
    const perdida_kcal = Math.ceil(perdida_watts * KCAL_POR_WATT);
    balanceTermicoTotal_kcal += perdida_kcal;

    if (sistema.tipo === 'losa_radiante') {
        const superficie = ambiente.largo_m * ambiente.ancho_m;
        const metrosTuberia = Math.ceil(superficie * (100 / disenoLosa.separacion_cm));
        
        informe.push({
            label: `Circuito: ${ambiente.nombre}`,
            qty: `${metrosTuberia}m`,
            unit: `(Sup: ${superficie.toFixed(1)} m²)`,
            hint: `Pérdida: ${perdida_kcal} kcal/h`
        });

        if (metrosTuberia > disenoLosa.longitudMaxima_m) {
            recomendaciones.push(`El circuito '${ambiente.nombre}' (${metrosTuberia}m) excede la longitud máxima. Considere dividirlo en dos.`);
        }
        materialesAgrupados['tubo_pex_200m'] = (materialesAgrupados['tubo_pex_200m'] || 0) + metrosTuberia;

    } else { // Radiadores
        const ELEMENTOS_POR_KCAL = 150; // Kcal/h por elemento de 50cm
        const elementosNecesarios = Math.ceil(perdida_kcal / ELEMENTOS_POR_KCAL);
        
        informe.push({
            label: `Ambiente: ${ambiente.nombre}`,
            qty: `${elementosNecesarios} elem.`,
            unit: `Radiador 50cm`,
            hint: `Pérdida: ${perdida_kcal} kcal/h`
        });
        materialesAgrupados['radiador_elemento_50cm'] = (materialesAgrupados['radiador_elemento_50cm'] || 0) + elementosNecesarios;
        materialesAgrupados['kit_instalacion_radiador'] = (materialesAgrupados['kit_instalacion_radiador'] || 0) + 1; // 1 kit por radiador
    }
  }

  // 2. Dimensionar Caldera y Bomba
  const potenciaCaldera_kcal = Math.ceil((balanceTermicoTotal_kcal * 1.2) / 1000) * 1000; // Sobredimensionar 20%
  recomendaciones.push(`Se requiere una caldera de al menos ${potenciaCaldera_kcal.toLocaleString('es-AR')} kcal/h para calefacción.`);
  if (balanceTermicoTotal_kcal > 15000) {
      recomendaciones.push("Para este tamaño de instalación, se recomienda una bomba circulatoria dedicada.");
  }
  
  materialesAgrupados[`caldera_${potenciaCaldera_kcal}_kcal`] = 1;

  // 3. Agrupar y convertir materiales finales
  if (materialesAgrupados['tubo_pex_200m']) {
      materialesAgrupados['tubo_pex_200m'] = Math.ceil(materialesAgrupados['tubo_pex_200m'] / 200);
  }
  if (sistema.tipo === 'losa_radiante') {
      const viasColector = ambientes.length;
      materialesAgrupados[`colector_${viasColector}_vias`] = 1;
  }

  for (const key in materialesAgrupados) {
    if (materialesAgrupados[key] > 0) {
      materiales.push({
        key,
        label: key.replace(/_/g, ' '),
        qty: materialesAgrupados[key],
        unit: 'u',
      });
    }
  }

  return { informe, recomendaciones, materiales };
}