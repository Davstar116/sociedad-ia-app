import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const AVAILABILITY_DB_ID = process.env.NOTION_AVAILABILITY_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function POST(request: Request) {
  try {
    const { nombre, email, horarios, horasTotales } = await request.json();

    if (!email || !horarios) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // 1. Buscar si el entrevistador ya tiene un horario guardado
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${AVAILABILITY_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: {
          property: "Email",
          email: { equals: email },
        },
      }),
    });

    const queryData = await queryRes.json();
    const existingPage = queryData.results?.length > 0 ? queryData.results[0] : null;

    // ✅ DIVIDIR EL JSON EN BLOQUES DE 2000 CARACTERES MÁXIMO
    const jsonString = JSON.stringify(horarios);
    const chunks = jsonString.match(/.{1,2000}/g) || [];
    const richTextArray = chunks.map(chunk => ({
      text: { content: chunk }
    }));

    const properties = {
      "Nombre": { title: [{ text: { content: nombre || "Entrevistador" } }] },
      "Email": { email: email },
      "Horas Totales": { number: horasTotales },
      "HorariosJSON": { rich_text: richTextArray }, // Asignamos el arreglo de chunks
    };

    // 2. Si existe, lo actualizamos. Si no, lo creamos.
    let response;
    if (existingPage) {
      response = await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
        method: "PATCH",
        headers: notionHeaders,
        body: JSON.stringify({ properties }),
      });
    } else {
      response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          parent: { database_id: AVAILABILITY_DB_ID! },
          properties,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error Notion API:", errorText);
      return NextResponse.json({ error: "Error al guardar en Notion" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Horario guardado correctamente" });
  } catch (error) {
    console.error("Error en API availability:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email || !process.env.NOTION_AVAILABILITY_DB_ID) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  try {
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_AVAILABILITY_DB_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: "Email",
          email: { equals: email },
        },
      }),
      cache: 'no-store'
    });

    const queryData = await queryRes.json();
    
    if (queryData.results?.length > 0) {
      const page = queryData.results[0];
      
      // ✅ LEER TODOS LOS CHUNKS Y UNIRLOS
      const richTextArray = page.properties["HorariosJSON"]?.rich_text || [];
      const horariosGuardados = richTextArray.map((t: any) => t.plain_text).join("") || "[]";
      
      return NextResponse.json({ horarios: JSON.parse(horariosGuardados) });
    }

    return NextResponse.json({ horarios: [] });
  } catch (error) {
    console.error("Error leyendo availability:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}