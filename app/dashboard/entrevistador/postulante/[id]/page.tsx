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

  const [datos, setDatos] = useState<Record<string, string> | null>(null);
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
          setDatos(data.datos);
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

  if (!datos) {
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

  // Extraemos datos principales asumiendo nombres comunes de columnas (ajusta si tus columnas se llaman distinto)
  const nombre = datos["Nombre"] || datos["Name"] || "Candidato";
  const carrera = datos["Carrera"] || datos["Licenciatura"] || "Sin carrera registrada";
  const semestre = datos["Semestre"] || "-";
  const celular = datos["Celular"] || datos["Teléfono"] || "Sin número";
  
  // Filtramos las propiedades que ya mostramos en el header para no repetirlas abajo
  const camposExcluidos = ["Nombre", "Name", "Correo", "Email", "Carrera", "Licenciatura", "Semestre", "Celular", "Teléfono"];
  const respuestasExtra = Object.entries(datos).filter(([key]) => !camposExcluidos.includes(key) && key !== "Estatus" && key !== "ID");

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
        <div className="bg-[#111111] border border-[#00baff]/30 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,186,255,0.05)] relative overflow-hidden mb-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0051ff] to-[#00baff]"></div>
          
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0051ff]/20 to-[#00baff]/20 flex items-center justify-center text-[#00baff] text-2xl border border-[#00baff]/20 shrink-0">
              👤
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-tight mb-1">{nombre}</h2>
              <p className="text-[#00baff] text-xs font-bold uppercase tracking-widest">{carrera}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Correo Electrónico</p>
              <p className="text-xs text-gray-200 truncate" title={emailPostulante}>{emailPostulante}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Teléfono</p>
              <p className="text-xs text-gray-200">{celular}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Semestre</p>
              <p className="text-xs text-gray-200">{semestre}</p>
            </div>
          </div>
        </div>

        {/* RESPUESTAS DEL FORMULARIO DINÁMICAS */}
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 px-2">Respuestas del Registro</h3>
        
        <div className="flex flex-col gap-4 mb-8">
          {respuestasExtra.map(([pregunta, respuesta], idx) => (
            <div key={idx} className="bg-[#111111] border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
              <p className="text-xs text-[#00baff] font-bold uppercase tracking-wider mb-2 leading-relaxed">{pregunta}</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{respuesta}</p>
            </div>
          ))}
        </div>

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