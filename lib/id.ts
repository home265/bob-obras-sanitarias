// Generador de IDs únicos legibles y estables

export function newId(prefix = "id"): string {
  // Prioriza UUID nativo si existe
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${(crypto as any).randomUUID()}`;
  }
  // Fallback compatible (timestamp + random base36)
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}${rnd}`;
}
