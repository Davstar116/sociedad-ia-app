import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getCandidateStatus } from "../lib/notion-api"; 
import NetworkBackground from "../components/ui/NetworkBackground";
import UserMenu from "../components/dashboard/UserMenu";
import AvailabilityGrid from "../components/dashboard/AvailabilityGrid";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  // 1. OBTENEMOS DATOS
  const userData = await getCandidateStatus(session.user.email);
  
  const status = userData?.status || "Registrado";
  const role = userData?.role || "Postulante";
  const isInterviewer = userData?.isInterviewer || false;

  // 2. DEFINIMOS STAFF
  const STAFF_ROLES = ["Miembro", "Administrador Maestro", "Mesa Directiva"];
  const isStaff = STAFF_ROLES.includes(role);

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
      <p className="text-gray-400">Hola <span className="text-[#00baff]">{session.user?.name}</span>...</p>
    </div>
  );
  // (Por brevedad omito las otras vistas, asumo que las tienes, NO LAS BORRES)
  const RejectedView = () => <div className="text-white">Rechazado</div>;
  const InterviewView = () => <div className="text-white">Entrevista</div>;
  const PostInterviewRejectedView = () => <div className="text-white">Post Entrevista Rechazado</div>;
  const AcceptedView = () => <div className="text-white">Aceptado</div>;

  // --- VISTA ENTREVISTADOR ---
  const InterviewerDashboard = () => (
    <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-500">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Panel de Entrevistas</h1>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full flex items-center gap-2">
                <span className="text-green-400 text-xs font-bold uppercase">Modo Activo</span>
            </div>
        </div>
        <AvailabilityGrid />
    </div>
  );

  // LOGICA DE VISUALIZACIÓN
  let CurrentView = null;
  if (isStaff) {
      if (isInterviewer) CurrentView = <InterviewerDashboard />;
      else CurrentView = null;
  } else {
      switch (status) {
          case "Registrado": case "Recibido": CurrentView = <WaitingView />; break;
          case "No Seleccionado": CurrentView = <RejectedView />; break;
          case "Aprobado para Entrevista": CurrentView = <InterviewView />; break;
          case "Rechazado": CurrentView = <PostInterviewRejectedView />; break;
          case "Aceptado": CurrentView = <AcceptedView />; break;
          default: CurrentView = <div className="text-white">Estado: {status}</div>;
      }
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <NetworkBackground />

      {/* 🔴 DEBUG BOX: ESTO ES LO QUE NECESITO QUE VEAS 🔴 */}
      <div className="absolute top-20 left-4 z-[100] bg-red-900/90 border border-red-500 p-4 rounded text-xs font-mono max-w-sm">
          <p className="font-bold text-red-200 border-b border-red-500/50 mb-2">DIAGNÓSTICO SOPHIA:</p>
          <p>📧 Email Sesión: <span className="text-white">{session.user?.email}</span></p>
          <p>👤 Rol Detectado: <span className="text-yellow-300">{role}</span></p>
          <p>🎤 Es Entrevistador?: <span className="text-yellow-300">{isInterviewer ? "SÍ" : "NO"}</span></p>
          <p>🛡️ Es Staff (Array)?: <span className="text-white">{isStaff ? "SÍ" : "NO"}</span></p>
          <p>📝 Estatus Candidato: <span className="text-gray-400">{status}</span></p>
      </div>
      {/* -------------------------------------------------- */}
      
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
           <img src="/logo.png" width={140} height={140} alt="Logo" style={{ opacity: 1 }} />
      </div>

      <div className="z-10 w-full flex flex-col items-center justify-center mt-12 mb-10">
        {CurrentView}
      </div>
      <UserMenu />
    </div>
  );
}