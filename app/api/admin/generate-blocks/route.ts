import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const AVAILABILITY_DB_ID = process.env.NOTION_AVAILABILITY_DB_ID;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// Generamos un arreglo cronológico de todas las horas posibles
const HORAS_CHRONO: string[] = [];
for (let i = 9; i < 21; i++) {
  for (let m of ["00", "15", "30", "45"]) {
    HORAS_CHRONO.push(`${i.toString().padStart(2, '0')}:${m}`);
  }
}

export async function POST() {
  try {
    // 1. Obtener la disponibilidad de todos los entrevistadores
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${AVAILABILITY_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
    });

    if (!queryRes.ok) throw new Error("Error leyendo disponibilidad de Notion");
    const queryData = await queryRes.json();
    
    // Diccionario para agrupar entrevistadores por DÍA y sus sets de horas
    const dayInterviewerSlots: Record<string, Record<string, Set<string>>> = {};

    // 2. Extraer datos y llenar el diccionario
    for (const page of queryData.results) {
      const nombre = page.properties["Nombre"]?.title[0]?.plain_text || "Entrevistador";
      
      // ✅ AQUÍ ESTÁ EL CAMBIO: Ahora lee "HorarioJSON"
      const horariosRaw = page.properties["HorarioJSON"]?.rich_text[0]?.plain_text || "[]";
      
      let horariosArray: string[] = [];
      try { horariosArray = JSON.parse(horariosRaw); } catch { horariosArray = horariosRaw.split(","); }

      for (const slot of horariosArray) {
        // slot format: S1-Lunes-6-09:15
        const lastDash = slot.lastIndexOf('-');
        if (lastDash === -1) continue;
        
        const dayPrefix = slot.substring(0, lastDash); // "S1-Lunes-6"
        const time = slot.substring(lastDash + 1);     // "09:15"

        if (!dayInterviewerSlots[dayPrefix]) dayInterviewerSlots[dayPrefix] = {};
        if (!dayInterviewerSlots[dayPrefix][nombre]) dayInterviewerSlots[dayPrefix][nombre] = new Set();
        
        dayInterviewerSlots[dayPrefix][nombre].add(time);
      }
    }

    const bloquesCreados = [];

    // 3. Emparejamiento usando Ventana Deslizante (Sliding Window)
    for (const [dayPrefix, interviewersMap] of Object.entries(dayInterviewerSlots)) {
      const partes = dayPrefix.split("-");
      const dia = partes[1];
      const fecha = parseInt(partes[2]);

      // Iteramos sobre las horas (dejando margen para 4 bloques de 15 mins)
      for (let i = 0; i <= HORAS_CHRONO.length - 4; i++) {
        const t1 = HORAS_CHRONO[i];
        const t2 = HORAS_CHRONO[i+1];
        const t3 = HORAS_CHRONO[i+2];
        const t4 = HORAS_CHRONO[i+3];

        // Buscar entrevistadores que tengan libres estos 4 bloques seguidos
        const availableInterviewers = Object.keys(interviewersMap).filter(name => {
          const slots = interviewersMap[name];
          return slots.has(t1) && slots.has(t2) && slots.has(t3) && slots.has(t4);
        });

        // Mientras haya al menos 2 entrevistadores disponibles, creamos un bloque
        let idx = 0;
        let blockCount = 1;
        
        while (idx + 1 < availableInterviewers.length) {
          const e1 = availableInterviewers[idx];
          const e2 = availableInterviewers[idx+1];

          // "Consumimos" estos bloques borrándolos de su disponibilidad
          interviewersMap[e1].delete(t1); interviewersMap[e1].delete(t2); 
          interviewersMap[e1].delete(t3); interviewersMap[e1].delete(t4);
          
          interviewersMap[e2].delete(t1); interviewersMap[e2].delete(t2); 
          interviewersMap[e2].delete(t3); interviewersMap[e2].delete(t4);

          // Calculamos la hora de fin
          const [startH, startM] = t1.split(":");
          const endH = (parseInt(startH) + 1).toString().padStart(2, '0');
          const horarioTexto = `${t1} - ${endH}:${startM}`;
          
          const blockId = `${dayPrefix}-${t1} - B${blockCount}`;

          // 4. Guardar en la base de datos de "SIAFI Entrevistas" en Notion
          await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              parent: { database_id: ENTREVISTAS_DB_ID! },
              properties: {
                "ID Bloque": { title: [{ text: { content: blockId } }] },
                "Dia": { select: { name: dia } },
                "Fecha": { number: fecha },
                "Hora": { rich_text: [{ text: { content: horarioTexto } }] },
                "Entrevistador 1": { rich_text: [{ text: { content: e1 } }] },
                "Entrevistador 2": { rich_text: [{ text: { content: e2 } }] },
                "Estatus": { select: { name: "Disponible" } },
              }
            }),
          });

          bloquesCreados.push(blockId);
          idx += 2;
          blockCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se generaron ${bloquesCreados.length} bloques de entrevistas exitosamente.`,
      bloques: bloquesCreados
    });

  } catch (error: any) {
    console.error("Error generando bloques:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}