import { NextResponse } from "next/server";
import { getUserByEmail } from "@/app/lib/user-db";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { PasswordUpdateEmailTemplate } from "@/app/components/emails/PasswordUpdateEmail";
import { put } from "@vercel/blob"; 

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json({
    nombre: user.name,
    celular: user.celular || "",
    avatar: user.avatar || "", 
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const nombre = formData.get("nombre") as string;
    const celular = formData.get("celular") as string;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const avatarFile = formData.get("avatar") as File | null; 

    if (!email) return NextResponse.json({ error: "No se proporcionó un correo." }, { status: 400 });

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

    let updatedPasswordHash = user.passwordHash;
    let passwordChanged = false;
    let finalAvatarUrl = user.avatar; 

    // 1. Validar Contraseñas
    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: "Debes proporcionar tu contraseña actual." }, { status: 400 });
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 401 });

      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
      passwordChanged = true;
    }

    // 2. ✅ SUBIR FOTO A VERCEL BLOB (Con sufijo aleatorio)
    if (avatarFile && avatarFile.size > 0) {
      const blob = await put(avatarFile.name, avatarFile, { 
        access: 'public',
        addRandomSuffix: true // ✅ SOLUCIÓN AL ERROR DE VERCEL
      });
      finalAvatarUrl = blob.url;
    }

    // 3. Preparar propiedades para Notion
    const updateProperties: any = {
      "Nombre": { rich_text: [{ text: { content: nombre || "" } }] }
    };

    if (celular !== null && celular !== undefined) {
      updateProperties["Celular"] = { phone_number: celular ? celular : null };
    }

    // Actualizamos la URL del Avatar en Notion
    if (finalAvatarUrl) {
      updateProperties["Avatar"] = { url: finalAvatarUrl };
    }

    if (passwordChanged) {
      updateProperties["Password"] = { rich_text: [{ text: { content: updatedPasswordHash } }] };
    }

    // 4. Parche a Notion
    const notionResponse = await fetch(`https://api.notion.com/v1/pages/${user.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: updateProperties }),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      throw new Error(`Error Notion API: ${errorText}`);
    }

    // 5. Correo (si cambió contraseña)
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

    return NextResponse.json({ success: true, message: "Datos actualizados correctamente", newAvatar: finalAvatarUrl });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}