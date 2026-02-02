import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getCandidateStatus, checkSystemState, getInterviewerAgenda } from "../lib/notion-api"; 
import NetworkBackground from "../components/ui/NetworkBackground";
import UserMenu from "../components/dashboard/UserMenu";
import AvailabilityGrid from "../components/dashboard/AvailabilityGrid";
import GenerateScheduleButton from "../components/dashboard/GenerateScheduleButton";
import InterviewerAgenda from "../components/dashboard/InterviewerAgenda"; // ✅ NUEVO
import ResetScheduleButton from "../components/dashboard/ResetScheduleButton"; // ✅ NUEVO
import CandidateScheduler from "../components/dashboard/CandidateScheduler"; // ✅ NUEVO

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  // 1. OBTENER DATOS DEL USUARIO
  const userData = await getCandidateStatus(session.user.email);
  
  const status = userData?.status || "Registrado";
  const role = userData?.role || "Postulante";
  const isInterviewer = userData?.isInterviewer || false;

  // 2. VERIFICAR EL ESTADO DEL SISTEMA (¿Fase Disponibilidad o Fase Entrevistas?)
  const { hasBlocks } = await checkSystemState();

  // Roles de Staff
  const STAFF_ROLES = ["Miembro", "Administrador Maestro", "Admin Maestro", "Mesa Directiva"];
  const isStaff = STAFF_ROLES.includes(role);
  const isAdmin = role === "Administrador Maestro" || role === "Admin Maestro";

  // --- VISTAS DE CANDIDATO ---
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

  // ✅ CAMBIO IMPORTANTE: Ahora carga el Scheduler en lugar de la vista estática
  const InterviewView = () => (
    <CandidateScheduler />
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

  // LOGICA PRINCIPAL DE VISTAS (CANDIDATOS)
  let CandidateCurrentView = null;
  switch (status) {
      case "Registrado":
      case "Recibido":
          CandidateCurrentView = <WaitingView />;
          break;
      case "No Seleccionado":
          CandidateCurrentView = <RejectedView />;
          break;
      case "Aprobado para Entrevista":
          CandidateCurrentView = <InterviewView />;
          break;
      case "Rechazado":
          CandidateCurrentView = <PostInterviewRejectedView />;
          break;
      case "Aceptado":
          CandidateCurrentView = <AcceptedView />;
          break;
      default:
          CandidateCurrentView = (
              <div className="text-gray-500 bg-black/50 p-4 rounded border border-red-900/50">
                  Estado desconocido: <span className="text-red-400 font-mono">{status}</span>
              </div>
          );
  }

  // --- RENDER PRINCIPAL ---
  return (
    <div className="min-h-screen bg-transparent text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      <NetworkBackground />
      
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

      <div className="z-10 w-full flex flex-col items-center justify-center mt-12 mb-10">
        
        {/* LOGICA DE SELECCIÓN DE VISTA GLOBAL */}
        {isStaff && isInterviewer ? (
            // ✅ VISTA DEL ENTREVISTADOR (Dinámica: Grid o Agenda)
            <InterviewerSection 
                isAdmin={isAdmin} 
                hasBlocks={hasBlocks} 
                userEmail={session.user?.email} 
                userName={session.user?.name} 
            />
        ) : (
            // ✅ VISTA DEL CANDIDATO (Normal)
            CandidateCurrentView
        )}

      </div>

      <UserMenu />
    </div>
  );
}

// ✅ COMPONENTE ASÍNCRONO AUXILIAR PARA EL ENTREVISTADOR
// Esto nos permite hacer fetch de la agenda sin romper el flujo principal
async function InterviewerSection({ isAdmin, hasBlocks, userEmail, userName }: any) {
    // Si hay bloques generados, buscamos la agenda personal del entrevistador
    const agenda = hasBlocks ? await getInterviewerAgenda(userEmail || "", userName || "") : [];

    return (
      <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-500 mt-12">
          
          <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-[#00baff] drop-shadow-[0_0_10px_rgba(0,186,255,0.3)]">
                      {hasBlocks ? "Tu Agenda de Entrevistas" : "Horario de Disponibilidad"}
                  </h1>
                  <p className="text-gray-400 mt-1">
                      {hasBlocks 
                        ? "Estas son las entrevistas que el sistema te ha asignado automáticamente." 
                        : "Configura tus horarios disponibles para las próximas semanas."}
                  </p>
              </div>
          </div>

          {/* --- ZONA EXCLUSIVA ADMIN MAESTRO --- */}
          {isAdmin && (
              <div className="mb-8 bg-yellow-900/10 border border-yellow-600/20 p-4 rounded-xl backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                      <div className="text-2xl">⚡</div>
                      <div className="flex-1">
                          <h3 className="text-yellow-500 font-bold text-sm mb-1 uppercase tracking-wider">Zona de Administración</h3>
                          
                          {/* Botón cambia según el estado del sistema */}
                          {hasBlocks ? (
                             <>
                               <p className="text-gray-400 text-xs mb-3">
                                  El sistema está en <strong>Modo Entrevistas</strong>. Los postulantes están eligiendo horarios.
                                  <br/>Para corregir disponibilidad, debes reiniciar el sistema.
                               </p>
                               <ResetScheduleButton />
                             </>
                          ) : (
                             <>
                               <p className="text-gray-400 text-xs mb-3">
                                  Una vez que todos los socios hayan llenado su disponibilidad, genera los horarios.
                               </p>
                               <GenerateScheduleButton />
                             </>
                          )}
                      </div>
                  </div>
              </div>
          )}
          
          {/* SWITCH DE CONTENIDO: AGENDA vs GRID */}
          {hasBlocks ? (
             <InterviewerAgenda agenda={agenda} />
          ) : (
             <AvailabilityGrid userEmail={userEmail || ""} userName={userName || "Entrevistador"} />
          )}
      </div>
    );
}