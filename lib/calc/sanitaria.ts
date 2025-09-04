// lib/calc/sanitaria.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";
import type { SanitariaPayload, ResultadoSanitario } from "./sanitaria_types";

// --- El "Cerebro" de la Calculadora ---
export function calcularSanitaria(input: SanitariaPayload): ResultadoSanitario {
  // Se desestructuran los nuevos datos de entrada: 'ventilaciones'
  const { edificio, disposicion, ambientes, montantes, colectoras, ventilaciones, catalogos } = input;
  
  const informe: ResultRow[] = [];
  const recomendaciones: string[] = [];
  const materiales: MaterialLine[] = [];
  const materialesAgrupados: Record<string, number> = {};

  // --- Lógica de Cálculo ---

  // 1. Cómputo de Montantes Verticales (sin cambios)
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

  // 2. Cómputo y Verificación de Colectora Principal
  for (const colectora of colectoras) {
      const diametroColectora = 110;
      const pendienteInfo = catalogos.pendientes.find(p => p.dn_mm === diametroColectora);
      const pendienteRecomendada = pendienteInfo?.recom || 1.67; // Pendiente recomendada en %

      const desnivel_total_cm = (colectora.longitud_m * pendienteRecomendada);
      // Se asume una profundidad de arranque de 40cm bajo nivel de piso terminado
      const cotaSalida_cm = 40 + desnivel_total_cm;

      informe.push({
        label: `Colectora: ${colectora.nombre}`,
        qty: `Ø${diametroColectora}mm`,
        unit: `Pendiente: ${pendienteRecomendada}%`,
        hint: `Long: ${colectora.longitud_m}m | Desnivel: ${desnivel_total_cm.toFixed(0)}cm`
      });

      if (disposicion.tipo === 'cloaca') {
          if (cotaSalida_cm > disposicion.profundidadConexion_cm) {
              recomendaciones.push(`¡ALERTA DE COTA! La salida de la colectora (${cotaSalida_cm.toFixed(0)}cm) queda por debajo de la conexión a la cloaca (${disposicion.profundidadConexion_cm}cm). Se requiere una bomba de achique o replantear el trazado.`);
          } else {
              recomendaciones.push(`Verificación de cota OK. La salida (${cotaSalida_cm.toFixed(0)}cm) está por encima de la conexión cloacal (${disposicion.profundidadConexion_cm}cm), permitiendo el desagüe por gravedad.`);
          }
      }

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

  // 3. NUEVO: Cómputo del Sistema de Ventilación
  recomendaciones.push("Se ha computado un sistema de ventilación principal. Asegurar que las terminaciones queden a los 4 vientos.");
  for (const tramo of ventilaciones) {
      informe.push({
          label: `Ventilación: ${tramo.nombre}`,
          qty: `Ø${tramo.dn_mm}mm`,
          unit: `Longitud: ${tramo.longitud_m.toFixed(2)}m`
      });

      const barras = Math.ceil(tramo.longitud_m / 3);
      materialesAgrupados[`pvc_tubo_ventilacion_${tramo.dn_mm}`] = (materialesAgrupados[`pvc_tubo_ventilacion_${tramo.dn_mm}`] || 0) + barras;
      
      if (tramo.terminacion === 'sombrerete') {
        materialesAgrupados[`sombrerete_${tramo.dn_mm}`] = (materialesAgrupados[`sombrerete_${tramo.dn_mm}`] || 0) + 1;
      }

      for (const acc in tramo.accesorios) {
          const key = `pvc_${acc}_${tramo.dn_mm}`;
          materialesAgrupados[key] = (materialesAgrupados[key] || 0) + tramo.accesorios[acc];
      }
  }

  // 4. Lógica de Disposición Final (sin cambios)
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