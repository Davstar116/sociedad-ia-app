"use client";
import { useState } from "react";
import { format, parseISO, addMinutes } from "date-fns";
import { es } from "date-fns/locale";

// Definición simple de semanas (Reutilizamos la lógica visual)
const WEEKS = [
  { id: 0, label: "Semana 1", range: "9 - 15 Feb" },
  { id: 1, label: "Semana 2", range: "16 - 22 Feb" }
];

export default function CandidateScheduler() {
  const [currentWeek, setCurrentWeek] = useState(0);
  // NOTA: Aquí deberíamos cargar los bloques reales con useEffect desde la API
  // Por ahora pongo datos dummy para que veas el diseño
  const availableBlocks = [
     { id: '1', start: '2026-02-09T09:00:00-06:00', status: 'Disponible' },
     { id: '2', start: '2026-02-09T10:30:00-06:00', status: 'Disponible' },
     { id: '3', start: '2026-02-10T16:00:00-06:00', status: 'Reservando' }, // Alguien más lo ve
  ];

  const handleSelect = (blockId: string) => {
     if(!confirm("¿Confirmar este horario para tu entrevista?")) return;
     // Aquí iría la llamada a la API para apartar
     alert("¡Horario seleccionado! (Simulación)");
  };

  return (
    <div className="max-w-4xl w-full bg-black/80 border border-[#00baff]/50 p-6 rounded-2xl backdrop-blur-xl animate-in fade-in zoom-in">
      
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-white">Selecciona tu Horario</h2>
         <button className="text-xs text-red-400 underline">Cancelar</button>
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

      {/* LISTA DE BLOQUES (Diseño Simplificado Clean) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
         {availableBlocks.map(block => {
            const startDate = parseISO(block.start);
            const endDate = addMinutes(startDate, 40); // 40 mins entrevista
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