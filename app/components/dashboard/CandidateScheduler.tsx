"use client";

import { useState } from "react";
import { format, parseISO, addMinutes, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

// Definición de rangos de fecha para filtrar (Año, Mes-1, Día)
// Nota: En JavaScript, Febrero es el mes 1 (Enero=0)
const WEEKS_RANGES = {
  0: { start: new Date(2026, 1, 9), end: new Date(2026, 1, 15) },  // 9-15 Feb
  1: { start: new Date(2026, 1, 16), end: new Date(2026, 1, 22) } // 16-22 Feb
};

const WEEKS = [
  { id: 0, label: "Semana 1", range: "9 - 15 Feb" },
  { id: 1, label: "Semana 2", range: "16 - 22 Feb" }
];

interface Props {
  userName: string;
  availableSlots: any[]; // Recibimos los datos reales
}

export default function CandidateScheduler({ userName, availableSlots }: Props) {
  const [showCalendar, setShowCalendar] = useState(false); // Estado para controlar la vista
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // LOGICA DE APARTADO
  const handleSelect = (blockId: string) => {
     if(!confirm("¿Confirmar este horario para tu entrevista?")) return;
     
     setLoadingId(blockId);
     try {
         // Aquí se conectará la API de apartado real posteriormente
         alert("¡Horario seleccionado! (Simulación)");
     } catch (error) {
         alert("Error al seleccionar");
     } finally {
         setLoadingId(null);
     }
  };

  // 🔍 FILTRO: Mostrar solo los bloques que caen en la semana seleccionada
  const filteredSlots = availableSlots.filter(slot => {
    if (!slot.start) return false;
    const slotDate = parseISO(slot.start);
    // @ts-ignore: TypeScript puede quejarse del índice numérico, pero es válido
    const range = WEEKS_RANGES[currentWeek as keyof typeof WEEKS_RANGES];
    
    // Usamos startOfDay y endOfDay para asegurar que cubra todo el día completo
    return isWithinInterval(slotDate, {
       start: startOfDay(range.start),
       end: endOfDay(range.end)
    });
  });

  // --- VISTA 1: PANTALLA DE BIENVENIDA (Felicidades) ---
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
                      Hemos abierto espacios exclusivos para que hables con la Mesa Directiva.
                      <br/>Selecciona el horario que mejor se acomode a ti.
                  </p>
                  <button 
                      onClick={() => setShowCalendar(true)} // <--- AQUÍ ACTIVAMOS EL CALENDARIO
                      className="mt-4 px-8 py-3 bg-[#0051ff] rounded-lg hover:bg-[#0041cc] transition-all text-white font-bold shadow-[0_0_20px_rgba(0,81,255,0.4)] hover:scale-105"
                  >
                      📅 Ver Horarios Disponibles
                  </button>
                </div>
            </div>
        </div>
    );
  }

  // --- VISTA 2: EL CALENDARIO (Scheduler) ---
  return (
    <div className="max-w-4xl w-full bg-black/80 border border-[#00baff]/50 p-6 rounded-2xl backdrop-blur-xl animate-in zoom-in duration-300">
      
      <div className="flex justify-between items-center mb-6">
         <div>
            <h2 className="text-2xl font-bold text-white">Selecciona tu Horario</h2>
            <p className="text-xs text-gray-400">La entrevista dura 30 minutos.</p>
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
                // ⏱️ CAMBIO AQUI: Ahora sumamos solo 30 minutos
                const endDate = addMinutes(startDate, 30); 
                const isLoading = loadingId === block.id;

                return (
                  <button
                    key={block.id}
                    disabled={isLoading}
                    onClick={() => handleSelect(block.id)}
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
  );
}