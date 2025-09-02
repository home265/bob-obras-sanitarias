"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import type { Edificio } from "@/lib/calc/agua_types";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput"; // <-- IMPORTAMOS EL INPUT CORREGIDO

interface Props {
  edificio: Edificio;
  setEdificio: React.Dispatch<React.SetStateAction<Edificio>>;
}

export default function Step1_Edificio({ edificio, setEdificio }: Props) {
  const handleChange = (field: keyof Edificio, value: string | number) => {
    // Asegurarse de que las plantas no sean menores a 1
    const finalValue = field === 'plantas' ? Math.max(1, Number(value)) : value;
    setEdificio(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleFuenteChange = (field: keyof Edificio['fuenteCaliente'], value: string) => {
    setEdificio(prev => ({
      ...prev,
      fuenteCaliente: { ...prev.fuenteCaliente, [field]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 1: Define el Edificio</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="text-sm block">
          <span className="font-medium flex items-center">
            Número de Plantas
            <HelpPopover>Cantidad total de pisos del edificio (ej: PB + 1 Planta Alta = 2).</HelpPopover>
          </span>
          {/* USAMOS EL NUEVO INPUT AQUÍ */}
          <SimpleNumberInput
            min={1}
            value={edificio.plantas}
            onChange={value => handleChange('plantas', value)}
            className="w-full px-3 py-2 mt-1"
          />
        </label>
        <label className="text-sm block">
          <span className="font-medium flex items-center">
            Altura por Planta (m)
            <HelpPopover>Altura promedio de piso a techo en metros.</HelpPopover>
          </span>
          {/* USAMOS EL NUEVO INPUT AQUÍ */}
          <SimpleNumberInput
            step="0.1"
            min={2}
            value={edificio.alturaPlanta_m}
            onChange={value => handleChange('alturaPlanta_m', value)}
            className="w-full px-3 py-2 mt-1"
          />
        </label>
        <label className="text-sm block col-span-2">
          <span className="font-medium flex items-center">
            Altura del Tanque sobre Techo (m)
            <HelpPopover>Distancia vertical en metros desde la base del tanque hasta el techo de la última planta.</HelpPopover>
          </span>
          {/* USAMOS EL NUEVO INPUT AQUÍ */}
          <SimpleNumberInput
            step="0.1"
            value={edificio.alturaTanque_m}
            onChange={value => handleChange('alturaTanque_m', value)}
            className="w-full px-3 py-2 mt-1"
          />
        </label>
      </div>
       <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-2">Fuente de Agua Caliente</h4>
           <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm block">
                <span className="font-medium">Tipo</span>
                <select value={edificio.fuenteCaliente.tipo} onChange={e => handleFuenteChange('tipo', e.target.value)} className="w-full px-3 py-2 mt-1">
                  <option value="termo">Termotanque</option>
                  <option value="calefon">Calefón</option>
                  <option value="caldera">Caldera Dual</option>
                </select>
              </label>
               <label className="text-sm block">
                <span className="font-medium">Ubicación</span>
                <input type="text" placeholder="Ej: PB - Lavadero" value={edificio.fuenteCaliente.ubicacion} onChange={e => handleFuenteChange('ubicacion', e.target.value)} className="w-full px-3 py-2 mt-1" />
              </label>
           </div>
      </div>
    </div>
  );
}