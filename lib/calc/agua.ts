// lib/calc/agua.ts
import type { MaterialLine } from "@/lib/project/types";
import type { ResultRow } from "@/components/ui/ResultTable";
import type { AguaPayload, ResultadoAgua, Tramo, TramoCalculado } from "./agua_types";

export function calcularAgua(input: AguaPayload): ResultadoAgua {
  const { edificio, ambientes, trazado, catalogos } = input;
  
  const informe: ResultRow[] = [];
  const recomendaciones: string[] = [];
  const materiales: MaterialLine[] = [];
  const materialesAgrupados: Record<string, number> = {};

  const { unidadesConsumo, ppr, limitesVelocidad, kEquivalentes } = catalogos;
  const CAUDAL_PROBABLE: Record<number, number> = { 1.5: 0.15, 3: 0.2, 4.5: 0.25, 6: 0.3, 8: 0.35, 10: 0.4, 15: 0.5, 20: 0.6, 30: 0.8 };
  
  let consumoTotalACS_ls = 0;
  let presionMinimaEnArtefacto = Infinity;

  const tramosCalculados: { fria: TramoCalculado[], caliente: TramoCalculado[] } = { fria: [], caliente: [] };

  const procesarRed = (tramos: Tramo[], tipoRed: 'Frío' | 'Caliente') => {
    let presionActual_mca = edificio.presionInicial_mca;

    for (const tramo of tramos) {
      let ucTramo = 0;
      const ambienteAlimentado = ambientes.find(a => a.id === tramo.idDestino);
      if (ambienteAlimentado) {
        ucTramo = Object.entries(ambienteAlimentado.artefactos)
          .reduce((sum, [key, count]) => sum + (unidadesConsumo[key] || 0) * count, 0);
      }

      let caudal_ls = 0.1; // Caudal mínimo
      const sortedCaudales = Object.entries(CAUDAL_PROBABLE).sort(([a], [b]) => Number(a) - Number(b));
      for (const [uc, caudal] of sortedCaudales) {
        if (ucTramo <= Number(uc)) {
          caudal_ls = caudal;
          break;
        }
      }
      const caudal_m3s = caudal_ls / 1000;
      if (tipoRed === 'Caliente') consumoTotalACS_ls += caudal_ls;

      let diametroRecomendado_mm = ppr.pipes[0]?.dn_mm || 20;
      for (const tuberia of ppr.pipes) {
        const diam_int_m = tuberia.inner_mm / 1000;
        const area_m2 = Math.PI * Math.pow(diam_int_m / 2, 2);
        const velocidad_ms = caudal_m3s / area_m2;
        diametroRecomendado_mm = tuberia.dn_mm;
        if (velocidad_ms <= limitesVelocidad.max_ms) break;
      }

      const tuberiaFinal = ppr.pipes.find(t => t.dn_mm === diametroRecomendado_mm);
      if (!tuberiaFinal) continue; // Skip if no suitable pipe is found

      const diam_int_m = tuberiaFinal.inner_mm / 1000;
      const area_m2 = Math.PI * Math.pow(diam_int_m / 2, 2);
      const velocidadFinal_ms = caudal_m3s / area_m2;

      // Cálculo de Pérdida de Carga (Hazen-Williams)
      const C = tuberiaFinal.c_hw;
      // J = pérdida de carga unitaria (m/m)
      const J = (10.67 * Math.pow(caudal_m3s, 1.852)) / (Math.pow(C, 1.852) * Math.pow(diam_int_m, 4.87));
      
      let longitudEquivalenteAccesorios = 0;
      for (const accId in tramo.accesorios) {
        const k = kEquivalentes.find(kEq => kEq.tipo === accId && kEq.dn_mm === diametroRecomendado_mm);
        if (k) {
          longitudEquivalenteAccesorios += k.leq_m * tramo.accesorios[accId];
        }
      }
      
      const longitudCalculoTotal = tramo.longitud_m + longitudEquivalenteAccesorios;
      const perdida_mca = J * longitudCalculoTotal;
      
      // La presión final se calcula restando la pérdida del tramo.
      // NOTA: Para un cálculo exacto, el sistema debería ser un grafo.
      // Aquí asumimos un cálculo secuencial simple.
      presionActual_mca -= perdida_mca;
      presionMinimaEnArtefacto = Math.min(presionMinimaEnArtefacto, presionActual_mca);

      const tramoCalculado: TramoCalculado = {
        ...tramo,
        uc: ucTramo,
        caudal_ls,
        diametro_mm: diametroRecomendado_mm,
        velocidad_ms: velocidadFinal_ms,
        perdida_mca,
        presionFinal_mca: presionActual_mca
      };
      
      if (tipoRed === 'Frío') tramosCalculados.fria.push(tramoCalculado);
      else tramosCalculados.caliente.push(tramoCalculado);

      informe.push({
        label: `Tramo ${tipoRed}: ${tramo.nombre}`,
        qty: `Ø${diametroRecomendado_mm}mm`,
        unit: `Caudal: ${caudal_ls.toFixed(2)} L/s`,
        hint: `Vel: ${velocidadFinal_ms.toFixed(2)} m/s | P.Final: ${presionActual_mca.toFixed(2)} mca`
      });
      
      const barras = Math.ceil(tramo.longitud_m / tuberiaFinal.barra_m);
      const keyTubo = `ppr_tubo_${diametroRecomendado_mm}`;
      materialesAgrupados[keyTubo] = (materialesAgrupados[keyTubo] || 0) + barras;

      for (const acc in tramo.accesorios) {
        const keyAcc = `ppr_${acc}_${diametroRecomendado_mm}`;
        materialesAgrupados[keyAcc] = (materialesAgrupados[keyAcc] || 0) + tramo.accesorios[acc];
      }
    }
  };

  procesarRed(trazado.fria, 'Frío');
  procesarRed(trazado.caliente, 'Caliente');

  if (presionMinimaEnArtefacto < 4) {
    recomendaciones.push(`¡Atención! La presión mínima calculada es de ${presionMinimaEnArtefacto.toFixed(2)} m.c.a., inferior a los 4 m.c.a. recomendados. Considere aumentar la altura del tanque o el diámetro de las tuberías principales.`);
  } else {
    recomendaciones.push(`La presión mínima calculada en el artefacto más desfavorable es de ${presionMinimaEnArtefacto.toFixed(2)} m.c.a., lo cual es adecuado.`);
  }
  
  if (edificio.fuenteCaliente.tipo === 'caldera' && consumoTotalACS_ls > 0) {
      const kcalRequeridas = Math.ceil((consumoTotalACS_ls * 60 * 20) / 0.8 / 1000) * 1000;
      recomendaciones.push(`Para un consumo simultáneo de ${consumoTotalACS_ls.toFixed(2)} L/s de ACS, se recomienda una caldera de al menos ${kcalRequeridas.toLocaleString('es-AR')} kcal/h.`);
  }

  informe.unshift({ label: "Presión Inicial del Sistema", qty: edificio.presionInicial_mca, unit: "m.c.a." });

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

  return { informe, recomendaciones, materiales, tramosCalculados };
}