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

    // 1. Extraemos TODOS los bloques disponibles
    while (hasMore) {
      const body: any = {
        filter: {
          property: "Estatus",
          select: { equals: "Disponible" }
        },
        sorts: [
          { property: "Fecha", direction: "ascending" },
          { property: "Hora", direction: "ascending" }
        ]
      };

      if (nextCursor) body.start_cursor = nextCursor;

      const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      if (!res.ok) throw new Error("No se pudieron leer las entrevistas de Notion");

      const data = await res.json();
      allResults = [...allResults, ...data.results];
      hasMore = data.has_more;
      nextCursor = data.next_cursor;
    }

    // ✅ LÓGICA DE SEGURIDAD: 24 HORAS
    // Obtenemos la hora exacta del servidor en este momento y le sumamos 24 horas
    const now = new Date();
    const limite24h = new Date(now.getTime() + 24 * 60 * 60 * 1000); 

    const bloquesValidos = [];

    // 2. Mapeamos, limpiamos y FILTRAMOS por tiempo
    for (const page of allResults) {
      const props = page.properties;
      const fechaNum = props["Fecha"]?.number || 0;
      const horaString = props["Hora"]?.rich_text[0]?.plain_text || ""; // Ej: "09:00 - 10:00"

      if (fechaNum && horaString) {
         // Las entrevistas de SIAFI son en Abril (Mes 3 en JavaScript) de 2026.
         const [horaInicio] = horaString.split(" - "); // "09:00"
         const [horas, minutos] = horaInicio.split(":");
         
         // Armamos la fecha exacta de este bloque de entrevista
         const fechaBloque = new Date(2026, 3, fechaNum, parseInt(horas), parseInt(minutos));

         // Solo lo agregamos a la lista SI falta MÁS de 24 horas para que empiece
         if (fechaBloque > limite24h) {
            bloquesValidos.push({
              id: page.id, 
              blockId: props["ID Bloque"]?.title[0]?.plain_text || "",
              dia: props["Dia"]?.select?.name || "",
              fecha: fechaNum,
              hora: horaString,
            });
         }
      }
    }

    return NextResponse.json({ success: true, bloques: bloquesValidos });

  } catch (error: any) {
    console.error("Error en API de entrevistas:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}