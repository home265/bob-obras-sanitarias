"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentProject } from "@/lib/storage";

export default function NuevoSanitariaRedirect() {
  const router = useRouter();

  useEffect(() => {
    const p = getCurrentProject();
    if (p) router.replace(`/proyecto/${p.id}/sanitaria`);
    else router.replace("/"); // abre el ProjectGate
  }, [router]);

  return null;
}
