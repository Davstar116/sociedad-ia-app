import { NextResponse } from "next/server";
import { getUserByEmail } from "@/app/lib/user-db";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { PasswordUpdateEmailTemplate } from "@/app/components/emails/PasswordUpdateEmail";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
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

// ✅ NUEVO: Método GET para obtener los datos frescos del perfil
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json({
    nombre: user.name,
    celular: user.celular || "",
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, nombre, celular, currentPassword, newPassword } = data;

    if (!email) return NextResponse.json({ error: "No se proporcionó un correo." }, { status: 400 });

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

    let updatedPasswordHash = user.passwordHash;
    let passwordChanged = false;

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: "Debes proporcionar tu contraseña actual." }, { status: 400 });
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 401 });

      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
      passwordChanged = true;
    }

    // ✅ SOLUCIÓN AL ERROR DE NOTION
    const updateProperties: any = {
      "Nombre": { rich_text: [{ text: { content: nombre || "" } }] }
    };

    if (celular !== undefined) {
      // Si el celular está vacío, Notion exige que sea 'null', no '""'
      updateProperties["Celular"] = { phone_number: celular ? celular : null };
    }

    if (passwordChanged) {
      updateProperties["Password"] = { rich_text: [{ text: { content: updatedPasswordHash } }] };
    }

    const notionResponse = await fetch(`https://api.notion.com/v1/pages/${user.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: updateProperties }),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      throw new Error(`Error Notion API: ${errorText}`);
    }

    if (passwordChanged) {
      const baseUrl = request.headers.get("origin") || "https://tu-proyecto.vercel.app";
      const htmlContent = PasswordUpdateEmailTemplate({
        nombre: nombre,
        baseUrl: baseUrl,
        newPassword: newPassword,
        emailUsuario: email
      });

      try {
        await transporter.sendMail({
          from: '"Seguridad SIAFI" <siafi.reclutamiento@gmail.com>',
          to: email,
          subject: "Alerta de Seguridad: Tus credenciales han sido actualizadas",
          html: htmlContent,
        });
      } catch (mailError) {
        console.error("⚠️ Error enviando correo:", mailError);
      }
    }

    return NextResponse.json({ success: true, message: "Datos actualizados correctamente" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}