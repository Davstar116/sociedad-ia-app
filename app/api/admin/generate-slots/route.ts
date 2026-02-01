import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const AVAILABILITY_DB_ID = process.env.NOTION_AVAILABILITY_DB_ID;
const INTERVIEWS_DB_ID = process.env.NOTION_INTERVIEWS_DB_ID;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function POST(request: Request) {
  console.log("🚀 [MOTOR] Iniciando secuencia de generación...");

  try {
    if (!AVAILABILITY_DB_ID || !INTERVIEWS_DB_ID) {
      console.error("❌ [MOTOR] Faltan IDs de variables de entorno.");
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 });
    }

    // 1. DESCARGAR DISPONIBILIDAD
    console.log("📥 [MOTOR] Descargando disponibilidad de Notion...");
    const availResponse = await fetch(`https://api.notion.com/v1/databases/${AVAILABILITY_DB_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ page_size: 100 })
    });

    if (!availResponse.ok) {
        console.error("❌ [MOTOR ERROR LEER DISPONIBILIDAD]:", await availResponse.text());
        return NextResponse.json({ error: "Error leyendo disponibilidad" }, { status: 500 });
    }

    const availData = await availResponse.json();
    console.log(`✅ [MOTOR] Encontrados ${availData.results.length} usuarios con datos.`);

    const interviewers = availData.results.map((page: any) => {
      const props = page.properties;
      const rawJSON = props["HorariosJSON"]?.rich_text?.[0]?.plain_text || "[]";
      const name = props["Nombre"]?.title?.[0]?.plain_text || "Anónimo";
      
      // LOGUEAR UN EJEMPLO PARA VER SI EL JSON ES VÁLIDO
      // console.log(`👤 [MOTOR] Procesando a ${name}. Slots: ${rawJSON.substring(0, 30)}...`);
      
      return {
        id: page.id,
        name: name,
        slots: new Set(JSON.parse(rawJSON))
      };
    });

    if (interviewers.length < 2) {
        console.warn("⚠️ [MOTOR] Menos de 2 entrevistadores encontrados. Imposible hacer match.");
        return NextResponse.json({ error: "Se necesitan al menos 2 entrevistadores para generar bloques." }, { status: 400 });
    }

    // 2. ALGORITMO MATCHMAKING
    const generatedBlocks = [];
    let matchesLog = 0; // Para no saturar la consola, contamos matches

    // Iteramos Semanas 0 y 1
    for (let weekId = 0; weekId <= 1; weekId++) {
      const startDay = weekId === 0 ? 9 : 16;
      const endDay = weekId === 0 ? 15 : 22;

      for (let dayNum = startDay; dayNum <= endDay; dayNum++) {
        for (let hour = 8; hour <= 21; hour++) {
          const minutes = ["00", "15", "30", "45"];
          
          for (const minute of minutes) {
             const timeSlots = getRequiredSlots(weekId, dayNum, hour, parseInt(minute));
             if (!timeSlots) continue;

             // BUSCAR QUIENES TIENEN ESTOS 3 SLOTS
             const availableDevs = interviewers.filter((dev: any) => {
                const hasAll = timeSlots.every(slotKey => dev.slots.has(slotKey));
                return hasAll;
             });

             // SI HAY 2 O MÁS, HACEMOS PAREJAS
             if (availableDevs.length >= 2) {
                 let devsPool = [...availableDevs];
                 while (devsPool.length >= 2) {
                    const partnerA = devsPool.shift();
                    const partnerB = devsPool.shift();
                    
                    const isoDate = constructIsoDate(dayNum, hour, minute);
                    
                    generatedBlocks.push({
                       title: `Entrevista ${dayNum} Feb - ${hour}:${minute}`,
                       date: isoDate,
                       interviewers: `${partnerA.name}, ${partnerB.name}`
                    });
                    matchesLog++;
                 }
             }
          }
        }
      }
    }

    console.log(`✅ [MOTOR] Algoritmo terminado. Bloques generados en memoria: ${generatedBlocks.length}`);

    if (generatedBlocks.length === 0) {
        console.warn("⚠️ [MOTOR] No se encontraron coincidencias de horarios entre los usuarios.");
        return NextResponse.json({ success: false, message: "0 coincidencias encontradas. Asegúrate de que los horarios se solapen." });
    }

    // 3. GUARDAR EN NOTION
    console.log("💾 [MOTOR] Escribiendo en Base de Datos de Entrevistas...");
    let successCount = 0;
    let errorCount = 0;

    for (const block of generatedBlocks) {
      const response = await fetch(`https://api.notion.com/v1/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parent: { database_id: INTERVIEWS_DB_ID },
          properties: {
            "ID Sesion": { title: [{ text: { content: block.title } }] },
            "Fecha Inicio": { date: { start: block.date } },
            "Entrevistadores": { rich_text: [{ text: { content: block.interviewers } }] },
            "Estatus": { select: { name: "Disponible" } }
          }
        })
      });

      if (response.ok) {
          successCount++;
      } else {
          errorCount++;
          console.error("❌ [MOTOR WRITE ERROR]:", await response.text());
      }
    }

    console.log(`🏁 [MOTOR] Finalizado. Éxitos: ${successCount}, Errores: ${errorCount}`);
    
    if (errorCount > 0 && successCount === 0) {
        return NextResponse.json({ error: "Fallo total al escribir en Notion (Revisar permisos del robot)" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Generados ${successCount} bloques. (Errores: ${errorCount})` 
    });

  } catch (error) {
    console.error("❌ [MOTOR CRASH]:", error);
    return NextResponse.json({ error: "Error interno del motor" }, { status: 500 });
  }
}

// --- HELPERS ---
function getRequiredSlots(weekId: number, dayNum: number, startHour: number, startMin: number) {
  const slots = [];
  let h = startHour;
  let m = startMin;

  for (let i = 0; i < 3; i++) {
    if (h >= 22) return null; 
    const mStr = m === 0 ? "00" : m.toString();
    slots.push(`${weekId}-${dayNum}-${h}:${mStr}`); // KEY FORMAT: 0-9-8:00
    m += 15;
    if (m === 60) { m = 0; h += 1; }
  }
  return slots;
}

function constructIsoDate(dayNum: number, hour: number, minute: string) {
  const d = dayNum.toString().padStart(2, '0');
  const h = hour.toString().padStart(2, '0');
  // Ajuste UTC-6 (CDMX) manual para Notion
  // Notion requiere ISO 8601. Si ponemos offset -06:00, Notion lo respeta.
  return `2026-02-${d}T${h}:${minute}:00-06:00`; 
}