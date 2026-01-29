import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { Resend } from 'resend';
// Importamos la plantilla de correo que creaste en el paso anterior
import { WelcomeEmail } from "../../components/emails/WelcomeEmail";

// Inicializamos Clientes
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const resend = new Resend(process.env.RESEND_API_KEY);
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. Validaciones básicas
    if (!DATABASE_ID) throw new Error("Falta ID Base de Datos en .env");

    // 2. Guardar en NOTION
    // (Asegúrate de que estos nombres de propiedades coincidan EXACTAMENTE con tu Notion)
    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        "Nombre Completo": { title: [{ text: { content: data.nombre } }] },
        "Correo Electrónico": { email: data.email },
        "Teléfono": { phone_number: data.telefono },
        "Carrera": { rich_text: [{ text: { content: data.carrera } }] },
        "Semestre": { rich_text: [{ text: { content: data.semestre } }] },
        "Aportación": { rich_text: [{ text: { content: data.aportacion } }] },
        "Mayor Orgullo": { rich_text: [{ text: { content: data.orgullo } }] },
        "Inspiración de Equipo": { rich_text: [{ text: { content: data.equipo } }] },
        "Motivación": { rich_text: [{ text: { content: data.motivacion } }] },
        "Area de Interes": { select: { name: data.area } },
        // Si tienes una propiedad de Status o Etapa, podrías definirla aquí también
        // "Status": { status: { name: "Nuevo" } }
      },
    });

    console.log("✅ Datos guardados en Notion correctamente.");

    // 3. Enviar CORREO AUTOMÁTICO (Resend)
    try {
      await resend.emails.send({
        from: 'SIAFI <onboarding@resend.dev>', // Usamos el correo de pruebas de Resend
        to: [data.email], // Enviamos al correo del postulante
        subject: 'Confirmación de Postulación - SIAFI',
        react: WelcomeEmail({ 
          nombre: data.nombre, 
          carrera: data.carrera, 
          semestre: data.semestre 
        }),
      });
      console.log("📧 Correo de bienvenida enviado a:", data.email);
    } catch (emailError) {
      // Si el correo falla, NO detenemos el proceso (ya se guardó en Notion)
      console.error("❌ Error enviando correo (pero se guardó en Notion):", emailError);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error General en Registro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}