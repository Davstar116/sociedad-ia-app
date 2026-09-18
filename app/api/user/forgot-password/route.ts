import { NextResponse } from "next/server";
import { getUserByEmail } from "@/app/lib/user-db";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { ForgotPasswordEmailTemplate } from "@/app/components/emails/ForgotPasswordEmail";

const NOTION_TOKEN = process.env.NOTION_TOKEN;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: "No hay cuenta asociada a este correo." }, { status: 404 });

    // Generar contraseña temporal de 8 caracteres
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let tempPass = "";
    for (let i = 0; i < 8; i++) tempPass += chars.charAt(Math.floor(Math.random() * chars.length));

    const updatedPasswordHash = await bcrypt.hash(tempPass, 10);

    const notionResponse = await fetch(`https://api.notion.com/v1/pages/${user.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { "Password": { rich_text: [{ text: { content: updatedPasswordHash } }] } }
      }),
    });

    if (!notionResponse.ok) throw new Error("Error guardando en Notion");

    const baseUrl = request.headers.get("origin") || "https://tu-proyecto.vercel.app";
    const htmlContent = ForgotPasswordEmailTemplate({ nombre: user.name, baseUrl, tempPassword: tempPass });

    await transporter.sendMail({
      from: `"Soporte SIAFI" <${process.env.EMAIL_USER || "siafi.unam.reclutamiento@gmail.com"}>`,
      to: email,
      subject: "Recuperación de Contraseña - SIAFI",
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}