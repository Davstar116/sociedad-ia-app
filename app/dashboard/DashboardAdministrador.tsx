"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 
import OneSignal from 'react-onesignal';

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FECHAS_S1 = [6, 7, 8, 9, 10, 11, 12];
const FECHAS_S2 = [13, 14, 15, 16, 17, 18, 19];

export default function DashboardAdministrador() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("panel");

  const [semana, setSemana] = useState(1);
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);
  const [isSavingHorario, setIsSavingHorario] = useState(false);
  const [saveSuccessHorario, setSaveSuccessHorario] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isLockedHorario, setIsLockedHorario] = useState(false);
  const [showConfirmHorarioModal, setShowConfirmHorarioModal] = useState(false);
  const hasLoadedSchedule = useRef(false);
  
  const { data: session, status } = useSession();

  const HORAS = useMemo(() => {
    const h = [];
    for (let i = 9; i < 21; i++) {
      for (let m of ["00", "15", "30", "45"]) {
        h.push(`${i.toString().padStart(2, '0')}:${m}`);
      }
    }
    return h;
  }, []);

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

  const cargarHorario = async () => {
    if (!session?.user?.email || hasLoadedSchedule.current) return;
    setIsLoadingSchedule(true);
    try {
      const res = await fetch(`/api/availability?email=${session.user.email}`);
      if (res.ok) {
        const data = await res.json();
        if (data.horarios && data.horarios.length > 0) {
          setDisponibilidad(data.horarios);
          setIsLockedHorario(true); 
        }
      }
      hasLoadedSchedule.current = true;
    } catch (error) {
      console.error("Error cargando horario", error);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotificaciones();
      cargarHorario();
    }
  }, [status, session]);

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
          console.error("Error OneSignal:", error);
        }
      }
    };
    initOneSignal();
  }, [session]);

  const toggleSlot = (slotId: string) => {
    if (isLockedHorario) return;
    setDisponibilidad((prev) => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const confirmarYGuardarHorario = () => {
    setShowConfirmHorarioModal(true);
  };

  const guardarHorario = async () => {
    setShowConfirmHorarioModal(false);
    if (!session?.user?.email) return;
    setIsSavingHorario(true);
    setSaveSuccessHorario(false);

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: session.user.name,
          email: session.user.email,
          horarios: disponibilidad,
          horasTotales: disponibilidad.length * 0.25,
        }),
      });

      if (res.ok) {
        setSaveSuccessHorario(true);
        setIsLockedHorario(true); 
        setTimeout(() => setSaveSuccessHorario(false), 3000);
      }
    } catch (error) {
      console.error("Error guardando horario:", error);
    } finally {
      setIsSavingHorario(false);
    }
  };

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
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-violet-500 animate-pulse">Cargando tu perfil...</div>;
  }

  const userName = session?.user?.name || "Administrador";
  const userEmail = session?.user?.email || "Sin correo";
  // @ts-ignore
  const userAvatar = session?.user?.avatar; 
  
  const primerNombre = userName.split(" ")[0];
  const iniciales = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const AvatarCircle = ({ size }: { size: string }) => (
    <div className={`${size} rounded-full bg-gradient-to-tr from-violet-600 to-violet-400 p-[2px] shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.3)]`}>
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

  const renderActiveContent = () => {
    // Declaramos la variable fuera del switch para evitar cualquier problema de sintaxis con el linter de Vercel
    const fechasActivas = semana === 1 ? FECHAS_S1 : FECHAS_S2;

    switch (activeTab) {
      
      case "postulantes":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Base de Postulantes</h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm shadow-xl">
              <p>Revisa el estatus, CVs y respuestas de los candidatos del reclutamiento.</p>
            </div>
          </main>
        );

      case "entrevistas":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Agenda de Entrevistas</h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm shadow-xl">
              <p>Visualiza los bloques generados y las citas confirmadas de los postulantes.</p>
            </div>
          </main>
        );

      case "recursos":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Recursos Administrativos</h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm shadow-xl">
              <p>Manuales de operación, lineamientos y herramientas de gestión interna.</p>
            </div>
          </main>
        );

      case "mi-horario":
        return (
          <main className="pt-24 pb-28 px-3 max-w-2xl mx-auto min-h-screen animate-in fade-in duration-300 select-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Mi Disponibilidad</h2>
                {isLockedHorario && <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1"><span>🔒</span> Registrado</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-violet-400">
                  {disponibilidad.length * 0.25}
                  <span className="text-sm text-gray-500 font-medium"> hrs</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4 bg-[#111111] p-1.5 rounded-xl border border-gray-800">
              <button 
                onClick={() => setSemana(1)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 1 ? 'bg-gradient-to-r from-violet-600 to-violet-400 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Semana 1 (6-12 Abr)
              </button>
              <button 
                onClick={() => setSemana(2)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 2 ? 'bg-gradient-to-r from-violet-600 to-violet-400 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Semana 2 (13-19 Abr)
              </button>
            </div>

            <div className={`bg-[#111111] border rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden relative transition-all ${isLockedHorario ? 'border-green-500/30' : 'border-gray-800'}`}>
              
              {isLoadingSchedule ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs text-gray-400">Cargando horario...</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="grid grid-cols-[35px_repeat(7,_1fr)] gap-[2px] sm:gap-1 mb-2">
                    <div className="col-span-1"></div>
                    {DIAS_SEMANA.map((dia, idx) => (
                      <div key={dia} className="text-center flex flex-col items-center">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-bold">{dia.slice(0,3)}</span>
                        <span className="text-[11px] sm:text-xs text-white font-black">{fechasActivas[idx]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-[2px]">
                    {HORAS.map(hora => (
                      <div key={hora} className="grid grid-cols-[35px_repeat(7,_1fr)] gap-[2px] sm:gap-1 items-center">
                        <div className="col-span-1 text-right pr-1 sm:pr-2 text-[9px] font-medium text-gray-500">
                          {hora.endsWith("00") ? hora : ""}
                        </div>
                        
                        {DIAS_SEMANA.map((dia, idx) => {
                          const slotId = `S${semana}-${dia}-${fechasActivas[idx]}-${hora}`;
                          const isSelected = disponibilidad.includes(slotId);
                          return (
                            <div 
                              key={slotId}
                              onClick={() => toggleSlot(slotId)}
                              className={`h-4 sm:h-5 rounded-[2px] transition-all border-[0.5px] ${
                                isLockedHorario 
                                  ? (isSelected ? 'bg-green-500 border-green-400 opacity-90 cursor-default shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-[#151515] border-gray-800 opacity-30 cursor-default')
                                  : (isSelected ? 'bg-violet-500 border-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.4)] cursor-pointer' : 'bg-[#1a1a1a] border-gray-800 hover:bg-gray-800/80 cursor-pointer')
                              }`}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              {isLockedHorario ? (
                <button 
                  onClick={() => setIsLockedHorario(false)}
                  className="w-full max-w-xs py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Realizar Cambios
                </button>
              ) : (
                <button 
                  onClick={confirmarYGuardarHorario}
                  disabled={isSavingHorario || isLoadingSchedule}
                  className={`w-full max-w-xs py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 ${
                    saveSuccessHorario 
                      ? 'bg-green-500 text-[#0a0a0a] shadow-green-500/20'
                      : 'bg-gradient-to-r from-violet-600 to-violet-400 text-white shadow-violet-500/20 hover:from-violet-500 hover:to-violet-600'
                  }`}
                >
                  {isSavingHorario ? 'Guardando...' : saveSuccessHorario ? '¡Guardado Exitoso!' : 'Guardar Horario'}
                </button>
              )}
            </div>
          </main>
        );

      case "panel":
      default:
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
              <h2 className="text-xl font-bold mb-1">Hola, {primerNombre} 👋</h2>
              <p className="text-sm text-gray-400 mb-5">Bienvenido a tu panel de Administración.</p>
              
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Estatus</p>
                  <p className="text-sm font-semibold text-violet-400">Activo y en línea</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  🛡️
                </div>
              </div>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      <header className="fixed top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center justify-between px-5">
        <button onClick={() => setIsNotifMenuOpen(true)} className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#111111] rounded-full animate-pulse"></span>}
        </button>

        <div className="flex flex-col items-center justify-center leading-none mt-1 cursor-pointer" onClick={() => setActiveTab("panel")}>
          <h1 className="text-xl font-black tracking-tight">Soph<span className="text-violet-500">IA</span></h1>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Admin Ops</span>
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="hover:scale-105 transition-transform shrink-0">
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {(isMenuOpen || isNotifMenuOpen || showConfirmHorarioModal) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity" onClick={() => { setIsMenuOpen(false); setIsNotifMenuOpen(false); setShowConfirmHorarioModal(false); }} />
      )}

      {showConfirmHorarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-violet-500/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <span className="text-violet-500">⚠️</span> Confirmar Horario
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">
                ¿Estás seguro de que deseas guardar estos cambios en tu disponibilidad? Una vez guardado, tu horario quedará registrado en el sistema para la generación de bloques.
              </p>
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-4 text-center shadow-inner">
                <p className="text-violet-400 font-black text-2xl">{disponibilidad.length * 0.25} hrs</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Total de Disponibilidad</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              <button onClick={() => setShowConfirmHorarioModal(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cancelar</button>
              <button onClick={guardarHorario} className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-violet-400 hover:from-violet-500 hover:to-violet-600 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-violet-500/20 active:scale-95">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div className="flex items-center gap-4 pr-4">
            <AvatarCircle size="w-12 h-12" />
            <div>
              <p className="font-bold text-white text-lg leading-tight truncate">{primerNombre}</p>
              <p className="text-xs text-gray-400 truncate mt-1">{userEmail}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-violet-400">Administrador</p>
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
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Notificaciones
          </h2>
          <button onClick={() => setIsNotifMenuOpen(false)} className="text-gray-400 hover:text-white shrink-0">✕</button>
        </div>
        <div className="flex-grow overflow-y-auto bg-[#111111]">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
              <svg className="w-12 h-12 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="text-sm font-medium text-gray-400">Sin reportes del sistema.</p>
            </div>
          ) : (
            notificaciones.map(notif => (
              <div key={notif.id} onClick={() => marcarComoLeida(notif.id, notif.leida)} className={`p-5 border-b border-gray-800/50 cursor-pointer transition-all relative group flex gap-4 items-start ${!notif.leida ? 'bg-violet-500/10' : 'hover:bg-[#1f2937]/30'}`}>
                {!notif.leida && <div className="absolute left-0 top-0 w-1 h-full bg-violet-500"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.leida ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-800 text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex justify-between items-start mb-1 gap-2"><h3 className={`text-sm ${!notif.leida ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{notif.asunto}</h3></div>
                  <p className={`text-xs leading-relaxed ${!notif.leida ? 'text-gray-300' : 'text-gray-500'}`}>{notif.mensaje}</p>
                  <p className="text-[10px] text-gray-600 mt-2 uppercase font-bold tracking-wider">{new Date(notif.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); borrarNotificacion(notif.id); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Eliminar notificación">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ AQUÍ ESTÁ EL RENDERIZADOR */}
      {renderActiveContent()}

      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          
          <button onClick={() => setActiveTab("postulantes")} className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "postulantes" ? "text-violet-400" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Candidatos</span>
          </button>
          
          <button onClick={() => setActiveTab("entrevistas")} className={`flex flex-col items-center justify-center w-12 mr-6 transition-colors ${activeTab === "entrevistas" ? "text-violet-400" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Agenda</span>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <button onClick={() => setActiveTab("panel")} className={`w-16 h-16 rounded-full flex items-center justify-center border-[6px] border-[#0a0a0a] transition-all duration-300 ${activeTab === "panel" ? "bg-gradient-to-tr from-violet-600 to-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-105 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
          </div>

          <button onClick={() => setActiveTab("mi-horario")} className={`flex flex-col items-center justify-center w-12 ml-6 transition-colors ${activeTab === "mi-horario" ? "text-violet-400" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Horario</span>
          </button>

          <button onClick={() => setActiveTab("recursos")} className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "recursos" ? "text-violet-400" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Recursos</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}