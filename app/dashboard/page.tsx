"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 

export default function DashboardPostulante() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { data: session, status } = useSession();

  // Vigilante de usuarios borrados
  useEffect(() => {
    // @ts-ignore
    if (session?.error === "UserDeleted") {
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#00baff] animate-pulse">Cargando tu perfil...</div>;
  }

  const userName = session?.user?.name || "Postulante";
  const userEmail = session?.user?.email || "Sin correo";
  // ✅ OBTENEMOS LA FOTO DE LA SESIÓN
  // @ts-ignore
  const userAvatar = session?.user?.avatar; 
  
  const primerNombre = userName.split(" ")[0];
  const iniciales = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  // Componente reutilizable para el círculo del Avatar
  const AvatarCircle = ({ size }: { size: string }) => (
    <div className={`${size} rounded-full bg-gradient-to-tr from-[#0051ff] to-[#00baff] p-[2px] shrink-0 shadow-[0_0_15px_rgba(0,186,255,0.3)]`}>
      <div className="w-full h-full rounded-full bg-[#111111] overflow-hidden flex items-center justify-center">
        {userAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userAvatar} alt="Perfil" className="w-full h-full object-cover" />
        ) : (
          <span className={`${size === 'w-9 h-9' ? 'text-xs' : 'text-sm'} font-bold text-white`}>{iniciales}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* ==========================================
          CINTILLO SUPERIOR (TOP BAR)
          ========================================== */}
      <header className="fixed top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center justify-between px-5">
        
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#111111] rounded-full"></span>
        </button>

        <div className="flex flex-col items-center justify-center leading-none mt-1">
          <h1 className="text-xl font-black tracking-tight">
            Soph<span className="text-[#00baff]">IA</span>
          </h1>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">by SIAFI</span>
        </div>

        {/* ✅ BOTÓN SUPERIOR AHORA CON FOTO */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="hover:scale-105 transition-transform shrink-0"
        >
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {/* ==========================================
          MENÚ LATERAL (SIDEBAR OVERLAY)
          ========================================== */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          
          <div className="flex items-center gap-4 pr-4">
            {/* ✅ FOTO DENTRO DEL MENÚ */}
            <AvatarCircle size="w-12 h-12" />
            
            <div>
              <p className="font-bold text-white text-lg leading-tight truncate">{primerNombre}</p>
              <p className="text-xs text-gray-400 truncate mt-1">{userEmail}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-[#0051ff]/20 border border-[#0051ff]/30 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#00baff]">Postulante</p>
              </div>
            </div>
          </div>

          <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white mt-1 shrink-0">
            ✕
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <Link href="/dashboard/settings" className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">
            Configuración
          </Link>
          <button className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Soporte Técnico</button>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* ==========================================
          CONTENIDO PRINCIPAL
          ========================================== */}
      <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col gap-6">
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0051ff]"></div>
          <h2 className="text-xl font-bold mb-1">Hola, {primerNombre} 👋</h2>
          <p className="text-sm text-gray-400 mb-5">Bienvenid@ a tu panel de control SIAFI.</p>
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Estatus Actual</p>
              <p className="text-sm font-semibold text-[#00baff]">Postulación Recibida</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#00baff]/10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,186,255,0.2)]">
              📝
            </div>
          </div>
        </div>
      </main>

      {/* ==========================================
          CINTILLO INFERIOR (BOTTOM NAV)
          ========================================== */}
      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          
          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Estatus</span>
          </button>
          
          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors mr-6">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Perfil</span>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button className="w-14 h-14 bg-gradient-to-tr from-[#0051ff] to-[#00baff] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,186,255,0.4)] border-[6px] border-[#0a0a0a] hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>

          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors ml-6">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Ayuda</span>
          </button>

          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Fechas</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}