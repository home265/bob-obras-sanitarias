export default function OfflinePage() {
  return (
    <section className="mx-auto max-w-lg space-y-4 rounded-2xl border p-6 card">
      <h1 className="text-xl font-semibold">Sin conexión</h1>
      <p className="opacity-80">
        Estás sin internet. Podés seguir viendo partes ya cargadas, pero algunas funciones no estarán disponibles.
      </p>
      <div className="flex gap-2">
        <a href="/" className="btn">Ir al inicio</a>
      </div>
    </section>
  );
}
