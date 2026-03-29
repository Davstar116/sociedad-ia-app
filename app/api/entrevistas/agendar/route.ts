import { NextResponse } from "next/server";
import { google } from "googleapis";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function POST(request: Request) {
  try {
    const { bloqueId, email, nombre } = await request.json();

    if (!bloqueId || !email || !nombre) {
      return NextResponse.json({ success: false, error: "Faltan datos del postulante." }, { status: 400 });
    }

    // =========================================================
    // 1. VALIDACIÓN DE CONCURRENCIA (Ver si sigue disponible)
    // =========================================================
    const getRes = await fetch(`https://api.notion.com/v1/pages/${bloqueId}`, {
      method: "GET",
      headers: notionHeaders,
      cache: 'no-store' // No leer de la caché para evitar datos fantasma
    });

    if (!getRes.ok) throw new Error("No se pudo conectar con la base de datos.");
    const pageData = await getRes.json();
    
    const estatusActual = pageData.properties["Estatus"]?.select?.name;
    if (estatusActual !== "Disponible") {
      return NextResponse.json({ 
        success: false, 
        error: "¡Oh no! Alguien más acaba de reservar este horario hace un instante. Por favor, selecciona otro." 
      }, { status: 409 }); // 409 Conflict
    }

    // Extraer datos del bloque para armar el calendario
    const horaString = pageData.properties["Hora"]?.rich_text[0]?.plain_text || "00:00 - 00:00";
    const fechaNum = pageData.properties["Fecha"]?.number || 1; 

    // =========================================================
    // 2. GENERAR GOOGLE MEET (USANDO CREDENCIALES EXCLUSIVAS DE SIAFI)
    // =========================================================
    let meetLink = ""; 
    
    try {
      // Usamos las variables nuevas SIAFI_CALENDAR_...
      if (process.env.SIAFI_CALENDAR_CLIENT_ID && process.env.SIAFI_CALENDAR_REFRESH_TOKEN) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.SIAFI_CALENDAR_CLIENT_ID,
          process.env.SIAFI_CALENDAR_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.SIAFI_CALENDAR_REFRESH_TOKEN });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        // Parsear fechas (Mes 3 = Abril en JavaScript, año 2026)
        const [horaInicio, horaFin] = horaString.split(" - ");
        const [hInicio, mInicio] = horaInicio.split(":");
        const [hFin, mFin] = horaFin.split(":");
        
        const startDate = new Date(2026, 3, fechaNum, parseInt(hInicio), parseInt(mInicio));
        const endDate = new Date(2026, 3, fechaNum, parseInt(hFin), parseInt(mFin));

        const event = await calendar.events.insert({
          calendarId: "primary",
          conferenceDataVersion: 1, 
          requestBody: {
            summary: `SIAFI Entrevista: ${nombre}`,
            description: `Entrevista de admisión a la Sociedad de Inteligencia Artificial.\nPostulante: ${nombre}\nCorreo: ${email}\n\n*Por favor, únete puntual al enlace de Meet adjunto.*`,
            start: { dateTime: startDate.toISOString(), timeZone: "America/Mexico_City" },
            end: { dateTime: endDate.toISOString(), timeZone: "America/Mexico_City" },
            conferenceData: {
              createRequest: {
                requestId: `siafi-entrevista-${bloqueId}`,
                conferenceSolutionKey: { type: "hangoutsMeet" }
              }
            }
          }
        });
        
        if (event.data.hangoutLink) {
          meetLink = event.data.hangoutLink;
        }
      } else {
        console.warn("⚠️ Advertencia: Faltan las variables SIAFI_CALENDAR en el .env");
        meetLink = "Enlace pendiente de asignación";
      }
    } catch (calendarError) {
      console.error("Error generando el Google Meet:", calendarError);
      meetLink = "Error generando enlace (Contactar a Soporte)";
    }

    // =========================================================
    // 3. ACTUALIZAR NOTION (Sellar el candado)
    // =========================================================
    const patchRes = await fetch(`https://api.notion.com/v1/pages/${bloqueId}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({
        properties: {
          "Estatus": { select: { name: "Reservado" } },
          "Postulante": { rich_text: [{ text: { content: nombre } }] },
          "Correo Postulante": { email: email },
          "Link Meet": { url: meetLink !== "Enlace pendiente de asignación" && !meetLink.includes("Error") ? meetLink : null }
        }
      })
    });

    if (!patchRes.ok) {
      throw new Error("No se pudo reservar en Notion de forma definitiva.");
    }

    // AQUI ENTRA LA FASE 3 (Los correos que haremos en el siguiente paso)

    return NextResponse.json({ success: true, meetLink });

  } catch (error: any) {
    console.error("Error crìtico agendando entrevista:", error);
    return NextResponse.json({ success: false, error: "Error del servidor al intentar guardar tu selección." }, { status: 500 });
  }
}