"use client";

import { useState } from "react";

export default function GenerateScheduleButton() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!confirm("⚠️ ¿Estás seguro? Esto generará todos los bloques de entrevista basados en la disponibilidad actual de los socios. Esto puede tardar unos segundos.")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/generate-slots", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
        alert(`¡Éxito! ${data.message}`);
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
        w-full mt-4 py-3 rounded-lg font-bold border border-yellow-500/30 text-yellow-400 bg-yellow-500/10
        hover:bg-yellow-500/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2
        ${loading ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      {loading ? (
        <>
          <span className="w-3 h-3 border-2 border-yellow-400 rounded-full animate-spin border-t-transparent"></span>
          Procesando...
        </>
      ) : (
        <>⚙️ Generar Bloques de Entrevista</>
      )}
    </button>
  );
}