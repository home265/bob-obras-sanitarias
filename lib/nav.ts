// lib/nav.ts
export type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Agua F/C", href: "/agua" },
  { label: "Sanitaria", href: "/sanitaria" },
  // ESTA ES LA LÍNEA CORREGIDA
  { label: "Calefacción", href: "/calefaccion" },
  { label: "Proyecto", href: "/proyecto" },
];