const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID; // Base actual de Candidatos
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID; // ¡NUEVA! Agrega esto a tu .env.local

export async function getCandidateStatus(email: string) {
  try {
    const headers = {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    // 1. BUSCAR EN BASE DE DATOS DE USUARIOS (SIAFI Usuarios)
    // Para obtener ROL y CHECKBOX DE ENTREVISTADOR
    let role = "Postulante"; // Default
    let isInterviewer = false;

    if (USERS_DB_ID) {
      const userRes = await fetch(`https://api.notion.com/v1/databases/${USERS_DB_ID}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: {
            property: "Correo electrónico", // Ajusta si tu propiedad se llama "Email"
            email: { equals: email }
          }
        }),
        next: { revalidate: 10 }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.results.length > 0) {
          const props = userData.results[0].properties;
          // Asumimos que la propiedad se llama "Rol" y es un Select
          role = props["Rol"]?.select?.name || "Postulante"; 
          // Asumimos que la propiedad se llama "Entrevistador" y es Checkbox
          isInterviewer = props["Entrevistador"]?.checkbox || false;
        }
      }
    }

    // 2. BUSCAR EN BASE DE DATOS DE CANDIDATOS (Candidatos_2026)
    // Para obtener el ESTATUS (Solo si es necesario o siempre para tener el dato)
    let statusName = "Registrado";

    const candidateRes = await fetch(`https://api.notion.com/v1/databases/${CANDIDATOS_DB_ID}/query`, {
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

    // Retornamos todo el objeto combinado
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