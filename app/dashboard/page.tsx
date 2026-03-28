"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardPostulante from "./DashboardPostulante";
import DashboardEntrevistador from "./DashboardEntrevistador";
import DashboardMiembro from "./DashboardMiembro";
import DashboardAdminMaestro from "./DashboardAdminMaestro";
import DashboardAdministrador from "./DashboardAdministrador"; 
import { useEffect, useState } from "react";

export default function DashboardSelector() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const refreshSession = async () => {
      if (status === "authenticated" && !hasChecked) {
        setIsRefreshing(true);
        await update(); 
        setHasChecked(true);
        setIsRefreshing(false);
      }
    };
    refreshSession();
  }, [status, update, hasChecked]);

  if (status === "loading" || isRefreshing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-[#00baff] gap-4">
        <div className="w-12 h-12 border-4 border-[#0051ff] border-t-[#00baff] rounded-full animate-spin"></div>
        <p className="animate-pulse font-bold tracking-widest text-xs uppercase">
          {isRefreshing ? "Sincronizando perfil..." : "Cargando tu espacio..."}
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  // @ts-ignore
  const rawRole = session?.user?.role || "Estándar";
  
  // ✅ LIMPIEZA DE ROL: Quitamos espacios extra y convertimos a minúsculas
  const userRole = rawRole.trim().toLowerCase();

  if (userRole === "admin maestro") {
    return <DashboardAdminMaestro />;
  }

  if (userRole === "administrador") {
    return <DashboardAdministrador />;
  }

  if (userRole === "entrevistador") {
    return <DashboardEntrevistador />;
  }
  
  if (userRole === "miembro" || userRole === "estándar") {
    return <DashboardMiembro />;
  }

  // Postulante por defecto
  return <DashboardPostulante />;
}