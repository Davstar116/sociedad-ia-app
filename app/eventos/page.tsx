"use client";

import { useState } from "react";
import Image from "next/image";
import SignaturePad from "../components/SignaturePad";

export default function EventosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  const [mode, setMode] = useState<'menu' | 'checkin' | 'checkout'>('menu');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [mensaje, setMensaje] = useState("");

  // Checkin state
  const [nombre, setNombre] = useState("");
  const [nucleo, setNucleo] = useState("");
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);

  // Checkout state
  const [nombreBusqueda, setNombreBusqueda] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_EVENTOS_PASSWORD || password === "admin123") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Contraseña incorrecta");
    }
  };

  const resetForm = () => {
    setNombre("");
    setNucleo("");
    setFirmaBase64(null);
    setNombreBusqueda("");
    setMode('menu');
    setStatus('idle');
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmaBase64) {
      setMensaje("Debes proporcionar tu firma.");
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMensaje("");

    try {
      const res = await fetch("/api/eventos/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, nucleo, firmaBase64 })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMensaje(`¡Bienvenido ${nombre}! Check-in registrado.`);
        setTimeout(() => resetForm(), 3000);
      } else {
        setStatus('error');
        setMensaje("Error: " + (data.error || "No se pudo registrar."));
      }
    } catch (error) {
      setStatus('error');
      setMensaje("Fallo al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMensaje("");

    try {
      const res = await fetch("/api/eventos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreBusqueda })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMensaje(`¡Adiós ${data.nombreEncontrado}! Check-out registrado.`);
        setTimeout(() => resetForm(), 3000);
      } else {
        setStatus('error');
        setMensaje("Error: " + (data.error || "No se encontró el registro de entrada."));
      }
    } catch (error) {
      setStatus('error');
      setMensaje("Fallo al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-[#111111] p-8 rounded-2xl border border-[#0051ff]/30 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <Image src="/logo.png" width={60} height={60} alt="SIAFI" className="mb-4" />
            <h1 className="text-xl font-bold">Portal de Eventos</h1>
          </div>
          <input 
            type="password" 
            placeholder="Contraseña Administrativa" 
            className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-center focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {loginError && <p className="text-red-500 text-sm text-center mb-4">{loginError}</p>}
          <button type="submit" className="w-full py-3 bg-[#0051ff] rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-[#0041cc]">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4">
      
      {mode === 'menu' && (
        <div className="w-full max-w-2xl bg-[#111111] border border-[#0051ff]/30 rounded-2xl p-8 md:p-12 shadow-2xl shadow-black/50 animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-1">Registro de Asistencia</h1>
              <p className="text-gray-400 text-sm">Selecciona una acción</p>
            </div>
            <Image src="/logo.png" width={50} height={50} alt="SIAFI" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => setMode('checkin')}
              className="flex flex-col items-center p-8 bg-[#0a0a0a] border border-green-500/30 rounded-2xl hover:bg-green-500/10 hover:border-green-500 transition-all group"
            >
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">👋</span>
              <span className="font-bold text-xl text-green-400">Check-In</span>
              <span className="text-xs text-gray-500 mt-2">Registrar Entrada</span>
            </button>
            
            <button 
              onClick={() => setMode('checkout')}
              className="flex flex-col items-center p-8 bg-[#0a0a0a] border border-red-500/30 rounded-2xl hover:bg-red-500/10 hover:border-red-500 transition-all group"
            >
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚪</span>
              <span className="font-bold text-xl text-red-400">Check-Out</span>
              <span className="text-xs text-gray-500 mt-2">Registrar Salida</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'checkin' && (
        <div className="w-full max-w-xl bg-[#111111] border border-green-500/30 rounded-2xl p-6 md:p-10 shadow-2xl shadow-green-900/20 animate-in slide-in-from-right-8">
           <div className="mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                Registro de Entrada
              </h2>
           </div>

           {status === 'success' ? (
             <div className="text-center p-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-400">{mensaje}</h3>
             </div>
           ) : (
             <form onSubmit={handleCheckin} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Nombre Completo</label>
                    <input required placeholder="Escribe tu nombre" 
                      className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-base focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none transition-all placeholder:text-gray-600"
                      value={nombre} onChange={e => setNombre(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Núcleo</label>
                    <select required
                      className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-base focus:border-green-500 focus:ring-1 focus:ring-green-500/30 outline-none transition-all text-gray-300 appearance-none cursor-pointer"
                      value={nucleo} onChange={e => setNucleo(e.target.value)}
                    >
                      <option value="" disabled className="text-gray-600">Selecciona tu núcleo...</option>
                      <option value="Organización">Organización</option>
                      <option value="Difusión">Difusión</option>
                      <option value="Proyectos">Proyectos</option>
                      <option value="Capacitación">Capacitación</option>
                      <option value="Directivo">Directivo / Otro</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Firma Digital</label>
                  <SignaturePad onEnd={setFirmaBase64} />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-800">
                  <button type="button" onClick={resetForm} className="px-6 py-4 rounded-xl font-bold text-sm uppercase border border-gray-800 text-gray-400 hover:text-white transition-all">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-50">
                    {loading ? "Procesando..." : "Registrar Entrada"}
                  </button>
                </div>

                {status === 'error' && <p className="text-red-400 text-center font-bold text-sm mt-4 bg-red-950/30 p-3 rounded-lg">{mensaje}</p>}
             </form>
           )}
        </div>
      )}

      {mode === 'checkout' && (
        <div className="w-full max-w-xl bg-[#111111] border border-red-500/30 rounded-2xl p-6 md:p-10 shadow-2xl shadow-red-900/20 animate-in slide-in-from-left-8">
           <div className="mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                Registro de Salida
              </h2>
           </div>

           {status === 'success' ? (
             <div className="text-center p-8">
                <div className="text-6xl mb-4">👋</div>
                <h3 className="text-2xl font-bold text-red-400">{mensaje}</h3>
             </div>
           ) : (
             <form onSubmit={handleCheckout} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Busca tu Nombre</label>
                  <input required placeholder="Escribe tu nombre exacto" 
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-base focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-all placeholder:text-gray-600"
                    value={nombreBusqueda} onChange={e => setNombreBusqueda(e.target.value)} />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-800">
                  <button type="button" onClick={resetForm} className="px-6 py-4 rounded-xl font-bold text-sm uppercase border border-gray-800 text-gray-400 hover:text-white transition-all">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50">
                    {loading ? "Buscando..." : "Registrar Salida"}
                  </button>
                </div>

                {status === 'error' && <p className="text-red-400 text-center font-bold text-sm mt-4 bg-red-950/30 p-3 rounded-lg">{mensaje}</p>}
             </form>
           )}
        </div>
      )}
    </div>
  );
}
