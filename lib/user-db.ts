import { Client } from "@notionhq/client";
import bcrypt from "bcryptjs";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID;

// Interfaz de Usuario Interno
export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "Admin Maestro" | "Miembro" | "Postulante";
  passwordHash?: string;
  avatar?: string;
}

// 1. Buscar usuario por Email
export async function getUserByEmail(email: string): Promise<AppUser | null> {
  if (!USERS_DB_ID) return null;

  const response = await notion.databases.query({
    database_id: USERS_DB_ID,
    filter: {
      property: "Email",
      title: { equals: email },
    },
  });

  if (response.results.length === 0) return null;

  const page: any = response.results[0];
  return {
    id: page.id,
    email: page.properties.Email.title[0]?.plain_text,
    name: page.properties.Nombre.rich_text[0]?.plain_text || "Usuario",
    role: page.properties.Rol.select?.name || "Miembro",
    passwordHash: page.properties.Password.rich_text[0]?.plain_text, // Hash encriptado
    avatar: page.properties.Avatar.url,
  };
}

// 2. Crear usuario nuevo (Google o Registro Manual)
export async function createUser(userData: {
  email: string;
  name: string;
  password?: string; // Opcional si es Google
  role?: string;
  avatar?: string;
  provider: "google" | "credentials";
}) {
  if (!USERS_DB_ID) throw new Error("Falta DB ID");

  // Si hay contraseña, la encriptamos antes de guardar
  let passwordHash = "";
  if (userData.password) {
    passwordHash = await bcrypt.hash(userData.password, 10);
  }

  // Definir rol inicial (Si es el correo maestro, forzamos Admin)
  let initialRole = userData.role || "Miembro";
  if (userData.email === process.env.MASTER_ADMIN_EMAIL) {
    initialRole = "Admin Maestro";
  }

  await notion.pages.create({
    parent: { database_id: USERS_DB_ID },
    properties: {
      "Email": { title: [{ text: { content: userData.email } }] },
      "Nombre": { rich_text: [{ text: { content: userData.name } }] },
      "Password": { rich_text: [{ text: { content: passwordHash } }] },
      "Rol": { select: { name: initialRole } },
      "AuthProvider": { select: { name: userData.provider } },
      "Avatar": { url: userData.avatar || "" },
    },
  });
  
  return { email: userData.email, role: initialRole };
}