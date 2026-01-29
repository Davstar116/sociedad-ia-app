import { NextResponse } from "next/server";

// CAMBIO CRÍTICO: Usamos 'require' para asegurar que cargue la librería completa de Node
const { Client } = require("@notionhq/client");

export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const SLOTS_DB_ID = process.env.NOTION_SLOTS_ID;

    // Validación
    if (!SLOTS_DB_ID) {
      return NextResponse.json({ error: "Falta NOTION_SLOTS_ID" }, { status: 500 });
    }

    // Inicialización Limpia
    const notion = new Client({ auth: process.env.NOTION_TOKEN });

    console.log("🚀 Intentando conectar con Notion...");

    // Consulta
    const response = await notion.databases.query({
      database_id: SLOTS_DB_ID,
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
    });

    const slots = response.results.map((page: any) => {
      // Protección contra campos vacíos
      const titulo = page.properties["ID Turno"]?.title?.[0]?.plain_text || "Turno sin nombre";
      const fecha = page.properties["Fecha y Hora"]?.date?.start || null;
      const link = page.properties["Link"]?.url || "";

      return { id: page.id, titulo, fecha, link };
    });

    console.log(`✅ Éxito: ${slots.length} turnos encontrados.`);
    return NextResponse.json({ success: true, slots });

  } catch (error: any) {
    console.error("❌ Error API Slots:", error);
    return NextResponse.json({ 
      error: "Error interno de Notion", 
      details: error.message 
    }, { status: 500 });
  }
}