"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { createPortal } from "react-dom";

interface Props {
  agenda: any[];
}

export default function InterviewerAgenda({ agenda }: Props) {
  const [selectedInterview, setSelectedInterview] = useState<any>(null);

  // 🔍 FILTRO: Solo mostramos las entrevistas que YA tienen un candidato (expediente cargado)
  const bookedAgenda = agenda.filter(slot => slot.candidate !== null);

  return (
    <>
      {/* --- CONTENEDOR PRINCIPAL --- */}
      <div className="w-full bg-black/40 border border-[#0051ff]/30 p-6 rounded-2xl backdrop-blur-md flex flex-col h-[80vh]">
        
        <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Próximas Sesiones</h2>
              <p className="text-gray-400 text-xs mt-1">
                  Aquí verás únicamente las entrevistas confirmadas por los postulantes.
              </p>
            </div>
            <div className="text-right">
               <span className="text-[#00baff] font-mono text-xl font-bold">{bookedAgenda.length}</span>
               <span className="text-gray-500 text-xs ml-2">CONFIRMADAS</span>
            </div>
        </div>

        {/* --- GRID DE TARJETAS (Scrollable) --- */}
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {bookedAgenda.length === 0 ? (
                // ESTADO VACÍO (Cuando nadie ha reservado aún)
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                    <div className="text-5xl mb-4 grayscale">⏳</div>
                    <h3 className="text-xl font-bold text-white">Esperando Candidatos...</h3>
                    <p className="text-gray-400 text-sm mt-2 max-w-md">
                        Aún no tienes entrevistas agendadas. <br/>
                        Los espacios vacíos están ocultos hasta que un postulante los reserve.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookedAgenda.map((slot) => {
                        const dateObj = parseISO(slot.date);
                        
                        return (
                            <button
                                key={slot.id}
                                onClick={() => setSelectedInterview(slot)}
                                className={`
                                    relative p-5 rounded-xl border text-left transition-all duration-300 group
                                    flex flex-col justify-between h-[180px]
                                    bg-[#0a0a0a]/60 border-white/10 hover:border-[#00baff]/50 hover:bg-[#00baff]/5 
                                    hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00baff]/10
                                `}
                            >
                                {/* HEADER TARJETA: FECHA */}
                                <div className="flex justify-between items-start w-full">
                                    <div>
                                        <p className="text-[#00baff] font-bold text-lg leading-none">
                                            {format(dateObj, "HH:mm")}
                                        </p>
                                        <p className="text-gray-500 text-xs uppercase font-bold mt-1">
                                            {format(dateObj, "EEEE d", { locale: es })}
                                        </p>
                                    </div>
                                    <div className="bg-[#00baff]/10 text-[#00baff] text-[10px] px-2 py-1 rounded border border-[#00baff]/20">
                                        EXPEDIENTE 📂
                                    </div>
                                </div>

                                {/* BODY TARJETA: DATOS CANDIDATO */}
                                <div>
                                    <h3 className="text-white font-bold text-lg truncate mb-1 group-hover:text-[#00baff] transition-colors">
                                        {slot.candidate.name}
                                    </h3>
                                    <div className="flex flex-wrap gap-1">
                                        {slot.candidate.nucelos.slice(0, 2).map((n: string) => (
                                            <span key={n} className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                                                {n}
                                            </span>
                                        ))}
                                        {slot.candidate.nucelos.length > 2 && (
                                            <span className="text-[10px] text-gray-500 px-1">+{slot.candidate.nucelos.length - 2}</span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* DECORACIÓN AL FINAL */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00baff]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* --- MODAL DE EXPEDIENTE (PORTAL) --- */}
      {selectedInterview && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            {/* CERRAR AL CLICK FUERA */}
            <div className="absolute inset-0" onClick={() => setSelectedInterview(null)}></div>
            
            <div className="bg-[#050505] border border-gray-800 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* HEADER MODAL */}
                <div className="p-6 border-b border-gray-800 bg-[#0a0a0a] flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-1">{selectedInterview.candidate.name}</h2>
                        <div className="flex gap-2 items-center text-sm text-gray-400">
                             <span>📧 {selectedInterview.candidateEmail}</span>
                             <span className="text-gray-600">|</span>
                             <span className="text-[#00baff]">
                                 {format(parseISO(selectedInterview.date), "EEEE d 'de' MMMM, HH:mm 'hrs'", { locale: es })}
                             </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedInterview(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* CONTENIDO SCROLLABLE */}
                <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* COLUMNA IZQUIERDA: DATOS CLAVE */}
                        <div className="space-y-6">
                            {/* SCORE SOPHIA */}
                            <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-xl text-center">
                                <p className="text-blue-400 text-xs font-bold uppercase mb-2">SophIA Score</p>
                                <div className="text-5xl font-black text-white mb-2">{selectedInterview.candidate.sophiaScore}/100</div>
                                <p className="text-gray-400 text-xs italic">Based on preliminary data</p>
                            </div>

                            {/* NÚCLEOS */}
                            <div className="bg-white/5 border border-white/5 p-5 rounded-xl">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-3">Núcleos de Interés</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedInterview.candidate.nucelos.map((n: string) => (
                                        <span key={n} className="bg-[#00baff]/10 text-[#00baff] border border-[#00baff]/20 px-3 py-1 rounded-lg text-sm">
                                            {n}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* ACCIONES */}
                            <div className="space-y-3">
                                {selectedInterview.candidate.cvUrl ? (
                                    <a 
                                        href={selectedInterview.candidate.cvUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-center text-white text-sm font-bold transition"
                                    >
                                        📄 Ver CV Original
                                    </a>
                                ) : (
                                    <div className="w-full py-3 bg-red-900/10 border border-red-500/20 rounded-lg text-center text-red-400 text-sm">
                                        🚫 Sin CV adjunto
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: NOTAS Y ANÁLISIS */}
                        <div className="md:col-span-2 space-y-6">
                            
                            {/* ANÁLISIS DE SOPHIA */}
                            <div className="bg-black border border-gray-800 p-6 rounded-xl">
                                <h3 className="flex items-center gap-2 text-teal-400 font-bold mb-4">
                                    <span>🧠</span> Análisis de IA
                                </h3>
                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedInterview.candidate.sophiaNotes}
                                </p>
                            </div>

                            {/* NOTAS DE REVISORES HUMANOS */}
                            <div className="bg-black border border-gray-800 p-6 rounded-xl">
                                <h3 className="flex items-center gap-2 text-yellow-400 font-bold mb-4">
                                    <span>📝</span> Notas de Revisión Preliminar
                                </h3>
                                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-yellow-500/30 pl-4">
                                    {selectedInterview.candidate.humanNotes}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* FOOTER MODAL */}
                <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex justify-end gap-3">
                    <button className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-black font-bold text-sm shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                        INICIAR EVALUACIÓN
                    </button>
                </div>

            </div>
        </div>,
        document.body
      )}
    </>
  );
}