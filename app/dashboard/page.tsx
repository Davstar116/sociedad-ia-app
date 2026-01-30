import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getCandidateStatus } from "@/app/lib/notion-api"; // Importamos la función nueva
import NetworkBackground from "../components/ui/NetworkBackground";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  // 1. OBTENER EL ESTADO REAL DESDE NOTION
  const status = await getCandidateStatus(session.user.email);

  // --- COMPONENTES DE VISTA SEGÚN ESTADO ---

  // VISTA 1: EN ESPERA (Registrado)
  const WaitingView = () => (
    <div className="max-w-2xl w-full bg-black/60 border border-[#0051ff]/30 p-8 rounded-2xl text-center backdrop-blur-xl">
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-[#00baff] rounded-full animate-spin border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center text-4xl">⏳</div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Perfil en Evaluación</h2>
      <p className="text-gray-400">
        Hola <span className="text-[#00baff]">{session.user?.name}</span>. SophIA y la Mesa Directiva están analizando tu perfil.
      </p>
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-200">
        Te notificaremos por correo cuando tu estatus cambie.
      </div>
    </div>
  );

  // VISTA 2: NO APROBADO (No Seleccionado)
  const RejectedView = () => (
    <div className="max-w-2xl w-full bg-black/60 border border-gray-700 p-8 rounded-2xl text-center backdrop-blur-xl">
      <div className="text-5xl mb-4">👋</div>
      <h2 className="text-2xl font-bold text-white mb-4">Gracias por tu interés</h2>
      <p className="text-gray-400 mb-6">
        Apreciamos mucho el tiempo que tomaste para postularte. En esta ocasión, 
        el proceso de selección ha sido muy competitivo y no podremos continuar con tu proceso.
      </p>
      <p className="text-gray-500 text-sm">
        Te invitamos a seguir participando en nuestros eventos abiertos y a intentarlo nuevamente el próximo semestre.
      </p>
    </div>
  );

  // VISTA 3: APROBADO PARA ENTREVISTA
  const InterviewView = () => (
    <div className="max-w-4xl w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          ¡Felicidades, <span className="text-[#00baff]">{session.user?.name}</span>!
        </h1>
        <p className="text-gray-400 mt-2">Has pasado a la siguiente fase. Es hora de conocerte.</p>
      </div>

      {/* AQUÍ VA EL CALENDARIO (Lo integraremos después) */}
      <div className="bg-black/60 border border-[#00baff]/50 p-8 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,186,255,0.1)]">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
          <div className="bg-[#00baff] text-black font-bold px-3 py-1 rounded text-sm">PASO 2</div>
          <h2 className="text-xl font-bold text-white">Agenda tu Entrevista</h2>
        </div>
        
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl bg-white/5">
          <p className="text-gray-400">📅 Aquí cargaremos el componente de Calendario</p>
          <button className="mt-4 px-6 py-2 bg-[#0051ff] rounded-lg hover:bg-[#0041cc] transition">
            Ver Horarios Disponibles
          </button>
        </div>
      </div>
    </div>
  );

  // --- RENDER PRINCIPAL ---
  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <NetworkBackground />
      
      <div className="z-10 w-full flex justify-center">
        {/* LÓGICA DE SWITCH DE ESTADOS */}
        {status === "Registrado" && <WaitingView />}
        {status === "Recibido" && <WaitingView />} {/* Por si acaso quedó con el nombre anterior */}
        {status === "No Seleccionado" && <RejectedView />}
        {status === "Aprobado para Entrevista" && <InterviewView />}
        
        {/* Estado por defecto o error */}
        {!["Registrado", "Recibido", "No Seleccionado", "Aprobado para Entrevista"].includes(status) && (
          <div className="text-gray-500">Estado desconocido: {status}</div>
        )}
      </div>

      {/* Botón de Logout temporal */}
      <div className="absolute top-4 right-4 z-20">
         <a href="/api/auth/signout" className="text-xs text-gray-500 hover:text-white">Cerrar Sesión</a>
      </div>
    </div>
  );
}