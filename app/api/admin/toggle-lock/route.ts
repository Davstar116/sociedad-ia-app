import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const AJUSTES_DB_ID = process.env.NOTION_AJUSTES_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// GET: Todos los dashboards preguntan aquí si el sistema está bloqueado
export async function GET() {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${AJUSTES_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: { property: "Ajuste", title: { equals: "BloqueoHorarios" } }
      }),
      cache: 'no-store'
    });
    
    const data = await res.json();
    const page = data.results?.[0];
    
    if (!page) return NextResponse.json({ isLocked: false });

    const isLocked = page.properties["Estado"]?.checkbox || false;
    return NextResponse.json({ isLocked });
  } catch (error) {
    return NextResponse.json({ isLocked: false, error: "Error leyendo ajustes" });
  }
}

// POST: El Admin Maestro usa esto para bloquear/desbloquear
export async function POST(request: Request) {
  try {
    const { lock } = await request.json();

    const queryRes = await fetch(`https://api.notion.com/v1/databases/${AJUSTES_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: { property: "Ajuste", title: { equals: "BloqueoHorarios" } }
      })
    });
    
    const data = await queryRes.json();
    const page = data.results?.[0];

    if (page) {
      await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({
          properties: { "Estado": { checkbox: lock } }
        })
      });
    } else {
      await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          parent: { database_id: AJUSTES_DB_ID! },
          properties: {
            "Ajuste": { title: [{ text: { content: "BloqueoHorarios" } }] },
            "Estado": { checkbox: lock }
          }
        })
      });
    }

    return NextResponse.json({ success: true, isLocked: lock });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error actualizando ajustes" }, { status: 500 });
  }
}