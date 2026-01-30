import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
// import { Resend } from 'resend'; <--- Lo comentamos porque usaremos SMTP luego
import { createUser, getUserByEmail } from "../../lib/user-db";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID;

export async function POST(request: Request) {
  try {
    const data = await request.json();

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
    const skillsBlocks = [];
    if (data.skills) {
        for (const category in data.skills) {
            const skillSet = data.skills[category];
            skillsBlocks.push({ heading_3: { rich_text: [{ text: { content: category.toUpperCase() } }] } });
            let skillText = "";
            for (const skill in skillSet) { skillText += `${skill}: ${skillSet[skill]}/5 | `; }
            skillsBlocks.push({ paragraph: { rich_text: [{ text: { content: skillText } }] } });
        }
    }

    const respuestasBlocks = [];
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

    // ---------------------------------------------------------
    // 3. GUARDAR EN NOTION (Base de Datos Reclutamiento)
    // ---------------------------------------------------------
    await notion.pages.create({
      parent: { database_id: CANDIDATOS_DB_ID! },
      properties: {
        "Nombre completo": { title: [{ text: { content: data.nombre } }] },
        "Correo electrónico": { email: data.email },
        "Estatus del postulante": { status: { name: "Recibido" } },
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
        { heading_2: { rich_text: [{ text: { content: "📝 Respuestas del Formulario" } }] } },
        ...respuestasBlocks
      ]
    });

    // ---------------------------------------------------------
    // 4. SIMULACIÓN DE CORREO (PENDIENTE DE CREDENCIALES)
    // ---------------------------------------------------------
    
    // Aquí es donde pondremos 'nodemailer' cuando tengas la cuenta de la sociedad.
    // Por ahora, solo imprimimos en consola para que NO falle.
    
    console.log("📧 [SIMULACIÓN] Correo enviado a:", data.email);
    console.log("📧 [SIMULACIÓN] Contenido:", `Hola ${data.nombre}, tu pass es: ${passwordParaCorreo}`);

    // Retornamos éxito SIEMPRE, porque Notion sí se guardó.
    return NextResponse.json({ success: true, message: "Registro guardado correctamente (Correo pendiente)" });

  } catch (error: any) {
    console.error("🔥 Error CRÍTICO en API Register:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}