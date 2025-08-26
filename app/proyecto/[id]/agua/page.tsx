"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { newId } from "@/lib/id";
import { addPartida, getProjectById } from "@/lib/storage";
import {
  getAguaCatalog,
  getKEquivalentes,
  getLimitesVelocidad,
  getUnidadesConsumo,
} from "@/lib/catalogs";
import type { UnidadesConsumo } from "@/lib/types";

import AyudantePresion from "@/components/agua/AyudantePresion";
import { AguaInput, AguaOutput, computeAgua } from "@/lib/ agua/compute";

type AccTipo = "codo90" | "codo45" | "tee_paso" | "tee_deriv";

interface RamalForm {
  id: string;
  nombre: string;
  distancia_m: number;
  aparatos: Record<string, number>;
  accesorios: Record<AccTipo, number>;
}

export default function AguaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [ready, setReady] = useState(false);
  const [unidades, setUnidades] = useState<UnidadesConsumo>({});
  const [ctx, setCtx] = useState<any>(null);

  const [sistema, setSistema] = useState<"red" | "tanque" | "cisterna_bomba_tanque">("tanque");
  const [tanque_m, setTanqueM] = useState<number | undefined>(6);
  const [puntoCritico_m, setPuntoCriticoM] = useState<number | undefined>(0);

  const [ramales, setRamales] = useState<RamalForm[]>([
    {
      id: newId("ramal"),
      nombre: "Baño PB",
      distancia_m: 12,
      aparatos: {},
      accesorios: { codo90: 2, codo45: 0, tee_paso: 0, tee_deriv: 0 },
    },
  ]);

  const accTipos: AccTipo[] = ["codo90", "codo45", "tee_paso", "tee_deriv"];

  useEffect(() => {
    (async () => {
      const [cat, klist, lim, uni] = await Promise.all([
        getAguaCatalog(),
        getKEquivalentes(),
        getLimitesVelocidad(),
        getUnidadesConsumo(),
      ]);
      setCtx({ catalog: cat, klist, limites: lim, unidades: uni });
      setUnidades(uni);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const prj = getProjectById(projectId);
    if (!prj) router.replace("/");
  }, [projectId, router]);

  function updateRamal(id: string, patch: Partial<RamalForm>) {
    setRamales(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRamal() {
    setRamales(rs => [
      ...rs,
      {
        id: newId("ramal"),
        nombre: `Ramal ${rs.length + 1}`,
        distancia_m: 8,
        aparatos: {},
        accesorios: { codo90: 2, codo45: 0, tee_paso: 0, tee_deriv: 1 },
      },
    ]);
  }

  function removeRamal(id: string) {
    setRamales(rs => rs.filter(r => r.id !== id));
  }

  const output = useMemo<AguaOutput | null>(() => {
    if (!ready || !ctx) return null;

    const entrada: AguaInput = {
      sistema,
      alturas: tanque_m != null && puntoCritico_m != null ? { tanque_m, punto_critico_m: puntoCritico_m } : undefined,
      ramales: ramales.map(r => ({
        id: r.id,
        nombre: r.nombre,
        distancia_m: r.distancia_m || 0,
        aparatos: Object.entries(r.aparatos)
          .filter(([, cant]) => (cant || 0) > 0)
          .map(([tipo, cantidad]) => ({ tipo, cantidad: Number(cantidad) })),
        accesorios: (Object.keys(r.accesorios) as AccTipo[])
          .map(t => ({ tipo: t, cantidad: Number(r.accesorios[t] || 0) }))
          .filter(a => a.cantidad > 0),
      })),
    };

    return computeAgua(entrada, {
      catalog: ctx.catalog,
      unidades: ctx.unidades,
      klist: ctx.klist,
      limites: ctx.limites,
    });
  }, [ready, ctx, ramales, sistema, tanque_m, puntoCritico_m]);

  function handleAddToProject() {
    if (!output) return;
    const summary = `Agua • ${ramales.length} ramal(es)`;
    const partida = {
      id: newId("partida"),
      kind: "agua" as const,
      summary,
      params: { sistema, alturas: { tanque_m, puntoCritico_m }, ramales },
      result: output,
      bom: output.bom,
      createdAt: new Date().toISOString(),
    };
    addPartida(projectId, partida);
    alert("Partida agregada al proyecto.");
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Instalación de Agua</h1>
        <p className="opacity-80 text-sm">
          Definí los ramales, aparatos y accesorios. El motor dimensiona el DN por velocidad y calcula pérdidas.
        </p>
      </header>

      {/* Configuración de esquema */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col">
            <span className="text-sm opacity-80">Esquema</span>
            <select
              className="px-3 py-2 rounded-xl"
              value={sistema}
              onChange={(e) => setSistema(e.target.value as any)}
            >
              <option value="red">Red directa</option>
              <option value="tanque">Tanque elevado</option>
              <option value="cisterna_bomba_tanque">Cisterna + bomba + tanque</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">Altura agua tanque (m)</span>
            <input
              type="number" step="0.1" className="px-3 py-2 rounded-xl"
              value={tanque_m ?? ""}
              onChange={(e) => setTanqueM(e.target.value === "" ? undefined : Number(e.target.value))}
              placeholder="6"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm opacity-80">Altura punto crítico (m)</span>
            <input
              type="number" step="0.1" className="px-3 py-2 rounded-xl"
              value={puntoCritico_m ?? ""}
              onChange={(e) => setPuntoCriticoM(e.target.value === "" ? undefined : Number(e.target.value))}
              placeholder="0"
            />
          </label>
        </div>

        {/* Ayudante de presión */}
        <AyudantePresion
          initialTanqueM={tanque_m}
          initialPuntoCriticoM={puntoCritico_m}
          perdidasTotalesM={output?.perdidas_totales_m ?? null}
        />
      </div>

      {/* Ramales */}
      <div className="space-y-4">
        {ramales.map((r) => (
          <div key={r.id} className="card p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <input
                className="px-3 py-2 rounded-xl w-full max-w-sm"
                value={r.nombre}
                onChange={(e) => updateRamal(r.id, { nombre: e.target.value })}
                placeholder="Nombre del ramal"
              />
              <div className="flex items-end gap-2">
                <label className="flex flex-col">
                  <span className="text-sm opacity-80">Distancia (m)</span>
                  <input
                    type="number" step="0.1" className="px-3 py-2 rounded-xl w-32"
                    value={r.distancia_m}
                    onChange={(e) => updateRamal(r.id, { distancia_m: Number(e.target.value || 0) })}
                  />
                </label>
                <button className="btn btn-danger" onClick={() => removeRamal(r.id)}>Quitar</button>
              </div>
            </div>

            {/* Aparatos */}
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 text-sm opacity-80">Aparatos</div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {Object.keys(unidades).map((tipo) => (
                  <label key={tipo} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--muted)" }}>
                    <span className="text-sm capitalize">{tipo.replace("_", " ")}</span>
                    <input
                      type="number" min={0} step="1" className="w-20 px-3 py-1 rounded-lg"
                      value={r.aparatos[tipo] ?? 0}
                      onChange={(e) =>
                        updateRamal(r.id, {
                          aparatos: { ...r.aparatos, [tipo]: Math.max(0, Number(e.target.value || 0)) },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Accesorios */}
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 text-sm opacity-80">Accesorios (cantidad)</div>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
                {accTipos.map((t) => (
                  <label key={t} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--muted)" }}>
                    <span className="text-sm">{t.replace("_", " ")}</span>
                    <input
                      type="number" min={0} step="1" className="w-20 px-3 py-1 rounded-lg"
                      value={r.accesorios[t] ?? 0}
                      onChange={(e) =>
                        updateRamal(r.id, {
                          accesorios: { ...r.accesorios, [t]: Math.max(0, Number(e.target.value || 0)) },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div>
          <button className="btn" onClick={addRamal}>Agregar ramal</button>
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
                  <th className="py-2 pr-4">Ramal</th>
                  <th className="py-2 pr-4">DN (mm)</th>
                  <th className="py-2 pr-4">Long. total (m)</th>
                  <th className="py-2 pr-4">Caudal (L/s)</th>
                  <th className="py-2 pr-4">Velocidad (m/s)</th>
                  <th className="py-2 pr-4">Pérdida (m)</th>
                </tr>
              </thead>
              <tbody>
                {output.segmentos.map(s => (
                  <tr key={s.id} className="border-t border-[--color-border]">
                    <td className="py-2 pr-4">{s.nombre || s.id}</td>
                    <td className="py-2 pr-4">{s.dn_mm}</td>
                    <td className="py-2 pr-4">{s.longitud_m}</td>
                    <td className="py-2 pr-4">{s.caudal_lps}</td>
                    <td className="py-2 pr-4">{s.velocidad_ms}</td>
                    <td className="py-2 pr-4">{s.perdida_m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-sm opacity-80">
            <div>Pérdidas totales: <strong>{output.perdidas_totales_m} m</strong></div>
            {output.margen_presion_m != null && (
              <div>Margen de presión estimado: <strong>{output.margen_presion_m} m</strong></div>
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

          {/* BOM */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Lista de materiales (BOM)</h4>
            <div className="card--table overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left opacity-80">
                    <th className="py-2 pr-4">Código</th>
                    <th className="py-2 pr-4">Descripción</th>
                    <th className="py-2 pr-4">Cant.</th>
                    <th className="py-2 pr-4">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {output.bom.map((i) => (
                    <tr key={i.code} className="border-t border-[--color-border]">
                      <td className="py-2 pr-4">{i.code}</td>
                      <td className="py-2 pr-4">{i.desc}</td>
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
