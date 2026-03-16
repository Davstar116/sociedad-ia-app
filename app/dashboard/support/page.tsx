"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [mensajeApi, setMensajeApi] = useState({ tipo: "", texto: "" });
  
  const [formData, setFormData] = useState({
    asunto: "",
    mensaje: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asunto.trim() || !formData.mensaje.trim()) {
      setMensajeApi({ tipo: "error", texto: "Por favor completa todos los campos." });
      return;
    }

    setLoading(true);
    setMensajeApi({ tipo: "", texto: "Enviando reporte..." });

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asunto: formData.asunto,
          mensaje: formData.mensaje,
          nombre: session?.user?.name,
          correo: session?.user?.email,
          // @ts-ignore
          celular: session?.user?.celular,
          // @ts-ignore
          rol: session?.user?.role
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMensajeApi({ tipo: "success", texto: "¡Tu reporte ha sido enviado al equipo técnico exitosamente!" });
        setFormData({ asunto: "", mensaje: "" }); // Limpiar formulario
      } else {
        setMensajeApi({ tipo: "error", texto: data.error || "Ocurrió un error al enviar el reporte." });
      }
    } catch (error) {
      setMensajeApi({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#00baff] animate-pulse">Cargando buzón...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20">
      
      {/* CINTILLO SUPERIOR VOLVER */}
      <header className="sticky top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center px-5 gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-lg font-bold">Soporte Técnico</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-8">
        
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto bg-[#0051ff]/10 rounded-full flex items-center justify-center mb-4 border border-[#0051ff]/20">
            <svg className="w-8 h-8 text-[#00baff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-black mb-2">Buzón de Ayuda</h2>
          <p className="text-sm text-gray-400">¿Encontraste un error o tienes problemas con tu cuenta? Escríbenos y el equipo de SophIA lo resolverá pronto.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5 space-y-4">
            
            {/* Campos de Solo Lectura (Transparencia para el usuario) */}
            <div className="opacity-60">
              <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Enviando reporte como:</label>
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                    {/* @ts-ignore */}
                    {session?.user?.avatar ? <img src={session.user.avatar} alt="Avatar" className="w-full h-full object-cover"/> : <span className="text-xs">{session?.user?.name?.[0]}</span>}
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                 </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Asunto del Problema *</label>
              <input 
                type="text" 
                name="asunto"
                value={formData.asunto} 
                onChange={handleChange}
                maxLength={100}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" 
                placeholder="Ej. Problema al ver mis fechas..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Detalles del Reporte *</label>
              <textarea 
                name="mensaje"
                value={formData.mensaje} 
                onChange={handleChange}
                rows={5}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600 resize-none" 
                placeholder="Describe con el mayor detalle posible el error o problema que estás experimentando..."
              />
            </div>
          </div>

          {mensajeApi.texto && (
            <div className={`p-4 rounded-xl text-sm font-bold text-center border ${
              mensajeApi.tipo === "error" 
                ? "bg-red-950/30 border-red-500/30 text-red-400" 
                : "bg-green-950/30 border-green-500/30 text-green-400"
            }`}>
              {mensajeApi.texto}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0051ff] hover:bg-[#0041cc] text-white transition-all active:scale-95 shadow-lg shadow-[#0051ff]/20 disabled:opacity-50 mt-2"
          >
            {loading ? "Enviando..." : "Enviar Reporte Seguro"}
          </button>

        </form>
      </main>

    </div>
  );
}