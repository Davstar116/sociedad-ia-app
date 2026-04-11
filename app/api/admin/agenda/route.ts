import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const POSTULANTES_DB_ID = process.env.NOTION_DATABASE_ID;
const ENTREVISTAS_DB_ID = process.env.NOTION_ENTREVISTAS_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export async function GET() {
  if (!NOTION_TOKEN || !POSTULANTES_DB_ID || !ENTREVISTAS_DB_ID) {
    return NextResponse.json({ success: false, error: "Faltan credenciales" }, { status: 500 });
  }

  try {
    // 1. Fetch Candidatos (para obtener CV y Núcleo)
    let postulantes: any[] = [];
    let hasMorePostulantes = true;
    let cursorPostulantes = undefined;

    while (hasMorePostulantes) {
      const body: any = {};
      if (cursorPostulantes) body.start_cursor = cursorPostulantes;

      const res = await fetch(`https://api.notion.com/v1/databases/${POSTULANTES_DB_ID}/query`, {
        method: "POST", headers: notionHeaders, body: JSON.stringify(body), cache: 'no-store'
      });
      const data = await res.json();
      if (data.results) postulantes.push(...data.results);
      hasMorePostulantes = data.has_more;
      cursorPostulantes = data.next_cursor;
    }

    const candidosRef: Record<string, any> = {};
    postulantes.forEach((p) => {
      const pProps = p.properties;
      const cvUrl = pProps["CV"]?.url || null;
      const emailRaw = pProps["Correo electrónico"]?.email || pProps["Correo"]?.email || "";
      const email = emailRaw.toLowerCase().trim();
      const id = p.id;

      const nucleoObj = pProps["Núcleo"];
      let nucleoStr = "No definido";
      if (nucleoObj?.multi_select?.length > 0) {
        nucleoStr = nucleoObj.multi_select.map((s:any) => s.name).join(", ");
      } else if (nucleoObj?.select) {
        nucleoStr = nucleoObj.select.name;
      }
      candidosRef[email] = { cvUrl, nucleo: nucleoStr, objId: id };
    });

    // 2. Fetch Entrevistas
    let entrevistas: any[] = [];
    let hasMoreEntrevistas = true;
    let cursorEntrevistas = undefined;

    while (hasMoreEntrevistas) {
      const body: any = {};
      if (cursorEntrevistas) body.start_cursor = cursorEntrevistas;

      const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
        method: "POST", headers: notionHeaders, body: JSON.stringify(body), cache: 'no-store'
      });
      const data = await res.json();
      if (data.results) entrevistas.push(...data.results);
      hasMoreEntrevistas = data.has_more;
      cursorEntrevistas = data.next_cursor;
    }

    let agenda: any[] = [];

    entrevistas.forEach((e) => {
      const props = e.properties;
      const estatusObj = props["Estatus"]?.select?.name || props["Estatus"]?.status?.name || "";
      const isReservado = estatusObj.toLowerCase() === "reservado";
      const isCompletada = estatusObj.toLowerCase().startsWith("completad");

      if (isReservado || isCompletada) {
         const postulanteName = props["Postulante"]?.rich_text?.[0]?.plain_text || "Candidato Desconocido";
         const correoRaw = props["Correo Postulante"]?.email || props["Correo"]?.email || props["Correo"]?.rich_text?.[0]?.plain_text || "";
         const correo = correoRaw.toLowerCase().trim();
         const e1 = props["Entrevistador 1"]?.rich_text?.[0]?.plain_text?.trim() || "";
         const e2 = props["Entrevistador 2"]?.rich_text?.[0]?.plain_text?.trim() || "";
         const dia = props["Dia"]?.select?.name || "";
         const fechaNum = props["Fecha"]?.number || 0;
         const hora = props["Hora"]?.rich_text?.[0]?.plain_text || "";
         const meetLink = props["Link Meet"]?.url || "";
         
         const ref = candidosRef[correo] || {};

         agenda.push({
           idBloque: e.id,
           idPostulante: ref.objId || null,
           postulante: postulanteName,
           correoPostulante: correo,
           entrevistador1: e1,
           entrevistador2: e2,
           dia,
           fecha: fechaNum,
           hora,
           estatus: isCompletada ? "Completada" : "Reservado",
           meetLink,
           cvUrl: ref.cvUrl || null,
           nucleos: ref.nucleo || "No definido"
         });
      }
    });

    // 🛡️ ORDENAMIENTO CRONOLÓGICO ROBUSTO (PRÓXIMA ARRIBA)
    agenda.sort((a, b) => {
       // 1. Prioridad por Fecha (Día del mes)
       if (a.fecha !== b.fecha) return a.fecha - b.fecha;
       // 2. Prioridad por Hora (Formato HH:mm)
       return (a.hora || "").localeCompare(b.hora || "");
    });

    return NextResponse.json({ success: true, agenda });
  } catch(error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
