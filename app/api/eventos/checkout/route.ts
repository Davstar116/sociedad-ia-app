import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EVENTOS_DB_ID = process.env.NOTION_EVENTOS_DB_ID;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function POST(req: Request) {
  try {
    if (!EVENTOS_DB_ID) {
      throw new Error("ID de Base de Datos de Eventos no configurada");
    }

    const { nombre } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: "Falta el nombre para buscar" }, { status: 400 });
    }

    // Buscar en Notion a la persona que hizo check-in y no tiene salida
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB_ID}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: "Nombre",
              title: {
                equals: nombre
              }
            },
            {
              property: "Horario Salida",
              date: {
                is_empty: true
              }
            }
          ]
        },
        sorts: [
          {
            property: "Horario Entrada",
            direction: "descending"
          }
        ]
      })
    });

    if (!queryRes.ok) {
      const errData = await queryRes.json();
      throw new Error(errData.message || "Error al consultar Notion");
    }

    const data = await queryRes.json();

    if (data.results.length === 0) {
      return NextResponse.json({ error: "No se encontró un Check-in abierto con ese nombre exacto." }, { status: 404 });
    }

    const pageToUpdate = data.results[0];
    const nowIso = new Date().toISOString();

    // Actualizar la página con la hora de salida
    const updateRes = await fetch(`https://api.notion.com/v1/pages/${pageToUpdate.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        properties: {
          "Horario Salida": {
            date: {
              start: nowIso
            }
          }
        }
      })
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json();
      throw new Error(errData.message || "Error al actualizar en Notion");
    }

    return NextResponse.json({ success: true, nombreEncontrado: nombre }, { status: 200 });
  } catch (error: any) {
    console.error("Error en Check-out:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
