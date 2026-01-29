import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import nodemailer from "nodemailer"; // Usamos el nuevo motor
// La plantilla HTML sigue sirviendo igual
import { WelcomeEmail } from "../../components/emails/WelcomeEmail";
import { render } from '@react-email/render'; // Necesario para convertir el React a HTML

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!DATABASE_ID) throw new Error("Falta ID Base de Datos en .env");

    const semestreNumero = parseInt(data.semestre) || 1;

    // --- 1. GUARDAR EN NOTION (Igual que antes) ---
    const properties: any = {
      "Nombre Completo": { title: [{ text: { content: data.nombre || "Sin nombre" } }] },
      "Correo electrónico": { email: data.email || null },
      "Celular": { phone_number: data.telefono || null },
      "Carrera": { rich_text: [{ text: { content: data.carrera || "" } }] },
      "Semestre": { number: semestreNumero },
      "Núcleo": { multi_select: [{ name: data.area || "General" }] }
    };

    const children: any[] = [
      { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: '🎯 Aportación' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: data.aportacion || "N/A" } }] } },
      { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: '🏆 Mayor Orgullo' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: data.orgullo || "N/A" } }] } },
      { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: '🤝 Equipo' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: data.equipo || "N/A" } }] } },
      { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ text: { content: '🔥 Motivación' } }] } },
      { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: data.motivacion || "N/A" } }] } },
    ];

    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties,
      children: children,
    });

    console.log("✅ Notion Guardado.");

    // --- 2. ENVIAR CORREO CON GMAIL ---
    if (data.email) {
      try {
        // Configuración del Transporter (El Cartero)
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS, // La clave de aplicación
          },
        });

        // Convertimos tu diseño React a HTML puro
        const emailHtml = await render(WelcomeEmail({ 
          nombre: data.nombre || "Postulante", 
          carrera: data.carrera, 
          semestre: data.semestre 
        }));

        // Enviar
        await transporter.sendMail({
          from: '"SIAFI Reclutamiento" <' + process.env.GMAIL_USER + '>',
          to: data.email, // ¡Ahora sí llega a cualquiera!
          subject: 'Confirmación de Postulación - SIAFI',
          html: emailHtml,
        });

        console.log("📧 Correo Gmail enviado a:", data.email);
      } catch (e) {
        console.error("❌ Error enviando Gmail:", e);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error General:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}