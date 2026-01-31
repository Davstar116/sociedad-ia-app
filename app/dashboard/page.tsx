import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getCandidateStatus } from "../lib/notion-api"; 
import NetworkBackground from "../components/ui/NetworkBackground";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  const status = await getCandidateStatus(session.user.email);

  // --- VISTAS ---
  
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

  const RejectedView = () => (
    <div className="max-w-2xl w-full bg-black/60 border border-gray-700 p-8 rounded-2xl text-center backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-5xl mb-4">👋</div>
      <h2 className="text-2xl font-bold text-white mb-4">Gracias por tu interés</h2>
      <p className="text-gray-400 mb-6">
        Apreciamos el tiempo que invertiste en postularte. En esta ocasión, el proceso de selección ha sido muy competitivo y no podremos continuar con tu proceso.
      </p>
      <p className="text-gray-500 text-sm border-t border-gray-800 pt-4">
        Te invitamos a seguir participando en nuestros eventos abiertos y a intentarlo nuevamente el próximo semestre.
      </p>
    </div>
  );

  const InterviewView = () => (
    <div className="max-w-4xl w-full animate-in fade-in duration-700">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white">
          ¡Felicidades, <span className="text-[#00baff]">{session.user?.name}</span>!
        </h1>
        <p className="text-gray-400 mt-2">Has pasado a la siguiente fase. Es hora de conocerte.</p>
      </div>

      <div className="bg-black/60 border border-[#00baff]/50 p-8 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,186,255,0.1)]">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
          <div className="bg-[#00baff] text-black font-bold px-3 py-1 rounded text-sm">FASE 2</div>
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

  const PostInterviewRejectedView = () => (
    <div className="max-w-2xl w-full bg-black/60 border border-gray-700 p-8 rounded-2xl text-center backdrop-blur-xl animate-in zoom-in duration-500">
      <div className="text-5xl mb-4 grayscale opacity-80">🤝</div>
      <h2 className="text-2xl font-bold text-white mb-4">Un placer conocerte</h2>
      <p className="text-gray-300 mb-4 leading-relaxed">
        Hola <span className="text-[#00baff] font-bold">{session.user?.name}</span>, queremos agradecerte por el tiempo y la energía que nos dedicaste en la entrevista.
      </p>
      <p className="text-gray-400 mb-6 text-sm">
        Fue una decisión difícil, pero en este momento no tenemos una vacante que se ajuste a tu perfil.
      </p>
      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
        <p className="text-gray-400 text-sm">
          Mantendremos tu contacto para futuras oportunidades en SIAFI.
        </p>
      </div>
    </div>
  );

  const AcceptedView = () => (
    <div className="max-w-3xl w-full text-center animate-in zoom-in duration-700">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0051ff] rounded-full blur-[120px] opacity-20 -z-10"></div>
      
      <div className="mb-6 inline-block">
        <span className="text-6xl animate-bounce inline-block">🚀</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0051ff] via-[#00baff] to-white mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(0,186,255,0.5)]">
        ¡BIENVENID@ AL EQUIPO!
      </h1>
      
      <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
        Felicidades <span className="text-white font-bold">{session.user?.name}</span>. <br/>
        Has superado todas las pruebas. Oficialmente eres parte de SIAFI.
      </p>

      {/* BOTONES RESTAURADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
        <div className="bg-[#0051ff]/20 border border-[#0051ff] p-4 rounded-xl hover:bg-[#0051ff]/30 transition cursor-pointer group">
          <h3 className="text-[#00baff] font-bold mb-1 group-hover:text-white">📱 Unirse al WhatsApp</h3>
          <p className="text-xs text-gray-400">Grupo oficial de miembros</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl hover:bg-gray-700 transition cursor-pointer">
          <h3 className="text-white font-bold mb-1">📂 Onboarding</h3>
          <p className="text-xs text-gray-400">Ver documentos iniciales</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500 font-mono">
        ESTATUS: <span className="text-[#00baff]">MIEMBRO EN CAPACITACIÓN</span>
      </p>
    </div>
  );

  // --- RENDER PRINCIPAL ---
  return (
    <div className="min-h-screen bg-transparent text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      <NetworkBackground />
      
      {/* HEADER LOGO */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
           <img 
             src="/logo.png" 
             width={140} 
             height={140} 
             alt="Logo SIAFI" 
             className="drop-shadow-[0_0_20px_rgba(0,186,255,0.6)]"
             style={{ opacity: 1 }} 
           />
      </div>

      <div className="z-10 w-full flex flex-col items-center justify-center mt-12">
        {(status === "Registrado" || status === "Recibido") && <WaitingView />}
        {status === "No Seleccionado" && <RejectedView />}
        {status === "Aprobado para Entrevista" && <InterviewView />}
        {status === "Rechazado" && <PostInterviewRejectedView />}
        {status === "Aceptado" && <AcceptedView />}
        
        {!["Registrado", "Recibido", "No Seleccionado", "Aprobado para Entrevista", "Rechazado", "Aceptado"].includes(status) && (
          <div className="text-gray-500 bg-black/50 p-4 rounded border border-red-900/50">
             Estado desconocido: <span className="text-red-400 font-mono">{status}</span>
          </div>
        )}
      </div>

      {/* --- MENU DE ENGRANAJE (SETTINGS) --- */}
      <div className="absolute top-6 right-6 z-50">
         <details className="group relative">
            <summary className="list-none cursor-pointer p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white focus:outline-none">
              {/* Ícono de Engranaje SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-in spin-in-90 duration-300">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </summary>
            
            {/* Menú Desplegable */}
            <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-gray-800 rounded-xl shadow-xl backdrop-blur-md overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
               <a 
                 href="/api/auth/signout" 
                 className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                 Cerrar Sesión
               </a>
            </div>
         </details>
      </div>

    </div>
  );
}