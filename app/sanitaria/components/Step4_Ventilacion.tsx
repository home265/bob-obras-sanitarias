"use client";

import { useState } from "react";
import HelpPopover from "@/components/ui/HelpPopover";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput";
import { rid } from "@/lib/id";
import type { TramoVentilacion } from "@/lib/calc/sanitaria_types";

interface Props {
  ventilaciones: TramoVentilacion[];
  setVentilaciones: React.Dispatch<React.SetStateAction<TramoVentilacion[]>>;
  plantas: number;
}

const ACCESORIOS_VENTILACION = [
  { id: "codo90", label: "Codo 90°" },
  { id: "codo45", label: "Codo 45°" },
  { id: "ramal45", label: "Ramal 45°" },
];

export default function Step4_Ventilacion({ ventilaciones, setVentilaciones, plantas }: Props) {
  const handleAdd = () => {
    setVentilaciones(prev => [...prev, {
      id: rid("vent"),
      nombre: `Ventilación ${prev.length + 1}`,
      dn_mm: 110,
      longitud_m: plantas * 2.8, // Un valor inicial lógico
      accesorios: {},
      conecta_a_montante: "",
      terminacion: "sombrerete",
    }]);
  };

  const handleRemove = (id: string) => {
    setVentilaciones(prev => prev.filter(v => v.id !== id));
  };

  const handleChange = (id: string, field: keyof TramoVentilacion, value: string | number) => {
    setVentilaciones(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleAccesorioChange = (id: string, accId: string, count: number) => {
    setVentilaciones(prev => prev.map(v => {
      if (v.id !== id) return v;
      const newAccesorios = { ...v.accesorios };
      if (count > 0) newAccesorios[accId] = count;
      else delete newAccesorios[accId];
      return { ...v, accesorios: newAccesorios };
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 4: Sistema de Ventilación</h3>
        <button onClick={handleAdd} className="btn btn-secondary text-sm">+ Añadir Tubería</button>
      </div>

      {ventilaciones.length === 0 && (
         <div className="card p-4 text-center text-sm text-foreground/70">
            <p>Un sistema de desagüe profesional requiere ventilación para proteger los cierres hidráulicos (sifones). Añade las tuberías de ventilación necesarias.</p>
        </div>
      )}

      <div className="space-y-3">
        {ventilaciones.map(tramo => (
          <div key={tramo.id} className="card p-4 bg-muted">
            <div className="flex justify-between items-center mb-3">
              <input type="text" value={tramo.nombre} onChange={e => handleChange(tramo.id, 'nombre', e.target.value)} className="text-base font-medium bg-transparent border-0 p-0" />
              <button onClick={() => handleRemove(tramo.id)} className="btn btn-danger text-xs px-2 py-1">Quitar</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="font-medium flex items-center">
                  Diámetro (mm)
                  <HelpPopover>Diámetro del caño de ventilación. Usualmente 63mm o 110mm si ventila un montante principal.</HelpPopover>
                </span>
                <select value={tramo.dn_mm} onChange={e => handleChange(tramo.id, 'dn_mm', Number(e.target.value))} className="w-full px-3 py-2 mt-1">
                  <option value={63}>Ø 63mm</option>
                  <option value={110}>Ø 110mm</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="font-medium">Longitud (m)</span>
                <SimpleNumberInput value={tramo.longitud_m} onChange={v => handleChange(tramo.id, 'longitud_m', v)} className="w-full px-3 py-2 mt-1" />
              </label>
            </div>
            <div className="mt-3">
              <span className="font-medium text-sm">Accesorios de la Tubería</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
                {ACCESORIOS_VENTILACION.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between text-sm">
                    <label htmlFor={`${tramo.id}-${acc.id}`}>{acc.label}</label>
                    <SimpleNumberInput
                      id={`${tramo.id}-${acc.id}`}
                      value={tramo.accesorios[acc.id] || 0}
                      onChange={val => handleAccesorioChange(tramo.id, acc.id, val)}
                      className="w-16 px-2 py-1"
                    />
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