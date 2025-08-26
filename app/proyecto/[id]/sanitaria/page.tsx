"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { newId } from "@/lib/id";
import { addPartida, getProjectById } from "@/lib/storage";
import {
  getPendientesPorDN,
  getLongitudesAcceso,
  getSanitariaCatalog,
} from "@/lib/catalogs";
import type { PendientePorDN } from "@/lib/types";
import { computeSanitaria, type SanitariaInput, type SanitariaTramoIn } from "@/lib/sanitaria/compute";
import AyudantePendiente from "@/components/sanitaria/AyudantePendiente";

type SistemaSanitaria = "pegamento" | "junta";

interface TramoForm {
  id: string;
  nombre: string;
  dn_mm: number;
  longitud_m: number;
  pendiente_cm_m: number;
  accesorios: { codo90: number; codo45: number; tee: number };
}

export default function SanitariaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [ready, setReady] = useState(false);
  const [sistema, setSistema] = useState<SistemaSanitaria>("pegamento");
  const [pendientes, setPendientes] = useState<PendientePorDN[]>([]);
  const [ctx, setCtx] = useState<any>(null);

  const [tramos, setTramos] = useState<TramoForm[]>([
    {
      id: newId("tramo"),
      nombre: "Colector PP",
      dn_mm: 110,
      longitud_m: 12,
      pendiente_cm_m: 2.5,
      accesorios: { codo90: 2, codo45: 0, tee: 1 },
    },
  ]);

  useEffect(() => {
    (async () => {
      const [pend, acc, cat] = await Promise.all([
        getPendientesPorDN(),
        getLongitudesAcceso(),
        getSanitariaCatalog(sistema),
      ]);
      setPendientes(pend);
      setCtx({ pendientes: pend, longitudesAcceso: acc, catalog: cat });
      setReady(true);
    })();
  }, [sistema]);

  useEffect(() => {
    const prj = getProjectById(projectId);
    if (!prj) router.replace("/");
  }, [projectId, router]);

  function updateTramo(id: string, patch: Partial<TramoForm>) {
    setTramos(ts => ts.map(t => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTramo() {
    setTramos(ts => [
      ...ts,
      {
        id: newId("tramo"),
        nombre: `Tramo ${ts.length + 1}`,
        dn_mm: 110,
        longitud_m: 8,
        pendiente_cm_m: 2.5,
        accesorios: { codo90: 1, codo45: 0, tee: 0 },
      },
    ]);
  }

  function removeTramo(id: string) {
    setTramos(ts => ts.filter(t => t.id !== id));
  }

  const output = useMemo(() => {
    if (!ready || !ctx) return null;

    const entrada: SanitariaInput = {
      sistema,
      tramos: tramos.map<SanitariaTramoIn>(t => ({
        id: t.id,
        nombre: t.nombre,
        dn_mm: Number(t.dn_mm || 0),
        longitud_m: Number(t.longitud_m || 0),
        pendiente_cm_m: Number(t.pendiente_cm_m || 0),
        accesorios: {
          codo90: Number(t.accesorios.codo90 || 0),
          codo45: Number(t.accesorios.codo45 || 0),
          tee: Number(t.accesorios.tee || 0),
        },
      })),
    };

    return computeSanitaria(entrada, {
      catalog: ctx.catalog,
      pendientes: ctx.pendientes,
      longitudesAcceso: ctx.longitudesAcceso,
    });
  }, [ready, ctx, tramos, sistema]);

  function handleAddToProject() {
    if (!output) return;
    const summary = `Sanitaria • ${tramos.length} tramo(s) • sistema: ${sistema}`;
    const partida = {
      id: newId("partida"),
      kind: "sanitaria" as const,
      summary,
      params: { sistema, tramos },
      result: output,
      bom: output.bom,
      createdAt: new Date().toISOString(),
    };
    addPartida(projectId, partida);
    alert("Partida sanitaria agregada al proyecto.");
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Instalación Sanitaria</h1>
        <p className="opacity-80 text-sm">
          Definí DN, longitudes, pendientes y accesorios por tramo. El motor valida pendientes, sugiere accesos y genera BOM.
        </p>
      </header>

      {/* Sistema */}
      <div className="card p-4">
        <label className="flex flex-col max-w-xs">
          <span className="text-sm opacity-80">Sistema</span>
          <select
            className="px-3 py-2 rounded-xl"
            value={sistema}
            onChange={(e) => setSistema(e.target.value as SistemaSanitaria)}
          >
            <option value="pegamento">PVC - pegamento</option>
            <option value="junta">PVC - junta elástica</option>
          </select>
        </label>

        {/* Ayudante de pendiente */}
        <div className="mt-4">
          <AyudantePendiente tabla={pendientes} initialDn={tramos[0]?.dn_mm ?? 110} />
        </div>
      </div>

      {/* Tramos */}
      <div className="space-y-4">
        {tramos.map((t) => (
          <div key={t.id} className="card p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <input
                className="px-3 py-2 rounded-xl w-full max-w-sm"
                value={t.nombre}
                onChange={(e) => updateTramo(t.id, { nombre: e.target.value })}
                placeholder="Nombre del tramo"
              />
              <div className="flex items-end gap-2">
                <button className="btn btn-danger" onClick={() => removeTramo(t.id)}>Quitar</button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <label className="flex flex-col">
                <span className="text-sm opacity-80">DN (mm)</span>
                <input
                  type="number" min={40} step={5} className="px-3 py-2 rounded-xl"
                  value={t.dn_mm}
                  onChange={(e) => updateTramo(t.id, { dn_mm: Number(e.target.value || 0) })}
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm opacity-80">Longitud (m)</span>
                <input
                  type="number" min={0} step="0.1" className="px-3 py-2 rounded-xl"
                  value={t.longitud_m}
                  onChange={(e) => updateTramo(t.id, { longitud_m: Number(e.target.value || 0) })}
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm opacity-80">Pendiente (cm/m)</span>
                <input
                  type="number" min={0} step="0.1" className="px-3 py-2 rounded-xl"
                  value={t.pendiente_cm_m}
                  onChange={(e) => updateTramo(t.id, { pendiente_cm_m: Number(e.target.value || 0) })}
                />
              </label>

              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-sm opacity-80">Accesorios</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["codo90", "codo45", "tee"] as const).map((key) => (
                    <label key={key} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--muted)" }}>
                      <span className="text-sm">{key}</span>
                      <input
                        type="number" min={0} step={1} className="w-20 px-3 py-1 rounded-lg"
                        value={t.accesorios[key]}
                        onChange={(e) =>
                          updateTramo(t.id, {
                            accesorios: { ...t.accesorios, [key]: Math.max(0, Number(e.target.value || 0)) },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <PendienteHint dn={t.dn_mm} tabla={pendientes} />
          </div>
        ))}

        <div>
          <button className="btn" onClick={addTramo}>Agregar tramo</button>
        </div>
      </div>

      {/* Resultado */}
      {output && (
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold">Resultado</h3>

          <div className="card--table overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-2 pr-4">Tramo</th>
                  <th className="py-2 pr-4">DN</th>
                  <th className="py-2 pr-4">Long. (m)</th>
                  <th className="py-2 pr-4">Pend. (cm/m)</th>
                  <th className="py-2 pr-4">OK</th>
                  <th className="py-2 pr-4">Observación</th>
                </tr>
              </thead>
              <tbody>
                {output.tramos.map(s => (
                  <tr key={s.id} className="border-t border-[--color-border]">
                    <td className="py-2 pr-4">{s.nombre || s.id}</td>
                    <td className="py-2 pr-4">{s.dn_mm}</td>
                    <td className="py-2 pr-4">{s.longitud_m}</td>
                    <td className="py-2 pr-4">{s.pendiente_cm_m}</td>
                    <td className="py-2 pr-4">{s.ok ? "Sí" : "No"}</td>
                    <td className="py-2 pr-4">{s.motivo ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-1 font-semibold">Accesos sugeridos</div>
            {output.accesos_sugeridos.every(a => a.posiciones_m.length === 0) ? (
              <p className="text-sm opacity-80">No se requieren accesos intermedios según la longitud configurada.</p>
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {output.accesos_sugeridos.map(a => (
                  <li key={a.tramoId}>
                    {tramos.find(t => t.id === a.tramoId)?.nombre || a.tramoId}: {a.posiciones_m.join(" m, ") || "-"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {output.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-amber-300">
              {output.warnings.map((w, i) => (<li key={i}>{w}</li>))}
            </ul>
          )}

          <div className="flex gap-2 pt-2">
            <button className="btn btn-primary" onClick={handleAddToProject}>Agregar al proyecto</button>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Lista de materiales (BOM)</h4>
            <div className="card--table overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left opacity-80">
                    <th className="py-2 pr-4">Código</th>
                    <th className="py-2 pr-4">Descripción</th>
                    <th className="py-2 pr-4">DN</th>
                    <th className="py-2 pr-4">Cant.</th>
                    <th className="py-2 pr-4">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {output.bom.map((i) => (
                    <tr key={i.code + (i.dn_mm ?? "")} className="border-t border-[--color-border]">
                      <td className="py-2 pr-4">{i.code}</td>
                      <td className="py-2 pr-4">{i.desc}</td>
                      <td className="py-2 pr-4">{i.dn_mm ?? "-"}</td>
                      <td className="py-2 pr-4">{i.qty}</td>
                      <td className="py-2 pr-4">{i.unidad ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </section>
  );
}

function PendienteHint({ dn, tabla }: { dn: number; tabla: PendientePorDN[] }) {
  const row = tabla.find(r => r.dn_mm === dn);
  if (!row) return null;
  return (
    <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border)" }}>
      <div className="opacity-80">Pendientes para DN {dn} mm:</div>
      <div>mín: <strong>{row.min}</strong> cm/m — recomendada: <strong>{row.recom}</strong> cm/m — máx: <strong>{row.max}</strong> cm/m</div>
    </div>
  );
}
