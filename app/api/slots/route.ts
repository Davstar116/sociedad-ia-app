import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// Forzamos que esta ruta sea dinámica (que no se guarde en caché)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Inicializamos el cliente DENTRO de la función para evitar errores de contexto
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const SLOTS_DB_ID = process.env.NOTION_SLOTS_ID;

    if (!SLOTS_DB_ID) {
      console.error("❌ Falta el ID de la base de datos de slots.");
      throw new Error("Falta NOTION_SLOTS_ID en variables de entorno");
    }

    console.log("🔍 Buscando horarios en DB:", SLOTS_DB_ID);

    // 2. Hacemos la consulta
    const response = await notion.databases.query({
      database_id: SLOTS_DB_ID,
      filter: {
        property: "Estado", // Asegúrate de que en Notion se llame "Estado"
        select: {
          equals: "Disponible", // Asegúrate de que la opción sea "Disponible"
        },
      },
      sorts: [
        {
          property: "Fecha y Hora", // Asegúrate de que en Notion se llame así
          direction: "ascending",
        },
      ],
    });

    // 3. Procesamos los datos
    const slots = response.results.map((page: any) => {
      // Intentamos obtener el título de forma segura
      const tituloProp = page.properties["ID Turno"]; // ¿Tu columna se llama ID Turno?
      const fechaProp = page.properties["Fecha y Hora"];
      const linkProp = page.properties["Link"];

      return {
        id: page.id,
        titulo: tituloProp?.title?.[0]?.plain_text || "Turno sin nombre",
        fecha: fechaProp?.date?.start || null,
        link: linkProp?.url || "",
      };
    });

    console.log(`✅ Se encontraron ${slots.length} horarios disponibles.`);
    return NextResponse.json({ success: true, slots });

  } catch (error: any) {
    console.error("❌ Error API Slots:", error);
    return NextResponse.json({ error: error.message || "Error desconocido" }, { status: 500 });
  }
}