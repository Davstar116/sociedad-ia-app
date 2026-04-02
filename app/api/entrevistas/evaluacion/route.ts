import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EVALUACIONES_DB_ID = process.env.NOTION_EVALUACIONES_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// 🧠 CACHÉ EN MEMORIA PARA SINCRONIZACIÓN EN TIEMPO REAL
let syncCache: Record<string, any> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idBloque = searchParams.get('idBloque');

  if (!idBloque) return NextResponse.json({ success: false });
  return NextResponse.json({ success: true, data: syncCache[idBloque] || {} });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, idBloque, payload } = body;

    // 🔄 ACCIÓN: SINCRONIZAR EN TIEMPO REAL
    if (action === "sync") {
      syncCache[idBloque] = { ...syncCache[idBloque], ...payload };
      return NextResponse.json({ success: true });
    }

    // 💾 ACCIÓN: GUARDADO DEFINITIVO EN NOTION (COMO CONTENIDO DE PÁGINA)
    if (action === "save") {
      const { postulanteId, postulanteNombre, nucleoPrincipal, nucleoSecundario, estrellasE1, estrellasE2, comentariosE1, comentariosE2, qnaArray } = payload;

      // 1. Armar los bloques de contenido (Preguntas como Títulos y Respuestas como párrafos)
      const childrenBlocks: any[] = [];
      
      if (qnaArray && Array.isArray(qnaArray)) {
        qnaArray.forEach(item => {
          // Bloque de Pregunta (Título H3 en color morado)
          childrenBlocks.push({
            object: 'block',
            type: 'heading_3',
            heading_3: { rich_text: [{ type: 'text', text: { content: item.pregunta.substring(0, 2000) }, annotations: { color: "purple" } }] }
          });
          
          // Bloque de Respuesta (Dividido en trozos si supera los 2000 caracteres de Notion)
          const chunks = item.respuesta.match(/[\s\S]{1,2000}/g) || ["Sin respuesta anotada."];
          chunks.forEach(chunk => {
            childrenBlocks.push({
              object: 'block',
              type: 'paragraph',
              paragraph: { rich_text: [{ type: 'text', text: { content: chunk } }] }
            });
          });
        });
      }

      // 2. Crear la página en la DB Evaluaciones_2026 e inyectar el contenido
      await fetch(`https://api.notion.com/v1/pages`, {
        method: "POST", headers: notionHeaders,
        body: JSON.stringify({
          parent: { database_id: EVALUACIONES_DB_ID },
          properties: {
            "Postulante": { title: [{ text: { content: postulanteNombre } }] },
            "Núcleo Principal": { select: { name: nucleoPrincipal } },
            "Núcleo Secundario": { select: { name: nucleoSecundario } },
            "Puntuación E1": { number: estrellasE1 },
            "Puntuación E2": { number: estrellasE2 },
            "Comentarios E1": { rich_text: [{ text: { content: comentariosE1.substring(0, 2000) } }] },
            "Comentarios E2": { rich_text: [{ text: { content: comentariosE2.substring(0, 2000) } }] }
          },
          children: childrenBlocks // ✅ AQUÍ ENVIAMOS TODO EL CONTENIDO
        })
      });

      // 3. Actualizar el estatus del candidato en la DB original Candidatos_2026
      await fetch(`https://api.notion.com/v1/pages/${postulanteId}`, {
        method: "PATCH", headers: notionHeaders,
        body: JSON.stringify({
          properties: {
            "Estatus del postulante": { select: { name: "Entrevistado" } }
          }
        })
      });

      // Limpiamos la caché
      delete syncCache[idBloque];

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Acción no válida" });
  } catch (error) {
    console.error("Error en evaluación:", error);
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}