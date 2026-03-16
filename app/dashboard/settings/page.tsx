"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const [formData, setFormData] = useState({
    nombre: "",
    celular: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Cuando la sesión cargue, rellenamos los datos conocidos
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        nombre: session.user.name || "",
        // El celular no está en la sesión por defecto, lo dejaremos en blanco
        // hasta que la API nos devuelva el dato real si decidimos hacer un fetch previo
      }));
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    // Validación básica de contraseñas
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setMensaje({ tipo: "error", texto: "Las contraseñas nuevas no coinciden." });
        setLoading(false);
        return;
      }
      if (!formData.currentPassword) {
        setMensaje({ tipo: "error", texto: "Debes ingresar tu contraseña actual para hacer cambios de seguridad." });
        setLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setMensaje({ tipo: "error", texto: "La nueva contraseña debe tener al menos 6 caracteres." });
        setLoading(false);
        return;
      }
    }

    try {
      // Aquí llamaremos a nuestra futura API
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          nombre: formData.nombre,
          celular: formData.celular,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje({ tipo: "success", texto: "¡Datos actualizados correctamente!" });
        // Limpiamos los campos de contraseña por seguridad
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      } else {
        setMensaje({ tipo: "error", texto: data.error || "Ocurrió un error al actualizar." });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#00baff] animate-pulse">Cargando configuración...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20">
      
      {/* CINTILLO SUPERIOR VOLVER */}
      <header className="sticky top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center px-5 gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-lg font-bold">Configuración</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* SECCIÓN: DATOS DE PERFIL */}
          <section>
            <h2 className="text-[#00baff] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#0051ff] rounded-full"></span>
              Datos Personales
            </h2>
            
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase mb-1.5">Correo Electrónico (Solo Lectura)</label>
                <input 
                  type="email" 
                  value={session?.user?.email || ""} 
                  disabled 
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-gray-400 cursor-not-allowed" 
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Nombre Completo</label>
                <input 
                  type="text" 
                  name="nombre"
                  value={formData.nombre} 
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" 
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Número de Celular</label>
                <input 
                  type="tel" 
                  name="celular"
                  value={formData.celular} 
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" 
                  placeholder="Ej. 5512345678"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN: SEGURIDAD Y CONTRASEÑA */}
          <section>
            <h2 className="text-[#00baff] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#0051ff] rounded-full"></span>
              Seguridad
            </h2>
            
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5 space-y-4">
              <p className="text-xs text-gray-500 mb-2">Deja estos campos en blanco si no deseas cambiar tu contraseña.</p>
              
              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Contraseña Actual</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={formData.currentPassword} 
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" 
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Nueva Contraseña</label>
                <input 
                  type="password" 
                  name="newPassword"
                  value={formData.newPassword} 
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" 
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" 
                  placeholder="Repite tu nueva contraseña"
                />
              </div>
            </div>
          </section>

          {/* MENSAJES Y BOTÓN DE GUARDAR */}
          {mensaje.texto && (
            <div className={`p-4 rounded-xl text-sm font-bold text-center border ${
              mensaje.tipo === "error" 
                ? "bg-red-950/30 border-red-500/30 text-red-400" 
                : "bg-green-950/30 border-green-500/30 text-green-400"
            }`}>
              {mensaje.texto}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0051ff] hover:bg-[#0041cc] text-white transition-all active:scale-95 shadow-lg shadow-[#0051ff]/20 disabled:opacity-50 mt-2"
          >
            {loading ? "Guardando Cambios..." : "Guardar Cambios"}
          </button>

        </form>
      </main>

    </div>
  );
}