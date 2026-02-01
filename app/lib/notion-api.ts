const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID; // Base Candidatos
const NOTION_USERS_DB_ID = process.env.NOTION_USERS_DB_ID; // Base Usuarios

export async function getCandidateStatus(email: string) {
  try {
    const headers = {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    // 1. BUSCAR EN BASE DE DATOS DE USUARIOS (SIAFI Usuarios)
    let role = "Postulante"; 
    let isInterviewer = false;

    if (NOTION_USERS_DB_ID) {
      const userRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_USERS_DB_ID}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: {
            property: "Email", // ✅ CORREGIDO: Ahora busca en la columna "Email"
            email: { equals: email }
          }
        }),
        next: { revalidate: 10 }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.results.length > 0) {
          const props = userData.results[0].properties;
          role = props["Rol"]?.select?.name || "Postulante"; 
          isInterviewer = props["Entrevistador"]?.checkbox || false;
        }
      }
    }

    // 2. BUSCAR EN BASE DE DATOS DE CANDIDATOS (Candidatos_2026)
    // (Esta parte sigue buscando "Correo electrónico" si así se llama en la base de Candidatos)
    let statusName = "Registrado";

    const candidateRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: {
          property: "Correo electrónico", // En Candidatos lo dejamos igual (si funciona)
          email: { equals: email }
        }
      }),
      next: { revalidate: 10 }
    });

    if (candidateRes.ok) {
      const candidateData = await candidateRes.json();
      if (candidateData.results.length > 0) {
        const props = candidateData.results[0].properties;
        statusName = props["Estatus del postulante"]?.status?.name || "Registrado";
      }
    }

    return {
      status: statusName,
      role: role,
      isInterviewer: isInterviewer
    };

  } catch (error) {
    console.error("Error fetching data:", error);
    return { status: "Error", role: "Postulante", isInterviewer: false };
  }
}