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
    
    const dayInterviewerSlots: Record<string, Record<string, Set<string>>> = {};
    let entrevistadoresLeidos = 0;

    // 2. Extraer datos con limpieza extrema
    for (const page of queryData.results) {
      const nombre = page.properties["Nombre"]?.title[0]?.plain_text || "Entrevistador";
      
      // ✅ MEJORA 1: Buscar la columna y unir TODOS los fragmentos de texto
      const propiedadHorario = page.properties["HorarioJSON"] || page.properties["Horarios"];
      const richTextArray = propiedadHorario?.rich_text || [];
      const horariosRaw = richTextArray.map((t: any) => t.plain_text).join("") || "[]";
      
      let horariosArray: string[] = [];
      try { 
        horariosArray = JSON.parse(horariosRaw); 
      } catch { 
        // ✅ MEJORA 2: Si el JSON viene roto, le quitamos corchetes, comillas y basura
        const cleaned = horariosRaw.replace(/[\[\]"'\\]/g, ''); 
        horariosArray = cleaned.split(",").map((s: string) => s.trim()).filter(Boolean);
      }

      if (horariosArray.length > 0) entrevistadoresLeidos++;

      for (const slot of horariosArray) {
        const lastDash = slot.lastIndexOf('-');
        if (lastDash === -1) continue;
        
        const dayPrefix = slot.substring(0, lastDash); 
        const time = slot.substring(lastDash + 1);     

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

      for (let i = 0; i <= HORAS_CHRONO.length - 4; i++) {
        const t1 = HORAS_CHRONO[i];
        const t2 = HORAS_CHRONO[i+1];
        const t3 = HORAS_CHRONO[i+2];
        const t4 = HORAS_CHRONO[i+3];

        const availableInterviewers = Object.keys(interviewersMap).filter(name => {
          const slots = interviewersMap[name];
          return slots.has(t1) && slots.has(t2) && slots.has(t3) && slots.has(t4);
        });

        let idx = 0;
        let blockCount = 1;
        
        while (idx + 1 < availableInterviewers.length) {
          const e1 = availableInterviewers[idx];
          const e2 = availableInterviewers[idx+1];

          // Consumimos los bloques
          interviewersMap[e1].delete(t1); interviewersMap[e1].delete(t2); 
          interviewersMap[e1].delete(t3); interviewersMap[e1].delete(t4);
          
          interviewersMap[e2].delete(t1); interviewersMap[e2].delete(t2); 
          interviewersMap[e2].delete(t3); interviewersMap[e2].delete(t4);

          const [startH, startM] = t1.split(":");
          const endH = (parseInt(startH) + 1).toString().padStart(2, '0');
          const horarioTexto = `${t1} - ${endH}:${startM}`;
          
          const blockId = `${dayPrefix}-${t1} - B${blockCount}`;

          // 4. Guardar en la base de datos
          const notionCreateRes = await fetch("https://api.notion.com/v1/pages", {
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

          if (!notionCreateRes.ok) {
            const errLog = await notionCreateRes.text();
            console.error("Fallo guardando en Notion el bloque", blockId, errLog);
          } else {
            bloquesCreados.push(blockId);
          }

          idx += 2;
          blockCount++;
        }
      }
    }

    // ✅ MEJORA 3: Mensaje inteligente para saber qué pasó si arroja 0
    if (bloquesCreados.length === 0) {
        return NextResponse.json({ 
            success: true, 
            message: `Generados 0 bloques. (Se leyeron ${entrevistadoresLeidos} perfiles, pero ninguno coincidió en pares).`,
            bloques: []
        });
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Éxito! Se generaron ${bloquesCreados.length} bloques a partir de ${entrevistadoresLeidos} perfiles analizados.`,
      bloques: bloquesCreados
    });

  } catch (error: any) {
    console.error("Error generando bloques:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}