"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteProject, getProjectById, removePartida } from "@/lib/storage";
import type { Project } from "@/lib/types";
import {
  projectToJSONString,
  projectBOMToCSV_Agregado,
  projectBOMToCSV_Detallado,
  aggregateBOM,
} from "@/lib/export";
import { downloadTextFile } from "@/lib/download";

export default function ProyectoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const p = getProjectById(id);
    if (!p) {
      router.replace("/");
      return;
    }
    setProject(p);
  }, [id, router]);

  function refresh() {
    const p = getProjectById(id);
    setProject(p);
  }

  const bomAgregado = useMemo(() => (project ? aggregateBOM(project) : []), [project]);

  function onRemovePartida(pid: string) {
    const ok = window.confirm("¿Quitar esta partida del proyecto?");
    if (!ok) return;
    removePartida(id, pid);
    refresh();
  }

  function onDeleteProject() {
    const ok = window.confirm("¿Eliminar proyecto completo? Esta acción no se puede deshacer.");
    if (!ok) return;
    deleteProject(id);
    router.replace("/");
  }

  function exportJSON() {
    if (!project) return;
    const content = projectToJSONString(project);
    downloadTextFile(`proyecto_${safe(project.name)}.json`, content, "application/json;charset=utf-8");
  }

  function exportCSV_Agregado() {
    if (!project) return;
    const csv = projectBOMToCSV_Agregado(project);
    downloadTextFile(`proyecto_${safe(project.name)}_BOM_agregado.csv`, csv, "text/csv;charset=utf-8");
  }

  function exportCSV_Detallado() {
    if (!project) return;
    const csv = projectBOMToCSV_Detallado(project);
    downloadTextFile(`proyecto_${safe(project.name)}_BOM_detallado.csv`, csv, "text/csv;charset=utf-8");
  }

  if (!project) return null;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="opacity-80 text-sm">Creado: {new Date(project.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/proyecto/${id}/agua`} className="btn">Nueva partida de Agua</a>
          <a href={`/proyecto/nuevo/sanitaria`} className="btn btn-ghost">Nueva partida Sanitaria</a>
          <a href={`/proyecto/${id}/export`} className="btn">Vista imprimible</a>
          <button className="btn btn-danger" onClick={onDeleteProject}>Eliminar proyecto</button>
        </div>
      </header>

      {/* Partidas */}
      <div className="card p-4">
        <h2 className="mb-2 font-semibold">Partidas</h2>
        {project.partidas.length === 0 ? (
          <p className="opacity-80 text-sm">Aún no agregaste partidas.</p>
        ) : (
          <div className="card--table overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left opacity-80">
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Resumen</th>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {project.partidas.map(p => (
                  <tr key={p.id} className="border-t border-[--color-border]">
                    <td className="py-2 pr-4">{p.kind}</td>
                    <td className="py-2 pr-4">{p.summary}</td>
                    <td className="py-2 pr-4">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <button className="btn btn-danger" onClick={() => onRemovePartida(p.id)}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOM agregado */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">BOM agregado del proyecto</h2>
          <div className="flex gap-2">
            <button className="btn" onClick={exportCSV_Agregado}>Exportar CSV (agregado)</button>
            <button className="btn btn-ghost" onClick={exportCSV_Detallado}>Exportar CSV (detallado)</button>
            <button className="btn btn-ghost" onClick={exportJSON}>Exportar JSON</button>
          </div>
        </div>
        {bomAgregado.length === 0 ? (
          <p className="opacity-80 text-sm">No hay materiales aún.</p>
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
                {bomAgregado.map(i => (
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
      </div>
    </section>
  );
}

function safe(name: string) {
  return name.replace(/[^a-z0-9_-]+/gi, "_").toLowerCase();
}
