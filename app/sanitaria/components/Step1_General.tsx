"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput";
import type { EdificioSanitario, DisposicionFinal } from "@/lib/calc/sanitaria_types";

interface Props {
  edificio: EdificioSanitario;
  setEdificio: React.Dispatch<React.SetStateAction<EdificioSanitario>>;
  disposicion: DisposicionFinal;
  setDisposicion: React.Dispatch<React.SetStateAction<DisposicionFinal>>;
}

export default function Step1_General({ edificio, setEdificio, disposicion, setDisposicion }: Props) {
  const handleEdificioChange = (field: keyof EdificioSanitario, value: number) => {
    setEdificio(prev => ({ ...prev, [field]: Math.max(1, value) }));
  };
  
  const handleDisposicionChange = (field: keyof DisposicionFinal, value: string | number) => {
      setDisposicion(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 1: Datos Generales de la Obra</h3>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <label className="text-sm block">
            <span className="font-medium flex items-center">
              Número de Plantas
              <HelpPopover>Cantidad total de pisos del edificio (ej: PB + 1 Planta Alta = 2).</HelpPopover>
            </span>
            <SimpleNumberInput min={1} value={edificio.plantas} onChange={val => handleEdificioChange('plantas', val)} className="w-full px-3 py-2 mt-1" />
          </label>
          <label className="text-sm block">
            <span className="font-medium flex items-center">
              Altura por Planta (m)
              <HelpPopover>Altura promedio de piso a techo en metros.</HelpPopover>
            </span>
            <SimpleNumberInput min={2} step={0.1} value={edificio.alturaPlanta_m} onChange={val => handleEdificioChange('alturaPlanta_m', val)} className="w-full px-3 py-2 mt-1" />
          </label>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border">
        <h4 className="font-medium mb-2">Conexión Final del Sistema</h4>
        <div className="space-y-3">
            <label className="text-sm block">
                <span className="font-medium">Tipo de Conexión</span>
                <select value={disposicion.tipo} onChange={e => handleDisposicionChange('tipo', e.target.value)} className="w-full px-3 py-2 mt-1">
                  <option value="cloaca">Red Cloacal Pública</option>
                  <option value="estatico">Sistema Estático (Pozo / Biodigestor)</option>
                </select>
            </label>
            {disposicion.tipo === 'cloaca' ? (
                 <label className="text-sm block">
                    <span className="font-medium flex items-center">
                      Profundidad de Colectora (cm)
                      <HelpPopover>Profundidad en cm desde el nivel del terreno (cota 0) hasta la base de la colectora pública en la vereda.</HelpPopover>
                    </span>
                    <SimpleNumberInput value={disposicion.profundidadConexion_cm} onChange={val => handleDisposicionChange('profundidadConexion_cm', val)} className="w-full px-3 py-2 mt-1" />
                </label>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                     <label className="text-sm block">
                        <span className="font-medium flex items-center">
                          Distancia a Pozo (m)
                          <HelpPopover>Distancia horizontal desde la salida de la casa hasta el inicio del pozo o biodigestor.</HelpPopover>
                        </span>
                        <SimpleNumberInput value={disposicion.distanciaPozo_m} onChange={val => handleDisposicionChange('distanciaPozo_m', val)} className="w-full px-3 py-2 mt-1" />
                    </label>
                     <label className="text-sm block">
                        <span className="font-medium flex items-center">
                          Habitantes en Vivienda
                          <HelpPopover>Número de personas que viven en la propiedad. Se usa para dimensionar el pozo o biodigestor.</HelpPopover>
                        </span>
                        <SimpleNumberInput min={1} value={disposicion.habitantes} onChange={val => handleDisposicionChange('habitantes', val)} className="w-full px-3 py-2 mt-1" />
                    </label>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}