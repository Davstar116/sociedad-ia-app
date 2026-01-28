"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NeuralBackground from "../components/NeuralBackground";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  // Lista de correos que son ADMIN (Por ahora hardcodeado, luego lo pasamos a BD)
  // ¡¡PON TU CORREO DE GMAIL AQUÍ PARA VER EL PANEL DE ADMIN!!
  const ADMIN_EMAILS = ["david.solorzano.a@gmail.com", "david@ejemplo.com"];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.email) {
      if (ADMIN_EMAILS.includes(session.user.email)) {
        setIsAdmin(true);
      }
    }
  }, [status, session, router]);

  if (status === "loading") return <div className="min-h-screen bg-black flex items-center justify-center text-sociedad-cyan">Cargando perfil...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 relative overflow-hidden">
      <NeuralBackground />

      {/* HEADER: Perfil del Usuario */}
      <div className="relative z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h1 className="text-lg font-light text-gray-300">Hola,</h1>
          <p className="text-xl font-bold text-white">{session?.user?.name?.split(" ")[0]}</p>
        </div>
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20">
          {session?.user?.image ? (
            <Image src={session.user.image} alt="Perfil" fill />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">?</div>
          )}
        </div>
      </div>

      {/* CENTRO: AVATAR DE SOPHIA */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-8 mb-12 animate-in fade-in zoom-in duration-700">
        <div className="relative w-48 h-48 md:w-64 md:h-64">
          {/* Círculos de energía */}
          <div className="absolute inset-0 bg-sociedad-cyan/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute inset-4 border border-sociedad-cyan/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute inset-8 border border-sociedad-blue/30 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
          
          {/* Logo Central (Representación de SophIA) */}
          <div className="absolute inset-0 flex items-center justify-center">
             <Image 
                src="/logo.png" 
                alt="SophIA" 
                width={150} 
                height={150} 
                className="object-contain drop-shadow-[0_0_15px_rgba(0,186,255,0.8)]"
             />
          </div>
        </div>
        
        {/* Mensaje de Estado */}
        <div className="mt-6 text-center px-6">
          <p className="text-sociedad-cyan font-bold tracking-widest uppercase text-sm mb-2">
            ● SISTEMA EN LÍNEA
          </p>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            {isAdmin 
              ? "Bienvenido, Administrador. Los módulos de control están activos." 
              : "Tu perfil está activo. SophIA está esperando tus instrucciones."}
          </p>
        </div>
      </div>

      {/* GRID DE OPCIONES (Cuerpo de la App) */}
      <div className="relative z-10 px-4 grid grid-cols-2 gap-4 max-w-md mx-auto">
        
        {/* Botón 1: Para TODOS (Postulación) */}
        <Link href="/postulacion" className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 hover:border-sociedad-cyan/50 transition-all group">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500 text-blue-400 group-hover:text-white transition-colors">
            📝
          </div>
          <h3 className="font-bold text-white">Mi Postulación</h3>
          <p className="text-xs text-gray-500 mt-1">Ver estado o editar</p>
        </Link>

        {/* Botón 2: SOLO ADMINS (Panel de Control) */}
        {isAdmin && (
          <Link href="/admin" className="bg-white/5 border border-red-500/20 p-4 rounded-2xl hover:bg-red-900/10 hover:border-red-500/50 transition-all group">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-500 text-red-500 group-hover:text-white transition-colors">
              🛡️
            </div>
            <h3 className="font-bold text-white">Panel Admin</h3>
            <p className="text-xs text-gray-500 mt-1">Reclutamiento</p>
          </Link>
        )}

        {/* Botón 3: Cerrar Sesión */}
        <button onClick={() => signOut()} className="col-span-2 bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-red-400">
          <span>🚪</span> Cerrar Sesión
        </button>

      </div>

      {/* --- BARRA DE NAVEGACIÓN INFERIOR (TABS) --- */}
      <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-xl border-t border-white/10 h-20 pb-4 z-50">
        <div className="flex justify-around items-center h-full max-w-md mx-auto">
          
          {/* Tab 1: Home */}
          <button className="flex flex-col items-center justify-center w-full h-full text-sociedad-cyan">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="text-[10px] font-bold tracking-wider">INICIO</span>
          </button>

          {/* Tab 2: Perfil */}
          <button className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-white transition-colors">
             <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span className="text-[10px] font-bold tracking-wider">PERFIL</span>
          </button>

        </div>
      </div>

    </div>
  );
}