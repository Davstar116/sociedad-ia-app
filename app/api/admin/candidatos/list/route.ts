import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CANDIDATOS_DB = process.env.NOTION_DATABASE_ID;
const EVALUACIONES_DB = process.env.NOTION_EVALUACIONES_DB_ID;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json"
};

async function fetchAllPages(dbId: string) {
  let pages: any[] = [];
  let cursor = undefined;

  while (true) {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({ start_cursor: cursor })
    });
    
    if (!res.ok) {
       console.error(`Error fetching DB ${dbId}`);
       break;
    }
    
    const data = await res.json();
    pages.push(...data.results);
    
    if (data.has_more) {
      cursor = data.next_cursor;
    } else {
      break;
    }
  }
  return pages;
}

export async function GET() {
  if (!NOTION_TOKEN || !CANDIDATOS_DB || !EVALUACIONES_DB) {
     return NextResponse.json({ error: "Missing DBs" }, { status: 500 });
  }

  try {
     const [cancidatosData, evaluacionesData] = await Promise.all([
       fetchAllPages(CANDIDATOS_DB),
       fetchAllPages(EVALUACIONES_DB)
     ]);

     // Create mapping of evaluations by email
     const evMap: Record<string, any> = {};
     for (const ev of evaluacionesData) {
        const props = ev.properties;
        
        let correo = "";
        const emailProp = props["Correo Postulante"] || props["Correo"] || props["Correo electrónico"];
        if (emailProp?.email) correo = emailProp.email.toLowerCase().trim();
        else if (emailProp?.rich_text?.[0]) correo = emailProp.rich_text[0].plain_text.toLowerCase().trim();
        else if (emailProp?.title?.[0]) correo = emailProp.title[0].plain_text.toLowerCase().trim();

        if (correo) {
           evMap[correo] = {
               evalId: ev.id,
               nucleoPrincipal: props["Núcleo Principal"]?.select?.name || "",
               nucleoSecundario: props["Núcleo Secundario"]?.select?.name || "",
               puntuacionE1: props["Puntuación E1"]?.number || 0,
               puntuacionE2: props["Puntuación E2"]?.number || 0,
               comentariosE1: props["Comentarios E1"]?.rich_text?.[0]?.plain_text || "",
               comentariosE2: props["Comentarios E2"]?.rich_text?.[0]?.plain_text || ""
           };
        }
     }

     const candidatosList = cancidatosData.map((c: any) => {
        const p = c.properties;
        let correo = "";
        const emailProp = p["Correo electrónico"] || p["Correo"] || p["Correo Postulante"];
        if (emailProp?.email) correo = emailProp.email.toLowerCase().trim();
        else if (emailProp?.rich_text?.[0]) correo = emailProp.rich_text[0].plain_text.toLowerCase().trim();

        const nucleosOriginales = p["Núcleo"]?.multi_select?.map((m: any) => m.name) || [];
        
        const candidatoObj = {
           id: c.id,
           nombre: p["Nombre Completo"]?.title?.[0]?.plain_text || "Sin Nombre",
           correo: correo,
           cvUrl: p["CV"]?.url || "",
           nucleosOriginales,
           estatus: p["Estatus del postulante"]?.status?.name || p["Estatus del postulante"]?.select?.name || "Registrado",
           nucleoEvaluador: p["Núcleo Evaluador"]?.select?.name || null,
           
           votoPreLider: p["Voto Pre Lider"]?.select?.name || "Pendiente",
           votoPreVP: p["Voto Pre VP"]?.select?.name || "Pendiente",
           votoPrePresi: p["Voto Pre Presi"]?.select?.name || "Pendiente",
           
           votoFinalLider: p["Voto Final Lider"]?.select?.name || "Pendiente",
           votoFinalVP: p["Voto Final VP"]?.select?.name || "Pendiente",
           votoFinalPresi: p["Voto Final Presi"]?.select?.name || "Pendiente",
           
           evaluacion: evMap[correo] || null
        };
        return candidatoObj;
     });

     return NextResponse.json({ success: true, candidatos: candidatosList });
  } catch (error) {
     console.error(error);
     return NextResponse.json({ error: "Fetch error" }, { status: 500 });
  }
}
