import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const POSTULANTES_DB_ID = process.env.NOTION_DATABASE_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email || !NOTION_TOKEN || !POSTULANTES_DB_ID) {
    return NextResponse.json({ success: false, error: "Faltan datos o credenciales" });
  }

  try {
    // ==========================================
    // 1. BUSCAR AL POSTULANTE Y SUS COLUMNAS
    // ==========================================
    const resDb = await fetch(`https://api.notion.com/v1/databases/${POSTULANTES_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: { property: "Correo electrónico", email: { equals: email } }
      }),
      cache: 'no-store'
    });

    const dataDb = await resDb.json();
    
    if (!dataDb.results || dataDb.results.length === 0) {
      return NextResponse.json({ success: false, error: "Postulante no encontrado" });
    }

    const page = dataDb.results[0];
    const pageId = page.id;
    const rawProps = page.properties;
    const datosPersonales: Record<string, string> = {};

    // Extraer propiedades principales
    for (const key in rawProps) {
      const prop = rawProps[key];
      let value = "";
      
      if (prop.type === "title" && prop.title.length > 0) value = prop.title[0].plain_text;
      else if (prop.type === "email") value = prop.email;
      else if (prop.type === "number") value = prop.number?.toString();
      else if (prop.type === "select" && prop.select) value = prop.select.name;
      else if (prop.type === "multi_select") value = prop.multi_select.map((s: any) => s.name).join(", ");
      else if (prop.type === "files" && prop.files.length > 0) {
        const fileObj = prop.files[0];
        value = fileObj.type === "file" ? fileObj.file.url : fileObj.external?.url || "";
      } else if (prop.type === "url" && prop.url) value = prop.url;
      else if (prop.type === "rich_text" && prop.rich_text.length > 0) value = prop.rich_text.map((t: any) => t.plain_text).join("");
      
      if (value && value.trim() !== "") {
        datosPersonales[key] = value;
      }
    }

    // ==========================================
    // 2. EXTRAER EL CONTENIDO DE LA PÁGINA (BLOQUES)
    // ==========================================
    const resBlocks = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
      method: "GET",
      headers: notionHeaders,
    });

    const dataBlocks = await resBlocks.json();
    const respuestasContenido: Array<{ pregunta: string, respuesta: string }> = [];
    
    let preguntaActual = "";
    let respuestaActual = "";

    // Parseador inteligente de Notion a Pregunta/Respuesta
    if (dataBlocks.results) {
      for (const block of dataBlocks.results) {
        let texto = "";
        let esPregunta = false;

        // Si es un título o subtítulo, asumimos que es una pregunta del formulario
        if (block.type.startsWith('heading_')) {
          texto = block[block.type].rich_text.map((t: any) => t.plain_text).join("");
          esPregunta = true;
        } 
        // Si es un párrafo, revisamos si está todo en negritas
        else if (block.type === 'paragraph') {
          const richText = block.paragraph.rich_text;
          texto = richText.map((t: any) => t.plain_text).join("");
          if (richText.length > 0 && richText.every((t: any) => t.annotations.bold)) {
            esPregunta = true;
          }
        }

        if (esPregunta) {
          if (preguntaActual && respuestaActual.trim() !== "") {
            respuestasContenido.push({ pregunta: preguntaActual, respuesta: respuestaActual.trim() });
          }
          preguntaActual = texto;
          respuestaActual = "";
        } else {
          if (texto.trim() !== "") {
            respuestaActual += texto + "\n";
          }
        }
      }
      // Empujar la última pregunta leída
      if (preguntaActual && respuestaActual.trim() !== "") {
        respuestasContenido.push({ pregunta: preguntaActual, respuesta: respuestaActual.trim() });
      }
    }

    return NextResponse.json({ 
      success: true, 
      datosPersonales,
      respuestasContenido
    });

  } catch (error) {
    console.error("Error buscando detalles del postulante:", error);
    return NextResponse.json({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}