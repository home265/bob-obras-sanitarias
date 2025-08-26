"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProjectById } from "@/lib/storage";
import type { Project } from "@/lib/types";
import { aggregateBOM } from "@/lib/export";

export default function ProyectoExportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [showPartidas, setShowPartidas] = useState(true);

  useEffect(() => {
    const p = getProjectById(id);
    if (!p) {
      router.replace("/");
      return;
    }
    setProject(p);
  }, [id, router]);

  const bomAgregado = useMemo(() => (project ? aggregateBOM(project) : []), [project]);
  const totalItems = useMemo(
    () => bomAgregado.reduce((s, i) => s + (Number(i.qty) || 0), 0),
    [bomAgregado]
  );

  if (!project) return null;

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      {/* Controles (no se imprimen) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <a href={`/proyecto/${id}`} className="btn btn-ghost">Volver al proyecto</a>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => window.print()}>Imprimir / Exportar PDF</button>
          <label className="flex items-center gap-2 text-sm opacity-80">
            <input
              type="checkbox"
              checked={showPartidas}
              onChange={(e) => setShowPartidas(e.target.checked)}
            />
            Incluir detalle de partidas
          </label>
        </div>
      </div>

      {/* Encabezado */}
      <header className="rounded-2xl border p-5 card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="opacity-80">
              Proyecto — creado el {new Date(project.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-sm opacity-80">
            <div><strong>Fecha de impresión:</strong> {new Date().toLocaleString()}</div>
            <div><strong>Total ítems BOM:</strong> {totalItems}</div>
          </div>
        </div>
      </header>

      {/* BOM agregado */}
      <section className="rounded-2xl border p-5 card">
        <h2 className="mb-2 text-lg font-semibold">BOM agregado</h2>
        {bomAgregado.length === 0 ? (
          <p className="opacity-80 text-sm">No hay materiales en el proyecto.</p>
        ) : (
          <div className="card--table overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Descripción</th>
                  <th className="py-2 pr-4">DN</th>
                  <th className="py-2 pr-4">Cantidad</th>
                  <th className="py-2 pr-4">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {bomAgregado.map((i) => (
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
        )}
      </section>

      {/* Detalle por partidas (opcional) */}
      {showPartidas && (
        <section className="rounded-2xl border p-5 card break-inside-avoid">
          <h2 className="mb-2 text-lg font-semibold">Detalle de partidas</h2>
          {project.partidas.length === 0 ? (
            <p className="opacity-80 text-sm">No hay partidas.</p>
          ) : (
            <div className="space-y-5">
              {project.partidas.map((p) => (
                <article key={p.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm opacity-80">{p.kind.toUpperCase()}</div>
                      <h3 className="font-semibold">{p.summary}</h3>
                    </div>
                    <div className="text-sm opacity-70">
                      {new Date(p.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {Array.isArray(p.bom) && p.bom.length > 0 && (
                    <div className="mt-3 card--table overflow-x-auto">
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
                          {p.bom.map((i) => (
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
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Estilos de impresión locales a esta página */}
      <style jsx>{`
        @page {
          size: A4;
          margin: 14mm;
        }
        @media print {
          :root {
            color-scheme: light;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .card {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          a { color: inherit !important; text-decoration: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          section, article { break-inside: avoid; }
        }
      `}</style>
    </section>
  );
}
