import { NextResponse } from "next/server";
import { google } from "googleapis";
import { extractMeetLink } from "@/app/api/entrevistas/utils/googleMeetHelper";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID; 

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function POST() {
  try {
    if (!process.env.SIAFI_CALENDAR_CLIENT_ID || !process.env.SIAFI_CALENDAR_REFRESH_TOKEN) {
        return NextResponse.json({ success: false, error: "Credenciales de Google Calendar no configuradas." }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.SIAFI_CALENDAR_CLIENT_ID,
      process.env.SIAFI_CALENDAR_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.SIAFI_CALENDAR_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 1. Obtener todas las entrevistas en estado 'Reservado'
    const getRes = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: {
          property: "Estatus",
          select: { equals: "Reservado" }
        }
      }),
      cache: 'no-store' 
    });

    if (!getRes.ok) throw new Error("No se pudo conectar con la base de datos de Entrevistas.");
    const data = await getRes.json();
    
    let regenerados = 0;

    for (const page of data.results) {
        const linkMeetCurrent = page.properties["Link Meet"]?.url;
        
        // Solo regenerar si está vacío o dice "Enlace pendiente de asignación" (Nota: URL type en Notion a veces no acepta texto libre, si falló quedó en null)
        if (!linkMeetCurrent || !linkMeetCurrent.includes("meet.google.com")) {
            const bloqueId = page.id;
            const horaString = page.properties["Hora"]?.rich_text[0]?.plain_text || "00:00 - 00:00";
            const fechaNum = page.properties["Fecha"]?.number || 1; 
            const nombre = page.properties["Postulante"]?.rich_text[0]?.plain_text || "Candidato";
            const email = page.properties["Correo Postulante"]?.email || "";
            const nombreEntrevistador1 = page.properties["Entrevistador 1"]?.rich_text[0]?.plain_text || "";
            const nombreEntrevistador2 = page.properties["Entrevistador 2"]?.rich_text[0]?.plain_text || "";

            let correosEntrevistadores: string[] = [];
            
            if (nombreEntrevistador1 || nombreEntrevistador2) {
              const nombresABuscar = [nombreEntrevistador1, nombreEntrevistador2].filter(Boolean);
              
              const buscarMiembrosRes = await fetch(`https://api.notion.com/v1/databases/${USERS_DB_ID}/query`, {
                method: "POST",
                headers: notionHeaders,
                body: JSON.stringify({
                  filter: {
                    or: nombresABuscar.map(n => ({
                      property: "Nombre", 
                      rich_text: { equals: n }
                    }))
                  }
                })
              });
        
              if (buscarMiembrosRes.ok) {
                const miembrosData = await buscarMiembrosRes.json();
                miembrosData.results.forEach((m: any) => {
                  const correo = m.properties["Correo"]?.email || m.properties["Email"]?.title?.[0]?.plain_text; 
                  if (correo) correosEntrevistadores.push(correo);
                });
              }
            }

            const asistentesGoogle: any[] = email ? [{ email: email }] : []; 
            const adminsYEntrevistadores = [
              "david.solorzano.a@gmail.com", 
              "astridmondragon25@gmail.com",
              ...correosEntrevistadores
            ];
        
            const correosUnicosStaff = [...new Set(adminsYEntrevistadores)];
            correosUnicosStaff.forEach(correo => {
                asistentesGoogle.push({ email: correo, responseStatus: "accepted" });
            });

            // Parse Date
            const [horaInicio, horaFin] = horaString.split(" - ");
            const mes = "04"; // Abril
            const diaNum = String(fechaNum).padStart(2, '0');
            const startDateTime = `2026-${mes}-${diaNum}T${horaInicio}:00-06:00`;
            const endDateTime = `2026-${mes}-${diaNum}T${horaFin}:00-06:00`;

            const event = await calendar.events.insert({
                calendarId: "primary",
                conferenceDataVersion: 1, 
                sendUpdates: "all", 
                requestBody: {
                  summary: `Entrevista SIAFI: ${nombre}`,
                  description: `Entrevista de admisión a la Sociedad de Inteligencia Artificial.\n\nPostulante: ${nombre}\nEntrevistadores: ${nombreEntrevistador1} y ${nombreEntrevistador2}\n\n*Por favor, únete puntual al enlace de Meet adjunto.*`,
                  start: { dateTime: startDateTime, timeZone: "America/Mexico_City" },
                  end: { dateTime: endDateTime, timeZone: "America/Mexico_City" },
                  attendees: asistentesGoogle, 
                  guestsCanModify: true,  
                  guestsCanInviteOthers: true, 
                  conferenceData: {
                    createRequest: {
                      requestId: `regenerado-${bloqueId}-${Date.now()}`,
                      conferenceSolutionKey: { type: "hangoutsMeet" }
                    }
                  }
                }
            });
            
            const meetLink = extractMeetLink(event);
            if (meetLink) {
                // Actualizar DB
                await fetch(`https://api.notion.com/v1/pages/${bloqueId}`, {
                    method: "PATCH",
                    headers: notionHeaders,
                    body: JSON.stringify({
                        properties: {
                        "Link Meet": { url: meetLink }
                        }
                    })
                });
                regenerados++;
                console.log(`Link regenerado para el candidato: ${nombre} -> ${meetLink}`);
            }
        }
    }

    return NextResponse.json({ success: true, message: `Se generaron exitosamente ${regenerados} links faltantes.` });

  } catch (error: any) {
    console.error("Error al regenerar links:", error);
    return NextResponse.json({ success: false, error: "Error interno intentando regenerar." }, { status: 500 });
  }
}
