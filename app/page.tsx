import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
// Importa las opciones de autenticación (asegúrate de que la ruta coincida con tu proyecto)
import { authOptions } from "./api/auth/[...nextauth]/route"; 

export default async function RootPage() {
  // Verificamos si hay una sesión activa
  const session = await getServerSession(authOptions);

  // Si el usuario ya inició sesión, lo mandamos directo a su panel
  if (session) {
    redirect("/dashboard");
  }

  // Si no hay sesión, lo mandamos automáticamente a la nueva pantalla de login
  redirect("/login");
}