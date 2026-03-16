"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 
import OneSignal from 'react-onesignal';

export default function DashboardPostulante() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  const { data: session, status, update } = useSession();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && !hasRefreshed.current) {
      update(); 
      hasRefreshed.current = true;
    }
  }, [status, update]);

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

  const userName = session?.user?.name || "Postulante";
  const userEmail = session?.user?.email || "Sin correo";
  // @ts-ignore
  const userAvatar = session?.user?.avatar; 
  // @ts-ignore
  const userEstatus = session?.user?.estatus || "Registrado"; 
  
  const primerNombre = userName.split(" ")[0];
  const iniciales = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

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

  const renderDashboardContent = () => {
    switch (userEstatus) {
      case "Aprobado para Entrevista":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 fade-in duration-500">
            <div className="text-center w-full">
              <div className="w-28 h-28 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-bounce">
                🌟
              </div>
              <h2 className="text-3xl font-black mb-2 text-white tracking-tight">¡Aprobado!</h2>
              <p className="text-yellow-500 font-bold tracking-widest uppercase text-xs mb-8">Siguiente Etapa: Entrevista</p>
            </div>
            
            <div className="bg-[#111111] border border-yellow-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden w-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
              <p className="text-gray-300 text-sm leading-relaxed mb-8">
                Felicidades <strong>{primerNombre}</strong>, tu perfil ha destacado entre los demás postulantes. Queremos conocerte mejor, platicar sobre tu visión y tu pasión por la tecnología.
              </p>
              <button className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-[#0a0a0a] font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95">
                Agendar Entrevista
              </button>
            </div>
          </main>
        );

      case "Aceptado":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
            <div className="text-center w-full">
              <div className="w-28 h-28 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                🚀
              </div>
              <h2 className="text-4xl font-black mb-2 text-white tracking-tight">¡Eres SIAFI!</h2>
              <p className="text-green-400 font-bold tracking-widest uppercase text-xs mb-8">Selección Final 2026</p>
            </div>
            
            <div className="bg-[#111111] border border-green-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden w-full">
              <div className="absolute inset-0 bg-green-500/5 backdrop-blur-3xl"></div>
              <div className="relative z-10">
                <p className="text-gray-300 text-sm leading-relaxed mb-8">
                  Nos emociona muchísimo informarte que has sido oficialmente <strong>Aceptado</strong> en la Sociedad de Inteligencia Artificial de la Facultad de Ingeniería. ¡Comienza una nueva etapa!
                </p>
                <button className="w-full py-4 bg-green-500 hover:bg-green-400 text-[#0a0a0a] font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95">
                  Ir al Workspace Oficial
                </button>
              </div>
            </div>
          </main>
        );

      case "No Seleccionado":
      case "Rechazado":
        const esFiltro = userEstatus === "No Seleccionado";
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center gap-6 animate-in fade-in duration-700 opacity-90">
            <div className="text-center w-full mt-4">
              <div className="w-24 h-24 bg-gray-800 text-gray-400 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
                ✉️
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Hola, {primerNombre}.</h2>
              <p className="text-gray-500 font-bold tracking-widest uppercase text-xs mb-8">Proceso Concluido</p>
            </div>
            
            <div className="bg-[#111111] border border-gray-800 rounded-3xl p-8 text-center shadow-2xl w-full">
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                {esFiltro 
                  ? "Agradecemos muchísimo el interés mostrado en tu registro. En esta ocasión, debido al alto volumen y perfil de las candidaturas, no has sido seleccionado para avanzar a la etapa de entrevistas." 
                  : "Agradecemos profundamente el tiempo y esfuerzo que dedicaste en la entrevista. En esta ocasión, hemos decidido avanzar con otros perfiles que se alinean más de cerca con las necesidades actuales de SIAFI."}
              </p>
              <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                <p className="text-gray-500 text-[11px] leading-relaxed italic">
                  No te desanimes. Te invitamos a seguir preparándote e intentarlo de nuevo en nuestra próxima convocatoria. ¡Te deseamos mucho éxito en tus proyectos!
                </p>
              </div>
            </div>
          </main>
        );

      // ==========================
      // ✅ NUEVO DISEÑO INMERSIVO PARA "REGISTRADO"
      // ==========================
      case "Registrado":
      default:
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center gap-6 animate-in fade-in duration-700">
            <div className="text-center w-full mt-4">
              <div className="w-28 h-28 bg-[#0051ff]/10 text-[#00baff] rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-[0_0_50px_rgba(0,186,255,0.2)] animate-pulse">
                ⏳
              </div>
              <h2 className="text-3xl font-black mb-2 text-white tracking-tight">En Revisión</h2>
              <p className="text-[#00baff] font-bold tracking-widest uppercase text-xs mb-8">Postulación Recibida</p>
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden w-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0051ff] to-[#00baff]"></div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Hola <strong>{primerNombre}</strong>, hemos recibido tu registro de forma exitosa. En este momento, el equipo de SIAFI se encuentra analizando tu perfil detalladamente.
              </p>
              <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
                <p className="text-gray-500 text-[11px] leading-relaxed italic">
                  Te enviaremos una notificación por este medio y directamente a tu celular en cuanto haya una actualización sobre tu proceso. ¡Mantente al pendiente!
                </p>
              </div>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* 🔴 MODO DESARROLLADOR: Muestra el estatus real arriba en pequeñito para comprobar si Notion está conectando */}
      <div className="fixed top-[64px] left-0 w-full bg-red-600 text-white text-[10px] text-center font-bold uppercase z-50">
        Estatus en Sistema: [{userEstatus}]
      </div>

      <header className="fixed top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center justify-between px-5">
        <button 
          onClick={() => setIsNotifMenuOpen(true)}
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#111111] rounded-full animate-pulse"></span>
          )}
        </button>

        <div className="flex flex-col items-center justify-center leading-none mt-1">
          <h1 className="text-xl font-black tracking-tight">
            Soph<span className="text-[#00baff]">IA</span>
          </h1>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">by SIAFI</span>
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="hover:scale-105 transition-transform shrink-0">
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {(isMenuOpen || isNotifMenuOpen) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => { setIsMenuOpen(false); setIsNotifMenuOpen(false); }}
        />
      )}
      
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div className="flex items-center gap-4 pr-4">
            <AvatarCircle size="w-12 h-12" />
            <div>
              <p className="font-bold text-white text-lg leading-tight truncate">{primerNombre}</p>
              <p className="text-xs text-gray-400 truncate mt-1">{userEmail}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-[#0051ff]/20 border border-[#0051ff]/30 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#00baff]">Postulante</p>
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

      <div className={`fixed top-0 left-0 h-full w-80 bg-[#111111] border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isNotifMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00baff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
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
              <div 
                key={notif.id} 
                onClick={() => marcarComoLeida(notif.id, notif.leida)}
                className={`p-5 border-b border-gray-800/50 cursor-pointer transition-all relative group flex gap-4 items-start ${!notif.leida ? 'bg-[#0051ff]/10' : 'hover:bg-[#1f2937]/30'}`}
              >
                {!notif.leida && <div className="absolute left-0 top-0 w-1 h-full bg-[#00baff]"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.leida ? 'bg-[#0051ff]/20 text-[#00baff]' : 'bg-gray-800 text-gray-400'}`}>
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
                <button 
                  onClick={(e) => { e.stopPropagation(); borrarNotificacion(notif.id); }} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Eliminar notificación"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {renderDashboardContent()}

      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          <button className="flex flex-col items-center justify-center w-12 text-[#00baff] transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Estatus</span>
          </button>
          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors mr-6">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Perfil</span>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <button className="w-16 h-16 bg-gradient-to-tr from-[#0051ff] to-[#00baff] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,186,255,0.4)] border-[6px] border-[#0a0a0a] hover:scale-105 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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