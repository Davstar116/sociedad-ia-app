"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 
import OneSignal from 'react-onesignal';

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FECHAS_S1 = [6, 7, 8, 9, 10, 11, 12];
const FECHAS_S2 = [13, 14, 15, 16, 17, 18, 19];

export default function DashboardPostulante() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("home");
  
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleWeek, setScheduleWeek] = useState(1);
  const [scheduleDay, setScheduleDay] = useState<number | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);
  const [availableBlocks, setAvailableBlocks] = useState<any[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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

  const loadAvailableBlocks = async () => {
    setIsLoadingBlocks(true);
    try {
      const res = await fetch("/api/entrevistas/disponibles");
      const data = await res.json();
      if (data.success) {
        setAvailableBlocks(data.bloques);
      }
    } catch (error) {
      console.error("Error cargando bloques disponibles:", error);
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  const iniciarAgendamiento = () => {
    setIsScheduling(true);
    loadAvailableBlocks();
  };

  const confirmarEntrevista = async () => {
    if (!selectedBlock) return;
    setIsConfirming(true);
    
    // Aquí implementaremos la Fase 2
    setTimeout(() => {
      alert(`¡Fase 1 Completada y pulida! Has seleccionado el bloque: ${selectedBlock.hora}. Siguiente paso: Generar el Meet y Correos.`);
      setIsConfirming(false);
    }, 2000);
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

  const renderHomeTab = () => {
    switch (userEstatus) {
      case "Aprobado para Entrevista":
        if (isScheduling) {
          const fechasActivas = scheduleWeek === 1 ? FECHAS_S1 : FECHAS_S2;
          
          // ✅ AGRUPAMOS LOS BLOQUES DEL DÍA SELECCIONADO PARA EVITAR DUPLICADOS
          const bloquesDelDia = availableBlocks.filter(b => b.fecha === scheduleDay);
          const uniqueBlocksMap = new Map();
          bloquesDelDia.forEach(b => {
            if (!uniqueBlocksMap.has(b.hora)) {
              uniqueBlocksMap.set(b.hora, b); // Se guarda el primer bloque que encuentre con esa hora
            }
          });
          const uniqueBlocks = Array.from(uniqueBlocksMap.values());

          return (
            <main className="pt-20 pb-32 px-5 max-w-lg mx-auto min-h-screen animate-in slide-in-from-right-8 fade-in duration-500">
              
              <button onClick={() => {setIsScheduling(false); setSelectedBlock(null); setScheduleDay(null);}} className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-white tracking-tight">Selecciona tu Horario</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Entrevista de Admisión SIAFI</p>
              </div>

              {isLoadingBlocks ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <div className="w-10 h-10 border-4 border-[#0051ff] border-t-[#00baff] rounded-full animate-spin mb-4"></div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Buscando horarios...</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-6 bg-[#111111] p-1.5 rounded-xl border border-gray-800">
                    <button 
                      onClick={() => {setScheduleWeek(1); setScheduleDay(null); setSelectedBlock(null);}}
                      className={`flex-1 py-2.5 text-[11px] font-bold rounded-lg transition-colors ${scheduleWeek === 1 ? 'bg-gradient-to-r from-[#0051ff] to-[#00baff] text-white shadow-lg shadow-[#0051ff]/20' : 'text-gray-400 hover:text-white'}`}
                    >
                      Semana 1 (6-12 Abr)
                    </button>
                    <button 
                      onClick={() => {setScheduleWeek(2); setScheduleDay(null); setSelectedBlock(null);}}
                      className={`flex-1 py-2.5 text-[11px] font-bold rounded-lg transition-colors ${scheduleWeek === 2 ? 'bg-gradient-to-r from-[#0051ff] to-[#00baff] text-white shadow-lg shadow-[#0051ff]/20' : 'text-gray-400 hover:text-white'}`}
                    >
                      Semana 2 (13-19 Abr)
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {DIAS_SEMANA.map((nombreDia, idx) => {
                      const fechaDia = fechasActivas[idx];
                      
                      // ✅ LÓGICA DE CONTEO ÚNICO PARA EL DÍA
                      const bloquesHoy = availableBlocks.filter(b => b.fecha === fechaDia);
                      const uniqueHorasHoy = new Set(bloquesHoy.map(b => b.hora)).size;
                      const isSelected = scheduleDay === fechaDia;

                      return (
                        <div 
                          key={fechaDia}
                          onClick={() => {
                            if (uniqueHorasHoy > 0) {
                              setScheduleDay(fechaDia);
                              setSelectedBlock(null);
                            }
                          }}
                          className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all ${
                            isSelected 
                              ? 'bg-[#00baff]/10 border-2 border-[#00baff] shadow-[0_0_15px_rgba(0,186,255,0.2)]' 
                              : uniqueHorasHoy > 0 
                                ? 'bg-[#111111] border border-gray-800 hover:border-[#0051ff]/50 cursor-pointer' 
                                : 'bg-[#0a0a0a] border border-gray-900 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{nombreDia.slice(0,3)}</span>
                          <span className={`text-xl font-black mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{fechaDia}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#00baff] text-[#0a0a0a]' : uniqueHorasHoy > 0 ? 'bg-gray-800 text-[#00baff]' : 'text-gray-600'}`}>
                            {uniqueHorasHoy} libres
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {scheduleDay && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <h3 className="text-sm font-bold text-white mb-3">Horarios Disponibles</h3>
                      {uniqueBlocks.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No hay horarios disponibles para este día.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {/* ✅ MAPEO DE BLOQUES ÚNICOS */}
                          {uniqueBlocks.map(bloque => (
                            <button
                              key={bloque.id}
                              onClick={() => setSelectedBlock(bloque)}
                              className={`py-3 px-2 rounded-xl border text-sm font-bold transition-all ${
                                selectedBlock?.id === bloque.id
                                  ? 'bg-[#00baff]/10 border-[#00baff] text-[#00baff] shadow-[0_0_15px_rgba(0,186,255,0.2)]'
                                  : 'bg-[#111111] border-gray-800 text-gray-300 hover:bg-[#1a1a1a] hover:border-gray-600'
                              }`}
                            >
                              {bloque.hora}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ ESPACIADOR INVISIBLE PARA MOVILES: Evita que el botón tape los horarios */}
                  {selectedBlock && <div className="h-36 w-full shrink-0"></div>}

                  {selectedBlock && (
                    <div className="fixed bottom-20 left-0 w-full px-5 z-40 animate-in slide-in-from-bottom-10 duration-300">
                      <div className="max-w-lg mx-auto bg-[#111111] p-4 rounded-3xl border border-[#00baff]/30 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                        <div className="flex justify-between items-center mb-4 px-2">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Selección</p>
                            <p className="text-white font-bold">{selectedBlock.dia} {selectedBlock.fecha}, {selectedBlock.hora}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#00baff]/20 flex items-center justify-center text-[#00baff]">✓</div>
                        </div>
                        <button 
                          onClick={confirmarEntrevista}
                          disabled={isConfirming}
                          className="w-full py-3.5 bg-gradient-to-r from-[#0051ff] to-[#00baff] hover:from-[#00baff] hover:to-[#0051ff] text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#0051ff]/20 active:scale-95 disabled:opacity-50"
                        >
                          {isConfirming ? "Procesando cita..." : "Agendar Horario"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
          );
        }

        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 fade-in duration-500">
            <div className="text-center w-full">
              <div className="w-28 h-28 bg-[#0051ff]/10 text-[#00baff] rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-[0_0_50px_rgba(0,186,255,0.2)] animate-bounce">
                🌟
              </div>
              <h2 className="text-3xl font-black mb-2 text-white tracking-tight">¡Aprobado!</h2>
              <p className="text-yellow-500 font-bold tracking-widest uppercase text-xs mb-8 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">Siguiente Etapa: Entrevista</p>
            </div>
            
            <div className="bg-[#111111] border border-[#0051ff]/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden w-full">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0051ff] to-[#00baff]"></div>
              <p className="text-gray-300 text-sm leading-relaxed mb-8">
                Felicidades <strong>{primerNombre}</strong>, tu perfil ha destacado entre los demás postulantes. Queremos conocerte mejor, platicar sobre tu visión y tu pasión por la tecnología.
              </p>
              <button 
                onClick={iniciarAgendamiento}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95"
              >
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
              <p className="text-green-400 font-bold tracking-widest uppercase text-xs mb-8">¡Felicidades, has sido aceptad@!</p>
            </div>
            
            <div className="bg-[#111111] border border-green-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden w-full">
              <div className="absolute inset-0 bg-green-500/5 backdrop-blur-3xl"></div>
              <div className="relative z-10">
                <p className="text-gray-300 text-sm leading-relaxed mb-8">
                  Nos emociona muchísimo informarte que has sido oficialmente <strong>Aceptad@</strong> en la Sociedad de Inteligencia Artificial de la Facultad de Ingeniería. ¡Comienza una nueva etapa!
                </p>
                <button className="w-full py-4 bg-green-500 hover:bg-green-400 text-[#0a0a0a] font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95">
                  Unirse al grupo de WhatsApp
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
                  Te enviaremos una notificación por este medio y directamente a tu celular en cuanto haya una actualización sobre tu proceso. ¡Mantente atent@!
                </p>
              </div>
            </div>
          </main>
        );
    }
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case "siafi":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-500">
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0051ff]/20 to-[#00baff]/20 text-[#00baff] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,186,255,0.2)] border border-[#00baff]/10">
                🧠
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Acerca de SIAFI</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Facultad de Ingeniería UNAM</p>
              </div>
            </div>

            <div className="w-full h-48 rounded-3xl overflow-hidden mb-6 shadow-2xl border border-gray-800 relative group">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src="/siafi-banner.png" alt="Equipo SIAFI" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent"></div>
               <div className="absolute bottom-4 left-5 right-5">
                 <span className="inline-block px-2 py-1 bg-[#0051ff]/50 backdrop-blur-md rounded-md text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">Tecnología de Vanguardia</span>
               </div>
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#0051ff] to-[#00baff]"></div>
               <p className="text-gray-300 text-sm leading-relaxed">
                 <strong className="text-white">La Sociedad de Inteligencia Artificial de la Facultad de Ingeniería (SIAFI)</strong> es una agrupación estudiantil que busca compartir con la comunidad el impacto de la IA y cómo podemos conectar esta tecnología con nuestro día a día.
               </p>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
               <div className="bg-gradient-to-br from-[#111111] to-[#1a1a1a] border border-gray-800 rounded-3xl p-6 shadow-xl hover:border-gray-700 transition-colors">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 rounded-full bg-[#0051ff]/10 flex items-center justify-center text-[#0051ff]">🎯</div>
                   <h3 className="font-bold text-white text-sm uppercase tracking-wide">Nuestro Objetivo</h3>
                 </div>
                 <p className="text-gray-400 text-xs leading-relaxed">
                   Fomentar el aprendizaje y la investigación en Inteligencia Artificial, creando una red de colaboración entre estudiantes, profesores y profesionales. Buscamos desarrollar proyectos innovadores que impacten positivamente a nuestra sociedad.
                 </p>
               </div>

               <div className="bg-gradient-to-br from-[#111111] to-[#1a1a1a] border border-gray-800 rounded-3xl p-6 shadow-xl hover:border-gray-700 transition-colors">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 rounded-full bg-[#00baff]/10 flex items-center justify-center text-[#00baff]">👁️</div>
                   <h3 className="font-bold text-white text-sm uppercase tracking-wide">Nuestra Visión</h3>
                 </div>
                 <p className="text-gray-400 text-xs leading-relaxed">
                   Ser el referente estudiantil en México y Latinoamérica en la divulgación y aplicación práctica de la Inteligencia Artificial, manteniendo a nuestra comunidad a la vanguardia tecnológica y científica.
                 </p>
               </div>
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 mb-2 shadow-xl">
               <h3 className="font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wide text-sm">
                 <span className="w-2 h-2 rounded-full bg-[#00baff] animate-pulse"></span>
                 ¿Qué hacemos en SIAFI?
               </h3>
               <ul className="space-y-5">
                 <li className="flex items-start gap-4">
                   <div className="mt-0.5 text-[#00baff] bg-[#00baff]/10 p-1.5 rounded-lg">👨‍💻</div>
                   <div>
                     <p className="text-sm font-bold text-gray-200 mb-1">Capacitación constante</p>
                     <p className="text-xs text-gray-500 leading-relaxed">Impartimos cursos prácticos, grupos de estudio y mentorías sobre diversos temas del área.</p>
                   </div>
                 </li>
                 <li className="flex items-start gap-4">
                   <div className="mt-0.5 text-[#00baff] bg-[#00baff]/10 p-1.5 rounded-lg">💡</div>
                   <div>
                     <p className="text-sm font-bold text-gray-200 mb-1">Proyectos Colaborativos</p>
                     <p className="text-xs text-gray-500 leading-relaxed">Diseñamos soluciones tecnológicas y software propio como Prometeo, LISAM, F-Voice y Netmind.</p>
                   </div>
                 </li>
                 <li className="flex items-start gap-4">
                   <div className="mt-0.5 text-[#00baff] bg-[#00baff]/10 p-1.5 rounded-lg">🤝</div>
                   <div>
                     <p className="text-sm font-bold text-gray-200 mb-1">Eventos y Networking</p>
                     <p className="text-xs text-gray-500 leading-relaxed">Organizamos conferencias, divulgación y vinculación con profesionales de la industria para el desarrollo integral.</p>
                   </div>
                 </li>
               </ul>
            </div>
          </main>
        );

      case "proyectos":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-500">
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0051ff]/20 to-[#00baff]/20 text-[#00baff] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,186,255,0.2)] border border-[#00baff]/10">
                🚀
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Nuestros Proyectos</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Innovación y Desarrollo</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              
              {/* NETMIND */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-[#00baff]/50 transition-colors">
                <div className="h-28 w-full overflow-hidden relative flex justify-center items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/netmind.png" alt="NetMind" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">NetMind</h3>
                    <span className="text-[10px] px-2 py-1 bg-[#00baff]/10 text-[#00baff] rounded-md font-bold uppercase">NLP / Salud Mental</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Inteligencia Artificial para el Bienestar Emocional. Unimos psicología e IA para analizar patrones emocionales en los textos mediante NLP, brindando análisis detallados y actuando como enlace con especialistas de la salud mental.
                  </p>
                </div>
              </div>

              {/* PROFESOR VR */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-[#00baff]/50 transition-colors">
                <div className="h-28 w-full overflow-hidden relative flex justify-center items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/profesor-vr.jpg" alt="Profesor VR" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">Profesor VR</h3>
                    <span className="text-[10px] px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md font-bold uppercase">Realidad Virtual / IA</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Profesor Inteligente en Realidad Virtual. Proporciona una experiencia de enseñanza personalizada adaptando la pedagogía y la actitud del profesor virtual según las necesidades y el estilo de aprendizaje de cada estudiante.
                  </p>
                </div>
              </div>

              {/* KANJI-JI */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-[#00baff]/50 transition-colors">
                <div className="h-28 w-full overflow-hidden relative flex justify-center items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/kanji-ji.png" alt="Kanji-ji" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">Kanji-ji</h3>
                    <span className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 rounded-md font-bold uppercase">Computer Vision / Idiomas</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Aplicación de aprendizaje del idioma japonés. Impulsada por redes neuronales, incluye un avanzado sistema de detección de Kanjis para facilitar el aprendizaje de forma intuitiva tanto a principiantes como a nivel avanzado.
                  </p>
                </div>
              </div>

              {/* F-VOICE */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-[#00baff]/50 transition-colors">
                <div className="h-28 w-full overflow-hidden relative flex justify-center items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/f-voice.png" alt="F-Voice" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">F-Voice</h3>
                    <span className="text-[10px] px-2 py-1 bg-green-500/10 text-green-400 rounded-md font-bold uppercase">Audio / TTS</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Tecnología de voces sintéticas clave en asistentes virtuales y modelos de lenguaje. Busca potenciar la accesibilidad, la inclusión y crear experiencias más inmersivas y realistas mediante la generación avanzada de voz.
                  </p>
                </div>
              </div>

              {/* LISAM */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-[#00baff]/50 transition-colors">
                <div className="h-28 w-full overflow-hidden relative flex justify-center items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/lisam.png" alt="LISAM" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">LISAM</h3>
                    <span className="text-[10px] px-2 py-1 bg-[#00baff]/10 text-[#00baff] rounded-md font-bold uppercase">Computer Vision / LSM</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Modelo de IA enfocado en la detección de Lenguaje de Señas Mexicanas (LSM) en tiempo real mediante visión por computadora. Interpreta señas LSM, impulsando la comunicación inclusiva.
                  </p>
                </div>
              </div>

            </div>
          </main>
        );

      case "eventos":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-500">
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0051ff]/20 to-[#00baff]/20 text-[#00baff] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,186,255,0.2)] border border-[#00baff]/10">
                🗓️
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Eventos y Comunidad</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">SIAFI en Acción</p>
              </div>
            </div>

            <div className="w-full h-44 rounded-3xl overflow-hidden mb-8 shadow-2xl border border-gray-800 relative group">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src="/header-eventos.jpeg" alt="Comunidad SIAFI" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent"></div>
               <div className="absolute bottom-4 left-5 right-5">
                 <span className="inline-block px-2 py-1 bg-[#0051ff]/50 backdrop-blur-md rounded-md text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">Más que código, somos comunidad</span>
               </div>
            </div>

            <div className="flex flex-col gap-6">
              
              {/* CONVIVENCIA INTERNA */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-[#00baff]/40 transition-colors">
                <div className="absolute -right-6 -bottom-6 text-7xl opacity-10 group-hover:scale-110 group-hover:opacity-15 transition-all">🤝</div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#0051ff]/10 flex items-center justify-center text-[#00baff] text-xl">✨</div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Convivencia y Team Building</h3>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed relative z-10">
                  Fortalecemos nuestros lazos como equipo fuera del entorno académico. Organizamos integraciones, dinámicas y eventos sociales internos para fomentar la colaboración, la amistad y un ambiente de apoyo mutuo entre todos los miembros de la sociedad.
                </p>
              </div>

              {/* PLÁTICAS DE RELEVANCIA */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-[#00baff]/40 transition-colors">
                <div className="absolute -right-6 -bottom-6 text-7xl opacity-10 group-hover:scale-110 group-hover:opacity-15 transition-all">🎤</div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#0051ff]/10 flex items-center justify-center text-[#00baff] text-xl">💡</div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Charlas y Paneles de Vanguardia</h3>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed relative z-10">
                  Espacios de aprendizaje y discusión donde invitamos a expertos de la industria y academia. Abordamos temas de alta relevancia en Inteligencia Artificial, ética, futuro tecnológico y desarrollo profesional, manteniendo a nuestra comunidad siempre actualizada.
                </p>
              </div>

              {/* CIENCIA CON NIÑOS */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-[#00baff]/40 transition-colors">
                <div className="absolute -right-6 -bottom-6 text-7xl opacity-10 group-hover:scale-110 group-hover:opacity-15 transition-all">🧒</div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#0051ff]/10 flex items-center justify-center text-[#00baff] text-xl">🚀</div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Fomento a la Cultura Científica</h3>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed relative z-10">
                  Creemos en inspirar a las siguientes generaciones. Realizamos talleres interactivos y eventos lúdicos diseñados especialmente para niños, acercándoles la ciencia y la tecnología de forma divertida para despertar su curiosidad y vocación científica.
        </p>
              </div>

              {/* STANDS EN FERIAS */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-[#00baff]/40 transition-colors">
                <div className="absolute -right-6 -bottom-6 text-7xl opacity-10 group-hover:scale-110 group-hover:opacity-15 transition-all">⛺</div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#0051ff]/10 flex items-center justify-center text-[#00baff] text-xl">🛠️</div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Divulgación en Ferias y Exposiciones</h3>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed relative z-10">
                  Llevamos el trabajo de SIAFI fuera de la Facultad. Participamos con stands en ferias tecnológicas y académicas para presentar nuestros proyectos de IA y dar a conocer el impacto y las actividades de la sociedad a un público más amplio.
                </p>
              </div>

            </div>
          </main>
        );

      case "nucleos":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-500">
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0051ff]/20 to-[#00baff]/20 text-[#00baff] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,186,255,0.2)] border border-[#00baff]/10">
                🧬
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Los Núcleos</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Estructura de SIAFI</p>
              </div>
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 mb-8 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#0051ff] to-[#00baff]"></div>
               <p className="text-gray-300 text-sm leading-relaxed">
                 En SIAFI contamos con <strong className="text-white">cuatro grandes áreas</strong> que nos permiten observar el comportamiento de la IA desde diversos campos, tanto sociales como técnicos.
               </p>
            </div>

            <div className="flex flex-col gap-6">
              
              {/* PROYECTOS */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-[#0051ff]/50 transition-colors">
                <div className="h-32 w-full overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nucleo-proyectos.png" alt="Núcleo Proyectos" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-[#0051ff]">💻</span> Proyectos
                    </h3>
                    <span className="text-[9px] px-2 py-1 bg-[#0051ff]/10 text-[#00baff] rounded-md font-bold uppercase tracking-wider">Desarrollo Técnico</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Es el núcleo donde se desarrolla principalmente el área técnica. Aquí, los miembros analizan las necesidades de la sociedad desde su experiencia personal para desarrollar soluciones tecnológicas que las satisfagan.
                  </p>
                </div>
              </div>

              {/* CAPACITACIÓN */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-yellow-500/50 transition-colors">
                <div className="h-32 w-full overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nucleo-capacitacion.png" alt="Núcleo Capacitación" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-yellow-500">📚</span> Capacitación
                    </h3>
                    <span className="text-[9px] px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-md font-bold uppercase tracking-wider">Aprendizaje</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Área encargada de la creación e impartición de cursos técnicos y talleres de habilidades blandas, fomentando el crecimiento constante de los conocimientos entre nuestros miembros.
                  </p>
                </div>
              </div>

              {/* ORGANIZACIÓN */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-green-500/50 transition-colors">
                <div className="h-32 w-full overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nucleo-organizacion.png" alt="Núcleo Organización" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-green-500">📋</span> Organización
                    </h3>
                    <span className="text-[9px] px-2 py-1 bg-green-500/10 text-green-400 rounded-md font-bold uppercase tracking-wider">Logística</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Área que se encarga de la gestión, coordinación y realización de eventos que dan a conocer la sociedad a la comunidad, así como los diversos proyectos de la sociedad y actividades de integración entre los miembros.
                  </p>
                </div>
              </div>

              {/* DIFUSIÓN */}
              <div className="bg-[#111111] border border-gray-800 rounded-3xl overflow-hidden shadow-xl group hover:border-purple-500/50 transition-colors">
                <div className="h-32 w-full overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/nucleo-difusion.png" alt="Núcleo Difusión" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent"></div>
                </div>
                <div className="p-6 pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-purple-500">📢</span> Difusión
                    </h3>
                    <span className="text-[9px] px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md font-bold uppercase tracking-wider">Marketing</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Es el área responsable del marketing de los proyectos y del posicionamiento de la sociedad, asegurando que nuestro trabajo llegue a todo el público.
                  </p>
                </div>
              </div>

            </div>
          </main>
        );

      case "home":
      default:
        return renderHomeTab();
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

        <div className="flex flex-col items-center justify-center leading-none mt-1 cursor-pointer" onClick={() => setActiveTab("home")}>
          <h1 className="text-xl font-black tracking-tight">Soph<span className="text-[#00baff]">IA</span></h1>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">by SIAFI</span>
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="hover:scale-105 transition-transform shrink-0">
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {(isMenuOpen || isNotifMenuOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => { setIsMenuOpen(false); setIsNotifMenuOpen(false); }} />
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

      {renderActiveContent()}

      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          
          <button 
            onClick={() => setActiveTab("siafi")}
            className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "siafi" ? "text-[#00baff]" : "text-gray-400 hover:text-gray-200"}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 011.98-3A2.5 2.5 0 019.5 2zM14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-1.98-3A2.5 2.5 0 0014.5 2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">SIAFI</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("proyectos")}
            className={`flex flex-col items-center justify-center w-12 mr-6 transition-colors ${activeTab === "proyectos" ? "text-[#00baff]" : "text-gray-400 hover:text-gray-200"}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Proyectos</span>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <button 
              onClick={() => { setActiveTab("home"); setIsScheduling(false); setSelectedBlock(null); setScheduleDay(null); }}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-[6px] border-[#0a0a0a] transition-all duration-300 ${activeTab === "home" ? "bg-gradient-to-tr from-[#0051ff] to-[#00baff] shadow-[0_0_20px_rgba(0,186,255,0.4)] scale-105" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}
            >
              <svg className={`w-7 h-7 ${activeTab === "home" ? "text-white" : "currentColor"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>

          <button 
            onClick={() => setActiveTab("eventos")}
            className={`flex flex-col items-center justify-center w-12 ml-6 transition-colors ${activeTab === "eventos" ? "text-[#00baff]" : "text-gray-400 hover:text-gray-200"}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Eventos</span>
          </button>

          <button 
            onClick={() => setActiveTab("nucleos")}
            className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "nucleos" ? "text-[#00baff]" : "text-gray-400 hover:text-gray-200"}`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Núcleos</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}