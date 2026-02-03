"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function ResetScheduleButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Estados del Modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState(""); // Lo que escribe el usuario
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. ABRIR MODAL DE CONFIRMACIÓN
  const handleInitialClick = () => {
    setConfirmInput(""); // Limpiamos el input
    setShowConfirm(true);
  };

  // 2. EJECUTAR RESET (Solo si escribió CONFIRMAR)
  const executeReset = async () => {
    if (confirmInput !== "CONFIRMAR") return;

    setShowConfirm(false);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/reset-slots", { method: "DELETE" });
      
      if (res.ok) {
        setFeedback({ 
            type: 'success', 
            message: "El sistema ha sido reiniciado. Ahora puedes modificar disponibilidades." 
        });
      } else {
        setFeedback({ 
            type: 'error', 
            message: "No se pudo resetear la base de datos." 
        });
      }
    } catch (error) {
      setFeedback({ 
          type: 'error', 
          message: "Error de conexión al intentar resetear." 
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. CERRAR Y RECARGAR
  const handleCloseFeedback = () => {
    if (feedback?.type === 'success') {
        window.location.reload(); // Recarga forzosa para cambiar la vista
    } else {
        setFeedback(null);
    }
  };

  return (
    <>
      {/* --- BOTÓN DESTRUCTIVO PRINCIPAL --- */}
      <button
        onClick={handleInitialClick}
        disabled={loading}
        className={`
            w-full mt-4 py-3 rounded-lg font-bold border border-red-500/30 text-red-400 bg-red-500/10 
            hover:bg-red-500/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2
            shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {loading ? "Reiniciando Sistema..." : "♻️ Resetear Sistema (Volver a Disponibilidad)"}
      </button>

      {/* --- MODAL 1: CONFIRMACIÓN DE SEGURIDAD (ROJO) --- */}
      {mounted && showConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-red-500/50 rounded-xl max-w-md w-full p-8 shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-in zoom-in-95 duration-200 relative overflow-hidden text-center">
                
                {/* Fondo Rojo Sutil */}
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600 box-content blur-[2px]"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="text-5xl mb-4 grayscale hover:grayscale-0 transition-all duration-500">
                    💣
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">ZONA DE PELIGRO</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Estás a punto de <strong>ELIMINAR TODOS</strong> los bloques de entrevista generados. Esta acción es irreversible.
                    <br/><br/>
                    Para confirmar, escribe <span className="text-red-500 font-mono font-bold">CONFIRMAR</span> abajo:
                </p>

                {/* INPUT DE SEGURIDAD */}
                <input 
                    type="text" 
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="Escribe CONFIRMAR"
                    className="w-full bg-black border border-red-900/50 rounded-lg p-3 text-center text-white font-mono mb-6 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-700"
                    autoFocus
                />

                <div className="flex gap-3 w-full">
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition font-bold text-sm"
                    >
                        CANCELAR
                    </button>
                    <button 
                        onClick={executeReset}
                        disabled={confirmInput !== "CONFIRMAR"}
                        className={`
                            flex-1 py-3 rounded-lg font-bold text-sm transition-all
                            ${confirmInput === "CONFIRMAR" 
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        ELIMINAR TODO
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* --- MODAL 2: FEEDBACK --- */}
      {mounted && feedback && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`
                max-w-md w-full bg-[#050505] border-2 rounded-xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]
                animate-in zoom-in-95 duration-300 relative overflow-hidden text-center
                ${feedback.type === 'success' ? 'border-green-500/50 shadow-green-900/20' : 'border-red-500/50 shadow-red-900/20'}
            `}>
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-${feedback.type === 'success' ? 'green' : 'red'}-500 blur-[20px]`}></div>

                <div className={`
                    mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl
                    ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                `}>
                    {feedback.type === 'success' ? '♻️' : '❌'}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {feedback.type === 'success' ? 'SISTEMA REINICIADO' : 'ERROR'}
                </h3>
                
                <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                    {feedback.message}
                </p>

                <button 
                    onClick={handleCloseFeedback}
                    className={`
                        w-full py-3 rounded-lg font-bold transition-all active:scale-95 uppercase tracking-wider text-sm
                        ${feedback.type === 'success' 
                           ? 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                           : 'bg-red-600 hover:bg-red-500 text-white'}
                    `}
                >
                    {feedback.type === 'success' ? 'Recargar Dashboard' : 'Cerrar'}
                </button>
            </div>
        </div>,
        document.body
      )}
    </>
  );
}