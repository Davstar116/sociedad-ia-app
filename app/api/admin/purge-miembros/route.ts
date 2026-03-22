import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { PurgeEmailTemplate } from "../../../components/emails/PurgeEmail";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID; 

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const baseUrl = request.headers.get("origin") || "https://siafi-unam-app.vercel.app";

    // 1. Buscar todas las cuentas con Rol "Miembro"
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${USERS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        filter: {
          property: "Rol",
          select: { equals: "Miembro" },
        },
      }),
    });

    if (!queryRes.ok) {
      const err = await queryRes.text();
      console.error("Error consultando Notion:", err);
      return NextResponse.json({ error: "Error consultando la base de datos" }, { status: 500 });
    }

    const queryData = await queryRes.json();
    const miembros = queryData.results;

    if (!miembros || miembros.length === 0) {
      return NextResponse.json({ message: "No se encontraron cuentas de tipo Miembro para purgar.", count: 0 });
    }

    let eliminadosCount = 0;

    // 2. Iterar sobre cada miembro, enviar correo y eliminar
    for (const page of miembros) {
      const email = page.properties["Email"]?.title[0]?.plain_text || page.properties["Email"]?.email;
      const nombreCompleto = page.properties["Nombre"]?.rich_text[0]?.plain_text || "Postulante";

      if (email) {
        // ✅ AQUI: Llamamos a la plantilla limpia e inyectamos los datos
        const htmlCorreo = PurgeEmailTemplate({
            nombre: nombreCompleto,
            baseUrl: baseUrl
        });

        try {
          await transporter.sendMail({
            from: '"Soporte SIAFI" <siafi.reclutamiento@gmail.com>',
            to: email,
            subject: "⚠️ Error en tu registro de SIAFI - Acción Requerida",
            html: htmlCorreo,
          });

          await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
            method: "PATCH",
            headers: notionHeaders,
            body: JSON.stringify({ archived: true }),
          });

          eliminadosCount++;
        } catch (err) {
          console.error(`Error procesando al usuario ${email}:`, err);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se enviaron correos y se eliminaron ${eliminadosCount} cuenta(s) exitosamente.`,
      count: eliminadosCount
    });

  } catch (error: any) {
    console.error("Error en purga:", error);
    return NextResponse.json({ error: "Fallo interno en el servidor." }, { status: 500 });
  }
}