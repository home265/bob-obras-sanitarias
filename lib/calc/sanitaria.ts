// lib/calc/sanitaria.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";
import type { SanitariaPayload, ResultadoSanitario, AmbienteSanitario } from "./sanitaria_types";

// --- Constantes y Reglas de Diseño ---
const DIAMETROS_POR_ARTEFACTO: Record<string, number> = {
  inodoro: 110,
  pileta_patio: 63,
  boca_acceso: 63,
  pileta_cocina: 63,
  lavarropas: 63,
  banera: 50, // Bañera
  bidet: 40,  // Bidet
  lavavajillas: 50, // Lavavajillas
};

// ... (El resto del archivo `lib/calc/sanitaria.ts` permanece igual que en la versión anterior)

// --- El "Cerebro" de la Calculadora ---
export function calcularSanitaria(input: SanitariaPayload): ResultadoSanitario {
  const { edificio, disposicion, ambientes, montantes, colectoras, catalogos } = input;
  
  const informe: ResultRow[] = [];
  const recomendaciones: string[] = [];
  const materiales: MaterialLine[] = [];
  const materialesAgrupados: Record<string, number> = {};

  // --- Lógica de Cálculo ---

  // 1. Cómputo de Montantes Verticales
  for (const montante of montantes) {
    const longitud = (montante.plantaDescarga + 1) * edificio.alturaPlanta_m;
    const diametro = 110;
    
    informe.push({
      label: `Montante: ${montante.nombre}`,
      qty: `Ø${diametro}mm`,
      unit: `Longitud: ${longitud.toFixed(2)}m`,
    });
    
    const barras = Math.ceil(longitud / 3);
    materialesAgrupados[`pvc_tubo_${diametro}`] = (materialesAgrupados[`pvc_tubo_${diametro}`] || 0) + barras;
  }

  // 2. Cómputo de Colectora Principal
  for (const colectora of colectoras) {
      const diametroColectora = 110;
      const pendienteRecomendada = 2.0;

      informe.push({
        label: `Colectora: ${colectora.nombre}`,
        qty: `Ø${diametroColectora}mm`,
        unit: `Pendiente Rec: ${pendienteRecomendada}%`,
        hint: `Longitud: ${colectora.longitud_m}m`
      });

      const distMaxCamaras = catalogos.distanciasMax?.general_m || 30;
      const camarasNecesarias = Math.floor(colectora.longitud_m / distMaxCamaras);
      if (camarasNecesarias > 0) {
          recomendaciones.push(`Para la colectora de ${colectora.longitud_m}m, se recomienda instalar al menos ${camarasNecesarias} cámara(s) de inspección intermedia.`);
          materialesAgrupados['camara_inspeccion_60x60'] = (materialesAgrupados['camara_inspeccion_60x60'] || 0) + camarasNecesarias;
      }

      const barras = Math.ceil(colectora.longitud_m / 3);
      materialesAgrupados[`pvc_tubo_${diametroColectora}`] = (materialesAgrupados[`pvc_tubo_${diametroColectora}`] || 0) + barras;

      for (const acc in colectora.accesorios) {
          const key = `pvc_${acc}_${diametroColectora}`;
          materialesAgrupados[key] = (materialesAgrupados[key] || 0) + colectora.accesorios[acc];
      }
  }

  // 3. Cómputo de Ramales por Ambiente
  for (const ambiente of ambientes) {
    // Esta lógica se puede expandir para calcular los ramales internos
  }

  // 4. Lógica de Disposición Final
  if (disposicion.tipo === 'estatico') {
    const litrosPorHabitanteDia = 150;
    const volumenRequeridoLitros = disposicion.habitantes * litrosPorHabitanteDia * 30;
    const volumenPozoM3 = Math.ceil(volumenRequeridoLitros / 1000);

    recomendaciones.push(`Para ${disposicion.habitantes} habitantes, se recomienda un pozo ciego de al menos ${volumenPozoM3} m³ (${volumenPozoM3 * 1000} L), precedido por una cámara séptica.`);
    materialesAgrupados['camara_septica_1000l'] = 1;
  }
  
  // 5. Convertir materiales agrupados al formato final
  for (const key in materialesAgrupados) {
    if (materialesAgrupados[key] > 0) {
      materiales.push({
        key,
        label: key.replace(/_/g, ' ').replace('pvc', 'PVC').replace('60x60', '60x60cm'),
        qty: materialesAgrupados[key],
        unit: 'u',
      });
    }
  }

  return { informe, recomendaciones, materiales };
}