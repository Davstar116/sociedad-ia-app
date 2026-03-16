import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTIF_DB_ID = process.env.NOTION_NOTIFICATIONS_DB_ID;
const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// GET: Obtener las notificaciones del usuario
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || !NOTIF_DB_ID) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTIF_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: { property: "UsuarioEmail", email: { equals: email } },
        sorts: [{ property: "Fecha", direction: "descending" }]
      }),
      cache: 'no-store'
    });

    const data = await response.json();
    const notificaciones = data.results.map((page: any) => ({
      id: page.id,
      asunto: page.properties["Asunto"]?.title[0]?.plain_text || "Notificación",
      mensaje: page.properties["Mensaje"]?.rich_text[0]?.plain_text || "",
      leida: page.properties["Leida"]?.checkbox || false,
      fecha: page.properties["Fecha"]?.date?.start || new Date().toISOString(),
    }));

    return NextResponse.json({ notificaciones });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}

// POST: Crear una nueva notificación
export async function POST(request: Request) {
  try {
    const { email, asunto, mensaje } = await request.json();
    if (!email || !asunto) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: NOTIF_DB_ID },
        properties: {
          "Asunto": { title: [{ text: { content: asunto } }] },
          "Mensaje": { rich_text: [{ text: { content: mensaje } }] },
          "UsuarioEmail": { email: email },
          "Leida": { checkbox: false },
          "Fecha": { date: { start: new Date().toISOString() } }
        }
      })
    });

    if (!response.ok) throw new Error("Error en Notion");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error creando notificación" }, { status: 500 });
  }
}

// PATCH: Marcar como leída
export async function PATCH(request: Request) {
  try {
    const { id, leida } = await request.json();
    await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: { "Leida": { checkbox: leida } } })
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error actualizando" }, { status: 500 });
  }
}

// DELETE: Borrar notificación
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    // En Notion, para "borrar" se archiva la página
    await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ archived: true })
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error borrando" }, { status: 500 });
  }
}