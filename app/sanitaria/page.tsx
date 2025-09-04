"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import type { MaterialLine } from "@/lib/project/types";

// Se importan los nuevos tipos, incluyendo TramoVentilacion y ResultadoSanitario
import type { EdificioSanitario, DisposicionFinal, AmbienteSanitario, Montante, Colectora, TramoVentilacion, SanitariaPayload, ResultadoSanitario } from "@/lib/calc/sanitaria_types";
import Step1_General from "./components/Step1_General";
import Step2_Ambientes from "./components/Step2_Ambientes";
import Step3_Trazado from "./components/Step3_Trazado";
import Step4_Ventilacion from "./components/Step4_Ventilacion"; // Se importa el nuevo paso
import ResultTable, { type ResultRow } from "@/components/ui/ResultTable";
import AddToProject from "@/components/ui/AddToProject";
import { calcularSanitaria } from "@/lib/calc/sanitaria";
import { rid } from "@/lib/id";
import { useJson } from "@/public/data/useJson";


function SanitariaCalculator() {
  const [step, setStep] = useState(1);
  const [edificio, setEdificio] = useState<EdificioSanitario>({ plantas: 1, alturaPlanta_m: 2.8 });
  const [disposicion, setDisposicion] = useState<DisposicionFinal>({ tipo: 'cloaca', profundidadConexion_cm: 80, distanciaPozo_m: 10, habitantes: 4 });
  const [ambientes, setAmbientes] = useState<AmbienteSanitario[]>([{ id: rid('amb'), nombre: 'Baño PB', planta: 0, artefactos: { inodoro: 1, pileta_patio: 1 } }]);
  const [montantes, setMontantes] = useState<Montante[]>([]);
  const [colectoras, setColectoras] = useState<Colectora[]>([{ id: rid('col'), nombre: 'Colectora Principal', longitud_m: 15, accesorios: {} }]);
  const [ventilaciones, setVentilaciones] = useState<TramoVentilacion[]>([]); // Nuevo estado para la ventilación
  
  const [results, setResults] = useState<ResultadoSanitario | null>(null);
  
  useEffect(() => {
    setResults(null);
  }, [edificio, disposicion, ambientes, montantes, colectoras, ventilaciones]); // Se añade 'ventilaciones' a las dependencias

  const catalogos = {
    pvcPegamento: useJson("/data/sanitaria/catalogo_pvc_pegamento.json", {}),
    pvcJunta: useJson("/data/sanitaria/catalogo_pvc_junta.json", {}),
    pendientes: useJson("/data/sanitaria/pendientes_por_dn.json", []),
    distanciasMax: useJson("/data/sanitaria/long_max_entre_accesos.json", { general_m: 30, a_artefactos_sin_prol_m: 15 }),
  };

  const handleCalculate = () => {
    const payload: SanitariaPayload = { 
      edificio, 
      disposicion, 
      ambientes, 
      montantes, 
      colectoras, 
      ventilaciones, // Se pasa el nuevo estado al payload
      catalogos 
    };
    const resultData = calcularSanitaria(payload);
    setResults(resultData);
  };
  
  const defaultTitle = useMemo(() => `Instalación Sanitaria - ${ambientes.length} ambientes`, [ambientes]);
  const rawData = useMemo(() => ({
    inputs: { edificio, disposicion, ambientes, montantes, colectoras, ventilaciones }, // Se añade 'ventilaciones'
    outputs: { ...results }
  }), [edificio, disposicion, ambientes, montantes, colectoras, ventilaciones, results]); // Se añade 'ventilaciones'

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora Sanitaria Profesional</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-6">
          {step === 1 && <Step1_General edificio={edificio} setEdificio={setEdificio} disposicion={disposicion} setDisposicion={setDisposicion} />}
          {step === 2 && <Step2_Ambientes ambientes={ambientes} setAmbientes={setAmbientes} plantas={edificio.plantas} />}
          {step === 3 && <Step3_Trazado montantes={montantes} setMontantes={setMontantes} colectoras={colectoras} setColectoras={setColectoras} plantas={edificio.plantas} />}
          {step === 4 && <Step4_Ventilacion ventilaciones={ventilaciones} setVentilaciones={setVentilaciones} plantas={edificio.plantas} />}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="btn btn-secondary">Anterior</button>
            <span className="text-sm font-medium">Paso {step} de 4</span>
            {step < 4 ? (
              <button onClick={() => setStep(s => Math.min(4, s + 1))} className="btn btn-primary">Siguiente</button>
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
              {results.materiales.length > 0 && (
                <div className="card p-4 space-y-3">
                  <h3 className="font-semibold flex items-center mb-3">Lista Completa de Materiales</h3>
                  <ResultTable items={results.materiales.map(m => ({label: m.label, qty: m.qty, unit: m.unit}))} />
                  <div className="pt-3 border-t border-border">
                    <AddToProject
                      kind="sanitaria"
                      defaultTitle={defaultTitle}
                      items={results.materiales}
                      raw={rawData}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
             <div className="card p-4 h-full flex items-center justify-center">
                <p className="text-center text-foreground/70">
                    Completa los 4 pasos y presiona "Calcular" para ver el informe, las validaciones y la lista de materiales.
                </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function SanitariaPage() {
    return (
        <Suspense fallback={<div>Cargando calculadora...</div>}>
            <SanitariaCalculator />
        </Suspense>
    )
}