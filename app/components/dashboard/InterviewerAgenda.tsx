"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  agenda: any[];
}

export default function InterviewerAgenda({ agenda }: Props) {
  if (agenda.length === 0) {
    return (
      <div className="bg-black/40 border border-white/10 p-10 rounded-xl text-center">
        <h3 className="text-xl text-gray-300">No tienes entrevistas asignadas 😴</h3>
        <p className="text-gray-500 text-sm mt-2">
          Parece que no hubo coincidencia de horarios para ti, o el sistema asignó a otros socios.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agenda.map((slot) => (
          <div 
            key={slot.id}
            className={`
              p-4 rounded-xl border relative overflow-hidden group transition-all hover:scale-[1.02]
              ${slot.status === 'Confirmado' 
                ? 'bg-red-900/10 border-red-500/50' 
                : 'bg-green-900/10 border-green-500/50 opacity-70'}
            `}
          >
            <div className="flex justify-between items-start mb-3">
               <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider
                  ${slot.status === 'Confirmado' ? 'bg-red-500 text-black' : 'bg-green-500 text-black'}
               `}>
                 {slot.status}
               </span>
               <div className="text-right">
                 <p className="text-2xl font-bold text-white">
                    {format(parseISO(slot.date), "HH:mm")}
                 </p>
                 <p className="text-xs text-gray-400">
                    {format(parseISO(slot.date), "EEEE d 'de' MMMM", { locale: es })}
                 </p>
               </div>
            </div>

            <div className="pt-3 border-t border-white/10">
               <p className="text-xs text-gray-400 mb-1">Candidato:</p>
               <p className="text-sm font-bold text-white truncate">
                 {slot.candidate === 'Pendiente' ? '--- Esperando registro ---' : slot.candidate}
               </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}