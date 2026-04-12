import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const AJUSTES_DB_ID = process.env.NOTION_AJUSTES_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const AJUSTE_KEY = "CierreReclutamiento";

// GET: Páginas públicas (login, postulación) consultan aquí el estado del reclutamiento
export async function GET() {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${AJUSTES_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: { property: "Ajuste", title: { equals: AJUSTE_KEY } }
      }),
      cache: 'no-store'
    });
    
    const data = await res.json();
    const page = data.results?.[0];
    
    if (!page) return NextResponse.json({ isClosed: false });

    const isClosed = page.properties["Estado"]?.checkbox || false;
    return NextResponse.json({ isClosed });
  } catch (error) {
    return NextResponse.json({ isClosed: false, error: "Error leyendo estado de reclutamiento" });
  }
}

// POST: El Admin Maestro usa esto para abrir/cerrar el reclutamiento
export async function POST(request: Request) {
  try {
    const { close } = await request.json();

    const queryRes = await fetch(`https://api.notion.com/v1/databases/${AJUSTES_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: { property: "Ajuste", title: { equals: AJUSTE_KEY } }
      })
    });
    
    const data = await queryRes.json();
    const page = data.results?.[0];

    if (page) {
      await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({
          properties: { "Estado": { checkbox: close } }
        })
      });
    } else {
      await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          parent: { database_id: AJUSTES_DB_ID! },
          properties: {
            "Ajuste": { title: [{ text: { content: AJUSTE_KEY } }] },
            "Estado": { checkbox: close }
          }
        })
      });
    }

    return NextResponse.json({ success: true, isClosed: close });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error actualizando estado de reclutamiento" }, { status: 500 });
  }
}
