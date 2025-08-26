"use client";

import { useEffect, useState } from "react";

export default function AyudantePresion(props: {
  initialTanqueM?: number;
  initialPuntoCriticoM?: number;
  perdidasTotalesM?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [tanque, setTanque] = useState<number | "">("");
  const [pCritico, setPCritico] = useState<number | "">("");
  const [perdidas, setPerdidas] = useState<number | "">("");
  const [reserva, setReserva] = useState<number | "">(3); // margen libre deseado en m

  useEffect(() => {
    if (props.initialTanqueM != null) setTanque(props.initialTanqueM);
    if (props.initialPuntoCriticoM != null) setPCritico(props.initialPuntoCriticoM);
    if (props.perdidasTotalesM != null) setPerdidas(props.perdidasTotalesM);
  }, [props.initialTanqueM, props.initialPuntoCriticoM, props.perdidasTotalesM]);

  const Hdisp =
    tanque !== "" && pCritico !== "" ? Number(tanque) - Number(pCritico) : null;
  const margen =
    Hdisp != null && perdidas !== "" && reserva !== ""
      ? Number(Hdisp) - Number(perdidas) - Number(reserva)
      : null;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Ayudante de presión</h3>
        <button className="btn btn-ghost" onClick={() => setOpen(o => !o)}>
          {open ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <label className="flex flex-col">
            <span className="text-sm opacity-80">Altura agua tanque (m)</span>
            <input
              className="px-3 py-2 rounded-xl"
              type="number"
              step="0.1"
              value={tanque}
              onChange={(e) => setTanque(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">Altura punto crítico (m)</span>
            <input
              className="px-3 py-2 rounded-xl"
              type="number"
              step="0.1"
              value={pCritico}
              onChange={(e) => setPCritico(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">Pérdidas calculadas (m)</span>
            <input
              className="px-3 py-2 rounded-xl"
              type="number"
              step="0.1"
              value={perdidas}
              onChange={(e) => setPerdidas(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Ej: 8.4"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">Reserva libre deseada (m)</span>
            <input
              className="px-3 py-2 rounded-xl"
              type="number"
              step="0.1"
              value={reserva}
              onChange={(e) => setReserva(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>

          <div className="sm:col-span-2 md:col-span-4 rounded-lg p-3" style={{ background: "var(--muted)" }}>
            <div className="text-sm opacity-80">Resultado</div>
            <div className="mt-1">
              <div>H disponible (tanque − punto): <strong>{Hdisp != null ? Hdisp.toFixed(2) : "-"}</strong> m</div>
              <div>Margen estimado (Hdisp − pérdidas − reserva):{" "}
                <strong>
                  {margen != null ? margen.toFixed(2) : "-"} m
                </strong>
              </div>
              {margen != null && (
                <div className="mt-1 text-sm">
                  {margen >= 0 ? "✅ Apto (margen ≥ 0)" : "⚠️ No alcanza el margen (negativo)"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
