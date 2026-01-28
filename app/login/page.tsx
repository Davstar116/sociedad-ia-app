"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import NeuralBackground from "../components/NeuralBackground";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <NeuralBackground />
      
      <div className="z-10 w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-500">
        
        {/* LOGO */}
        <div className="relative w-32 h-32 mb-6">
          <div className="absolute inset-0 bg-sociedad-cyan/30 blur-2xl rounded-full"></div>
          <Image src="/logo.png" alt="SIAFI" fill className="object-contain" priority />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-wider">BIENVENIDO A SIAFI</h1>
        <p className="text-gray-400 text-sm mb-8 text-center">Plataforma de Gestión Inteligente</p>

        {/* BOTÓN GOOGLE */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all mb-4"
        >
          <img src="https://authjs.dev/img/providers/google.svg" alt="G" className="w-5 h-5" />
          Iniciar Sesión con Google
        </button>

        <div className="w-full flex items-center gap-2 mb-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-gray-500 text-xs uppercase">O para externos</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {/* BOTÓN RECLUTAMIENTO DIRECTO */}
        <Link 
          href="/postulacion"
          className="w-full text-center py-3 border border-sociedad-cyan/50 text-sociedad-cyan rounded-xl hover:bg-sociedad-cyan/10 transition-all font-bold tracking-wide"
        >
          🚀 SOY POSTULANTE
        </Link>
        
        <p className="text-xs text-gray-500 mt-6 text-center">
          Si eres postulante, no necesitas cuenta. <br/>Ingresa directo al botón azul.
        </p>

      </div>
    </div>
  );
}