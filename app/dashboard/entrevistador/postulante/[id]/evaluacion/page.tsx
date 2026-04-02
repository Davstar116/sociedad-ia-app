"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// =========================================================
// 🧠 BANCO DE PREGUNTAS SINTETIZADO DE LOS GUIONES OFICIALES
// =========================================================
const GUIONES: Record<string, { generales: string[], tecnicas: string[], practico: string[] }> = {
  "Proyectos": {
    generales: [
      "¿Cuál es tu mayor fortaleza y tu mayor debilidad?",
      "¿Cuáles consideras que son tus habilidades principales y cuál es tu superpoder?",
      "Supongamos que tienes que entregar un trabajo personal importante y una parte de un trabajo en equipo a la misma hora. Por procrastinar solo puedes hacer uno. ¿Qué harías?",
      "Cuéntanos una experiencia donde hayas asumido el rol de líder. ¿Cómo resultó?",
      "Tienes 3 proyectos finales de la carrera y el proyecto de SIAFI, todos para entregar en 2 meses. ¿Cómo te organizas?"
    ],
    tecnicas: [
      "Con tus propias palabras, ¿qué es la Inteligencia Artificial y cómo describirías tus conocimientos en ella?",
      "¿Qué aplicaciones reales conoces de la IA enfocadas a la industria?",
      "¿Tienes alguna idea de un proyecto de IA que te gustaría desarrollar dentro de este núcleo?",
      "¿Qué metodologías o herramientas utilizarías para llevar a cabo ese proyecto?"
    ],
    practico: [
      "CASO A (Código): Por favor, explícanos el código que elegiste traer. ¿Cuál es su propósito, lógica y qué decisiones de diseño tomaste? (3 min)",
      "CASO B (Algoritmia - Si no trajo código): ¿Cómo resolverías el problema de encontrar el número más frecuente en una lista enorme de números? ¿O cómo explicarías el ordenamiento de Burbuja (Bubble Sort)?"
    ]
  },
  "Capacitación": {
    generales: [
      "¿Cuál es tu mayor fortaleza y tu mayor debilidad?",
      "¿Cuáles consideras que son tus habilidades principales y cuál es tu superpoder?",
      "Supongamos que tienes que entregar un trabajo personal importante y una parte de un trabajo en equipo a la misma hora. ¿Qué harías?",
      "Cuéntanos una experiencia donde hayas asumido el rol de líder. ¿Cómo resultó?",
      "Tienes 3 proyectos finales de la carrera y el proyecto de SIAFI, todos para entregar en 2 meses. ¿Cómo te organizas?"
    ],
    tecnicas: [
      "Con tus propias palabras, ¿qué es la Inteligencia Artificial y qué es lo que más te intriga de su futuro?",
      "¿Conoces los cursos o talleres que SIAFI ha impartido en el pasado?",
      "¿Qué tema de Inteligencia Artificial o Programación te gustaría enseñar o estructurar como curso en este núcleo?",
      "¿Cómo asegurarías que los estudiantes realmente están aprendiendo y no solo copiando código?"
    ],
    practico: [
      "CASO A (Código): Por favor, explícanos el código que elegiste traer. Enséñanoslo como si fuéramos alumnos de tu curso. (3 min)",
      "CASO B (Didáctica - Si no trajo código): Imagina que un alumno te pregunta cómo funciona una Red Neuronal Básica pero no sabe nada de matemáticas avanzadas. ¿Cómo se lo explicarías usando una analogía de la vida real?"
    ]
  },
  "Organización": {
    generales: [
      "En organización trabajamos constantemente en equipo. ¿Cuáles crees que sean las claves para poder realizarlo de la mejor forma?",
      "¿Has coordinado algún equipo de trabajo o algún evento antes? Cuéntanos al respecto.",
      "Si requieres dar avances del trabajo que has realizado a lo largo de la semana, ¿cómo y con qué material lo presentarías?",
      "Constantemente hablamos con directivos, profesores y patrocinadores. ¿Te consideras alguien con facilidad de palabra?",
      "A la hora de organizar un evento, ¿cuál crees que es el detalle que la mayoría olvida y hace que todo falle?"
    ],
    tecnicas: [
      "Con tus propias palabras, ¿qué es la Inteligencia Artificial?",
      "¿Por qué te interesa profundizar e impulsar el desarrollo de la IA desde la gestión y organización?",
      "¿Qué herramientas de gestión (Notion, Trello, Excel, etc.) utilizas para organizarte?"
    ],
    practico: [
      "CASO PRÁCTICO 1: Estamos a una semana del evento de bienvenida. Un miembro de tu equipo te deja en 'visto' por 3 días y no avanza con sus tareas urgentes. ¿Cómo manejas la situación?",
      "CASO PRÁCTICO 2: Necesitas información urgente de Difusión o Proyectos para avanzar con la logística de un evento, pero los líderes no te responden los mensajes. ¿Qué haces?"
    ]
  },
  "Difusión": {
    generales: [
      "¿Qué tan bueno eres para comunicar tus ideas? ¿Cuál es tu habilidad blanda más fuerte?",
      "Supongamos que tienes que entregar un trabajo personal importante y una parte de un trabajo en equipo a la misma hora. ¿Qué harías?",
      "¿Qué es lo que más valoras en el trabajo en equipo y qué tan cómodo te sientes delegando?",
      "Tienes 3 proyectos finales de la carrera y el proyecto de SIAFI, todos para entregar en 2 meses. ¿Cómo te organizas?"
    ],
    tecnicas: [
      "Con tus propias palabras, ¿qué es la Inteligencia Artificial y por qué te interesa difundirla?",
      "¿Has manejado redes sociales de algún proyecto o negocio antes? ¿Qué mejorarías de las redes actuales de SIAFI?",
      "¿Has aplicado alguna estrategia de marketing en algún proyecto? ¿Qué herramientas de diseño o edición de video sabes usar?"
    ],
    practico: [
      "CASO PRÁCTICO 1: Eres el encargado de promover un nuevo proyecto de SIAFI, pero las métricas están por debajo de lo previsto y nadie interactúa. ¿Qué pasos tomas para mejorar el alcance?",
      "CASO PRÁCTICO 2: El día de una publicación importante, te das cuenta de que tu material gráfico no tiene likes y además tiene un error ortográfico en el texto. ¿Qué haces en ese momento y qué medidas tomas para el futuro?"
    ]
  }
};

