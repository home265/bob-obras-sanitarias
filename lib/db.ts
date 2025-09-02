// lib/db.ts
import Dexie, { type Table } from "dexie";

export interface MaterialRow {
  description: string;
  unit?: string;
  qty: number;
}

export interface Partida {
  id: string;
  kind: string; // Se mantiene como string genérico en la DB
  title: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  materials: MaterialRow[]; // <-- Usa el tipo de la DB
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  siteAddress?: string;
  notes?: string;
  partes: Partida[];
  createdAt: number;
  updatedAt: number;
}

export class AppDatabase extends Dexie {
  projects!: Table<Project, string>;

  constructor() {
    super("sanitarias-db");
    this.version(1).stores({
      projects: "id, name, updatedAt",
    });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __sanitariasDb: AppDatabase | undefined;
}

export function getDB(): AppDatabase {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB no está disponible en el servidor (SSR).");
  }
  if (!globalThis.__sanitariasDb) {
    globalThis.__sanitariasDb = new AppDatabase();
  }
  return globalThis.__sanitariasDb;
}