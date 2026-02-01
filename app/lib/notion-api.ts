const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID; // Candidatos
const NOTION_USERS_DB_ID = process.env.NOTION_USERS_DB_ID; // Usuarios

export async function getCandidateStatus(email: string) {
  console.log("🔍 [DEBUG] Iniciando consulta para:", email);
  console.log("🔍 [DEBUG] ID Base Usuarios:", NOTION_USERS_DB_ID ? "DEFINIDO" : "UNDEFINED ❌");

  try {
    const headers = {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };

    // 1. BUSQUEDA EN USUARIOS
    let role = "Postulante"; 
    let isInterviewer = false;
    let debugUserError = null;

    if (NOTION_USERS_DB_ID) {
      console.log("🔍 [DEBUG] Consultando Base de Usuarios...");
      const userRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_USERS_DB_ID}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: {
            property: "Email", // Asegúrate que sea "Email" en Notion
            email: { equals: email }
          }
        }),
        next: { revalidate: 0 } // SIN CACHÉ PARA DEBUG
      });

      if (!userRes.ok) {
        const errText = await userRes.text();
        console.error("❌ [ERROR API NOTION USUARIOS]:", userRes.status, errText);
        debugUserError = `API Error: ${userRes.status}`;
      } else {
        const userData = await userRes.json();
        console.log("✅ [DEBUG] Resultados Usuarios encontrados:", userData.results.length);
        
        if (userData.results.length > 0) {
          const props = userData.results[0].properties;
          
          // IMPRIMIR LAS PROPIEDADES REALES PARA VER CÓMO SE LLAMAN
          console.log("✅ [DEBUG] Propiedades de la fila:", JSON.stringify(Object.keys(props)));
          
          // INTENTO DE LEER ROL
          if (props["Rol"]) {
             console.log("✅ [DEBUG] Propiedad 'Rol' encontrada. Tipo:", props["Rol"].type);
             // Soporte para Select o RichText por si acaso
             role = props["Rol"]?.select?.name || props["Rol"]?.rich_text?.[0]?.plain_text || "Postulante"; 
          } else {
             console.error("❌ [ERROR] No existe la propiedad 'Rol' en la base de datos.");
          }

          // INTENTO DE LEER ENTREVISTADOR
          if (props["Entrevistador"]) {
             isInterviewer = props["Entrevistador"]?.checkbox || false;
          } else {
             console.error("❌ [ERROR] No existe la propiedad 'Entrevistador'.");
          }
          
          console.log(`✅ [DEBUG] Datos Finales -> Rol: ${role}, Entrevistador: ${isInterviewer}`);
        } else {
          console.warn("⚠️ [DEBUG] Usuario no encontrado en DB Usuarios. Revise el email exacto.");
        }
      }
    } else {
      console.error("❌ [ERROR] NOTION_USERS_DB_ID no está definido en las variables de entorno.");
    }

    // 2. BUSQUEDA EN CANDIDATOS (Esto suele funcionar bien)
    let statusName = "Registrado";
    // ... (Tu código de candidatos original, lo omito para ahorrar espacio, déjalo igual o cópialo de tu versión anterior) ...
    // Si quieres copiarlo rápido, aquí está la versión compacta:
     const candidateRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter: { property: "Correo electrónico", email: { equals: email } } }),
      next: { revalidate: 10 }
    });
    if (candidateRes.ok) {
        const cData = await candidateRes.json();
        if(cData.results.length > 0) statusName = cData.results[0].properties["Estatus del postulante"]?.status?.name || "Registrado";
    }

    return {
      status: statusName,
      role: role,
      isInterviewer: isInterviewer,
      _debug: debugUserError // Pasamos el error al front
    };

  } catch (error) {
    console.error("❌ [CRITICAL ERROR]:", error);
    return { status: "Error", role: "Postulante", isInterviewer: false };
  }
}