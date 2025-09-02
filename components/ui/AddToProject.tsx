"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MaterialLine } from "@/lib/project/types";
import { listProjects, createProject, saveOrUpdatePartidaByKind } from "@/lib/project/storage";
import type { Project } from "@/lib/db";

interface Props {
  kind: string;
  defaultTitle: string;
  items: MaterialLine[];
  raw: {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
  };
}

export default function AddToProject({ kind, defaultTitle, items, raw }: Props) {
  const [projects, setProjects] = useState<Pick<Project, "id" | "name">[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const rows = await listProjects();
      setProjects(rows.map(r => ({ id: r.id, name: r.name })));
      if (rows.length) setProjectId(rows[0].id);
    })();
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(""), 3000);
  };
  
  async function handleCreateAndSave() {
    if (!newName.trim()) return;
    try {
      const p = await createProject({ name: newName.trim() });
      await saveOrUpdatePartidaByKind(p.id, kind, {
        title: defaultTitle,
        inputs: raw.inputs,
        outputs: raw.outputs,
        materials: items,
      });
      setNewName("");
      const rows = await listProjects();
      setProjects(rows.map(r => ({ id: r.id, name: r.name })));
      setProjectId(p.id);
      showFeedback(`¡Guardado en el nuevo proyecto "${p.name}"!`);
      router.push(`/proyecto/${p.id}`);
    } catch (error) {
      console.error(error);
      showFeedback("Error al crear y guardar.");
    }
  }

  async function handleSave() {
    if (!projectId) return;
     try {
      await saveOrUpdatePartidaByKind(projectId, kind, {
        title: defaultTitle,
        inputs: raw.inputs,
        outputs: raw.outputs,
        materials: items,
      });
      const projectName = projects.find(p => p.id === projectId)?.name || "";
      showFeedback(`¡Guardado en "${projectName}"!`);
    } catch (error) {
      console.error(error);
      showFeedback("Error al guardar.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Proyecto Existente</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded border px-3 py-2"
            disabled={projects.length === 0}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">O Crear Nuevo Proyecto</span>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del nuevo proyecto"
              className="flex-1 rounded border px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!projectId}>
          Guardar en Proyecto
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleCreateAndSave} disabled={!newName.trim()}>
          Crear y Guardar
        </button>
      </div>
      {feedback && <p className="text-sm text-[var(--color-base)]">{feedback}</p>}
    </div>
  );
}