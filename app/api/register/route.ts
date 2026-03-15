import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "../../lib/user-db";
import nodemailer from "nodemailer"; 
import { WelcomeEmailTemplate } from "../../components/emails/WelcomeEmail";
import { InstructionsEmailTemplate } from "../../components/emails/InstructionsEmail"; // <-- NUEVO

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID;
const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const PREGUNTAS_NUCLEOS: Record<string, string[]> = {
  "Organización": [
    "Si un ponente invitado cancela su participación en una plática importante a tan solo unas horas del evento, ¿cómo manejarías la situación y qué alternativas propondrías?",
    "En el trabajo en equipo es común que surjan desacuerdos. ¿Cómo intervienes para resolver un conflicto entre dos compañeros y mantener un buen ambiente de trabajo?",
    "¿Qué estrategias o dinámicas propondrías para fomentar la integración y la convivencia sana entre todos los miembros de la sociedad?",
    "Cuando tienes múltiples fechas límite acercándose al mismo tiempo (por ejemplo, exámenes, tareas y un evento), ¿cómo priorizas tus actividades y gestionas tu tiempo?"
  ],
  "Difusión": [
    "Si tuviéramos que anunciar un nuevo taller de inteligencia artificial para la comunidad, ¿qué elementos visuales y qué tipo de mensaje incluirías en un post para captar la atención?",
    "¿Qué experiencia tienes utilizando herramientas de diseño como Canva o similares? Menciona un proyecto o diseño del que te sientas orgulloso.",
    "¿Cómo adaptarías el tono y el vocabulario de una publicación si va dirigida a estudiantes de primer ingreso frente a una publicación dirigida a profesores o alumnos de últimos semestres?",
    "¿Qué métricas o indicadores utilizarías para saber si una campaña de difusión sobre un evento fue realmente exitosa?"
  ],
  "Proyectos": [
    "Cuéntanos sobre algún proyecto técnico, de desarrollo de software o de ingeniería en el que hayas participado. ¿Cuál fue tu rol específico y qué tecnologías utilizaste?",
    "¿Cómo abordas un problema técnico cuando te quedas atascado, por ejemplo, cuando un código no compila o un circuito no funciona como esperabas?",
    "¿Qué áreas de la tecnología o del desarrollo de software te interesan más explorar y cómo crees que podrías aplicarlas en un proyecto real dentro de la sociedad?",
    "¿Qué importancia le das a las buenas prácticas, como la documentación de tu trabajo o el código limpio, cuando estás colaborando en un repositorio o proyecto conjunto?"
  ],
  "Capacitación": [
    "¿Qué metodología utilizarías para enseñarle un concepto técnico complejo (como un algoritmo o el uso de una nueva herramienta) a un miembro de nuevo ingreso que no tiene experiencia previa?",
    "Como capacitador, es vital estar en constante aprendizaje. ¿Qué métodos utilizas para mantenerte actualizado de forma autodidacta con las nuevas tecnologías y tendencias?",
    "Imagina que debes dar una capacitación sobre gestión del tiempo al núcleo de Organización y otra sobre metodologías ágiles de desarrollo al núcleo de Proyectos. ¿Cómo adaptarías tu forma de enseñar para cada grupo?",
    "Desde tu perspectiva, ¿cuál es la habilidad más importante que debe tener alguien dedicado a ser mentor y enseñar a otros estudiantes, y cómo la aplicas tú?"
  ]
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 0. BLINDAJE DUPLICADOS
    const checkDuplicateRes = await fetch(`https://api.notion.com/v1/databases/${CANDIDATOS_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
            filter: { property: "Correo electrónico", email: { equals: data.email } }
        }),
    });

    const duplicateData = await checkDuplicateRes.json();
    if (duplicateData.results && duplicateData.results.length > 0) {
        return NextResponse.json({ error: "Ya existe una postulación registrada con este correo electrónico." }, { status: 400 });
    }

    // 1. USUARIOS
    const existingUser = await getUserByEmail(data.email);
    let passwordParaCorreo = "";
    
    if (!existingUser) {
      const newPassword = generatePassword();
      await createUser({ email: data.email, name: data.nombre, password: newPassword, role: "Postulante", provider: "credentials" });
      passwordParaCorreo = newPassword;
    } else {
      passwordParaCorreo = "(Usa tu contraseña actual)";
    }

    // 2. BLOQUES NOTION
    const skillsBlocks: any[] = [];
    if (data.skills) {
        for (const category in data.skills) {
            const skillSet = data.skills[category];
            skillsBlocks.push({ heading_3: { rich_text: [{ text: { content: category.toUpperCase() } }] } });
            let skillText = "";
            for (const skill in skillSet) { skillText += `${skill}: ${skillSet[skill]}/5 | `; }
            skillsBlocks.push({ paragraph: { rich_text: [{ text: { content: skillText } }] } });
        }
    }

    const respuestasBlocks: any[] = [];
    if (data.respuestas) {
        const questionsMap: any = {
            aportacion: "Principal Aportación", orgullo: "Mayor Logro/Orgullo", inspiracion: "Dinámica de Trabajo",
            motivo: "Motivo para unirse", expectativas: "Expectativas", fuente: "Fuente"
        };
        for (const key in data.respuestas) {
            if (questionsMap[key]) {
                respuestasBlocks.push({ heading_3: { rich_text: [{ text: { content: questionsMap[key] } }] } });
                respuestasBlocks.push({ paragraph: { rich_text: [{ text: { content: data.respuestas[key] || "Sin respuesta" } }] } });
            }
        }
    }

    const respuestasNucleosBlocks: any[] = [];
    if (data.respuestasNucleos) {
        for (const nucleo in data.respuestasNucleos) {
            const respuestasArray = data.respuestasNucleos[nucleo];
            const preguntasArray = PREGUNTAS_NUCLEOS[nucleo];
            
            respuestasNucleosBlocks.push({ divider: {} });
            respuestasNucleosBlocks.push({ heading_2: { rich_text: [{ text: { content: `🎯 Respuestas: Módulo ${nucleo}` } }] } });

            if (preguntasArray && respuestasArray) {
                for (let i = 0; i < preguntasArray.length; i++) {
                    respuestasNucleosBlocks.push({
                        paragraph: {
                            rich_text: [
                                { text: { content: `${preguntasArray[i]}\n` }, annotations: { bold: true, color: "blue" } },
                                { text: { content: respuestasArray[i] || "Sin respuesta" } }
                            ]
                        }
                    });
                }
            }
        }
    }

    // 3. GUARDAR EN NOTION
    const notionBody = {
      parent: { database_id: CANDIDATOS_DB_ID! },
      properties: {
        "Nombre Completo": { title: [{ text: { content: data.nombre } }] }, 
        "Correo electrónico": { email: data.email },
        "Estatus del postulante": { status: { name: "Registrado" } },
        "Celular": { phone_number: data.celular },
        "Núcleo": { multi_select: data.nucleos.map((n: string) => ({ name: n })) },
        "Carrera": { rich_text: [{ text: { content: data.carrera } }] },
        "Semestre": { number: parseInt(data.semestre) },
        "CV": { url: data.cvLink || null },
      },
      children: [
        { heading_1: { rich_text: [{ text: { content: "Perfil del Postulante" } }] } },
        { callout: { rich_text: [{ text: { content: `Postulación recibida el ${new Date().toLocaleDateString()}` } }], icon: { emoji: "📅" } } },
        { divider: {} },
        { heading_2: { rich_text: [{ text: { content: "🧠 Evaluación de Skills" } }] } },
        ...skillsBlocks,
        { divider: {} },
        { heading_2: { rich_text: [{ text: { content: "📝 Respuestas Generales" } }] } },
        ...respuestasBlocks,
        ...respuestasNucleosBlocks
      ]
    };

    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify(notionBody),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      throw new Error(`Error Notion API: ${errorText}`);
    }

    // ---------------------------------------------------------
    // 4. ENVÍO DE CORREOS
    // ---------------------------------------------------------
    const baseUrl = request.headers.get("origin") || "https://tu-proyecto.vercel.app";
    
    // Aquí pon el link real de tu video de YouTube cuando lo tengas
    const linkTutorial = "https://www.youtube.com/watch?v=TU_LINK_AQUI"; 

    const htmlBienvenida = WelcomeEmailTemplate({
        nombre: data.nombre,
        baseUrl: baseUrl,
        passwordGenerada: passwordParaCorreo,
        emailUsuario: data.email
    });

    const htmlInstrucciones = InstructionsEmailTemplate({
        nombre: data.nombre,
        baseUrl: baseUrl,
        youtubeLink: linkTutorial
    });

    try {
      // 4.1 Enviar el primer correo (Credenciales)
      await transporter.sendMail({
        from: '"Reclutamiento SIAFI" <siafi.reclutamiento@gmail.com>',
        to: data.email,
        subject: "Registro Exitoso - Reclutamiento SIAFI 2026-2",
        html: htmlBienvenida, 
      });

      // 4.2 Enviar el segundo correo (Instrucciones de Acceso)
      await transporter.sendMail({
        from: '"Reclutamiento SIAFI" <siafi.reclutamiento@gmail.com>',
        to: data.email,
        subject: "Siguientes Pasos: Cómo acceder a la plataforma SIAFI",
        html: htmlInstrucciones, 
      });

      console.log("✅ Ambos correos enviados con éxito a", data.email);
    } catch (mailError) {
      console.error("⚠️ Error enviando correos:", mailError);
    }

    return NextResponse.json({ success: true, message: "Registro guardado correctamente" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}