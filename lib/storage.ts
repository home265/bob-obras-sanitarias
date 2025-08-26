"use client";

/**
 * Persistencia en LocalStorage (lado cliente)
 * - Namespacing para no chocar con otras apps
 * - Funciones puras, seguras ante SSR (chequea window)
 */

import type { Partida, Project } from "./types";
import { newId } from "./id";

const NS = "instalaciones";
const KEY_PROJECTS = `${NS}:projects`;
const KEY_CURRENT = `${NS}:currentProjectId`;

function ls(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJSON<T>(key: string, fallback: T): T {
  const store = ls();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  const store = ls();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // silencioso
  }
}

/* ===== Projects ===== */

export function getProjects(): Project[] {
  return readJSON<Project[]>(KEY_PROJECTS, []);
}

export function setProjects(projects: Project[]): void {
  writeJSON(KEY_PROJECTS, projects);
}

export function getCurrentProjectId(): string | null {
  const store = ls();
  if (!store) return null;
  return store.getItem(KEY_CURRENT);
}

export function setCurrentProjectId(id: string | null): void {
  const store = ls();
  if (!store) return;
  if (id) store.setItem(KEY_CURRENT, id);
  else store.removeItem(KEY_CURRENT);
}

export function getCurrentProject(): Project | null {
  const id = getCurrentProjectId();
  if (!id) return null;
  return getProjectById(id);
}

export function getProjectById(id: string): Project | null {
  const list = getProjects();
  return list.find(p => p.id === id) ?? null;
}

export function createProject(name: string): Project {
  const project: Project = {
    id: newId("prj"),
    name,
    createdAt: new Date().toISOString(),
    partidas: [],
    meta: { version: 1 }
  };
  const list = getProjects();
  list.push(project);
  setProjects(list);
  setCurrentProjectId(project.id);
  return project;
}

export function upsertProject(project: Project): void {
  const list = getProjects();
  const idx = list.findIndex(p => p.id === project.id);
  if (idx >= 0) list[idx] = project;
  else list.push(project);
  setProjects(list);
}

export function renameProject(projectId: string, name: string): Project | null {
  const list = getProjects();
  const idx = list.findIndex(p => p.id === projectId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], name };
  setProjects(list);
  return list[idx];
}

export function deleteProject(projectId: string): void {
  const list = getProjects().filter(p => p.id !== projectId);
  setProjects(list);
  const current = getCurrentProjectId();
  if (current === projectId) setCurrentProjectId(null);
}

/* ===== Partidas ===== */

export function addPartida(projectId: string, partida: Partida): Project | null {
  const list = getProjects();
  const idx = list.findIndex(p => p.id === projectId);
  if (idx < 0) return null;
  const project = list[idx];
  const updated: Project = { ...project, partidas: [...project.partidas, partida] };
  list[idx] = updated;
  setProjects(list);
  return updated;
}

export function removePartida(projectId: string, partidaId: string): Project | null {
  const list = getProjects();
  const idx = list.findIndex(p => p.id === projectId);
  if (idx < 0) return null;
  const project = list[idx];
  const updated: Project = { ...project, partidas: project.partidas.filter(x => x.id !== partidaId) };
  list[idx] = updated;
  setProjects(list);
  return updated;
}

export function updatePartida(projectId: string, partida: Partida): Project | null {
  const list = getProjects();
  const idx = list.findIndex(p => p.id === projectId);
  if (idx < 0) return null;
  const project = list[idx];
  const pidx = project.partidas.findIndex(x => x.id === partida.id);
  if (pidx < 0) return null;
  const updatedProject: Project = {
    ...project,
    partidas: [
      ...project.partidas.slice(0, pidx),
      partida,
      ...project.partidas.slice(pidx + 1)
    ]
  };
  list[idx] = updatedProject;
  setProjects(list);
  return updatedProject;
}
