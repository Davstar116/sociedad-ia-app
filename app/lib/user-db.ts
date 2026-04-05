import bcrypt from "bcryptjs";

const USERS_DB_ID = process.env.NOTION_USERS_DB_ID;
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID; // La tabla de Candidatos
const NOTION_TOKEN = process.env.NOTION_TOKEN;

// Configuración de cabeceras para hablar con Notion "a mano"
const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "Admin Maestro" | "Miembro" | "Postulante" | "Administrador";
  passwordHash?: string;
  avatar?: string;
  celular?: string;
  estatus?: string; 
  cargo?: string;
}

// 1. Buscar usuario por Email (Usando FETCH)
export async function getUserByEmail(email: string): Promise<AppUser | null> {
  if (!USERS_DB_ID || !NOTION_TOKEN) return null;

  try {
    // --- BÚSQUEDA 1: Obtener datos de acceso (Tabla Usuarios) ---
    const response = await fetch(`https://api.notion.com/v1/databases/${USERS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: {
          property: "Email",
          title: { equals: email },
        },
      }),
      cache: 'no-store' 
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Error Notion getUserByEmail:", err);
      return null;
    }

    const data = await response.json();
    if (data.results.length === 0) return null;

    const page: any = data.results[0];
    
    // --- BÚSQUEDA 2: Obtener Estatus (Tabla Candidatos_2026) ---
    let estatusPostulante = "Registrado"; 

    if (CANDIDATOS_DB_ID) {
      const candidatoRes = await fetch(`https://api.notion.com/v1/databases/${CANDIDATOS_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders,
        body: JSON.stringify({
          filter: {
            property: "Correo electrónico", 
            email: { equals: email },
          },
        }),
        cache: 'no-store'
      });

      if (candidatoRes.ok) {
        const candidatoData = await candidatoRes.json();
        
        if (candidatoData.results.length > 0) {
          const candidatoPage = candidatoData.results[0];
          const propiedadEstatus = candidatoPage.properties["Estatus del postulante"];
          
          // ✅ BLINDAJE APLICADO: Ahora prioriza buscar en el cajón "status"
          estatusPostulante = propiedadEstatus?.status?.name || 
                              propiedadEstatus?.select?.name || 
                              "Registrado";
        }
      } else {
        console.error("No se pudo conectar a la tabla de Candidatos_2026");
      }
    }
    
    // Extracción segura de datos combinados
    return {
      id: page.id,
      email: page.properties["Email"]?.title?.[0]?.plain_text || "",
      name: page.properties["Nombre"]?.rich_text?.[0]?.plain_text || "Usuario",
      role: page.properties["Rol"]?.select?.name || "Miembro",
      passwordHash: page.properties["Password"]?.rich_text?.[0]?.plain_text || "",
      celular: page.properties["Celular"]?.phone_number || "",
      avatar: page.properties["Avatar"]?.url || 
              page.properties["Avatar"]?.files?.[0]?.file?.url || 
              page.properties["Avatar"]?.files?.[0]?.external?.url || 
              "", 
      estatus: estatusPostulante, 
      cargo: page.properties["Cargo"]?.select?.name || "",
    };
  } catch (error) {
    console.error("Excepción en getUserByEmail:", error);
    return null;
  }
}

// 2. Crear usuario nuevo (Usando FETCH)
export async function createUser(userData: {
  email: string;
  name: string;
  password?: string;
  role?: string;
  avatar?: string;
  provider: "google" | "credentials";
  celular?: string; 
  cargo?: string;
}) {
  if (!USERS_DB_ID || !NOTION_TOKEN) throw new Error("Faltan credenciales DB");

  // Encriptar password si existe
  let passwordHash = "";
  if (userData.password) {
    passwordHash = await bcrypt.hash(userData.password, 10);
  }

  // Rol por defecto
  let initialRole = userData.role || "Miembro";
  if (userData.email === process.env.MASTER_ADMIN_EMAIL) {
    initialRole = "Admin Maestro";
  }

  const properties: any = {
    "Email": { title: [{ text: { content: userData.email } }] },
    "Nombre": { rich_text: [{ text: { content: userData.name } }] },
    "Password": { rich_text: [{ text: { content: passwordHash } }] },
    "Rol": { select: { name: initialRole } },
    "AuthProvider": { select: { name: userData.provider } },
    "Avatar": { url: userData.avatar || null },
    "Celular": { phone_number: userData.celular || null }, 
  };

  if (userData.cargo) {
    properties["Cargo"] = { select: { name: userData.cargo } };
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders,
    body: JSON.stringify({
      parent: { database_id: USERS_DB_ID },
      properties,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error creando usuario en Notion: ${err}`);
  }

  return { email: userData.email, role: initialRole };
}