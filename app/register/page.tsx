import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "../../lib/user-db";
import nodemailer from "nodemailer"; // 1. IMPORTAMOS NODEMAILER

// Configuración manual de Headers para Notion
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID;
const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// 2. CONFIGURAMOS EL "CARTERO" DE GMAIL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Diccionario de preguntas
const PREGUNTAS_NUCLEOS: Record<string, string[]> = {
  "Organización": [
    "Si un ponente invitado cancela su participación en una plática importante a tan solo unas horas del evento, ¿cómo manejarías la situación y qué alternativas propondrías?",
    "En el trabajo en equipo es común que surjan desacuerdos. ¿Cómo intervienes para resolver un conflicto entre dos compañeros y mantener un buen ambiente de trabajo?",
    "¿Qué estrategias o dinámicas propondrías para fomentar la integración y la convivencia sana entre todos los miembros de la sociedad?",
    "Cuando tienes múltiples fechas límite acercándose al mismo tiempo (por ejemplo, exámenes, tareas y un evento), ¿cómo priorizas tus actividades y gestionas tu tiempo?"
  ],
  "Difusión": [
    "Si tuviéramos que anunciar un nuevo taller de inteligencia artificial para la comunidad de la Facultad de Ingeniería, ¿qué elementos visuales y qué tipo de mensaje incluirías en un post para captar la atención?",
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

    // ---------------------------------------------------------
    // 0. BLINDAJE: VERIFICAR SI EL CORREO YA ESTÁ REGISTRADO
    // ---------------------------------------------------------
    const checkDuplicateRes = await fetch(`https://api.notion.com/v1/databases/${CANDIDATOS_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
            filter: {
                property: "Correo electrónico",
                email: { equals: data.email }
            }
        }),
    });

    const duplicateData = await checkDuplicateRes.json();
    
    if (duplicateData.results && duplicateData.results.length > 0) {
        return NextResponse.json(
            { error: "Ya existe una postulación registrada con este correo electrónico." }, 
            { status: 400 }
        );
    }

    // ---------------------------------------------------------
    // 1. GESTIÓN DE USUARIO (Notion Usuarios)
    // ---------------------------------------------------------
    const existingUser = await getUserByEmail(data.email);
    let passwordParaCorreo = "";
    
    if (!existingUser) {
      const newPassword = generatePassword();
      await createUser({
        email: data.email,
        name: data.nombre,
        password: newPassword,
        role: "Postulante",
        provider: "credentials"
      });
      passwordParaCorreo = newPassword;
      console.log(`✅ Usuario creado: ${data.email} | Pass: ${newPassword}`);
    } else {
      console.log(`⚠️ Usuario ya existía: ${data.email}`);
      passwordParaCorreo = "(Usa tu contraseña actual)";
    }

    // ---------------------------------------------------------
    // 2. PREPARAR CONTENIDO DETALLADO (Bloques de Notion)
    // ---------------------------------------------------------
    
    // BLOQUES: SKILLS
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

    // BLOQUES: RESPUESTAS GENERALES
    const respuestasBlocks: any[] = [];
    if (data.respuestas) {
        const questionsMap: any = {
            aportacion: "Principal Aportación",
            orgullo: "Mayor Logro/Orgullo",
            inspiracion: "Dinámica de Trabajo",
            motivo: "Motivo para unirse",
            expectativas: "Expectativas",
            fuente: "Fuente",
            areasInteres: "Intereses Extra"
        };
        for (const key in data.respuestas) {
            if (questionsMap[key]) {
                respuestasBlocks.push({ heading_3: { rich_text: [{ text: { content: questionsMap[key] } }] } });
                respuestasBlocks.push({ paragraph: { rich_text: [{ text: { content: data.respuestas[key] || "Sin respuesta" } }] } });
            }
        }
    }

    // BLOQUES: RESPUESTAS POR NÚCLEO
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

    // ---------------------------------------------------------
    // 3. GUARDAR EN NOTION
    // ---------------------------------------------------------
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
    // 4. ENVÍO REAL DE CORREO CON NODEMAILER
    // ---------------------------------------------------------
    console.log("📧 Enviando credenciales a:", data.email);
    
    // Plantilla HTML inyectada con las variables del postulante
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tus Credenciales - SIAFI</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111111; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <tr><td style="height: 4px; background-color: #0051ff;"></td></tr>
                        <tr>
                            <td align="center" style="padding: 40px 40px 20px 40px;">
                                <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1px;">Soph<span style="color: #00baff;">IA</span></h1>
                                <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase;">by SIAFI</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 40px 40px 40px;">
                                <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ffffff;">¡Hola, ${data.nombre}! 👋</h2>
                                <p style="margin: 0 0 20px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">Tu postulación para el proceso de reclutamiento <strong>2026-2</strong> ha sido recibida exitosamente. Nos emociona mucho conocer tu perfil.</p>
                                <p style="margin: 0 0 20px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">Hemos creado una cuenta de acceso en nuestro portal para que puedas darle seguimiento a tu proceso. Estas son tus credenciales oficiales:</p>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a; border: 1px solid #2563eb; border-radius: 12px; margin-bottom: 30px;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <p style="margin: 0 0 10px 0; font-size: 13px; color: #00baff; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Datos de Acceso</p>
                                            <p style="margin: 0 0 8px 0; font-size: 15px; color: #ffffff;"><span style="color: #6b7280;">Usuario:</span> ${data.email}</p>
                                            <p style="margin: 0; font-size: 15px; color: #ffffff;"><span style="color: #6b7280;">Contraseña:</span> <strong style="letter-spacing: 2px; font-family: monospace;">${passwordParaCorreo}</strong></p>
                                        </td>
                                    </tr>
                                </table>
                                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #ffffff;">¿Qué sigue?</h3>
                                <p style="margin: 0 0 30px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">Nuestro equipo y SophIA están evaluando tus respuestas. Mantente atent@ a este correo, ya que por este medio te notificaremos si avanzas a la fase de entrevistas.</p>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td align="center">
                                            <a href="https://tu-proyecto.vercel.app/login" target="_blank" style="display: inline-block; background-color: #0051ff; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">Ir al Portal de SIAFI</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #0a0a0a; padding: 30px 40px; border-top: 1px solid #1f2937; text-align: center;">
                                <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">¿Tienes problemas para acceder? Contáctanos en:<br><a href="mailto:siafi.reclutamiento@gmail.com" style="color: #00baff; text-decoration: none; font-weight: bold;">siafi.reclutamiento@gmail.com</a></p>
                                <p style="margin: 0; font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 1px;">Facultad de Ingeniería, UNAM</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
      await transporter.sendMail({
        from: '"Reclutamiento SIAFI" <siafi.reclutamiento@gmail.com>', // Quien lo envía
        to: data.email, // A quien va dirigido (el postulante)
        subject: "Tus Credenciales de Acceso - Reclutamiento SIAFI 2026-2",
        html: htmlContent,
      });
      console.log("✅ Correo enviado con éxito a", data.email);
    } catch (mailError) {
      console.error("⚠️ Error enviando correo:", mailError);
    }

    return NextResponse.json({ success: true, message: "Registro guardado correctamente" });

  } catch (error: any) {
    console.error("🔥 Error CRÍTICO en API Register:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}