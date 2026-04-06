import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { CredencialesDirectivoEmailTemplate } from "@/app/components/emails/CredencialesDirectivoEmail";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const directivos = [
  { email: "joserc17@ciencias.unam.mx", name: "José", cargo: "Líder de Capacitación" },
  { email: "jazagg11@gmail.com", name: "Jazmín", cargo: "Líder de Difusión" },
  { email: "jazmin.ramirez.fi@gmail.com", name: "Jazmin", cargo: "Colíder de Proyectos" },
  { email: "luuuis.castroo@gmail.com", name: "Luis", cargo: "Colíder de Proyectos" },
  { email: "jafet.fernandez040404@gmail.com", name: "Jafet", cargo: "Vicepresidente" },
  { email: "astridmondragon25@gmail.com", name: "Astrid", cargo: "Líder de Organización" }
];

export async function POST(request: Request) {
  try {
     const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://siafi-unam-app.vercel.app";
     
     const emailPromises = directivos.map((dir) => {
        const htmlBody = CredencialesDirectivoEmailTemplate({
            nombre: dir.name,
            cargo: dir.cargo,
            correo: dir.email,
            baseUrl
        });

        return transporter.sendMail({
            from: `"Equipo SIAFI" <${process.env.EMAIL_USER}>`,
            to: dir.email,
            subject: `SIAFI: Credenciales de cuenta - ${dir.cargo}`,
            html: htmlBody
        });
     });

     await Promise.all(emailPromises);

     return NextResponse.json({ success: true, message: "Correos enviados exitosamente" });

  } catch(error: any) {
     console.error("send-emails endpoint error:", error);
     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
