import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ AQUÍ ESTÁ EL CAMBIO: Renombramos la función a 'proxy'
export async function proxy(req: NextRequest) {
  // Obtenemos el token de la sesión activa directamente de las cookies
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // REGLA 1: Si ya inició sesión y quiere entrar al Login o al Inicio -> Lo mandamos al Dashboard
  if (token && (pathname === "/login" || pathname === "/register" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // REGLA 2: Si NO ha iniciado sesión y quiere husmear en el Dashboard -> Al Login
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Si todo está en orden, lo dejamos pasar
  return NextResponse.next();
}

// Aquí le decimos al "cadenero" qué rutas específicas debe vigilar
export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*"],
};