"use client";

import { useState, useEffect } from "react";
import NeuralBackground from "../components/NeuralBackground";

// --- COMPONENTE VISUAL: MODAL DE SOPHIA ---
function SophiaModal({ isOpen, onClose, analysis }: { isOpen: boolean; onClose: () => void; analysis: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo Oscuro con Blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Ventana del Mensaje */}
      <div className="relative bg-black border border-sociedad-cyan shadow-[0_0_30px_rgba(0,186,255,0.3)] rounded-2xl p-8 max-w-lg w-full transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
        
        {/* Decoración superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-4 text-sociedad-cyan text-4xl">
          🧠
        </div>

        <h3 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-6 tracking-widest uppercase">
          Dictamen de SophIA
        </h3>

        <div className="bg-white/5 rounded-lg p-6 border-l-4 border-sociedad-cyan mb-8">
          <p className="text-gray-200 text-lg leading-relaxed font-light italic">
            "{analysis}"
          </p>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-sociedad-cyan/20 border border-sociedad-cyan text-sociedad-cyan font-bold rounded hover:bg-sociedad-cyan hover:text-black transition-all uppercase tracking-wider"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL DE ADMIN ---
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState("");

  // Verificar si ya estaba logueado (persistencia simple)
  useEffect(() => {
    const savedAuth = localStorage.getItem("siafi_admin_auth");
    if (savedAuth === "true") {
      setIsAuthorized(true);
      fetchCandidates();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "SIAFI_2026_SECRET") {
      setIsAuthorized(true);
      localStorage.setItem("siafi_admin_auth", "true"); // Guardar sesión
      fetchCandidates();
    } else {
      alert("⚠️ ACCESO DENEGADO: Protocolo de seguridad activado.");
    }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/candidates");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCandidates(data);
      } else {
        console.error("Error data:", data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const runSophIA = async (id: string, name: string) => {
    setAnalyzingId(id);
    try {
      const res = await fetch("/api/admin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: id, candidateName: name }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // AQUÍ ACTIVAMOS EL NUEVO MODAL
        setCurrentAnalysis(data.analysis);
        setShowModal(true);
        fetchCandidates(); // Recargamos la lista para ver el Score nuevo
      } else {
        alert("Error: " + (data.error || "Desconocido"));
      }
    } catch (error) {
      alert("Error de conexión con SophIA");
    } finally {
      setAnalyzingId(null);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative overflow-hidden font-sans">
        <NeuralBackground />
        <form onSubmit={handleLogin} className="z-10 bg-black/40 border border-white/10 p-10 rounded-2xl backdrop-blur-xl text-center shadow-2xl max-w-sm w-full">
          <div className="mb-6">
             <div className="w-16 h-16 bg-sociedad-cyan/20 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
               <span className="text-2xl">🔒</span>
             </div>
             <h1 className="text-xl font-bold text-white tracking-[0.2em]">SIAFI ADMIN</h1>
          </div>
          
          <input 
            type="password" 
            placeholder="Clave de Acceso"
            className="bg-black/50 border border-gray-700 rounded px-4 py-3 text-center w-full mb-6 focus:border-sociedad-cyan outline-none transition-colors text-sociedad-cyan placeholder-gray-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-sociedad-blue hover:bg-sociedad-cyan text-white py-3 rounded font-bold transition-all shadow-[0_0_15px_rgba(0,120,255,0.3)]">
            DESBLOQUEAR SISTEMA
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans relative">
      <NeuralBackground />
      
      {/* EL MODAL FLOTANTE */}
      <SophiaModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        analysis={currentAnalysis} 
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sociedad-cyan via-blue-500 to-purple-600">
              Centro de Mando
            </h1>
            <p className="text-gray-400 text-sm mt-1">Gestión de Talento & Inteligencia Artificial</p>
          </div>
          <button 
            onClick={fetchCandidates} 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full border border-white/10 transition-all text-sm uppercase tracking-wider"
          >
            <span className={`${loading ? 'animate-spin' : ''}`}>↻</span> Actualizar Base de Datos
          </button>
        </header>

        {loading && candidates.length === 0 ? (
          <div className="text-center py-20 animate-pulse text-sociedad-cyan">
            Descargando datos del servidor neural...
          </div>
        ) : (
          <div className="grid gap-4">
            {candidates.map((c) => {
               // Extraer datos con seguridad por si faltan campos
               const nombre = c.properties["Nombre Completo"]?.title[0]?.plain_text || "Desconocido";
               const carrera = c.properties["Carrera"]?.rich_text[0]?.plain_text || "N/A";
               const score = c.properties["Score_IA"]?.number;
               const cvUrl = c.properties["CV"]?.url;

               return (
                <div key={c.id} className="group bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center hover:border-sociedad-cyan/50 transition-all hover:shadow-[0_0_20px_rgba(0,186,255,0.1)]">
                  
                  {/* Info Candidato */}
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-bold text-white group-hover:text-sociedad-cyan transition-colors">
                      {nombre}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sociedad-blue"></span>
                      {carrera}
                    </p>
                  </div>

                  {/* Acciones y Score */}
                  <div className="flex flex-wrap items-center gap-4">
                    
                    {/* Visualizador de Score */}
                    {score !== undefined && score !== null && (
                      <div className="text-right px-4 border-r border-white/10">
                        <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Score IA</span>
                        <span className={`text-2xl font-bold ${
                          score >= 80 ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" : 
                          score >= 50 ? "text-yellow-400" : 
                          "text-red-500"
                        }`}>
                          {score}/100
                        </span>
                      </div>
                    )}
                    
                    {cvUrl ? (
                      <a 
                        href={cvUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 text-xs font-bold border border-white/20 rounded hover:bg-white/10 text-gray-300 transition-colors"
                      >
                        VER PDF
                      </a>
                    ) : (
                      <span className="text-xs text-gray-600 px-2">Sin CV</span>
                    )}
                    
                    <button 
                      onClick={() => runSophIA(c.id, nombre)}
                      disabled={analyzingId === c.id}
                      className={`
                        relative px-6 py-2 rounded font-bold text-sm transition-all flex items-center gap-2
                        ${analyzingId === c.id 
                          ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                          : "bg-gradient-to-r from-purple-700 to-blue-600 hover:from-purple-600 hover:to-blue-500 text-white shadow-lg hover:shadow-purple-500/30"
                        }
                      `}
                    >
                      {analyzingId === c.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Pensando...
                        </>
                      ) : (
                        <>🔮 Invocar a SophIA</>
                      )}
                    </button>
                  </div>
                </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}