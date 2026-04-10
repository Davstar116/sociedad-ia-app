import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const EVALUACIONES_DB_ID = process.env.NOTION_EVALUACIONES_DB_ID;
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID; 

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

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
      const currentData = syncCache[idBloque] || {};
      
      // Realizamos un merge profundo para objetos anidados como respuestasEval
      const mergedPayload = { ...payload };
      if (payload.respuestasEval && currentData.respuestasEval) {
        mergedPayload.respuestasEval = {
          ...currentData.respuestasEval,
          ...payload.respuestasEval
        };
      }

      syncCache[idBloque] = { ...currentData, ...mergedPayload };
      return NextResponse.json({ success: true });
    }

    // 💾 ACCIÓN: GUARDADO DEFINITIVO EN NOTION
    if (action === "save") {
      const { emailPostulante, postulanteNombre, nucleoPrincipal, nucleoSecundario, estrellasE1, estrellasE2, comentariosE1, comentariosE2, qnaArray } = payload;

      // 1. Armar los bloques de contenido (Preguntas y Respuestas con Formato Elegante)
      const childrenBlocks: any[] = [];
      let currentSection = "";

      if (qnaArray && Array.isArray(qnaArray)) {
        qnaArray.forEach(item => {
          
          // Si cambiamos de sección, dibujamos un Título y un Divisor
          if (item.seccion !== currentSection) {
            currentSection = item.seccion;
            childrenBlocks.push({ object: 'block', type: 'divider', divider: {} });
            childrenBlocks.push({
              object: 'block', type: 'heading_2',
              heading_2: { rich_text: [{ type: 'text', text: { content: currentSection }, annotations: { color: "purple_background" } }] }
            });
          }

          // Pregunta
          childrenBlocks.push({
            object: 'block', type: 'heading_3',
            heading_3: { rich_text: [{ type: 'text', text: { content: item.pregunta.substring(0, 2000) }, annotations: { color: "purple", bold: true } }] }
          });

          // Respuesta (o aviso de vacía)
          const respuestaReal = (item.respuesta && item.respuesta.trim() !== "") ? item.respuesta : "Sin respuesta anotada.";
          const isVacia = respuestaReal === "Sin respuesta anotada.";
          
          const chunks = respuestaReal.match(/[\s\S]{1,2000}/g) || ["Sin respuesta anotada."];
          
          chunks.forEach((chunk: string) => {
            childrenBlocks.push({
              object: 'block', type: 'paragraph',
              paragraph: { 
                rich_text: [{ 
                  type: 'text', 
                  text: { content: chunk }, 
                  annotations: { italic: isVacia, color: isVacia ? "gray" : "default" } 
                }] 
              }
            });
          });
        });
      }

      // 2. Crear la página en la DB Evaluaciones_2026
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
          children: childrenBlocks
        })
      });

      // 3. Actualizar el estatus del candidato en la DB Candidatos_2026
      if (emailPostulante && CANDIDATOS_DB_ID) {
        const queryRes = await fetch(`https://api.notion.com/v1/databases/${CANDIDATOS_DB_ID}/query`, {
          method: "POST", headers: notionHeaders,
          body: JSON.stringify({
            filter: {
              or: [
                { property: "Correo", email: { equals: emailPostulante } },
                { property: "Email", email: { equals: emailPostulante } },
                { property: "Correo electrónico", email: { equals: emailPostulante } }
              ]
            }
          })
        });
        const dataCandidato = await queryRes.json();
        
        if (dataCandidato.results && dataCandidato.results.length > 0) {
          const candidatoPageId = dataCandidato.results[0].id;
          await fetch(`https://api.notion.com/v1/pages/${candidatoPageId}`, {
            method: "PATCH", headers: notionHeaders,
            body: JSON.stringify({
              properties: {
                "Estatus del postulante": { status: { name: "Entrevistado" } }
              }
            })
          });
        }
      }

      // 4. Actualizar la cita en la DB de Entrevistas para que desaparezca
      if (idBloque) {
        await fetch(`https://api.notion.com/v1/pages/${idBloque}`, {
          method: "PATCH", headers: notionHeaders,
          body: JSON.stringify({
            properties: {
              "Estatus": { select: { name: "Completada" } }
            }
          })
        });
      }

      delete syncCache[idBloque];
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Acción no válida" });
  } catch (error) {
    console.error("Error en evaluación:", error);
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}