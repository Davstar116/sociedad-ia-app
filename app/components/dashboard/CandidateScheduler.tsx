"use client";

import { useState } from "react";
import { format, parseISO, addMinutes } from "date-fns";
import { es } from "date-fns/locale";

// Definición simple de semanas
const WEEKS = [
  { id: 0, label: "Semana 1", range: "9 - 15 Feb" },
  { id: 1, label: "Semana 2", range: "16 - 22 Feb" }
];

// Recibimos el nombre del usuario para la pantalla de bienvenida
export default function CandidateScheduler({ userName }: { userName: string }) {
  const [showCalendar, setShowCalendar] = useState(false); // Estado para controlar la vista
  const [currentWeek, setCurrentWeek] = useState(0);

  // NOTA: Aquí deberíamos cargar los bloques reales con useEffect desde la API
  // Por ahora mantenemos los datos dummy para la prueba visual
  const availableBlocks = [
     { id: '1', start: '2026-02-09T09:00:00-06:00', status: 'Disponible' },
     { id: '2', start: '2026-02-09T10:30:00-06:00', status: 'Disponible' },
     { id: '3', start: '2026-02-10T16:00:00-06:00', status: 'Reservando' },
  ];

  const handleSelect = (blockId: string) => {
     if(!confirm("¿Confirmar este horario para tu entrevista?")) return;
     alert("¡Horario seleccionado! (Simulación)");
  };

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
            <p className="text-xs text-gray-400">Recuerda llegar 5 minutos antes a tu sesión.</p>
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

      {/* LISTA DE BLOQUES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
         {availableBlocks.map(block => {
            const startDate = parseISO(block.start);
            const endDate = addMinutes(startDate, 40);
            const isTaken = block.status !== 'Disponible';

            return (
               <button
                 key={block.id}
                 disabled={isTaken}
                 onClick={() => handleSelect(block.id)}
                 className={`
                    p-3 rounded-lg border text-left transition-all
                    ${isTaken 
                       ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed' 
                       : 'bg-green-900/20 border-green-500/30 hover:bg-green-500 hover:text-black hover:border-green-500 group'}
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
         })}
      </div>
    </div>
  );
}