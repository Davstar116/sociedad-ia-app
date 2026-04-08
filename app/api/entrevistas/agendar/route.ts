import { NextResponse } from "next/server";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import { PostulanteEntrevistaEmailTemplate } from "@/app/components/emails/PostulanteEntrevistaEmail";
import { EntrevistadorAsignacionEmailTemplate } from "@/app/components/emails/EntrevistadorAsignacionEmail";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID; 
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://siafi.com.mx";

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
    // 1. VALIDACIÓN Y EXTRACCIÓN DE DATOS DE NOTION
    // =========================================================
    const getRes = await fetch(`https://api.notion.com/v1/pages/${bloqueId}`, {
      method: "GET",
      headers: notionHeaders,
      cache: 'no-store' 
    });

    if (!getRes.ok) throw new Error("No se pudo conectar con la base de datos de Entrevistas.");
    const pageData = await getRes.json();
    
    const estatusActual = pageData.properties["Estatus"]?.select?.name;
    if (estatusActual !== "Disponible") {
      return NextResponse.json({ 
        success: false, 
        error: "¡Oh no! Alguien más acaba de reservar este horario hace un instante. Por favor, selecciona otro." 
      }, { status: 409 }); 
    }

    const horaString = pageData.properties["Hora"]?.rich_text[0]?.plain_text || "00:00 - 00:00";
    const fechaNum = pageData.properties["Fecha"]?.number || 1; 
    const diaTexto = pageData.properties["Dia"]?.select?.name || "Día";
    
    const nombreEntrevistador1 = pageData.properties["Entrevistador 1"]?.rich_text[0]?.plain_text || "";
    const nombreEntrevistador2 = pageData.properties["Entrevistador 2"]?.rich_text[0]?.plain_text || "";

    // =========================================================
    // 2. BUSCAR CORREOS DE LOS ENTREVISTADORES
    // =========================================================
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

    // =========================================================
    // 3. GENERAR GOOGLE MEET (ASIGNANDO PROPIETARIOS)
    // =========================================================
    let meetLink = ""; 
    
    // El candidato va como invitado normal
    const asistentesGoogle: any[] = [
      { email: email }
    ]; 
    
    // Los admins y entrevistadores van como invitados que han "aceptado" la invitación
    // para que Calendar les otorgue permisos elevados automáticamente.
    const adminsYEntrevistadores = [
      "david.solorzano.a@gmail.com", 
      "astridmondragon25@gmail.com",
      ...correosEntrevistadores
    ];

    // Evitamos duplicados por si acaso
    const correosUnicosStaff = [...new Set(adminsYEntrevistadores)];

    correosUnicosStaff.forEach(correo => {
        asistentesGoogle.push({ email: correo, responseStatus: "accepted" });
    });
    
    try {
      if (process.env.SIAFI_CALENDAR_CLIENT_ID && process.env.SIAFI_CALENDAR_REFRESH_TOKEN) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.SIAFI_CALENDAR_CLIENT_ID,
          process.env.SIAFI_CALENDAR_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.SIAFI_CALENDAR_REFRESH_TOKEN });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

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
            guestsCanModify: true,  // ✅ CLAVE: Permite a los invitados (entrevistadores) editar la reunión y admitir gente
            guestsCanInviteOthers: true, 
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
        meetLink = "Enlace pendiente de asignación";
      }
    } catch (calendarError) {
      console.error("Error generando el Google Meet:", calendarError);
      meetLink = "Enlace pendiente de asignación";
    }

    // =========================================================
    // 4. ACTUALIZAR NOTION (Sellar el candado)
    // =========================================================
    const patchRes = await fetch(`https://api.notion.com/v1/pages/${bloqueId}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({
        properties: {
          "Estatus": { select: { name: "Reservado" } },
          "Postulante": { rich_text: [{ text: { content: nombre } }] },
          "Correo Postulante": { email: email },
          "Link Meet": { url: meetLink !== "Enlace pendiente de asignación" ? meetLink : null }
        }
      })
    });

    if (!patchRes.ok) throw new Error("No se pudo reservar en Notion de forma definitiva.");

    // =========================================================
    // 5. ENVÍO DE CORREOS AUTOMÁTICOS CON PLANTILLAS HTML
    // =========================================================
    if (EMAIL_USER && EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
      });

      const fechaLegible = `${diaTexto} ${fechaNum} de Abril`;
      const host = request.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      const dynamicBaseUrl = `${protocol}://${host}`;

      // ✉️ Correo al Postulante
      const htmlPostulante = PostulanteEntrevistaEmailTemplate({
        nombre: nombre,
        baseUrl: dynamicBaseUrl,
        fechaLegible: fechaLegible,
        hora: horaString,
        meetLink: meetLink
      });

      await transporter.sendMail({
        from: `"Reclutamiento SIAFI" <${EMAIL_USER}>`,
        to: email,
        subject: `✅ Entrevista Confirmada - SIAFI UNAM`,
        html: htmlPostulante
      });

      // ✉️ Correo SOLO a los Entrevistadores (Sin Admins)
      if (correosEntrevistadores.length > 0) {
        
        const htmlStaff = EntrevistadorAsignacionEmailTemplate({
          nombrePostulante: nombre,
          correoPostulante: email,
          fechaLegible: fechaLegible,
          hora: horaString,
          meetLink: meetLink,
          baseUrl: dynamicBaseUrl 
        });

        await transporter.sendMail({
          from: `"Sistema SIAFI" <${EMAIL_USER}>`,
          to: correosEntrevistadores.join(', '), // ✅ Aquí excluímos a los admins
          subject: `🔔 Nueva Entrevista Asignada - ${nombre}`,
          html: htmlStaff
        });
      }
    }

    return NextResponse.json({ success: true, meetLink });

  } catch (error: any) {
    console.error("Error crítico agendando entrevista:", error);
    return NextResponse.json({ success: false, error: "Error del servidor al intentar guardar tu selección." }, { status: 500 });
  }
}