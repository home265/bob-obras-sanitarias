"use client"; // <-- LA LÍNEA QUE SOLUCIONA EL ERROR

import { useState, useMemo, Suspense, useEffect } from "react";
import type { MaterialLine } from "@/lib/project/types";

import type { Sistema, AmbienteCalefaccion, DisenoLosa, DisenoRadiadores, CalefaccionPayload } from "@/lib/calc/calefaccion_types";
import Step1_Sistema from "./components/Step1_Sistema";
import Step2_Ambientes from "./components/Step2_Ambientes";
import Step3_Diseno from "./components/Step3_Diseno";
import ResultTable, { type ResultRow } from "@/components/ui/ResultTable";
import AddToProject from "@/components/ui/AddToProject";
import HelpPopover from "@/components/ui/HelpPopover";
import { calcularCalefaccion } from "@/lib/calc/calefaccion";
import { rid } from "@/lib/id";

function CalefaccionCalculator() {
  const [step, setStep] = useState(1);
  const [sistema, setSistema] = useState<Sistema>({ tipo: 'losa_radiante', calderaDual: false, plantas: 1 });
  const [ambientes, setAmbientes] = useState<AmbienteCalefaccion[]>([
    { id: rid('amb-cal'), nombre: 'Living Comedor', planta: 0, largo_m: 7, ancho_m: 5, alto_m: 2.8, vidrio: 'simple', m2_vidrio: 6 },
  ]);
  const [disenoLosa, setDisenoLosa] = useState<DisenoLosa>({ separacion_cm: 15, longitudMaxima_m: 100 });
  const [disenoRadiadores, setDisenoRadiadores] = useState<DisenoRadiadores>({});
  
  const [results, setResults] = useState<{informe: ResultRow[], recomendaciones: string[]} | null>(null);
  const [materials, setMaterials] = useState<MaterialLine[]>([]);

  useEffect(() => {
    setResults(null);
    setMaterials([]);
  }, [sistema, ambientes, disenoLosa, disenoRadiadores]);

  const handleCalculate = () => {
    const payload: CalefaccionPayload = { sistema, ambientes, disenoLosa, disenoRadiadores };
    const { informe, recomendaciones, materiales } = calcularCalefaccion(payload);
    setResults({ informe, recomendaciones });
    setMaterials(materiales);
  };
  
  const defaultTitle = `Cálculo de Calefacción - ${sistema.tipo === 'losa_radiante' ? 'Losa Radiante' : 'Radiadores'}`;
  const rawData = useMemo(() => ({
    inputs: { sistema, ambientes, disenoLosa, disenoRadiadores },
    outputs: { ...results, materials }
  }), [sistema, ambientes, disenoLosa, disenoRadiadores, results, materials]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora de Calefacción Profesional</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-6">
          {step === 1 && <Step1_Sistema sistema={sistema} setSistema={setSistema} />}
          {step === 2 && <Step2_Ambientes ambientes={ambientes} setAmbientes={setAmbientes} plantas={sistema.plantas} />}
          {step === 3 && <Step3_Diseno tipo={sistema.tipo} disenoLosa={disenoLosa} setDisenoLosa={setDisenoLosa} disenoRadiadores={disenoRadiadores} setDisenoRadiadores={setDisenoRadiadores} />}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="btn btn-secondary">Anterior</button>
            <span className="text-sm font-medium">Paso {step} de 3</span>
            {step < 3 ? (
              <button onClick={() => setStep(s => Math.min(3, s + 1))} className="btn btn-primary">Siguiente</button>
            ) : (
              <button onClick={handleCalculate} className="btn btn-primary">Calcular</button>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {results ? (
            <>
              <div className="card p-4">
                <h2 className="font-medium mb-3 text-lg">Informe de Diseño</h2>
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
                  <h3 className="font-semibold flex items-center mb-3">Lista Completa de Materiales</h3>
                  <ResultTable items={materials.map(m => ({label: m.label, qty: m.qty, unit: m.unit}))} />
                  <div className="pt-3 border-t border-border">
                    <AddToProject
                      kind="losa_radiante" // O podrías hacerlo dinámico
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
                    Completa los 3 pasos y presiona "Calcular" para ver el informe y la lista de materiales.
                </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function CalefaccionPage() {
    return (
        <Suspense fallback={<div>Cargando calculadora...</div>}>
            <CalefaccionCalculator />
        </Suspense>
    )
}