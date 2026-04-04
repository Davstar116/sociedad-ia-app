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
    return NextResponse.json({ success: false, error: "Faltan credenciales en .env.local" }, { status: 500 });
  }

  try {
    // 1. Fetch Postulantes
    let postulantes: any[] = [];
    let hasMorePostulantes = true;
    let cursorPostulantes = undefined;

    while (hasMorePostulantes) {
      const body: any = {};
      if (cursorPostulantes) body.start_cursor = cursorPostulantes;

      const res = await fetch(`https://api.notion.com/v1/databases/${POSTULANTES_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(body),
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.results) postulantes.push(...data.results);
      
      hasMorePostulantes = data.has_more;
      cursorPostulantes = data.next_cursor;
    }

    // 2. Fetch Entrevistas
    let entrevistas: any[] = [];
    let hasMoreEntrevistas = true;
    let cursorEntrevistas = undefined;

    while (hasMoreEntrevistas) {
      const body: any = {};
      if (cursorEntrevistas) body.start_cursor = cursorEntrevistas;

      const res = await fetch(`https://api.notion.com/v1/databases/${ENTREVISTAS_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify(body),
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.results) entrevistas.push(...data.results);

      hasMoreEntrevistas = data.has_more;
      cursorEntrevistas = data.next_cursor;
    }

    // 3. Procesamiento de Candidatos
    const candidatosEstatus: Record<string, number> = {};
    const candidatosNucleo: Record<string, number> = {};
    let totalCandidatos = postulantes.length;

    postulantes.forEach((p) => {
      const props = p.properties;
      
      // Estatus
      const estatusObj = props["Estatus del postulante"];
      const estatusStr = estatusObj?.status?.name || estatusObj?.select?.name || "Registrado";
      candidatosEstatus[estatusStr] = (candidatosEstatus[estatusStr] || 0) + 1;

      // Núcleo
      const nucleoObj = props["Núcleo al que deseas postularte"] || props["Nucleo"] || props["Núcleo"];
      if (nucleoObj && nucleoObj.multi_select && nucleoObj.multi_select.length > 0) {
        nucleoObj.multi_select.forEach((s: any) => {
          const n = s.name;
          candidatosNucleo[n] = (candidatosNucleo[n] || 0) + 1;
        });
      } else if (nucleoObj && nucleoObj.select) {
          const n = nucleoObj.select.name;
          candidatosNucleo[n] = (candidatosNucleo[n] || 0) + 1;
      } else {
        candidatosNucleo["No definido"] = (candidatosNucleo["No definido"] || 0) + 1;
      }
    });

    // 4. Procesamiento de Entrevistas & Entrevistadores
    let totalEntrevistas = entrevistas.length;
    let totalCambiosAceptados = 0;
    let totalCambiosSolicitados = 0;

    const cargaPorEntrevistador: Record<string, number> = {};
    const cambiosAceptadosPorEntrevistador: Record<string, number> = {};

    entrevistas.forEach((e) => {
      const props = e.properties;
      
      const e1 = props["Entrevistador 1"]?.rich_text?.[0]?.plain_text?.trim();
      const e2 = props["Entrevistador 2"]?.rich_text?.[0]?.plain_text?.trim();
      const eSaliente = props["Entrevistador Saliente"]?.rich_text?.[0]?.plain_text?.trim();
      const solicitaIntercambio = props["Solicita Intercambio"]?.checkbox;

      if (e1 && e1 !== "Pendiente") cargaPorEntrevistador[e1] = (cargaPorEntrevistador[e1] || 0) + 1;
      if (e2 && e2 !== "Pendiente") cargaPorEntrevistador[e2] = (cargaPorEntrevistador[e2] || 0) + 1;

      if (solicitaIntercambio) {
        totalCambiosSolicitados++;
      }

      if (eSaliente && eSaliente !== "") {
        totalCambiosAceptados++;
        // Quien lo tiene ahora, aceptó el cambio de eSaliente.
        // Asignamos 1 a todo el panel pero usualmente es uno, a modo simplificado le sumamos a ambos si no sabemos quién fue.
        if (e1 && e1 !== "Pendiente" && e1 !== eSaliente) cambiosAceptadosPorEntrevistador[e1] = (cambiosAceptadosPorEntrevistador[e1] || 0) + 1;
        if (e2 && e2 !== "Pendiente" && e2 !== eSaliente) cambiosAceptadosPorEntrevistador[e2] = (cambiosAceptadosPorEntrevistador[e2] || 0) + 1;
      }
    });

    // Ranking de Entrevistadores
    const rankingCarga = Object.keys(cargaPorEntrevistador)
      .map((nombre) => ({
        nombre,
        entrevistasAsignadas: cargaPorEntrevistador[nombre] || 0,
        cambiosAceptados: cambiosAceptadosPorEntrevistador[nombre] || 0
      }))
      .sort((a, b) => b.entrevistasAsignadas - a.entrevistasAsignadas);

    return NextResponse.json({
      success: true,
      metrics: {
        totalCandidatos,
        candidatosEstatus,
        candidatosNucleo,
        totalEntrevistas,
        totalCambiosSolicitados,
        totalCambiosAceptados,
        rankingCarga
      }
    });

  } catch (error: any) {
    console.error("Error obteniendo métricas:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
