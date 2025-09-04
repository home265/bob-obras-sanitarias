"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import type { MaterialLine } from "@/lib/project/types";


import type { Edificio, Ambiente, Trazado, AguaPayload, ResultadoAgua } from "@/lib/calc/agua_types";
import Step1_Edificio from "./components/Step1_Edificio";
import Step2_Ambientes from "./components/Step2_Ambientes";
import Step3_Trazado from "./components/Step3_Trazado";
import ResultTable, { type ResultRow } from "@/components/ui/ResultTable";
import AddToProject from "@/components/ui/AddToProject";
import { calcularAgua } from "@/lib/calc/agua";
import { rid } from "@/lib/id";
import { useJson } from "@/public/data/useJson";


function AguaCalculator() {
  const [step, setStep] = useState(1);
  const [edificio, setEdificio] = useState<Edificio>({
    plantas: 2,
    alturaPlanta_m: 2.8,
    alturaTanque_m: 1.5,
    presionInicial_mca: 1.5, // Valor inicial por defecto, igual a la altura del tanque
    fuenteCaliente: { tipo: "caldera", ubicacion: "PB - Lavadero" },
  });
  
  const [ambientes, setAmbientes] = useState<Ambiente[]>([
    { id: rid("amb"), nombre: "Baño Planta Baja", planta: 0, artefactos: { ducha: 1, lavatorio: 1, inodoro: 1 } },
    { id: rid("amb"), nombre: "Baño Planta Alta", planta: 1, artefactos: { ducha: 1, lavatorio: 1, inodoro: 1 } },
  ]);

  const [trazado, setTrazado] = useState<Trazado>({ fria: [], caliente: [] });
  
  const [results, setResults] = useState<ResultadoAgua | null>(null);
  const [materials, setMaterials] = useState<MaterialLine[]>([]);
  
  useEffect(() => {
    setResults(null);
    setMaterials([]);
  }, [edificio, ambientes, trazado]);

  // Se agregan los nuevos catálogos y se eliminan los 'any' implícitos
  const catalogos = {
      ppr: useJson("/data/agua/catalogo_ppr.json", { pipes: [] }),
      unidadesConsumo: useJson("/data/agua/unidades_consumo.json", {}),
      kEquivalentes: useJson("/data/agua/k_equivalentes.json", []),
      limitesVelocidad: useJson("/data/agua/limites_velocidad.json", { min_ms: 0.5, max_ms: 2.0 }),
      // formulasHidraulicas: useJson("/data/agua/formulas_hidraulicas.json", {}) // No es necesario pasarlo, es usado internamente por la lib
  };

  const handleCalculate = () => {
    // Se asegura que los catálogos estén cargados antes de calcular
    if (!catalogos.ppr.pipes.length || !catalogos.kEquivalentes.length) {
        alert("Los catálogos de materiales aún no han cargado. Por favor, espere un momento y vuelva a intentarlo.");
        return;
    }
    const payload: AguaPayload = { edificio, ambientes, trazado, catalogos };
    const { informe, recomendaciones, materiales } = calcularAgua(payload);
    setResults({ informe, recomendaciones, materiales });
    setMaterials(materiales);
  };
  
  const defaultTitle = useMemo(() => {
    return `Instalación de Agua - ${edificio.plantas} plantas, ${ambientes.length} ambientes`;
  }, [edificio, ambientes]);
  
  const rawData = useMemo(() => ({
    inputs: { edificio, ambientes, trazado },
    outputs: { ...results } // 'materials' ya está incluido dentro de 'results'
  }), [edificio, ambientes, trazado, results]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora Profesional de Agua F/C</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-6">
          {step === 1 && <Step1_Edificio edificio={edificio} setEdificio={setEdificio} />}
          {step === 2 && <Step2_Ambientes ambientes={ambientes} setAmbientes={setAmbientes} plantas={edificio.plantas} />}
          {step === 3 && <Step3_Trazado trazado={trazado} setTrazado={setTrazado} ambientes={ambientes} />}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="btn btn-secondary">
              Anterior
            </button>
            <span className="text-sm font-medium">Paso {step} de 3</span>
            {step < 3 ? (
              <button onClick={() => setStep(s => Math.min(3, s + 1))} className="btn btn-primary">
                Siguiente
              </button>
            ) : (
              <button onClick={handleCalculate} className="btn btn-primary">
                Calcular
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {results ? (
            <>
              <div className="card p-4">
                <h2 className="font-medium mb-3 text-lg">Informe de Diseño y Diagnóstico</h2>
                <ResultTable items={results.informe} />
              </div>
              {results.recomendaciones.length > 0 && (
                <div className="card p-4 border-l-4 border-[var(--color-base)]">
                    <h3 className="font-medium mb-2 text-lg text-[var(--color-base)]">Recomendaciones Profesionales</h3>
                    <ul className="text-sm space-y-1 list-disc pl-5">
                      {results.recomendaciones.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                </div>
              )}
              {materials.length > 0 && (
                <div className="card p-4 space-y-3">
                  <h3 className="font-semibold flex items-center mb-3">
                    Lista Completa de Materiales
                  </h3>
                  <ResultTable items={materials.map(m => ({label: m.label, qty: m.qty, unit: m.unit}))} />
                  <div className="pt-3 border-t border-border">
                    <AddToProject
                      kind="agua"
                      defaultTitle={defaultTitle}
                      items={materials}
                      raw={rawData}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
             <div className="card p-4 h-full flex items-center justify-center">
                <p className="text-center text-foreground/70">
                    Los resultados del cálculo y la lista de materiales aparecerán aquí una vez que completes los 3 pasos.
                </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AguaPage() {
    return (
        <Suspense fallback={<div>Cargando calculadora...</div>}>
            <AguaCalculator />
        </Suspense>
    )
}