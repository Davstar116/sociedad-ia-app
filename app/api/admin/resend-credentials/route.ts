import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { ApologyCredentialsEmailTemplate } from "@/app/components/emails/ApologyCredentialsEmail";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const CANDIDATOS_DB_ID = process.env.NOTION_DATABASE_ID; // Base principal de Candidatos
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function POST(req: Request) {
  try {
    const baseUrl = req.headers.get("origin") || "https://siafi-unam-app.vercel.app";

    // 1. Obtener candidatos con estatus "Registrado" de la DB de Candidatos
    const candidatosRes = await fetch(`https://api.notion.com/v1/databases/${CANDIDATOS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: {
          property: "Estatus del postulante",
          status: { equals: "Registrado" } 
        }
      }),
      cache: 'no-store'
    });

    if (!candidatosRes.ok) throw new Error("No se pudo conectar a la base de datos de Candidatos.");
    const candidatosData = await candidatosRes.json();

    if (!candidatosData.results || candidatosData.results.length === 0) {
      return NextResponse.json({ success: true, message: "No hay ningún candidato en estatus 'Registrado'." });
    }

    let enviados = 0;

    // 2. Iterar sobre todos los encontrados
    for (const page of candidatosData.results) {
        const correo = page.properties["Correo electrónico"]?.email;
        const nombreCompleto = page.properties["Nombre Completo"]?.title?.[0]?.plain_text || "Postulante";

        if (!correo) continue;

        // 3. Buscar a este usuario en la DB de USERS
        const userRes = await fetch(`https://api.notion.com/v1/databases/${USERS_DB_ID}/query`, {
            method: "POST",
            headers: notionHeaders,
            body: JSON.stringify({
              filter: {
                property: "Email",
                title: { equals: correo }
              }
            }),
            cache: 'no-store'
        });

        if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.results && userData.results.length > 0) {
                const userId = userData.results[0].id;
                
                // 4. Generar nueva contraseña y hashear
                const nuevaPassword = generatePassword();
                const hash = await bcrypt.hash(nuevaPassword, 10);

                // 5. Actualizar la contraseña en Notion USERS
                await fetch(`https://api.notion.com/v1/pages/${userId}`, {
                    method: "PATCH",
                    headers: notionHeaders,
                    body: JSON.stringify({
                        properties: {
                           "Password": { rich_text: [{ text: { content: hash } }] }
                        }
                    })
                });

                // 6. Enviar correo de disculpas con la nueva clave
                const htmlEmail = ApologyCredentialsEmailTemplate({
                    nombre: nombreCompleto,
                    baseUrl: baseUrl,
                    passwordGenerada: nuevaPassword,
                    emailUsuario: correo
                });

                await transporter.sendMail({
                    from: '"Reclutamiento SIAFI" <siafi.reclutamiento@gmail.com>',
                    to: correo,
                    subject: "AVISO IMPORTANTE - Nuevas Credenciales de Acceso SIAFI",
                    html: htmlEmail, 
                });

                enviados++;
            }
        }
    }

    return NextResponse.json({ success: true, message: `Se generaron accesos y se enviaron correos a ${enviados} postulantes.` });

  } catch (error: any) {
    console.error("Error al reenviar credenciales:", error);
    return NextResponse.json({ success: false, error: "Error en el servidor re-enviando correos." }, { status: 500 });
  }
}
