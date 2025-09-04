"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput";
// Se importa el tipo específico 'ZonaClimatica' además de 'Sistema'
import type { Sistema, CalefaccionPayload } from "@/lib/calc/calefaccion_types";
import { useJson } from "@/public/data/useJson";


interface Props {
  sistema: Sistema;
  setSistema: React.Dispatch<React.SetStateAction<Sistema>>;
}

export default function Step1_Sistema({ sistema, setSistema }: Props) {
  // CORRECCIÓN: Se especifica el tipo explícitamente al hook useJson
  const zonasClimaticas = useJson<CalefaccionPayload['catalogos']['zonasClimaticas']>(
    "/data/calefaccion/zonas_climaticas_argentina.json", 
    []
  );

  const handleChange = (field: keyof Sistema, value: string | boolean | number) => {
    setSistema(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 1: Configuración del Sistema</h3>
      <div className="space-y-4">
        <label className="text-sm block">
            <span className="font-medium flex items-center">
              Zona Climática del Proyecto
              <HelpPopover>Selecciona la zona bioambiental de Argentina donde se ubica el proyecto. Esto ajustará la temperatura exterior de cálculo.</HelpPopover>
            </span>
            <select 
              value={sistema.zonaClimaticaId} 
              onChange={e => handleChange('zonaClimaticaId', e.target.value)} 
              className="w-full px-3 py-2 mt-1"
              disabled={zonasClimaticas.length === 0} // Se deshabilita si aún no cargó
            >
              {zonasClimaticas.map(zona => (
                <option key={zona.id} value={zona.id}>{zona.nombre}</option>
              ))}
            </select>
        </label>
        
        <label className="text-sm block">
          <span className="font-medium flex items-center">
            Tipo de Sistema de Calefacción
            <HelpPopover>Elige si el cálculo será para un sistema de losa radiante o para uno de radiadores.</HelpPopover>
          </span>
          <select value={sistema.tipo} onChange={e => handleChange('tipo', e.target.value)} className="w-full px-3 py-2 mt-1">
            <option value="losa_radiante">Losa Radiante</option>
            <option value="radiadores">Radiadores</option>
          </select>
        </label>
        
        <label className="text-sm block">
          <span className="font-medium flex items-center">
            Uso de la Caldera
            <HelpPopover>Indica si la caldera se usará solo para calefacción o si será 'Dual' (Calefacción + Agua Caliente Sanitaria).</HelpPopover>
          </span>
          <select value={String(sistema.calderaDual)} onChange={e => handleChange('calderaDual', e.target.value === 'true')} className="w-full px-3 py-2 mt-1">
            <option value="false">Solo Calefacción</option>
            <option value="true">Dual (Calefacción + Agua Caliente)</option>
          </select>
        </label>

        <label className="text-sm block">
          <span className="font-medium flex items-center">
            Número de Plantas
            <HelpPopover>Cantidad total de pisos a calefaccionar.</HelpPopover>
          </span>
          <SimpleNumberInput min={1} value={sistema.plantas} onChange={val => handleChange('plantas', val)} className="w-full px-3 py-2 mt-1" />
        </label>
      </div>
    </div>
  );
}