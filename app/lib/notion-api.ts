const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID; // Candidatos
const NOTION_USERS_DB_ID = process.env.NOTION_USERS_DB_ID; // Usuarios

export async function getCandidateStatus(email: string) {
  try {
    const headers = {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    // 1. BUSCAR EN USUARIOS
    let role = "Postulante"; 
    let isInterviewer = false;

    if (NOTION_USERS_DB_ID) {
      const userRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_USERS_DB_ID}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: {
            property: "Email",
            email: { equals: email }
          }
        }),
        next: { revalidate: 10 }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.results.length > 0) {
          const props = userData.results[0].properties;
          role = props["Rol"]?.select?.name || props["Rol"]?.rich_text?.[0]?.plain_text || "Postulante"; 
          isInterviewer = props["Entrevistador"]?.checkbox || false;
        }
      }
    }

    // 2. BUSCAR EN CANDIDATOS
    let statusName = "Registrado";

    const candidateRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: {
          property: "Correo electrónico",
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