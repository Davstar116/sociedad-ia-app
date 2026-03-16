import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, createUser } from "@/app/lib/user-db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // --- AÑADIMOS LA CONFIGURACIÓN DE SESIÓN AQUÍ ---
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // La sesión durará 30 días (en segundos)
  },
  // ------------------------------------------------

  providers: [
    // 1. Login con Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // 2. Login con Correo y Contraseña (Miembros y Postulantes)
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Faltan datos de acceso");
        }

        // Buscamos en Notion
        const user = await getUserByEmail(credentials.email);

        // Si no existe o no tiene contraseña (quizás se registró con Google antes)
        if (!user || !user.passwordHash) {
          throw new Error("Usuario no encontrado o contraseña incorrecta");
        }

        // Verificamos la contraseña encriptada
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Contraseña incorrecta");
        }

        // Retornamos el usuario para la sesión
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.role, // Hack: Usaremos el campo image para pasar el Rol temporalmente al JWT
        };
      }
    }),
  ],
  callbacks: {
    // Cuando alguien se loguea (Google o Credenciales)
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Verificamos si ya existe en Notion
        const existingUser = await getUserByEmail(user.email!);
        
        if (!existingUser) {
          // Si es nuevo, lo creamos como "Miembro"
          await createUser({
            email: user.email!,
            name: user.name!,
            avatar: user.image!,
            provider: "google",
            role: "Miembro" // Por defecto
          });
        }
      }
      return true;
    },
    
    // Inyectamos el Rol en la sesión para usarlo en el Frontend
    async session({ session }) {
      if (session.user?.email) {
        // Consultamos rol actualizado en cada sesión
        const dbUser = await getUserByEmail(session.user.email);
        
        if (dbUser) {
          // @ts-ignore
          session.user.role = dbUser.role; 
          
          // Seguridad extra: Si es el correo maestro, forzar rol
          if (session.user.email === process.env.MASTER_ADMIN_EMAIL) {
             // @ts-ignore
            session.user.role = "Admin Maestro";
          }
        } else {
          // 🚨 EL USUARIO YA NO EXISTE EN NOTION
          // Le pegamos una etiqueta de error a la sesión
          // @ts-ignore
          session.error = "UserDeleted";
        }
      }
      return session;
    },
    
    async jwt({ token, user }) {
      // Pasamos datos iniciales al token
      if (user) {
        // @ts-ignore
        token.role = user.role; 
      }
      return token;
    }
  },
  pages: {
    signIn: '/login', // Crearemos una página de login personalizada luego
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };