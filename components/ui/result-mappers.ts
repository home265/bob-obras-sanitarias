// components/ui/result-mappers.ts

export function keyToUnit(key: string): string {
  if (/_kg$/.test(key)) return "kg";
  if (/_m3$/.test(key)) return "m³";
  if (/_m2$/.test(key)) return "m²";
  if (/_l$/.test(key) || /_lt$/.test(key)) return "L";
  if (/_uds?$/.test(key) || /_u$/.test(key) || key.endsWith('cajas')) return "u";
  if (key.includes('tubo')) return 'barras';
  return "";
}

export function keyToLabel(key: string): string {
  const pretty = key
    .replace(/_/g, " ")
    .replace(/pvc /g, "PVC ")
    .replace(/mm/g, "mm");

  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}