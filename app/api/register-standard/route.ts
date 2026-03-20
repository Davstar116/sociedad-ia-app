import { NextResponse } from "next/server";
// Importamos tus funciones maestras que ya encriptan y conectan con Notion
import { createUser, getUserByEmail } from "../../lib/user-db";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { nombre, email, celular, password } = data;

    // Validación básica de seguridad
    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    // 1. Verificar si el usuario ya existe en SIAFI Usuarios
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return NextResponse.json({ error: "Este correo electrónico ya está registrado. Intenta iniciar sesión." }, { status: 400 });
    }

    // 2. Crear el nuevo usuario
    // Como tu createUser en user-db ya maneja el hasheo de contraseñas y la insersión, 
    // solo le pasamos los datos con el rol de "Miembro"
    await createUser({ 
      email: email, 
      name: nombre, 
      password: password, 
      role: "Miembro", // ✅ Rol por defecto para aislarlo en el DashboardMiembro
      provider: "credentials",
      celular: celular || "" 
    });

    return NextResponse.json({ success: true, message: "Cuenta creada correctamente." });

  } catch (error: any) {
    console.error("Error en API register-standard:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}