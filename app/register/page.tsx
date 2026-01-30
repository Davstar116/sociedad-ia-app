"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        // Si todo sale bien, mandamos al login
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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Únete a SIAFI
          </h1>
          <p className="text-gray-400 text-sm mt-2">Crea tu cuenta de Miembro</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-200 text-sm p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-500 mb-1">NOMBRE COMPLETO</label>
            <input
              type="text"
              required
              className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Ej. Ana Pérez"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-500 mb-1">CORREO ELECTRÓNICO</label>
            <input
              type="email"
              required
              className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="ana@ejemplo.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-500 mb-1">CONTRASEÑA</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}