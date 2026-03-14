import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route"; 
import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // 1. LÓGICA DE SESIÓN: Si ya está logueado, redirigir al dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Estados para el formulario de credenciales
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false, // Manejamos la redirección manualmente
      });

      if (res?.error) {
        setError("Credenciales incorrectas. Intenta de nuevo.");
      } else {
        window.location.href = "/dashboard"; // Redirección forzosa al dashboard
      }
    } catch (err) {
      setError("Ocurrió un error inesperado. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO PRINCIPAL ---
  return (
    // CONTENEDOR PRINCIPAL: Modo Oscuro Sólido
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      {/* 2. CONTENEDOR CENTRAL: Tarjeta Minimalista */}
      <div className="z-10 w-full max-w-md p-8 bg-[#111111] border border-gray-900 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-6">
        
        {/* LOGO Y TÍTULO: Profesional y Nítido */}
        <div className="flex flex-col items-center gap-3 mb-4">
           <Image 
             src="/logo.png" 
             width={100} 
             height={100} 
             alt="Logo SIAFI" 
             className="drop-shadow-lg"
           />
           <h1 className="text-3xl font-black text-white tracking-tight">Bienvenido a SIAFI</h1>
           <p className="text-gray-400 text-sm">Tu plataforma de reclutamiento profesional</p>
        </div>

        {/* 3. OPCIONES DE LOGIN */}
        
        {/* LOGIN CON GOOGLE: Sólido Blanco, rounded-xl */}
        <button
          onClick={() => signIn("google")}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 border border-gray-800 bg-white hover:bg-gray-100 transition-all shadow-md group active:scale-95"
        >
          <Image 
             src="/google.svg" // Asegúrate de tener este archivo
             width={24} 
             height={24} 
             alt="Logo Google" 
           />
          <span className="text-black font-semibold text-sm">Continuar con Google</span>
        </button>

        {/* SEPARADOR: Minimalista */}
        <div className="w-full flex items-center gap-3">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="text-xs text-gray-600 uppercase font-mono">o inicia sesión con correo</span>
            <div className="flex-grow border-t border-gray-800"></div>
        </div>

        {/* FEEDBACK DE ERROR: Estilo Minimalista Rojo */}
        {error && (
            <div className="w-full p-4 bg-red-950/50 border border-red-500/30 rounded-lg text-sm text-red-400 text-center animate-shake">
                {error}
            </div>
        )}

        {/* 4. FORMULARIO DE CREDENCIALES: Inputs Minimalistas */}
        <form onSubmit={handleCredentialsLogin} className="w-full flex flex-col gap-5">
            <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@ejemplo.com"
                required
                className="w-full bg-[#0d0d0d] border border-gray-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#00baff] focus:ring-1 focus:ring-[#00baff]/30 transition-all placeholder:text-gray-700"
            />
            <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña secreta"
                required
                className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#00baff] focus:ring-1 focus:ring-[#00baff]/30 transition-all placeholder:text-gray-700"
            />
            
            {/* BOTÓN INICIAR SESIÓN: Sólido Azul Profundo, rounded-xl */}
            <button 
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 text-sm uppercase tracking-wider
                ${loading 
                   ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                   : 'bg-[#0051ff] hover:bg-[#0041cc] text-white shadow-lg shadow-[#0051ff]/20'
                }`}
            >
                {loading ? (
                    <>
                    <span className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent"></span>
                    PROCESANDO...
                    </>
                ) : (
                    "INICIAR SESIÓN"
                )}
            </button>
        </form>
        
        {/* 5. ENLACE A POSTULACIÓN: Sección Separada Minimalista */}
        <div className="w-full border-t border-gray-800 pt-6 mt-2 flex flex-col items-center gap-4">
            <p className="text-gray-500 text-sm text-center max-w-xs leading-relaxed">
               ¿Eres nuevo? Postúlate para unirte a SIAFI y comienza tu viaje profesional.
            </p>
            
            {/* BOTÓN POSTULARSE: Sólido Azul Profundo, rounded-xl */}
            <a 
                href="/reclutamiento" 
                className="w-full py-3.5 rounded-xl bg-[#0051ff] hover:bg-[#0041cc] text-white font-bold text-sm text-center transition-all shadow-lg shadow-[#0051ff]/10 active:scale-95 uppercase tracking-wider"
            >
                📝 POSTULARSE PARA UNIRSE
            </a>
        </div>

      </div>

    </div>
  );
}