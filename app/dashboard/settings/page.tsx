"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    celular: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Vigilante de seguridad
  useEffect(() => {
    // @ts-ignore
    if (session?.error === "UserDeleted") signOut({ callbackUrl: '/login' });
  }, [session]);

  // Cargar datos frescos desde la API
  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/user/update?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.nombre) {
            setFormData(prev => ({
              ...prev,
              nombre: data.nombre,
              celular: data.celular || "",
            }));
          }
        });
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const confirmPasswordChange = () => {
    setShowConfirmModal(false);
    setShowPasswordFields(true);
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordFields(false);
    setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
  };

  // Función para recuperación de contraseña
  const handleForgotPassword = async () => {
    if(!confirm("¿Deseas restablecer tu contraseña? Se enviará una clave temporal a tu correo.")) return;
    
    setLoading(true);
    setMensaje({ tipo: "", texto: "Generando nueva contraseña..." });
    
    try {
      const res = await fetch("/api/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: "success", texto: "¡Correo enviado! Revisa tu bandeja de entrada." });
      } else {
        setMensaje({ tipo: "error", texto: data.error || "Ocurrió un error." });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    if (showPasswordFields) {
      if (formData.newPassword !== formData.confirmPassword) {
        setMensaje({ tipo: "error", texto: "Las contraseñas nuevas no coinciden." });
        setLoading(false);
        return;
      }
      if (!formData.currentPassword) {
        setMensaje({ tipo: "error", texto: "Debes ingresar tu contraseña actual." });
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
        setShowPasswordFields(false);
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      } else {
        setMensaje({ tipo: "error", texto: data.error || "Ocurrió un error al actualizar." });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#00baff] animate-pulse">Cargando configuración...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20">
      <header className="sticky top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center px-5 gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-lg font-bold">Configuración</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <section>
            <h2 className="text-[#00baff] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#0051ff] rounded-full"></span>
              Datos Personales
            </h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase mb-1.5">Correo Electrónico (Solo Lectura)</label>
                <input type="email" value={session?.user?.email || ""} disabled className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Nombre Completo</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Número de Celular</label>
                <input type="tel" name="celular" value={formData.celular} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" placeholder="Ej. 5512345678" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[#00baff] font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#0051ff] rounded-full"></span>
              Seguridad
            </h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5">
              {!showPasswordFields ? (
                <div className="flex flex-col items-center justify-center py-2">
                  <p className="text-sm text-gray-400 mb-4 text-center">Tu contraseña está encriptada y segura. Si necesitas actualizarla, presiona el botón.</p>
                  <button type="button" onClick={() => setShowConfirmModal(true)} className="px-6 py-2.5 bg-[#1f2937] hover:bg-[#374151] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-gray-700">
                    Cambiar Contraseña
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Contraseña Actual</label>
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Nueva Contraseña</label>
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Confirmar Nueva Contraseña</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600" placeholder="Repite tu nueva contraseña" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={handleForgotPassword} className="text-xs text-[#00baff] hover:underline font-bold tracking-wider transition-colors">
                      ¿Olvidé mi contraseña?
                    </button>
                    <button type="button" onClick={handleCancelPasswordChange} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors">
                      Cancelar Cambio
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {mensaje.texto && (
            <div className={`p-4 rounded-xl text-sm font-bold text-center border ${mensaje.tipo === "error" ? "bg-red-950/30 border-red-500/30 text-red-400" : "bg-green-950/30 border-green-500/30 text-green-400"}`}>
              {mensaje.texto}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0051ff] hover:bg-[#0041cc] text-white transition-all active:scale-95 shadow-lg shadow-[#0051ff]/20 disabled:opacity-50 mt-2">
            {loading ? "Guardando Cambios..." : "Guardar Cambios"}
          </button>
        </form>
      </main>

      {/* MODAL REDISEÑADO */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#0051ff]/10 flex items-center justify-center text-[#00baff] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3.828l7.172-7.172A6 6 0 0115 7h.01z" /></svg>
              </div>
              <h3 className="text-white font-bold text-lg">Modificar Contraseña</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              ¿Estás seguro de que deseas modificar tu contraseña? Por motivos de seguridad se te pedirá confirmar tu contraseña actual.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-300 bg-[#1f2937] hover:bg-[#374151] transition-colors">
                Cancelar
              </button>
              <button onClick={confirmPasswordChange} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-[#0051ff] hover:bg-[#0041cc] transition-colors shadow-lg shadow-[#0051ff]/20">
                Sí, modificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}