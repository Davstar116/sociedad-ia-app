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

    // 4. Procesamiento de Entrevistas & Entrevistadores (Filtrando Entrevistas REALES)
    let totalEntrevistasReales = 0;
    const entrevistadoresGlobales = new Set<string>();

    const cargaPorEntrevistador: Record<string, number> = {};
    const cambiosAceptadosPorEntrevistador: Record<string, number> = {};
    const cambiosSolicitadosPorEntrevistador: Record<string, number> = {};
    const historialEntrevistadores: Record<string, any[]> = {}; // key: entrevistador_name, value: array de entrevistas

    entrevistas.forEach((e) => {
      const props = e.properties;
      
      const estatusObj = props["Estatus"]?.select?.name || props["Estatus"]?.status?.name || "";
      const isEntrevistaReal = estatusObj.toLowerCase() === "reservado" || estatusObj.toLowerCase() === "completado";
      
      const e1 = props["Entrevistador 1"]?.rich_text?.[0]?.plain_text?.trim();
      const e2 = props["Entrevistador 2"]?.rich_text?.[0]?.plain_text?.trim();
      const eSaliente = props["Entrevistador Saliente"]?.rich_text?.[0]?.plain_text?.trim();
      const solicitaIntercambio = props["Solicita Intercambio"]?.checkbox;
      const alertaCambio = props["Alerta Cambio"]?.rich_text?.[0]?.plain_text?.trim();
      
      const dia = props["Dia"]?.select?.name || "";
      const fechaNum = props["Fecha"]?.number || 0;
      const hora = props["Hora"]?.rich_text?.[0]?.plain_text || "";
      const postulanteName = props["Postulante"]?.rich_text?.[0]?.plain_text || "Candidato Desconocido";

      let fechaIso = null;
      if (fechaNum > 0 && hora) {
        const [horaInicio] = hora.split(" - ");
        fechaIso = `2026-04-${fechaNum.toString().padStart(2, '0')}T${horaInicio}:00`;
      }

      // Registro Global de Nombres (sin importar si el bloque es real o vacío, ellos existen)
      if (e1 && e1 !== "Pendiente" && e1 !== "") entrevistadoresGlobales.add(e1);
      if (e2 && e2 !== "Pendiente" && e2 !== "") entrevistadoresGlobales.add(e2);

      // --- LOGIC SOLO PARA ENTREVISTAS REALES ---
      if (isEntrevistaReal) {
        totalEntrevistasReales++;
        const logData = { estatus: estatusObj, dia, fecha: fechaIso, hora, postulanteName };

        if (e1 && e1 !== "Pendiente") {
          cargaPorEntrevistador[e1] = (cargaPorEntrevistador[e1] || 0) + 1;
          if (!historialEntrevistadores[e1]) historialEntrevistadores[e1] = [];
          historialEntrevistadores[e1].push(logData);
        }
        if (e2 && e2 !== "Pendiente") {
          cargaPorEntrevistador[e2] = (cargaPorEntrevistador[e2] || 0) + 1;
          if (!historialEntrevistadores[e2]) historialEntrevistadores[e2] = [];
          historialEntrevistadores[e2].push(logData);
        }

        // INTERCAMBIOS CÁLCULO ESTRICTO Y BLINDADO
        if (alertaCambio) {
            // Ya fue aceptado, tenemos el registro fijo
            const parts = alertaCambio.split('|');
            if (parts.length >= 2) {
                const requester = parts[0];
                const acceptor = parts[1];
                cambiosSolicitadosPorEntrevistador[requester] = (cambiosSolicitadosPorEntrevistador[requester] || 0) + 1;
                cambiosAceptadosPorEntrevistador[acceptor] = (cambiosAceptadosPorEntrevistador[acceptor] || 0) + 1;
            }
        } else if (solicitaIntercambio && eSaliente && eSaliente !== "") {
            // Todavía está pendiente de aceptar
            cambiosSolicitadosPorEntrevistador[eSaliente] = (cambiosSolicitadosPorEntrevistador[eSaliente] || 0) + 1;
        }
      }
    });

    const totalCambiosSolicitados = Object.values(cambiosSolicitadosPorEntrevistador).reduce((a, b) => a + b, 0);
    const totalCambiosAceptados = Object.values(cambiosAceptadosPorEntrevistador).reduce((a, b) => a + b, 0);

    // Formando el Ranking Completo de Entrevistadores (Iterando sobre el roster Global para incluir incluso a los de cero carga)
    const rankingCarga = Array.from(entrevistadoresGlobales)
      .map((nombre) => ({
        nombre,
        entrevistasAsignadas: cargaPorEntrevistador[nombre] || 0,
        cambiosSolicitados: cambiosSolicitadosPorEntrevistador[nombre] || 0,
        cambiosAceptados: cambiosAceptadosPorEntrevistador[nombre] || 0,
        historial: historialEntrevistadores[nombre] || []
      }))
      .sort((a, b) => b.entrevistasAsignadas - a.entrevistasAsignadas);

    return NextResponse.json({
      success: true,
      metrics: {
        totalCandidatos,
        candidatosEstatus,
        candidatosNucleo,
        totalEntrevistas: totalEntrevistasReales,
        totalCambiosSolicitados,
        totalCambiosAceptados,
        totalEntrevistadores: entrevistadoresGlobales.size,
        rankingCarga
      }
    });

  } catch (error: any) {
    console.error("Error obteniendo métricas:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
