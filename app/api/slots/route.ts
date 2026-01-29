import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const SLOTS_DB_ID = process.env.NOTION_SLOTS_ID;

    // Log para ver si las variables existen
    console.log("🔍 DB ID:", SLOTS_DB_ID ? "Cargado" : "FALTA");
    console.log("🔍 Token:", process.env.NOTION_TOKEN ? "Cargado" : "FALTA");

    const notion = new Client({ auth: process.env.NOTION_TOKEN });

    // DIAGNÓSTICO: Vamos a ver qué demonios tiene el objeto notion dentro
    console.log("🔍 Notion Client Keys:", Object.keys(notion));

    if (!SLOTS_DB_ID) {
      return NextResponse.json({ error: "Falta NOTION_SLOTS_ID" }, { status: 500 });
    }

    // Intentamos la consulta directamente
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
      const titulo = page.properties["ID Turno"]?.title?.[0]?.plain_text || "Turno sin nombre";
      const fecha = page.properties["Fecha y Hora"]?.date?.start || null;
      // Usamos encadenamiento opcional para evitar crashes si falta la propiedad
      const link = page.properties["Link"]?.url || "";

      return { id: page.id, titulo, fecha, link };
    });

    return NextResponse.json({ success: true, slots });

  } catch (error: any) {
    console.error("❌ Error REAL:", error);
    // Devolvemos el error completo para leerlo
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack 
    }, { status: 500 });
  }
}