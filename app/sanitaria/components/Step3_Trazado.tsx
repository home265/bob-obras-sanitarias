"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput";
import type { Montante, Colectora } from "@/lib/calc/sanitaria_types";
import { rid } from "@/lib/id";

interface Props {
  montantes: Montante[];
  setMontantes: React.Dispatch<React.SetStateAction<Montante[]>>;
  colectoras: Colectora[];
  setColectoras: React.Dispatch<React.SetStateAction<Colectora[]>>;
  plantas: number;
}

const ACCESORIOS_COLECTORA = [
  { id: "camara_inspeccion", label: "Cámara Inspección" },
  { id: "codo90", label: "Codo 90°" },
  { id: "codo45", label: "Codo 45°" },
  { id: "ramal45", label: "Ramal 45°" },
];

export default function Step3_Trazado({ montantes, setMontantes, colectoras, setColectoras, plantas }: Props) {
  
  const handleAddMontante = () => {
    setMontantes(prev => [...prev, { id: rid('mont'), nombre: `Montante ${prev.length + 1}`, plantaDescarga: 1 }]);
  };

  const handleRemoveMontante = (id: string) => {
    setMontantes(prev => prev.filter(m => m.id !== id));
  };
  
  const handleMontanteChange = (id: string, field: keyof Montante, value: string | number) => {
    setMontantes(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleColectoraChange = (id: string, field: keyof Colectora, value: string | number) => {
      setColectoras(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleColectoraAccesorioChange = (id: string, accId: string, count: number) => {
      setColectoras(prev => prev.map(c => {
          if (c.id !== id) return c;
          const newAccesorios = { ...c.accesorios };
          if (count > 0) newAccesorios[accId] = count;
          else delete newAccesorios[accId];
          return { ...c, accesorios: newAccesorios };
      }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 3: Trazado de la Red Principal</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <h4 className="font-medium flex items-center">
                Montantes Verticales
                <HelpPopover>Define los caños de bajada principales (usualmente de 110mm) que recolectan los desagües de los pisos superiores.</HelpPopover>
            </h4>
            <button onClick={handleAddMontante} className="btn btn-secondary text-sm">+ Añadir Montante</button>
        </div>
        {plantas <= 1 && <p className="text-xs text-foreground/60">No se necesitan montantes para una sola planta.</p>}
        {plantas > 1 && montantes.map(montante => (
            <div key={montante.id} className="card p-3 bg-muted grid grid-cols-3 gap-3 items-end">
                <label className="text-sm col-span-2">
                    <span className="font-medium">Nombre</span>
                    <input type="text" value={montante.nombre} onChange={e => handleMontanteChange(montante.id, 'nombre', e.target.value)} className="w-full px-3 py-2 mt-1" />
                </label>
                <button onClick={() => handleRemoveMontante(montante.id)} className="btn btn-danger h-9">Quitar</button>
                <label className="text-sm col-span-3">
                    <span className="font-medium flex items-center">
                        Descarga desde:
                        <HelpPopover>Piso más alto que se conecta a este montante. La app calculará la longitud vertical.</HelpPopover>
                    </span>
                    <select value={montante.plantaDescarga} onChange={e => handleMontanteChange(montante.id, 'plantaDescarga', Number(e.target.value))} className="w-full px-3 py-2 mt-1">
                        {Array.from({ length: plantas - 1 }, (_, i) => (
                           <option key={i+1} value={i+1}>{`Piso ${i+1}`}</option>
                        ))}
                    </select>
                </label>
            </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-border">
        <h4 className="font-medium flex items-center">
            Colectora Principal (Planta Baja)
            <HelpPopover>Define el caño principal en Planta Baja que recoge todos los desagües y los lleva hacia la salida (cloaca o pozo).</HelpPopover>
        </h4>
        {colectoras.map(colectora => (
            <div key={colectora.id} className="card p-3 bg-muted space-y-3">
                 <label className="text-sm block">
                    <span className="font-medium flex items-center">Longitud Total (m)<HelpPopover>Longitud total de la tubería principal en PB, desde el último artefacto hasta la salida.</HelpPopover></span>
                    <SimpleNumberInput value={colectora.longitud_m} onChange={val => handleColectoraChange(colectora.id, 'longitud_m', val)} className="w-full px-3 py-2 mt-1" />
                </label>
                <div>
                    <span className="font-medium text-sm">Accesorios en Colectora</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
                        {ACCESORIOS_COLECTORA.map(acc => (
                            <div key={acc.id} className="flex items-center justify-between text-sm">
                                <label htmlFor={acc.id}>{acc.label}</label>
                                <SimpleNumberInput id={acc.id} value={colectora.accesorios[acc.id] || 0} onChange={val => handleColectoraAccesorioChange(colectora.id, acc.id, val)} className="w-16 px-2 py-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}