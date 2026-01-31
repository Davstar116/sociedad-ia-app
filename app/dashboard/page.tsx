import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getCandidateStatus } from "../lib/notion-api"; 
import NetworkBackground from "../components/ui/NetworkBackground";
import Link from "next/link";

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
    <div className="max-w-2xl w-full bg-black/60 border border-[#0051ff]/30 p-8 rounded-2xl text-center backdrop-blur-xl animate-in fade-in zoom-in duration-500">
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

  // VISTA 2: NO SELECCIONADO (Filtro Inicial)
  const RejectedView = () => (
    <div className="max-w-2xl w-full bg-black/60 border border-gray-700 p-8 rounded-2xl text-center backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-5xl mb-4">👋</div>
      <h2 className="text-2xl font-bold text-white mb-4">Gracias por tu interés</h2>
      <p className="text-gray-400 mb-6">
        Apreciamos mucho el tiempo que tomaste para postularte. En esta ocasión, 
        debido al alto volumen de solicitudes, no podremos continuar con tu proceso.
      </p>
      <p className="text-gray-500 text-sm border-t border-gray-800 pt-4">
        Te invitamos a seguir participando en nuestros eventos abiertos.
      </p>
    </div>
  );

  // VISTA 3: APROBADO PARA ENTREVISTA
  const InterviewView = () => (
    <div className="max-w-4xl w-full animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          ¡Felicidades, <span className="text-[#00baff]">{session.user?.name}</span>!
        </h1>
        <p className="text-gray-400 mt-2">Has pasado a la siguiente fase. Es hora de conocerte.</p>
      </div>

      <div className="bg-black/60 border border-[#00baff]/50 p-8 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,186,255,0.1)]">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
          <div className="bg-[#00baff] text-black font-bold px-3 py-1 rounded text-sm">PASO 2</div>
          <h2 className="text-xl font-bold text-white">Agenda tu Entrevista</h2>
        </div>
        
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl bg-white/5">
          <p className="text-gray-400">📅 Aquí cargaremos el componente de Calendario</p>
          <button className="mt-4 px-6 py-2 bg-[#0051ff] rounded-lg hover:bg-[#0041cc] transition text-white font-bold">
            Ver Horarios Disponibles
          </button>
        </div>
      </div>
    </div>
  );

  // VISTA 4: RECHAZADO POST-ENTREVISTA (Final del camino)
  const PostInterviewRejectedView = () => (
    <div className="max-w-2xl w-full bg-black/60 border border-gray-700 p-8 rounded-2xl text-center backdrop-blur-xl animate-in zoom-in duration-500">
      <div className="text-5xl mb-4 grayscale opacity-80">🤝</div>
      <h2 className="text-2xl font-bold text-white mb-4">Un placer conocerte</h2>
      <p className="text-gray-300 mb-4 leading-relaxed">
        Hola <span className="text-[#00baff] font-bold">{session.user?.name}</span>, queremos agradecerte por el tiempo y la energía que nos dedicaste en la entrevista.
      </p>
      <p className="text-gray-400 mb-6 text-sm">
        Fue una decisión difícil, pero en este momento no tenemos una vacante que se ajuste a tu perfil dentro del núcleo seleccionado. Sin embargo, tu talento es evidente.
      </p>
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <p className="text-gray-400 text-sm">
          Mantendremos tu contacto para futuras oportunidades en SIAFI. ¡No te rindas!
        </p>
      </div>
    </div>
  );

  // VISTA 5: ACEPTADO (¡Nuevo Miembro!) 🚀
  const AcceptedView = () => (
    <div className="max-w-3xl w-full text-center animate-in zoom-in duration-700">
      
      {/* Efecto de Glow detrás */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0051ff] rounded-full blur-[120px] opacity-20 -z-10"></div>

      <div className="mb-6 inline-block">
        <span className="text-6xl animate-bounce inline-block">🚀</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0051ff] via-[#00baff] to-white mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(0,186,255,0.5)]">
        ¡BIENVENIDO AL EQUIPO!
      </h1>
      
      <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
        Felicidades <span className="text-white font-bold">{session.user?.name}</span>. <br/>
        Has superado todas las pruebas. Oficialmente eres parte de la Sociedad de Inteligencia Artificial.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
        <div className="bg-[#0051ff]/20 border border-[#0051ff] p-4 rounded-xl hover:bg-[#0051ff]/30 transition cursor-pointer group">
          <h3 className="text-[#00baff] font-bold mb-1 group-hover:text-white">📱 Unirse al WhatsApp</h3>
          <p className="text-xs text-gray-400">Grupo oficial de miembros</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl hover:bg-gray-700 transition cursor-pointer">
          <h3 className="text-white font-bold mb-1">📂 Onboarding</h3>
          <p className="text-xs text-gray-400">Ver documentos iniciales</p>
        </div>
      </div>

      <p className="mt-12 text-sm text-gray-500 font-mono">
        ESTATUS: <span className="text-[#00baff]">MIEMBRO ACTIVO</span>
      </p>
    </div>
  );

  // --- RENDER PRINCIPAL ---
  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <NetworkBackground />
      
      <div className="z-10 w-full flex justify-center relative">
        {/* LOGO SIAFI EN FONDO SIEMPRE VISIBLE PERO SUTIL */}
        <div className="absolute -top-32 opacity-10 pointer-events-none">
           <img src="/logo.png" width={200} height={200} alt="Logo Fondo" />
        </div>

        {/* LÓGICA DE SWITCH DE ESTADOS */}
        {(status === "Registrado" || status === "Recibido") && <WaitingView />}
        {status === "No Seleccionado" && <RejectedView />}
        {status === "Aprobado para Entrevista" && <InterviewView />}
        
        {/* NUEVOS ESTADOS */}
        {status === "Rechazado" && <PostInterviewRejectedView />}
        {status === "Aceptado" && <AcceptedView />}
        
        {/* Estado por defecto o error */}
        {!["Registrado", "Recibido", "No Seleccionado", "Aprobado para Entrevista", "Rechazado", "Aceptado"].includes(status) && (
          <div className="text-gray-500 bg-black/50 p-4 rounded border border-red-900/50">
             Estado desconocido: <span className="text-red-400 font-mono">{status}</span>
             <br/><span className="text-xs">Contacta al administrador si crees que es un error.</span>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-20">
         <a href="/api/auth/signout" className="text-xs text-gray-500 hover:text-white border border-gray-800 px-3 py-1 rounded-full hover:border-gray-600 transition">Cerrar Sesión</a>
      </div>
    </div>
  );
}