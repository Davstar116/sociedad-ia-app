import { NextResponse } from "next/server";

export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const SLOTS_DB_ID = process.env.NOTION_SLOTS_ID;
    const TOKEN = process.env.NOTION_TOKEN;

    if (!SLOTS_DB_ID || !TOKEN) {
      return NextResponse.json({ error: "Faltan credenciales (ID o Token)" }, { status: 500 });
    }

    console.log("🚀 Conectando a Notion vía FETCH nativo...");

    // Petición directa a la API de Notion (Sin intermediarios)
    const response = await fetch(`https://api.notion.com/v1/databases/${SLOTS_DB_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Notion-Version": "2022-06-28", // Versión estable de Notion
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: "Estado",
          select: {
            equals: "Disponible",
          },
        },
        sorts: [
          {
            property: "Fecha y Hora",
            direction: "ascending",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error de Notion (${response.status}): ${errorData}`);
    }

    const data = await response.json();

    // Procesamos los datos igual que antes
    const slots = data.results.map((page: any) => {
      // Manejo seguro de propiedades
      const titulo = page.properties["ID Turno"]?.title?.[0]?.plain_text || "Turno sin nombre";
      const fecha = page.properties["Fecha y Hora"]?.date?.start || null;
      const link = page.properties["Link"]?.url || "";

      return { id: page.id, titulo, fecha, link };
    });

    console.log(`✅ Éxito: ${slots.length} turnos encontrados.`);
    return NextResponse.json({ success: true, slots });

  } catch (error: any) {
    console.error("❌ Error API Slots (Fetch):", error);
    return NextResponse.json({ 
      error: "Error de conexión", 
      details: error.message 
    }, { status: 500 });
  }
}