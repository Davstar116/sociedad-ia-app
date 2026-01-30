// lib/notion.ts
import { Client } from "@notionhq/client";

const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!notionToken || !databaseId) {
  throw new Error("❌ Faltan las credenciales de Notion en .env.local");
}

export const notion = new Client({
  auth: notionToken,
});

export const DATABASE_ID = databaseId;

export async function verificarConexion() {
  try {
    const response = await notion.databases.retrieve({ database_id: DATABASE_ID });
    console.log("✅ Conexión Exitosa con la Base de Datos:", response.title[0]?.plain_text);
    return true;
  } catch (error) {
    console.error("❌ Error conectando a Notion:", error);
    return false;
  }
}