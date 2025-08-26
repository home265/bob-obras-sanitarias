// Utilidades de unidades y fórmulas hidráulicas (uso general)

export function mmToM(mm: number): number { return mm / 1000; }
export function mToMm(m: number): number { return m * 1000; }

export function lpsToM3s(q_lps: number): number { return q_lps / 1000; }
export function m3sToLps(q_m3s: number): number { return q_m3s * 1000; }

export function areaCircular_m2(d_mm: number): number {
  const D = mmToM(d_mm);
  return Math.PI * Math.pow(D / 2, 2);
}

export function velocidad_ms_porQyD(q_m3s: number, d_mm: number): number {
  if (q_m3s <= 0 || d_mm <= 0) return 0;
  const A = areaCircular_m2(d_mm);
  return q_m3s / A;
}

// Hazen–Williams (SI): hf = 10.67 * L * Q^1.852 / (C^1.852 * D^4.87)
// Q en m3/s, D en m, L en m, hf en mca
export function hazenWilliams_hf(L_m: number, Q_m3s: number, C: number, D_m: number): number {
  if (Q_m3s <= 0 || D_m <= 0 || C <= 0 || L_m <= 0) return 0;
  return 10.67 * L_m * Math.pow(Q_m3s, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_m, 4.87));
}
