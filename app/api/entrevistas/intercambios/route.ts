import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// 1. GET: Obtener todas las entrevistas que están buscando un reemplazo
export async function GET(request: Request) {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Estatus", select: { equals: "Reservado" } },
            { property: "Solicita Intercambio", checkbox: { equals: true } }
          ]
        },
        sorts: [{ property: "Fecha", direction: "ascending" }]
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    if (!data.results) return NextResponse.json({ success: true, intercambios: [] });

    const intercambios = data.results.map((page: any) => {
      const props = page.properties;
      return {
        idBloque: page.id,
        dia: props["Dia"]?.select?.name || "",
        fecha: props["Fecha"]?.number || 0,
        hora: props["Hora"]?.rich_text[0]?.plain_text || "",
        postulante: props["Postulante"]?.rich_text[0]?.plain_text || "Candidato",
        entrevistadorSaliente: props["Entrevistador Saliente"]?.rich_text[0]?.plain_text || "",
        entrevistador1: props["Entrevistador 1"]?.rich_text[0]?.plain_text || "",
        entrevistador2: props["Entrevistador 2"]?.rich_text[0]?.plain_text || ""
      };
    });

    return NextResponse.json({ success: true, intercambios });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error obteniendo intercambios" }, { status: 500 });
  }
}

// 2. POST: Solicitar, Cancelar o Aceptar Intercambio
export async function POST(request: Request) {
  try {
    const { action, idBloque, miNombre, entrevistadorSaliente } = await request.json();

    // 🔴 ACCIÓN: SOLICITAR (Poner en el mercado)
    if (action === "solicitar") {
      await fetch(`https://api.notion.com/v1/pages/${idBloque}`, {
        method: "PATCH", headers: notionHeaders,
        body: JSON.stringify({
          properties: {
            "Solicita Intercambio": { checkbox: true },
            "Entrevistador Saliente": { rich_text: [{ text: { content: miNombre } }] }
          }
        })
      });
      return NextResponse.json({ success: true });
    } 
    
    // 🟡 ACCIÓN: CANCELAR SOLICITUD (Arrepentirse y quitar del mercado)
    else if (action === "cancelar") {
      await fetch(`https://api.notion.com/v1/pages/${idBloque}`, {
        method: "PATCH", headers: notionHeaders,
        body: JSON.stringify({
          properties: {
            "Solicita Intercambio": { checkbox: false },
            "Entrevistador Saliente": { rich_text: [] } // Lo vaciamos
          }
        })
      });
      return NextResponse.json({ success: true });
    }
    
    // 🟢 ACCIÓN: ACEPTAR (Rescatar a un compañero)
    else if (action === "aceptar") {
      const pageRes = await fetch(`https://api.notion.com/v1/pages/${idBloque}`, { method: "GET", headers: notionHeaders, cache: 'no-store' });
      const pageData = await pageRes.json();
      const e1 = pageData.properties["Entrevistador 1"]?.rich_text[0]?.plain_text || "";
      const e2 = pageData.properties["Entrevistador 2"]?.rich_text[0]?.plain_text || "";
      
      // ✅ VALIDACIÓN CRÍTICA: Impedir que un evaluador acepte una entrevista donde ya está asignado
      if (e1 === miNombre || e2 === miNombre) {
        return NextResponse.json({ success: false, error: "Ya estás asignado a esta entrevista como el otro evaluador. No puedes ocupar ambos puestos." }, { status: 400 });
      }

      // Reemplazamos exactamente al que solicitó salir
      const columnaAReemplazar = (e1 === entrevistadorSaliente) ? "Entrevistador 1" : "Entrevistador 2";

      await fetch(`https://api.notion.com/v1/pages/${idBloque}`, {
        method: "PATCH", headers: notionHeaders,
        body: JSON.stringify({
          properties: {
            [columnaAReemplazar]: { rich_text: [{ text: { content: miNombre } }] },
            "Solicita Intercambio": { checkbox: false },
            "Entrevistador Saliente": { rich_text: [] }
          }
        })
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Acción no válida" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}