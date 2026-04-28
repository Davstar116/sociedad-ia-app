import { NextResponse } from "next/server";
import { notion } from "@/app/lib/notion";
import { put } from "@vercel/blob";

const EVENTOS_DB_ID = process.env.NOTION_EVENTOS_DB_ID;

export async function POST(req: Request) {
  try {
    if (!EVENTOS_DB_ID) {
      throw new Error("ID de Base de Datos de Eventos no configurada");
    }

    const { nombre, nucleo, firmaBase64 } = await req.json();

    if (!nombre || !nucleo || !firmaBase64) {
      return NextResponse.json({ error: "Faltan datos (nombre, núcleo o firma)" }, { status: 400 });
    }

    // Convertir Base64 a Buffer para subirlo a Vercel Blob
    // firmaBase64 usualmente viene como "data:image/png;base64,iVBORw0KGgo..."
    const base64Data = firmaBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    // Subir la imagen a Vercel Blob
    const uniqueFilename = `firma_${nombre.replace(/\s+/g, '_')}_${Date.now()}.png`;
    const blob = await put(uniqueFilename, buffer, {
      access: 'public',
      contentType: 'image/png'
    });

    // Guardar en Notion
    const nowIso = new Date().toISOString();

    await notion.pages.create({
      parent: { database_id: EVENTOS_DB_ID },
      properties: {
        "Nombre": {
          title: [
            {
              text: { content: nombre },
            },
          ],
        },
        "Núcleo": {
          rich_text: [
            {
              text: { content: nucleo },
            },
          ],
        },
        "Firma": {
          files: [
            {
              name: uniqueFilename,
              type: "external",
              external: {
                url: blob.url
              }
            }
          ]
        },
        "Horario Entrada": {
          date: {
            start: nowIso
          }
        }
      },
    });

    return NextResponse.json({ success: true, message: "Check-in completado" }, { status: 200 });
  } catch (error: any) {
    console.error("Error en Check-in:", error);
    
    // Fallback if 'Núcleo' is a select property instead of rich_text
    if (error.message?.includes("property")) {
      try {
        const base64Data = firmaBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const uniqueFilename = `firma_${nombre.replace(/\s+/g, '_')}_${Date.now()}.png`;
        const blob = await put(uniqueFilename, buffer, {
          access: 'public',
          contentType: 'image/png'
        });
        
        await notion.pages.create({
          parent: { database_id: EVENTOS_DB_ID as string },
          properties: {
            "Nombre": { title: [{ text: { content: nombre } }] },
            "Núcleo": { select: { name: nucleo } },
            "Firma": { files: [{ name: uniqueFilename, type: "external", external: { url: blob.url } }] },
            "Horario Entrada": { date: { start: new Date().toISOString() } }
          },
        });
        return NextResponse.json({ success: true, message: "Check-in completado (Fallback Select)" }, { status: 200 });
      } catch (fallbackError) {}
    }

    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
