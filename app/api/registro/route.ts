import { NextResponse } from "next/server";
import { notion } from "@/app/lib/notion";

const REGISTRO_DB_ID = process.env.NOTION_REGISTRO_DB_ID;

export async function POST(req: Request) {
  try {
    if (!REGISTRO_DB_ID) {
      throw new Error("ID de Base de Datos de Registro no configurada");
    }

    const data = await req.json();
    const { nombre, email, telefono, carrera, semestre } = data;

    if (!nombre || !email || !telefono || !carrera || !semestre) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    await notion.pages.create({
      parent: { database_id: REGISTRO_DB_ID },
      properties: {
        "Nombre Completo": {
          title: [
            {
              text: { content: nombre },
            },
          ],
        },
        "Correo": {
          email: email, // Assuming property is of type Email, but if it fails we might need rich_text
        },
        "Telefono": {
          phone_number: telefono, // Assuming property is Phone
        },
        "Carrera": {
          rich_text: [
            {
              text: { content: carrera },
            },
          ],
        },
        "Semestre": {
          number: parseInt(semestre, 10),
        },
      },
    });

    return NextResponse.json({ success: true, message: "Registro guardado en Notion" }, { status: 200 });
  } catch (error: any) {
    console.error("Error al guardar en Notion:", error);
    
    // Fallback if property types mismatch user's setup
    try {
        if(error.message?.includes("property")) {
            const data = await req.json();
            await notion.pages.create({
              parent: { database_id: REGISTRO_DB_ID as string },
              properties: {
                "Nombre Completo": { title: [{ text: { content: data.nombre } }] },
                "Correo": { rich_text: [{ text: { content: data.email } }] },
                "Telefono": { rich_text: [{ text: { content: data.telefono } }] },
                "Carrera": { rich_text: [{ text: { content: data.carrera } }] },
                "Semestre": { number: parseInt(data.semestre, 10) },
              },
            });
            return NextResponse.json({ success: true, message: "Registro guardado en Notion (Fallback)" }, { status: 200 });
        }
    } catch(fallbackError) {}

    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
