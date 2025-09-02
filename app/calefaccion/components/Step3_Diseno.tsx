"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput";
import type { DisenoLosa, DisenoRadiadores } from "@/lib/calc/calefaccion_types";

interface Props {
  tipo: "losa_radiante" | "radiadores";
  disenoLosa: DisenoLosa;
  setDisenoLosa: React.Dispatch<React.SetStateAction<DisenoLosa>>;
  disenoRadiadores: DisenoRadiadores;
  setDisenoRadiadores: React.Dispatch<React.SetStateAction<DisenoRadiadores>>;
}

export default function Step3_Diseno({ tipo, disenoLosa, setDisenoLosa, disenoRadiadores, setDisenoRadiadores }: Props) {
  
  const handleLosaChange = (field: keyof DisenoLosa, value: number) => {
    setDisenoLosa(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 3: Diseño del Sistema</h3>
      
      {tipo === 'losa_radiante' && (
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm block">
              <span className="font-medium flex items-center">
              Separación de Tubería (cm)
              <HelpPopover>Distancia en centímetros entre cada vuelta de la tubería. Un valor típico es 15 o 20 cm.</HelpPopover>
              </span>
              <SimpleNumberInput value={disenoLosa.separacion_cm} onChange={v => handleLosaChange('separacion_cm', v)} className="w-full px-3 py-2 mt-1" />
          </label>
           <label className="text-sm block">
              <span className="font-medium flex items-center">
              Long. Máx. por Circuito (m)
              <HelpPopover>Longitud máxima recomendada para un solo circuito para evitar pérdidas de presión. Típicamente entre 80 y 120 metros.</HelpPopover>
              </span>
              <SimpleNumberInput value={disenoLosa.longitudMaxima_m} onChange={v => handleLosaChange('longitudMaxima_m', v)} className="w-full px-3 py-2 mt-1" />
          </label>
        </div>
      )}

      {tipo === 'radiadores' && (
        <div className="text-sm text-foreground/70">
          <p>La calculadora recomendará la cantidad de elementos por radiador para cada ambiente basándose en el balance térmico.</p>
        </div>
      )}
    </div>
  );
}