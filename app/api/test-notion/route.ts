// app/api/test-notion/route.ts
import { NextResponse } from "next/server";
// Nota el cambio aquí: usamos @/lib/notion
// El símbolo @ suele apuntar a la raíz del proyecto cuando no usas src
import { verificarConexion } from "@/lib/notion"; 

export async function GET() {
  const conectado = await verificarConexion();

  if (conectado) {
    return NextResponse.json({ message: "¡Sistema Operativo! Conexión a Notion establecida." }, { status: 200 });
  } else {
    return NextResponse.json({ message: "Error crítico: No se pudo conectar a Notion." }, { status: 500 });
  }
}