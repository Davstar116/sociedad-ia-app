import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID; // Asegúrate de tener esto en tu .env

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
      // Extraer email y nombre (ajusta las propiedades si en tu Notion se llaman distinto)
      const email = page.properties["Email"]?.title[0]?.plain_text || page.properties["Email"]?.email;
      const nombre = page.properties["Nombre"]?.rich_text[0]?.plain_text || "Postulante";

      if (email) {
        // --- PLANTILLA DEL CORREO ---
        const htmlCorreo = `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; background-color: #111111; color: #ffffff; padding: 30px; border-radius: 10px; border: 1px solid #333;">
            <h2 style="color: #ff4444; text-align: center;">Aviso Importante sobre tu registro en SIAFI</h2>
            <p style="color: #dddddd; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
            <p style="color: #dddddd; font-size: 16px; line-height: 1.5;">
              Nos comunicamos contigo porque hemos detectado que creaste una cuenta estándar en la plataforma de SophIA en lugar de llenar el formulario oficial de postulación para el Reclutamiento 2026-2.
            </p>
            <p style="color: #dddddd; font-size: 16px; line-height: 1.5;">
              Para evitar conflictos técnicos en nuestro sistema y asegurar que tu perfil sea evaluado correctamente, <strong>la cuenta que creaste ha sido eliminada.</strong>
            </p>
            <p style="color: #dddddd; font-size: 16px; line-height: 1.5;">
              Por favor, realiza tu registro de forma correcta ingresando al siguiente enlace y completando las preguntas de evaluación:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://siafi-unam-app.vercel.app/postulacion" style="background-color: #0051ff; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Ir al Formulario de Postulación</a>
            </div>
            <p style="color: #dddddd; font-size: 16px; line-height: 1.5;">
              Una vez que llenes tu registro correctamente, el sistema creará automáticamente una cuenta para ti y recibirás un nuevo correo con tus credenciales de acceso.
            </p>
            <hr style="border-color: #333; margin: 30px 0;" />
            <p style="color: #888888; font-size: 12px; text-align: center;">
              Si tienes dudas, responde a este correo (siafi.reclutamiento@gmail.com).<br>
              <strong>SophIA by SIAFI - Facultad de Ingeniería, UNAM</strong>
            </p>
          </div>
        `;

        try {
          // Enviar el correo
          await transporter.sendMail({
            from: '"Soporte SIAFI" <siafi.reclutamiento@gmail.com>',
            to: email,
            subject: "⚠️ Error en tu registro de SIAFI - Acción Requerida",
            html: htmlCorreo,
          });

          // Eliminar de Notion (Archivar)
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