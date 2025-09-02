// lib/calc/agua.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";
import type { AguaPayload, ResultadoAgua, Tramo } from "./agua_types";

export function calcularAgua(input: AguaPayload): ResultadoAgua {
  const { edificio, ambientes, trazado, catalogos } = input;
  
  const informe: ResultRow[] = [];
  const recomendaciones: string[] = [];
  const materiales: MaterialLine[] = [];
  const materialesAgrupados: Record<string, number> = {};

  const UNIDADES_CONSUMO = catalogos.unidadesConsumo || {};
  const CAUDAL_PROBABLE: Record<number, number> = { 1.5: 0.15, 3: 0.2, 4.5: 0.25, 6: 0.3, 8: 0.35, 10: 0.4, 15: 0.5, 20: 0.6, 30: 0.8 };
  const TUBERIAS_PPR = catalogos.ppr?.pipes || [];
  const VELOCIDAD_MAX_MS = catalogos.limitesVelocidad?.max_ms || 2.0;
  
  let consumoTotalACS_ls = 0; // Consumo total de Agua Caliente Sanitaria en L/s

  // Función interna para procesar una red (fría o caliente)
  const procesarRed = (tramos: Tramo[], tipoRed: 'Frío' | 'Caliente') => {
    for (const tramo of tramos) {
      let ucTramo = 0;
      const ambienteAlimentado = ambientes.find(a => a.id === tramo.idDestino);
      if (ambienteAlimentado) {
          for (const artefacto in ambienteAlimentado.artefactos) {
              ucTramo += (UNIDADES_CONSUMO[artefacto] || 0) * ambienteAlimentado.artefactos[artefacto];
          }
      }
      
      let caudal_ls = 0.1;
      for (const uc in CAUDAL_PROBABLE) {
        if (ucTramo <= Number(uc)) {
          caudal_ls = CAUDAL_PROBABLE[uc as any];
          break;
        }
      }
      const caudal_m3s = caudal_ls / 1000;
      if (tipoRed === 'Caliente') consumoTotalACS_ls += caudal_ls;

      let diametroRecomendado_mm = TUBERIAS_PPR[0]?.dn_mm || 20;
      for (const tuberia of TUBERIAS_PPR) {
        const diam_int_m = tuberia.inner_mm / 1000;
        const area_m2 = Math.PI * Math.pow(diam_int_m / 2, 2);
        const velocidad_ms = caudal_m3s / area_m2;
        diametroRecomendado_mm = tuberia.dn_mm;
        if (velocidad_ms <= VELOCIDAD_MAX_MS) break;
      }

      const tuberiaFinal = TUBERIAS_PPR.find((t: any) => t.dn_mm === diametroRecomendado_mm);
      const velocidadFinal = caudal_m3s / (Math.PI * Math.pow((tuberiaFinal?.inner_mm || 1) / 2000, 2));

      informe.push({
        label: `Tramo ${tipoRed}: ${tramo.nombre}`,
        qty: `Ø${diametroRecomendado_mm}mm`,
        unit: `Caudal: ${caudal_ls.toFixed(2)} L/s`,
        hint: `Velocidad: ${velocidadFinal.toFixed(2)} m/s`
      });
      
      const barras = Math.ceil(tramo.longitud_m / 4);
      materialesAgrupados[`ppr_tubo_${diametroRecomendado_mm}`] = (materialesAgrupados[`ppr_tubo_${diametroRecomendado_mm}`] || 0) + barras;

      for (const acc in tramo.accesorios) {
        const keyAcc = `ppr_${acc}_${diametroRecomendado_mm}`;
        materialesAgrupados[keyAcc] = (materialesAgrupados[keyAcc] || 0) + tramo.accesorios[acc];
      }
    }
  };

  // Procesamos ambas redes
  procesarRed(trazado.fria, 'Frío');
  procesarRed(trazado.caliente, 'Caliente');

  // Añadir recomendaciones profesionales
  recomendaciones.push("Verificar que la presión en el artefacto más desfavorable sea mayor a 4 m.c.a. (0.4 bar).");
  if (edificio.fuenteCaliente.tipo === 'caldera' && consumoTotalACS_ls > 0) {
      const kcalRequeridas = Math.ceil((consumoTotalACS_ls * 60 * 20) / 0.8 / 1000) * 1000; // Formula simplificada
      recomendaciones.push(`Para un consumo simultáneo de ${consumoTotalACS_ls.toFixed(2)} L/s de ACS, se recomienda una caldera de al menos ${kcalRequeridas.toLocaleString('es-AR')} kcal/h.`);
  }

  informe.unshift({ label: "Altura del Tanque", qty: edificio.alturaTanque_m, unit: "m" });

  for (const key in materialesAgrupados) {
    if (materialesAgrupados[key] > 0) {
      materiales.push({
        key,
        label: key.replace(/_/g, ' ').toUpperCase(),
        qty: materialesAgrupados[key],
        unit: 'u',
      });
    }
  }

  return { informe, recomendaciones, materiales };
}