"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession, signOut } from "next-auth/react"; 
import Link from "next/link"; 
import OneSignal from 'react-onesignal';

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FECHAS_S1 = [6, 7, 8, 9, 10, 11, 12];
const FECHAS_S2 = [13, 14, 15, 16, 17, 18, 19];

// =========================================================
// 🧠 BANCO DE PREGUNTAS (EXTRAÍDO ÍNTEGRO DE LOS PDFs)
// =========================================================
const GUIONES: Record<string, Record<string, string[]>> = {
  "Proyectos": {
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
      "4. ¿Conoces los proyectos que se realizaron en SIAFI en semestres pasados? ¿Cuál te interesó más?",
      "5. ¿Tienes alguna idea para realizar dentro del núcleo de Proyectos/Capacitación?",
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

export default function DashboardEntrevistador() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("panel");
  
  const [semana, setSemana] = useState(1);
  const [disponibilidad, setDisponibilidad] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isGlobalLockActive, setIsGlobalLockActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [cursos, setCursos] = useState<any[]>([]);
  const [isLoadingCursos, setIsLoadingCursos] = useState(false);

  const [misEntrevistas, setMisEntrevistas] = useState<any[]>([]);
  const [isLoadingEntrevistas, setIsLoadingEntrevistas] = useState(false);
  
  const [intercambios, setIntercambios] = useState<any[]>([]);
  const [isLoadingIntercambios, setIsLoadingIntercambios] = useState(false);
  const [isProcessingSwap, setIsProcessingSwap] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    icon: string;
    confirmText: string;
    isError?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false, title: "", message: "", icon: "", confirmText: "Confirmar", isError: false, onConfirm: () => {}
  });

  const [guiaActiva, setGuiaActiva] = useState<string | null>(null);
  
  const hasLoadedSchedule = useRef(false);
  const { data: session, status } = useSession();

  const HORAS = useMemo(() => {
    const h = [];
    for (let i = 9; i < 21; i++) {
      for (let m of ["00", "15", "30", "45"]) h.push(`${i.toString().padStart(2, '0')}:${m}`);
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
        if (data.notificaciones && Array.isArray(data.notificaciones)) {
          setNotificaciones(data.notificaciones);
        }
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
          setIsLocked(true); 
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
          icon: "🎉",
          confirmText: "Entendido",
          isError: false,
          onConfirm: async () => {
            setModalInfo(prev => ({ ...prev, isOpen: false }));
            if (alerta.idBloque) {
              await fetch(`/api/entrevistas/intercambios/alertas?idBloque=${alerta.idBloque}`, { method: 'DELETE' });
            }
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (error) {
      setIsProcessingSwap(false);
    }
  };

  const solicitarIntercambio = (idBloque: string) => {
    setModalInfo({
      isOpen: true, title: "Solicitar Intercambio", message: "¿Estás seguro de solicitar un intercambio? Tu entrevista quedará en el Sistema de Cambios hasta que alguien más la acepte.",
      icon: "🔄", confirmText: "Solicitar Intercambio", isError: false,
      onConfirm: () => handleSwapAction("solicitar", idBloque)
    });
  };

  const cancelarIntercambio = (idBloque: string) => {
    setModalInfo({
      isOpen: true, title: "Cancelar Solicitud", message: "¿Deseas cancelar tu solicitud de intercambio? Recuperarás la entrevista y ya no será visible en el Sistema de Cambios.",
      icon: "↩️", confirmText: "Sí, Cancelar", isError: false,
      onConfirm: () => handleSwapAction("cancelar", idBloque)
    });
  };

  const aceptarIntercambio = (idBloque: string, saliente: string, postulante: string) => {
    setModalInfo({
      isOpen: true, title: "Aceptar Intercambio", message: `¿Estás seguro de cubrir a ${saliente} en esta entrevista? Se agregará a tu agenda de forma inmediata.`,
      icon: "✅", confirmText: "Aceptar Entrevista", isError: false,
      onConfirm: () => handleSwapAction("aceptar", idBloque, saliente, postulante)
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

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const fetchCursos = async () => {
    setIsLoadingCursos(true);
    try {
      const res = await fetch("/api/cursos");
      if (res.ok) {
        const data = await res.json();
        setCursos(Array.isArray(data.cursos) ? data.cursos : []);
      }
    } catch (error) {} finally { setIsLoadingCursos(false); }
  };

  useEffect(() => { if (activeTab === "cursos") fetchCursos(); }, [activeTab]);

  // ✅ BLINDAJE CONTRA UNDEFINED EN ARREGLOS
  const safeNotificaciones = Array.isArray(notificaciones) ? notificaciones : [];
  const unreadCount = safeNotificaciones.filter(n => n && !n.leida).length;
  const safeMisEntrevistas = Array.isArray(misEntrevistas) ? misEntrevistas : [];
  const safeIntercambios = Array.isArray(intercambios) ? intercambios : [];
  const safeCursos = Array.isArray(cursos) ? cursos : [];

  const marcarComoLeida = async (id: string, leidaActual: boolean) => {
    if (leidaActual) return; 
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, leida: true }) });
  };

  const borrarNotificacion = async (id: string) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
  };

  const toggleSlot = (slotId: string) => {
    if (isLocked || isGlobalLockActive) return; 
    setDisponibilidad((prev) => prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]);
  };

  const confirmarYGuardar = () => setShowConfirmModal(true);

  const guardarHorario = async () => {
    setShowConfirmModal(false); 
    if (!session?.user?.email) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/availability", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: session.user.name, email: session.user.email, horarios: disponibilidad, horasTotales: disponibilidad.length * 0.25 }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setIsLocked(true); 
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {} finally { setIsSaving(false); }
  };

  if (status === "loading") return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#c084fc] animate-pulse">Cargando tu perfil...</div>;

  const userName = session?.user?.name || "Entrevistador";
  const userEmail = session?.user?.email || "Sin correo";
  // @ts-ignore
  const userAvatar = session?.user?.avatar; 
  
  const primerNombre = userName.split(" ")[0] || "Usuario";
  const iniciales = userName.split(" ").map(n => n?.[0] || "").slice(0, 2).join("").toUpperCase() || "UN";

  const AvatarCircle = ({ size }: { size: string }) => (
    <div className={`${size} rounded-full bg-gradient-to-tr from-[#9333ea] to-[#c084fc] p-[2px] shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]`}>
      <div className="w-full h-full rounded-full bg-[#111111] overflow-hidden flex items-center justify-center">
        {userAvatar ? <img src={userAvatar} alt="Perfil" className="w-full h-full object-cover" /> : <span className={`${size === 'w-9 h-9' ? 'text-xs' : 'text-sm'} font-bold text-white`}>{iniciales}</span>}
      </div>
    </div>
  );

  const renderActiveContent = () => {
    switch (activeTab) {
      case "mi-horario":
        const fechasActivas = semana === 1 ? FECHAS_S1 : FECHAS_S2;
        return (
          <main className="pt-24 pb-28 px-3 max-w-2xl mx-auto min-h-screen animate-in fade-in duration-300 select-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Mi Disponibilidad</h2>
                {(isLocked || isGlobalLockActive) && (
                  <p className={`text-[10px] ${isGlobalLockActive ? 'text-orange-500' : 'text-green-400'} font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1`}>
                    <span>🔒</span> {isGlobalLockActive ? 'Bloqueado por Sistema' : 'Registrado'}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#c084fc]">{disponibilidad.length * 0.25}<span className="text-sm text-gray-500 font-medium"> hrs</span></p>
              </div>
            </div>

            <div className="flex gap-2 mb-4 bg-[#111111] p-1.5 rounded-xl border border-gray-800">
              <button onClick={() => setSemana(1)} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 1 ? 'bg-gradient-to-r from-[#9333ea] to-[#c084fc] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Semana 1 (6-12 Abr)</button>
              <button onClick={() => setSemana(2)} className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${semana === 2 ? 'bg-gradient-to-r from-[#9333ea] to-[#c084fc] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Semana 2 (13-19 Abr)</button>
            </div>

            <div className={`bg-[#111111] border rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden relative transition-all ${(isLocked || isGlobalLockActive) ? 'border-green-500/30' : 'border-gray-800'} ${isGlobalLockActive ? 'border-orange-500/30' : ''}`}>
              {isLoadingSchedule ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <div className="w-8 h-8 border-2 border-[#a855f7] border-t-transparent rounded-full animate-spin mb-3"></div>
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
                        <div className="col-span-1 text-right pr-1 sm:pr-2 text-[9px] font-medium text-gray-500">{hora.endsWith("00") ? hora : ""}</div>
                        {DIAS_SEMANA.map((dia, idx) => {
                          const slotId = `S${semana}-${dia}-${fechasActivas[idx]}-${hora}`;
                          const isSelected = disponibilidad.includes(slotId);
                          return (
                            <div key={slotId} onClick={() => toggleSlot(slotId)} className={`h-4 sm:h-5 rounded-[2px] transition-all border-[0.5px] ${(isLocked || isGlobalLockActive) ? (isSelected ? 'bg-green-500 border-green-400 opacity-90 cursor-default shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-[#151515] border-gray-800 opacity-30 cursor-default') : (isSelected ? 'bg-[#a855f7] border-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.4)] cursor-pointer' : 'bg-[#1a1a1a] border-gray-800 hover:bg-gray-800/80 cursor-pointer')}`}></div>
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
              ) : isLocked ? (
                <button onClick={() => setIsLocked(false)} className="w-full max-w-xs py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white">Realizar Cambios</button>
              ) : (
                <button onClick={confirmarYGuardar} disabled={isSaving || isLoadingSchedule} className={`w-full max-w-xs py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 ${saveSuccess ? 'bg-green-500 text-[#0a0a0a] shadow-green-500/20' : 'bg-gradient-to-r from-[#9333ea] to-[#c084fc] text-white shadow-[#9333ea]/20 hover:from-[#c084fc] hover:to-[#9333ea]'}`}>
                  {isSaving ? 'Guardando...' : saveSuccess ? '¡Guardado Exitoso!' : 'Guardar Horario'}
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
                  <button 
                    key={nucleo}
                    onClick={() => setGuiaActiva(nucleo)}
                    className="w-full bg-[#111111] hover:bg-[#581c87]/40 border border-gray-800 hover:border-[#a855f7] p-6 rounded-2xl flex items-center justify-between transition-all group shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#1a1a1a] group-hover:bg-[#a855f7]/20 border border-gray-800 group-hover:border-[#a855f7]/50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-all">
                        {nucleo === "Proyectos" ? "💡" : nucleo === "Capacitación" ? "📚" : nucleo === "Organización" ? "⚙️" : "📣"}
                      </div>
                      <span className="text-xl font-black text-white group-hover:text-[#c084fc] transition-colors">{nucleo}</span>
                    </div>
                    <span className="text-gray-500 group-hover:text-[#c084fc] transition-colors">
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

                <h3 className="text-xl font-black text-[#c084fc] mb-6 border-b border-[#a855f7]/30 pb-3 flex items-center gap-2">
                  <span>📝</span> Guión de {guiaActiva}
                </h3>

                {/* ✅ RECORRIDO DINÁMICO BLINDADO */}
                {Object.entries(GUIONES[guiaActiva] || {}).map(([seccion, preguntas], idxSeccion) => (
                  <div key={idxSeccion} className="space-y-6 mt-10">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2">{seccion}</h4>
                    {(Array.isArray(preguntas) ? preguntas : []).map((q, idxQ) => (
                      <div key={idxQ} className={`border border-gray-800 rounded-2xl p-5 shadow-sm ${seccion === "Parte Práctica" ? 'bg-[#581c87]/10 border-[#a855f7]/20' : 'bg-[#111111]'}`}>
                        <div className="flex gap-3 items-start">
                          <span className={`font-black text-lg leading-none mt-0.5 ${seccion === "Parte Práctica" ? 'text-[#c084fc]' : 'text-[#a855f7]'}`}>Q.</span>
                          <p className={`text-sm font-bold leading-relaxed ${seccion === "Parte Práctica" ? 'text-[#e9d5ff]' : 'text-gray-200'}`}>{q}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </main>
        );

      case "cursos":
        return (
          <main className="pt-24 pb-28 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-white mb-6">Cursos de Capacitación</h2>
            {isLoadingCursos ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="w-8 h-8 border-2 border-[#a855f7] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Cargando módulos...</p>
              </div>
            ) : safeCursos.length === 0 ? (
              <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
                <div className="text-4xl mb-4">📹</div>
                <p className="text-gray-400 text-sm">Pronto publicaremos los videos de capacitación aquí.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {safeCursos.map((curso) => {
                  const embedUrl = getYouTubeEmbedUrl(curso.url);
                  return (
                    <div key={curso.id} className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl group hover:border-[#a855f7]/50 transition-colors">
                      {embedUrl ? (
                        <div className="aspect-video w-full bg-black relative">
                          <iframe src={embedUrl} title={curso.titulo} className="absolute top-0 left-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-black flex items-center justify-center text-gray-500 text-sm">Enlace de video inválido</div>
                      )}
                      <div className="p-5 border-t border-gray-800">
                        <h3 className="font-bold text-lg text-white mb-2 leading-tight">{curso.titulo}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">{curso.descripcion}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Publicado el: <span className="text-gray-300">{new Date(curso.fecha).toLocaleDateString('es-MX')}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        );

      case "intercambios":
        const intercambiosVisibles = safeIntercambios.filter(ent => 
          ent &&
          ent.entrevistadorSaliente !== session?.user?.name && 
          ent.entrevistador1 !== session?.user?.name && 
          ent.entrevistador2 !== session?.user?.name
        );

        return (
          <main className="pt-24 pb-32 px-5 max-w-lg mx-auto min-h-screen animate-in fade-in duration-500">
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden shrink-0 mb-6">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#a855f7]"></div>
              <h2 className="text-xl font-bold mb-1 text-white">Sistema de Cambios 🔄</h2>
              <p className="text-sm text-gray-400">Apoya a tus compañeros cubriendo entrevistas.</p>
            </div>

            {isLoadingIntercambios ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <div className="w-8 h-8 border-2 border-[#a855f7] border-t-transparent rounded-full animate-spin mb-3"></div>
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
                  <div key={idx} className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-[#a855f7]/50 transition-all group p-5">
                    <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-4">
                      <div>
                        <p className="text-[10px] text-[#c084fc] uppercase tracking-widest font-bold mb-1">Entrevistador que solicita</p>
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

                    <button 
                      onClick={() => aceptarIntercambio(entrevista.idBloque, entrevista.entrevistadorSaliente, entrevista.postulante)}
                      className="w-full py-3 bg-[#9333ea]/10 text-[#c084fc] hover:bg-[#9333ea] hover:text-white border border-[#9333ea]/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95"
                    >
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
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#a855f7]"></div>
              <h2 className="text-xl font-bold text-white mb-1">Hola, {primerNombre} 👋</h2>
              <p className="text-sm text-gray-400">Entrevistas programadas:</p>
            </div>

            {isLoadingEntrevistas ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <div className="w-8 h-8 border-2 border-[#a855f7] border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Cargando agenda...</p>
              </div>
            ) : safeMisEntrevistas.length === 0 ? (
              <div className="bg-[#111111] border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
                <div className="text-4xl mb-4 text-[#a855f7] opacity-50">☕</div>
                <p className="text-gray-400 text-sm">No tienes entrevistas asignadas por el momento.</p>
                <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">El sistema te notificará cuando tengas una.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Tus Próximas Citas ({safeMisEntrevistas.length})</h3>
                {safeMisEntrevistas.map((entrevista, idx) => (
                  <div key={idx} className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:border-[#a855f7]/50 transition-all group p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] text-[#c084fc] uppercase tracking-widest font-bold mb-1">Candidato</p>
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
                      
                      {/* ✅ LINK BLINDADO CONTRA UNDEFINED EN LOS PARÁMETROS */}
                      <Link href={`/dashboard/entrevistador/postulante/${entrevista.idBloque || "null"}?email=${encodeURIComponent(entrevista.correoPostulante || "")}&dia=${entrevista.dia || ""}&fecha=${entrevista.fecha || ""}&hora=${entrevista.hora || ""}`} className="flex-[2] py-3 bg-gradient-to-r from-[#9333ea] to-[#c084fc] hover:from-[#c084fc] hover:to-[#9333ea] text-center text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#9333ea]/20 flex items-center justify-center gap-2 active:scale-95">
                        Ver Perfil <span>→</span>
                      </Link>
                    </div>

                    <button 
                      onClick={() => entrevista.solicitaIntercambio ? cancelarIntercambio(entrevista.idBloque) : solicitarIntercambio(entrevista.idBloque)}
                      className={`w-full mt-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                        entrevista.solicitaIntercambio
                          ? "bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500 hover:text-white active:scale-95"
                          : "bg-red-600/5 text-red-500 border-red-600/20 hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-95"
                      }`}
                    >
                      <span>{entrevista.solicitaIntercambio ? "↩️" : "🔄"}</span> 
                      {entrevista.solicitaIntercambio ? "Cancelar Solicitud de Cambio" : "Intercambiar Entrevista"}
                    </button>
                    
                  </div>
                ))}
              </div>
            )}
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden pb-20">
      
      <header className="fixed top-0 w-full h-16 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 z-40 flex items-center justify-between px-5">
        <button onClick={() => setIsNotifMenuOpen(true)} className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#111111] rounded-full animate-pulse"></span>}
        </button>

        <div className="flex flex-col items-center justify-center leading-none mt-1 cursor-pointer" onClick={() => setActiveTab("panel")}>
          <h1 className="text-xl font-black tracking-tight">Soph<span className="text-[#c084fc]">IA</span></h1>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">by SIAFI</span>
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="hover:scale-105 transition-transform shrink-0">
          <AvatarCircle size="w-9 h-9" />
        </button>
      </header>

      {/* OVERLAYS */}
      {(isMenuOpen || isNotifMenuOpen || showConfirmModal || modalInfo.isOpen) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity" onClick={() => { setIsMenuOpen(false); setIsNotifMenuOpen(false); setShowConfirmModal(false); !isProcessingSwap && setModalInfo(prev => ({...prev, isOpen: false})); }} />
      )}
      
      {/* MODAL DE CONFIRMACIÓN DE HORARIO */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-[#a855f7]/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2"><span className="text-[#c084fc]">⚠️</span> Confirmar Horario</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-300 leading-relaxed text-center mb-5">¿Estás seguro de que deseas guardar estos cambios en tu disponibilidad? Una vez guardado, tu horario quedará registrado en el sistema.</p>
              <div className="bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-2xl p-4 text-center shadow-inner">
                <p className="text-[#c084fc] font-black text-2xl">{disponibilidad.length * 0.25} hrs</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">Total de Disponibilidad</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all">Cancelar</button>
              <button onClick={guardarHorario} className="flex-1 py-3.5 bg-gradient-to-r from-[#9333ea] to-[#c084fc] hover:from-[#c084fc] hover:to-[#9333ea] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#9333ea]/20 active:scale-95">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENÉRICO DEL SISTEMA DE CAMBIOS */}
      {modalInfo.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-[#111111] border border-[#a855f7]/30 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 bg-[#0a0a0a] text-center">
              <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                <span>{modalInfo.icon}</span> {modalInfo.title}
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-300 leading-relaxed">{modalInfo.message}</p>
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0a0a0a] flex gap-3">
              {!modalInfo.isError && (
                <button onClick={() => setModalInfo(prev => ({ ...prev, isOpen: false }))} disabled={isProcessingSwap} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all disabled:opacity-50">Cerrar</button>
              )}
              <button onClick={modalInfo.onConfirm} disabled={isProcessingSwap} className="flex-1 py-3.5 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50" style={modalInfo.isError ? { backgroundColor: '#dc2626' } : { backgroundImage: 'linear-gradient(to right, #9333ea, #c084fc)' }}>
                {isProcessingSwap ? "Procesando..." : modalInfo.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENÚ PERFIL (DERECHO) */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-[#111111] border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div className="flex items-center gap-4 pr-4">
            <AvatarCircle size="w-12 h-12" />
            <div>
              <p className="font-bold text-white text-lg leading-tight truncate">{primerNombre}</p>
              <p className="text-xs text-gray-400 truncate mt-1">{userEmail}</p>
              <div className="mt-2 inline-block px-2 py-1 bg-[#a855f7]/20 border border-[#a855f7]/30 rounded-md">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#c084fc]">Entrevistador</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white mt-1 shrink-0">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-2 flex-grow">
          <Link href="/dashboard/settings" className="text-left px-4 py-3 text-sm text-gray-300 hover:text-white rounded-xl transition-colors">Configuración</Link>
          <Link href="/dashboard/support" className="text-left px-4 py-3 text-sm text-gray-300 hover:text-white rounded-xl transition-colors">Soporte Técnico</Link>
        </div>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* MENÚ NOTIFICACIONES (IZQUIERDO) */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-[#111111] border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isNotifMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-[#c084fc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> Notificaciones
          </h2>
          <button onClick={() => setIsNotifMenuOpen(false)} className="text-gray-400 hover:text-white shrink-0">✕</button>
        </div>
        <div className="flex-grow overflow-y-auto bg-[#111111]">
          {safeNotificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
              <svg className="w-12 h-12 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="text-sm font-medium text-gray-400">No tienes notificaciones nuevas.</p>
            </div>
          ) : (
            safeNotificaciones.map(notif => (
              <div key={notif.id} onClick={() => marcarComoLeida(notif.id, notif.leida)} className={`p-5 border-b border-gray-800/50 cursor-pointer transition-all relative group flex gap-4 items-start ${!notif.leida ? 'bg-[#a855f7]/10' : 'hover:bg-[#1f2937]/30'}`}>
                {!notif.leida && <div className="absolute left-0 top-0 w-1 h-full bg-[#a855f7]"></div>}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.leida ? 'bg-[#a855f7]/20 text-[#c084fc]' : 'bg-gray-800 text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1 pr-6">
                  <h3 className={`text-sm mb-1 ${!notif.leida ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>{notif.asunto}</h3>
                  <p className={`text-xs leading-relaxed ${!notif.leida ? 'text-gray-300' : 'text-gray-500'}`}>{notif.mensaje}</p>
                  <p className="text-[10px] text-gray-600 mt-2 uppercase font-bold tracking-wider">{new Date(notif.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); borrarNotificacion(notif.id); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ AQUÍ ESTÁ EL RENDERIZADO DEL COMPONENTE CENTRAL */}
      {renderActiveContent()}

      {/* CINTILLO INFERIOR DE ENTREVISTADOR */}
      <nav className="fixed bottom-0 w-full bg-[#111111]/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-6 relative max-w-lg mx-auto">
          
          <button onClick={() => setActiveTab("mi-horario")} className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "mi-horario" ? "text-[#c084fc]" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Horario</span>
          </button>
          
          <button onClick={() => { setActiveTab("guias"); setGuiaActiva(null); }} className={`flex flex-col items-center justify-center w-12 mr-6 transition-colors ${activeTab === "guias" ? "text-[#c084fc]" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Guías</span>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 -top-4">
            <button onClick={() => setActiveTab("panel")} className={`w-16 h-16 rounded-full flex items-center justify-center border-[6px] border-[#0a0a0a] transition-all duration-300 ${activeTab === "panel" ? "bg-gradient-to-tr from-[#9333ea] to-[#c084fc] shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
              <svg className={`w-7 h-7 ${activeTab === "panel" ? "text-white" : "currentColor"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
          </div>

          <button onClick={() => setActiveTab("cursos")} className={`flex flex-col items-center justify-center w-12 ml-6 transition-colors ${activeTab === "cursos" ? "text-[#c084fc]" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <span className="text-[9px] font-medium tracking-wide">Cursos</span>
          </button>

          <button onClick={() => setActiveTab("intercambios")} className={`flex flex-col items-center justify-center w-12 transition-colors ${activeTab === "intercambios" ? "text-[#c084fc]" : "text-gray-400 hover:text-gray-200"}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Cambios</span>
          </button>
          
        </div>
      </nav>

    </div>
  );
}