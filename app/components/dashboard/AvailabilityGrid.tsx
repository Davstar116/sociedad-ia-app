"use client";

import { useState } from "react";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
// Horas de 8 AM a 6 PM (puedes ajustar)
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); 

export default function AvailabilityGrid() {
  // Guardaremos los slots seleccionados como strings "Dia-Hora" (ej: "Lunes-10")
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isAdding, setIsAdding] = useState(true); // Para saber si estamos pintando o borrando

  const toggleSlot = (day: string, hour: number) => {
    const key = `${day}-${hour}`;
    const newSlots = new Set(selectedSlots);
    
    if (newSlots.has(key)) {
      newSlots.delete(key);
    } else {
      newSlots.add(key);
    }
    setSelectedSlots(newSlots);
  };

  // Manejo del "arrastrar" para pintar rápido
  const handleMouseDown = (day: string, hour: number) => {
    setIsDragging(true);
    const key = `${day}-${hour}`;
    // Si ya está seleccionado, modo borrador. Si no, modo pintor.
    setIsAdding(!selectedSlots.has(key));
    toggleSlot(day, hour);
  };

  const handleMouseEnter = (day: string, hour: number) => {
    if (!isDragging) return;
    const key = `${day}-${hour}`;
    const newSlots = new Set(selectedSlots);
    if (isAdding) {
      newSlots.add(key);
    } else {
      newSlots.delete(key);
    }
    setSelectedSlots(newSlots);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full max-w-4xl bg-black/40 border border-[#0051ff]/30 p-6 rounded-2xl backdrop-blur-md" onMouseLeave={handleMouseUp} onMouseUp={handleMouseUp}>
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Disponibilidad Semanal</h2>
          <p className="text-gray-400 text-xs mt-1">Arrastra para seleccionar tus horarios libres.</p>
        </div>
        <div className="text-right">
           <span className="text-[#00baff] font-mono text-xl font-bold">{selectedSlots.size}</span>
           <span className="text-gray-500 text-xs ml-2">HORAS SELECCIONADAS</span>
        </div>
      </div>

      {/* GRID CONTAINER */}
      <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1 select-none">
        
        {/* Header Vacio (esquina) */}
        <div></div>

        {/* Headers Dias */}
        {DAYS.map(day => (
          <div key={day} className="text-center text-xs font-bold text-[#00baff] py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}

        {/* Filas de Horas */}
        {HOURS.map(hour => (
          <>
            {/* Columna Hora */}
            <div key={`h-${hour}`} className="text-right pr-3 text-xs text-gray-500 flex items-center justify-end -mt-2">
              {hour}:00
            </div>

            {/* Celdas Interactivas */}
            {DAYS.map(day => {
              const isSelected = selectedSlots.has(`${day}-${hour}`);
              return (
                <div
                  key={`${day}-${hour}`}
                  onMouseDown={() => handleMouseDown(day, hour)}
                  onMouseEnter={() => handleMouseEnter(day, hour)}
                  className={`
                    h-10 rounded-sm border cursor-pointer transition-all duration-100 relative group
                    ${isSelected 
                      ? 'bg-[#0051ff] border-[#00baff] shadow-[0_0_10px_rgba(0,186,255,0.4)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }
                  `}
                >
                    {/* Tooltip pequeño al hover */}
                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                        {day} {hour}:00
                    </div>
                </div>
              );
            })}
          </>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
          <button className="bg-[#0051ff] hover:bg-[#0041cc] text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-[#0051ff]/20 transition-all active:scale-95">
              Guardar Disponibilidad
          </button>
      </div>

    </div>
  );
}