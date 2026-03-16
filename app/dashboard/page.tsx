"use client";

import { useState } from "react";
import Image from "next/image";

export default function DashboardPostulante() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* ==========================================
          CINTILLO SUPERIOR (TOP BAR)
          ========================================== */}
      <header className="fixed top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center justify-between px-5">
        
        {/* Campana de Notificaciones */}
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Puntito rojo de notificación (opcional, para darle vida) */}
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#111111] rounded-full"></span>
        </button>

        {/* Título Central */}
        <h1 className="text-xl font-black tracking-tight">
          Soph<span className="text-[#00baff]">IA</span>
          <span className="text-[10px] text-gray-500 font-normal uppercase tracking-widest ml-2 hidden sm:inline-block">by SIAFI</span>
        </h1>

        {/* Foto de Perfil (Abre menú lateral) */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0051ff] to-[#00baff] p-[2px] hover:scale-105 transition-transform"
        >
          <div className="w-full h-full rounded-full bg-[#111111] overflow-hidden flex items-center justify-center">
             <span className="text-xs font-bold text-white">DP</span>
          </div>
        </button>
      </header>

      {/* ==========================================
          MENÚ LATERAL (SIDEBAR OVERLAY)
          ========================================== */}
      {/* Fondo oscuro cuando el menú está abierto */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Panel del Menú */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <p className="font-bold text-white">David</p>
            <p className="text-xs text-[#00baff]">Postulante</p>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <button className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Configuración</button>
          <button className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Soporte Técnico</button>
        </div>
        <div className="p-4 border-t border-gray-800">
          <button className="w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* ==========================================
          CONTENIDO PRINCIPAL
          ========================================== */}
      <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen flex flex-col gap-6">
        
        {/* Tarjeta de Bienvenida de Prueba */}
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0051ff]"></div>
          <h2 className="text-lg font-bold mb-1">Hola, David</h2>
          <p className="text-sm text-gray-400 mb-4">Bienvenido a tu panel de control.</p>
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Estatus Actual</p>
              <p className="text-sm font-semibold text-[#00baff]">Postulación Recibida</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#00baff]/10 flex items-center justify-center text-xl">
              📝
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mt-10">
          Aquí construiremos el resto del contenido del Dashboard...
        </div>

      </main>

      {/* ==========================================
          CINTILLO INFERIOR (BOTTOM NAV)
          ========================================== */}
      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          
          {/* Botones Izquierda */}
          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Estatus</span>
          </button>
          
          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors mr-6">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Perfil</span>
          </button>

          {/* BOTÓN CENTRAL: "LA GOTA" HOME */}
          {/* El border-[#0a0a0a] es clave porque simula que el cintillo se recorta */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button className="w-14 h-14 bg-gradient-to-tr from-[#0051ff] to-[#00baff] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,186,255,0.4)] border-[6px] border-[#0a0a0a] hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>

          {/* Botones Derecha */}
          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors ml-6">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Ayuda</span>
          </button>

          <button className="flex flex-col items-center justify-center w-12 text-gray-400 hover:text-[#00baff] transition-colors">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Fechas</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}