const OPCIONES_NUCLEO = ["Proyectos", "Capacitación", "Organización", "Difusión"];

export default function WorkspaceEvaluacionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const postulanteId = params.id as string;
  const emailPostulante = searchParams.get("email") || "";
  const entrevistaId = searchParams.get("entrevistaId") || postulanteId; 

  const diaEntrevista = searchParams.get("dia");
  const fechaEntrevista = searchParams.get("fecha");
  const horaEntrevista = searchParams.get("hora");

  // ✅ ESTADOS DE NAVEGACIÓN
  const [activeTab, setActiveTab] = useState<"expediente" | "guia" | "evaluacion">("guia");

  // ✅ ESTADOS DEL POSTULANTE
  const [datosPersonales, setDatosPersonales] = useState<Record<string, string> | null>(null);
  const [respuestasPostulante, setRespuestasPostulante] = useState<Array<{pregunta: string, respuesta: string}>>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // ✅ ESTADOS DE LA EVALUACIÓN (Sincronizados)
  const [nucleoPrincipal, setNucleoPrincipal] = useState<string>("");
  const [nucleoSecundario, setNucleoSecundario] = useState<string>("");
  const [respuestasEval, setRespuestasEval] = useState<Record<string, string>>({});
  const [comentariosE1, setComentariosE1] = useState("");
  const [comentariosE2, setComentariosE2] = useState("");
  const [estrellasE1, setEstrellasE1] = useState(0);
  const [estrellasE2, setEstrellasE2] = useState(0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // ==========================================
  // CARGA DEL EXPEDIENTE
  // ==========================================
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    const fetchDetalles = async () => {
      try {
        const res = await fetch(`/api/postulantes/detalle?email=${encodeURIComponent(emailPostulante)}`);
        const data = await res.json();
        if (data.success) {
          setDatosPersonales(data.datosPersonales);
          setRespuestasPostulante(data.respuestasContenido);
        }
      } catch (error) {} finally { setIsLoadingProfile(false); }
    };
    if (emailPostulante) fetchDetalles();
  }, [emailPostulante, status, router]);

  // ==========================================
  // LÓGICA DE AGRUPACIÓN DEL EXPEDIENTE (Mismo diseño)
  // ==========================================
  const bloqueGeneral: Array<{pregunta: string, respuesta: string}> = [];
  const bloqueModulos: Array<{pregunta: string, respuesta: string}> = [];
  
  let enBloqueGeneral = false;
  const tieneAportacion = respuestasPostulante.some(r => r.pregunta.toLowerCase().includes("aportación"));

  respuestasPostulante.forEach(item => {
    const pLower = item.pregunta.toLowerCase();
    if (pLower.includes("aportación")) enBloqueGeneral = true;
    if (enBloqueGeneral || (!tieneAportacion && pLower.includes("expectativas"))) {
      bloqueGeneral.push(item);
      if (pLower.includes("expectativas")) enBloqueGeneral = false;
    } else {
      bloqueModulos.push(item);
    }
  });

  const renderRespuestaExpediente = (texto: string) => {
    if (texto.startsWith("http://") || texto.startsWith("https://")) {
      return (
        <a href={texto} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-gray-800 hover:bg-[#0051ff] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all">
          <span>🔗</span> Abrir Enlace
        </a>
      );
    }
    const lineas = texto.split('\n');
    const esListaDeHabilidades = lineas.some(l => l.match(/^(.*?)(?:[:\-])?\s*([1-5])(?:\/5)?\s*$/i));
    if (esListaDeHabilidades) {
      return (
        <div className="flex flex-col gap-2 mt-2">
          {lineas.map((linea, i) => {
            if (!linea.trim()) return null;
            const match = linea.match(/^(.*?)(?:[:\-])?\s*([1-5])(?:\/5)?\s*$/i);
            if (match) {
              const skill = match[1].trim() || "Habilidad";
              const calificacion = parseInt(match[2], 10);
              return (
                <div key={i} className="flex justify-between items-center bg-[#0a0a0a] px-3 py-2.5 rounded-lg border border-gray-800/50">
                  <span className="text-sm font-bold text-gray-200 truncate pr-2">{skill}</span>
                  <div className="flex gap-1 text-[13px] sm:text-[15px] drop-shadow-[0_0_6px_rgba(250,204,21,0.5)] shrink-0">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className={j < calificacion ? "text-yellow-400" : "text-gray-800"}>★</span>
                    ))}
                  </div>
                </div>
              );
            }
            return <p key={i} className="text-sm text-gray-300 leading-relaxed">{linea}</p>;
          })}
        </div>
      );
    }
    return <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{texto}</p>;
  };

  // ==========================================
  // MOTOR DE SINCRONIZACIÓN EN TIEMPO REAL
  // ==========================================
  const fetchSyncData = async () => {
    try {
      const res = await fetch(`/api/entrevistas/evaluacion?idBloque=${entrevistaId}`);
      const data = await res.json();
      if (data.success && data.data) {
        if (!typingTimeout.current) {
          if (data.data.nucleoPrincipal) setNucleoPrincipal(data.data.nucleoPrincipal);
          if (data.data.nucleoSecundario) setNucleoSecundario(data.data.nucleoSecundario);
          if (data.data.respuestasEval) setRespuestasEval(data.data.respuestasEval);
          if (data.data.comentariosE1) setComentariosE1(data.data.comentariosE1);
          if (data.data.comentariosE2) setComentariosE2(data.data.comentariosE2);
          if (data.data.estrellasE1) setEstrellasE1(data.data.estrellasE1);
          if (data.data.estrellasE2) setEstrellasE2(data.data.estrellasE2);
        }
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (activeTab === "evaluacion" || activeTab === "guia") {
      fetchSyncData();
      const interval = setInterval(fetchSyncData, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const pushSyncData = (payload: any) => {
    setIsSyncing(true);
    fetch("/api/entrevistas/evaluacion", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync", idBloque: entrevistaId, payload })
    }).finally(() => setIsSyncing(false));
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === "nucleoPrincipal") setNucleoPrincipal(value);
    if (field === "nucleoSecundario") setNucleoSecundario(value);
    if (field === "comentariosE1") setComentariosE1(value);
    if (field === "comentariosE2") setComentariosE2(value);
    if (field === "estrellasE1") setEstrellasE1(value);
    if (field === "estrellasE2") setEstrellasE2(value);
    if (field.startsWith("q_")) setRespuestasEval(prev => ({ ...prev, [field]: value }));

    const currentPayload = {
      nucleoPrincipal: field === "nucleoPrincipal" ? value : nucleoPrincipal,
      nucleoSecundario: field === "nucleoSecundario" ? value : nucleoSecundario,
      comentariosE1: field === "comentariosE1" ? value : comentariosE1,
      comentariosE2: field === "comentariosE2" ? value : comentariosE2,
      estrellasE1: field === "estrellasE1" ? value : estrellasE1,
      estrellasE2: field === "estrellasE2" ? value : estrellasE2,
      respuestasEval: field.startsWith("q_") ? { ...respuestasEval, [field]: value } : respuestasEval
    };

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      pushSyncData(currentPayload);
      typingTimeout.current = null;
    }, 1000);
  };

  // ==========================================
  // LÓGICA DE GUARDADO DEFINITIVO
  // ==========================================
  const isFormValid = nucleoPrincipal !== "" && nucleoSecundario !== "" && comentariosE1 !== "" && comentariosE2 !== "" && estrellasE1 > 0 && estrellasE2 > 0;

  const handleSaveEvaluation = async () => {
    if (!isFormValid) return alert("Faltan campos obligatorios por llenar (Núcleos, Comentarios o Estrellas).");
    if (!confirm("¿Estás seguro de finalizar la entrevista? Esto guardará los resultados y actualizará el estatus del candidato.")) return;
    
    setIsSaving(true);
    try {
      const qnaArray: { pregunta: string, respuesta: string }[] = [];
      
      if (nucleoPrincipal && GUIONES[nucleoPrincipal]) {
        GUIONES[nucleoPrincipal].generales.forEach((q, i) => {
          if (respuestasEval[`p_gen_${i}`]) qnaArray.push({ pregunta: q, respuesta: respuestasEval[`p_gen_${i}`] });
        });
        GUIONES[nucleoPrincipal].tecnicas.forEach((q, i) => {
          if (respuestasEval[`p_tec_${i}`]) qnaArray.push({ pregunta: q, respuesta: respuestasEval[`p_tec_${i}`] });
        });
      }
      
      if (nucleoSecundario && GUIONES[nucleoSecundario]) {
        GUIONES[nucleoSecundario].practico.forEach((q, i) => {
          if (respuestasEval[`s_prac_${i}`]) qnaArray.push({ pregunta: q, respuesta: respuestasEval[`s_prac_${i}`] });
        });
      }

      const res = await fetch("/api/entrevistas/evaluacion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save", idBloque: entrevistaId,
          payload: {
            postulanteId,
            postulanteNombre: datosPersonales?.["Nombre Completo"] || "Candidato",
            nucleoPrincipal, nucleoSecundario,
            estrellasE1, estrellasE2, comentariosE1, comentariosE2,
            qnaArray
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("¡Evaluación guardada exitosamente!");
        router.push("/dashboard");
      } else {
        alert("Error al guardar: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // UI COMPONENTS
  // ==========================================
  if (status === "loading" || isLoadingProfile) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-purple-400 animate-pulse">Cargando Workspace...</div>;

  const renderEstrellasEval = (calificacionActual: number, field: string, isInteractive: boolean) => (
    <div className="flex gap-2 text-3xl cursor-pointer drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          onClick={() => isInteractive && handleInputChange(field, star)}
          className={`transition-colors ${star <= calificacionActual ? "text-yellow-400" : "text-gray-800 hover:text-yellow-400/50"}`}
        >★</span>
      ))}
    </div>
  );

  const getPreguntasParaMostrar = () => {
    if (!nucleoPrincipal) return null;
    const gPrincipal = GUIONES[nucleoPrincipal];
    const gSecundario = nucleoSecundario && GUIONES[nucleoSecundario] ? GUIONES[nucleoSecundario] : null;

    return (
      <div className="flex flex-col gap-8 animate-in fade-in">
        {/* BLOQUE PRINCIPAL */}
        <div>
          <h3 className="text-xl font-black text-purple-400 mb-4 border-b border-purple-500/30 pb-2 flex items-center gap-2"><span>🎯</span> {nucleoPrincipal} (Principal)</h3>
          
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Preguntas Generales y de Perfil</h4>
            {gPrincipal.generales.map((p, i) => renderPreguntaInput(p, `p_gen_${i}`))}

            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-8">Preguntas Técnicas</h4>
            {gPrincipal.tecnicas.map((p, i) => renderPreguntaInput(p, `p_tec_${i}`))}
          </div>
        </div>

        {/* BLOQUE SECUNDARIO */}
        {gSecundario && (
          <div className="mt-4 p-5 bg-purple-900/10 border border-purple-500/20 rounded-2xl">
            <h3 className="text-lg font-black text-purple-300 mb-4 flex items-center gap-2"><span>🔄</span> {nucleoSecundario} (Secundario - Casos Prácticos)</h3>
            <div className="space-y-6">
              {gSecundario.practico.map((p, i) => renderPreguntaInput(p, `s_prac_${i}`))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPreguntaInput = (pregunta: string, id: string) => (
    <div key={id} className="bg-[#111111] border border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="flex gap-3 items-start mb-3">
        <span className="text-purple-500 font-black text-lg leading-none mt-0.5">Q.</span>
        <p className="text-sm text-gray-200 font-bold leading-relaxed">{pregunta}</p>
      </div>
      
      {activeTab === "evaluacion" && (
        <div className="mt-4">
          <textarea 
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none min-h-[100px]"
            placeholder="Anota la respuesta o comentarios aquí..."
            value={respuestasEval[id] || ""}
            onChange={(e) => handleInputChange(id, e.target.value)}
          />
        </div>
      )}
    </div>
  );

  const nombre = datosPersonales?.["Nombre Completo"] || "Candidato";
  const carrera = datosPersonales?.["Carrera"] || datosPersonales?.["Licenciatura"] || "Sin carrera registrada";
  const semestre = datosPersonales?.["Semestre"] || "N/A";
  const nucleosString = datosPersonales?.["Núcleo"] || "No especificado";
  const nucleosArray = nucleosString.split(",").map(n => n.trim()).filter(Boolean);
  const cvLink = datosPersonales?.["CV"] || datosPersonales?.["Curriculum"] || Object.values(datosPersonales || {}).find(v => v.startsWith("http") && v.includes("aws"));
  const notasPresidencia = datosPersonales?.["Notas Presidencia"] || "Aún no hay comentarios registrados.";
  const notasLider = datosPersonales?.["Notas Lider"] || "Aún no hay comentarios registrados.";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-28">
      
      <header className="fixed top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center justify-between px-5">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg> Salir
        </button>
        <div className="flex items-center gap-3">
          {isSyncing && <span className="flex items-center gap-1 text-[10px] text-green-400 uppercase tracking-widest font-bold"><span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Sincronizando</span>}
          <h1 className="text-sm font-black tracking-widest uppercase text-purple-400">Workspace</h1>
        </div>
      </header>

      <main className="pt-24 px-4 sm:px-5 max-w-3xl mx-auto">
        
        {/* HEADER DEL CANDIDATO (Configuración inicial) */}
        {activeTab !== "expediente" && (
          <div className="bg-[#111111] border border-purple-500/30 rounded-3xl p-6 shadow-lg mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <h2 className="text-2xl font-black text-white mb-1">{nombre}</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Configuración de la Entrevista</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Núcleo Principal *</label>
                <select 
                  value={nucleoPrincipal} onChange={(e) => handleInputChange("nucleoPrincipal", e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none"
                >
                  <option value="">Selecciona un núcleo...</option>
                  {OPCIONES_NUCLEO.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Núcleo Secundario *</label>
                <select 
                  value={nucleoSecundario} onChange={(e) => handleInputChange("nucleoSecundario", e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none"
                >
                  <option value="">Selecciona un núcleo...</option>
                  {OPCIONES_NUCLEO.filter(n => n !== nucleoPrincipal).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 📑 PESTAÑA: EXPEDIENTE (DISEÑO RESTAURADO, SIN BOTÓN FLOTANTE) */}
        {activeTab === "expediente" && (
          <div className="animate-in fade-in duration-500 pb-8">
            
            {/* TARJETA PRINCIPAL */}
            <div className="bg-[#111111] border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(168,85,247,0.05)] relative overflow-hidden mb-8">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
              
              {(diaEntrevista && fechaEntrevista && horaEntrevista) && (
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
                  <span className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                    📅 {diaEntrevista} {fechaEntrevista} Abr • ⏰ {horaEntrevista}
                  </span>
                </div>
              )}
              
              <div className="flex items-start gap-3 sm:gap-4 mb-5 mt-8 sm:mt-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-purple-400/20 flex items-center justify-center text-purple-400 text-2xl border border-purple-400/20 shrink-0 shadow-inner mt-1">
                  👤
                </div>
                <div className="flex-1 overflow-hidden">
                  <h2 className="text-lg sm:text-2xl font-black text-white leading-tight truncate mb-1">{nombre}</h2>
                  <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 truncate">{carrera}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nucleosArray.map((nucleo, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[9px] font-black uppercase tracking-wider rounded-md">
                        {nucleo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-1">
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 flex flex-col justify-center items-center text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Semestre</p>
                  <p className="text-xl font-black text-white">{semestre}º</p>
                </div>
                {cvLink ? (
                  <a href={cvLink} target="_blank" rel="noreferrer" className="bg-gradient-to-br from-gray-800 to-[#1a1a1a] hover:from-purple-600/40 hover:to-purple-400/40 border border-gray-700 hover:border-purple-400/50 rounded-xl p-3 flex flex-col justify-center items-center text-center transition-all group">
                    <span className="text-xl mb-1 group-hover:scale-110 transition-transform">📄</span>
                    <p className="text-[10px] text-white uppercase tracking-widest font-bold">Ver Currículum</p>
                  </a>
                ) : (
                  <div className="bg-[#0a0a0a] border border-gray-900 opacity-50 rounded-xl p-3 flex flex-col justify-center items-center text-center cursor-not-allowed">
                    <span className="text-xl mb-1 grayscale">📄</span>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Sin CV</p>
                  </div>
                )}
              </div>
            </div>

            {/* BLOQUE UNIFICADO: PERFIL DEL CANDIDATO */}
            {bloqueGeneral.length > 0 && (
              <div className="bg-[#111111] border border-gray-800 rounded-3xl p-5 sm:p-6 mb-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Perfil General</h3>
                </div>
                <div className="flex flex-col gap-6">
                  {bloqueGeneral.map((item, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-2">{item.pregunta}</p>
                      {renderRespuestaExpediente(item.respuesta)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NUEVO BLOQUE: NOTAS ADMINISTRATIVAS */}
            <div className="bg-[#111111] border border-gray-800 rounded-3xl p-5 sm:p-6 mb-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Notas Internas</h3>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><span>👑</span> Presidencia</p>
                  <div className="bg-[#0a0a0a] p-4 rounded-xl border border-gray-800/50">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${datosPersonales?.["Notas Presidencia"] ? 'text-gray-300' : 'text-gray-600 italic'}`}>{notasPresidencia}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><span>🎯</span> Líder de Núcleo</p>
                  <div className="bg-[#0a0a0a] p-4 rounded-xl border border-gray-800/50">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${datosPersonales?.["Notas Lider"] ? 'text-gray-300' : 'text-gray-600 italic'}`}>{notasLider}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MÓDULOS TÉCNICOS Y NÚCLEOS */}
            {bloqueModulos.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6 px-2">
                  <span className="w-2 h-2 rounded-full bg-[#00baff]"></span>
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Evaluación de Núcleos</h3>
                </div>
                <div className="bg-[#111111] border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-8">
                  {bloqueModulos.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex gap-3 items-start mb-3">
                        <span className="text-[#0051ff] font-black text-lg leading-none mt-0.5">Q.</span>
                        <p className="text-sm text-[#00baff] font-bold leading-relaxed">{item.pregunta}</p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-[2px] bg-gray-800 ml-2.5 mt-1 self-stretch rounded-full"></div>
                        <div className="flex-1 pb-2 overflow-hidden">
                          {renderRespuestaExpediente(item.respuesta)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📑 PESTAÑAS: GUÍA Y EVALUACIÓN */}
        {(activeTab === "guia" || activeTab === "evaluacion") && (
          <div>
            {!nucleoPrincipal ? (
              <div className="bg-[#111111] border border-dashed border-gray-700 rounded-3xl p-10 text-center flex flex-col items-center justify-center opacity-70">
                <span className="text-5xl mb-4 grayscale">📂</span>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Esperando Núcleos</p>
                <p className="text-xs text-gray-500 mt-2">Selecciona el núcleo principal arriba para cargar el guión.</p>
              </div>
            ) : (
              getPreguntasParaMostrar()
            )}

            {/* SECCIÓN FINAL DE EVALUACIÓN */}
            {(activeTab === "evaluacion" && nucleoPrincipal) && (
              <div className="mt-12 bg-gradient-to-b from-[#111111] to-[#0a0a0a] border border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                <h3 className="text-xl font-black text-white mb-6 text-center">Veredicto Final</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl">
                    <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-4">Entrevistador 1 *</p>
                    <textarea 
                      className="w-full bg-[#111111] border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:border-purple-500 outline-none resize-none mb-4"
                      placeholder="Conclusiones y observaciones generales..."
                      rows={4} value={comentariosE1} onChange={(e) => handleInputChange("comentariosE1", e.target.value)}
                    />
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Calificación Final</p>
                      {renderEstrellasEval(estrellasE1, "estrellasE1", true)}
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-gray-800 p-5 rounded-2xl">
                    <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-4">Entrevistador 2 *</p>
                    <textarea 
                      className="w-full bg-[#111111] border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:border-purple-500 outline-none resize-none mb-4"
                      placeholder="Conclusiones y observaciones generales..."
                      rows={4} value={comentariosE2} onChange={(e) => handleInputChange("comentariosE2", e.target.value)}
                    />
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Calificación Final</p>
                      {renderEstrellasEval(estrellasE2, "estrellasE2", true)}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveEvaluation} disabled={isSaving || !isFormValid}
                  className={`w-full mt-8 py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isFormValid ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30" : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isSaving ? "Guardando en Base de Datos..." : "💾 Guardar Evaluación Definitiva"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full bg-[#111111]/95 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-around items-center h-20 px-4 max-w-md mx-auto">
          
          <button onClick={() => setActiveTab("expediente")} className={`flex flex-col items-center justify-center w-20 transition-all ${activeTab === "expediente" ? "text-purple-400 scale-110" : "text-gray-500 hover:text-gray-300"}`}>
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">Perfil</span>
          </button>

          <button onClick={() => setActiveTab("guia")} className={`flex flex-col items-center justify-center w-20 transition-all ${activeTab === "guia" ? "text-purple-400 scale-110" : "text-gray-500 hover:text-gray-300"}`}>
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">Guía</span>
          </button>

          <button onClick={() => setActiveTab("evaluacion")} className={`flex flex-col items-center justify-center w-20 transition-all ${activeTab === "evaluacion" ? "text-purple-400 scale-110 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "text-gray-500 hover:text-gray-300"}`}>
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">Evaluar</span>
          </button>

        </div>
      </nav>
    </div>
  );
}