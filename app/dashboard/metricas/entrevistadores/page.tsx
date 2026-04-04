"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function EntrevistadoresMetricasPage() {
  const [metricas, setMetricas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntrevistador, setSelectedEntrevistador] = useState<any>(null);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const res = await fetch("/api/admin/metrics");
        const data = await res.json();
        if (data.success) {
          setMetricas(data.metrics);
          // Auto-select first if available
          if (data.metrics.rankingCarga && data.metrics.rankingCarga.length > 0) {
            setSelectedEntrevistador(data.metrics.rankingCarga[0]);
          }
        }
      } catch(e) {
        console.error("Error cargando métricas:", e);
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchMetricas();
  }, []);

  const arrRankings = metricas?.rankingCarga || [];
  const filteredList = arrRankings.filter((e: any) => e.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render Skeleton while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 uppercase tracking-widest text-sm font-bold animate-pulse">Obteniendo Registros...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white relative flex flex-col animate-in fade-in duration-500">
      
      {/* Header NavBar */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-800 bg-black/80 backdrop-blur-md z-50 flex items-center px-4 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver al Dashboard principal
        </Link>
        <div className="mx-auto flex-1 text-center hidden sm:block">
           <h1 className="text-lg font-bold">Auditoría de Entrevistadores</h1>
        </div>
      </header>

      {/* Main Layout Split */}
      <div className="flex flex-1 pt-16 flex-col md:flex-row h-screen overflow-hidden">
        
        {/* Lado Izquierdo: Lista */}
        <aside className="w-full md:w-1/3 lg:w-1/4 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col bg-[#0a0a0a] h-[40vh] md:h-auto shrink-0 z-10">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-3">Directorio ({arrRankings.length})</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
              />
              <svg className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredList.map((ent: any, idx: number) => {
              const isSelected = selectedEntrevistador?.nombre === ent.nombre;
              return (
                <button 
                  key={idx}
                  onClick={() => setSelectedEntrevistador(ent)}
                  className={`w-full text-left p-4 border-b border-gray-800/50 transition-colors flex items-center justify-between ${isSelected ? 'bg-yellow-500/10 border-l-4 border-l-yellow-500' : 'hover:bg-white/5 border-l-4 border-l-transparent'}`}
                >
                  <span className={`text-sm font-medium ${isSelected ? 'text-yellow-500' : 'text-gray-300'}`}>{ent.nombre}</span>
                  <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-md">{ent.entrevistasAsignadas}</span>
                </button>
              )
            })}
            {filteredList.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-500">No hay coincidencias.</p>
            )}
          </div>
        </aside>

        {/* Lado Derecho: Detalles */}
        <section className="flex-1 overflow-y-auto bg-black p-4 md:p-8 custom-scrollbar">
          {selectedEntrevistador ? (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-8">
                <h2 className="text-3xl font-black mb-2 text-white">{selectedEntrevistador.nombre}</h2>
                <p className="text-sm text-gray-500">Reporte dinámico de reclutamiento y operaciones.</p>
              </div>

              {/* Stats Rápidas */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                 <div className="bg-[#111111] p-5 rounded-2xl border border-gray-800 relative overflow-hidden">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Carga Asignada</p>
                    <p className="text-3xl font-black text-white">{selectedEntrevistador.entrevistasAsignadas}</p>
                 </div>
                 <div className="bg-yellow-500/10 p-5 rounded-2xl border border-yellow-500/20 text-center">
                    <p className="text-3xl font-black text-yellow-500 mb-1">{selectedEntrevistador.cambiosSolicitados}</p>
                    <p className="text-[9px] text-yellow-500/60 uppercase font-bold tracking-widest leading-tight">Suplencias<br/>Solicitadas</p>
                 </div>
                 <div className="bg-green-500/10 p-5 rounded-2xl border border-green-500/20 text-center">
                    <p className="text-3xl font-black text-green-500 mb-1">{selectedEntrevistador.cambiosAceptados}</p>
                    <p className="text-[9px] text-green-500/60 uppercase font-bold tracking-widest leading-tight">Suplencias<br/>Realizadas</p>
                 </div>
              </div>

              {/* Tabla de Historial */}
              <div className="bg-[#0a0a0a] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#111111]">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Bitácora de Entrevistas Reales</h3>
                </div>
                
                {selectedEntrevistador.historial && selectedEntrevistador.historial.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                      <thead className="bg-[#1a1a1a] text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Postulante</th>
                          <th className="px-6 py-3 font-semibold">Fecha</th>
                          <th className="px-6 py-3 font-semibold">Hora</th>
                          <th className="px-6 py-3 font-semibold">Estatus (Bloque)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntrevistador.historial.map((log: any, i: number) => {
                          let fechaDisplay = "Fecha sin definir";
                          try {
                            if(log.fecha) {
                              const dateObj = new Date(log.fecha);
                              fechaDisplay = format(dateObj, "dd MMM yyyy", { locale: es });
                            }
                          } catch(e) {}
                          
                          return (
                            <tr key={i} className="border-b border-gray-800 hover:bg-[#111111] transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-200">{log.postulanteName}</td>
                              <td className="px-6 py-4">{log.dia} {fechaDisplay}</td>
                              <td className="px-6 py-4"><span className="bg-gray-800 text-yellow-500 px-2 py-1 rounded-md font-bold text-xs">{log.hora}</span></td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${log.estatus === 'Completado' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                  {log.estatus}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-12">
                    <p className="text-gray-500 mb-2">Este entrevistador aún no tiene entrevistas reales asignadas.</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center opacity-30">
               <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               <p className="text-sm font-medium tracking-widest uppercase">Selecciona un entrevistador</p>
             </div>
          )}
        </section>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #262626;
          border-radius: 10px;
        }
      `}} />
    </main>
  );
}
