"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Estados para el Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ NUEVO ESTADO: Rastrea si hubo cambios
  const [isDirty, setIsDirty] = useState(false);

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

  // Carga inmediata desde la sesión mágica
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        nombre: session.user.name || "",
        // @ts-ignore
        celular: session.user.celular || "",
      }));
      // @ts-ignore
      if (session.user.avatar) setAvatarPreview(session.user.avatar);
    }
  }, [session]);

  // ✅ NUEVO: Vigilante del evento beforeunload (Cerrar pestaña/Recargar)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        // Estándar moderno para mostrar la alerta del navegador
        e.preventDefault();
        e.returnValue = ''; // Requerido para Chrome/Firefox
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Limpieza al desmontar el componente
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // ✅ Marcamos que el formulario está "sucio" (tiene cambios)
    setIsDirty(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      // ✅ Marcamos cambios al subir imagen
      setIsDirty(true);
    }
  };

  // ✅ Modificamos el botón "Volver" para verificar cambios
  const handleBack = () => {
    if (isDirty) {
      if (window.confirm("Tienes cambios sin guardar. ¿Estás seguro de que deseas salir? Se perderán las modificaciones.")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  const confirmPasswordChange = () => {
    setShowConfirmModal(false);
    setShowPasswordFields(true);
    // ✅ Marcamos cambios al abrir sección de password
    setIsDirty(true); 
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordFields(false);
    setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    // No reseteamos isDirty aquí, ya que podría haber cambios en nombre/celular
  };

  const confirmForgotPassword = async () => {
    setShowForgotModal(false);
    setLoading(true);
    setMensaje({ tipo: "", texto: "Generando nueva contraseña..." });
    
    try {
      const res = await fetch("/api/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email })
      });
      const data = await res.json();
      if (res.ok) setMensaje({ tipo: "success", texto: "¡Correo enviado! Revisa tu bandeja de entrada." });
      else setMensaje({ tipo: "error", texto: data.error || "Ocurrió un error." });
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "Subiendo datos y archivos..." });

    if (showPasswordFields) {
      if (formData.newPassword !== formData.confirmPassword) {
        setMensaje({ tipo: "error", texto: "Las contraseñas nuevas no coinciden." });
        setLoading(false); return;
      }
      if (!formData.currentPassword) {
        setMensaje({ tipo: "error", texto: "Debes ingresar tu contraseña actual." });
        setLoading(false); return;
      }
      if (formData.newPassword.length < 6) {
        setMensaje({ tipo: "error", texto: "La nueva contraseña debe tener al menos 6 caracteres." });
        setLoading(false); return;
      }
    }

    try {
      const submitData = new FormData();
      submitData.append("email", session?.user?.email || "");
      submitData.append("nombre", formData.nombre);
      submitData.append("celular", formData.celular);
      submitData.append("currentPassword", formData.currentPassword);
      submitData.append("newPassword", formData.newPassword);
      if (avatarFile) submitData.append("avatar", avatarFile);

      const res = await fetch("/api/user/update", {
        method: "POST",
        body: submitData
      });

      // ✅ NUEVO CÓDIGO DETECTIVE: Si Vercel devuelve un error HTML (como el de "Archivo muy pesado")
      if (!res.ok && !res.headers.get("content-type")?.includes("application/json")) {
        const textError = await res.text();
        console.error("🚨 Error crudo del servidor:", textError);
        throw new Error(`Error de Vercel (${res.status}): Revisa la consola (F12)`);
      }

      const data = await res.json();

      if (res.ok) {
        setMensaje({ tipo: "success", texto: "¡Datos actualizados correctamente!" });
        setShowPasswordFields(false);
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
        setIsDirty(false); 
        if (data.newAvatar) setAvatarPreview(data.newAvatar);
        
        await session?.update({
           ...session.user,
           name: formData.nombre,
           // @ts-ignore
           celular: formData.celular,
           avatar: data.newAvatar || avatarPreview
        });
      } else {
        setMensaje({ tipo: "error", texto: data.error || "Ocurrió un error al actualizar." });
      }
    } catch (error: any) {
      console.error("🔥 Error capturado en el catch:", error);
      // ✅ AHORA MOSTRARÁ EL MENSAJE REAL EN LA PANTALLA
      setMensaje({ tipo: "error", texto: error.message || "Error desconocido." });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#00baff] animate-pulse">Cargando configuración...</div>;
  }

  const iniciales = formData.nombre ? formData.nombre.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "US";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-20">
      <header className="sticky top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center px-5 gap-4">
        {/* ✅ BOTÓN VOLVER USANDO handleBack */}
        <button onClick={handleBack} className="text-gray-400 hover:text-white transition-colors">
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
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5 space-y-5">
              
              <div className="flex flex-col items-center justify-center pb-2">
                <div 
                  className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#0051ff] to-[#00baff] p-[3px] shadow-[0_0_20px_rgba(0,186,255,0.3)] cursor-pointer hover:scale-105 transition-transform group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-full h-full rounded-full bg-[#111111] overflow-hidden flex items-center justify-center relative">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white tracking-widest">{iniciales}</span>
                    )}
                    
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       <span className="text-[9px] font-bold uppercase tracking-wider text-white">Cambiar</span>
                    </div>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden" 
                />
                <p className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-bold">Foto de Perfil</p>
              </div>

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
                    <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs text-[#00baff] hover:underline font-bold tracking-wider transition-colors">
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
            {loading ? "Subiendo..." : "Guardar Cambios"}
          </button>
        </form>
      </main>

      {/* MODAL 1: MODIFICAR CONTRASEÑA */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 max-sm w-full shadow-2xl scale-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#0051ff]/10 flex items-center justify-center text-[#00baff] shrink-0 font-black text-xl pt-1">
                ***
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

      {/* MODAL 2: OLVIDÓ CONTRASEÑA */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-white font-bold text-lg">Recuperar Acceso</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              ¿Deseas restablecer tu contraseña? Se generará una clave temporal segura y se te enviará a tu correo electrónico.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowForgotModal(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-300 bg-[#1f2937] hover:bg-[#374151] transition-colors">
                Cancelar
              </button>
              <button onClick={confirmForgotPassword} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}