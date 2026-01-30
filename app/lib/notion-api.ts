const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID;

export async function getCandidateStatus(email: string) {
  try {
    // Usamos FETCH nativo para evitar errores de librería en Vercel
    const response = await fetch(`https://api.notion.com/v1/databases/${CANDIDATOS_DB_ID}/query`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: "Correo electrónico",
          email: {
            equals: email
          }
        }
      }),
      next: { revalidate: 60 } // Cache de 60 segundos
    });

    if (!response.ok) {
      console.error("Notion API Error:", response.status, await response.text());
      return "Desconocido";
    }

    const data = await response.json();
    
    if (data.results.length === 0) return "No Encontrado";

    // Extraemos el valor del estado
    const page = data.results[0];
    const statusName = page.properties["Estatus del postulante"]?.status?.name || "Registrado";

    return statusName;

  } catch (error) {
    console.error("Error fetching status:", error);
    return "Error";
  }
}