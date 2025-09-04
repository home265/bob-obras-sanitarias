"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import type { MaterialLine } from "@/lib/project/types";

// Se importan todos los tipos necesarios, incluyendo el Resultado completo
import type { Sistema, AmbienteCalefaccion, DisenoLosa, DisenoRadiadores, CalefaccionPayload, ResultadoCalefaccion } from "@/lib/calc/calefaccion_types";
import Step1_Sistema from "./components/Step1_Sistema";
import Step2_Ambientes from "./components/Step2_Ambientes";
import Step3_Diseno from "./components/Step3_Diseno";
import ResultTable, { type ResultRow } from "@/components/ui/ResultTable";
import AddToProject from "@/components/ui/AddToProject";
import { calcularCalefaccion } from "@/lib/calc/calefaccion";
import { rid } from "@/lib/id";
import { useJson } from "@/public/data/useJson";


function CalefaccionCalculator() {
  const [step, setStep] = useState(1);

  // Se cargan los catálogos en el componente padre
  const zonasClimaticas = useJson<CalefaccionPayload['catalogos']['zonasClimaticas']>("/data/calefaccion/zonas_climaticas_argentina.json", []);
  const coeficientes = useJson<CalefaccionPayload['catalogos']['coeficientes']>("/data/calefaccion/coeficientes_transmitancia.json", { muros: [], techos: [], vidrios: [], pisos: [] });
  
  // Se actualizan los estados iniciales para incluir los nuevos campos
  const [sistema, setSistema] = useState<Sistema>({ 
    tipo: 'losa_radiante', 
    calderaDual: false, 
    plantas: 1,
    zonaClimaticaId: "templada_fria" // Valor por defecto inicial
  });

  const [ambientes, setAmbientes] = useState<AmbienteCalefaccion[]>([
    { 
      id: rid('amb-cal'), 
      nombre: 'Living Comedor', 
      planta: 0, 
      largo_m: 7, 
      ancho_m: 5, 
      alto_m: 2.8, 
      tipoVidrio: 'simple', 
      m2_vidrio: 6,
      // Nuevos campos con valores por defecto
      tipoMuro: "ladrillo_hueco_18_revoque",
      m2_muro_exterior: 25,
      tipoTecho: "losa_hormigon_20_sin_aislacion",
      m2_techo_ultimo_piso: 35
    },
  ]);
  const [disenoLosa, setDisenoLosa] = useState<DisenoLosa>({ separacion_cm: 15, longitudMaxima_m: 100 });
  const [disenoRadiadores, setDisenoRadiadores] = useState<DisenoRadiadores>({});
  
  const [results, setResults] = useState<ResultadoCalefaccion | null>(null);

  // Efecto para setear valores por defecto una vez que cargan los catálogos
  useEffect(() => {
    if (zonasClimaticas.length > 0 && !sistema.zonaClimaticaId) {
      setSistema(s => ({ ...s, zonaClimaticaId: zonasClimaticas[3]?.id || zonasClimaticas[0].id }));
    }
  }, [zonasClimaticas, sistema.zonaClimaticaId]);


  useEffect(() => {
    setResults(null);
  }, [sistema, ambientes, disenoLosa, disenoRadiadores]);

  const handleCalculate = () => {
    // Se construye el payload con los catálogos cargados
    const payload: CalefaccionPayload = { 
      sistema, 
      ambientes, 
      disenoLosa, 
      disenoRadiadores,
      catalogos: {
        zonasClimaticas,
        coeficientes,
      }
    };
    const resultData = calcularCalefaccion(payload);
    setResults(resultData);
  };
  
  const defaultTitle = `Cálculo de Calefacción - ${sistema.tipo === 'losa_radiante' ? 'Losa Radiante' : 'Radiadores'}`;
  
  const rawData = useMemo(() => ({
    inputs: { sistema, ambientes, disenoLosa, disenoRadiadores },
    outputs: { ...results }
  }), [sistema, ambientes, disenoLosa, disenoRadiadores, results]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Calculadora de Calefacción Profesional</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-6">
          <Suspense fallback={<div>Cargando...</div>}>
            {step === 1 && <Step1_Sistema sistema={sistema} setSistema={setSistema} />}
            {step === 2 && <Step2_Ambientes ambientes={ambientes} setAmbientes={setAmbientes} plantas={sistema.plantas} />}
          </Suspense>
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
              {results.materiales.length > 0 && (
                <div className="card p-4 space-y-3">
                  <h3 className="font-semibold flex items-center mb-3">Lista Completa de Materiales</h3>
                  <ResultTable items={results.materiales.map(m => ({label: m.label, qty: m.qty, unit: m.unit}))} />
                  <div className="pt-3 border-t border-border">
                    <AddToProject
                      kind={sistema.tipo}
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