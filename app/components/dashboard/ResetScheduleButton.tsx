"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetScheduleButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    const confirmText = prompt("⚠️ PELIGRO: Esto ELIMINARÁ todos los bloques de entrevista generados y regresará el sistema a la fase de Disponibilidad.\n\nEscribe 'CONFIRMAR' para proceder.");
    
    if (confirmText !== "CONFIRMAR") return;

    setLoading(true);
    try {
      await fetch("/api/admin/reset-slots", { method: "DELETE" });
      alert("Sistema reiniciado correctamente.");
      router.refresh(); // Recarga la página para cambiar la vista
    } catch (error) {
      alert("Error al resetear.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="w-full mt-4 py-3 rounded-lg font-bold border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all uppercase tracking-widest text-xs"
    >
      {loading ? "Reseteando..." : "♻️ Resetear Sistema (Volver a Disponibilidad)"}
    </button>
  );
}