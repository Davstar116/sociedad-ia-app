"use client";

import { useState, useEffect } from "react";

// --- CONFIGURACIÓN DE SEMANAS Y HORAS ---
const WEEKS = [
  { 
    id: 0, 
    label: "Semana 1", 
    range: "9 - 15 Feb", 
    days: [
      { name: "LUN", num: 9 }, { name: "MAR", num: 10 }, { name: "MIÉ", num: 11 },
      { name: "JUE", num: 12 }, { name: "VIE", num: 13 }, { name: "SÁB", num: 14 }, { name: "DOM", num: 15 },
    ]
  },
  { 
    id: 1, 
    label: "Semana 2", 
    range: "16 - 22 Feb", 
    days: [
      { name: "LUN", num: 16 }, { name: "MAR", num: 17 }, { name: "MIÉ", num: 18 },
      { name: "JUE", num: 19 }, { name: "VIE", num: 20 }, { name: "SÁB", num: 21 }, { name: "DOM", num: 22 },
    ]
  }
];

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); 
const MINUTES = ["00", "15", "30", "45"];

interface Props {
  userEmail: string;
  userName: string;
}

export default function AvailabilityGrid({ userEmail, userName }: Props) {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isAdding, setIsAdding] = useState(true);
  
  // Estados de Base de Datos
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);

  // --- NUEVO: ESTADO PARA EL MODAL PERSONALIZADO ---
  const [feedbackModal, setFeedbackModal] = useState<{ 
    show: boolean; 
    type: 'success' | 'error'; 
    title: string; 
    message: string 
  } | null>(null);

  // --- 1. CARGAR DATOS ---
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/availability?email=${userEmail}`);
        const data = await res.json();
        
        if (data.exists && data.slots) {
          setSelectedSlots(new Set(data.slots));
          setHasSavedData(true);
        }
      } catch (error) {
        console.error("Error cargando horarios:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [userEmail]);

  // --- LOGICA DE SELECCIÓN ---
  const getSlotKey = (weekId: number, dayNum: number, hour: number, min: string) => `${weekId}-${dayNum}-${hour}:${min}`;

  const toggleSlot = (key: string) => {
    const newSlots = new Set(selectedSlots);
    if (newSlots.has(key)) newSlots.delete(key);
    else newSlots.add(key);
    setSelectedSlots(newSlots);
  };

  const handleMouseDown = (key: string) => {
    setIsDragging(true);
    setIsAdding(!selectedSlots.has(key));
    toggleSlot(key);
  };

  const handleMouseEnter = (key: string) => {
    if (!isDragging) return;
    const newSlots = new Set(selectedSlots);
    if (isAdding) newSlots.add(key); else newSlots.delete(key);
    setSelectedSlots(newSlots);
  };

  const handleMouseUp = () => setIsDragging(false);

  // --- 2. GUARDAR DATOS (CON MODAL NUEVO) ---
  const handleSave = async () => {
    setIsSaving(true);
    const totalHours = (selectedSlots.size * 15) / 60;
    
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          totalHours: totalHours,
          slots: Array.from(selectedSlots)
        })
      });

      if (res.ok) {
        const result = await res.json();
        setHasSavedData(true);
        
        // ✨ AQUI LANZAMOS EL MODAL DE ÉXITO
        setFeedbackModal({
          show: true,
          type: 'success',
          title: result.type === 'created' ? 'REGISTRO EXITOSO' : 'ACTUALIZACIÓN COMPLETADA',
          message: result.type === 'created' 
            ? 'Tus horarios han sido confirmados correctamente en el sistema.' 
            : 'Tus cambios de horario se han guardado exitosamente.'
        });

      } else {
        throw new Error("Error en la respuesta");
      }
    } catch (error) {
      // ⚠️ AQUI LANZAMOS EL MODAL DE ERROR
      setFeedbackModal({
        show: true,
        type: 'error',
        title: 'ERROR DE CONEXIÓN',
        message: 'No pudimos guardar tus horarios. Por favor revisa tu conexión e inténtalo de nuevo.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeWeekData = WEEKS[currentWeek];
  const totalHours = (selectedSlots.size * 15) / 60;

  if (isLoading) return <div className="text-center p-10 text-[#00baff] animate-pulse">Cargando sistema...</div>;

  return (
    <>
      {/* --- COMPONENTE PRINCIPAL --- */}
      <div 
        className="w-full bg-black/40 border border-[#0051ff]/30 p-6 rounded-2xl backdrop-blur-md flex flex-col h-[80vh]" 
        onMouseLeave={handleMouseUp} 
        onMouseUp={handleMouseUp}
      >
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Disponibilidad</h2>
            <p className="text-gray-400 text-xs mt-1">Selecciona tus horarios libres.</p>
          </div>
          <div className="text-right">
            <span className={`font-mono text-xl font-bold ${totalHours > 0 ? 'text-green-500' : 'text-gray-500'}`}>
              {totalHours} h
            </span>
            <span className="text-gray-500 text-xs ml-2">TOTAL</span>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          {WEEKS.map((week) => (
            <button
              key={week.id}
              onClick={() => setCurrentWeek(week.id)}
              className={`
                flex-1 py-3 rounded-lg border text-sm font-bold transition-all relative overflow-hidden group
                ${currentWeek === week.id 
                  ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              <span className="block text-xs uppercase tracking-widest opacity-70">{week.label}</span>
              <span className="text-lg">{week.range}</span>
              {currentWeek === week.id && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar relative bg-black/20 rounded-lg border border-white/5">
          <div className="grid grid-cols-[50px_repeat(7,1fr)] sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/10 shadow-lg">
            <div className="p-2 border-r border-white/5 bg-black/50"></div>
            {activeWeekData.days.map(day => (
              <div key={day.name} className="text-center py-2 border-r border-white/5 last:border-0 bg-black/50 backdrop-blur">
                <div className="text-[10px] font-bold text-[#00baff] tracking-wider">{day.name}</div>
                <div className="text-lg font-bold text-white leading-none">{day.num}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[50px_repeat(7,1fr)]">
            {HOURS.map(hour => (
              MINUTES.map(minute => (
                <>
                  <div className="border-r border-b border-white/5 text-[10px] text-gray-500 flex items-start justify-end pr-2 pt-1 h-8">
                    {minute === "00" ? `${hour}:00` : ''}
                  </div>
                  {activeWeekData.days.map(day => {
                    const key = getSlotKey(currentWeek, day.num, hour, minute);
                    const isSelected = selectedSlots.has(key);
                    return (
                      <div
                        key={key}
                        onMouseDown={() => handleMouseDown(key)}
                        onMouseEnter={() => handleMouseEnter(key)}
                        className={`
                          h-8 border-r border-b border-white/5 cursor-pointer transition-colors duration-75 relative group
                          ${isSelected ? 'bg-green-600 border-green-500/50' : 'hover:bg-white/5'}
                          ${minute === "00" ? 'border-t border-t-white/10' : ''}
                        `}
                      >
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black border border-white/20 text-white text-[9px] px-1 rounded pointer-events-none whitespace-nowrap z-30">
                          {day.name} {day.num} - {hour}:{minute}
                        </div>
                      </div>
                    );
                  })}
                </>
              ))
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end pt-4 border-t border-white/10">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`
                  font-bold py-2 px-8 rounded-lg shadow-lg transition-all active:scale-95
                  ${hasSavedData 
                      ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20' 
                      : 'bg-[#0051ff] hover:bg-[#0041cc] text-white shadow-[#0051ff]/20'
                  }
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
                {isSaving ? "Guardando..." : (hasSavedData ? "Actualizar Horarios" : "Confirmar Horarios")}
            </button>
        </div>
      </div>

      {/* --- MODAL EMERGENTE (POPUP) --- */}
      {feedbackModal?.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`
              max-w-md w-full bg-[#050505] border-2 rounded-xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]
              animate-in zoom-in-95 duration-300 relative overflow-hidden
              ${feedbackModal.type === 'success' ? 'border-green-500/50 shadow-green-900/20' : 'border-red-500/50 shadow-red-900/20'}
          `}>
             {/* Brillo de fondo */}
             <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-${feedbackModal.type === 'success' ? 'green' : 'red'}-500 blur-[20px]`}></div>

             <div className="text-center">
                {/* ÍCONO */}
                <div className={`
                    mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl
                    ${feedbackModal.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
                `}>
                    {feedbackModal.type === 'success' ? '✔' : '⚠'}
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {feedbackModal.title}
                </h3>
                
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {feedbackModal.message}
                </p>

                <button 
                    onClick={() => setFeedbackModal(null)}
                    className={`
                        w-full py-3 rounded-lg font-bold transition-all active:scale-95
                        ${feedbackModal.type === 'success' 
                           ? 'bg-green-600 hover:bg-green-500 text-black' 
                           : 'bg-red-600 hover:bg-red-500 text-white'}
                    `}
                >
                    ENTENDIDO
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}