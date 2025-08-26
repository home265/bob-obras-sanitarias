"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createProject,
  getCurrentProject,
  getProjects,
  setCurrentProjectId,
  renameProject,
  deleteProject,
} from "@/lib/storage";
import type { Project } from "@/lib/types";

export default function ProjectGate() {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [current, setCurrent] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Evitar SSR
    setMounted(true);
    try {
      setProjects(getProjects());
      const c = getCurrentProject();
      setCurrent(c);
      if (!c) setOpen(true);
    } catch {
      // silencioso
    }
  }, []);

  const sorted = useMemo(
    () =>
      [...projects].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [projects]
  );

  function refresh() {
    setProjects(getProjects());
    setCurrent(getCurrentProject());
  }

  function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) {
      setError("Ingresá un nombre para el proyecto.");
      return;
    }
    const p = createProject(name);
    setNewName("");
    setCurrent(p);
    refresh();
    setOpen(false);
  }

  function handleSelect(id: string) {
    setCurrent(null);
    setCurrentProjectId(id);
    refresh();
    setOpen(false);
  }

  function beginRename(p: Project) {
    setRenamingId(p.id);
    setRenameName(p.name);
  }

  function confirmRename(e?: React.FormEvent) {
    e?.preventDefault();
    if (!renamingId) return;
    const name = renameName.trim();
    if (!name) return;
    const updated = renameProject(renamingId, name);
    setRenamingId(null);
    setRenameName("");
    if (updated) {
      if (current?.id === updated.id) setCurrent(updated);
      refresh();
    }
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameName("");
  }

  function removeProject(id: string) {
    const ok = window.confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.");
    if (!ok) return;
    deleteProject(id);
    // Si borraste el actual, se limpia solo en storage.ts
    refresh();
    if (!getCurrentProject()) setOpen(true);
  }

  if (!mounted) return null;

  return (
    <>
      {/* Barra compacta arriba cuando hay proyecto */}
      {current && (
        <div
          className="mb-4 rounded-xl border p-3"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="truncate">
              <span className="text-sm opacity-80">Proyecto activo:</span>{" "}
              <strong className="truncate">{current.name}</strong>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={() => beginRename(current)}>
                Renombrar
              </button>
              <button className="btn" onClick={() => setOpen(true)}>
                Cambiar proyecto
              </button>
            </div>
          </div>

          {/* Renombrar inline */}
          {renamingId === current.id && (
            <form onSubmit={confirmRename} className="mt-3 flex items-center gap-2">
              <input
                className="w-full px-3 py-2"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                placeholder="Nuevo nombre…"
                autoFocus
              />
              <button type="submit" className="btn btn-primary">Guardar</button>
              <button type="button" className="btn btn-ghost" onClick={cancelRename}>
                Cancelar
              </button>
            </form>
          )}
        </div>
      )}

      {/* Modal de selección/creación */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "color-mix(in srgb, black 40%, transparent)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl border p-4 md:p-6 card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Seleccioná o creá un proyecto</h2>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Lista de proyectos existentes */}
              <div className="card--table rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-sm opacity-80">Tus proyectos</div>
                <ul className="space-y-2">
                  {sorted.length === 0 && (
                    <li className="text-sm opacity-70">No tenés proyectos aún.</li>
                  )}
                  {sorted.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <button
                        className="truncate text-left hover:opacity-90"
                        style={{ color: "var(--color-base)" }}
                        onClick={() => handleSelect(p.id)}
                        title={p.name}
                      >
                        {p.name}
                      </button>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost" onClick={() => beginRename(p)}>
                          Renombrar
                        </button>
                        <button className="btn btn-danger" onClick={() => removeProject(p.id)}>
                          Eliminar
                        </button>
                      </div>

                      {/* Renombrar fila */}
                      {renamingId === p.id && (
                        <form onSubmit={confirmRename} className="col-span-2 mt-2 flex w-full items-center gap-2">
                          <input
                            className="w-full px-3 py-2"
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            placeholder="Nuevo nombre…"
                            autoFocus
                          />
                          <button type="submit" className="btn btn-primary">Guardar</button>
                          <button type="button" className="btn btn-ghost" onClick={cancelRename}>
                            Cancelar
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Crear nuevo */}
              <form onSubmit={handleCreate} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-sm opacity-80">Crear nuevo proyecto</div>
                <input
                  className="mb-3 w-full px-3 py-2"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Casa PB + PA / Cliente Pérez"
                />
                {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
                <button type="submit" className="btn btn-primary">Crear y usar</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
