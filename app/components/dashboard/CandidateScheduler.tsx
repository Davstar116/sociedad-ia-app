"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // ✅ Importamos Portal
import { format, parseISO, addMinutes, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

// Definición de rangos de fecha
const WEEKS_RANGES = {
  0: { start: new Date(2026, 1, 9), end: new Date(2026, 1, 15) }, 
  1: { start: new Date(2026, 1, 16), end: new Date(2026, 1, 22) }
};

const WEEKS = [
  { id: 0, label: "Semana 1", range: "9 - 15 Feb" },
  { id: 1, label: "Semana 2", range: "16 - 22 Feb" }
];

interface Props {
  userName: string;
  availableSlots: any[];
}

export default function CandidateScheduler({ userName, availableSlots }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // Para evitar errores de hidratación con Portals

  // Estados para los Modales Personalizados
  const [selectedSlot, setSelectedSlot] = useState<any>(null); // Guardamos el bloque seleccionado para confirmar
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. AL HACER CLIC EN UN BLOQUE (Abre modal confirmación)
  const handleSelectClick = (block: any) => {
     setSelectedSlot(block); // Guardamos el bloque y abrimos el modal
  };

  // 2. CONFIRMAR RESERVA (Lógica real)
  const confirmBooking = async () => {
     if (!selectedSlot) return;

     setLoadingId(selectedSlot.id);
     setSelectedSlot(null); // Cerramos modal de confirmación

     try {
         // --- AQUÍ IRÁ LA LLAMADA A TU API REAL (POST /api/candidate/book-slot) ---
         // await fetch('/api/candidate/book', { ... })
         
         // Simulamos delay de red
         await new Promise(resolve => setTimeout(resolve, 1500));

         setFeedback({
             type: 'success',
             message: "Tu entrevista ha sido agendada correctamente. Recibirás un correo con los detalles."
         });

     } catch (error) {
         setFeedback({
             type: 'error',
             message: "Hubo un error al intentar reservar el horario. Por favor intenta de nuevo."
         });
     } finally {
         setLoadingId(null);
     }
  };

  const handleCloseFeedback = () => {
      setFeedback(null);
      if (feedback?.type === 'success') {
          window.location.reload(); // Recargar para actualizar la vista
      }
  };

  // 🔍 FILTRO: Mostrar solo los bloques que caen en la semana seleccionada
  const filteredSlots = availableSlots.filter(slot => {
    if (!slot.start) return false;
    const slotDate = parseISO(slot.start);
    // @ts-ignore
    const range = WEEKS_RANGES[currentWeek as keyof typeof WEEKS_RANGES];
    return isWithinInterval(slotDate, {
       start: startOfDay(range.start),
       end: endOfDay(range.end)
    });
  });

  // --- VISTA 1: PANTALLA DE BIENVENIDA ---
  if (!showCalendar) {
    return (
        <div className="max-w-4xl w-full animate-in fade-in duration-700">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white">
                ¡Felicidades, <span className="text-[#00baff]">{userName}</span>!
                </h1>
                <p className="text-gray-400 mt-2">Has pasado a la siguiente fase. Es hora de conocerte.</p>
            </div>

            <div className="bg-black/60 border border-[#00baff]/50 p-8 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,186,255,0.1)]">
                <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
                  <div className="bg-[#00baff] text-black font-bold px-3 py-1 rounded text-sm">FASE 2</div>
                  <h2 className="text-xl font-bold text-white">Agenda tu Entrevista</h2>
                </div>
                
                <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl bg-white/5">
                  <p className="text-gray-400 mb-6">
                      <br/>Selecciona el horario que mejor se acomode a ti.
                  </p>
                  <button 
                      onClick={() => setShowCalendar(true)} 
                      className="mt-4 px-8 py-3 bg-[#0051ff] rounded-lg hover:bg-[#0041cc] transition-all text-white font-bold shadow-[0_0_20px_rgba(0,81,255,0.4)] hover:scale-105"
                  >
                      📅 Ver Horarios Disponibles
                  </button>
                </div>
            </div>
        </div>
    );
  }

  // --- VISTA 2: EL CALENDARIO ---
  return (
    <>
        <div className="max-w-4xl w-full bg-black/80 border border-[#00baff]/50 p-6 rounded-2xl backdrop-blur-xl animate-in zoom-in duration-300">
        
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Selecciona tu Horario</h2>
                <p className="text-xs text-gray-400">La entrevista dura 30 minutos. Recuerda llegar a tiempo.</p>
            </div>
            <button 
                onClick={() => setShowCalendar(false)} 
                className="text-xs text-gray-400 hover:text-white underline"
            >
                Volver
            </button>
        </div>

        {/* SELECTOR SEMANAS */}
        <div className="flex gap-4 mb-6">
            {WEEKS.map((week) => (
            <button
                key={week.id}
                onClick={() => setCurrentWeek(week.id)}
                className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all
                ${currentWeek === week.id 
                    ? 'bg-[#00baff]/20 border-[#00baff] text-[#00baff]' 
                    : 'bg-white/5 border-white/10 text-gray-400'}
                `}
            >
                {week.label} <span className="block text-xs font-normal">{week.range}</span>
            </button>
            ))}
        </div>

        {/* LISTA DE BLOQUES REALES */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {filteredSlots.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500 italic">
                No hay horarios disponibles para esta semana por el momento.
                </div>
            ) : (
                filteredSlots.map(block => {
                    const startDate = parseISO(block.start);
                    const endDate = addMinutes(startDate, 30); 
                    const isLoading = loadingId === block.id;

                    return (
                    <button
                        key={block.id}
                        disabled={isLoading}
                        onClick={() => handleSelectClick(block)} // 🟢 CAMBIO: Usamos la nueva función
                        className={`
                            p-3 rounded-lg border text-left transition-all
                            bg-green-900/20 border-green-500/30 hover:bg-green-500 hover:text-black hover:border-green-500 group
                            ${isLoading ? 'opacity-50 cursor-wait' : ''}
                        `}
                    >
                        <div className="text-xs font-bold uppercase mb-1 opacity-70 group-hover:text-black">
                            {format(startDate, "EEEE d", { locale: es })}
                        </div>
                        <div className="text-lg font-bold group-hover:text-black">
                            {format(startDate, "HH:mm")}
                        </div>
                        <div className="text-[10px] opacity-60 group-hover:text-black">
                            Termina: {format(endDate, "HH:mm")}
                        </div>
                    </button>
                    )
                })
            )}
        </div>
        </div>

        {/* --- MODAL 1: CONFIRMACIÓN DE RESERVA --- */}
        {mounted && selectedSlot && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#0a0a0a] border border-[#00baff]/50 rounded-xl max-w-sm w-full p-6 shadow-[0_0_40px_rgba(0,186,255,0.2)] animate-in zoom-in-95 duration-200 relative overflow-hidden text-center">
                    
                    {/* Decoración */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#00baff]/10 blur-[40px] rounded-full pointer-events-none"></div>

                    <div className="text-4xl mb-4 bg-blue-900/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center border border-blue-500/30">
                        📅
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">Confirmar Entrevista</h3>
                    <p className="text-gray-400 text-sm mb-6">¿Deseas reservar este espacio?</p>

                    <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                        <p className="text-[#00baff] text-sm font-bold uppercase mb-1">
                            {format(parseISO(selectedSlot.start), "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        <p className="text-3xl font-black text-white">
                            {format(parseISO(selectedSlot.start), "HH:mm")}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            Duración: 30 min
                        </p>
                    </div>

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setSelectedSlot(null)}
                            className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition font-bold text-sm"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={confirmBooking}
                            className="flex-1 py-3 rounded-lg bg-[#00baff] hover:bg-[#009ac9] text-black font-bold text-sm shadow-[0_0_15px_rgba(0,186,255,0.4)] transition"
                        >
                            CONFIRMAR
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* --- MODAL 2: FEEDBACK (Éxito/Error) --- */}
        {mounted && feedback && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className={`
                    max-w-sm w-full bg-[#050505] border-2 rounded-xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]
                    animate-in zoom-in-95 duration-300 relative overflow-hidden text-center
                    ${feedback.type === 'success' ? 'border-green-500/50 shadow-green-900/20' : 'border-red-500/50 shadow-red-900/20'}
                `}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-${feedback.type === 'success' ? 'green' : 'red'}-500 blur-[20px]`}></div>

                    <div className={`
                        mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl
                        ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                    `}>
                        {feedback.type === 'success' ? '🎉' : '⚠️'}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                        {feedback.type === 'success' ? '¡Entrevista Agendada!' : 'Error'}
                    </h3>
                    
                    <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                        {feedback.message}
                    </p>

                    <button 
                        onClick={handleCloseFeedback}
                        className={`
                            w-full py-3 rounded-lg font-bold transition-all active:scale-95 uppercase tracking-wider text-sm
                            ${feedback.type === 'success' 
                            ? 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                            : 'bg-red-600 hover:bg-red-500 text-white'}
                        `}
                    >
                        {feedback.type === 'success' ? 'ENTENDIDO' : 'CERRAR'}
                    </button>
                </div>
            </div>,
            document.body
        )}
    </>
  );
}