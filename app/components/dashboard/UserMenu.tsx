"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function UserMenu() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignOut = () => {
    // Al confirmar, cerramos sesión y redirigimos al login
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* --- BOTÓN ENGRANAJE Y MENÚ DESPLEGABLE --- */}
      <div className="absolute top-6 right-6 z-50">
        <details className="group relative">
          <summary className="list-none cursor-pointer p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white focus:outline-none">
            {/* Ícono de Engranaje */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-in spin-in-90 duration-300">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </summary>
          
          {/* Menú Desplegable */}
          <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-gray-800 rounded-xl shadow-xl backdrop-blur-md overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
             {/* En lugar de <a> usamos <button> para abrir el modal */}
             <button 
               onClick={() => setIsModalOpen(true)}
               className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
               Cerrar Sesión
             </button>
          </div>
        </details>
      </div>

      {/* --- MODAL EMERGENTE (POP-UP) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Fondo oscuro (Backdrop) */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Ventana Modal */}
          <div className="relative w-full max-w-sm bg-black/90 border border-[#0051ff]/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,81,255,0.2)] animate-in zoom-in-95 duration-300 text-center">
            
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">¿Cerrar Sesión?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Tendrás que volver a ingresar tus credenciales para acceder a SophIA.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600/90 text-white hover:bg-red-600 transition-colors text-sm font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                Sí, salir
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}