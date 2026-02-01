"use client";

import { useState } from "react";

// Configuración de las Semanas de Entrevista
const WEEKS = [
  { 
    id: 0, 
    label: "Semana 1", 
    range: "9 - 15 Feb", 
    days: [
      { name: "LUN", num: 9 },
      { name: "MAR", num: 10 },
      { name: "MIÉ", num: 11 },
      { name: "JUE", num: 12 },
      { name: "VIE", num: 13 },
      { name: "SÁB", num: 14 },
      { name: "DOM", num: 15 },
    ]
  },
  { 
    id: 1, 
    label: "Semana 2", 
    range: "16 - 22 Feb", 
    days: [
      { name: "LUN", num: 16 },
      { name: "MAR", num: 17 },
      { name: "MIÉ", num: 18 },
      { name: "JUE", num: 19 },
      { name: "VIE", num: 20 },
      { name: "SÁB", num: 21 },
      { name: "DOM", num: 22 },
    ]
  }
];

// Horas de 8:00 a 22:00 (El último slot empieza a las 21:45)
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 a 21
const MINUTES = ["00", "15", "30", "45"];

export default function AvailabilityGrid() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isAdding, setIsAdding] = useState(true);

  // Generamos una key única para cada slot: "SemanaID-DiaNum-Hora:Min"
  // Ej: "0-9-10:15" (Semana 0, Día 9, 10:15 AM)
  const getSlotKey = (weekId: number, dayNum: number, hour: number, min: string) => {
    return `${weekId}-${dayNum}-${hour}:${min}`;
  };

  const toggleSlot = (key: string) => {
    const newSlots = new Set(selectedSlots);
    if (newSlots.has(key)) {
      newSlots.delete(key);
    } else {
      newSlots.add(key);
    }
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
    if (isAdding) {
      newSlots.add(key);
    } else {
      newSlots.delete(key);
    }
    setSelectedSlots(newSlots);
  };

  const handleMouseUp = () => setIsDragging(false);

  const activeWeekData = WEEKS[currentWeek];

  return (
    <div 
      className="w-full bg-black/40 border border-[#0051ff]/30 p-6 rounded-2xl backdrop-blur-md flex flex-col h-[80vh]" 
      onMouseLeave={handleMouseUp} 
      onMouseUp={handleMouseUp}
    >
      
      {/* HEADER: Título y Contadores */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Disponibilidad</h2>
          <p className="text-gray-400 text-xs mt-1">Selecciona tus horarios libres.</p>
        </div>
        <div className="text-right">
           <span className="text-green-500 font-mono text-xl font-bold">
             {(selectedSlots.size * 15) / 60} h
           </span>
           <span className="text-gray-500 text-xs ml-2">TOTAL</span>
        </div>
      </div>

      {/* SELECTOR DE SEMANAS (BOTONES) */}
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

      {/* GRID CONTAINER SCROLLABLE */}
      {/* Usamos flex-grow y overflow-auto para que el scroll esté DENTRO de la tarjeta */}
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar relative bg-black/20 rounded-lg border border-white/5">
        
        {/* ENCABEZADOS DE DÍAS (Sticky para que no se pierdan al scrollear) */}
        <div className="grid grid-cols-[50px_repeat(7,1fr)] sticky top-0 z-20 bg-[#0a0a0a] border-b border-white/10 shadow-lg">
          <div className="p-2 border-r border-white/5 bg-black/50"></div> {/* Espacio hora */}
          {activeWeekData.days.map(day => (
            <div key={day.name} className="text-center py-2 border-r border-white/5 last:border-0 bg-black/50 backdrop-blur">
              <div className="text-[10px] font-bold text-[#00baff] tracking-wider">{day.name}</div>
              <div className="text-lg font-bold text-white leading-none">{day.num}</div>
            </div>
          ))}
        </div>

        {/* CUERPO DEL GRID (Horas y Celdas) */}
        <div className="grid grid-cols-[50px_repeat(7,1fr)]">
          {HOURS.map(hour => (
            MINUTES.map(minute => (
              <>
                {/* Columna de Hora (Solo mostramos la etiqueta en el minuto 00 para no saturar) */}
                <div className="border-r border-b border-white/5 text-[10px] text-gray-500 flex items-start justify-end pr-2 pt-1 h-8">
                  {minute === "00" ? `${hour}:00` : ''}
                </div>

                {/* Celdas de los Días */}
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
                        ${isSelected 
                          ? 'bg-green-600 border-green-500/50' // VERDE AL SELECCIONAR
                          : 'hover:bg-white/5'
                        }
                        ${minute === "00" ? 'border-t border-t-white/10' : ''} // Línea un poco más fuerte cada hora
                      `}
                    >
                      {/* Tooltip flotante al pasar el mouse */}
                      <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black border border-white/20 text-white text-[9px] px-1 rounded pointer-events-none whitespace-nowrap z-30">
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
          <button className="bg-[#0051ff] hover:bg-[#0041cc] text-white font-bold py-2 px-8 rounded-lg shadow-lg shadow-[#0051ff]/20 transition-all active:scale-95">
              Confirmar Horarios
          </button>
      </div>

    </div>
  );
}