"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 
import OneSignal from 'react-onesignal';

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FECHAS_S1 = [6, 7, 8, 9, 10, 11, 12];
const FECHAS_S2 = [13, 14, 15, 16, 17, 18, 19];

export default function DashboardAdminMaestro() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("control");

  // ESTADOS PURGA
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{success?: boolean, message?: string} | null>(null);

  // ✅ ESTADOS CURSOS ACTUALIZADOS
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [cursoForm, setCursoForm] = useState({ titulo: "", descripcion: "", url: "" });
  const [isSavingCurso, setIsSavingCurso] = useState(false);
  const [cursoResult, setCursoResult] = useState<{success?: boolean, message?: string} | null>(null); // Nuevo estado para el modal

  // ESTADOS GENERACIÓN DE BLOQUES
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<{success?: boolean, message?: string} | null>(null);

  // ESTADOS BLOQUEO GLOBAL DE HORARIOS
  const [isGlobalLockActive, setIsGlobalLockActive] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);

  // ESTADOS HORARIO
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

  const checkGlobalLock = async () => {
    try {
      const res = await fetch("/api/admin/toggle-lock");
      const data = await res.json();
      setIsGlobalLockActive(data.isLocked);
    } catch (error) {
      console.error("Error revisando bloqueo global:", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotificaciones();
      cargarHorario();
      checkGlobalLock();
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

  const ejecutarPurga = async () => {
    if (purgeConfirmText !== "PURGAR") return;
    setIsPurging(true);
    setPurgeResult(null);
    try {
      const res = await fetch("/api/admin/purge-miembros", { method: "POST" });
      const data = await res.json();
      if (res.ok) { setPurgeResult({ success: true, message: data.message }); } 
      else { setPurgeResult({ success: false, message: data.error || "Ocurrió un error." }); }
    } catch (error) {
      setPurgeResult({ success: false, message: "Fallo de conexión con el servidor." });
    } finally {
      setIsPurging(false);
      setPurgeConfirmText("");
    }
  };

  // ✅ FUNCIÓN DE GUARDAR CURSO ACTUALIZADA PARA USAR EL ESTADO
  const guardarCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCurso(true);
    setCursoResult(null);
    try {
      const res = await fetch("/api/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cursoForm)
      });
      if (res.ok) {
        setCursoForm({ titulo: "", descripcion: "", url: "" });
        setCursoResult({ success: true, message: "El video ha sido publicado exitosamente en el dashboard de los entrevistadores." });
      } else {
        setCursoResult({ success: false, message: "Ocurrió un error al intentar publicar el curso en la base de datos." });
      }
    } catch (error) {
      setCursoResult({ success: false, message: "Error de conexión con el servidor." });
    } finally {
      setIsSavingCurso(false);
    }
  };

  const generarBloques = async () => {
    setIsGenerating(true);
    setGenerateResult(null);
    try {
      const res = await fetch("/api/admin/generate-blocks", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setGenerateResult({ success: true, message: data.message });
      } else {
        setGenerateResult({ success: false, message: data.error || "Ocurrió un error." });
      }
    } catch (error) {
      setGenerateResult({ success: false, message: "Error de red al intentar generar bloques." });
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerGlobalLockToggle = () => {
    setShowLockConfirmModal(true);
  };

  const executeGlobalLock = async () => {
    setIsTogglingLock(true);
    try {
      const res = await fetch("/api/admin/toggle-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock: !isGlobalLockActive })
      });
      
      if (res.ok) {
        setIsGlobalLockActive(!isGlobalLockActive);
        setShowLockConfirmModal(false);
      } else {
        alert("Error al intentar cambiar el estado de bloqueo.");
      }
    } catch (error) {
      alert("Error de conexión al servidor.");
    } finally {
      setIsTogglingLock(false);
    }
  };

  const toggleSlot = (slotId: string) => {
    if (isLockedHorario || isGlobalLockActive) return;
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
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-yellow-500 animate-pulse">Cargando tu perfil...</div>;
  }

  const userName = session?.user?.name || "Admin Supremo";
  const userEmail = session?.user?.email || "Sin correo";
  // @ts-ignore
  const userAvatar = session?.user?.avatar; 
  
  const primerNombre = userName.split(" ")[0];
  const iniciales = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const AvatarCircle = ({ size }: { size: string }) => (
    <div className={`${size} rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 p-[2px] shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.3)]`}>
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
      
      case "control":
        return (
          <main className="pt-24 pb-28 px-5 max-w-4xl mx-auto min-h-screen animate-in fade-in duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="text-yellow-500">⚙️</span> Panel de Control
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Acciones Administrativas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className={`bg-[#111111] border ${isGlobalLockActive ? 'border-orange-500' : 'border-orange-500/30'} rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-orange-500 transition-all`}>
                <div>
                  <div className={`w-10 h-10 rounded-full ${isGlobalLockActive ? 'bg-orange-500 text-[#0a0a0a]' : 'bg-orange-500/10 text-orange-500'} flex items-center justify-center text-xl mb-4 transition-colors`}>
                    {isGlobalLockActive ? '🔒' : '🔓'}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Bloqueo de Horarios</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Congela el registro de disponibilidad en toda la plataforma. Ningún Entrevistador ni Administrador podrá modificar sus horarios. Ideal para evitar cambios de última hora antes de generar los bloques.
                  </p>
                </div>
                <button 
                  onClick={triggerGlobalLockToggle}
                  className={`w-full py-3 font-bold text-sm uppercase tracking-wider rounded-xl transition-all border ${
                    isGlobalLockActive 
                      ? "bg-orange-500 text-[#0a0a0a] border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:bg-orange-400" 
                      : "bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-[#0a0a0a] border-orange-500/30 hover:border-orange-500"
                  }`}
                >
                  {isGlobalLockActive ? "Desbloquear Sistema" : "Bloquear Sistema"}
                </button>
              </div>

              <div className="bg-[#111111] border border-green-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-green-500/60 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xl mb-4">🧩</div>
                  <h3 className="text-lg font-bold text-white mb-2">Generar Bloques</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Cruza los horarios de todos los entrevistadores y genera automáticamente bloques de 1 hora (2 entrevistadores por bloque) listos para que los postulantes reserven.
                  </p>
                </div>
                <button 
                  onClick={() => { setShowGenerateModal(true); setGenerateResult(null); }}
                  className="w-full py-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-[#0a0a0a] font-bold text-sm uppercase tracking-wider rounded-xl transition-all border border-green-500/30 hover:border-green-500"
                >
                  Construir Horarios
                </button>
              </div>

              <div className="bg-[#111111] border border-[#0051ff]/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-[#0051ff]/60 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-full bg-[#00baff]/10 text-[#00baff] flex items-center justify-center text-xl mb-4">📺</div>
                  <h3 className="text-lg font-bold text-white mb-2">Publicar Curso</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Sube un nuevo video de capacitación de YouTube al dashboard de los entrevistadores. Se mostrará inmediatamente para todos.
                  </p>
                </div>
                <button 
                  onClick={() => { setShowCursoModal(true); setCursoResult(null); }}
                  className="w-full py-3 bg-[#0051ff]/10 hover:bg-[#0051ff] text-[#00baff] hover:text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all border border-[#0051ff]/30 hover:border-[#0051ff]"
                >
                  Agregar Video
                </button>
              </div>

              <div className="bg-[#111111] border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-red-500/60 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-xl mb-4">🧹</div>
                  <h3 className="text-lg font-bold text-white mb-2">Purga de "Miembros"</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Busca todas las cuentas registradas erróneamente con el rol <span className="text-white font-mono bg-gray-800 px-1 rounded">Miembro</span>. Les enviará un correo con las instrucciones correctas y el enlace de postulación.
                  </p>
                </div>
                <button 
                  onClick={() => { setShowPurgeModal(true); setPurgeResult(null); setPurgeConfirmText(""); }}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all border border-red-500/30 hover:border-red-500"
                >
                  Configurar Purga
                </button>
              </div>

            </div>
          </main>
        );

      case "postulantes":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Base de Postulantes</h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm">
              <p>Tabla maestra con todos los CVs, respuestas y estatus de los candidatos.</p>
            </div>
          </main>
        );

      case "mi-horario":
        const fechasActivas = semana === 1 ? FECHAS_S1 : FECHAS_S2;
        
        return (
          <main className="pt-24 pb-28 px-3 max-w-2xl mx-auto min-h-screen animate-in fade-in duration-300 select-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Mi Disponibilidad</h2>
                {(isLockedHorario || isGlobalLockActive) && (
                  <p className={`text-[10px] ${isGlobalLockActive ? 'text-orange-500' : 'text-green-400'} font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1`}>
                    <span>🔒</span> {isGlobalLockActive ? 'Bloqueado por Sistema' : 'Registrado'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-yellow-500">
                  {disponibilidad.length * 0.25}
                  <span className="text-sm text-gray-500 font-medium"> hrs</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4 bg-[#111111] p-1.5 rounded-xl border border-gray-800">
              <button 
                onClick={() => setSemana(1)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 1 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Semana 1 (6-12 Abr)
              </button>
              <button 
                onClick={() => setSemana(2)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Semana 2 (13-19 Abr)
              </button>
            </div>

            <div className={`bg-[#111111] border rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden relative transition-all ${(isLockedHorario || isGlobalLockActive) ? 'border-green-500/30' : 'border-gray-800'} ${isGlobalLockActive ? 'border-orange-500/30' : ''}`}>
              
              {isLoadingSchedule ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></div>
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
                                (isLockedHorario || isGlobalLockActive)
                                  ? (isSelected ? 'bg-green-500 border-green-400 opacity-90 cursor-default shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-[#151515] border-gray-800 opacity-30 cursor-default')
                                  : (isSelected ? 'bg-yellow-500 border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.4)] cursor-pointer' : 'bg-[#1a1a1a] border-gray-800 hover:bg-gray-800/80 cursor-pointer')
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
              ) : isLockedHorario ? (
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
                      : 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-yellow-500/20 hover:from-yellow-500 hover:to-yellow-600'
                  }`}
                >
                  {isSavingHorario ? 'Guardando...' : saveSuccessHorario ? '¡Guardado Exitoso!' : 'Guardar Horario'}
                </button>
              )}
            </div>
          </main>
        );

      case "ajustes":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4">Ajustes del Sistema</h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm">
              <p>Configuración global de la plataforma SophIA.</p>
            </div>
          </main>
        );

      case "panel":
      default:
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
              <h2 className="text-xl font-bold mb-1">Hola Maestro, {primerNombre} 👑</h2>
              <p className="text-sm text-gray-400 mb-5">Tienes el control absoluto de SIAFI.</p>
              
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Estatus del Sistema</p>
                  <p className="text-sm font-semibold text-green-400">Sistemas operativos</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                  🟢
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
          <h1 className="text-xl font-black tracking-tight">Soph<span className="text-yellow-500">IA</span></h1>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Centro de Mando</span>
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="hover:scale-105 transition-transform shrink-0">
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {/* OVERLAYS GLOBALES */}
      {(isMenuOpen || isNotifMenuOpen || showPurgeModal || showCursoModal || showConfirmHorarioModal || showGenerateModal || showLockConfirmModal) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity" onClick={() => { setIsMenuOpen(false); setIsNotifMenuOpen(false); if(!isPurging) setShowPurgeModal(false); if(!isSavingCurso) setShowCursoModal(false); setShowConfirmHorarioModal(false); if(!isGenerating) setShowGenerateModal(false); if(!isTogglingLock) setShowLockConfirmModal(false); }} />
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN DE BLOQUEO (TEMA NARANJA) */}
      {showLockConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-orange-500/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <span className="text-orange-500">⚠️</span> Confirmar Acción
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">
                ¿Estás seguro de que deseas <strong className="text-orange-500">{isGlobalLockActive ? 'DESBLOQUEAR' : 'BLOQUEAR'}</strong> el registro de horarios para todos los usuarios?
              </p>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center shadow-inner">
                <p className="text-orange-500 font-black text-xl">Sistema de Horarios</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Estado actual: {isGlobalLockActive ? 'Bloqueado' : 'Activo'}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              <button 
                onClick={() => setShowLockConfirmModal(false)} 
                disabled={isTogglingLock} 
                className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={executeGlobalLock} 
                disabled={isTogglingLock} 
                className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-400 text-[#0a0a0a] font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50"
              >
                {isTogglingLock ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENERACIÓN BLOQUES */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-green-500/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <span className="text-green-500">🧩</span> Generar Entrevistas
              </h3>
            </div>
            <div className="p-6">
              {!generateResult ? (
                <>
                  <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">
                    ¿Estás seguro de que deseas construir los horarios? El sistema cruzará la disponibilidad actual de TODOS los entrevistadores y publicará los bloques resultantes en la base de datos para que los postulantes puedan verlos.
                  </p>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center shadow-inner">
                    <p className="text-green-500 font-black text-xl">SIAFI Match</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Proceso Automatizado</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className={`text-5xl mb-4 ${generateResult.success ? 'text-green-500' : 'text-red-500'}`}>
                    {generateResult.success ? '✅' : '❌'}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{generateResult.message}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              {!generateResult ? (
                <>
                  <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cancelar</button>
                  <button onClick={generarBloques} disabled={isGenerating} className="flex-1 py-3.5 bg-green-500 hover:bg-green-400 text-[#0a0a0a] font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 disabled:opacity-50">
                    {isGenerating ? "Generando..." : "Confirmar"}
                  </button>
                </>
              ) : (
                <button onClick={() => setShowGenerateModal(false)} className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cerrar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL HORARIO */}
      {showConfirmHorarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-yellow-500/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <span className="text-yellow-500">⚠️</span> Confirmar Horario
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">
                ¿Estás seguro de que deseas guardar estos cambios en tu disponibilidad? Una vez guardado, tu horario quedará registrado en el sistema.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center shadow-inner">
                <p className="text-yellow-500 font-black text-2xl">{disponibilidad.length * 0.25} hrs</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Total de Disponibilidad</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              <button onClick={() => setShowConfirmHorarioModal(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cancelar</button>
              <button onClick={guardarHorario} className="flex-1 py-3.5 bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL CURSO ACTUALIZADO */}
      {showCursoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-[#0051ff]/30 rounded-3xl w-full max-w-md shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="text-[#00baff]">📺</span> Nuevo Video
              </h3>
              <button disabled={isSavingCurso} onClick={() => {setShowCursoModal(false); setCursoResult(null);}} className="text-gray-500 hover:text-white">✕</button>
            </div>
            
            <div className="p-6">
              {!cursoResult ? (
                <form id="cursoForm" onSubmit={guardarCurso} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Título del Video</label>
                    <input required type="text" placeholder="Ej. Entrevistas por Competencias" value={cursoForm.titulo} onChange={e => setCursoForm({...cursoForm, titulo: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-[#0051ff] outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Descripción breve</label>
                    <textarea required rows={2} placeholder="De qué trata este curso..." value={cursoForm.descripcion} onChange={e => setCursoForm({...cursoForm, descripcion: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-[#0051ff] outline-none resize-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Enlace de YouTube</label>
                    <input required type="url" placeholder="https://youtube.com/..." value={cursoForm.url} onChange={e => setCursoForm({...cursoForm, url: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-[#0051ff] outline-none transition-colors" />
                  </div>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className={`text-5xl mb-4 ${cursoResult.success ? 'text-[#00baff]' : 'text-red-500'}`}>
                    {cursoResult.success ? '✅' : '❌'}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{cursoResult.message}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              {!cursoResult ? (
                <>
                  <button onClick={() => setShowCursoModal(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cancelar</button>
                  <button type="submit" form="cursoForm" disabled={isSavingCurso} className="flex-1 py-3.5 bg-[#0051ff] hover:bg-[#0041cc] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#0051ff]/20 active:scale-95 disabled:opacity-50">
                    {isSavingCurso ? "Publicando..." : "Publicar"}
                  </button>
                </>
              ) : (
                <button onClick={() => {setShowCursoModal(false); setCursoResult(null);}} className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cerrar</button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE PURGA */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col pointer-events-auto max-h-[90vh]">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a] rounded-t-3xl">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><span className="text-red-500">⚠️</span> Confirmar Purga</h3>
              <button disabled={isPurging} onClick={() => setShowPurgeModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {!purgeResult ? (
                <>
                  <p className="text-sm text-gray-400 mb-4">Estás a punto de eliminar todas las cuentas de tipo "Miembro" y enviarles el siguiente correo automático. <strong>Revisa la previsualización:</strong></p>
                  <div className="bg-[#050505] rounded-2xl mb-6 text-white font-sans text-sm border border-[#1f2937] overflow-hidden">
                    <div className="bg-[#1f2937] px-4 py-2 border-b border-[#374151]">
                      <p className="text-gray-300 text-xs"><span className="font-bold text-gray-400">De:</span> Soporte SIAFI &lt;siafi.reclutamiento@gmail.com&gt;</p>
                      <p className="text-gray-300 text-xs"><span className="font-bold text-gray-400">Asunto:</span> ⚠️ Error en tu registro de SIAFI - Acción Requerida</p>
                    </div>
                    <div className="p-4 bg-[#111111]">
                      <div className="h-1 bg-[#0051ff] w-full mb-0 rounded-t-md"></div>
                      <div className="bg-black p-3 border-b border-[#1f2937] flex justify-between items-center">
                        <span className="w-6 h-6 bg-gray-800 rounded-full inline-block"></span>
                        <span className="w-16 h-4 bg-gray-800 rounded inline-block"></span>
                      </div>
                      <div className="p-5">
                        <h2 className="text-[#ef4444] text-lg mb-3">Aviso de Sistema ⚠️</h2>
                        <p className="mb-3">Hola <strong>[Nombre]</strong>,</p>
                        <p className="text-gray-400 text-xs mb-3 leading-relaxed">Nos comunicamos contigo porque hemos detectado que creaste una cuenta estándar en la plataforma de SophIA en lugar de llenar el formulario oficial de postulación para el Reclutamiento 2026-2.</p>
                        <div className="bg-[#ef44441a] border-l-2 border-[#ef4444] p-3 mb-4">
                          <p className="font-bold text-sm mb-1 text-white">Acción Tomada</p>
                          <p className="text-[#fca5a5] text-xs">Para evitar conflictos técnicos en nuestro sistema y asegurar que tu perfil sea evaluado correctamente, <strong>la cuenta que creaste ha sido eliminada.</strong></p>
                        </div>
                        <p className="text-[#00baff] font-bold text-xs mb-4 leading-relaxed">Por favor, realiza tu registro de forma correcta ingresando al siguiente enlace y completando las preguntas de evaluación. Es muy importante que llenes los campos con datos completos y reales, sobre todo tu nombre completo:</p>
                        <div className="text-center my-4">
                          <span className="bg-[#0051ff] text-white px-4 py-2 rounded-lg font-bold text-xs uppercase">Ir al Formulario</span>
                        </div>
                        <p className="text-gray-400 text-xs mb-4 leading-relaxed">Una vez que llenes tu registro correctamente, el sistema creará automáticamente una cuenta para ti y recibirás un nuevo correo con tus credenciales y otra información.</p>
                        <p className="text-gray-400 text-xs leading-relaxed">Atentamente,<br/><strong className="text-white">Mesa Directiva & SophIA</strong><br/>SIAFI - UNAM</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4">
                    <label className="block text-xs text-red-400 uppercase tracking-widest font-bold mb-2">Para confirmar, escribe "PURGAR"</label>
                    <input type="text" value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} placeholder="PURGAR" className="w-full bg-[#0a0a0a] border border-red-500/50 rounded-lg p-3 text-white text-center font-mono tracking-widest focus:outline-none focus:border-red-500" />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className={`text-6xl mb-4 ${purgeResult.success ? 'text-green-500' : 'text-red-500'}`}>{purgeResult.success ? '✅' : '❌'}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{purgeResult.success ? 'Purga Completada' : 'Error en la Purga'}</h3>
                  <p className="text-gray-400">{purgeResult.message}</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-800 bg-[#0a0a0a] rounded-b-3xl">
              {!purgeResult ? (
                <button onClick={ejecutarPurga} disabled={purgeConfirmText !== "PURGAR" || isPurging} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isPurging ? "Procesando eliminación..." : "Confirmar y Ejecutar"}
                </button>
              ) : (
                <button onClick={() => setShowPurgeModal(false)} className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all">Cerrar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MENÚ PERFIL */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div className="flex items-center gap-4 pr-4">
            <AvatarCircle size="w-12 h-12" />
            <div>
              <p className="font-bold text-white text-lg leading-tight truncate">{primerNombre}</p>
              <p className="text-xs text-gray-400 truncate mt-1">{userEmail}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-yellow-500">Admin Maestro</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white mt-1 shrink-0">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <Link href="/dashboard/settings" className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Ajustes Globales</Link>
          <Link href="/dashboard/support" className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Consola de Errores</Link>
        </div>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* MENÚ NOTIFICACIONES */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-[#111111] border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isNotifMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Sistema
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
              <div key={notif.id} onClick={() => marcarComoLeida(notif.id, notif.leida)} className={`p-5 border-b border-gray-800/50 cursor-pointer transition-all relative group flex gap-4 items-start ${!notif.leida ? 'bg-yellow-500/10' : 'hover:bg-[#1f2937]/30'}`}>
                {!notif.leida && <div className="absolute left-0 top-0 w-1 h-full bg-yellow-500"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.leida ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-400'}`}>
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

      {renderActiveContent()}

      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          
          <button onClick={() => setActiveTab("control")} className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "control" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Control</span>
          </button>
          
          <button onClick={() => setActiveTab("postulantes")} className={`flex flex-col items-center justify-center w-12 mr-6 transition-colors ${activeTab === "postulantes" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Candidatos</span>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <button onClick={() => setActiveTab("panel")} className={`w-16 h-16 rounded-full flex items-center justify-center border-[6px] border-[#0a0a0a] transition-all duration-300 ${activeTab === "panel" ? "bg-gradient-to-tr from-yellow-600 to-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105 text-[#0a0a0a]" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            </button>
          </div>

          <button onClick={() => setActiveTab("mi-horario")} className={`flex flex-col items-center justify-center w-12 ml-6 transition-colors ${activeTab === "mi-horario" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Horario</span>
          </button>

          <button onClick={() => setActiveTab("ajustes")} className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "ajustes" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Ajustes</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}