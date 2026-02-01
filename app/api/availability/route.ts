import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID = process.env.NOTION_AVAILABILITY_DB_ID;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// --- GET: OBTENER HORARIOS ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  console.log("🔍 [API GET] Buscando horarios para:", email);

  if (!email || !DB_ID) {
      console.error("❌ [API GET] Falta Email o DB_ID");
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { property: "Email", email: { equals: email } }
      }),
      next: { revalidate: 0 } // Sin caché
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("❌ [API GET ERROR NOTION]:", response.status, err);
        return NextResponse.json({ error: "Notion Error" }, { status: 500 });
    }

    const data = await response.json();
    console.log("✅ [API GET] Resultados encontrados:", data.results.length);
    
    if (data.results.length > 0) {
      const props = data.results[0].properties;
      // Verificamos que exista la propiedad
      if (!props["HorariosJSON"]) {
          console.error("❌ [API ERROR] No existe la columna 'HorariosJSON' en Notion");
      }

      const rawJSON = props["HorariosJSON"]?.rich_text?.[0]?.plain_text || "[]";
      console.log("📦 [API GET] JSON recuperado:", rawJSON.substring(0, 50) + "...");
      
      return NextResponse.json({
        exists: true,
        slots: JSON.parse(rawJSON)
      });
    }

    return NextResponse.json({ exists: false, slots: [] });

  } catch (error) {
    console.error("❌ [API GET CRASH]:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// --- POST: GUARDAR HORARIOS ---
export async function POST(request: Request) {
  const body = await request.json();
  const { email, name, totalHours, slots } = body;

  console.log(`💾 [API POST] Intentando guardar para ${email} (${totalHours}h)`);

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
    
    if (!queryRes.ok) {
        console.error("❌ [API POST QUERY ERROR]:", await queryRes.text());
        return NextResponse.json({ error: "Query Failed" }, { status: 500 });
    }

    const queryData = await queryRes.json();
    const existingPage = queryData.results[0];
    const slotsString = JSON.stringify(slots);

    // Verificación de seguridad: longitud del string
    if (slotsString.length > 2000) {
        console.warn("⚠️ [API POST] El JSON es muy largo, Notion podría cortarlo si supera el límite de bloque, pero en RichText suele aguantar.");
    }

    if (existingPage) {
      console.log("🔄 [API POST] Actualizando página existente:", existingPage.id);
      const updateRes = await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          properties: {
            "Horas Totales": { number: totalHours },
            "HorariosJSON": { rich_text: [{ text: { content: slotsString } }] }
          }
        })
      });

      if (!updateRes.ok) {
          console.error("❌ [API UPDATE ERROR]:", await updateRes.text());
          return NextResponse.json({ error: "Update Failed" }, { status: 500 });
      }

      return NextResponse.json({ message: "Actualizado", type: "updated" });

    } else {
      console.log("✨ [API POST] Creando nueva página...");
      const createRes = await fetch(`https://api.notion.com/v1/pages`, {
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

      if (!createRes.ok) {
          console.error("❌ [API CREATE ERROR]:", await createRes.text());
          return NextResponse.json({ error: "Create Failed" }, { status: 500 });
      }

      return NextResponse.json({ message: "Creado", type: "created" });
    }

  } catch (error) {
    console.error("❌ [API POST CRASH]:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}