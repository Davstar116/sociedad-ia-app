import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// 1. Buscar si alguien aceptó mi solicitud
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entrevistador = searchParams.get('entrevistador');

  if (!entrevistador) return NextResponse.json({ success: false });

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
      method: "POST", headers: notionHeaders,
      body: JSON.stringify({
        filter: { property: "Alerta Cambio", rich_text: { starts_with: `${entrevistador}|` } }
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    if (!data.results || data.results.length === 0) return NextResponse.json({ success: true, alertas: [] });

    // Desempaquetar el mensaje oculto
    const alertas = data.results.map((page: any) => {
      const contenido = page.properties["Alerta Cambio"].rich_text[0].plain_text;
      const [saliente, entrante, postulante] = contenido.split("|");
      return { idBloque: page.id, entrante, postulante };
    });

    return NextResponse.json({ success: true, alertas });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// 2. Borrar la alerta después de leerla
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const idBloque = searchParams.get('idBloque');

  if (!idBloque) return NextResponse.json({ success: false });

  try {
    await fetch(`https://api.notion.com/v1/pages/${idBloque}`, {
      method: "PATCH", headers: notionHeaders,
      body: JSON.stringify({ properties: { "Alerta Cambio": { rich_text: [] } } })
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}