"use client";
import { useEffect, useState } from "react";

/**
 * Hook personalizado para cargar un archivo JSON desde la carpeta /public.
 * Devuelve un valor de fallback si la carga falla.
 * @param path Ruta al archivo JSON dentro de /public (ej: "/data/agua/catalogo_ppr.json")
 * @param fallback Valor a devolver en caso de error.
 */
export function useJson<T>(path: string, fallback: T): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    let isCancelled = false;
    
    fetch(path, { cache: "no-store" }) // 'no-store' para asegurar que vemos cambios durante el desarrollo
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error al cargar el archivo: ${response.statusText}`);
        }
        return response.json();
      })
      .then((jsonData) => {
        if (!isCancelled) {
          setData(jsonData as T);
        }
      })
      .catch((error) => {
        console.warn(`No se pudo cargar el JSON desde ${path}:`, error);
        if (!isCancelled) {
          setData(fallback);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [path, fallback]); // El hook se re-ejecuta si el path o el fallback cambian

  return data;
}