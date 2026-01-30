"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import NetworkBackground from "@/app/components/ui/NetworkBackground"; // Importamos el fondo

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
    <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-xl border border-[#0051ff]/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,81,255,0.1)]">
      
      {/* Header con gradiente */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0051ff] to-[#00baff]">SophIA</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">Accede al nuestra comunidad</p>
      </div>

      {successMsg && (
        <div className="bg-[#00baff]/10 border border-[#00baff]/30 text-[#00baff] text-sm p-3 rounded mb-4 text-center">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm p-3 rounded mb-4 text-center">
          {error}
        </div>
      )}

      {/* Botón Google Estilizado */}
      <button
        onClick={handleGoogleLogin}
        className="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition-all hover:scale-[1.02] mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" style={{ fill: "#4285F4" }} />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" style={{ fill: "#34A853" }} />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" style={{ fill: "#FBBC05" }} />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" style={{ fill: "#EA4335" }} />
        </svg>
        Continuar con Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-black text-gray-500">o usa credenciales</span>
        </div>
      </div>

      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <div>
          <input
            type="email"
            required
            className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00baff] focus:ring-1 focus:ring-[#00baff] focus:outline-none transition-all placeholder-gray-600"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <input
            type="password"
            required
            className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00baff] focus:ring-1 focus:ring-[#00baff] focus:outline-none transition-all placeholder-gray-600"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#0051ff] to-[#00baff] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#0051ff]/20"
        >
          {loading ? "Verificando..." : "Ingresar"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-[#00baff] hover:underline font-medium">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <NetworkBackground />
      <Suspense fallback={<div className="text-[#00baff] animate-pulse">Cargando interfaz...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}