// Conversión de proyecto a JSON/CSV (BOM agregado y detallado)
import type { BOMItem, Project } from "./types";

export function projectToJSONString(project: Project): string {
  // JSON legible
  return JSON.stringify(project, null, 2);
}

/** Agrega BOM por code/desc/unidad/dn_mm (acumulado entre partidas) */
export function aggregateBOM(project: Project): BOMItem[] {
  const map = new Map<string, BOMItem>();
  for (const p of project.partidas) {
    for (const i of p.bom) {
      const key = [i.code, i.unidad ?? "", i.dn_mm ?? ""].join("|");
      const prev = map.get(key);
      if (prev) {
        map.set(key, { ...prev, qty: prev.qty + i.qty });
      } else {
        map.set(key, { ...i });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}

/** CSV de BOM agregado (ideal para compra) */
export function projectBOMToCSV_Agregado(project: Project): string {
  const agg = aggregateBOM(project);
  const header = ["code", "desc", "qty", "unidad", "dn_mm"];
  const rows = agg.map(i => [
    sanitize(i.code),
    sanitize(i.desc),
    String(i.qty),
    sanitize(i.unidad ?? ""),
    i.dn_mm != null ? String(i.dn_mm) : ""
  ]);
  return toCSV([header, ...rows]);
}

/** CSV de BOM detallado por partida (útil para trazabilidad) */
export function projectBOMToCSV_Detallado(project: Project): string {
  const header = ["partida_kind", "partida_summary", "code", "desc", "qty", "unidad", "dn_mm", "createdAt"];
  const rows: string[][] = [];
  for (const p of project.partidas) {
    for (const i of p.bom) {
      rows.push([
        sanitize(p.kind),
        sanitize(p.summary),
        sanitize(i.code),
        sanitize(i.desc),
        String(i.qty),
        sanitize(i.unidad ?? ""),
        i.dn_mm != null ? String(i.dn_mm) : "",
        sanitize(p.createdAt),
      ]);
    }
  }
  return toCSV([header, ...rows]);
}

/* ===== helpers ===== */
function sanitize(s: string) {
  return (s ?? "").replace(/\r?\n/g, " ").trim();
}
function toCSV(matrix: string[][]): string {
  // Escapa comillas y separa por coma
  const lines = matrix.map(row =>
    row
      .map(cell => {
        const c = cell.replace(/"/g, '""');
        return /[",\n]/.test(c) ? `"${c}"` : c;
      })
      .join(",")
  );
  return lines.join("\n");
}
