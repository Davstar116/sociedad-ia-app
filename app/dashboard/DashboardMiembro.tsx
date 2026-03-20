"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 
import OneSignal from 'react-onesignal';

export default function DashboardMiembro() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  const { data: session, status } = useSession();

  useEffect(() => {
    // @ts-ignore
    if (session?.error === "UserDeleted") signOut({ callbackUrl: '/login' });
  }, [session]);

  const fetchNotificaciones = async () => {
    if (session?.user?.email) {
      try {
        const res = await fetch(`/api/notifications?email=${session.user.email}`);
        const data = await res.json();
        if (data.notificaciones) setNotificaciones(data.notificaciones);
      } catch (error) {
        console.error("Error cargando notificaciones", error);
      }
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [session]);

  useEffect(() => {
    const initOneSignal = async () => {
      if (typeof window !== "undefined" && session?.user?.email) {
        try {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "",
            allowLocalhostAsSecureOrigin: true, 
          });

          OneSignal.Slidedown.promptPush();
          OneSignal.login(session.user.email);
        } catch (error) {
          console.error("Error inicializando OneSignal:", error);
        }
      }
    };

    initOneSignal();
  }, [session]);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  const marcarComoLeida = async (id: string, leidaActual: boolean) => {
    if (leidaActual) return; 
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, leida: true })
    });
  };

  const borrarNotificacion = async (id: string) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#00baff] animate-pulse">Cargando tu perfil...</div>;
  }

  const userName = session?.user?.name || "Miembro SIAFI";
  const userEmail = session?.user?.email || "Sin correo";
  // @ts-ignore
  const userAvatar = session?.user?.avatar; 
  
  const primerNombre = userName.split(" ")[0];
  const iniciales = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const AvatarCircle = ({ size }: { size: string }) => (
    <div className={`${size} rounded-full bg-gradient-to-tr from-gray-600 to-gray-400 p-[2px] shrink-0 shadow-[0_0_15px_rgba(156,163,175,0.2)]`}>
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
      
      {/* HEADER SUPERIOR */}
      <header className="fixed top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center justify-between px-5">
        <button onClick={() => setIsNotifMenuOpen(true)} className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#111111] rounded-full animate-pulse"></span>}
        </button>

        <div className="flex flex-col items-center justify-center leading-none mt-1">
          <h1 className="text-xl font-black tracking-tight text-gray-300">Soph<span className="text-gray-500">IA</span></h1>
          <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">by SIAFI</span>
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="hover:scale-105 transition-transform shrink-0">
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {/* OVERLAYS */}
      {(isMenuOpen || isNotifMenuOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => { setIsMenuOpen(false); setIsNotifMenuOpen(false); }} />
      )}
      
      {/* MENÚ PERFIL (DERECHO) */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div className="flex items-center gap-4 pr-4">
            <AvatarCircle size="w-12 h-12" />
            <div>
              <p className="font-bold text-white text-lg leading-tight truncate">{primerNombre}</p>
              <p className="text-xs text-gray-400 truncate mt-1">{userEmail}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-gray-800 border border-gray-700 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Miembro</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white mt-1 shrink-0">✕</button>
        </div>
        
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <Link href="/dashboard/settings" className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Configuración</Link>
          <Link href="/dashboard/support" className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Soporte Técnico</Link>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* MENÚ NOTIFICACIONES (IZQUIERDO) */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-[#111111] border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isNotifMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Notificaciones
          </h2>
          <button onClick={() => setIsNotifMenuOpen(false)} className="text-gray-400 hover:text-white shrink-0">✕</button>
        </div>
        
        <div className="flex-grow overflow-y-auto bg-[#111111]">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
              <svg className="w-12 h-12 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="text-sm font-medium text-gray-400">No tienes notificaciones nuevas.</p>
            </div>
          ) : (
            notificaciones.map(notif => (
              <div key={notif.id} onClick={() => marcarComoLeida(notif.id, notif.leida)} className={`p-5 border-b border-gray-800/50 cursor-pointer transition-all relative group flex gap-4 items-start ${!notif.leida ? 'bg-gray-800/30' : 'hover:bg-[#1f2937]/30'}`}>
                {!notif.leida && <div className="absolute left-0 top-0 w-1 h-full bg-gray-500"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.leida ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className={`text-sm ${!notif.leida ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{notif.asunto}</h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${!notif.leida ? 'text-gray-300' : 'text-gray-500'}`}>{notif.mensaje}</p>
                  <p className="text-[10px] text-gray-600 mt-2 uppercase font-bold tracking-wider">
                    {new Date(notif.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); borrarNotificacion(notif.id); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Eliminar notificación">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CONTENIDO CENTRAL */}
      <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="text-center w-full mt-4">
          <div className="w-24 h-24 bg-gray-800 text-gray-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner border border-gray-700">
            🔒
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Hola, {primerNombre}.</h2>
          <p className="text-gray-500 font-bold tracking-widest uppercase text-xs mb-8">Acceso Restringido</p>
        </div>

        <div className="bg-[#111111] border border-gray-800 rounded-3xl p-8 text-center shadow-2xl w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 to-gray-400"></div>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            Tu cuenta ha sido creada y verificada exitosamente, pero actualmente no tienes un panel ni herramientas asignadas.
          </p>
          <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
            <p className="text-gray-400 text-[12px] leading-relaxed">
              Para habilitar tus funciones, por favor comunícate con nosotros enviando un correo a:
              <br /><br />
              <a href="mailto:siafi.reclutamiento@gmail.com" className="text-[#00baff] font-bold hover:text-white transition-colors text-sm tracking-wide">
                siafi.reclutamiento@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* ✅ CINTILLO INFERIOR DESHABILITADO PARA MIEMBROS */}
      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe pointer-events-none">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          
          {/* Espacios vacíos a la izquierda para mantener la estructura */}
          <div className="w-12"></div>
          <div className="w-12 mr-6"></div>

          {/* Botón Central (Deshabilitado visualmente pero ancla el diseño) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-4 pointer-events-auto cursor-default">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-[6px] border-[#0a0a0a] bg-gray-800 text-gray-500 shadow-inner">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Espacios vacíos a la derecha para mantener la estructura */}
          <div className="w-12 ml-6"></div>
          <div className="w-12"></div>
          
        </div>
      </nav>

    </div>
  );
}