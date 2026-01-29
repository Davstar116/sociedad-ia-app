import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { Resend } from 'resend';
import { WelcomeEmail } from "../../components/emails/WelcomeEmail";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const resend = new Resend(process.env.RESEND_API_KEY);
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!DATABASE_ID) throw new Error("Falta ID Base de Datos en .env");

    // --- ESTRUCTURA DE LA PÁGINA ---
    // 1. Propiedades (Columnas de la tabla)
    const properties: any = {
      "Nombre Completo": { title: [{ text: { content: data.nombre || "Sin nombre" } }] },
      "Correo Electrónico": { email: data.email || "" },
      "Teléfono": { phone_number: data.telefono || "" },
      "Carrera": { rich_text: [{ text: { content: data.carrera || "" } }] },
      "Semestre": { rich_text: [{ text: { content: data.semestre || "" } }] },
      "Area de Interes": { select: { name: data.area || "General" } },
    };

    // 2. Contenido (Bloques dentro de la página)
    // Aquí es donde SophIA leerá las respuestas largas
    const children: any[] = [
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '🎯 Aportación a la Sociedad' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: data.aportacion || "Sin respuesta" } }] },
      },
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '🏆 Mayor Orgullo' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: data.orgullo || "Sin respuesta" } }] },
      },
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '🤝 Trabajo en Equipo' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: data.equipo || "Sin respuesta" } }] },
      },
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '🔥 Motivación' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: data.motivacion || "Sin respuesta" } }] },
      },
    ];

    // CREAR LA PÁGINA EN NOTION
    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties,
      children: children, // <--- Aquí inyectamos las respuestas largas
    });

    console.log("✅ Candidato guardado con respuestas en el cuerpo.");

    // ENVIAR CORREO (Si hay email válido)
    if (data.email) {
      try {
        await resend.emails.send({
          from: 'SIAFI <onboarding@resend.dev>',
          to: [data.email],
          subject: 'Confirmación de Postulación - SIAFI',
          react: WelcomeEmail({ 
            nombre: data.nombre || "Postulante", 
            carrera: data.carrera || "Ingeniería", 
            semestre: data.semestre || "N/A" 
          }),
        });
      } catch (e) {
        console.error("⚠️ Correo no enviado (pero registro exitoso).");
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error CRÍTICO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}