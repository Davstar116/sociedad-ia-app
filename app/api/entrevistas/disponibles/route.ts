import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function GET() {
  if (!NOTION_TOKEN || !ENTREVISTAS_DB_ID) {
    return NextResponse.json({ success: false, error: "Variables de entorno faltantes" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: {
          property: "Estatus",
          select: {
            equals: "Disponible"
          }
        },
        // Ordenamos por fecha y luego por hora para que salgan acomodaditos
        sorts: [
          { property: "Fecha", direction: "ascending" },
          { property: "Hora", direction: "ascending" }
        ]
      }),
      cache: 'no-store' // Vital para que no devuelva datos viejos
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error Notion API:", errorText);
      throw new Error("No se pudieron leer las entrevistas de Notion");
    }

    const data = await res.json();

    // Mapeamos y limpiamos los datos para enviarlos ligeros al Front-end
    const bloques = data.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id, // El ID único de la fila en Notion (lo usaremos para reservar)
        blockId: props["ID Bloque"]?.title[0]?.plain_text || "",
        dia: props["Dia"]?.select?.name || "",
        fecha: props["Fecha"]?.number || 0,
        hora: props["Hora"]?.rich_text[0]?.plain_text || "",
      };
    });

    return NextResponse.json({ success: true, bloques });

  } catch (error: any) {
    console.error("Error en API de entrevistas:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}