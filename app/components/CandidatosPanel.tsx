import { useState, useEffect } from "react";

export function CandidatosPanel({ user }: { user: any }) {
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasoActivo, setPasoActivo] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const isPresidente = user?.cargo === "Presidente";
  const isVice = user?.cargo === "Vicepresidente";
  const isGeneral = isPresidente || isVice;

  const fetchCandidatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/candidatos/list");
      const data = await res.json();
      if (data.success) {
        setCandidatos(data.candidatos);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidatos();
  }, []);

  const handleAction = async (type: string, candidatoId: string, column: string, value: string, targetEstatus?: string, correo?: string, nombre?: string) => {
    // Optimistic Update
    const nuevosCandidatos = [...candidatos];
    const idx = nuevosCandidatos.findIndex(c => c.id === candidatoId);
    if(idx !== -1) {
       if (type === "ASSIGN_NUCLEO") nuevosCandidatos[idx].nucleoEvaluador = value;
       if (type === "VOTE") {
         if(column === "Voto Pre Lider") nuevosCandidatos[idx].votoPreLider = value;
         if(column === "Voto Pre VP") nuevosCandidatos[idx].votoPreVP = value;
         if(column === "Voto Pre Presi") nuevosCandidatos[idx].votoPrePresi = value;
         if(column === "Voto Final Lider") nuevosCandidatos[idx].votoFinalLider = value;
         if(column === "Voto Final VP") nuevosCandidatos[idx].votoFinalVP = value;
         if(column === "Voto Final Presi") nuevosCandidatos[idx].votoFinalPresi = value;
       }
       if (type === "FINALIZE" && targetEstatus) {
         nuevosCandidatos[idx].estatus = targetEstatus;
       }
       setCandidatos(nuevosCandidatos);
    }

    await fetch("/api/admin/candidatos/action", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ type, candidatoId, column, value, targetEstatus, correo, nombre })
    });
  };

  const getVoteBadge = (vote: string) => {
    if (vote === "Aprobar") return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px] font-bold">✅ Aprobado</span>;
    if (vote === "Rechazar") return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] font-bold">❌ Rechazado</span>;
    return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-[10px] font-bold">⏳ Pendiente</span>;
  };

  // Filtrados de Paso
  const p1Candidatos = candidatos.filter(c => c.estatus === "Registrado");
  const p2Candidatos = candidatos.filter(c => c.estatus === "Registrado" && c.nucleoEvaluador);
  // Paso 3 candidates must be "Entrevistado" OR have an evaluacion dict basically 
  const p3Candidatos = candidatos.filter(c => (c.estatus === "Entrevistado" || c.estatus === "Aprobado para Entrevista") && c.evaluacion);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* TABS CONTROLS */}
      <div className="flex gap-2 p-1 bg-black/40 border border-gray-800 rounded-xl overflow-x-auto">
        {isPresidente && (
          <button onClick={() => setPasoActivo(1)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${pasoActivo === 1 ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}>
            Paso 1: Distribución
          </button>
        )}
        <button onClick={() => setPasoActivo(2)} className={`flex-1 min-w-[120px] py-2 rounded-lg text-xs font-bold transition-all ${pasoActivo === 2 ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}>
          Paso 2: Pre-Entrevista
        </button>
        <button onClick={() => setPasoActivo(3)} className={`flex-1 min-w-[120px] py-2 rounded-lg text-xs font-bold transition-all ${pasoActivo === 3 ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}>
          Paso 3: Pos-Entrevista
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10 animate-pulse">Cargando postulantes...</p>
      ) : (
        <div className="space-y-4">
          
          {/* PASO 1 LOGIC */}
          {pasoActivo === 1 && isPresidente && (
            <div className="grid gap-4">
              {p1Candidatos.map(c => (
                <div key={c.id} className="bg-[#111111] p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.nombre}</h4>
                    <p className="text-xs text-gray-500">{c.correo}</p>
                    <div className="flex gap-1 mt-2">
                       {c.nucleosOriginales.map((n:string) => <span key={n} className="bg-gray-800 text-[10px] px-2 py-0.5 rounded">{n}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {c.cvUrl && <a href={c.cvUrl} target="_blank" rel="noreferrer" className="text-cyan-400 text-xs underline font-bold whitespace-nowrap">Ver CV</a>}
                    <select 
                       className="bg-black border border-gray-700 text-xs text-white p-2 rounded-lg w-full md:w-40"
                       value={c.nucleoEvaluador || ""}
                       onChange={(e) => handleAction("ASSIGN_NUCLEO", c.id, "Núcleo Evaluador", e.target.value)}
                    >
                      <option value="">Asignar a...</option>
                      <option value="Proyectos">Proyectos</option>
                      <option value="Capacitación">Capacitación</option>
                      <option value="Difusión">Difusión</option>
                      <option value="Organización">Organización</option>
                    </select>
                  </div>
                </div>
              ))}
              {p1Candidatos.length === 0 && <p className="text-gray-500 text-center text-sm italic">Todos los registros han sido distribuidos.</p>}
            </div>
          )}

          {/* PASO 2 LOGIC */}
          {pasoActivo === 2 && (
             <div className="grid gap-4">
               {p2Candidatos.map(c => {
                 // Si no es General, solo ve los que tengan su núcleo
                 if (!isGeneral && c.nucleoEvaluador !== user?.cargo) return null;
                 
                 const myPreVoteColumn = isPresidente ? "Voto Pre Presi" : isVice ? "Voto Pre VP" : "Voto Pre Lider";
                 const myCurrentPreVote = isPresidente ? c.votoPrePresi : isVice ? c.votoPreVP : c.votoPreLider;

                 return (
                  <div key={c.id} className="bg-[#111111] p-4 rounded-xl border border-gray-800 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-white text-sm">{c.nombre} <span className="text-gray-500 font-normal">| {c.nucleoEvaluador}</span></h4>
                        <p className="text-xs text-gray-500">{c.correo}</p>
                      </div>
                      {c.cvUrl && <a href={c.cvUrl} target="_blank" rel="noreferrer" className="text-fuchsia-400 text-xs underline font-bold">Revisar CV</a>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                       {/* Control de Mi Voto */}
                       <div className="bg-black/50 p-3 rounded-lg border border-gray-800 flex gap-2">
                         <span className="text-xs text-gray-400 mb-1 block w-full">Mi Decisión ({user?.cargo}):</span>
                         <button onClick={() => handleAction("VOTE", c.id, myPreVoteColumn, "Aprobar")} className={`text-xs px-3 py-1.5 rounded font-bold transition-all flex-1 ${myCurrentPreVote === 'Aprobar' ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>Aprobar</button>
                         <button onClick={() => handleAction("VOTE", c.id, myPreVoteColumn, "Rechazar")} className={`text-xs px-3 py-1.5 rounded font-bold transition-all flex-1 ${myCurrentPreVote === 'Rechazar' ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>Rechazar</button>
                       </div>
                       
                       {/* Panel Presidente */}
                       {isPresidente && (
                         <div className="bg-fuchsia-900/10 p-3 rounded-lg border border-fuchsia-500/30">
                            <div className="flex justify-between mb-2">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[10px] text-gray-400">VP: {getVoteBadge(c.votoPreVP)}</span>
                                 <span className="text-[10px] text-gray-400">Líder: {getVoteBadge(c.votoPreLider)}</span>
                               </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleAction("FINALIZE", c.id, "", "", "Aprobado para Entrevista", c.correo, c.nombre)} className="flex-1 bg-green-500 hover:bg-green-600 text-black text-[10px] font-black uppercase py-2 rounded">Pasa a Entrevista</button>
                              <button onClick={() => handleAction("FINALIZE", c.id, "", "", "No Seleccionado", c.correo, c.nombre)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase py-2 rounded">Declinar</button>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                 )
               })}
             </div>
          )}

          {/* PASO 3 LOGIC */}
          {pasoActivo === 3 && (
             <div className="grid gap-4">
               {p3Candidatos.map(c => {
                 if (!isGeneral && c.evaluacion?.nucleoPrincipal !== user?.cargo) return null;

                 const ev = c.evaluacion;
                 const myFinalVoteColumn = isPresidente ? "Voto Final Presi" : isVice ? "Voto Final VP" : "Voto Final Lider";
                 const myCurrentFinalVote = isPresidente ? c.votoFinalPresi : isVice ? c.votoFinalVP : c.votoFinalLider;
                 const isExpanded = expandedId === c.id;

                 return (
                  <div key={c.id} className={`bg-[#111111] p-4 rounded-xl border transition-all shadow-lg ${isExpanded ? 'border-blue-500/50' : 'border-gray-800'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{c.nombre} <span className="text-blue-400 font-normal">| {ev.nucleoPrincipal}</span></h4>
                      </div>
                      <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full font-bold">
                        {isExpanded ? "Ocultar Detalles" : "Ver Evaluación"}
                      </button>
                    </div>

                    {isExpanded && (
                       <div className="my-4 bg-black/60 p-4 rounded-xl border border-gray-800 text-xs text-gray-300">
                          <p><strong className="text-gray-400 border-b border-gray-700 block pb-1 mb-2 uppercase tracking-wide">Criterios de Entrevista</strong></p>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                             <div className="bg-gray-900 p-2 rounded">
                               <p className="text-cyan-400 font-bold mb-1">E1 Puntuación: {ev.puntuacionE1}/5</p>
                               <p className="italic text-[10px] leading-relaxed">"{ev.comentariosE1}"</p>
                             </div>
                             <div className="bg-gray-900 p-2 rounded">
                               <p className="text-cyan-400 font-bold mb-1">E2 Puntuación: {ev.puntuacionE2}/5</p>
                               <p className="italic text-[10px] leading-relaxed">"{ev.comentariosE2}"</p>
                             </div>
                          </div>
                          {c.cvUrl && <a href={c.cvUrl} target="_blank" rel="noreferrer" className="text-fuchsia-400 underline mt-2 block">Ver Expediente Previo (CV)</a>}
                       </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-t border-gray-800 pt-3 mt-2">
                       <div className="flex gap-2">
                         <span className="text-xs text-gray-400 mb-1 block w-full mt-2">Dictamen de Líder ({user?.cargo}):</span>
                         <button onClick={() => handleAction("VOTE", c.id, myFinalVoteColumn, "Aprobar")} className={`text-xs px-3 py-1.5 rounded font-bold transition-all flex-1 ${myCurrentFinalVote === 'Aprobar' ? 'bg-green-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>Aprobar</button>
                         <button onClick={() => handleAction("VOTE", c.id, myFinalVoteColumn, "Rechazar")} className={`text-xs px-3 py-1.5 rounded font-bold transition-all flex-1 ${myCurrentFinalVote === 'Rechazar' ? 'bg-red-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>Rechazar</button>
                       </div>
                       
                       {isPresidente && (
                         <div className="bg-blue-900/10 p-3 rounded-lg border border-blue-500/30">
                            <div className="flex justify-between mb-2">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[10px] text-gray-400">VP: {getVoteBadge(c.votoFinalVP)}</span>
                                 <span className="text-[10px] text-gray-400">Líder: {getVoteBadge(c.votoFinalLider)}</span>
                               </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleAction("FINALIZE", c.id, "", "", "Aceptado", c.correo, c.nombre)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase py-2 rounded">Ingresar a SIAFI</button>
                              <button onClick={() => handleAction("FINALIZE", c.id, "", "", "Rechazado", c.correo, c.nombre)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase py-2 rounded">Declinación Definitiva</button>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                 )
               })}
             </div>
          )}

        </div>
      )}
    </div>
  );
}
