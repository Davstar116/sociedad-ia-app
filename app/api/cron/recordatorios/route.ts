import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;
const POSTULANTES_DB_ID = process.env.NOTION_DATABASE_ID; 
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID;

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Esta será la IP de tu servidor de Google Cloud cuando lo tengamos listo
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL; 

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function GET(request: Request) {
  try {
    // 1. Buscar entrevistas reservadas que falten de algún recordatorio
    const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Estatus", select: { equals: "Reservado" } },
            {
              or: [
                { property: "Recordatorio 24h", checkbox: { equals: false } },
                { property: "Recordatorio 1h", checkbox: { equals: false } }
              ]
            }
          ]
        }
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    const entrevistas = data.results || [];
    const ahoraTime = new Date().getTime();

    for (const page of entrevistas) {
      const props = page.properties;
      const idBloque = page.id;
      const nombrePostulante = props["Postulante"]?.rich_text[0]?.plain_text;
      const correoPostulante = props["Correo Postulante"]?.email;
      const meetLink = props["Link Meet"]?.url || "";
      const horaString = props["Hora"]?.rich_text[0]?.plain_text; 
      const fechaNum = props["Fecha"]?.number; 
      
      const recordatorio24h = props["Recordatorio 24h"]?.checkbox;
      const recordatorio1h = props["Recordatorio 1h"]?.checkbox;

      const nombreE1 = props["Entrevistador 1"]?.rich_text[0]?.plain_text;
      const nombreE2 = props["Entrevistador 2"]?.rich_text[0]?.plain_text;

      if (!horaString || !fechaNum || !correoPostulante) continue;

      const [horaInicio] = horaString.split(" - ");
      const interviewDateStr = `2026-04-${String(fechaNum).padStart(2, '0')}T${horaInicio}:00-06:00`;
      const entrevistaTime = new Date(interviewDateStr).getTime();
      const diffHoras = (entrevistaTime - ahoraTime) / (1000 * 60 * 60);

      const toca24h = (diffHoras <= 24.5 && diffHoras > 23 && !recordatorio24h);
      const toca1h = (diffHoras <= 1.5 && diffHoras > 0 && !recordatorio1h);

      if (toca24h || toca1h) {
        // Obtener teléfonos de las DBs correspondientes
        const telPostulante = await getTelefono(POSTULANTES_DB_ID, "Correo", correoPostulante);
        const telE1 = await getTelefono(USERS_DB_ID, "Nombre", nombreE1);
        const telE2 = await getTelefono(USERS_DB_ID, "Nombre", nombreE2);

        const staffEmails = ["david.solorzano.a@gmail.com", "astridmondragon25@gmail.com"];
        const todosLosCorreos = [correoPostulante, ...staffEmails];

        if (toca24h) {
          const msg = `Hola ${nombrePostulante}, recordatorio de tu entrevista SIAFI: Mañana a las ${horaInicio}.`;
          await enviarPush(todosLosCorreos, "Entrevista Mañana ⏳", msg);
          
          // WHATSAPP (Comentado hasta tener el servidor de Google Cloud)
          /* await enviarWA(telPostulante, `*SIAFI* 🤖\n\nHola ${nombrePostulante}, te recordamos tu entrevista mañana a las ${horaInicio}.`);
          if(telE1) await enviarWA(telE1, `*SIAFI* 🔔\n\nRecordatorio: Entrevista con ${nombrePostulante} mañana a las ${horaInicio}.`);
          */

          await marcarNotion(idBloque, "Recordatorio 24h");
        }

        if (toca1h) {
          const msg = `¡Tu entrevista inicia en 1 hora! Revisa tu correo/WhatsApp para el link.`;
          await enviarPush(todosLosCorreos, "Entrevista en 1 hora 🚨", msg);
          
          // WHATSAPP (Comentado hasta tener el servidor de Google Cloud)
          /*
          await enviarWA(telPostulante, `*SIAFI* 🚨\n\nTu entrevista inicia en 1 hora.\nLink: ${meetLink}`);
          */

          await marcarNotion(idBloque, "Recordatorio 1h");
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Auxiliares para buscar teléfonos y marcar Notion
async function getTelefono(dbId: string | undefined, propertyName: string, value: string) {
  if (!dbId || !value) return null;
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify({
      filter: { property: propertyName, [propertyName === "Correo" ? "email" : "title"]: { equals: value } }
    })
  });
  const d = await res.json();
  return d.results?.[0]?.properties?.["Celular"]?.phone_number || null;
}

async function marcarNotion(pageId: string, prop: string) {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH", headers: notionHeaders,
    body: JSON.stringify({ properties: { [prop]: { checkbox: true } } })
  });
}

async function enviarPush(emails: string[], title: string, msg: string) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_KEY) return;
  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Basic ${ONESIGNAL_REST_KEY}` },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: emails },
      target_channel: "push",
      headings: { es: title }, contents: { es: msg }
    })
  });
}