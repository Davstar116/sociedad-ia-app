// app/api/registro/route.ts
import { NextResponse } from "next/server";
import { notion, DATABASE_ID } from "@/lib/notion";

// Función auxiliar para dibujar estrellas en texto (Ej: ★★★★☆)
function renderStars(rating: number) {
  // Aseguramos que rating sea un número válido entre 1 y 5
  const r = Math.max(1, Math.min(5, rating || 1)); 
  return "★".repeat(r) + "☆".repeat(5 - r);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. Crear página en Notion
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID as string },
      properties: {
        "Nombre Completo": { title: [{ text: { content: data.nombre } }] },
        "Correo electrónico": { email: data.email },
        "Celular": { phone_number: data.telefono },
        // Validamos que semestre sea número
        "Semestre": { number: Number(data.semestre) || 1 }, 
        "CV": { url: data.cvLink },
        "Carrera": { rich_text: [{ text: { content: data.carrera } }] },
        "Núcleo": { multi_select: data.nucleos.map((n: string) => ({ name: n })) },
        "Estatus del postulante": { status: { name: "Registrado" } },
        "Score_IA": { number: 0 },
      },
      // 2. Contenido del documento (Respuestas + Skills)
      children: [
        // SECCIÓN 1: CULTURA
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ text: { content: "🧠 Entrevista Cultural" } }] },
        },
        // Aquí estaba el error del color "blue", ya fue eliminado
        {
          object: "block", type: "paragraph",
          paragraph: { rich_text: [{ text: { content: `Aportación: ${data.respuestas.aportacion}` } }] },
        },
        {
          object: "block", type: "paragraph",
          paragraph: { rich_text: [{ text: { content: `Mayor Orgullo: ${data.respuestas.orgullo}` } }] },
        },
        {
          object: "block", type: "paragraph",
          paragraph: { rich_text: [{ text: { content: `Inspiración de Equipo: ${data.respuestas.inspiracion}` } }] },
        },
        {
          object: "block", type: "paragraph",
          paragraph: { rich_text: [{ text: { content: `Motivo SIAFI: ${data.respuestas.motivo}` } }] },
        },
        {
          object: "block", type: "paragraph",
          paragraph: { rich_text: [{ text: { content: `Fuente: ${data.respuestas.fuente}` } }] },
        },
        {
          object: "block", type: "paragraph",
          paragraph: { rich_text: [{ text: { content: `Expectativas: ${data.respuestas.expectativas}` } }] },
        },
        {
          object: "block", type: "paragraph",
          paragraph: { rich_text: [{ text: { content: `Áreas de Interés: ${data.respuestas.areasInteres}` } }] },
        },

        // SECCIÓN 2: SKILLS TÉCNICOS
        {
          object: "block",
          type: "heading_2",
          heading_2: { rich_text: [{ text: { content: "💻 Evaluación Técnica" } }] },
        },
        // Lenguajes
        {
          object: "block", type: "heading_3",
          heading_3: { rich_text: [{ text: { content: "Lenguajes de Programación" } }] },
        },
        ...Object.entries(data.skills.lenguajes).map(([key, val]) => ({
          object: "block", type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ text: { content: `${key}: ${renderStars(val as number)}` } }] }
        })),
        // Tecnologías
        {
          object: "block", type: "heading_3",
          heading_3: { rich_text: [{ text: { content: "Tecnologías & Frameworks" } }] },
        },
        ...Object.entries(data.skills.tecnologias).map(([key, val]) => ({
          object: "block", type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ text: { content: `${key}: ${renderStars(val as number)}` } }] }
        })),
        // Micros
        {
          object: "block", type: "heading_3",
          heading_3: { rich_text: [{ text: { content: "Microcontroladores" } }] },
        },
        ...Object.entries(data.skills.micros).map(([key, val]) => ({
          object: "block", type: "bulleted_list_item",
          bulleted_list_item: { rich_text: [{ text: { content: `${key}: ${renderStars(val as number)}` } }] }
        })),
      ],
    });

    return NextResponse.json({ message: "Éxito", id: response.id }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error Notion:", error);
    // Devolvemos el mensaje de error exacto para facilitar depuración futura
    return NextResponse.json({ message: error.message || "Error desconocido" }, { status: 500 });
  }
}