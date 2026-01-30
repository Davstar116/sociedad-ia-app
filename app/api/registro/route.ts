import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { Resend } from 'resend';
import { WelcomeEmail } from '@/app/components/emails/WelcomeEmail';
import { createUser, getUserByEmail } from "../../lib/user-db";

// Generador de contraseñas
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const resend = new Resend(process.env.RESEND_API_KEY);
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID; // Tu tabla de Reclutamiento

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // ---------------------------------------------------------
    // 1. GESTIÓN DE USUARIO Y CONTRASEÑA (SIAFI Usuarios)
    // ---------------------------------------------------------
    
    // Verificamos si ya existe usuario
    const existingUser = await getUserByEmail(data.email);
    let passwordParaCorreo = "";
    
    if (!existingUser) {
      // Si es nuevo, creamos cuenta y contraseña
      const newPassword = generatePassword();
      await createUser({
        email: data.email,
        name: `${data.nombre} ${data.apellidos}`,
        password: newPassword,
        role: "Postulante",
        provider: "credentials"
      });
      passwordParaCorreo = newPassword;
      console.log(`✅ Usuario creado: ${data.email}`);
    } else {
      // Si ya existe, no le cambiamos la pass, pero avisamos en el correo
      console.log(`⚠️ Usuario ya existía: ${data.email}`);
      passwordParaCorreo = "(Usa tu contraseña actual)";
    }

    // ---------------------------------------------------------
    // 2. PREPARAR EL CONTENIDO DETALLADO PARA NOTION (Body)
    // ---------------------------------------------------------
    
    // Convertimos las skills a bloques de texto para Notion
    const skillsBlocks = [];
    if (data.skills) {
        for (const category in data.skills) {
            const skillSet = data.skills[category];
            skillsBlocks.push({
                heading_3: { rich_text: [{ text: { content: category.toUpperCase() } }] }
            });
            let skillText = "";
            for (const skill in skillSet) {
                skillText += `${skill}: ${skillSet[skill]}/5 | `;
            }
            skillsBlocks.push({
                paragraph: { rich_text: [{ text: { content: skillText } }] }
            });
        }
    }

    // Convertimos las respuestas largas a bloques
    const respuestasBlocks = [];
    if (data.respuestas) {
        const questionsMap: any = {
            aportacion: "Principal Aportación",
            orgullo: "Mayor Logro/Orgullo",
            inspiracion: "Dinámica de Trabajo",
            motivo: "Motivo para unirse",
            expectativas: "Expectativas"
        };

        for (const key in data.respuestas) {
            if (questionsMap[key]) {
                respuestasBlocks.push({
                    heading_3: { rich_text: [{ text: { content: questionsMap[key] } }] }
                });
                respuestasBlocks.push({
                    paragraph: { rich_text: [{ text: { content: data.respuestas[key] || "Sin respuesta" } }] }
                });
            }
        }
    }

    // ---------------------------------------------------------
    // 3. GUARDAR EN NOTION (Base de Datos Candidatos)
    // ---------------------------------------------------------
    
    await notion.pages.create({
      parent: { database_id: CANDIDATOS_DB_ID! },
      properties: {
        // DATOS BÁSICOS (Columnas)
        "Nombre": { title: [{ text: { content: data.nombre } }] },
        "Apellidos": { rich_text: [{ text: { content: data.apellidos } }] },
        "Correo": { email: data.email },
        "Celular": { phone_number: data.celular },
        "Carrera": { select: { name: data.carrera } },
        "Semestre": { number: parseInt(data.semestre) },
        "Cuenta": { rich_text: [{ text: { content: data.numeroCuenta } }] },
        "Area Interes": { select: { name: data.areaInteres } }, // Núcleos concatenados
        "CV Link": { url: data.cvLink || null },
        "Estado": { status: { name: "Recibido" } },
      },
      // DATOS DETALLADOS (Cuerpo de la página)
      children: [
        {
            heading_1: { rich_text: [{ text: { content: "Perfil del Postulante" } }] }
        },
        {
            callout: {
                rich_text: [{ text: { content: `Postulación recibida el ${new Date().toLocaleDateString()}` } }],
                icon: { emoji: "📅" }
            }
        },
        { divider: {} },
        { heading_2: { rich_text: [{ text: { content: "🧠 Evaluación de Skills" } }] } },
        ...skillsBlocks, // Insertamos los bloques de skills generados arriba
        { divider: {} },
        { heading_2: { rich_text: [{ text: { content: "📝 Respuestas del Formulario" } }] } },
        ...respuestasBlocks // Insertamos los bloques de respuestas
      ]
    });

    // ---------------------------------------------------------
    // 4. ENVIAR CORREO (Resend)
    // ---------------------------------------------------------
    const { error } = await resend.emails.send({
      from: 'SIAFI <onboarding@resend.dev>', // O tu dominio verificado
      to: [data.email],
      subject: '¡Registro Exitoso y Credenciales SIAFI!',
      react: WelcomeEmail({ 
        nombre: data.nombre,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://sociedad-ia-app.vercel.app',
        passwordGenerada: passwordParaCorreo,
        emailUsuario: data.email
      }),
    });

    if (error) {
      console.error("Error enviando correo:", error);
      // No fallamos la petición si el correo falla, pero lo registramos
    }

    return NextResponse.json({ success: true, message: "Proceso completo" });

  } catch (error: any) {
    console.error("Error Master API Register:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}