import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CURSOS_DB_ID = process.env.NOTION_CURSOS_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// GET: Leer todos los cursos para mostrarlos al Entrevistador
export async function GET() {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${CURSOS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      // Ordenar para que los más nuevos salgan primero
      body: JSON.stringify({
        sorts: [{ timestamp: "created_time", direction: "descending" }]
      })
    });

    if (!res.ok) throw new Error("Error consultando Notion");

    const data = await res.json();
    
    // Mapear la respuesta a un formato limpio
    const cursos = data.results.map((page: any) => ({
      id: page.id,
      titulo: page.properties["Titulo"]?.title[0]?.plain_text || "Sin título",
      descripcion: page.properties["Descripcion"]?.rich_text[0]?.plain_text || "",
      url: page.properties["URL"]?.url || "",
      fecha: page.created_time
    }));

    return NextResponse.json({ cursos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Guardar un nuevo curso desde el Admin Maestro
export async function POST(request: Request) {
  try {
    const { titulo, descripcion, url } = await request.json();

    if (!titulo || !url) {
      return NextResponse.json({ error: "Título y URL son obligatorios." }, { status: 400 });
    }

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: CURSOS_DB_ID! },
        properties: {
          "Titulo": { title: [{ text: { content: titulo } }] },
          "Descripcion": { rich_text: [{ text: { content: descripcion || "" } }] },
          "URL": { url: url },
        }
      }),
    });

    if (!res.ok) throw new Error("Error guardando en Notion");

    return NextResponse.json({ success: true, message: "Curso publicado con éxito." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}