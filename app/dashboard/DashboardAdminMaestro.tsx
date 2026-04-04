"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 
import OneSignal from 'react-onesignal';

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FECHAS_S1 = [6, 7, 8, 9, 10, 11, 12];
const FECHAS_S2 = [13, 14, 15, 16, 17, 18, 19];

// =========================================================
// 🧠 BANCO DE PREGUNTAS (ÍNTEGRO)
// =========================================================
const GUIONES: Record<string, Record<string, string[]>> = {
  "Proyectos": {
    "Contexto y fit inicial": [
      "1. Nombre, semestre, carrera y unidad académica.",
      "2. ¿Por qué elegiste tu carrera?",
      "3. ¿Qué te interesa construir, aprender o resolver actualmente?",
      "4. ¿Por qué te interesa entrar a SIAFI?",
      "5. ¿Por qué elegiste específicamente el núcleo de Proyectos?"
    ],
    "Forma de trabajo y ejecución": [
      "1. Cuéntanos un proyecto, actividad o experiencia donde hayas tenido una responsabilidad real. ¿Cuál fue tu rol y qué entregaste tú?",
      "2. ¿Cuál consideras que es tu principal fortaleza al trabajar en equipo?",
      "3. ¿Qué aspecto de tu forma de trabajar hoy necesitas mejorar?",
      "4. Si te asignan una tarea que no sabes hacer, ¿qué haces en las primeras 24 horas?",
      "5. Si vas retrasado en una entrega y tu equipo depende de ti, ¿cómo lo manejarías?",
      "6. Tienes 3 proyectos finales y además trabajo en SIAFI durante el mismo periodo. ¿Cómo te organizarías?",
      "7. ¿Qué te distingue de otros candidatos?"
    ],
    "Fit con SIAFI y compromiso": [
      "1. ¿Qué conoces de SIAFI?",
      "2. ¿Has visto nuestras redes, proyectos o actividades? ¿Qué te llamó la atención?",
      "3. ¿Qué mejorarías de la forma en que comunicamos lo que hacemos?",
      "4. ¿Qué podrías aportar a SIAFI y específicamente al núcleo de Proyectos?",
      "5. ¿Qué te gustaría construir o impulsar dentro del núcleo?",
      "6. ¿Cuánto tiempo real puedes dedicarle a la sociedad por semana?"
    ],
    "Parte técnica": [
      "1. Con tus propias palabras, ¿qué es la inteligencia artificial?",
      "2. ¿Cómo describirías tu nivel técnico actual?",
      "3. ¿Qué herramientas, lenguajes o tecnologías has usado?",
      "4. ¿Cómo te gustaría aplicar IA en un proyecto real dentro de tus áreas de interés?",
      "5. Si su nivel es básico: ¿Qué te interesa aprender primero y por qué?"
    ],
    "Parte Práctica": [
      "Opción A (Explicación de código): Explícanos qué problema resuelve. ¿Cómo está estructurado? ¿Por qué tomaste esas decisiones? ¿Qué mejorarías?",
      "Opción B (Evaluación oral 1): ¿Cómo resolverías el problema de encontrar el número más frecuente en una lista?",
      "Opción B (Evaluación oral 2): Imagina que tu equipo en SIAFI debe desarrollar un proyecto pequeño de IA en 6 semanas. ¿Cómo organizarías el trabajo desde el inicio?"
    ],
    "Cierre": [
      "1. ¿Hay algo importante sobre ti que no te hayamos preguntado y que consideres relevante?",
      "2. ¿Qué tendría que pasar este semestre para que podamos decir que fue una buena decisión integrarte al núcleo?",
      "3. ¿Tienes alguna duda?"
    ]
  },
  "Capacitación": {
    "Relax": [
      "1. Nombre",
      "2. Semestre y unidad académica",
      "3. ¿Cuál es y por qué elegiste tu carrera?: Metas y visión personal",
      "4. ¿Cuál es tu animal favorito?: Percepción personal sutil",
      "5. Hobbies: Información variada"
    ],
    "Preguntas Personales": [
      "1. ¿Cuál es tu mayor fortaleza? ¿Tu mayor debilidad?",
      "2. ¿Cuáles son tus habilidades?",
      "3. ¿Cuál es tu superpoder?",
      "4. ¿Cuál es el valor que más te distingue?",
      "5. Supongamos que tienes que entregar dos trabajos a la misma hora, un trabajo personal importante y una parte de un trabajo en equipo, por procrastinar ahora solo tienes tiempo para hacer uno. ¿Qué es lo que harías?",
      "6. Cuéntanos una experiencia donde hayas asumido el rol de líder. ¿Cómo resultó?",
      "7. Tienes 3 proyectos finales y el proyecto de SIAFI, todos se entregan en 2 meses. ¿Cómo te organizas?",
      "8. ¿Consideras el trabajo remoto como una opción viable para el trabajo dentro de la sociedad?",
      "9. ¿Qué te distingue de otros candidatos?"
    ],
    "Preguntas de SIAFI": [
      "1. ¿Cómo conociste a SIAFI?",
      "2. ¿Nos sigues en redes sociales? a. ¿Has visto nuestras publicaciones y contenido? i. ¿Qué mejorarías de nuestras redes?",
      "3. ¿Por qué de todas las asociaciones elegiste a SIAFI, que te animó?",
      "4. ¿Conoces los cursos o talleres que SIAFI ha impartido en semestres pasados? ¿Cuál te interesó más?",
      "5. ¿Tienes alguna idea para realizar dentro del núcleo de Capacitación?",
      "6. ¿Qué podrías aportar a SIAFI y en particular a tu/s núcleo/s?",
      "7. ¿Qué esperas de unirte a SIAFI?",
      "8. ¿Cuánto tiempo le planeas dedicar a la sociedad?"
    ],
    "Preguntas Técnicas": [
      "1. Con tus propias palabras, ¿Nos puedes decir qué es la inteligencia artificial?",
      "2. ¿Cómo describirías tus conocimientos y habilidades de inteligencia artificial? a. ¿Qué es lo que te gusta de la inteligencia artificial?",
      "3. ¿Qué es lo que más te intriga de la inteligencia artificial de camino al futuro?",
      "4. ¿Qué aplicaciones conoces de la IA? Pueden ser aplicaciones de la vida diaria o aplicaciones más técnicas a la industria.",
      "5. Dentro de tus áreas de interés profesional, ¿te gustaría poder aplicar la IA en algún aspecto?"
    ],
    "Parte Práctica": [
      "Evaluación técnica de codificación (3 minutos máximo): El candidato explicará el código que eligió para mostrarlo durante la entrevista. Se espera que explique el propósito del código, su lógica, y cualquier decisión clave de diseño que haya tomado.",
      "Resolución de Problemas (Si no llevó código): ¿Cómo resolverías el problema de encontrar el número más frecuente en una lista de números?",
      "Explicación de un Algoritmo Básico (Si no llevó código): ¿Puedes explicarnos cómo funciona el algoritmo de ordenamiento por burbuja (bubble sort)?"
    ]
  },
  "Organización": {
    "Introducción y Preguntas Personales": [
      "Nombre, semestre y carrera",
      "¿Por qué elegiste tú carrera?",
      "¿Cuáles son tus hobbies?",
      "¿Cuáles son tus habilidades?",
      "¿Cuál es el valor que más te distingue? ¿Por qué?"
    ],
    "Forma de trabajo": [
      "En organización trabajamos constantemente en equipo. ¿Cuáles crees que sean las claves para poder realizarlo de la mejor forma?",
      "¿Qué harías si surge un inconveniente con un miembro de tu equipo que frena el avance del trabajo asignado?",
      "Si requieres dar avances del trabajo que has realizado a lo largo de los días ¿Cómo lo presentarías? Es decir, ¿qué elementos y material incluirías?",
      "Debido a los diferentes horarios de los miembros, solemos trabajar a distancia. ¿Cómo te sientes con esta dinámica de trabajo?",
      "En organización constantemente tenemos que hablar con directivos, profesores, patrocinadores y otros compañeros de la sociedad. ¿Te consideras alguien con facilidad de palabra?"
    ],
    "Preguntas Técnicas": [
      "Con tus propias palabras, ¿Nos puedes decir qué es la inteligencia artificial?",
      "¿Qué es lo que más te atrae de la inteligencia artificial de camino al futuro?",
      "¿Por qué te interesa profundizar e impulsar el desarrollo de la IA?"
    ],
    "Preguntas de SIAFI": [
      "¿Cómo conociste a SIAFI?",
      "En la facultad hay diversas asociaciones, ¿Por qué elegiste SIAFI?, ¿Por qué el núcleo de organización?",
      "¿Qué esperas de unirte a SIAFI?",
      "¿Qué crees que puedas aportar a la sociedad, en específico a organización?",
      "¿Cuánto tiempo crees que podrías dedicarle a la sociedad por semana?"
    ],
    "Preguntas del núcleo": [
      "¿Por qué te gustaría ingresar al núcleo de organización?. Cuéntanos en detalle las razones.",
      "¿Cuál crees que es la base para una correcta organización? (Ya sea en la vida personal, escolar o laboral)",
      "¿Has coordinado algún equipo de trabajo o algún evento?. Cuéntanos al respecto, no importa que sean pequeños o escolares.",
      "¿Ocupas alguna herramienta para organizarte?. Mencionanos cuál o cuáles utilizas",
      "A la hora de organizar un evento, ¿cuál crees que es uno de los detalles que la mayoría de la gente olvida y puede hacer que el evento falle?"
    ],
    "Parte Práctica": [
      "Imagina que eres parte del núcleo de Organización y estamos a una semana de nuestro evento de bienvenida. Un miembro de tu equipo, que tiene tareas urgentes asignadas, te deja en \"visto\" durante tres días y no avanza. ¿Cómo manejas la situación para que el evento se lleve a cabo sin problemas?",
      "¿Qué harías si necesitas información urgente de algún otro núcleo (Difusión, Capacitación o Proyectos) para poder avanzar con un evento, pero no te están respondiendo los mensajes?"
    ]
  },
  "Difusión": {
    "Relax": [
      "1. Nombre",
      "2. Semestre y facultad a la que perteneces",
      "3. ¿Cuál es y por qué elegiste tu carrera?: Metas y visión personal",
      "4. ¿Cual es tu animal favorito?: Percepción personal sutil",
      "5. Hobbies: Información variada"
    ],
    "Preguntas Personales": [
      "1. ¿Cuál es tu mayor fortaleza? ¿Tu mayor debilidad?",
      "2. ¿Cuáles son tus habilidades?",
      "3. ¿Cuál es tu superpoder?",
      "4. ¿Cuál es el valor que más te distingue?",
      "5. ¿Qué tan bueno eres para comunicar tus ideas?",
      "6. ¿Cuál es tu habilidad blanda más fuerte?",
      "7. Supongamos que tienes que entregar dos trabajos a la misma hora, un trabajo personal importante y una parte de un trabajo en equipo, por procrastinar ahora solo tienes tiempo para hacer uno. ¿Qué es lo que harías?",
      "8. ¿Qué tan cómodo te sientes trabajando en equipo?",
      "9. ¿Qué es lo que más valoras en el trabajo en equipo?",
      "10. Tienes 3 proyectos finales y el proyecto de SIAFI, todos se entregan en 2 meses. ¿Cómo te organizas?",
      "11. ¿Qué te distingue de otros candidatos?"
    ],
    "Preguntas de SIAFI": [
      "1. ¿Cómo conociste a SIAFI?",
      "2. ¿Nos sigues en redes sociales? a. ¿Has visto nuestras publicaciones y contenido? i. ¿Qué mejorarías de nuestras redes?",
      "3. ¿Por qué de todas las asociaciones elegiste a SIAFI, que te animó?",
      "4. ¿Conoces los proyectos que se realizaron en SIAFI en semestres pasados? ¿Cuál te interesó más?",
      "5. ¿Qué podrías aportar a SIAFI y en particular a tu/s núcleo/s?",
      "6. ¿Qué esperas de unirte a SIAFI?",
      "7. ¿Cuánto tiempo le planeas dedicar a la sociedad?"
    ],
    "Preguntas Técnicas": [
      "1. Con tus propias palabras, ¿Nos puedes decir qué es la inteligencia artificial?",
      "2. ¿Cómo describirías tus conocimientos y habilidades de inteligencia artificial?",
      "3. ¿Por qué te interesa difundir la IA?",
      "4. ¿Te consideras una persona creativa?",
      "5. Cuando te han pedido exponer un tema ¿cómo te sientes?",
      "6. ¿Has manejado algún tipo de red social antes? ¿Cuáles y con qué propósito?",
      "7. ¿Cuál es tu red social favorita y porque?",
      "8. ¿Has aplicado alguna estrategia de mercadotecnia en algún proyecto escolar o de trabajo?",
      "9. ¿Tienes alguna noción en diseño? ¿Cuál es?",
      "10. ¿Qué herramientas de edición de video o imagen sabes usar?"
    ],
    "Parte Práctica": [
      "Supón que eres parte del núcleo de Difusión y estás encargado de promover un nuevo proyecto. Te enteras de que la campaña de promoción actual no está generando el interés esperado y las métricas están por debajo de lo previsto. ¿Qué pasos tomarías para mejorar la visibilidad y el alcance de la campaña?",
      "Supón que eres parte del equipo de Difusión y te asignaron elaborar una publicación para redes sociales sobre un evento importante de SIAFI. El día de la publicación, te das cuenta que el material gráfico que preparaste no está teniendo interacción (casi nadie le da like, comentar o compartir), y además detectamos que hay un error menor en el texto. ¿Qué harías en ese momento para resolver la situación de inmediato? ¿Qué medidas tomarías después para aprender de lo ocurrido y mejorar las próximas publicaciones?",
      "Supón que formas parte de Difusión y se te asigna la creación de un post para redes sociales sobre un evento importante de SIAFI. Tienes una semana de plazo para entregarlo. Sin embargo, a mitad de semana te das cuenta que también tienes proyectos propios y tareas de la escuela que requieren bastante tiempo. ¿Cómo organizarías tus actividades para cumplir con la entrega del post sin descuidar tus responsabilidades académicas? En caso de sentir que no alcanzarías a terminarlo, ¿qué pasos tomarías para asegurar que el equipo no se vea afectado?"
    ]
  }
};

