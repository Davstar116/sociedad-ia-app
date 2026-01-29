import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SLOTS_DB_ID = process.env.NOTION_SLOTS_ID;

export const dynamic = 'force-dynamic'; // Importante para que no cachee datos viejos

export async function GET() {
  try {
    if (!SLOTS_DB_ID) throw new Error("Falta NOTION_SLOTS_ID");

    // Consultamos a Notion
    const response = await notion.databases.query({
      database_id: SLOTS_DB_ID,
      filter: {
        property: "Estado", // Nombre de tu columna de estado
        select: {
          equals: "Disponible", // Solo traemos los disponibles
        },
      },
      sorts: [
        {
          property: "Fecha y Hora", // Ordenamos por fecha
          direction: "ascending",
        },
      ],
    });

    // Limpiamos la basura que trae Notion y dejamos solo lo útil
    const slots = response.results.map((page: any) => {
      return {
        id: page.id,
        titulo: page.properties["ID Turno"]?.title[0]?.plain_text || "Turno sin nombre",
        fecha: page.properties["Fecha y Hora"]?.date?.start || null,
        // Si pusiste la columna de Link, la recuperamos
        link: page.properties["Link"]?.url || "", 
      };
    });

    return NextResponse.json({ success: true, slots });

  } catch (error: any) {
    console.error("❌ Error obteniendo horarios:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}