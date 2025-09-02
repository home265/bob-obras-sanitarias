"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput";
import type { AmbienteCalefaccion } from "@/lib/calc/calefaccion_types";
import { rid } from "@/lib/id";

interface Props {
  ambientes: AmbienteCalefaccion[];
  setAmbientes: React.Dispatch<React.SetStateAction<AmbienteCalefaccion[]>>;
  plantas: number;
}

export default function Step2_Ambientes({ ambientes, setAmbientes, plantas }: Props) {
  const handleAdd = () => {
    setAmbientes(prev => [...prev, {
      id: rid("amb-cal"),
      nombre: `Ambiente ${prev.length + 1}`,
      planta: 0,
      largo_m: 0,
      ancho_m: 0,
      alto_m: 2.8,
      vidrio: "simple",
      m2_vidrio: 0,
    }]);
  };
  const handleRemove = (id: string) => setAmbientes(prev => prev.filter(a => a.id !== id));
  const handleChange = (id: string, field: keyof AmbienteCalefaccion, value: string | number) => {
    setAmbientes(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 2: Balance Térmico de Ambientes</h3>
        <button onClick={handleAdd} className="btn btn-secondary text-sm">+ Añadir Ambiente</button>
      </div>
      {ambientes.map(ambiente => (
        <div key={ambiente.id} className="card p-4 bg-muted">
          <div className="flex justify-between items-center mb-3">
            <input type="text" value={ambiente.nombre} onChange={e => handleChange(ambiente.id, 'nombre', e.target.value)} className="text-base font-medium bg-transparent border-0 p-0" />
            <button onClick={() => handleRemove(ambiente.id)} className="btn btn-danger text-xs px-2 py-1">Quitar</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm"><span className="font-medium">Largo (m)</span><SimpleNumberInput value={ambiente.largo_m} onChange={v => handleChange(ambiente.id, 'largo_m', v)} className="w-full px-3 py-2 mt-1" /></label>
            <label className="text-sm"><span className="font-medium">Ancho (m)</span><SimpleNumberInput value={ambiente.ancho_m} onChange={v => handleChange(ambiente.id, 'ancho_m', v)} className="w-full px-3 py-2 mt-1" /></label>
            <label className="text-sm"><span className="font-medium">Alto (m)</span><SimpleNumberInput value={ambiente.alto_m} onChange={v => handleChange(ambiente.id, 'alto_m', v)} className="w-full px-3 py-2 mt-1" /></label>
          </div>
          <div className="mt-3">
             <label className="text-sm">
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
        </div>
      ))}
    </div>
  );
}