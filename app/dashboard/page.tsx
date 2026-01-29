"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Definimos qué forma tiene un "Slot" (Horario)
interface Slot {
  id: string;
  titulo: string;
  fecha: string;
  link: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Estados para guardar los datos
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }

    // Función para pedir los horarios a tu API
    const fetchSlots = async () => {
      try {
        const res = await fetch("/api/slots");
        const data = await res.json();
        if (data.success) {
          setSlots(data.slots);
        }
      } catch (error) {
        console.error("Error cargando horarios:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchSlots();
    }
  }, [status, router]);

  // Función para formatear la fecha fea (2026-01-31) a algo bonito
  const formatearFecha = (fechaString: string) => {
    if (!fechaString) return "Fecha pendiente";
    const fecha = new Date(fechaString);
    // Ajustamos la zona horaria si es necesario, o usamos UTC
    return new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(fecha);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-blue-400">Cargando disponibilidad...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header del Dashboard */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Hola, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-400 text-sm">Panel de Postulante</p>
        </div>
        <button 
          onClick={() => signOut()} 
          className="text-xs text-red-400 hover:text-red-300 border border-red-900 px-3 py-1 rounded"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Sección de Entrevistas */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          📅 Agenda tu Entrevista
        </h2>

        {slots.length === 0 ? (
          <div className="text-center py-10 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-gray-400">No hay horarios disponibles por el momento.</p>
            <p className="text-xs text-gray-500 mt-2">Intenta más tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot) => (
              <div 
                key={slot.id} 
                className="bg-gray-900 border border-gray-800 p-5 rounded-xl hover:border-blue-500 transition-all cursor-pointer group"
                onClick={() => alert(`Pronto podrás reservar: ${slot.titulo}`)} // Paso temporal
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded font-mono">
                    DISPONIBLE
                  </span>
                  <span className="text-gray-500 text-xs">
                    Virtual (Meet)
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400">
                  {slot.titulo}
                </h3>
                
                <p className="text-gray-400 text-sm mb-4">
                  {formatearFecha(slot.fecha)}
                </p>

                <button className="w-full bg-white text-black font-bold py-2 rounded hover:bg-blue-400 hover:text-white transition-colors">
                  Reservar Lugar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}