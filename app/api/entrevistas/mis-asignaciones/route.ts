import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entrevistador = searchParams.get('entrevistador');

  if (!entrevistador || !NOTION_TOKEN || !ENTREVISTAS_DB_ID) {
    return NextResponse.json({ success: false, error: "Faltan datos" });
  }

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
            { property: "Estatus", select: { equals: "Reservado" } },
            {
              or: [
                { property: "Entrevistador 1", rich_text: { contains: entrevistador } },
                { property: "Entrevistador 2", rich_text: { contains: entrevistador } }
              ]
            }
          ]
        },
        sorts: [
          { property: "Fecha", direction: "ascending" }
        ]
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    
    if (!data.results) {
      return NextResponse.json({ success: true, entrevistas: [] });
    }

    const entrevistas = data.results.map((page: any) => {
      const props = page.properties;
      return {
        idBloque: page.id,
        dia: props["Dia"]?.select?.name || "",
        fecha: props["Fecha"]?.number || 0,
        hora: props["Hora"]?.rich_text[0]?.plain_text || "",
        postulante: props["Postulante"]?.rich_text[0]?.plain_text || "Candidato",
        correoPostulante: (props["Correo Postulante"]?.email || props["Correo"]?.email || props["Correo"]?.rich_text?.[0]?.plain_text || "").trim(),
        meetLink: props["Link Meet"]?.url || "",
        // ✅ NUEVOS CAMPOS AÑADIDOS PARA INTERCAMBIOS
        solicitaIntercambio: props["Solicita Intercambio"]?.checkbox || false,
        entrevistadorSaliente: props["Entrevistador Saliente"]?.rich_text[0]?.plain_text || "",
        entrevistador1: props["Entrevistador 1"]?.rich_text[0]?.plain_text || "",
        entrevistador2: props["Entrevistador 2"]?.rich_text[0]?.plain_text || ""
      };
    });

    return NextResponse.json({ success: true, entrevistas });
  } catch (error) {
    console.error("Error buscando asignaciones:", error);
    return NextResponse.json({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}