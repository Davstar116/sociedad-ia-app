const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID; // Candidatos
const NOTION_USERS_DB_ID = process.env.NOTION_USERS_DB_ID; // Usuarios
const NOTION_INTERVIEWS_DB_ID = process.env.NOTION_INTERVIEWS_DB_ID; // ✅ Entrevistas

// Headers comunes para reutilizar
const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

// --- FUNCIÓN 1: OBTENER ESTATUS GENERAL (SIN CAMBIOS) ---
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

// --- FUNCIÓN 2: VERIFICAR ESTADO DEL SISTEMA (SIN CAMBIOS) ---
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

// --- FUNCIÓN 3: OBTENER AGENDA ENTREVISTADOR + DETALLES CANDIDATO (✅ ACTUALIZADA) ---
export async function getInterviewerAgenda(email: string, name: string) {
  if (!NOTION_INTERVIEWS_DB_ID) return [];

  try {
    // A. Buscamos las entrevistas donde aparece el nombre del entrevistador
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_INTERVIEWS_DB_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: {
          property: "Entrevistadores",
          rich_text: { contains: name }
        },
        sorts: [{ property: "Fecha Inicio", direction: "ascending" }]
      }),
      next: { revalidate: 0 }
    });

    if (!response.ok) return [];
    const interviewsData = await response.json();

    // B. Por cada entrevista encontrada, buscamos los datos REALES del candidato en la otra DB
    // Usamos Promise.all para hacer las búsquedas en paralelo
    const fullAgenda = await Promise.all(interviewsData.results.map(async (page: any) => {
        const props = page.properties;
        const candidateEmail = props["Candidato Email"]?.email;
        let candidateDetails = null;

        // Si hay un email de candidato, vamos a buscar su expediente completo
        if (candidateEmail && NOTION_DATABASE_ID) {
            try {
                const candRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        filter: { property: "Correo electrónico", email: { equals: candidateEmail } }
                    }),
                    next: { revalidate: 0 }
                });
                
                const candData = await candRes.json();
                
                if (candData.results.length > 0) {
                    const cProps = candData.results[0].properties;
                    
                    // Extraemos los datos del expediente (Ajusta nombres de propiedades según tu Notion)
                    candidateDetails = {
                        name: cProps["Nombre"]?.title?.[0]?.plain_text || "Sin Nombre",
                        // Mapeamos los núcleos (multi-select)
                        nucelos: cProps["Nucleo"]?.multi_select?.map((n: any) => n.name) || [],
                        // Buscamos CV (puede ser archivo subido o link externo)
                        cvUrl: cProps["CV"]?.files?.[0]?.file?.url || cProps["CV"]?.files?.[0]?.external?.url || null,
                        // Score y Notas
                        sophiaScore: cProps["SophIA Score"]?.number || 0,
                        sophiaNotes: cProps["SophIA Notas"]?.rich_text?.[0]?.plain_text || "Sin notas de IA disponibles.",
                        humanNotes: cProps["Notas Revisión"]?.rich_text?.[0]?.plain_text || "Sin notas de revisión previas."
                    };
                }
            } catch (err) {
                console.error(`Error fetching details for ${candidateEmail}`, err);
            }
        }

        // Devolvemos el objeto combinado
        return {
            id: page.id,
            title: props["ID Sesion"]?.title?.[0]?.plain_text || "Entrevista",
            date: props["Fecha Inicio"]?.date?.start || "",
            status: props["Estatus"]?.select?.name || "Disponible",
            candidateEmail: candidateEmail || null,
            candidate: candidateDetails // Aquí va el expediente completo o null
        };
    }));

    return fullAgenda;

  } catch (error) {
    console.error("Error fetching agenda:", error);
    return [];
  }
}