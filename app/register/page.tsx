"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NetworkBackground from "@/app/components/ui/NetworkBackground";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        setError(data.error || "Error al registrarse");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <NetworkBackground />
      
      <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-xl border border-[#0051ff]/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,81,255,0.1)]">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Únete a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0051ff] to-[#00baff]">SophIA</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Crea tu cuenta</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#00baff] mb-1 tracking-wider">NOMBRE COMPLETO</label>
            <input
              type="text"
              required
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00baff] focus:ring-1 focus:ring-[#00baff] focus:outline-none transition-all placeholder-gray-600"
              placeholder="Ej. Ana Pérez"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#00baff] mb-1 tracking-wider">CORREO ELECTRÓNICO</label>
            <input
              type="email"
              required
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00baff] focus:ring-1 focus:ring-[#00baff] focus:outline-none transition-all placeholder-gray-600"
              placeholder="ana@ejemplo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#00baff] mb-1 tracking-wider">CONTRASEÑA</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-[#00baff] focus:ring-1 focus:ring-[#00baff] focus:outline-none transition-all placeholder-gray-600"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-[#0051ff] to-[#00baff] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#0051ff]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#00baff] hover:underline font-medium">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}