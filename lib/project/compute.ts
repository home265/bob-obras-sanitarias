// lib/project/compute.ts
import type { MaterialLine, Unit } from "./types";

type ProjectLike = { partes: Array<{ materials?: unknown[] }> };
type DBMaterialRow = { description: string; qty: number; unit?: string };

function isUIMaterial(x: unknown): x is MaterialLine {
  return (
    !!x &&
    typeof x === "object" &&
    "label" in x &&
    "qty" in x &&
    typeof (x as { label: unknown }).label === "string" &&
    typeof (x as { qty: unknown }).qty === "number"
  );
}

function isDBMaterial(x: unknown): x is DBMaterialRow {
  return (
    !!x &&
    typeof x === "object" &&
    "description" in x &&
    "qty" in x &&
    typeof (x as { description: unknown }).description === "string" &&
    typeof (x as { qty: unknown }).qty === "number"
  );
}

const allowedUnits: readonly Unit[] = ["u", "m", "m2", "m3", "kg", "l"];
function toUnit(u?: string): Unit {
  return allowedUnits.includes((u ?? "") as Unit) ? (u as Unit) : "u";
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function aggregateMaterials(p: ProjectLike): MaterialLine[] {
  const map = new Map<string, MaterialLine>();

  for (const part of p.partes) {
    const arr = part.materials ?? [];
    for (const m of arr) {
      let norm: MaterialLine | null = null;

      if (isUIMaterial(m)) {
        norm = {
          key: m.key || slug(m.label),
          label: m.label,
          qty: Number.isFinite(m.qty) ? m.qty : 0,
          unit: toUnit(m.unit),
        };
      } else if (isDBMaterial(m)) {
        const label = m.description;
        norm = {
          key: slug(label),
          label,
          qty: Number.isFinite(m.qty) ? m.qty : 0,
          unit: toUnit(m.unit),
        };
      }

      if (!norm) continue;

      const k = `${norm.key}|${norm.unit}`;
      const prev = map.get(k);
      if (prev) {
        prev.qty += norm.qty;
      } else {
        map.set(k, { ...norm });
      }
    }
  }

  return Array.from(map.values())
    .map(m => ({ ...m, qty: Math.round(m.qty * 100) / 100 }))
    .sort((a, b) => a.label.localeCompare(b.label));
}