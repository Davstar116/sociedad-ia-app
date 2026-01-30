import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/app/lib/user-db";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // 1. Validaciones básicas
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // 2. Verificar si ya existe
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 });
    }

    // 3. Crear usuario (Rol por defecto: "Miembro")
    await createUser({
      name,
      email,
      password, // Se encriptará dentro de la función createUser
      provider: "credentials",
      role: "Miembro"
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error en registro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}