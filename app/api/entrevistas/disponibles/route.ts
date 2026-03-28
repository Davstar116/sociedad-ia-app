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
    let allResults: any[] = [];
    let hasMore = true;
    let nextCursor: string | undefined = undefined;

    // ✅ CICLO PARA PAGINACIÓN: Sigue pidiendo hasta que Notion diga que ya no hay más
    while (hasMore) {
      const body: any = {
        filter: {
          property: "Estatus",
          select: {
            equals: "Disponible"
          }
        },
        sorts: [
          { property: "Fecha", direction: "ascending" },
          { property: "Hora", direction: "ascending" }
        ]
      };

      if (nextCursor) {
        body.start_cursor = nextCursor;
      }

      const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error Notion API:", errorText);
        throw new Error("No se pudieron leer las entrevistas de Notion");
      }

      const data = await res.json();
      allResults = [...allResults, ...data.results]; // Juntamos los resultados
      
      hasMore = data.has_more; // ¿Hay más de 100?
      nextCursor = data.next_cursor; // El marcador de dónde seguir leyendo
    }

    // Mapeamos y limpiamos todos los datos recolectados
    const bloques = allResults.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id, 
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