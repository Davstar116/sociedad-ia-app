import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { Resend } from 'resend';
import { WelcomeEmail } from '@/app/components/emails/WelcomeEmail';
import { createUser, getUserByEmail } from "../../lib/user-db"; // Importamos nuestra utilidad de usuarios

// Función auxiliar para generar contraseña aleatoria
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const resend = new Resend(process.env.RESEND_API_KEY);
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. Validar si ya existe el usuario
    const existingUser = await getUserByEmail(data.email);
    
    // Generamos contraseña nueva solo si no existe
    // Si ya existe, NO le cambiamos la contraseña (para no bloquearlo), 
    // pero en el correo le diremos "Usa tu contraseña actual".
    let passwordParaCorreo = "Ya tienes cuenta asignada";
    let usuarioCreado = false;

    if (!existingUser) {
      const newPassword = generatePassword();
      await createUser({
        email: data.email,
        name: `${data.nombre} ${data.apellidos}`,
        password: newPassword,
        role: "Postulante",
        provider: "credentials"
      });
      passwordParaCorreo = newPassword;
      usuarioCreado = true;
      console.log(`✅ Usuario creado para ${data.email}`);
    } else {
      console.log(`⚠️ El usuario ${data.email} ya existía. No se crea cuenta nueva.`);
      passwordParaCorreo = "(Usa tu contraseña anterior)";
    }

    // 2. Guardar en Base de Datos de RECLUTAMIENTO (La original)
    // Aquí guardamos toda la info curricular
    await notion.pages.create({
      parent: { database_id: DATABASE_ID! },
      properties: {
        "Nombre": { title: [{ text: { content: data.nombre } }] },
        "Apellidos": { rich_text: [{ text: { content: data.apellidos } }] },
        "Correo": { email: data.email },
        "Celular": { phone_number: data.celular },
        "Carrera": { select: { name: data.carrera } },
        "Semestre": { number: parseInt(data.semestre) },
        "Cuenta": { rich_text: [{ text: { content: data.numeroCuenta } }] },
        "Area Interes": { select: { name: data.areaInteres } },
        "Porque Unirse": { rich_text: [{ text: { content: data.motivo } }] },
        "Estado": { status: { name: "Recibido" } }, // Estado inicial
      },
    });

    // 3. Enviar Correo con Credenciales
    const { error } = await resend.emails.send({
      from: 'SIAFI <onboarding@resend.dev>',
      to: [data.email],
      subject: '¡Registro Exitoso y Credenciales SIAFI!',
      react: WelcomeEmail({ 
        nombre: data.nombre,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://sociedad-ia-app.vercel.app',
        passwordGenerada: passwordParaCorreo,
        emailUsuario: data.email
      }),
    });

    if (error) {
      console.error("Error enviando correo:", error);
    }

    return NextResponse.json({ success: true, message: "Registro completo y cuenta creada" });

  } catch (error: any) {
    console.error("Error en API Register:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}