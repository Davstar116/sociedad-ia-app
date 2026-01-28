import { NextResponse } from "next/server";

// 1. Recuperamos credenciales
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_TOKEN = process.env.NOTION_TOKEN;

export async function GET() {
  try {
    if (!NOTION_TOKEN || !DATABASE_ID) {
      throw new Error("Faltan credenciales en .env.local");
    }

    // 2. Conexión "A Mano" usando Fetch (Indestructible)
    const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28", // Versión estable de Notion
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Ordenamos por los más recientes
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error Notion (${response.status}): ${errorData}`);
    }

    const data = await response.json();

    // 3. Devolvemos la lista limpia
    return NextResponse.json(data.results);

  } catch (error: any) {
    console.error("❌ ERROR MANUAL API:", error);
    return NextResponse.json(
      { error: error.message || "Error desconocido" }, 
      { status: 500 }
    );
  }
}