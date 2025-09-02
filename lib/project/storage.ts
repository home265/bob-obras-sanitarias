// lib/project/storage.ts
import { getDB, type Project, type Partida, type MaterialRow as DBMaterialRow } from "@/lib/db";
import type { MaterialLine as UIMaterial, SavePartidaPayload } from "./types";
import { rid } from "@/lib/id";

// --- Utils ---

function ensureClient() {
  if (typeof window === "undefined") {
    throw new Error("La API de Storage sólo puede usarse en el cliente.");
  }
}

function sortByUpdatedAtDesc(a: Project, b: Project): number {
  return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
}

function toDBMaterialRow(m: UIMaterial): DBMaterialRow {
  return { description: m.label, qty: m.qty, unit: m.unit };
}

function toDBMaterials(materials: UIMaterial[]): DBMaterialRow[] {
  return materials.map(toDBMaterialRow);
}

// --- Proyectos CRUD ---

export async function listProjects(): Promise<Project[]> {
  ensureClient();
  const db = getDB();
  const rows = await db.projects.toArray();
  return rows.sort(sortByUpdatedAtDesc);
}

export async function createProject(input: {
  name: string;
  client?: string;
  siteAddress?: string;
  notes?: string;
}): Promise<Project> {
  ensureClient();
  const now = Date.now();
  const project: Project = {
    id: rid("prj"),
    name: input.name.trim() || "Proyecto sin nombre",
    client: input.client?.trim(),
    siteAddress: input.siteAddress?.trim(),
    notes: input.notes,
    partes: [],
    createdAt: now,
    updatedAt: now,
  };
  const db = getDB();
  await db.projects.put(project);
  return project;
}

export async function getProject(id: string): Promise<Project | undefined> {
  ensureClient();
  const db = getDB();
  return db.projects.get(id);
}

export async function removeProject(id: string): Promise<void> {
  ensureClient();
  const db = getDB();
  await db.projects.delete(id);
}

// --- Partidas ---

export async function getPartida(
  projectId: string,
  partidaId: string
): Promise<Partida | undefined> {
  ensureClient();
  const p = await getProject(projectId);
  return p?.partes.find((pt) => pt.id === partidaId);
}

export async function removePartidaById(projectId: string, partidaId: string): Promise<boolean> {
  ensureClient();
  const db = getDB();
  const p = await db.projects.get(projectId);
  if (!p) return false;

  const originalLength = p.partes.length;
  p.partes = p.partes.filter((pt) => pt.id !== partidaId);
  if (p.partes.length === originalLength) return false;

  p.updatedAt = Date.now();
  await db.projects.put(p);
  return true;
}

export async function updatePartida(
  projectId: string,
  partidaId: string,
  data: SavePartidaPayload
): Promise<Partida | null> {
  ensureClient();
  const db = getDB();
  const p = await db.projects.get(projectId);
  if (!p) return null;

  const idx = p.partes.findIndex((pt) => pt.id === partidaId);
  if (idx === -1) return null;

  const now = Date.now();
  const updatedPartida: Partida = {
    ...p.partes[idx],
    title: data.title.trim() || p.partes[idx].title,
    inputs: data.inputs,
    outputs: data.outputs,
    materials: toDBMaterials(data.materials), // Conversión
    updatedAt: now,
  };

  p.partes[idx] = updatedPartida;
  p.updatedAt = now;
  await db.projects.put(p);
  return updatedPartida;
}

// Esta función es la que usan las calculadoras para guardar una nueva partida o actualizar una existente del mismo tipo.
export async function saveOrUpdatePartidaByKind(
  projectId: string,
  kind: string,
  data: SavePartidaPayload
): Promise<Partida | null> {
  ensureClient();
  const db = getDB();
  const p = await db.projects.get(projectId);
  if (!p) return null;

  const now = Date.now();
  const idx = p.partes.findIndex((pt) => pt.kind === kind);

  const base = {
    kind,
    title: data.title?.trim() || "Cálculo",
    inputs: data.inputs ?? {},
    outputs: data.outputs ?? {},
    materials: toDBMaterials(data.materials), // Conversión
  };

  let nextPartida: Partida;
  if (idx >= 0) {
    nextPartida = {
      ...p.partes[idx],
      ...base,
      updatedAt: now,
    };
    p.partes[idx] = nextPartida;
  } else {
    nextPartida = {
      id: rid("pt"),
      ...base,
      createdAt: now,
      updatedAt: now,
    };
    p.partes.push(nextPartida);
  }

  p.updatedAt = now;
  await db.projects.put(p);
  return nextPartida;
}