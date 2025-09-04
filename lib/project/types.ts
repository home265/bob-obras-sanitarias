// lib/project/types.ts

export type Unit = "u" | "m" | "m2" | "m3" | "kg" | "l" | "rollos";


export interface MaterialLine {
  key: string;
  label: string;
  qty: number;
  unit: Unit;
}

export type PartidaKind =
  | "agua"
  | "sanitaria"
  | "losa_radiante"
  | "cloacas";

export interface SavePartidaPayload {
  title: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  materials: MaterialLine[];
}

export interface BatchItem {
  kind: PartidaKind | string;
  title: string;
  materials: MaterialLine[];
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}