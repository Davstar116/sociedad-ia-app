"use client";

import { useState } from "react";

export default function GenerateScheduleButton() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!confirm("⚠️ ¿Confirmar generación? Esto procesará la disponibilidad de todos los socios y creará los bloques de entrevista finales.")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/generate-slots", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        alert(`¡Proceso completado! ${data.message}`);
        window.location.reload(); // Recargamos para ver los cambios
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
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
  );
}