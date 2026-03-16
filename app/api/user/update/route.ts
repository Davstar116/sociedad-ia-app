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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, nombre, celular, currentPassword, newPassword } = data;

    if (!email) {
      return NextResponse.json({ error: "No se proporcionó un correo válido." }, { status: 400 });
    }

    // 1. Buscamos al usuario en la BD
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    let updatedPasswordHash = user.passwordHash;
    let passwordChanged = false;

    // 2. Validación y Cambio de Contraseña
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Debes proporcionar tu contraseña actual." }, { status: 400 });
      }

      // Comparamos la contraseña actual con la encriptada en Notion
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 401 });
      }

      // Encriptamos la nueva
      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
      passwordChanged = true;
    }

    // 3. Preparamos los datos con los nombres EXACTOS de tus columnas
    const updateProperties: any = {
      "Nombre": { title: [{ text: { content: nombre } }] }
    };

    // Solo agregamos el celular si se envió un valor (para evitar borrarlo por accidente)
    if (celular !== undefined) {
      updateProperties["Celular"] = { phone_number: celular || "" };
    }

    // Actualizamos el password solo si hubo un cambio exitoso
    if (passwordChanged) {
      updateProperties["Password"] = { rich_text: [{ text: { content: updatedPasswordHash } }] };
    }

    // 4. Mandamos el parche (PATCH) a la página del usuario en Notion
    const notionResponse = await fetch(`https://api.notion.com/v1/pages/${user.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: updateProperties }),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      throw new Error(`Error Notion API: ${errorText}`);
    }

    // 5. Enviar el Correo de Alerta (Solo si cambió la contraseña)
    if (passwordChanged) {
      const baseUrl = request.headers.get("origin") || "https://tu-proyecto.vercel.app";
      const htmlContent = PasswordUpdateEmailTemplate({
        nombre: nombre,
        baseUrl: baseUrl,
        newPassword: newPassword, // Mandamos la contraseña en texto plano al correo
        emailUsuario: email
      });

      try {
        await transporter.sendMail({
          from: '"Seguridad SIAFI" <siafi.reclutamiento@gmail.com>',
          to: email,
          subject: "Alerta de Seguridad: Tus credenciales han sido actualizadas",
          html: htmlContent,
        });
        console.log("✅ Correo de seguridad enviado a", email);
      } catch (mailError) {
        console.error("⚠️ Error enviando correo de seguridad:", mailError);
      }
    }

    return NextResponse.json({ success: true, message: "Datos actualizados correctamente" });

  } catch (error: any) {
    console.error("🔥 Error en API Update User:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}