import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/app/lib/user-db";

const NOTION_TOKEN = process.env.NOTION_TOKEN;

const directivos = [
  { email: "joserc17@ciencias.unam.mx", name: "José", rol: "Administrador", cargo: "Capacitación" },
  { email: "jazagg11@gmail.com", name: "Jazmín", rol: "Administrador", cargo: "Difusión" },
  { email: "jazmin.ramirez.fi@gmail.com", name: "Jazmin", rol: "Administrador", cargo: "Proyectos" },
  { email: "luuuis.castroo@gmail.com", name: "Luis", rol: "Administrador", cargo: "Proyectos" },
  { email: "jafet.fernandez040404@gmail.com", name: "Jafet", rol: "Administrador", cargo: "Vicepresidente" },
  { email: "astridmondragon25@gmail.com", name: "Astrid", rol: "Admin Maestro", cargo: "Organización" }
];

export async function POST(request: Request) {
  if (!NOTION_TOKEN) return NextResponse.json({ success: false, error: "Missing token" }, { status: 500 });
  
  const resultados = [];
  
  for (const dir of directivos) {
    try {
      const user = await getUserByEmail(dir.email);
      let updated = false;
      let created = false;
      
      if (!user) {
        // Create user
        await createUser({
           email: dir.email,
           name: dir.name,
           password: "LiderSiafi2026!", // Temporal password for created accounts
           role: dir.rol,
           cargo: dir.cargo,
           provider: "credentials"
        });
        created = true;
      } else {
        // Verify if we need to update Rol or Cargo
        if (user.role !== dir.rol || user.cargo !== dir.cargo) {
           const propertiesToUpdate: any = {};
           if (user.role !== dir.rol) propertiesToUpdate["Rol"] = { select: { name: dir.rol } };
           if (user.cargo !== dir.cargo) propertiesToUpdate["Cargo"] = { select: { name: dir.cargo } };
           
           const res = await fetch(`https://api.notion.com/v1/pages/${user.id}`, {
              method: "PATCH",
              headers: {
                 "Authorization": `Bearer ${NOTION_TOKEN}`,
                 "Notion-Version": "2022-06-28",
                 "Content-Type": "application/json"
              },
              body: JSON.stringify({ properties: propertiesToUpdate })
           });
           
           if (!res.ok) {
              const err = await res.text();
              console.error("Update Notion User Error:", err);
           } else {
              updated = true;
           }
        }
      }
      
      resultados.push({ email: dir.email, created, updated });
    } catch (err: any) {
      console.error(`Error setup directivo ${dir.email}:`, err);
      resultados.push({ email: dir.email, error: err.message });
    }
  }

  return NextResponse.json({ success: true, resultados });
}
