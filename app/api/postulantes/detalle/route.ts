import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const POSTULANTES_DB_ID = process.env.NOTION_DATABASE_ID;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email || !NOTION_TOKEN || !POSTULANTES_DB_ID) {
    return NextResponse.json({ success: false, error: "Faltan datos o credenciales" });
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${POSTULANTES_DB_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ✅ Corregido: Ahora busca en la columna exacta "Correo electrónico"
        filter: { property: "Correo electrónico", email: { equals: email } }
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ success: false, error: "Postulante no encontrado" });
    }

    const rawProps = data.results[0].properties;
    const processedProps: Record<string, string> = {};

    // Extractor dinámico: lee cualquier tipo de columna de Notion y saca su texto
    for (const key in rawProps) {
      const prop = rawProps[key];
      let value = "";
      
      if (prop.type === "title" && prop.title.length > 0) value = prop.title[0].plain_text;
      else if (prop.type === "rich_text" && prop.rich_text.length > 0) value = prop.rich_text.map((t: any) => t.plain_text).join("");
      else if (prop.type === "email") value = prop.email;
      else if (prop.type === "phone_number") value = prop.phone_number;
      else if (prop.type === "select" && prop.select) value = prop.select.name;
      else if (prop.type === "multi_select") value = prop.multi_select.map((s: any) => s.name).join(", ");
      else if (prop.type === "number") value = prop.number?.toString();
      else if (prop.type === "date" && prop.date) value = prop.date.start;
      else if (prop.type === "url") value = prop.url;
      
      if (value && value.trim() !== "") {
        processedProps[key] = value;
      }
    }

    return NextResponse.json({ success: true, datos: processedProps });
  } catch (error) {
    console.error("Error buscando detalles del postulante:", error);
    return NextResponse.json({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}