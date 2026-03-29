import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email || !NOTION_TOKEN || !ENTREVISTAS_DB_ID) return NextResponse.json({ success: false });

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Correo Postulante", email: { equals: email } },
            { property: "Estatus", select: { equals: "Reservado" } }
          ]
        }
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const props = data.results[0].properties;
      return NextResponse.json({
        success: true,
        entrevista: {
          dia: props["Dia"]?.select?.name || "",
          fecha: props["Fecha"]?.number || 0,
          hora: props["Hora"]?.rich_text[0]?.plain_text || "",
          meetLink: props["Link Meet"]?.url || ""
        }
      });
    }
    return NextResponse.json({ success: false });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}