const OPCIONES_NUCLEO = ["Proyectos", "Capacitación", "Organización", "Difusión"];

export default function DashboardAdminMaestro() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("control");

  // ESTADOS PURGA
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{success?: boolean, message?: string} | null>(null);

  // ESTADOS CURSOS
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [cursoForm, setCursoForm] = useState({ titulo: "", descripcion: "", url: "" });
  const [isSavingCurso, setIsSavingCurso] = useState(false);
  const [cursoResult, setCursoResult] = useState<{success?: boolean, message?: string} | null>(null); 

  // ESTADOS GENERACIÓN DE BLOQUES
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<{success?: boolean, message?: string} | null>(null);

  // ESTADOS BLOQUEO GLOBAL DE HORARIOS
  const [isGlobalLockActive, setIsGlobalLockActive] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);

  // ESTADOS HORARIO
  const [semana, setSemana] = useState(1);
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);
  const [isSavingHorario, setIsSavingHorario] = useState(false);
  const [saveSuccessHorario, setSaveSuccessHorario] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isLockedHorario, setIsLockedHorario] = useState(false);
  const [showConfirmHorarioModal, setShowConfirmHorarioModal] = useState(false);
  const hasLoadedSchedule = useRef(false);

  // ESTADOS ENTREVISTADOR
  const [misEntrevistas, setMisEntrevistas] = useState<any[]>([]);
  const [isLoadingEntrevistas, setIsLoadingEntrevistas] = useState(false);
  const [intercambios, setIntercambios] = useState<any[]>([]);
  const [isLoadingIntercambios, setIsLoadingIntercambios] = useState(false);
  const [isProcessingSwap, setIsProcessingSwap] = useState(false);
  const [guiaActiva, setGuiaActiva] = useState<string | null>(null);

  const [modalInfo, setModalInfo] = useState<{
    isOpen: boolean; title: string; message: string; icon: string; confirmText: string; isError?: boolean; onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", icon: "", confirmText: "Confirmar", isError: false, onConfirm: () => {} });
  
  const { data: session, status } = useSession();

  const HORAS = useMemo(() => {
    const h = [];
    for (let i = 9; i < 21; i++) {
      for (let m of ["00", "15", "30", "45"]) {
        h.push(`${i.toString().padStart(2, '0')}:${m}`);
      }
    }
    return h;
  }, []);

  useEffect(() => {
    // @ts-ignore
    if (session?.error === "UserDeleted") signOut({ callbackUrl: '/login' });
  }, [session]);

  const fetchNotificaciones = async () => {
    if (session?.user?.email) {
      try {
        const res = await fetch(`/api/notifications?email=${session.user.email}`);
        const data = await res.json();
        if (data.notificaciones && Array.isArray(data.notificaciones)) setNotificaciones(data.notificaciones);
      } catch (error) {}
    }
  };

  const cargarHorario = async () => {
    if (!session?.user?.email || hasLoadedSchedule.current) return;
    setIsLoadingSchedule(true);
    try {
      const res = await fetch(`/api/availability?email=${session.user.email}`);
      if (res.ok) {
        const data = await res.json();
        if (data.horarios && Array.isArray(data.horarios) && data.horarios.length > 0) {
          setDisponibilidad(data.horarios);
          setIsLockedHorario(true); 
        }
      }
      hasLoadedSchedule.current = true;
    } catch (error) {} finally { setIsLoadingSchedule(false); }
  };

  const checkGlobalLock = async () => {
    try {
      const res = await fetch("/api/admin/toggle-lock");
      const data = await res.json();
      setIsGlobalLockActive(data.isLocked === true);
    } catch (error) {}
  };

  const fetchMisEntrevistas = async () => {
    if (!session?.user?.name) return;
    setIsLoadingEntrevistas(true);
    try {
      const res = await fetch(`/api/entrevistas/mis-asignaciones?entrevistador=${encodeURIComponent(session.user.name)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.entrevistas)) {
        setMisEntrevistas(data.entrevistas);
      }
    } catch (error) {} finally { setIsLoadingEntrevistas(false); }
  };

  const fetchIntercambios = async () => {
    setIsLoadingIntercambios(true);
    try {
      const res = await fetch("/api/entrevistas/intercambios");
      const data = await res.json();
      if (data.success && Array.isArray(data.intercambios)) {
        setIntercambios(data.intercambios);
      }
    } catch (error) {} finally { setIsLoadingIntercambios(false); }
  };

  const fetchAlertasCambio = async () => {
    if (!session?.user?.name) return;
    try {
      const res = await fetch(`/api/entrevistas/intercambios/alertas?entrevistador=${encodeURIComponent(session.user.name)}`);
      const data = await res.json();
      
      if (data.success && Array.isArray(data.alertas) && data.alertas.length > 0) {
        const alerta = data.alertas[0];
        setModalInfo({
          isOpen: true,
          title: "¡Intercambio Aceptado!",
          message: `El entrevistador ${alerta.entrante || "alguien"} ha aceptado cubrir tu entrevista con el candidato ${alerta.postulante || "asignado"}. Ya ha sido removida de tu agenda.`,
          icon: "🎉", confirmText: "Entendido", isError: false,
          onConfirm: async () => {
            setModalInfo(prev => ({ ...prev, isOpen: false }));
            if (alerta.idBloque) await fetch(`/api/entrevistas/intercambios/alertas?idBloque=${alerta.idBloque}`, { method: 'DELETE' });
            fetchMisEntrevistas();
          }
        });
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotificaciones();
      cargarHorario();
      checkGlobalLock();
    }
  }, [status, session]);

  useEffect(() => {
    if (activeTab === "panel" && status === "authenticated") {
      fetchMisEntrevistas();
      fetchAlertasCambio(); 
    }
    if (activeTab === "intercambios" && status === "authenticated") fetchIntercambios();
  }, [activeTab, status]);

  const handleSwapAction = async (action: "solicitar" | "cancelar" | "aceptar", idBloque: string, saliente?: string, postulante?: string) => {
    setIsProcessingSwap(true);
    try {
      const res = await fetch("/api/entrevistas/intercambios", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, idBloque, miNombre: session?.user?.name, entrevistadorSaliente: saliente, postulante })
      });
      const data = await res.json();

      if (!data.success) {
        setModalInfo({
          isOpen: true, title: "Acción Denegada", message: data.error || "No se pudo procesar la solicitud.",
          icon: "❌", confirmText: "Entendido", isError: true,
          onConfirm: () => setModalInfo(prev => ({ ...prev, isOpen: false }))
        });
        setIsProcessingSwap(false);
        return;
      }
      window.location.reload();
    } catch (error) { setIsProcessingSwap(false); }
  };

  const solicitarIntercambio = (idBloque: string) => {
    setModalInfo({
      isOpen: true, title: "Solicitar Intercambio", message: "¿Estás seguro de solicitar un intercambio? Tu entrevista quedará en el Sistema de Cambios hasta que alguien más la acepte.",
      icon: "🔄", confirmText: "Solicitar Intercambio", isError: false, onConfirm: () => handleSwapAction("solicitar", idBloque)
    });
  };

  const cancelarIntercambio = (idBloque: string) => {
    setModalInfo({
      isOpen: true, title: "Cancelar Solicitud", message: "¿Deseas cancelar tu solicitud de intercambio? Recuperarás la entrevista y ya no será visible en el Sistema de Cambios.",
      icon: "↩️", confirmText: "Sí, Cancelar", isError: false, onConfirm: () => handleSwapAction("cancelar", idBloque)
    });
  };

  const aceptarIntercambio = (idBloque: string, saliente: string, postulante: string) => {
    setModalInfo({
      isOpen: true, title: "Aceptar Intercambio", message: `¿Estás seguro de cubrir a ${saliente} en esta entrevista? Se agregará a tu agenda de forma inmediata.`,
      icon: "✅", confirmText: "Aceptar Entrevista", isError: false, onConfirm: () => handleSwapAction("aceptar", idBloque, saliente, postulante)
    });
  };

  useEffect(() => {
    const initOneSignal = async () => {
      if (typeof window !== "undefined" && session?.user?.email) {
        try {
          await OneSignal.init({ appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "", allowLocalhostAsSecureOrigin: true });
          OneSignal.Slidedown.promptPush();
          OneSignal.login(session.user.email);
        } catch (error) {}
      }
    };
    initOneSignal();
  }, [session]);

  const ejecutarPurga = async () => {
    if (purgeConfirmText !== "PURGAR") return;
    setIsPurging(true);
    setPurgeResult(null);
    try {
      const res = await fetch("/api/admin/purge-miembros", { method: "POST" });
      const data = await res.json();
      if (res.ok) { setPurgeResult({ success: true, message: data.message }); } 
      else { setPurgeResult({ success: false, message: data.error || "Ocurrió un error." }); }
    } catch (error) {
      setPurgeResult({ success: false, message: "Fallo de conexión con el servidor." });
    } finally {
      setIsPurging(false);
      setPurgeConfirmText("");
    }
  };

  const guardarCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCurso(true);
    setCursoResult(null);
    try {
      const res = await fetch("/api/cursos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cursoForm)
      });
      if (res.ok) {
        setCursoForm({ titulo: "", descripcion: "", url: "" });
        setCursoResult({ success: true, message: "El video ha sido publicado exitosamente en el dashboard de los entrevistadores." });
      } else {
        setCursoResult({ success: false, message: "Ocurrió un error al intentar publicar el curso en la base de datos." });
      }
    } catch (error) {
      setCursoResult({ success: false, message: "Error de conexión con el servidor." });
    } finally { setIsSavingCurso(false); }
  };

  const generarBloques = async () => {
    setIsGenerating(true);
    setGenerateResult(null);
    try {
      const res = await fetch("/api/admin/generate-blocks", { method: "POST" });
      const data = await res.json();
      if (res.ok) { setGenerateResult({ success: true, message: data.message }); } 
      else { setGenerateResult({ success: false, message: data.error || "Ocurrió un error." }); }
    } catch (error) {
      setGenerateResult({ success: false, message: "Error de red al intentar generar bloques." });
    } finally { setIsGenerating(false); }
  };

  const triggerGlobalLockToggle = () => setShowLockConfirmModal(true);

  const executeGlobalLock = async () => {
    setIsTogglingLock(true);
    try {
      const res = await fetch("/api/admin/toggle-lock", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lock: !isGlobalLockActive })
      });
      if (res.ok) {
        setIsGlobalLockActive(!isGlobalLockActive);
        setShowLockConfirmModal(false);
      } else { alert("Error al intentar cambiar el estado de bloqueo."); }
    } catch (error) { alert("Error de conexión al servidor."); } 
    finally { setIsTogglingLock(false); }
  };

  const toggleSlot = (slotId: string) => {
    if (isLockedHorario || isGlobalLockActive) return;
    setDisponibilidad((prev) => prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]);
  };

  const confirmarYGuardarHorario = () => setShowConfirmHorarioModal(true);

  const guardarHorario = async () => {
    setShowConfirmHorarioModal(false);
    if (!session?.user?.email) return;
    setIsSavingHorario(true);
    setSaveSuccessHorario(false);

    try {
      const res = await fetch("/api/availability", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: session.user.name, email: session.user.email, horarios: disponibilidad, horasTotales: disponibilidad.length * 0.25 }),
      });

      if (res.ok) {
        setSaveSuccessHorario(true);
        setIsLockedHorario(true); 
        setTimeout(() => setSaveSuccessHorario(false), 3000);
      }
    } catch (error) {} finally { setIsSavingHorario(false); }
  };

  const safeNotificaciones = Array.isArray(notificaciones) ? notificaciones : [];
  const unreadCount = safeNotificaciones.filter(n => n && !n.leida).length;
  const safeMisEntrevistas = Array.isArray(misEntrevistas) ? misEntrevistas : [];
  const safeIntercambios = Array.isArray(intercambios) ? intercambios : [];

  const marcarComoLeida = async (id: string, leidaActual: boolean) => {
    if (leidaActual) return; 
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, leida: true }) });
  };

  const borrarNotificacion = async (id: string) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-yellow-500 animate-pulse">Cargando tu perfil...</div>;
  }

  const userName = session?.user?.name || "Admin Supremo";
  const userEmail = session?.user?.email || "Sin correo";
  // @ts-ignore
  const userAvatar = session?.user?.avatar; 
  
  const primerNombre = userName.split(" ")[0];
  const iniciales = userName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const AvatarCircle = ({ size }: { size: string }) => (
    <div className={`${size} rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 p-[2px] shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.3)]`}>
      <div className="w-full h-full rounded-full bg-[#111111] overflow-hidden flex items-center justify-center">
        {userAvatar ? <img src={userAvatar} alt="Perfil" className="w-full h-full object-cover" /> : <span className={`${size === 'w-9 h-9' ? 'text-xs' : 'text-sm'} font-bold text-white`}>{iniciales}</span>}
      </div>
    </div>
  );

  const renderActiveContent = () => {
    const fechasActivas = semana === 1 ? FECHAS_S1 : FECHAS_S2;

    switch (activeTab) {
      
      case "control":
        return (
          <main className="pt-24 pb-28 px-5 max-w-4xl mx-auto min-h-screen animate-in fade-in duration-300">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="text-yellow-500">⚙️</span> Panel de Control
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Acciones Administrativas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className={`bg-[#111111] border ${isGlobalLockActive ? 'border-orange-500' : 'border-orange-500/30'} rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-orange-500 transition-all`}>
                <div>
                  <div className={`w-10 h-10 rounded-full ${isGlobalLockActive ? 'bg-orange-500 text-[#0a0a0a]' : 'bg-orange-500/10 text-orange-500'} flex items-center justify-center text-xl mb-4 transition-colors`}>
                    {isGlobalLockActive ? '🔒' : '🔓'}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Bloqueo de Horarios</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Congela el registro de disponibilidad en toda la plataforma. Ningún Entrevistador ni Administrador podrá modificar sus horarios. Ideal para evitar cambios de última hora antes de generar los bloques.
                  </p>
                </div>
                <button onClick={triggerGlobalLockToggle} className={`w-full py-3 font-bold text-sm uppercase tracking-wider rounded-xl transition-all border ${isGlobalLockActive ? "bg-orange-500 text-[#0a0a0a] border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:bg-orange-400" : "bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-[#0a0a0a] border-orange-500/30 hover:border-orange-500"}`}>
                  {isGlobalLockActive ? "Desbloquear Sistema" : "Bloquear Sistema"}
                </button>
              </div>

              <div className="bg-[#111111] border border-green-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-green-500/60 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xl mb-4">🧩</div>
                  <h3 className="text-lg font-bold text-white mb-2">Generar Bloques</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Cruza los horarios de todos los entrevistadores y genera automáticamente bloques de 1 hora (2 entrevistadores por bloque) listos para que los postulantes reserven.
                  </p>
                </div>
                <button onClick={() => { setShowGenerateModal(true); setGenerateResult(null); }} className="w-full py-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-[#0a0a0a] font-bold text-sm uppercase tracking-wider rounded-xl transition-all border border-green-500/30 hover:border-green-500">
                  Construir Horarios
                </button>
              </div>

              <div className="bg-[#111111] border border-[#0051ff]/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-[#0051ff]/60 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-full bg-[#00baff]/10 text-[#00baff] flex items-center justify-center text-xl mb-4">📺</div>
                  <h3 className="text-lg font-bold text-white mb-2">Publicar Curso</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Sube un nuevo video de capacitación de YouTube al dashboard de los entrevistadores. Se mostrará inmediatamente para todos.
                  </p>
                </div>
                <button onClick={() => { setShowCursoModal(true); setCursoResult(null); }} className="w-full py-3 bg-[#0051ff]/10 hover:bg-[#0051ff] text-[#00baff] hover:text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all border border-[#0051ff]/30 hover:border-[#0051ff]">
                  Agregar Video
                </button>
              </div>

              <div className="bg-[#111111] border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between group hover:border-red-500/60 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-xl mb-4">🧹</div>
                  <h3 className="text-lg font-bold text-white mb-2">Purga de "Miembros"</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Busca todas las cuentas registradas erróneamente con el rol <span className="text-white font-mono bg-gray-800 px-1 rounded">Miembro</span>. Les enviará un correo con las instrucciones correctas y el enlace de postulación.
                  </p>
                </div>
                <button onClick={() => { setShowPurgeModal(true); setPurgeResult(null); setPurgeConfirmText(""); }} className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all border border-red-500/30 hover:border-red-500">
                  Configurar Purga
                </button>
              </div>

            </div>
          </main>
        );

      case "postulantes":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-4 text-white">Base de Postulantes</h2>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm shadow-xl">
              <p>Revisa el estatus, CVs y respuestas de los candidatos del reclutamiento.</p>
            </div>
          </main>
        );

      case "mi-horario":
        return (
          <main className="pt-24 pb-28 px-3 max-w-2xl mx-auto min-h-screen animate-in fade-in duration-300 select-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Mi Disponibilidad</h2>
                {(isLockedHorario || isGlobalLockActive) && (
                  <p className={`text-[10px] ${isGlobalLockActive ? 'text-orange-500' : 'text-green-400'} font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1`}>
                    <span>🔒</span> {isGlobalLockActive ? 'Bloqueado por Sistema' : 'Registrado'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-yellow-500">
                  {disponibilidad.length * 0.25}
                  <span className="text-sm text-gray-500 font-medium"> hrs</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4 bg-[#111111] p-1.5 rounded-xl border border-gray-800">
              <button onClick={() => setSemana(1)} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 1 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Semana 1 (6-12 Abr)</button>
              <button onClick={() => setSemana(2)} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Semana 2 (13-19 Abr)</button>
            </div>

            <div className={`bg-[#111111] border rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden relative transition-all ${(isLockedHorario || isGlobalLockActive) ? 'border-green-500/30' : 'border-gray-800'} ${isGlobalLockActive ? 'border-orange-500/30' : ''}`}>
              {isLoadingSchedule ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs text-gray-400">Cargando horario...</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="grid grid-cols-[35px_repeat(7,_1fr)] gap-[2px] sm:gap-1 mb-2">
                    <div className="col-span-1"></div>
                    {DIAS_SEMANA.map((dia, idx) => (
                      <div key={dia} className="text-center flex flex-col items-center">
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-bold">{dia.slice(0,3)}</span>
                        <span className="text-[11px] sm:text-xs text-white font-black">{fechasActivas[idx]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-[2px]">
                    {HORAS.map(hora => (
                      <div key={hora} className="grid grid-cols-[35px_repeat(7,_1fr)] gap-[2px] sm:gap-1 items-center">
                        <div className="col-span-1 text-right pr-1 sm:pr-2 text-[9px] font-medium text-gray-500">
                          {hora.endsWith("00") ? hora : ""}
                        </div>
                        {DIAS_SEMANA.map((dia, idx) => {
                          const slotId = `S${semana}-${dia}-${fechasActivas[idx]}-${hora}`;
                          const isSelected = disponibilidad.includes(slotId);
                          return (
                            <div key={slotId} onClick={() => toggleSlot(slotId)} className={`h-4 sm:h-5 rounded-[2px] transition-all border-[0.5px] ${(isLockedHorario || isGlobalLockActive) ? (isSelected ? 'bg-green-500 border-green-400 opacity-90 cursor-default shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-[#151515] border-gray-800 opacity-30 cursor-default') : (isSelected ? 'bg-yellow-500 border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.4)] cursor-pointer' : 'bg-[#1a1a1a] border-gray-800 hover:bg-gray-800/80 cursor-pointer')}`}></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              {isGlobalLockActive ? (
                <div className="w-full text-center py-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <p className="text-orange-500 font-bold text-xs uppercase tracking-widest">🔒 Sistema Bloqueado</p>
                </div>
              ) : isLockedHorario ? (
                <button onClick={() => setIsLockedHorario(false)} className="w-full max-w-xs py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white">Realizar Cambios</button>
              ) : (
                <button onClick={confirmarYGuardarHorario} disabled={isSavingHorario || isLoadingSchedule} className={`w-full max-w-xs py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 ${saveSuccessHorario ? 'bg-green-500 text-[#0a0a0a] shadow-green-500/20' : 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black shadow-yellow-500/20 hover:from-yellow-500 hover:to-yellow-600'}`}>
                  {isSavingHorario ? 'Guardando...' : saveSuccessHorario ? '¡Guardado Exitoso!' : 'Guardar Horario'}
                </button>
              )}
            </div>
          </main>
        );

      case "guias":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white">Guías de Entrevista</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Duración Oficial: 40 a 45 minutos</p>
            </div>

            {!guiaActiva ? (
              <div className="flex flex-col gap-4">
                {OPCIONES_NUCLEO.map((nucleo) => (
                  <button key={nucleo} onClick={() => setGuiaActiva(nucleo)} className="w-full bg-[#111111] hover:bg-yellow-900/20 border border-gray-800 hover:border-yellow-500 p-6 rounded-2xl flex items-center justify-between transition-all group shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#1a1a1a] group-hover:bg-yellow-500/20 border border-gray-800 group-hover:border-yellow-500/50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-all">
                        {nucleo === "Proyectos" ? "💡" : nucleo === "Capacitación" ? "📚" : nucleo === "Organización" ? "⚙️" : "📣"}
                      </div>
                      <span className="text-xl font-black text-white group-hover:text-yellow-400 transition-colors">{nucleo}</span>
                    </div>
                    <span className="text-gray-500 group-hover:text-yellow-400 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300 pb-10">
                <button onClick={() => setGuiaActiva(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold mb-6">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg> Volver a Guías
                </button>

                <h3 className="text-xl font-black text-yellow-400 mb-6 border-b border-yellow-500/30 pb-3 flex items-center gap-2">
                  <span>📝</span> Guión de {guiaActiva}
                </h3>

                {Object.entries(GUIONES[guiaActiva] || {}).map(([seccion, preguntas], idxSeccion) => (
                  <div key={idxSeccion} className="space-y-6 mt-10">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2">{seccion}</h4>
                    {(Array.isArray(preguntas) ? preguntas : []).map((q, idxQ) => (
                      <div key={idxQ} className={`border border-gray-800 rounded-2xl p-5 shadow-sm ${seccion === "Parte Práctica" ? 'bg-yellow-900/10 border-yellow-500/20' : 'bg-[#111111]'}`}>
                        <div className="flex gap-3 items-start">
                          <span className={`font-black text-lg leading-none mt-0.5 ${seccion === "Parte Práctica" ? 'text-yellow-400' : 'text-yellow-500'}`}>Q.</span>
                          <p className={`text-sm font-bold leading-relaxed ${seccion === "Parte Práctica" ? 'text-yellow-200' : 'text-gray-200'}`}>{q}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </main>
        );

      case "intercambios":
        const intercambiosVisibles = safeIntercambios.filter(ent => 
          ent && ent.entrevistadorSaliente !== session?.user?.name && ent.entrevistador1 !== session?.user?.name && ent.entrevistador2 !== session?.user?.name
        );

        return (
          <main className="pt-24 pb-32 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-500">
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden shrink-0 mb-6">
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
              <h2 className="text-xl font-bold mb-1 text-white">Sistema de Cambios 🔄</h2>
              <p className="text-sm text-gray-400">Apoya a tus compañeros cubriendo entrevistas.</p>
            </div>

            {isLoadingIntercambios ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Buscando solicitudes...</p>
              </div>
            ) : intercambiosVisibles.length === 0 ? (
              <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
                <div className="text-4xl mb-4 opacity-50">🍃</div>
                <p className="text-gray-400 text-sm">Nadie necesita ayuda por el momento.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {intercambiosVisibles.map((entrevista, idx) => (
                  <div key={idx} className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-yellow-500/50 transition-all group p-5">
                    <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-4">
                      <div>
                        <p className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold mb-1">Entrevistador que solicita</p>
                        <h3 className="text-sm font-bold text-gray-300 leading-tight">{entrevista.entrevistadorSaliente}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{entrevista.dia || "N/A"} {entrevista.fecha || ""} Abr</p>
                        <p className="text-sm font-black text-white">{entrevista.hora}</p>
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Candidato a evaluar</p>
                      <h3 className="text-lg font-black text-white">{entrevista.postulante}</h3>
                    </div>

                    <button onClick={() => aceptarIntercambio(entrevista.idBloque, entrevista.entrevistadorSaliente, entrevista.postulante)} className="w-full py-3 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black border border-yellow-500/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95">
                      ✅ Aceptar y Cubrir Entrevista
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        );

      case "panel":
      default:
        return (
          <main className="pt-24 pb-32 px-5 max-w-lg mx-auto min-h-screen flex flex-col gap-6 animate-in fade-in duration-500">
            {/* ✅ TARJETA SUPERIOR CORREGIDA COMO ENTREVISTADOR */}
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
              <h2 className="text-xl font-bold text-white mb-1">Hola Maestro, {primerNombre} 👑</h2>
              <p className="text-sm text-gray-400">Entrevistas programadas:</p>
            </div>

            {/* ✅ MIS ENTREVISTAS ASIGNADAS */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Tus Próximas Citas ({safeMisEntrevistas.length})</h3>
              
              {isLoadingEntrevistas ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Cargando agenda...</p>
                </div>
              ) : safeMisEntrevistas.length === 0 ? (
                <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
                  <div className="text-4xl mb-4 text-yellow-500 opacity-50">☕</div>
                  <p className="text-gray-400 text-sm">No tienes entrevistas asignadas por el momento.</p>
                  <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">El sistema te notificará cuando tengas una.</p>
                </div>
              ) : (
                safeMisEntrevistas.map((entrevista, idx) => (
                  <div key={idx} className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-yellow-500/50 transition-all group p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold mb-1">Candidato</p>
                        <h3 className="text-lg font-bold text-white leading-tight">{entrevista.postulante}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{entrevista.dia || "N/A"} {entrevista.fecha || ""} Abr</p>
                        <p className="text-sm font-black text-white">{entrevista.hora}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                      {entrevista.meetLink && (
                        <a href={entrevista.meetLink} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-center text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2">
                          <span>📹</span> Meet
                        </a>
                      )}
                      
                      <Link href={`/dashboard/entrevistador/postulante/${entrevista.idBloque || "null"}?email=${encodeURIComponent(entrevista.correoPostulante || "")}&dia=${entrevista.dia || ""}&fecha=${entrevista.fecha || ""}&hora=${entrevista.hora || ""}`} className="flex-[2] py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-600 text-center text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 active:scale-95">
                        Ver Perfil <span>→</span>
                      </Link>
                    </div>

                    <button onClick={() => entrevista.solicitaIntercambio ? cancelarIntercambio(entrevista.idBloque) : solicitarIntercambio(entrevista.idBloque)} className={`w-full mt-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${entrevista.solicitaIntercambio ? "bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-black active:scale-95" : "bg-red-600/5 text-red-500 border-red-600/20 hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-95"}`}>
                      <span>{entrevista.solicitaIntercambio ? "↩️" : "🔄"}</span> 
                      {entrevista.solicitaIntercambio ? "Cancelar Solicitud de Cambio" : "Intercambiar Entrevista"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      <header className="fixed top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center justify-between px-5">
        <button onClick={() => setIsNotifMenuOpen(true)} className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#111111] rounded-full animate-pulse"></span>}
        </button>

        <div className="flex flex-col items-center justify-center leading-none mt-1 cursor-pointer" onClick={() => setActiveTab("panel")}>
          <h1 className="text-xl font-black tracking-tight">Soph<span className="text-yellow-500">IA</span></h1>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Centro de Mando</span>
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="hover:scale-105 transition-transform shrink-0">
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {/* OVERLAYS GLOBALES */}
      {(isMenuOpen || isNotifMenuOpen || showPurgeModal || showCursoModal || showConfirmHorarioModal || showGenerateModal || showLockConfirmModal || modalInfo.isOpen) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity" onClick={() => { setIsMenuOpen(false); setIsNotifMenuOpen(false); if(!isPurging) setShowPurgeModal(false); if(!isSavingCurso) setShowCursoModal(false); setShowConfirmHorarioModal(false); if(!isGenerating) setShowGenerateModal(false); if(!isTogglingLock) setShowLockConfirmModal(false); !isProcessingSwap && setModalInfo(prev => ({...prev, isOpen: false})); }} />
      )}

      {/* MODALES ADMINISTRATIVOS PREVIOS */}
      {showLockConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-orange-500/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2"><span className="text-orange-500">⚠️</span> Confirmar Acción</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">¿Estás seguro de que deseas <strong className="text-orange-500">{isGlobalLockActive ? 'DESBLOQUEAR' : 'BLOQUEAR'}</strong> el registro de horarios para todos los usuarios?</p>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center shadow-inner">
                <p className="text-orange-500 font-black text-xl">Sistema de Horarios</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Estado actual: {isGlobalLockActive ? 'Bloqueado' : 'Activo'}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              <button onClick={() => setShowLockConfirmModal(false)} disabled={isTogglingLock} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all disabled:opacity-50">Cancelar</button>
              <button onClick={executeGlobalLock} disabled={isTogglingLock} className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-400 text-[#0a0a0a] font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50">
                {isTogglingLock ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-green-500/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2"><span className="text-green-500">🧩</span> Generar Entrevistas</h3>
            </div>
            <div className="p-6">
              {!generateResult ? (
                <>
                  <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">¿Estás seguro de que deseas construir los horarios? El sistema cruzará la disponibilidad actual de TODOS los entrevistadores y publicará los bloques resultantes en la base de datos.</p>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center shadow-inner">
                    <p className="text-green-500 font-black text-xl">SIAFI Match</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Proceso Automatizado</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className={`text-5xl mb-4 ${generateResult.success ? 'text-green-500' : 'text-red-500'}`}>{generateResult.success ? '✅' : '❌'}</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{generateResult.message}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              {!generateResult ? (
                <>
                  <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cancelar</button>
                  <button onClick={generarBloques} disabled={isGenerating} className="flex-1 py-3.5 bg-green-500 hover:bg-green-400 text-[#0a0a0a] font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 disabled:opacity-50">
                    {isGenerating ? "Generando..." : "Confirmar"}
                  </button>
                </>
              ) : (
                <button onClick={() => setShowGenerateModal(false)} className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cerrar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirmHorarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-yellow-500/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2"><span className="text-yellow-500">⚠️</span> Confirmar Horario</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">¿Estás seguro de que deseas guardar estos cambios en tu disponibilidad? Una vez guardado, tu horario quedará registrado en el sistema.</p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center shadow-inner">
                <p className="text-yellow-500 font-black text-2xl">{disponibilidad.length * 0.25} hrs</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Total de Disponibilidad</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              <button onClick={() => setShowConfirmHorarioModal(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cancelar</button>
              <button onClick={guardarHorario} className="flex-1 py-3.5 bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showCursoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-[#0051ff]/30 rounded-3xl w-full max-w-md shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><span className="text-[#00baff]">📺</span> Nuevo Video</h3>
              <button disabled={isSavingCurso} onClick={() => {setShowCursoModal(false); setCursoResult(null);}} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="p-6">
              {!cursoResult ? (
                <form id="cursoForm" onSubmit={guardarCurso} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Título del Video</label>
                    <input required type="text" placeholder="Ej. Entrevistas por Competencias" value={cursoForm.titulo} onChange={e => setCursoForm({...cursoForm, titulo: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-[#0051ff] outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Descripción breve</label>
                    <textarea required rows={2} placeholder="De qué trata este curso..." value={cursoForm.descripcion} onChange={e => setCursoForm({...cursoForm, descripcion: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-[#0051ff] outline-none resize-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Enlace de YouTube</label>
                    <input required type="url" placeholder="https://youtube.com/..." value={cursoForm.url} onChange={e => setCursoForm({...cursoForm, url: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-3 text-sm text-white focus:border-[#0051ff] outline-none transition-colors" />
                  </div>
                </form>
              ) : (
                <div className="text-center py-6">
                  <div className={`text-5xl mb-4 ${cursoResult.success ? 'text-[#00baff]' : 'text-red-500'}`}>{cursoResult.success ? '✅' : '❌'}</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{cursoResult.message}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              {!cursoResult ? (
                <>
                  <button onClick={() => setShowCursoModal(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cancelar</button>
                  <button type="submit" form="cursoForm" disabled={isSavingCurso} className="flex-1 py-3.5 bg-[#0051ff] hover:bg-[#0041cc] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#0051ff]/20 active:scale-95 disabled:opacity-50">
                    {isSavingCurso ? "Publicando..." : "Publicar"}
                  </button>
                </>
              ) : (
                <button onClick={() => {setShowCursoModal(false); setCursoResult(null);}} className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cerrar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col pointer-events-auto max-h-[90vh]">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a] rounded-t-3xl">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><span className="text-red-500">⚠️</span> Confirmar Purga</h3>
              <button disabled={isPurging} onClick={() => setShowPurgeModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {!purgeResult ? (
                <>
                  <p className="text-sm text-gray-400 mb-4">Estás a punto de eliminar todas las cuentas de tipo "Miembro" y enviarles el siguiente correo automático. <strong>Revisa la previsualización:</strong></p>
                  <div className="bg-[#050505] rounded-2xl mb-6 text-white font-sans text-sm border border-[#1f2937] overflow-hidden">
                    <div className="bg-[#1f2937] px-4 py-2 border-b border-[#374151]">
                      <p className="text-gray-300 text-xs"><span className="font-bold text-gray-400">De:</span> Soporte SIAFI &lt;siafi.reclutamiento@gmail.com&gt;</p>
                      <p className="text-gray-300 text-xs"><span className="font-bold text-gray-400">Asunto:</span> ⚠️ Error en tu registro de SIAFI - Acción Requerida</p>
                    </div>
                    <div className="p-4 bg-[#111111]">
                      <div className="h-1 bg-[#0051ff] w-full mb-0 rounded-t-md"></div>
                      <div className="bg-black p-3 border-b border-[#1f2937] flex justify-between items-center">
                        <span className="w-6 h-6 bg-gray-800 rounded-full inline-block"></span>
                        <span className="w-16 h-4 bg-gray-800 rounded inline-block"></span>
                      </div>
                      <div className="p-5">
                        <h2 className="text-[#ef4444] text-lg mb-3">Aviso de Sistema ⚠️</h2>
                        <p className="mb-3">Hola <strong>[Nombre]</strong>,</p>
                        <p className="text-gray-400 text-xs mb-3 leading-relaxed">Nos comunicamos contigo porque hemos detectado que creaste una cuenta estándar en la plataforma de SophIA en lugar de llenar el formulario oficial de postulación para el Reclutamiento 2026-2.</p>
                        <div className="bg-[#ef44441a] border-l-2 border-[#ef4444] p-3 mb-4">
                          <p className="font-bold text-sm mb-1 text-white">Acción Tomada</p>
                          <p className="text-[#fca5a5] text-xs">Para evitar conflictos técnicos en nuestro sistema y asegurar que tu perfil sea evaluado correctamente, <strong>la cuenta que creaste ha sido eliminada.</strong></p>
                        </div>
                        <p className="text-[#00baff] font-bold text-xs mb-4 leading-relaxed">Por favor, realiza tu registro de forma correcta ingresando al siguiente enlace y completando las preguntas de evaluación. Es muy importante que llenes los campos con datos completos y reales, sobre todo tu nombre completo:</p>
                        <div className="text-center my-4">
                          <span className="bg-[#0051ff] text-white px-4 py-2 rounded-lg font-bold text-xs uppercase">Ir al Formulario</span>
                        </div>
                        <p className="text-gray-400 text-xs mb-4 leading-relaxed">Una vez que llenes tu registro correctamente, el sistema creará automáticamente una cuenta para ti y recibirás un nuevo correo con tus credenciales y otra información.</p>
                        <p className="text-gray-400 text-xs leading-relaxed">Atentamente,<br/><strong className="text-white">Mesa Directiva & SophIA</strong><br/>SIAFI - UNAM</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4">
                    <label className="block text-xs text-red-400 uppercase tracking-widest font-bold mb-2">Para confirmar, escribe "PURGAR"</label>
                    <input type="text" value={purgeConfirmText} onChange={(e) => setPurgeConfirmText(e.target.value)} placeholder="PURGAR" className="w-full bg-[#0a0a0a] border border-red-500/50 rounded-lg p-3 text-white text-center font-mono tracking-widest focus:outline-none focus:border-red-500" />
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className={`text-6xl mb-4 ${purgeResult.success ? 'text-green-500' : 'text-red-500'}`}>{purgeResult.success ? '✅' : '❌'}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{purgeResult.success ? 'Purga Completada' : 'Error en la Purga'}</h3>
                  <p className="text-gray-400">{purgeResult.message}</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-800 bg-[#0a0a0a] rounded-b-3xl">
              {!purgeResult ? (
                <button onClick={ejecutarPurga} disabled={purgeConfirmText !== "PURGAR" || isPurging} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isPurging ? "Procesando eliminación..." : "Confirmar y Ejecutar"}
                </button>
              ) : (
                <button onClick={() => setShowPurgeModal(false)} className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all">Cerrar</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENÉRICO DE CAMBIOS */}
      {modalInfo.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-yellow-500/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2"><span>{modalInfo.icon}</span> {modalInfo.title}</h3>
            </div>
            <div className="p-6 text-center"><p className="text-sm text-gray-300 leading-relaxed">{modalInfo.message}</p></div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              {!modalInfo.isError && <button onClick={() => setModalInfo(prev => ({ ...prev, isOpen: false }))} disabled={isProcessingSwap} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all disabled:opacity-50">Cerrar</button>}
              <button onClick={modalInfo.onConfirm} disabled={isProcessingSwap} className="flex-1 py-3.5 text-black font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50" style={modalInfo.isError ? { backgroundColor: '#dc2626', color: 'white' } : { backgroundImage: 'linear-gradient(to right, #ca8a04, #facc15)' }}>
                {isProcessingSwap ? "Procesando..." : modalInfo.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENÚ PERFIL */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div className="flex items-center gap-4 pr-4">
            <AvatarCircle size="w-12 h-12" />
            <div>
              <p className="font-bold text-white text-lg leading-tight truncate">{primerNombre}</p>
              <p className="text-xs text-gray-400 truncate mt-1">{userEmail}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-yellow-500">Admin Maestro</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white mt-1 shrink-0">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <Link href="/dashboard/settings" className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Ajustes Globales</Link>
          <Link href="/dashboard/support" className="text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors">Consola de Errores</Link>
        </div>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* MENÚ NOTIFICACIONES */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-[#111111] border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isNotifMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Sistema
          </h2>
          <button onClick={() => setIsNotifMenuOpen(false)} className="text-gray-400 hover:text-white shrink-0">✕</button>
        </div>
        <div className="flex-grow overflow-y-auto bg-[#111111]">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
              <svg className="w-12 h-12 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="text-sm font-medium text-gray-400">Sin reportes del sistema.</p>
            </div>
          ) : (
            notificaciones.map(notif => (
              <div key={notif.id} onClick={() => marcarComoLeida(notif.id, notif.leida)} className={`p-5 border-b border-gray-800/50 cursor-pointer transition-all relative group flex gap-4 items-start ${!notif.leida ? 'bg-yellow-500/10' : 'hover:bg-[#1f2937]/30'}`}>
                {!notif.leida && <div className="absolute left-0 top-0 w-1 h-full bg-yellow-500"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.leida ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex justify-between items-start mb-1 gap-2"><h3 className={`text-sm ${!notif.leida ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{notif.asunto}</h3></div>
                  <p className={`text-xs leading-relaxed ${!notif.leida ? 'text-gray-300' : 'text-gray-500'}`}>{notif.mensaje}</p>
                  <p className="text-[10px] text-gray-600 mt-2 uppercase font-bold tracking-wider">{new Date(notif.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); borrarNotificacion(notif.id); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Eliminar notificación">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {renderActiveContent()}

      {/* ✅ BARRA DE NAVEGACIÓN CORREGIDA (NO CORTA EL BOTÓN CENTRAL) */}
      <div className="fixed bottom-0 w-full z-40 pb-safe">
        
        {/* BOTÓN CENTRAL FLOTANTE */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-50">
          <button onClick={() => setActiveTab("panel")} className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-[6px] border-[#0a0a0a] transition-all duration-300 ${activeTab === "panel" ? "bg-gradient-to-tr from-yellow-600 to-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105 text-[#0a0a0a]" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
          </button>
        </div>

        {/* FONDO DE LA BARRA */}
        <nav className="w-full bg-[#111111]/95 backdrop-blur-md border-t border-gray-800 h-16">
          <div className="flex justify-between items-center h-full px-2 sm:px-6 max-w-2xl mx-auto">
            
            <div className="flex justify-between w-[40%]">
              <button onClick={() => setActiveTab("control")} className={`flex flex-col items-center justify-center transition-colors ${activeTab === "control" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span className="text-[8px] sm:text-[9px] font-medium tracking-wide">Control</span>
              </button>
              <button onClick={() => setActiveTab("postulantes")} className={`flex flex-col items-center justify-center transition-colors ${activeTab === "postulantes" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-[8px] sm:text-[9px] font-medium tracking-wide">Candidatos</span>
              </button>
              <button onClick={() => setActiveTab("mi-horario")} className={`flex flex-col items-center justify-center transition-colors ${activeTab === "mi-horario" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[8px] sm:text-[9px] font-medium tracking-wide">Horario</span>
              </button>
            </div>

            <div className="flex justify-between w-[40%]">
              <button onClick={() => { setActiveTab("guias"); setGuiaActiva(null); }} className={`flex flex-col items-center justify-center transition-colors ${activeTab === "guias" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-[8px] sm:text-[9px] font-medium tracking-wide">Guías</span>
              </button>
              <button onClick={() => setActiveTab("intercambios")} className={`flex flex-col items-center justify-center transition-colors ${activeTab === "intercambios" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                <span className="text-[8px] sm:text-[9px] font-medium tracking-wide">Cambios</span>
              </button>
              <button onClick={() => setActiveTab("ajustes")} className={`flex flex-col items-center justify-center transition-colors ${activeTab === "ajustes" ? "text-yellow-500" : "text-gray-400 hover:text-gray-200"}`}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[8px] sm:text-[9px] font-medium tracking-wide">Ajustes</span>
              </button>
            </div>

          </div>
        </nav>
      </div>

    </div>
  );
}