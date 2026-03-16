import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SupportTicketEmailTemplate } from "@/app/components/emails/SupportTicketEmail";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SUPPORT_DB_ID = process.env.NOTION_SUPPORT_DB_ID;
const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { asunto, mensaje, nombre, correo, celular, rol } = data;

    if (!asunto || !mensaje || !correo) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    if (!SUPPORT_DB_ID) {
      throw new Error("No está configurado el ID de la base de datos de Soporte.");
    }

    // 1. Guardar en Notion
    const notionBody = {
      parent: { database_id: SUPPORT_DB_ID },
      properties: {
        "Asunto": { title: [{ text: { content: asunto } }] },
        "Mensaje": { rich_text: [{ text: { content: mensaje } }] },
        "Nombre": { rich_text: [{ text: { content: nombre || "Usuario Desconocido" } }] },
        "Correo": { email: correo },
        "Rol": { rich_text: [{ text: { content: rol || "Sin Rol" } }] }
      }
    };

    // Agregar el celular solo si existe, Notion es estricto con los nulos aquí
    if (celular) {
      // @ts-ignore
      notionBody.properties["Celular"] = { phone_number: celular };
    }

    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify(notionBody),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error("Error guardando ticket en Notion:", errorText);
      throw new Error("No se pudo guardar el reporte en la base de datos.");
    }

    // 2. Enviar Correo a los Administradores
    const baseUrl = request.headers.get("origin") || "https://tu-proyecto.vercel.app";
    const htmlContent = SupportTicketEmailTemplate({
      nombre: nombre || "Usuario Desconocido",
      correo,
      celular: celular || "",
      rol: rol || "Postulante",
      asunto,
      mensaje,
      baseUrl
    });

    await transporter.sendMail({
      from: '"SophIA Soporte" <siafi.reclutamiento@gmail.com>',
      to: "siafi.reclutamiento@gmail.com", // El correo llega a esta misma bandeja para que los admins lo vean
      subject: `🚨 [SOPORTE] ${asunto} - ${nombre}`,
      replyTo: correo, // Si le dan "Responder" al correo, le llegará directo al usuario
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: "Reporte enviado correctamente." });

  } catch (error: any) {
    console.error("🔥 Error en API Soporte:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}