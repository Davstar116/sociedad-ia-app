"use client";

import { useState } from "react";
import Image from "next/image";

export default function RegistroInteresadosPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [mensaje, setMensaje] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    carrera: "",
    semestre: "1",
  });

  const handleChange = (f: string, v: string) => setFormData(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");
    setStatus('idle');

    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMensaje("¡Registro exitoso! Te contactaremos pronto.");
        setFormData({ nombre: "", email: "", telefono: "", carrera: "", semestre: "1" });
      } else {
        setStatus('error');
        setMensaje("Error: " + (data.error || "No se pudo guardar el registro."));
      }
    } catch (error) {
      setStatus('error');
      setMensaje("Fallo técnico al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="animate-in zoom-in duration-700 flex flex-col items-center max-w-md w-full bg-[#111111] border border-gray-800 p-10 rounded-2xl shadow-2xl">
           <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6 border border-green-500/20">✓</div>
           <h1 className="text-3xl font-black mb-4 text-white tracking-tight">¡Registro Exitoso!</h1>
           <p className="text-sm text-gray-400 leading-relaxed mb-6">Hemos guardado tu información. Mantente atento a nuestras redes para el próximo reclutamiento.</p>
           <button 
             onClick={() => setStatus('idle')}
             className="w-full py-4 bg-[#0051ff] hover:bg-[#0041cc] rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-[#0051ff]/20"
           >
             Registrar otra persona
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4 py-12">
      
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-[80px] h-[80px] relative mb-4 opacity-90">
            <Image src="/logo.png" fill alt="SIAFI" className="object-contain" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Interesados <span className="text-[#00baff]">SIAFI</span></h1>
        <p className="text-gray-400 text-sm">Regístrate para el próximo reclutamiento</p>
      </div>

      <div className="w-full max-w-xl bg-[#111111] border border-[#0051ff]/30 rounded-2xl p-6 md:p-10 shadow-2xl shadow-black/50 transition-all duration-500">
        
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-8">
          
          <input required placeholder="Nombre Completo" 
            className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
            value={formData.nombre} onChange={e => handleChange("nombre", e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input required type="email" placeholder="Correo electrónico" 
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
              value={formData.email} onChange={e => handleChange("email", e.target.value)} />
            
            <input required type="tel" placeholder="Número de Teléfono" 
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
              value={formData.telefono} onChange={e => handleChange("telefono", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <input required placeholder="Carrera (Ej. Ingeniería en Computación)" 
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
                value={formData.carrera} onChange={e => handleChange("carrera", e.target.value)} />
            </div>
            <div className="col-span-1">
              <input required type="number" placeholder="Semestre" min="1" max="12" 
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm text-center focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
                value={formData.semestre} onChange={e => handleChange("semestre", e.target.value)} />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800">
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0051ff] hover:bg-[#0041cc] text-white transition-all active:scale-95 shadow-lg shadow-[#0051ff]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar Registro"}
            </button>
          </div>

          {mensaje && status === 'error' && (
            <div className="mt-4 p-4 rounded-xl text-center text-sm font-bold border bg-red-950/30 border-red-500/30 text-red-400">
                {mensaje}
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
