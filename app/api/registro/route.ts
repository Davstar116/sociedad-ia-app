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

    // Validamos que el semestre sea un número
    const semestreNumero = parseInt(data.semestre) || 1;

    // --- MAPEO EXACTO A TUS COLUMNAS DE NOTION ---
    const properties: any = {
      // 1. Título (Nombre Completo)
      "Nombre Completo": { 
        title: [{ text: { content: data.nombre || "Sin nombre" } }] 
      },
      
      // 2. Correo electrónico (Email)
      "Correo electrónico": { 
        email: data.email || null 
      },

      // 3. Celular (Teléfono)
      "Celular": { 
        phone_number: data.telefono || null 
      },

      // 4. Carrera (Texto)
      "Carrera": { 
        rich_text: [{ text: { content: data.carrera || "" } }] 
      },

      // 5. Semestre (Número)
      "Semestre": { 
        number: semestreNumero 
      },

      // 6. Núcleo (Selección múltiple) -> Aquí guardamos el Área de Interés
      // OJO: La opción que envíes (ej. "Desarrollo") DEBE existir en tu Notion 
      // o Notion debe permitir crear opciones nuevas.
      "Núcleo": { 
        multi_select: [{ name: data.area || "General" }] 
      }
    };

    // --- RESPUESTAS LARGAS (Van al cuerpo de la página) ---
    const children: any[] = [
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '🎯 Aportación' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: data.aportacion || "N/A" } }] },
      },
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '🏆 Mayor Orgullo' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: data.orgullo || "N/A" } }] },
      },
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '🤝 Equipo' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: data.equipo || "N/A" } }] },
      },
      {
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ text: { content: '🔥 Motivación' } }] },
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: data.motivacion || "N/A" } }] },
      },
    ];

    // CREAR LA PÁGINA
    await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties,
      children: children,
    });

    console.log("✅ Guardado exitoso en Notion.");

    // ENVIAR CORREO
    if (data.email) {
      try {
        await resend.emails.send({
          from: 'SIAFI <onboarding@resend.dev>', // Recuerda: Solo funciona a tu correo en el plan gratis
          to: [data.email],
          subject: 'Confirmación de Postulación - SIAFI',
          react: WelcomeEmail({ 
            nombre: data.nombre || "Postulante", 
            carrera: data.carrera, 
            semestre: data.semestre 
          }),
        });
      } catch (e) {
        console.error("⚠️ Error envío correo:", e);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Error Notion:", error.body || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}