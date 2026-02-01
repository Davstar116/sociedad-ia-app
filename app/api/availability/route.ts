import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_AVAILABILITY_DB_ID;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// --- GET: OBTENER HORARIOS GUARDADOS ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || !DB_ID) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  try {
    // Buscamos si ya existe registro de este email
    const response = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { property: "Email", email: { equals: email } }
      })
    });

    const data = await response.json();
    
    if (data.results.length > 0) {
      const props = data.results[0].properties;
      const rawJSON = props["HorariosJSON"]?.rich_text?.[0]?.plain_text || "[]";
      
      return NextResponse.json({
        exists: true,
        slots: JSON.parse(rawJSON) // Devolvemos el array limpio al frontend
      });
    }

    return NextResponse.json({ exists: false, slots: [] });

  } catch (error) {
    return NextResponse.json({ error: "Notion Error" }, { status: 500 });
  }
}

// --- POST: GUARDAR O ACTUALIZAR (UPSERT) ---
export async function POST(request: Request) {
  const body = await request.json();
  const { email, name, totalHours, slots } = body;

  if (!DB_ID) return NextResponse.json({ error: "DB Config Missing" }, { status: 500 });

  try {
    // 1. Buscamos si ya existe
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { property: "Email", email: { equals: email } }
      })
    });
    
    const queryData = await queryRes.json();
    const existingPage = queryData.results[0];
    const slotsString = JSON.stringify(slots); // Convertimos el array a texto para Notion

    if (existingPage) {
      // --- CASO A: ACTUALIZAR (UPDATE) ---
      await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          properties: {
            "Horas Totales": { number: totalHours },
            "HorariosJSON": { rich_text: [{ text: { content: slotsString } }] }
            // No actualizamos Nombre ni Email por seguridad/redundancia
          }
        })
      });
      return NextResponse.json({ message: "Horarios Actualizados", type: "updated" });

    } else {
      // --- CASO B: CREAR (CREATE) ---
      await fetch(`https://api.notion.com/v1/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: DB_ID },
          properties: {
            "Nombre": { title: [{ text: { content: name } }] },
            "Email": { email: email },
            "Horas Totales": { number: totalHours },
            "HorariosJSON": { rich_text: [{ text: { content: slotsString } }] }
          }
        })
      });
      return NextResponse.json({ message: "Horarios Guardados", type: "created" });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}