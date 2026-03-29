import { NextResponse } from "next/server";
import { google } from "googleapis";
import nodemailer from "nodemailer";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID; // ✅ Variable actualizada
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

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
      
      // ✅ Utilizamos la base de datos de Usuarios actualizada
      const buscarMiembrosRes = await fetch(`https://api.notion.com/v1/databases/${USERS_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          filter: {
            or: nombresABuscar.map(n => ({
              property: "Nombre", // Asegúrate de que así se llame la columna del nombre en tu DB de Usuarios
              title: { equals: n }
            }))
          }
        })
      });

      if (buscarMiembrosRes.ok) {
        const miembrosData = await buscarMiembrosRes.json();
        miembrosData.results.forEach((m: any) => {
          const correo = m.properties["Correo"]?.email || m.properties["Email"]?.email; // Ajusta según el nombre de tu columna
          if (correo) correosEntrevistadores.push(correo);
        });
      }
    }

    // =========================================================
    // 3. GENERAR GOOGLE MEET CON INVITADOS (Evita sala de espera)
    // =========================================================
    let meetLink = ""; 
    const asistentesGoogle = [{ email: email }]; // Siempre invitamos al postulante
    correosEntrevistadores.forEach(correo => asistentesGoogle.push({ email: correo })); // Agregamos a los entrevistadores
    
    try {
      if (process.env.SIAFI_CALENDAR_CLIENT_ID && process.env.SIAFI_CALENDAR_REFRESH_TOKEN) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.SIAFI_CALENDAR_CLIENT_ID,
          process.env.SIAFI_CALENDAR_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.SIAFI_CALENDAR_REFRESH_TOKEN });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const [horaInicio, horaFin] = horaString.split(" - ");
        const [hInicio, mInicio] = horaInicio.split(":");
        const [hFin, mFin] = horaFin.split(":");
        
        const startDate = new Date(2026, 3, fechaNum, parseInt(hInicio), parseInt(mInicio));
        const endDate = new Date(2026, 3, fechaNum, parseInt(hFin), parseInt(mFin));

        const event = await calendar.events.insert({
          calendarId: "primary",
          conferenceDataVersion: 1, 
          sendUpdates: "all", // Esto fuerza a que les llegue la invitación oficial de Google a sus calendarios
          requestBody: {
            summary: `Entrevista SIAFI: ${nombre}`,
            description: `Entrevista de admisión a la Sociedad de Inteligencia Artificial.\n\nPostulante: ${nombre}\nEntrevistadores: ${nombreEntrevistador1} y ${nombreEntrevistador2}\n\n*Por favor, únete puntual al enlace de Meet adjunto.*`,
            start: { dateTime: startDate.toISOString(), timeZone: "America/Mexico_City" },
            end: { dateTime: endDate.toISOString(), timeZone: "America/Mexico_City" },
            attendees: asistentesGoogle, // 👈 LA MAGIA ESTÁ AQUÍ. Esto da acceso directo al Meet.
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
    // 5. ENVÍO DE CORREOS AUTOMÁTICOS (FASE 3)
    // =========================================================
    if (EMAIL_USER && EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
      });

      const fechaLegible = `${diaTexto} ${fechaNum} de Abril`;

      // ✉️ Correo al Postulante
      await transporter.sendMail({
        from: `"Reclutamiento SIAFI" <${EMAIL_USER}>`,
        to: email,
        subject: `✅ Entrevista Confirmada - SIAFI UNAM`,
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #111111; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937;">
            <div style="background: linear-gradient(90deg, #0051ff, #00baff); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 1px;">Entrevista Confirmada</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; color: #e5e7eb;">Hola <strong>${nombre}</strong>,</p>
              <p style="font-size: 14px; color: #9ca3af; line-height: 1.6;">Tu horario ha sido registrado exitosamente en nuestro sistema. Estamos emocionados por platicar contigo y conocer más sobre tu perfil.</p>
              
              <div style="background-color: #0a0a0a; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #00baff; letter-spacing: 1px; font-weight: bold;">Detalles de tu cita</p>
                <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Fecha:</strong> ${fechaLegible}</p>
                <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>Hora:</strong> ${horaString}</p>
                <a href="${meetLink}" style="display: inline-block; background-color: #0051ff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">Unirse a la Entrevista</a>
              </div>

              <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin-bottom: 20px;"><strong>Recomendaciones:</strong><br/>- Conéctate 5 minutos antes de la hora acordada.<br/>- Busca un lugar tranquilo y con buena conexión a internet.<br/>- Asegúrate de que tu cámara y micrófono funcionen correctamente.</p>
              <p style="font-size: 14px; color: #9ca3af;">¡Mucho éxito!<br/><strong style="color: #ffffff;">Mesa Directiva SIAFI</strong></p>
            </div>
          </div>
        `
      });

      // ✉️ Correo a los Entrevistadores
      if (correosEntrevistadores.length > 0) {
        await transporter.sendMail({
          from: `"Sistema SIAFI" <${EMAIL_USER}>`,
          to: correosEntrevistadores.join(', '),
          subject: `🔔 Nueva Entrevista Asignada - ${nombre}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #111111; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937;">
              <div style="background: linear-gradient(90deg, #8b5cf6, #c084fc); padding: 24px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 1px;">Nueva Asignación</h1>
              </div>
              <div style="padding: 32px;">
                <p style="font-size: 16px; color: #e5e7eb;">Hola Entrevistadores,</p>
                <p style="font-size: 14px; color: #9ca3af; line-height: 1.6;">El sistema central les ha asignado una nueva entrevista para evaluar a un candidato de la convocatoria.</p>
                
                <div style="background-color: #0a0a0a; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #c084fc; letter-spacing: 1px; font-weight: bold;">Datos del Postulante</p>
                  <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Nombre:</strong> ${nombre}</p>
                  <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Correo:</strong> ${email}</p>
                  <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Fecha:</strong> ${fechaLegible}</p>
                  <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>Hora:</strong> ${horaString}</p>
                  <a href="${meetLink}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">Ir a la Sala de Entrevista</a>
                </div>
                <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">El evento ya ha sido agregado a sus calendarios institucionales con el enlace correspondiente.</p>
              </div>
            </div>
          `
        });
      }
    }

    return NextResponse.json({ success: true, meetLink });

  } catch (error: any) {
    console.error("Error crìtico agendando entrevista:", error);
    return NextResponse.json({ success: false, error: "Error del servidor al intentar guardar tu selección." }, { status: 500 });
  }
}