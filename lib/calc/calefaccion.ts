// lib/calc/calefaccion.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";
import type { CalefaccionPayload, ResultadoCalefaccion } from "./calefaccion_types";

// --- Constantes y Reglas de Diseño ---
const KCAL_POR_WATT = 0.860421;
const TEMPERATURA_INTERIOR_CONFORT_C = 20;

// --- El "Cerebro" de la Calculadora ---
export function calcularCalefaccion(input: CalefaccionPayload): ResultadoCalefaccion {
  const { sistema, ambientes, disenoLosa, catalogos } = input;
  
  const informe: ResultRow[] = [];
  const recomendaciones: string[] = [];
  const materiales: MaterialLine[] = [];
  const materialesAgrupados: Record<string, number> = {};

  let balanceTermicoTotal_kcal = 0;

  // 1. Determinar Delta T basado en la zona climática
  const zonaSeleccionada = catalogos.zonasClimaticas.find(z => z.id === sistema.zonaClimaticaId);
  const tempExteriorDiseno = zonaSeleccionada?.temperatura_diseno_invierno_c ?? 0;
  const deltaT = TEMPERATURA_INTERIOR_CONFORT_C - tempExteriorDiseno;

  // 2. Calcular Balance Térmico Profesional por Ambiente
  for (const ambiente of ambientes) {
    const { coeficientes } = catalogos;
    
    const kMuro = coeficientes.muros.find(m => m.key === ambiente.tipoMuro)?.k || 0;
    const kVidrio = coeficientes.vidrios.find(v => v.key === ambiente.tipoVidrio)?.k || 0;
    const kTecho = coeficientes.techos.find(t => t.key === ambiente.tipoTecho)?.k || 0;

    const perdidaMuros_W = kMuro * ambiente.m2_muro_exterior * deltaT;
    const perdidaVidrios_W = kVidrio * ambiente.m2_vidrio * deltaT;
    const perdidaTecho_W = (ambiente.planta === sistema.plantas - 1) 
      ? kTecho * ambiente.m2_techo_ultimo_piso * deltaT 
      : 0;

    // Se podría agregar pérdida por piso e infiltraciones para mayor precisión
    const perdidaTotal_W = perdidaMuros_W + perdidaVidrios_W + perdidaTecho_W;
    const perdida_kcal = Math.ceil(perdidaTotal_W * KCAL_POR_WATT);
    balanceTermicoTotal_kcal += perdida_kcal;

    // 3. Diseño del sistema (Losa o Radiadores) basado en el nuevo cálculo
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
        materialesAgrupados['tubo_pex_rollo_200m'] = (materialesAgrupados['tubo_pex_rollo_200m'] || 0) + metrosTuberia;

    } else { // Radiadores
        const KCAL_POR_ELEMENTO = 150; // Kcal/h por elemento de 50cm (valor típico)
        const elementosNecesarios = Math.ceil(perdida_kcal / KCAL_POR_ELEMENTO);
        
        informe.push({
            label: `Ambiente: ${ambiente.nombre}`,
            qty: `${elementosNecesarios} elem.`,
            unit: `Radiador 50cm`,
            hint: `Pérdida: ${perdida_kcal} kcal/h`
        });
        materialesAgrupados['radiador_elemento_50cm'] = (materialesAgrupados['radiador_elemento_50cm'] || 0) + elementosNecesarios;
        materialesAgrupados['kit_instalacion_radiador'] = (materialesAgrupados['kit_instalacion_radiador'] || 0) + 1;
    }
  }

  // 4. Dimensionar Caldera y generar recomendaciones
  const potenciaCaldera_kcal = Math.ceil((balanceTermicoTotal_kcal * 1.2) / 1000) * 1000; // Sobredimensionar 20%
  recomendaciones.push(`Para una T° exterior de diseño de ${tempExteriorDiseno}°C, se requiere una caldera de al menos ${potenciaCaldera_kcal.toLocaleString('es-AR')} kcal/h.`);
  if (balanceTermicoTotal_kcal > 15000) {
      recomendaciones.push("Para esta potencia, se recomienda una bomba circulatoria dedicada de alta eficiencia.");
  }
  
  materialesAgrupados[`caldera_mural_${potenciaCaldera_kcal}_kcal`] = 1;

  // 5. Agrupar y convertir materiales finales
  if (materialesAgrupados['tubo_pex_rollo_200m']) {
      materialesAgrupados['tubo_pex_rollo_200m'] = Math.ceil(materialesAgrupados['tubo_pex_rollo_200m'] / 200);
  }
  if (sistema.tipo === 'losa_radiante') {
      const viasColector = ambientes.length;
      materialesAgrupados[`colector_completo_${viasColector}_vias`] = 1;
  }

  for (const key in materialesAgrupados) {
    if (materialesAgrupados[key] > 0) {
      materiales.push({
        key,
        label: key.replace(/_/g, ' ').replace('kcal', 'kcal/h').replace('mural', 'Mural').replace('vias', 'Vías'),
        qty: materialesAgrupados[key],
        unit: key.startsWith('tubo_pex') ? 'rollos' : 'u',
      });
    }
  }

  return { informe, recomendaciones, materiales };
}