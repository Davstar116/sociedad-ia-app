import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: '/login', // Nuestra página personalizada de login
  },
  callbacks: {
    async session({ session }) {
      // Aquí podríamos verificar si el email está en la lista de "Socios" en Notion
      // para darle permisos de admin. Por ahora, todos son usuarios normales.
      return session;
    },
  },
});

export { handler as GET, handler as POST };