import Link from "next/link";
import Image from "next/image";
import NeuralBackground from "./components/NeuralBackground";

export default function Home() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden font-sans flex flex-col items-center justify-center">
      {/* 1. Fondo Neuronal */}
      <NeuralBackground />

      {/* 2. Contenido Central */}
      <div className="z-10 text-center px-4 max-w-4xl animate-in fade-in zoom-in duration-1000">
        
        {/* Logo Brillante */}
        <div className="relative w-48 h-48 mx-auto mb-8 transition-transform hover:scale-105 duration-700">
          <div className="absolute inset-0 bg-sociedad-cyan/20 blur-3xl rounded-full animate-pulse"></div>
          <Image 
            src="/logo.png" 
            alt="SIAFI Logo" 
            fill 
            className="object-contain drop-shadow-[0_0_25px_rgba(0,186,255,0.6)]"
            priority
          />
        </div>

        {/* Títulos */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
            SIAFI
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-sociedad-cyan font-light tracking-widest uppercase mb-8">
          Sociedad de Inteligencia Artificial de la Facultad de Ingeniería 
        </p>

        <p className="text-gray-400 max-w-2xl mx-auto mb-12 text-sm md:text-base leading-relaxed border-l-2 border-sociedad-blue pl-4 text-left">
          Innovación. Desarrollo. Futuro. <br/>
          Somos la sociedad donde la ingeniería y la inteligencia artificial convergen para crear las soluciones del mañana. 
          ¿Tienes lo necesario para formar parte?
        </p>

        {/* Botón de Acción (CTA) */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <Link 
            href="/postulacion"
            className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border border-sociedad-cyan/50 text-white shadow-[0_0_15px_rgba(0,186,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(0,186,255,0.6)] hover:border-sociedad-cyan"
          >
            <div className="absolute inset-0 w-0 bg-gradient-to-r from-sociedad-blue to-sociedad-cyan transition-all duration-[250ms] ease-out group-hover:w-full opacity-20"></div>
            <span className="relative font-bold tracking-wider flex items-center gap-2">
              INICIAR RECLUTAMIENTO 2026-2
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            </span>
          </Link>
        </div>

        {/* Footer sutil */}
        <div className="absolute bottom-8 left-0 w-full text-center">
          <p className="text-xs text-gray-600 uppercase tracking-widest">
            SIAFI • Powered by SophIA
          </p>
        </div>

      </div>
    </div>
  );
}