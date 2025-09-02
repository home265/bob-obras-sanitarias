"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import type { Tramo, Trazado, Ambiente } from "@/lib/calc/agua_types";
import { rid } from "@/lib/id";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput"; // <-- IMPORTAMOS EL INPUT CORREGIDO

interface Props {
  trazado: Trazado;
  setTrazado: React.Dispatch<React.SetStateAction<Trazado>>;
  ambientes: Ambiente[];
}

const ACCESORIOS_DISPONIBLES = [
  { id: "codo90", label: "Codo 90°" },
  { id: "codo45", label: "Codo 45°" },
  { id: "codo_rosca", label: "Codo con Rosca" },
  { id: "tee_paso", label: "Te (Paso)" },
  { id: "tee_deriv", label: "Te (Derivación)" },
  { id: "tee_rosca", label: "Te con Rosca" },
  { id: "llave_paso", label: "Llave de Paso" },
];

export default function Step3_Trazado({ trazado, setTrazado, ambientes }: Props) {
  const handleAdd = (tipo: 'fria' | 'caliente') => {
    const newTramo: Tramo = {
      id: rid("tramo"),
      nombre: `Nuevo Tramo ${tipo.charAt(0).toUpperCase()}`,
      longitud_m: 0,
      accesorios: {},
      alimenta: 'ambiente',
      idDestino: ambientes[0]?.id || ""
    };
    setTrazado(prev => ({ ...prev, [tipo]: [...prev[tipo], newTramo] }));
  };

  const handleRemove = (tipo: 'fria' | 'caliente', id: string) => {
    setTrazado(prev => ({ ...prev, [tipo]: prev[tipo].filter(t => t.id !== id) }));
  };

  const handleChange = (tipo: 'fria' | 'caliente', id: string, field: keyof Omit<Tramo, 'id' | 'accesorios'>, value: string | number) => {
    setTrazado(prev => ({
      ...prev,
      [tipo]: prev[tipo].map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };
  
  const handleAccesorioChange = (tipo: 'fria' | 'caliente', tramoId: string, accId: string, count: number) => {
     setTrazado(prev => ({
      ...prev,
      [tipo]: prev[tipo].map(t => {
        if (t.id !== tramoId) return t;
        const newAccesorios = { ...t.accesorios };
        if (count > 0) newAccesorios[accId] = count;
        else delete newAccesorios[accId];
        return { ...t, accesorios: newAccesorios };
      })
    }));
  };

  const renderTramos = (tipo: 'fria' | 'caliente') => (
    <div className="space-y-3">
      {trazado[tipo].map(tramo => (
        <div key={tramo.id} className="card p-3 bg-muted">
           <div className="flex justify-between items-center mb-3">
            <input type="text" value={tramo.nombre} onChange={e => handleChange(tipo, tramo.id, 'nombre', e.target.value)} className="text-base font-medium bg-transparent border-0 p-0" />
            <button onClick={() => handleRemove(tipo, tramo.id)} className="btn btn-danger text-xs px-2 py-1">Quitar</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm block">
                <span className="font-medium flex items-center">Longitud (m)<HelpPopover>Longitud horizontal en metros de este tramo.</HelpPopover></span>
                {/* USAMOS EL NUEVO INPUT AQUÍ */}
                <SimpleNumberInput
                    min={0}
                    value={tramo.longitud_m}
                    onChange={value => handleChange(tipo, tramo.id, 'longitud_m', value)}
                    className="w-full px-3 py-2 mt-1"
                />
              </label>
              <label className="text-sm block">
                <span className="font-medium flex items-center">Alimenta a:<HelpPopover>Define qué ambiente o tramo es alimentado por este.</HelpPopover></span>
                <select value={tramo.idDestino} onChange={e => handleChange(tipo, tramo.id, 'idDestino', e.target.value)} className="w-full px-3 py-2 mt-1">
                  <optgroup label="Ambientes">
                    {ambientes.map(a => <option key={a.id} value={a.id}>{a.nombre} (Piso {a.planta})</option>)}
                  </optgroup>
                </select>
              </label>
          </div>
          <div className="mt-3">
              <span className="font-medium text-sm">Accesorios del Tramo</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-1">
                  {ACCESORIOS_DISPONIBLES.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between text-sm">
                        <label htmlFor={`${tramo.id}-${acc.id}`}>{acc.label}</label>
                        {/* Y USAMOS EL NUEVO INPUT AQUÍ TAMBIÉN */}
                        <SimpleNumberInput
                            id={`${tramo.id}-${acc.id}`}
                            min={0}
                            value={tramo.accesorios[acc.id] || 0}
                            onChange={count => handleAccesorioChange(tipo, tramo.id, acc.id, count)}
                            className="w-16 px-2 py-1"
                        />
                      </div>
                  ))}
              </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-base)]">Paso 3: Traza las Redes de Tuberías</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h4 className="font-medium">Red de Agua Fría</h4>
            <button onClick={() => handleAdd('fria')} className="btn btn-secondary text-sm">+ Añadir Tramo Frío</button>
        </div>
        {renderTramos('fria')}
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
            <h4 className="font-medium">Red de Agua Caliente</h4>
            <button onClick={() => handleAdd('caliente')} className="btn btn-secondary text-sm">+ Añadir Tramo Caliente</button>
        </div>
        {renderTramos('caliente')}
      </div>
    </div>
  );
}