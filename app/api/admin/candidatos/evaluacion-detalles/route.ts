import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const evalId = searchParams.get("evalId");

  if (!NOTION_TOKEN || !evalId) {
     return NextResponse.json({ success: false, error: "Faltan parámetros" });
  }

  try {
     const res = await fetch(`https://api.notion.com/v1/blocks/${evalId}/children?page_size=100`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
        }
     });

     if (!res.ok) {
        return NextResponse.json({ success: false, error: "Error fetching Notion blocks" });
     }

     const data = await res.json();
     
     // Mapear los bloques a un formato simplificado
     const answers = [];
     let currentQuestion = "";

     for (const block of data.results) {
         if (block.type === "heading_3") {
            currentQuestion = block.heading_3.rich_text?.[0]?.plain_text || "Pregunta";
         } else if (block.type === "paragraph" && currentQuestion) {
            const answerText = block.paragraph.rich_text?.map((r: any) => r.plain_text).join("") || "";
            if (answerText) {
               answers.push({ pregunta: currentQuestion, respuesta: answerText });
               currentQuestion = ""; // Reset to wait for the next question
            }
         }
     }

     return NextResponse.json({ success: true, answers });
  } catch (error) {
     console.error(error);
     return NextResponse.json({ success: false, error: "Fetch error" }, { status: 500 });
  }
}
