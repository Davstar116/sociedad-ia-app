"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 
import OneSignal from 'react-onesignal';

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FECHAS_S1 = [6, 7, 8, 9, 10, 11, 12];
const FECHAS_S2 = [13, 14, 15, 16, 17, 18, 19];

export default function DashboardEntrevistador() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("panel");
  
  // ESTADOS DEL HORARIO Y BLOQUEO
  const [semana, setSemana] = useState(1);
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  // ESTADO BLOQUEO GLOBAL
  const [isGlobalLockActive, setIsGlobalLockActive] = useState(false);
  
  // ESTADO PARA EL MODAL DE CONFIRMACIÓN
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ESTADOS PARA CURSOS
  const [cursos, setCursos] = useState<any[]>([]);
  const [isLoadingCursos, setIsLoadingCursos] = useState(false);

  // ✅ ESTADOS PARA MIS ENTREVISTAS ASIGNADAS
  const [misEntrevistas, setMisEntrevistas] = useState<any[]>([]);
  const [isLoadingEntrevistas, setIsLoadingEntrevistas] = useState(false);
  
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
          setIsLocked(true); 
        }
      }
      hasLoadedSchedule.current = true;
    } catch (error) {
      console.error("Error cargando horario", error);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const checkGlobalLock = async () => {
    try {
      const res = await fetch("/api/admin/toggle-lock");
      const data = await res.json();
      setIsGlobalLockActive(data.isLocked);
    } catch (error) {
      console.error("Error revisando bloqueo global:", error);
    }
  };

  // ✅ FUNCIÓN PARA CARGAR LAS ENTREVISTAS ASIGNADAS
  const fetchMisEntrevistas = async () => {
    if (!session?.user?.name) return;
    setIsLoadingEntrevistas(true);
    try {
      const res = await fetch(`/api/entrevistas/mis-asignaciones?entrevistador=${encodeURIComponent(session.user.name)}`);
      const data = await res.json();
      if (data.success) {
        setMisEntrevistas(data.entrevistas);
      }
    } catch (error) {
      console.error("Error al cargar mis entrevistas:", error);
    } finally {
      setIsLoadingEntrevistas(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotificaciones();
      cargarHorario();
      checkGlobalLock();
    }
  }, [status, session]);

  // ✅ DISPARAMOS LA BÚSQUEDA DE ENTREVISTAS AL ENTRAR AL PANEL
  useEffect(() => {
    if (activeTab === "panel" && status === "authenticated") {
      fetchMisEntrevistas();
    }
  }, [activeTab, status]);

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

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const fetchCursos = async () => {
    setIsLoadingCursos(true);
    try {
      const res = await fetch("/api/cursos");
      if (res.ok) {
        const data = await res.json();
        setCursos(data.cursos || []);
      }
    } catch (error) {
      console.error("Error al cargar cursos:", error);
    } finally {
      setIsLoadingCursos(false);
    }
  };

  useEffect(() => {
    if (activeTab === "cursos") {
      fetchCursos();
    }
  }, [activeTab]);

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

  const toggleSlot = (slotId: string) => {
    if (isLocked || isGlobalLockActive) return; 
    setDisponibilidad((prev) => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const confirmarYGuardar = () => {
    setShowConfirmModal(true);
  };

  const guardarHorario = async () => {
    setShowConfirmModal(false); 
    if (!session?.user?.email) return;
    setIsSaving(true);
    setSaveSuccess(false);

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
        setSaveSuccess(true);
        setIsLocked(true); 
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error guardando horario:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#00baff] animate-pulse">Cargando tu perfil...</div>;
  }

  const userName = session?.user?.name || "Entrevistador";
  const userEmail = session?.user?.email || "Sin correo";
  // @ts-ignore
  const userAvatar = session?.user?.avatar; 
  
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

  const renderActiveContent = () => {
    switch (activeTab) {
      case "mi-horario":
        const fechasActivas = semana === 1 ? FECHAS_S1 : FECHAS_S2;
        
        return (
          <main className="pt-24 pb-28 px-3 max-w-2xl mx-auto min-h-screen animate-in fade-in duration-300 select-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Mi Disponibilidad</h2>
                {(isLocked || isGlobalLockActive) && (
                  <p className={`text-[10px] ${isGlobalLockActive ? 'text-orange-500' : 'text-green-400'} font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1`}>
                    <span>🔒</span> {isGlobalLockActive ? 'Bloqueado por Sistema' : 'Registrado'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#00baff]">
                  {disponibilidad.length * 0.25}
                  <span className="text-sm text-gray-500 font-medium"> hrs</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4 bg-[#111111] p-1.5 rounded-xl border border-gray-800">
              <button 
                onClick={() => setSemana(1)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 1 ? 'bg-gradient-to-r from-[#0051ff] to-[#00baff] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Semana 1 (6-12 Abr)
              </button>
              <button 
                onClick={() => setSemana(2)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 2 ? 'bg-gradient-to-r from-[#0051ff] to-[#00baff] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Semana 2 (13-19 Abr)
              </button>
            </div>

            <div className={`bg-[#111111] border rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden relative transition-all ${(isLocked || isGlobalLockActive) ? 'border-green-500/30' : 'border-gray-800'} ${isGlobalLockActive ? 'border-orange-500/30' : ''}`}>
              
              {isLoadingSchedule ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <div className="w-8 h-8 border-2 border-[#00baff] border-t-transparent rounded-full animate-spin mb-3"></div>
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
                                (isLocked || isGlobalLockActive) 
                                  ? (isSelected ? 'bg-green-500 border-green-400 opacity-90 cursor-default shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-[#151515] border-gray-800 opacity-30 cursor-default')
                                  : (isSelected ? 'bg-[#00baff] border-[#00baff] shadow-[0_0_8px_rgba(0,186,255,0.4)] cursor-pointer' : 'bg-[#1a1a1a] border-gray-800 hover:bg-gray-800/80 cursor-pointer')
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
              {isGlobalLockActive ? (
                <div className="w-full text-center py-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <p className="text-orange-500 font-bold text-xs uppercase tracking-widest">🔒 Sistema Bloqueado</p>
                </div>
              ) : isLocked ? (
                <button 
                  onClick={() => setIsLocked(false)}
                  className="w-full max-w-xs py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Realizar Cambios
                </button>
              ) : (
                <button 
                  onClick={confirmarYGuardar}
                  disabled={isSaving || isLoadingSchedule}
                  className={`w-full max-w-xs py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 ${
                    saveSuccess 
                      ? 'bg-green-500 text-[#0a0a0a] shadow-green-500/20'
                      : 'bg-gradient-to-r from-[#0051ff] to-[#00baff] text-white shadow-[#0051ff]/20 hover:from-[#00baff] hover:to-[#0051ff]'
                  }`}
                >
                  {isSaving ? 'Guardando...' : saveSuccess ? '¡Guardado Exitoso!' : 'Guardar Horario'}
                </button>
              )}
            </div>
          </main>
        );

      case "material":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Material de Apoyo</h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm">
              <p>Rúbricas de evaluación, guías de preguntas y documentación oficial.</p>
            </div>
          </main>
        );

      case "cursos":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-white mb-6">Cursos de Capacitación</h2>
            
            {isLoadingCursos ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="w-8 h-8 border-2 border-[#00baff] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Cargando módulos...</p>
              </div>
            ) : cursos.length === 0 ? (
              <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
                <div className="text-4xl mb-4">📹</div>
                <p className="text-gray-400 text-sm">Pronto publicaremos los videos de capacitación aquí.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {cursos.map((curso) => {
                  const embedUrl = getYouTubeEmbedUrl(curso.url);
                  return (
                    <div key={curso.id} className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl group hover:border-[#0051ff]/50 transition-colors">
                      {embedUrl ? (
                        <div className="aspect-video w-full bg-black relative">
                          <iframe 
                            src={embedUrl} 
                            title={curso.titulo} 
                            className="absolute top-0 left-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-gray-900 flex items-center justify-center text-gray-500 text-sm">
                          Enlace de video inválido
                        </div>
                      )}
                      <div className="p-5 border-t border-gray-800">
                        <h3 className="font-bold text-lg text-white mb-2 leading-tight">{curso.titulo}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">{curso.descripcion}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Publicado el: <span className="text-gray-300">{new Date(curso.fecha).toLocaleDateString('es-MX')}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        );

      case "calendario":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Calendario Global</h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm">
              <p>Vista general de todas las fechas del proceso de admisión.</p>
            </div>
          </main>
        );

      case "panel":
      default:
        return (
          <main className="pt-24 pb-32 px-5 max-w-lg mx-auto min-h-screen flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00baff]"></div>
              <h2 className="text-xl font-bold mb-1">Hola, {primerNombre} 👋</h2>
              <p className="text-sm text-gray-400">Entrevistas programadas:</p>
            </div>

            {/* ✅ TARJETAS DE ENTREVISTAS */}
            {isLoadingEntrevistas ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <div className="w-8 h-8 border-2 border-[#00baff] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Cargando agenda...</p>
              </div>
            ) : misEntrevistas.length === 0 ? (
              <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
                <div className="text-4xl mb-4 text-[#00baff] opacity-50">☕</div>
                <p className="text-gray-400 text-sm">No tienes entrevistas asignadas por el momento.</p>
                <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">El sistema te notificará cuando tengas una.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Tus Próximas Citas ({misEntrevistas.length})</h3>
                {misEntrevistas.map((entrevista, idx) => (
                  <div key={idx} className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-[#00baff]/50 transition-all group">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] text-[#00baff] uppercase tracking-widest font-bold mb-1">Candidato</p>
                          <h3 className="text-lg font-bold text-white leading-tight">{entrevista.postulante}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{entrevista.dia} {entrevista.fecha} Abr</p>
                          <p className="text-sm font-black text-white">{entrevista.hora}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                        {entrevista.meetLink && (
                          <a 
                            href={entrevista.meetLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-center text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                            <span>📹</span> Meet
                          </a>
                        )}
                        <Link 
                          href={`/dashboard/entrevistador/postulante/${entrevista.idBloque}?email=${encodeURIComponent(entrevista.correoPostulante)}&dia=${entrevista.dia}&fecha=${entrevista.fecha}&hora=${entrevista.hora}`} 
                          className="flex-[2] py-3 bg-gradient-to-r from-[#0051ff] to-[#00baff] hover:from-[#00baff] hover:to-[#0051ff] text-center text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#0051ff]/20 flex items-center justify-center gap-2 active:scale-95"
                          >
                          Ver Perfil Completo <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        );
    }
  };

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

        <div className="flex flex-col items-center justify-center leading-none mt-1 cursor-pointer" onClick={() => setActiveTab("panel")}>
          <h1 className="text-xl font-black tracking-tight">Soph<span className="text-[#00baff]">IA</span></h1>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">by SIAFI</span>
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="hover:scale-105 transition-transform shrink-0">
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {/* OVERLAYS */}
      {(isMenuOpen || isNotifMenuOpen || showConfirmModal) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity" onClick={() => { setIsMenuOpen(false); setIsNotifMenuOpen(false); setShowConfirmModal(false); }} />
      )}
      
      {/* MODAL DE CONFIRMACIÓN DE HORARIO */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-[#0051ff]/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <span className="text-[#00baff]">⚠️</span> Confirmar Horario
              </h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">
                ¿Estás seguro de que deseas guardar estos cambios en tu disponibilidad? Una vez guardado, tu horario quedará registrado en el sistema.
              </p>
              
              <div className="bg-[#00baff]/10 border border-[#00baff]/30 rounded-2xl p-4 text-center shadow-inner">
                <p className="text-[#00baff] font-black text-2xl">{disponibilidad.length * 0.25} hrs</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Total de Disponibilidad</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={guardarHorario}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#0051ff] to-[#00baff] hover:from-[#00baff] hover:to-[#0051ff] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#0051ff]/20 active:scale-95"
              >
                Guardar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MENÚ PERFIL (DERECHO) */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div className="flex items-center gap-4 pr-4">
            <AvatarCircle size="w-12 h-12" />
            <div>
              <p className="font-bold text-white text-lg leading-tight truncate">{primerNombre}</p>
              <p className="text-xs text-gray-400 truncate mt-1">{userEmail}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-[#00baff]/20 border border-[#00baff]/30 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#00baff]">Entrevistador</p>
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
                className={`p-5 border-b border-gray-800/50 cursor-pointer transition-all relative group flex gap-4 items-start ${!notif.leida ? 'bg-[#00baff]/10' : 'hover:bg-[#1f2937]/30'}`}
              >
                {!notif.leida && <div className="absolute left-0 top-0 w-1 h-full bg-[#00baff]"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.leida ? 'bg-[#00baff]/20 text-[#00baff]' : 'bg-gray-800 text-gray-400'}`}>
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

      {renderActiveContent()}

      {/* CINTILLO INFERIOR DE ENTREVISTADOR */}
      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          
          <button 
            onClick={() => setActiveTab("mi-horario")}
            className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "mi-horario" ? "text-[#00baff]" : "text-gray-400 hover:text-gray-200"}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Horario</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("material")}
            className={`flex flex-col items-center justify-center w-12 mr-6 transition-colors ${activeTab === "material" ? "text-[#00baff]" : "text-gray-400 hover:text-gray-200"}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Material</span>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <button 
              onClick={() => setActiveTab("panel")}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-[6px] border-[#0a0a0a] transition-all duration-300 ${activeTab === "panel" ? "bg-gradient-to-tr from-[#0051ff] to-[#00baff] shadow-[0_0_20px_rgba(0,186,255,0.4)] scale-105" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}
            >
              <svg className={`w-7 h-7 ${activeTab === "panel" ? "text-white" : "currentColor"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          <button 
            onClick={() => setActiveTab("cursos")}
            className={`flex flex-col items-center justify-center w-12 ml-6 transition-colors ${activeTab === "cursos" ? "text-[#00baff]" : "text-gray-400 hover:text-gray-200"}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Cursos</span>
          </button>

          <button 
            onClick={() => setActiveTab("calendario")}
            className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "calendario" ? "text-[#00baff]" : "text-gray-400 hover:text-gray-200"}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Fechas</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}