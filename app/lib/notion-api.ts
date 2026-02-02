const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID; // Candidatos
const NOTION_USERS_DB_ID = process.env.NOTION_USERS_DB_ID; // Usuarios
const NOTION_INTERVIEWS_DB_ID = process.env.NOTION_INTERVIEWS_DB_ID; // ✅ NUEVA: Entrevistas

// Headers comunes para reutilizar
const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// --- FUNCIÓN ORIGINAL (SIN CAMBIOS) ---
export async function getCandidateStatus(email: string) {
  try {
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

// --- ✅ NUEVAS FUNCIONES AGREGADAS ---

// 1. VERIFICAR SI HAY BLOQUES GENERADOS (Para saber en qué fase estamos)
export async function checkSystemState() {
  if (!NOTION_INTERVIEWS_DB_ID) return { hasBlocks: false };
  
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_INTERVIEWS_DB_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ page_size: 1 }), // Solo necesitamos saber si hay al menos 1
      next: { revalidate: 0 } // Sin caché para saber el estado real
    });
    
    if (!response.ok) return { hasBlocks: false };

    const data = await response.json();
    return { hasBlocks: data.results.length > 0 };

  } catch (error) {
    console.error("Error checking system state:", error);
    return { hasBlocks: false };
  }
}

// 2. OBTENER ENTREVISTAS ASIGNADAS (Para el Entrevistador)
export async function getInterviewerAgenda(email: string, name: string) {
  if (!NOTION_INTERVIEWS_DB_ID) return [];

  try {
    // Buscamos donde el nombre del entrevistador esté en la columna "Entrevistadores"
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_INTERVIEWS_DB_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: {
          property: "Entrevistadores",
          rich_text: { contains: name } // Busca coincidencia de texto en los nombres
        },
        sorts: [{ property: "Fecha Inicio", direction: "ascending" }]
      }),
      next: { revalidate: 0 } // Sin caché para ver actualizaciones en tiempo real
    });

    if (!response.ok) return [];

    const data = await response.json();
    
    return data.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: props["ID Sesion"]?.title?.[0]?.plain_text || "Entrevista",
        date: props["Fecha Inicio"]?.date?.start || "",
        candidate: props["Candidato Email"]?.email || "Pendiente",
        status: props["Estatus"]?.select?.name || "Disponible"
      };
    });

  } catch (error) {
    console.error("Error fetching agenda:", error);
    return [];
  }
}