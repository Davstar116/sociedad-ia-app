"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PostulanteDetallePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const idBloque = params.id as string;
  const emailPostulante = searchParams.get("email");
  
  // ✅ Nuevos parámetros recibidos del Dashboard
  const diaEntrevista = searchParams.get("dia");
  const fechaEntrevista = searchParams.get("fecha");
  const horaEntrevista = searchParams.get("hora");

  const [datosPersonales, setDatosPersonales] = useState<Record<string, string> | null>(null);
  const [respuestas, setRespuestas] = useState<Array<{pregunta: string, respuesta: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDetalles = async () => {
      if (!emailPostulante) return;
      try {
        const res = await fetch(`/api/postulantes/detalle?email=${encodeURIComponent(emailPostulante)}`);
        const data = await res.json();
        if (data.success) {
          setDatosPersonales(data.datosPersonales);
          setRespuestas(data.respuestasContenido);
        }
      } catch (error) {
        console.error("Error cargando el perfil", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetalles();
  }, [emailPostulante]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-[#00baff]">
        <div className="w-10 h-10 border-4 border-[#0051ff] border-t-[#00baff] rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Descargando Expediente...</p>
      </div>
    );
  }

  if (!datosPersonales) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5 text-center">
        <p className="text-red-500 text-5xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-white mb-2">Expediente No Encontrado</h2>
        <p className="text-gray-400 text-sm mb-6">No pudimos localizar los datos de este candidato en la base de registros.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">
          Volver al Panel
        </button>
      </div>
    );
  }

  const nombre = datosPersonales["Nombre Completo"] || "Candidato";
  const carrera = datosPersonales["Carrera"] || datosPersonales["Licenciatura"] || "Sin carrera registrada";
  const semestre = datosPersonales["Semestre"] || "N/A";
  const nucleosString = datosPersonales["Núcleo"] || "No especificado";
  const nucleosArray = nucleosString.split(",").map(n => n.trim()).filter(Boolean);
  const cvLink = datosPersonales["CV"] || datosPersonales["Curriculum"] || Object.values(datosPersonales).find(v => v.startsWith("http") && v.includes("aws"));

  // =========================================================
  // LÓGICA DE AGRUPACIÓN (Aportación -> Expectativas)
  // =========================================================
  const bloqueGeneral: Array<{pregunta: string, respuesta: string}> = [];
  const bloqueModulos: Array<{pregunta: string, respuesta: string}> = [];
  
  let enBloqueGeneral = false;
  const tieneAportacion = respuestas.some(r => r.pregunta.toLowerCase().includes("aportación"));

  respuestas.forEach(item => {
    const pLower = item.pregunta.toLowerCase();
    
    // Inicia el bloque general
    if (pLower.includes("aportación")) enBloqueGeneral = true;
    
    // Si estamos dentro del bloque (o es Expectativas directamente)
    if (enBloqueGeneral || (!tieneAportacion && pLower.includes("expectativas"))) {
      bloqueGeneral.push(item);
      // Cierra el bloque al llegar a expectativas
      if (pLower.includes("expectativas")) enBloqueGeneral = false;
    } else {
      bloqueModulos.push(item);
    }
  });

  // =========================================================
  // RENDERIZADOR INTELIGENTE DE RESPUESTAS (ESTRELLAS Y LINKS)
  // =========================================================
  const renderRespuesta = (texto: string) => {
    // 1. Si es un Link
    if (texto.startsWith("http://") || texto.startsWith("https://")) {
      return (
        <a href={texto} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-gray-800 hover:bg-[#0051ff] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">
          <span>🔗</span> Abrir Enlace
        </a>
      );
    }

    // 2. Procesamiento multilínea para detectar habilidades (Ej. "Python: 4")
    const lineas = texto.split('\n');
    const esListaDeHabilidades = lineas.some(l => l.match(/^(.*?)(?:[:\-])?\s*([1-5])(?:\/5)?\s*$/i));

    if (esListaDeHabilidades) {
      return (
        <div className="flex flex-col gap-2 mt-2">
          {lineas.map((linea, i) => {
            if (!linea.trim()) return null;
            // Busca Texto seguido de un número del 1 al 5 al final
            const match = linea.match(/^(.*?)(?:[:\-])?\s*([1-5])(?:\/5)?\s*$/i);
            
            if (match) {
              const skill = match[1].trim() || "Habilidad";
              const calificacion = parseInt(match[2], 10);
              return (
                <div key={i} className="flex justify-between items-center bg-[#0a0a0a] px-3 py-2.5 rounded-lg border border-gray-800/50">
                  <span className="text-sm font-bold text-gray-200">{skill}</span>
                  <div className="flex gap-1 text-[15px] drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className={j < calificacion ? "text-yellow-400" : "text-gray-800"}>★</span>
                    ))}
                  </div>
                </div>
              );
            }
            // Fallback si una línea no es número
            return <p key={i} className="text-sm text-gray-300 leading-relaxed">{linea}</p>;
          })}
        </div>
      );
    }

    // 3. Texto normal
    return <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{texto}</p>;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24">
      
      {/* HEADER DE NAVEGACIÓN */}
      <header className="sticky top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center px-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Volver
        </button>
        <div className="flex-1 text-center pr-8">
          <h1 className="text-sm font-black tracking-widest uppercase text-gray-300">Expediente</h1>
        </div>
      </header>

      <main className="pt-8 px-5 max-w-2xl mx-auto animate-in slide-in-from-bottom-8 fade-in duration-500">
        
        {/* TARJETA PRINCIPAL DEL CANDIDATO */}
        <div className="bg-[#111111] border border-[#00baff]/30 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,186,255,0.05)] relative overflow-hidden mb-8 mt-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0051ff] to-[#00baff]"></div>
          
          {/* ✅ BADGE DE FECHA Y HORA (ARRIBA A LA IZQUIERDA) */}
          {(diaEntrevista && fechaEntrevista && horaEntrevista) && (
            <div className="absolute top-4 left-6 bg-[#0051ff]/10 border border-[#0051ff]/30 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-[#00baff] font-bold">
                📅 {diaEntrevista} {fechaEntrevista} Abr • ⏰ {horaEntrevista}
              </span>
            </div>
          )}
          
          <div className="flex items-start gap-4 mb-5 mt-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0051ff]/20 to-[#00baff]/20 flex items-center justify-center text-[#00baff] text-2xl border border-[#00baff]/20 shrink-0 shadow-inner">
              👤
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-white leading-tight mb-1">{nombre}</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{carrera}</p>
              
              {/* NÚCLEOS */}
              <div className="flex flex-wrap gap-2">
                {nucleosArray.map((nucleo, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-[#00baff]/10 border border-[#00baff]/30 text-[#00baff] text-[10px] font-black uppercase tracking-wider rounded-md">
                    {nucleo}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Semestre</p>
              <p className="text-xl font-black text-white">{semestre}º</p>
            </div>
            
            {/* BOTÓN CV */}
            {cvLink ? (
              <a 
                href={cvLink} 
                target="_blank" 
                rel="noreferrer"
                className="bg-gradient-to-br from-gray-800 to-[#1a1a1a] hover:from-[#0051ff]/40 hover:to-[#00baff]/40 border border-gray-700 hover:border-[#00baff]/50 rounded-xl p-3 flex flex-col justify-center items-center text-center transition-all group"
              >
                <span className="text-xl mb-1 group-hover:scale-110 transition-transform">📄</span>
                <p className="text-[10px] text-white uppercase tracking-widest font-bold">Ver Currículum</p>
              </a>
            ) : (
              <div className="bg-[#0a0a0a] border border-gray-900 opacity-50 rounded-xl p-3 flex flex-col justify-center items-center text-center cursor-not-allowed">
                <span className="text-xl mb-1 grayscale">📄</span>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Sin CV</p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ BLOQUE UNIFICADO: PERFIL DEL CANDIDATO (Aportación -> Expectativas) */}
        {bloqueGeneral.length > 0 && (
          <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Perfil General</h3>
            </div>
            
            <div className="flex flex-col gap-6">
              {bloqueGeneral.map((item, idx) => (
                <div key={idx}>
                  <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-2">{item.pregunta}</p>
                  {renderRespuesta(item.respuesta)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ MÓDULOS TÉCNICOS Y NÚCLEOS (Con separación clara Q & A) */}
        {bloqueModulos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 px-2">
              <span className="w-2 h-2 rounded-full bg-[#00baff]"></span>
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Evaluación de Núcleos</h3>
            </div>
            
            <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col gap-8">
              {bloqueModulos.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Pregunta */}
                  <div className="flex gap-3 items-start mb-3">
                    <span className="text-[#0051ff] font-black text-lg leading-none mt-0.5">Q.</span>
                    <p className="text-sm text-[#00baff] font-bold leading-relaxed">{item.pregunta}</p>
                  </div>
                  
                  {/* Respuesta con indentación y borde lateral */}
                  <div className="flex gap-3 items-start">
                    <div className="w-[2px] bg-gray-800 ml-2.5 mt-1 self-stretch rounded-full"></div>
                    <div className="flex-1 pb-2">
                      {renderRespuesta(item.respuesta)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTÓN DE EVALUACIÓN */}
        <div className="fixed bottom-0 left-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 p-4 z-40 pb-safe">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2">
              <span>📝</span> Iniciar Evaluación
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}