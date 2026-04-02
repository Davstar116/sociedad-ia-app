"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// =========================================================
// 🧠 BANCO DE PREGUNTAS (EXTRAÍDO ÍNTEGRO DE LOS PDFs)
// =========================================================
const GUIONES: Record<string, Record<string, string[]>> = {
  "Proyectos": {
    "Relax (Rompehielo)": [
      "1. Nombre.",
      "2. Semestre y unidad académica.",
      "3. ¿Cuál es y por qué elegiste tu carrera? (Metas y visión personal).",
      "4. ¿Cuál es tu animal favorito? (Percepción personal sutil).",
      "5. Hobbies e información variada."
    ],
    "Preguntas Personales": [
      "1. ¿Cuál es tu mayor fortaleza? ¿Tu mayor debilidad? (Evaluar sinceridad, no se dice).",
      "2. ¿Cuáles son tus habilidades? (Si responde fundamentando la habilidad, se le da un plus. Si no elabora más se le pregunta).",
      "3. ¿Cuál es tu superpoder?",
      "4. ¿Cuál es el valor que más te distingue? (Si responde fundamentando el por qué, se le da un plus).",
      "5. Supongamos que tienes que entregar dos trabajos a la misma hora, un trabajo personal importante y una parte de un trabajo en equipo, por procrastinar ahora solo tienes tiempo para hacer uno. ¿Qué es lo que harías? (Evaluar responsabilidad hacia el equipo y comunicación).",
      "6. Cuéntanos una experiencia donde hayas asumido el rol de líder. ¿Cómo resultó?",
      "7. Tienes 3 proyectos finales y el proyecto de SIAFI, todos se entregan en 2 meses. ¿Cómo te organizas?",
      "8. ¿Consideras el trabajo remoto como una opción viable para el trabajo dentro de la sociedad?",
      "9. ¿Qué te distingue de otros candidatos?"
    ],
    "Preguntas de SIAFI": [
      "1. ¿Cómo conociste a SIAFI?",
      "2. ¿Nos sigues en redes sociales? a. ¿Has visto nuestras publicaciones y contenido? i. ¿Qué mejorarías de nuestras redes? (Evaluar interés y proactividad).",
      "3. ¿Por qué de todas las asociaciones elegiste a SIAFI, que te animó?",
      "4. ¿Conoces los proyectos que se realizaron en SIAFI en semestres pasados? ¿Cuál te interesó más?",
      "5. ¿Tienes alguna idea para realizar dentro del núcleo de Proyectos? (Se evaluará si fundamenta la metodología que emplearía o las herramientas).",
      "6. ¿Qué podrías aportar a SIAFI y en particular a tu/s núcleo/s?",
      "7. ¿Qué esperas de unirte a SIAFI?",
      "8. ¿Cuánto tiempo le planeas dedicar a la sociedad?"
    ],
    "Preguntas Técnicas": [
      "1. Con tus propias palabras, ¿Nos puedes decir qué es la inteligencia artificial?",
      "2. ¿Cómo describirías tus conocimientos y habilidades de inteligencia artificial? (Si son pocos o nulos, preguntar ¿Qué es lo que te gusta de la inteligencia artificial?).",
      "3. ¿Qué es lo que más te intriga de la inteligencia artificial de camino al futuro?",
      "4. ¿Qué aplicaciones conoces de la IA? Pueden ser aplicaciones de la vida diaria o aplicaciones más técnicas a la industria.",
      "5. Dentro de tus áreas de interés profesional, ¿te gustaría poder aplicar la IA en algún aspecto?"
    ],
    "Parte Práctica": [
      "CASO A (Evaluación de código - 3 min): El candidato explicará el código que eligió presentar. Se espera que explique el propósito del código, su lógica, y cualquier decisión clave de diseño que haya tomado.",
      "CASO B (Resolución de Problemas - Si no trae código): ¿Cómo resolverías el problema de encontrar el número más frecuente en una lista de números? (Respuesta esperada: Uso de un diccionario/mapa para contar la frecuencia, complejidad O(n)).",
      "CASO C (Explicación de un Algoritmo - Si no trae código): ¿Puedes explicarnos cómo funciona el algoritmo de ordenamiento por burbuja (bubble sort)? (Respuesta esperada: Comparar pares adyacentes y los intercambia si están en orden incorrecto, complejidad O(n^2))."
    ]
  },
  "Capacitación": {
    "Relax (Rompehielo)": [
      "1. Nombre.",
      "2. Semestre y unidad académica.",
      "3. ¿Cuál es y por qué elegiste tu carrera? (Metas y visión personal).",
      "4. ¿Cuál es tu animal favorito? (Percepción personal sutil).",
      "5. Hobbies e información variada."
    ],
    "Preguntas Personales": [
      "1. ¿Cuál es tu mayor fortaleza? ¿Tu mayor debilidad? (Evaluar sinceridad, no se dice).",
      "2. ¿Cuáles son tus habilidades? (Si responde fundamentando la habilidad, se le da un plus. Si no elabora más se le pregunta).",
      "3. ¿Cuál es tu superpoder?",
      "4. ¿Cuál es el valor que más te distingue? (Si responde fundamentando el por qué, se le da un plus).",
      "5. Supongamos que tienes que entregar dos trabajos a la misma hora, un trabajo personal importante y una parte de un trabajo en equipo, por procrastinar ahora solo tienes tiempo para hacer uno. ¿Qué es lo que harías? (Evaluar responsabilidad hacia el equipo y comunicación).",
      "6. Cuéntanos una experiencia donde hayas asumido el rol de líder. ¿Cómo resultó?",
      "7. Tienes 3 proyectos finales y el proyecto de SIAFI, todos se entregan en 2 meses. ¿Cómo te organizas?",
      "8. ¿Consideras el trabajo remoto como una opción viable para el trabajo dentro de la sociedad?",
      "9. ¿Qué te distingue de otros candidatos?"
    ],
    "Preguntas de SIAFI": [
      "1. ¿Cómo conociste a SIAFI?",
      "2. ¿Nos sigues en redes sociales? a. ¿Has visto nuestras publicaciones y contenido? i. ¿Qué mejorarías de nuestras redes? (Evaluar interés y proactividad).",
      "3. ¿Por qué de todas las asociaciones elegiste a SIAFI, que te animó?",
      "4. ¿Conoces los cursos o talleres que SIAFI ha impartido en semestres pasados? ¿Cuál te interesó más?",
      "5. ¿Tienes alguna idea para realizar dentro del núcleo de Capacitación? (Se evaluará si fundamenta la metodología que emplearía o las herramientas).",
      "6. ¿Qué podrías aportar a SIAFI y en particular a tu/s núcleo/s?",
      "7. ¿Qué esperas de unirte a SIAFI?",
      "8. ¿Cuánto tiempo le planeas dedicar a la sociedad?"
    ],
    "Preguntas Técnicas": [
      "1. Con tus propias palabras, ¿Nos puedes decir qué es la inteligencia artificial?",
      "2. ¿Cómo describirías tus conocimientos y habilidades de inteligencia artificial? (Si son pocos o nulos, preguntar ¿Qué es lo que te gusta de la inteligencia artificial?).",
      "3. ¿Qué es lo que más te intriga de la inteligencia artificial de camino al futuro?",
      "4. ¿Qué aplicaciones conoces de la IA? Pueden ser aplicaciones de la vida diaria o aplicaciones más técnicas a la industria.",
      "5. Dentro de tus áreas de interés profesional, ¿te gustaría poder aplicar la IA en algún aspecto?"
    ],
    "Parte Práctica": [
      "CASO A (Explicación de código - 3 min): Por favor, explícanos el código que elegiste traer. Enséñanoslo como si fuéramos alumnos de tu curso, evaluaremos tu capacidad de transmitir conocimiento.",
      "CASO B (Didáctica - Si no trajo código): Imagina que un alumno te pregunta cómo funciona una Red Neuronal Básica pero no sabe nada de matemáticas avanzadas. ¿Cómo se lo explicarías usando una analogía de la vida real?"
    ]
  },
  "Organización": {
    "Introducción y Preguntas Personales": [
      "1. Nombre, semestre y carrera.",
      "2. ¿Por qué elegiste tu carrera?",
      "3. ¿Cuáles son tus hobbies?",
      "4. ¿Cuáles son tus habilidades?",
      "5. ¿Cuál es el valor que más te distingue? ¿Por qué?"
    ],
    "Forma de Trabajo": [
      "1. En organización trabajamos constantemente en equipo. ¿Cuáles crees que sean las claves para poder realizarlo de la mejor forma?",
      "2. ¿Qué harías si surge un inconveniente con un miembro de tu equipo que frena el avance del trabajo asignado?",
      "3. Si requieres dar avances del trabajo que has realizado a lo largo de los días ¿Cómo lo presentarías? Es decir, ¿qué elementos y material incluirías?",
      "4. Debido a los diferentes horarios de los miembros, solemos trabajar a distancia. ¿Cómo te sientes con esta dinámica de trabajo?",
      "5. En organización constantemente tenemos que hablar con directivos, profesores, patrocinadores y otros compañeros de la sociedad. ¿Te consideras alguien con facilidad de palabra?"
    ],
    "Preguntas Técnicas": [
      "1. Con tus propias palabras, ¿Nos puedes decir qué es la inteligencia artificial?",
      "2. ¿Qué es lo que más te atrae de la inteligencia artificial de camino al futuro?",
      "3. ¿Por qué te interesa profundizar e impulsar el desarrollo de la IA?"
    ],
    "Preguntas de SIAFI": [
      "1. ¿Cómo conociste a SIAFI?",
      "2. En la facultad hay diversas asociaciones, ¿Por qué elegiste SIAFI?, ¿Por qué el núcleo de organización?",
      "3. ¿Qué esperas de unirte a SIAFI?",
      "4. ¿Qué crees que puedas aportar a la sociedad, en específico a organización?",
      "5. ¿Cuánto tiempo crees que podrías dedicarle a la sociedad por semana?"
    ],
    "Preguntas del Núcleo": [
      "1. ¿Por qué te gustaría ingresar al núcleo de organización? Cuéntanos en detalle las razones.",
      "2. ¿Cuál crees que es la base para una correcta organización? (Ya sea en la vida personal, escolar o laboral).",
      "3. ¿Has coordinado algún equipo de trabajo o algún evento? Cuéntanos al respecto, no importa que sean pequeños o escolares.",
      "4. ¿Ocupas alguna herramienta para organizarte? Mencionanos cuál o cuáles utilizas.",
      "5. A la hora de organizar un evento, ¿cuál crees que es uno de los detalles que la mayoría de la gente olvida y puede hacer que el evento falle?"
    ],
    "Parte Práctica": [
      "CASO PRÁCTICO 1: Imagina que eres parte del núcleo de Organización y estamos a una semana de nuestro evento de bienvenida. Un miembro de tu equipo, que tiene tareas urgentes asignadas, te deja en 'visto' durante tres días y no avanza. ¿Cómo manejas la situación para que el evento se lleve a cabo sin problemas?",
      "CASO PRÁCTICO 2: ¿Qué harías si necesitas información urgente de algún otro núcleo (Difusión, Capacitación o Proyectos) para poder avanzar con un evento, pero no te están respondiendo los mensajes?"
    ]
  },
  "Difusión": {
    "Relax (Rompehielo)": [
      "1. Nombre.",
      "2. Semestre y facultad a la que perteneces.",
      "3. ¿Cuál es y por qué elegiste tu carrera?: Metas y visión personal.",
      "4. ¿Cual es tu animal favorito?: Percepción personal sutil.",
      "5. Hobbies: Información variada."
    ],
    "Preguntas Personales": [
      "1. ¿Cuál es tu mayor fortaleza? ¿Tu mayor debilidad? (Sinceridad).",
      "2. ¿Cuáles son tus habilidades? (Si responde fundamentando la habilidad, se le da un plus).",
      "3. ¿Cuál es tu superpoder?",
      "4. ¿Cuál es el valor que más te distingue? (Si fundamenta el por qué, se le da un plus).",
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
      "2. ¿Cómo describirías tus conocimientos y habilidades de inteligencia artificial? (Si son pocos o nulos, preguntar ¿Qué es lo que te gusta de la inteligencia artificial?).",
      "3. ¿Por qué te interesa difundir la IA?",
      "4. ¿Te consideras una persona creativa?",
      "5. Cuando te han pedido exponer un tema ¿cómo te sientes?",
      "6. ¿Has manejado algún tipo de red social antes? ¿Cuáles y con qué propósito?",
      "7. ¿Cuál es tu red social favorita y por qué?",
      "8. ¿Has aplicado alguna estrategia de mercadotecnia en algún proyecto escolar o de trabajo?",
      "9. ¿Tienes alguna noción en diseño? ¿Cuál es?",
      "10. ¿Qué herramientas de edición de video o imagen sabes usar?"
    ],
    "Parte Práctica": [
      "CASO PRÁCTICO 1: Supón que eres parte del núcleo de Difusión y estás encargado de promover un nuevo proyecto. Te enteras de que la campaña de promoción actual no está generando el interés esperado y las métricas están por debajo de lo previsto. ¿Qué pasos tomarías para mejorar la visibilidad y el alcance de la campaña? (Evaluar si identifica problemas, herramientas y mide el éxito).",
      "CASO PRÁCTICO 2: Te asignaron elaborar una publicación para redes sociales sobre un evento importante. El día de la publicación, te das cuenta que el material gráfico casi no tiene interacción (nadie da like o comparte) y además hay un error menor en el texto. ¿Qué harías en ese momento para resolver de inmediato? ¿Qué medidas tomarías después para aprender y mejorar?",
      "CASO PRÁCTICO 3: Tienes una semana de plazo para entregar un post de SIAFI. Sin embargo, a mitad de semana te das cuenta que también tienes proyectos propios y tareas de la escuela que requieren bastante tiempo. ¿Cómo organizarías tus actividades para cumplir sin descuidar la escuela? En caso de sentir que no alcanzarías a terminarlo, ¿qué pasos tomarías para asegurar que el equipo no se vea afectado?"
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

  // ESTADOS DE NAVEGACIÓN
  const [activeTab, setActiveTab] = useState<"expediente" | "guia" | "evaluacion">("guia");

  // ESTADOS DEL POSTULANTE
  const [datosPersonales, setDatosPersonales] = useState<Record<string, string> | null>(null);
  const [respuestasPostulante, setRespuestasPostulante] = useState<Array<{pregunta: string, respuesta: string}>>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // ESTADOS DE LA EVALUACIÓN (Sincronizados)
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

  // CARGA DEL EXPEDIENTE
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

  // LÓGICA DE AGRUPACIÓN DEL EXPEDIENTE
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
        <a href={texto} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all" style={{ backgroundColor: '#1f2937' }}>
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
                <div key={i} className="flex justify-between items-center px-3 py-2.5 rounded-lg border" style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(31, 41, 55, 0.5)' }}>
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

  // MOTOR DE SINCRONIZACIÓN EN TIEMPO REAL
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

  // LÓGICA DE GUARDADO DEFINITIVO
  const isFormValid = nucleoPrincipal !== "" && nucleoSecundario !== "" && comentariosE1 !== "" && comentariosE2 !== "" && estrellasE1 > 0 && estrellasE2 > 0;

  const handleSaveEvaluation = async () => {
    if (!isFormValid) return alert("Faltan campos obligatorios por llenar (Núcleos, Comentarios o Estrellas).");
    if (!confirm("¿Estás seguro de finalizar la entrevista? Esto guardará los resultados y actualizará el estatus del candidato.")) return;
    
    setIsSaving(true);
    try {
      const qnaArray: { pregunta: string, respuesta: string }[] = [];
      
      // Recorremos dinámicamente las secciones del núcleo principal
      if (nucleoPrincipal && GUIONES[nucleoPrincipal]) {
        Object.entries(GUIONES[nucleoPrincipal]).forEach(([seccion, preguntas], idxSeccion) => {
          preguntas.forEach((q, idxQ) => {
            const key = `q_prin_${idxSeccion}_${idxQ}`;
            if (respuestasEval[key]) qnaArray.push({ pregunta: q, respuesta: respuestasEval[key] });
          });
        });
      }
      
      // Recorremos solo la parte práctica del núcleo secundario
      if (nucleoSecundario && GUIONES[nucleoSecundario] && GUIONES[nucleoSecundario]["Parte Práctica"]) {
        GUIONES[nucleoSecundario]["Parte Práctica"].forEach((q, idxQ) => {
          const key = `q_sec_prac_${idxQ}`;
          if (respuestasEval[key]) qnaArray.push({ pregunta: q, respuesta: respuestasEval[key] });
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

  if (status === "loading" || isLoadingProfile) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#c084fc] animate-pulse">Cargando Workspace...</div>;

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

  const renderPreguntaInput = (pregunta: string, id: string, isSecundario: boolean = false) => (
    <div key={id} className="border rounded-2xl p-5 shadow-sm" style={{ backgroundColor: isSecundario ? 'rgba(88,28,135,0.1)' : '#111111', borderColor: isSecundario ? 'rgba(168,85,247,0.2)' : '#1f2937' }}>
      <div className="flex gap-3 items-start mb-3">
        <span className="font-black text-lg leading-none mt-0.5" style={{ color: isSecundario ? '#c084fc' : '#a855f7' }}>Q.</span>
        <p className={`text-sm font-bold leading-relaxed ${isSecundario ? 'text-[#e9d5ff]' : 'text-gray-200'}`}>{pregunta}</p>
      </div>
      
      {activeTab === "evaluacion" && (
        <div className="mt-4">
          <textarea 
            className="w-full border rounded-xl p-4 text-sm text-gray-300 outline-none transition-all resize-none min-h-[100px]"
            style={{ backgroundColor: '#0a0a0a', borderColor: '#1f2937' }}
            placeholder="Anota la respuesta o comentarios aquí..."
            value={respuestasEval[id] || ""}
            onChange={(e) => handleInputChange(id, e.target.value)}
          />
        </div>
      )}
    </div>
  );

  const getPreguntasParaMostrar = () => {
    if (!nucleoPrincipal) return null;
    const gPrincipal = GUIONES[nucleoPrincipal];
    const gSecundario = nucleoSecundario && GUIONES[nucleoSecundario] ? GUIONES[nucleoSecundario] : null;

    return (
      <div className="flex flex-col gap-8 animate-in fade-in">
        {/* BLOQUE PRINCIPAL DINÁMICO */}
        <div>
          <h3 className="text-xl font-black mb-4 border-b pb-2 flex items-center gap-2" style={{ color: '#c084fc', borderColor: 'rgba(168,85,247,0.3)' }}>
            <span>🎯</span> {nucleoPrincipal} (Principal)
          </h3>
          
          {Object.entries(gPrincipal).map(([seccion, preguntas], idxSeccion) => (
            <div key={idxSeccion} className="space-y-6 mt-8">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{seccion}</h4>
              {preguntas.map((p, idxQ) => renderPreguntaInput(p, `q_prin_${idxSeccion}_${idxQ}`, false))}
            </div>
          ))}
        </div>

        {/* BLOQUE SECUNDARIO DINÁMICO (Solo Práctica) */}
        {gSecundario && gSecundario["Parte Práctica"] && (
          <div className="mt-4 p-5 rounded-2xl" style={{ backgroundColor: 'rgba(88,28,135,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#d8b4fe' }}>
              <span>🔄</span> {nucleoSecundario} (Secundario - Parte Práctica)
            </h3>
            <div className="space-y-6">
              {gSecundario["Parte Práctica"].map((p, idxQ) => renderPreguntaInput(p, `q_sec_prac_${idxQ}`, true))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const nombre = datosPersonales?.["Nombre Completo"] || "Candidato";
  const carrera = datosPersonales?.["Carrera"] || datosPersonales?.["Licenciatura"] || "Sin carrera registrada";
  const semestre = datosPersonales?.["Semestre"] || "N/A";
  const nucleosString = datosPersonales?.["Núcleo"] || "No especificado";
  const nucleosArray = nucleosString.split(",").map(n => n.trim()).filter(Boolean);
  const cvLink = datosPersonales?.["CV"] || datosPersonales?.["Curriculum"] || Object.values(datosPersonales || {}).find(v => v.startsWith("http") && v.includes("aws"));
  const notasPresidencia = datosPersonales?.["Notas Presidencia"] || "Aún no hay comentarios registrados.";
  const notasLider = datosPersonales?.["Notas Lider"] || "Aún no hay comentarios registrados.";

  return (
    <div className="min-h-screen text-white font-sans pb-28" style={{ backgroundColor: '#0a0a0a' }}>
      
      <header className="fixed top-0 w-full h-16 border-b z-40 flex items-center justify-between px-5" style={{ backgroundColor: 'rgba(17,17,17,0.9)', backdropFilter: 'blur(10px)', borderColor: '#1f2937' }}>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg> Salir
        </button>
        <div className="flex items-center gap-3">
          {isSyncing && <span className="flex items-center gap-1 text-[10px] text-green-400 uppercase tracking-widest font-bold"><span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Sincronizando</span>}
          <h1 className="text-sm font-black tracking-widest uppercase" style={{ color: '#c084fc' }}>Workspace</h1>
        </div>
      </header>

      <main className="pt-24 px-4 sm:px-5 max-w-3xl mx-auto">
        
        {/* HEADER DEL CANDIDATO (Configuración inicial) */}
        {activeTab !== "expediente" && (
          <div className="border rounded-3xl p-6 shadow-lg mb-8 relative overflow-hidden" style={{ backgroundColor: '#111111', borderColor: 'rgba(168,85,247,0.3)' }}>
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#a855f7' }}></div>
            <h2 className="text-2xl font-black text-white mb-1">{nombre}</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Configuración de la Entrevista</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Núcleo Principal *</label>
                <select 
                  value={nucleoPrincipal} onChange={(e) => handleInputChange("nucleoPrincipal", e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm text-white outline-none"
                  style={{ backgroundColor: '#0a0a0a', borderColor: '#1f2937' }}
                >
                  <option value="">Selecciona un núcleo...</option>
                  {OPCIONES_NUCLEO.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Núcleo Secundario *</label>
                <select 
                  value={nucleoSecundario} onChange={(e) => handleInputChange("nucleoSecundario", e.target.value)}
                  className="w-full border rounded-xl p-3 text-sm text-white outline-none"
                  style={{ backgroundColor: '#0a0a0a', borderColor: '#1f2937' }}
                >
                  <option value="">Selecciona un núcleo...</option>
                  {OPCIONES_NUCLEO.filter(n => n !== nucleoPrincipal).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 📑 PESTAÑA: EXPEDIENTE (DISEÑO RESTAURADO) */}
        {activeTab === "expediente" && (
          <div className="animate-in fade-in duration-500 pb-8">
            
            <div className="border rounded-3xl p-5 sm:p-6 relative overflow-hidden mb-8" style={{ backgroundColor: '#111111', borderColor: 'rgba(168,85,247,0.3)' }}>
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundImage: 'linear-gradient(to right, #9333ea, #c084fc)' }}></div>
              
              {(diaEntrevista && fechaEntrevista && horaEntrevista) && (
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10">
                  <span className="px-2 py-1 sm:px-2.5 sm:py-1.5 border text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm" style={{ backgroundColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)', color: '#c084fc' }}>
                    📅 {diaEntrevista} {fechaEntrevista} Abr • ⏰ {horaEntrevista}
                  </span>
                </div>
              )}
              
              <div className="flex items-start gap-3 sm:gap-4 mb-5 mt-8 sm:mt-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl border shrink-0 shadow-inner mt-1" style={{ backgroundColor: 'rgba(168,85,247,0.2)', borderColor: 'rgba(168,85,247,0.2)', color: '#c084fc' }}>
                  👤
                </div>
                <div className="flex-1 overflow-hidden">
                  <h2 className="text-lg sm:text-2xl font-black text-white leading-tight truncate mb-1">{nombre}</h2>
                  <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 truncate">{carrera}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nucleosArray.map((nucleo, idx) => (
                      <span key={idx} className="px-2 py-1 border text-[9px] font-black uppercase tracking-wider rounded-md" style={{ backgroundColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)', color: '#c084fc' }}>
                        {nucleo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-1">
                <div className="border rounded-xl p-3 flex flex-col justify-center items-center text-center" style={{ backgroundColor: '#0a0a0a', borderColor: '#1f2937' }}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Semestre</p>
                  <p className="text-xl font-black text-white">{semestre}º</p>
                </div>
                {cvLink ? (
                  <a href={cvLink} target="_blank" rel="noreferrer" className="border rounded-xl p-3 flex flex-col justify-center items-center text-center transition-all group" style={{ backgroundColor: '#111111', borderColor: '#1f2937' }}>
                    <span className="text-xl mb-1 group-hover:scale-110 transition-transform">📄</span>
                    <p className="text-[10px] text-white uppercase tracking-widest font-bold">Ver Currículum</p>
                  </a>
                ) : (
                  <div className="opacity-50 rounded-xl p-3 flex flex-col justify-center items-center text-center cursor-not-allowed" style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f2937' }}>
                    <span className="text-xl mb-1 grayscale">📄</span>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Sin CV</p>
                  </div>
                )}
              </div>
            </div>

            {/* BLOQUE UNIFICADO: PERFIL DEL CANDIDATO */}
            {bloqueGeneral.length > 0 && (
              <div className="border rounded-3xl p-5 sm:p-6 mb-8 shadow-sm" style={{ backgroundColor: '#111111', borderColor: '#1f2937' }}>
                <div className="flex items-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: '#1f2937' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#a855f7' }}></span>
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Perfil General</h3>
                </div>
                <div className="flex flex-col gap-6">
                  {bloqueGeneral.map((item, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#c084fc' }}>{item.pregunta}</p>
                      {renderRespuestaExpediente(item.respuesta)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOTAS ADMINISTRATIVAS */}
            <div className="border rounded-3xl p-5 sm:p-6 mb-8 shadow-sm" style={{ backgroundColor: '#111111', borderColor: '#1f2937' }}>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b" style={{ borderColor: '#1f2937' }}>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Notas Internas</h3>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><span>👑</span> Presidencia</p>
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(31, 41, 55, 0.5)' }}>
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${datosPersonales?.["Notas Presidencia"] ? 'text-gray-300' : 'text-gray-600 italic'}`}>{notasPresidencia}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><span>🎯</span> Líder de Núcleo</p>
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(31, 41, 55, 0.5)' }}>
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${datosPersonales?.["Notas Lider"] ? 'text-gray-300' : 'text-gray-600 italic'}`}>{notasLider}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MÓDULOS TÉCNICOS */}
            {bloqueModulos.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6 px-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00baff' }}></span>
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Evaluación de Núcleos</h3>
                </div>
                <div className="border rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-8" style={{ backgroundColor: '#111111', borderColor: '#1f2937' }}>
                  {bloqueModulos.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex gap-3 items-start mb-3">
                        <span className="font-black text-lg leading-none mt-0.5" style={{ color: '#0051ff' }}>Q.</span>
                        <p className="text-sm font-bold leading-relaxed" style={{ color: '#00baff' }}>{item.pregunta}</p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-[2px] ml-2.5 mt-1 self-stretch rounded-full" style={{ backgroundColor: '#1f2937' }}></div>
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
              <div className="border border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center opacity-70" style={{ backgroundColor: '#111111', borderColor: '#374151' }}>
                <span className="text-5xl mb-4 grayscale">📂</span>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Esperando Núcleos</p>
                <p className="text-xs text-gray-500 mt-2">Selecciona el núcleo principal arriba para cargar el guión oficial.</p>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Duración Oficial de la Entrevista: 40 a 45 minutos</p>
                </div>
                {getPreguntasParaMostrar()}
              </div>
            )}

            {/* SECCIÓN FINAL DE EVALUACIÓN */}
            {(activeTab === "evaluacion" && nucleoPrincipal) && (
              <div className="mt-12 border rounded-3xl p-6 sm:p-8 shadow-2xl" style={{ backgroundImage: 'linear-gradient(to bottom, #111111, #0a0a0a)', borderColor: 'rgba(168,85,247,0.5)' }}>
                <h3 className="text-xl font-black text-white mb-6 text-center">Veredicto Final</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="border p-5 rounded-2xl" style={{ backgroundColor: '#0a0a0a', borderColor: '#1f2937' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#c084fc' }}>Entrevistador 1 *</p>
                    <textarea 
                      className="w-full border rounded-xl p-4 text-sm text-gray-300 outline-none resize-none mb-4"
                      style={{ backgroundColor: '#111111', borderColor: '#1f2937' }}
                      placeholder="Conclusiones y observaciones generales..."
                      rows={4} value={comentariosE1} onChange={(e) => handleInputChange("comentariosE1", e.target.value)}
                    />
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Calificación Final</p>
                      {renderEstrellasEval(estrellasE1, "estrellasE1", true)}
                    </div>
                  </div>

                  <div className="border p-5 rounded-2xl" style={{ backgroundColor: '#0a0a0a', borderColor: '#1f2937' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#c084fc' }}>Entrevistador 2 *</p>
                    <textarea 
                      className="w-full border rounded-xl p-4 text-sm text-gray-300 outline-none resize-none mb-4"
                      style={{ backgroundColor: '#111111', borderColor: '#1f2937' }}
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
                  className="w-full mt-8 py-4 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  style={isFormValid ? { backgroundImage: 'linear-gradient(to right, #9333ea, #c084fc)', color: '#ffffff' } : { backgroundColor: '#1f2937', color: '#6b7280', cursor: 'not-allowed' }}
                >
                  {isSaving ? "Guardando en Base de Datos..." : "💾 Guardar Evaluación Definitiva"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full border-t z-40 pb-safe" style={{ backgroundColor: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(10px)', borderColor: '#1f2937' }}>
        <div className="flex justify-around items-center h-20 px-4 max-w-md mx-auto">
          
          <button onClick={() => setActiveTab("expediente")} className="flex flex-col items-center justify-center w-20 transition-all" style={activeTab === "expediente" ? { color: '#c084fc', transform: 'scale(1.1)' } : { color: '#6b7280' }}>
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">Perfil</span>
          </button>

          <button onClick={() => setActiveTab("guia")} className="flex flex-col items-center justify-center w-20 transition-all" style={activeTab === "guia" ? { color: '#c084fc', transform: 'scale(1.1)' } : { color: '#6b7280' }}>
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">Guía</span>
          </button>

          <button onClick={() => setActiveTab("evaluacion")} className="flex flex-col items-center justify-center w-20 transition-all" style={activeTab === "evaluacion" ? { color: '#c084fc', transform: 'scale(1.1)', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.5))' } : { color: '#6b7280' }}>
            <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">Evaluar</span>
          </button>

        </div>
      </nav>
    </div>
  );
}