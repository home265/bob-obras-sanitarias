// app/page.tsx
import ProjectGate from "@/components/proyecto/ProjectGate";

export default function Page() {
  return (
    <>
      <ProjectGate />

      <section className="grid gap-6 md:grid-cols-2">
        <a href="/proyecto/nuevo/agua" className="card p-6 hover:opacity-95">
          <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--color-neutral)" }}>
            Instalación de Agua
          </h2>
          <p className="text-sm opacity-90">
            Dimensionado y materiales para agua fría/caliente (PP-R termofusión).
          </p>
          <div className="mt-3">
            <span className="btn">Abrir calculadora</span>
          </div>
        </a>

        <a href="/proyecto/nuevo/sanitaria" className="card p-6 hover:opacity-95">
          <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--color-neutral)" }}>
            Instalación Sanitaria
          </h2>
          <p className="text-sm opacity-90">
            Ramales, pendientes y BOM para cloacas (PVC pegamento o junta elástica).
          </p>
          <div className="mt-3">
            <span className="btn">Abrir calculadora</span>
          </div>
        </a>
      </section>
    </>
  );
}
