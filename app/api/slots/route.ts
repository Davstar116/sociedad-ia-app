import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// --- CONFIGURACIÓN CRÍTICA ---
// Esto obliga a Vercel a usar el entorno Node.js completo.
// Sin esto, la librería de Notion puede fallar al minificarse.
export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const SLOTS_DB_ID = process.env.NOTION_SLOTS_ID;

    // Validación temprana
    if (!SLOTS_DB_ID) {
      return NextResponse.json({ error: "Falta NOTION_SLOTS_ID" }, { status: 500 });
    }

    // Inicializamos cliente
    const notion = new Client({ auth: process.env.NOTION_TOKEN });

    // Debug: Verificamos que el cliente tenga el método antes de usarlo
    if (!notion.databases || typeof notion.databases.query !== 'function') {
      throw new Error("La librería de Notion no se cargó correctamente (Error de Runtime).");
    }

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
      // Manejo seguro de propiedades por si cambian nombres
      const titulo = page.properties["ID Turno"]?.title?.[0]?.plain_text || "Turno sin nombre";
      const fecha = page.properties["Fecha y Hora"]?.date?.start || null;
      const link = page.properties["Link"]?.url || "";

      return { id: page.id, titulo, fecha, link };
    });

    return NextResponse.json({ success: true, slots });

  } catch (error: any) {
    console.error("❌ Error API Slots:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}