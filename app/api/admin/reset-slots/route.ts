import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const INTERVIEWS_DB_ID = process.env.NOTION_INTERVIEWS_DB_ID;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function DELETE(request: Request) {
  try {
    // 1. Obtener todas las páginas de entrevistas
    const query = await fetch(`https://api.notion.com/v1/databases/${INTERVIEWS_DB_ID}/query`, {
      method: 'POST', headers
    });
    const data = await query.json();

    // 2. Archivarlas (Notion no tiene DELETE real, se llama "archive: true")
    const promises = data.results.map((page: any) => 
      fetch(`https://api.notion.com/v1/pages/${page.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ archived: true })
      })
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true, message: "Bloques eliminados. Sistema reiniciado." });

  } catch (error) {
    return NextResponse.json({ error: "Error reseteando sistema" }, { status: 500 });
  }
}