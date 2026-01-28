import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const { pageId, candidateName } = await request.json();

    if (!NOTION_TOKEN || !GEMINI_API_KEY) {
      throw new Error("Faltan credenciales en .env.local");
    }

    console.log(`🧠 SophIA (Flash Latest) analizando a: ${candidateName}...`);

    // 1. LEER DE NOTION
    const blocksUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;
    const blocksRes = await fetch(blocksUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!blocksRes.ok) throw new Error("Error leyendo Notion");
    const blocksData = await blocksRes.json();

    let fullTextContext = `Candidato: ${candidateName}\n`;
    blocksData.results.forEach((block: any) => {
      if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
        fullTextContext += block.paragraph.rich_text[0].plain_text + "\n";
      }
      if (block.type === 'bulleted_list_item' && block.bulleted_list_item.rich_text.length > 0) {
        fullTextContext += "- " + block.bulleted_list_item.rich_text[0].plain_text + "\n";
      }
    });

    // 2. INVOCAR A SOPHIA (GEMINI FLASH LATEST)
    // Usamos el alias genérico que apareció en tu lista de disponibles.
    // Esto apunta automáticamente a la versión 1.5 o 2.0 que esté libre para ti.
    const modelName = "gemini-flash-latest"; 
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `
      Actúa como SophIA, la IA de reclutamiento.
      Analiza: "${fullTextContext.substring(0, 8000)}"
      
      Misión:
      1. Puntaje (0-100) técnico/cultural.
      2. Análisis ejecutivo de 2 frases.
      
      FORMATO JSON OBLIGATORIO (sin markdown):
      {"score": 85, "analysis": "Fortaleza: [texto]. Mejora: [texto]."}
    `;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error(`❌ Error ${modelName}:`, errorText);
      throw new Error(`Google bloqueó la solicitud (Error ${geminiRes.status}). Revisa la terminal.`);
    }

    const geminiData = await geminiRes.json();
    
    // Verificación extra por si la respuesta viene vacía
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
       throw new Error("SophIA no devolvió texto (Candidates empty).");
    }

    const text = geminiData.candidates[0].content.parts[0].text;
    console.log("🤖 Veredicto SophIA:", text);

    // Limpieza de JSON
    const jsonString = text.replace(/```json|```/g, "").trim();
    let sophiaDecision;
    try {
      sophiaDecision = JSON.parse(jsonString);
    } catch (e) {
      sophiaDecision = { score: 0, analysis: text.substring(0, 200) };
    }

    // 3. ESCRIBIR EN NOTION
    const updateUrl = `https://api.notion.com/v1/pages/${pageId}`;
    await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          "Score_IA": { number: sophiaDecision.score },
          "Analisis_SophIA": { rich_text: [{ text: { content: sophiaDecision.analysis } }] }
        }
      }),
    });

    return NextResponse.json({ success: true, analysis: sophiaDecision.analysis });

  } catch (error: any) {
    console.error("❌ ERROR FINAL:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}