"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardPostulante from "./DashboardPostulante";
import DashboardEntrevistador from "./DashboardEntrevistador";
import { useEffect } from "react";

export default function DashboardSelector() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Mientras NextAuth averigua quién es el usuario
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-[#00baff] gap-4">
        <div className="w-12 h-12 border-4 border-[#0051ff] border-t-[#00baff] rounded-full animate-spin"></div>
        <p className="animate-pulse font-bold tracking-widest text-xs uppercase">Cargando tu espacio...</p>
      </div>
    );
  }

  // ✅ EL CONTROLADOR DE TRÁFICO
  // @ts-ignore
  const userRole = session?.user?.role || "Postulante";

  // Si es Entrevistador (o Admin Maestro, que seguro también querrá ver esta vista por ahora)
  if (userRole === "Entrevistador" || userRole === "Admin Maestro") {
    return <DashboardEntrevistador />;
  }

  // Si no es ninguno de los anteriores, por defecto le mostramos el de Postulante
  return <DashboardPostulante />;
}