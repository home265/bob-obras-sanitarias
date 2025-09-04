"use client";

import HelpPopover from "@/components/ui/HelpPopover";
import SimpleNumberInput from "@/components/inputs/SimpleNumberInput";
// Se importan los tipos necesarios, incluyendo el Payload para tipar el hook
import type { AmbienteCalefaccion, CalefaccionPayload } from "@/lib/calc/calefaccion_types";
import { rid } from "@/lib/id";
import { useJson } from "@/public/data/useJson";


interface Props {
  ambientes: AmbienteCalefaccion[];
  setAmbientes: React.Dispatch<React.SetStateAction<AmbienteCalefaccion[]>>;
  plantas: number;
}

export default function Step2_Ambientes({ ambientes, setAmbientes, plantas }: Props) {
  // CORRECCIÓN: Se aplica el tipo explícito al hook para que TypeScript conozca la estructura
  const coeficientes = useJson<CalefaccionPayload['catalogos']['coeficientes']>(
    "/data/calefaccion/coeficientes_transmitancia.json", 
    { muros: [], techos: [], vidrios: [], pisos: [] }
  );

  const handleAdd = () => {
    setAmbientes(prev => [...prev, {
      id: rid("amb-cal"),
      nombre: `Ambiente ${prev.length + 1}`,
      planta: 0,
      largo_m: 5,
      ancho_m: 4,
      alto_m: 2.8,
      tipoMuro: coeficientes.muros[0]?.key || "",
      m2_muro_exterior: 0,
      tipoTecho: coeficientes.techos[0]?.key || "",
      m2_techo_ultimo_piso: 0,
      tipoVidrio: "simple",
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
        <div key={ambiente.id} className="card p-4 bg-muted space-y-4">
          <div className="flex justify-between items-center">
            <input type="text" value={ambiente.nombre} onChange={e => handleChange(ambiente.id, 'nombre', e.target.value)} className="text-base font-medium bg-transparent border-0 p-0" />
            <button onClick={() => handleRemove(ambiente.id)} className="btn btn-danger text-xs px-2 py-1">Quitar</button>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Dimensiones y Ubicación</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="text-sm"><span className="font-medium">Largo (m)</span><SimpleNumberInput value={ambiente.largo_m} onChange={v => handleChange(ambiente.id, 'largo_m', v)} className="w-full px-3 py-2 mt-1" /></label>
              <label className="text-sm"><span className="font-medium">Ancho (m)</span><SimpleNumberInput value={ambiente.ancho_m} onChange={v => handleChange(ambiente.id, 'ancho_m', v)} className="w-full px-3 py-2 mt-1" /></label>
              <label className="text-sm"><span className="font-medium">Alto (m)</span><SimpleNumberInput value={ambiente.alto_m} onChange={v => handleChange(ambiente.id, 'alto_m', v)} className="w-full px-3 py-2 mt-1" /></label>
              <label className="text-sm">
                  <span className="font-medium">Ubicación</span>
                  <select value={ambiente.planta} onChange={e => handleChange(ambiente.id, 'planta', Number(e.target.value))} className="w-full px-3 py-2 mt-1">
                      {Array.from({ length: plantas }, (_, i) => (
                      <option key={i} value={i}>{i === 0 ? "Planta Baja" : `Piso ${i}`}</option>
                      ))}
                  </select>
              </label>
            </div>
          </div>
          
          <div className="pt-3 border-t border-border">
             <h4 className="text-sm font-medium mb-2">Envolvente del Ambiente (Pérdidas de Calor)</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="font-medium flex items-center">Tipo de Muro Exterior<HelpPopover>Selecciona el tipo de muro que da al exterior. Esto tiene un gran impacto en la pérdida de calor.</HelpPopover></span>
                  <select value={ambiente.tipoMuro} onChange={e => handleChange(ambiente.id, 'tipoMuro', e.target.value)} className="w-full px-3 py-2 mt-1">
                      {coeficientes.muros.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </label>
                 <label className="text-sm">
                  <span className="font-medium flex items-center">Sup. Muro Exterior (m²)<HelpPopover>Ingresa la superficie total (largo x alto) de los muros que dan al exterior o a locales no calefaccionados.</HelpPopover></span>
                  <SimpleNumberInput value={ambiente.m2_muro_exterior} onChange={v => handleChange(ambiente.id, 'm2_muro_exterior', v)} className="w-full px-3 py-2 mt-1" />
                </label>

                <label className="text-sm">
                  <span className="font-medium flex items-center">Tipo de Vidrio<HelpPopover>El Doble Vidriado Hermético (DVH) reduce las pérdidas a la mitad comparado con un vidrio simple.</HelpPopover></span>
                  <select value={ambiente.tipoVidrio} onChange={e => handleChange(ambiente.id, 'tipoVidrio', e.target.value)} className="w-full px-3 py-2 mt-1">
                    {coeficientes.vidrios.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-medium flex items-center">Sup. Vidrio (m²)<HelpPopover>Superficie total de ventanas y puertas de vidrio que dan al exterior.</HelpPopover></span>
                  <SimpleNumberInput value={ambiente.m2_vidrio} onChange={v => handleChange(ambiente.id, 'm2_vidrio', v)} className="w-full px-3 py-2 mt-1" />
                </label>
                
                 {ambiente.planta === plantas - 1 && (
                   <>
                    <label className="text-sm">
                      <span className="font-medium flex items-center">Tipo de Techo<HelpPopover>Siendo el piso más alto, el techo es una fuente importante de pérdida de calor. Elige su composición.</HelpPopover></span>
                      <select value={ambiente.tipoTecho} onChange={e => handleChange(ambiente.id, 'tipoTecho', e.target.value)} className="w-full px-3 py-2 mt-1">
                          {coeficientes.techos.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="font-medium flex items-center">Sup. Techo (m²)<HelpPopover>Superficie total del techo del ambiente (usualmente largo x ancho).</HelpPopover></span>
                      <SimpleNumberInput value={ambiente.m2_techo_ultimo_piso} onChange={v => handleChange(ambiente.id, 'm2_techo_ultimo_piso', v)} className="w-full px-3 py-2 mt-1" />
                    </label>
                   </>
                 )}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}