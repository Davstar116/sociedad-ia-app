import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const AVAILABILITY_DB_ID = process.env.NOTION_AVAILABILITY_DB_ID;
const INTERVIEWS_DB_ID = process.env.NOTION_INTERVIEWS_DB_ID;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// Configuración de Fechas Base (Lunes de cada semana)
const WEEK_START_DATES = {
  0: "2026-02-09", // Lunes Semana 1
  1: "2026-02-16"  // Lunes Semana 2
};

export async function POST(request: Request) {
  try {
    // 1. VALIDACIÓN DE SEGURIDAD
    // Aquí podrías validar que quien llama sea Admin, por ahora confiamos en el UI oculto
    
    if (!AVAILABILITY_DB_ID || !INTERVIEWS_DB_ID) {
      return NextResponse.json({ error: "Faltan IDs de Base de Datos" }, { status: 500 });
    }

    // 2. DESCARGAR TODAS LAS DISPONIBILIDADES
    const availResponse = await fetch(`https://api.notion.com/v1/databases/${AVAILABILITY_DB_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ page_size: 100 }) // Asumimos < 100 entrevistadores
    });

    const availData = await availResponse.json();
    const interviewers = availData.results.map((page: any) => {
      const props = page.properties;
      const rawJSON = props["HorariosJSON"]?.rich_text?.[0]?.plain_text || "[]";
      return {
        id: page.id,
        name: props["Nombre"]?.title?.[0]?.plain_text || "Anónimo",
        slots: new Set(JSON.parse(rawJSON)) // Usamos Set para búsqueda rápida
      };
    });

    // 3. ALGORITMO DE MATCHMAKING
    const generatedBlocks = [];

    // Iteramos por Semanas (0 y 1)
    for (let weekId = 0; weekId <= 1; weekId++) {
      // Iteramos por Días (Lunes=0 a Domingo=6, ajustado a tu grid de dias 9-15/16-22)
      // Tu Grid usa dias del mes (9, 10, 11...), necesitamos mapear eso.
      // Simplificación: Iteramos por los números de día del Grid.
      const startDay = weekId === 0 ? 9 : 16;
      const endDay = weekId === 0 ? 15 : 22;

      for (let dayNum = startDay; dayNum <= endDay; dayNum++) {
        // Iteramos por Horas (8 a 21)
        for (let hour = 8; hour <= 21; hour++) {
          // Iteramos por Minutos de Inicio de Bloque (00, 15, 30, 45)
          // OJO: Solo revisamos inicios que permitan 45 mins.
          // Si empieza 21:30, termina 22:15 (Fuera de rango si el límite es 22:00)
          // Ajusta según tu regla de cierre.
          const minutes = ["00", "15", "30", "45"];
          
          for (const minute of minutes) {
             // Definimos los 3 bloques de 15 min requeridos
             // Bloque 1: Inicio
             // Bloque 2: +15 min
             // Bloque 3: +30 min
             
             // Generamos las Keys de los 3 slots necesarios
             const timeSlots = getRequiredSlots(weekId, dayNum, hour, parseInt(minute));
             
             if (!timeSlots) continue; // Si se sale del horario permitido (ej. empieza 21:45)

             // 4. BUSCAR ENTREVISTADORES DISPONIBLES PARA ESTE BLOQUE COMPLETO
             const availableDevs = interviewers.filter((dev: any) => {
                return timeSlots.every(slotKey => dev.slots.has(slotKey));
             });

             // 5. CREAR PAREJAS
             // Si hay 2 devs -> 1 bloque
             // Si hay 4 devs -> 2 bloques
             // Si hay 3 devs -> 1 bloque (sobra 1)
             
             let devsPool = [...availableDevs];
             
             while (devsPool.length >= 2) {
                const partnerA = devsPool.shift(); // Sacamos al primero
                const partnerB = devsPool.shift(); // Sacamos al segundo (pareja)
                
                // Construimos la Fecha ISO para Notion (YYYY-MM-DDTHH:MM:00.000-06:00)
                // Calculamos fecha real basada en weekId y dayNum
                // Nota: Esto requiere una función auxiliar de fecha precisa.
                const isoDate = constructIsoDate(dayNum, hour, minute);

                generatedBlocks.push({
                   title: `Entrevista ${dayNum}/${hour}:${minute} (${partnerA.name} & ${partnerB.name})`,
                   date: isoDate,
                   interviewers: `${partnerA.name}, ${partnerB.name}`
                });
             }
          }
        }
      }
    }

    console.log(`✅ [MOTOR] Generados ${generatedBlocks.length} bloques posibles.`);

    // 6. GUARDAR EN NOTION (Lote por lote para no saturar)
    // Esto puede tardar, en producción se usaría un Queue, aquí lo hacemos directo.
    let createdCount = 0;

    for (const block of generatedBlocks) {
      // Opcional: Verificar si ya existe para no duplicar (Saltamos por rendimiento ahora)
      
      await fetch(`https://api.notion.com/v1/pages`, {
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
      createdCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se generaron ${createdCount} bloques de entrevista exitosamente.` 
    });

  } catch (error) {
    console.error("❌ [MOTOR ERROR]:", error);
    return NextResponse.json({ error: "Error interno del motor" }, { status: 500 });
  }
}

// --- HELPER FUNCTIONS ---

function getRequiredSlots(weekId: number, dayNum: number, startHour: number, startMin: number) {
  // Retorna un array con las 3 keys necesarias (ej: ["0-9-9:00", "0-9-9:15", "0-9-9:30"])
  // Maneja el cambio de hora (ej: 9:45 -> 10:00 -> 10:15)
  
  const slots = [];
  let h = startHour;
  let m = startMin;

  for (let i = 0; i < 3; i++) {
    // Si se pasa de las 22:00, inválido (ajusta según tu hora fin deseada)
    if (h >= 22) return null; 

    // Formato de minuto "00"
    const mStr = m === 0 ? "00" : m.toString();
    slots.push(`${weekId}-${dayNum}-${h}:${mStr}`);

    // Sumar 15 mins
    m += 15;
    if (m === 60) {
      m = 0;
      h += 1;
    }
  }
  return slots;
}

function constructIsoDate(dayNum: number, hour: number, minute: string) {
  // Construye fecha ISO 8601 para Mexico City (UTC-6)
  // Año fijo 2026, Mes Febrero.
  // OJO: dayNum es el día del mes (9, 10... 22)
  
  const d = dayNum.toString().padStart(2, '0');
  const h = hour.toString().padStart(2, '0');
  
  // Formato: 2026-02-09T09:00:00-06:00
  return `2026-02-${d}T${h}:${minute}:00-06:00`; 
}