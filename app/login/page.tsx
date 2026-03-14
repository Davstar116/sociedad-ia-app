"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("¡Cuenta creada! Por favor inicia sesión.");
    }
    if (searchParams.get("error") === "CredentialsSignin") {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    }
  }, [searchParams]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (res?.error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="w-full max-w-md bg-[#111111] border border-[#0051ff]/30 rounded-2xl p-8 shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
      
      {/* Header Limpio */}
      <div className="text-center mb-8 w-full flex flex-col items-center">
        <Image 
          src="/logo.png" 
          width={80} 
          height={80} 
          alt="Logo SIAFI" 
          className="mb-4"
        />
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">
          Bienvenid@ a <span className="text-[#00baff]">SophIA</span>
        </h1>
        <p className="text-gray-400 text-sm">Accede a nuestra comunidad</p>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="w-full bg-green-950/30 border border-green-500/30 text-green-400 text-sm p-3 rounded-xl mb-6 text-center">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="w-full bg-red-950/30 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
          {error}
        </div>
      )}

      {/* Botón Google */}
      <button
        onClick={handleGoogleLogin}
        className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" style={{ fill: "#4285F4" }} />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" style={{ fill: "#34A853" }} />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" style={{ fill: "#FBBC05" }} />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" style={{ fill: "#EA4335" }} />
        </svg>
        Continuar con Google
      </button>

      {/* Divisor Minimalista */}
      <div className="w-full flex items-center gap-3 mb-6">
        <div className="flex-grow border-t border-gray-800"></div>
        <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">o con correo</span>
        <div className="flex-grow border-t border-gray-800"></div>
      </div>

      {/* Formulario Credenciales */}
      <form onSubmit={handleCredentialsLogin} className="w-full space-y-4">
        <div>
          <input
            type="email"
            required
            className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3.5 text-white text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/50 focus:outline-none transition-all placeholder-gray-600"
            placeholder="tu.correo@ejemplo.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <input
            type="password"
            required
            className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3.5 text-white text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/50 focus:outline-none transition-all placeholder-gray-600"
            placeholder="Tu contraseña secreta"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {/* Botón Sólido Principal */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0051ff] hover:bg-[#0041cc] text-white font-bold text-sm py-3.5 rounded-xl transition-all active:scale-95 uppercase tracking-wider mt-2"
        >
          {loading ? "Verificando..." : "Iniciar Sesión"}
        </button>
      </form>

      {/* Link de Registro Minimalista */}
      <div className="mt-6 text-center text-sm text-gray-500 w-full">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-[#00baff] hover:text-[#009ac9] font-semibold transition-colors">
          Crear cuenta
        </Link>
      </div>

      {/* --- SECCIÓN RECLUTAMIENTO --- */}
      <div className="w-full mt-8 pt-8 border-t border-gray-800 flex flex-col items-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">¿Eres postulante?</p>
        
        <Link href="/postulacion" className="w-full block group">
          <div className="bg-[#0a0a0a] border border-gray-800 group-hover:border-[#0051ff]/50 rounded-xl p-4 transition-all text-center group-hover:bg-[#0051ff]/5">
            <p className="text-white font-bold text-sm">
              Reclutamiento 2026-2
            </p>
            <p className="text-xs text-[#00baff] mt-1 font-semibold transition-all">
              Postúlate Aquí →
            </p>
          </div>
        </Link>
      </div>

      {/* --- FOOTER & SOPORTE TÉCNICO --- */}
      <div className="w-full mt-8 pt-6 border-t border-gray-800 text-center flex flex-col gap-5">
        
        {/* Texto de Ayuda / Soporte */}
        <p className="text-xs text-gray-500 leading-relaxed">
          ¿Tienes algún problema o necesitas ayuda? Escríbenos a{" "}
          <a 
            href="mailto:siafi.reclutamiento@gmail.com" 
            className="text-[#00baff] hover:text-white transition-colors font-semibold"
          >
            siafi.reclutamiento@gmail.com
          </a>
        </p>

        {/* Créditos SIAFI */}
        <div>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider uppercase mb-1">
            SophIA by <span className="text-[#00baff] font-bold">SIAFI</span>
          </p>
          <p className="text-[10px] text-gray-600 font-mono">
            Facultad de Ingeniería, UNAM
          </p>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-[#00baff] text-sm font-semibold animate-pulse">
          Cargando interfaz...
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}