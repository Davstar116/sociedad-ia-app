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
              title: { equals: n }
            }))
          }
        })
      });

      if (buscarMiembrosRes.ok) {
        const miembrosData = await buscarMiembrosRes.json();
        miembrosData.results.forEach((m: any) => {
          const correo = m.properties["Correo"]?.email || m.properties["Email"]?.email; 
          if (correo) correosEntrevistadores.push(correo);
        });
      }
    }

    // =========================================================
    // 3. GENERAR GOOGLE MEET (CORRECCIÓN DE ZONA HORARIA)
    // =========================================================
    let meetLink = ""; 
    const asistentesGoogle = [
      { email: email }, 
      { email: "david.solorzano.a@gmail.com" },
      { email: "astridmondragon25@gmail.com" }
    ]; 
    correosEntrevistadores.forEach(correo => asistentesGoogle.push({ email: correo }));
    
    try {
      if (process.env.SIAFI_CALENDAR_CLIENT_ID && process.env.SIAFI_CALENDAR_REFRESH_TOKEN) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.SIAFI_CALENDAR_CLIENT_ID,
          process.env.SIAFI_CALENDAR_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.SIAFI_CALENDAR_REFRESH_TOKEN });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const [horaInicio, horaFin] = horaString.split(" - ");
        
        // Construimos un string ISO hardcodeando la zona horaria de México (-06:00) para evitar que el servidor de Vercel (UTC) lo arruine
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

      // ✅ OBTENEMOS EL DOMINIO DINÁMICAMENTE EN VEZ DE USAR EL .ENV
      const host = request.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      const dynamicBaseUrl = `${protocol}://${host}`;

      // ✉️ Correo al Postulante
      const htmlPostulante = PostulanteEntrevistaEmailTemplate({
        nombre: nombre,
        baseUrl: dynamicBaseUrl, // <-- Mandamos el dinámico
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

      // ✉️ Correo a los Entrevistadores y a los Admins Maestros
      const correosStaff = [...correosEntrevistadores, "david.solorzano.a@gmail.com", "astridmondragon25@gmail.com"];
      if (correosStaff.length > 0) {
        
        const htmlStaff = EntrevistadorAsignacionEmailTemplate({
          nombrePostulante: nombre,
          correoPostulante: email,
          fechaLegible: fechaLegible,
          hora: horaString,
          meetLink: meetLink,
          baseUrl: dynamicBaseUrl // <-- Mandamos el dinámico
        });

        await transporter.sendMail({
          from: `"Sistema SIAFI" <${EMAIL_USER}>`,
          to: correosStaff.join(', '),
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