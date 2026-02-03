"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // <--- IMPORTANTE: Importamos el Portal
import { useRouter } from "next/navigation";

export default function GenerateScheduleButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [mounted, setMounted] = useState(false); // Para evitar errores de hidratación

  // Estados para controlar los modales
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Aseguramos que el código del portal solo corra en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. PRIMER PASO: Mostrar modal de confirmación
  const handleInitialClick = () => {
    setShowConfirm(true);
  };

  // 2. SEGUNDO PASO: Ejecutar la lógica si el usuario confirma
  const proceedWithGeneration = async () => {
    setShowConfirm(false); 
    setLoading(true);

    try {
      const res = await fetch("/api/admin/generate-slots", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        setFeedback({ 
            type: 'success', 
            message: `Algoritmo finalizado. ${data.message}` 
        });
      } else {
        setFeedback({ 
            type: 'error', 
            message: data.error || "Ocurrió un error inesperado en el motor." 
        });
      }
    } catch (error) {
      setFeedback({ 
          type: 'error', 
          message: "Error de conexión con el servidor. Intenta de nuevo." 
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. TERCER PASO: Cerrar modal final y recargar si fue éxito
  const handleCloseFeedback = () => {
    if (feedback?.type === 'success') {
        window.location.reload(); 
    } else {
        setFeedback(null); 
    }
  };

  return (
    <>
      {/* --- BOTÓN PRINCIPAL (SE QUEDA AQUÍ) --- */}
      <button
        onClick={handleInitialClick}
        disabled={loading}
        className={`
          w-full mt-4 py-3 rounded-lg font-bold border border-teal-400/30 text-teal-300 bg-teal-500/10
          hover:bg-teal-500/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2
          shadow-[0_0_15px_rgba(45,212,191,0.1)] hover:shadow-[0_0_20px_rgba(45,212,191,0.2)]
          ${loading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-teal-400 rounded-full animate-spin border-t-transparent"></span>
            Procesando Algoritmo...
          </>
        ) : (
          <>🧩 Calcular y Generar Bloques</>
        )}
      </button>

      {/* --- MODALES TELETRANSPORTADOS AL BODY --- */}
      {mounted && showConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-teal-500/30 rounded-xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(45,212,191,0.1)] animate-in zoom-in-95 duration-200 relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-[40px] rounded-full pointer-events-none"></div>

                <div className="flex flex-col items-center text-center">
                    <div className="text-4xl mb-4 bg-teal-900/30 p-3 rounded-full border border-teal-500/20">
                        🧐
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">¿Iniciar Generación?</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Esta acción procesará la disponibilidad de <strong>todos los entrevistadores</strong> y creará los bloques definitivos en la base de datos.
                        <br/><br/>
                        <span className="text-teal-400/80 text-xs">Asegúrate de que todos hayan llenado sus horarios antes de continuar.</span>
                    </p>

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition font-bold text-sm"
                        >
                            CANCELAR
                        </button>
                        <button 
                            onClick={proceedWithGeneration}
                            className="flex-1 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-black font-bold text-sm shadow-[0_0_15px_rgba(45,212,191,0.2)] transition"
                        >
                            CONFIRMAR
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body // <--- Aquí ocurre la magia: lo mandamos al body
      )}

      {mounted && feedback && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`
                max-w-md w-full bg-[#050505] border-2 rounded-xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]
                animate-in zoom-in-95 duration-300 relative overflow-hidden text-center
                ${feedback.type === 'success' ? 'border-teal-500/50 shadow-teal-900/20' : 'border-red-500/50 shadow-red-900/20'}
            `}>
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-2 bg-${feedback.type === 'success' ? 'teal' : 'red'}-500 blur-[20px]`}></div>

                <div className={`
                    mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl
                    ${feedback.type === 'success' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}
                `}>
                    {feedback.type === 'success' ? '🚀' : '⚠️'}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {feedback.type === 'success' ? 'SISTEMA SINCRONIZADO' : 'ERROR DE PROCESO'}
                </h3>
                
                <p className="text-gray-400 mb-8 leading-relaxed text-sm">
                    {feedback.message}
                </p>

                <button 
                    onClick={handleCloseFeedback}
                    className={`
                        w-full py-3 rounded-lg font-bold transition-all active:scale-95 uppercase tracking-wider text-sm
                        ${feedback.type === 'success' 
                           ? 'bg-teal-600 hover:bg-teal-500 text-black shadow-[0_0_20px_rgba(45,212,191,0.4)]' 
                           : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}
                    `}
                >
                    {feedback.type === 'success' ? 'Entendido, Recargar' : 'Cerrar y Reintentar'}
                </button>
            </div>
        </div>,
        document.body // <--- También mandamos este al body
      )}
    </>
  );
}