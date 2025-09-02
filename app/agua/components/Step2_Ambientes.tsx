"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import type { Ambiente } from "@/lib/calc/agua_types";
import { rid } from "@/lib/id";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput"; // <-- IMPORTAMOS EL NUEVO COMPONENTE

interface Props {
  ambientes: Ambiente[];
  setAmbientes: React.Dispatch<React.SetStateAction<Ambiente[]>>;
  plantas: number;
}

const ARTEFACTOS_DISPONIBLES = [
  { id: "ducha", label: "Ducha" },
  { id: "lavatorio", label: "Lavatorio" },
  { id: "bidet", label: "Bidet" },
  { id: "inodoro", label: "Inodoro (depósito)" },
  { id: "cocina", label: "Pileta de Cocina" },
  { id: "lavarropas", label: "Lavarropas" },
  { id: "lavavajillas", label: "Lavavajillas" },
  { id: "canilla_servicio", label: "Canilla de Servicio" },
];

export default function Step2_Ambientes({ ambientes, setAmbientes, plantas }: Props) {
  const handleAdd = () => {
    setAmbientes(prev => [...prev, {
      id: rid("amb"),
      nombre: `Ambiente ${prev.length + 1}`,
      planta: 0,
      artefactos: {},
    }]);
  };

  const handleRemove = (id: string) => {
    setAmbientes(prev => prev.filter(a => a.id !== id));
  };

  const handleChange = (id: string, field: keyof Ambiente, value: string | number) => {
    setAmbientes(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };
  
  const handleArtefactoChange = (ambId: string, artId: string, count: number) => {
    setAmbientes(prev => prev.map(a => {
      if (a.id !== ambId) return a;
      const newArtefactos = { ...a.artefactos };
      if (count > 0) {
        newArtefactos[artId] = count;
      } else {
        delete newArtefactos[artId];
      }
      // ESTA ES LA CORRECCIÓN DEL BUG 1
      return { ...a, artefactos: newArtefactos }; 
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 2: Define los Ambientes Húmedos</h3>
        <button onClick={handleAdd} className="btn btn-secondary text-sm">+ Añadir Ambiente</button>
      </div>
      
      <div className="space-y-3">
        {ambientes.map(ambiente => (
          <div key={ambiente.id} className="card p-4 bg-muted">
            <div className="flex justify-between items-center mb-3">
              <input type="text" value={ambiente.nombre} onChange={e => handleChange(ambiente.id, 'nombre', e.target.value)} className="text-base font-medium bg-transparent border-0 p-0" />
              <button onClick={() => handleRemove(ambiente.id)} className="btn btn-danger text-xs px-2 py-1">Quitar</button>
            </div>
            <div className="mb-3">
                <label className="text-sm block">
                    <span className="font-medium flex items-center">
                        Ubicación
                        <HelpPopover>Selecciona la planta donde se encuentra este ambiente.</HelpPopover>
                    </span>
                    <select value={ambiente.planta} onChange={e => handleChange(ambiente.id, 'planta', Number(e.target.value))} className="w-full px-3 py-2 mt-1">
                        {Array.from({ length: plantas }, (_, i) => (
                        <option key={i} value={i}>{i === 0 ? "Planta Baja" : `Piso ${i}`}</option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
              {ARTEFACTOS_DISPONIBLES.map(art => (
                <div key={art.id} className="flex items-center justify-between text-sm">
                  <label htmlFor={`${ambiente.id}-${art.id}`}>{art.label}</label>
                  {/* ESTA ES LA CORRECCIÓN DEL BUG 2 */}
                  <SimpleNumberInput
                    id={`${ambiente.id}-${art.id}`}
                    min={0}
                    value={ambiente.artefactos[art.id] || 0}
                    onChange={count => handleArtefactoChange(ambiente.id, art.id, count)}
                    className="w-16 px-2 py-1"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}