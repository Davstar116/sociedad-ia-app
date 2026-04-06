import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { PostulanteAprobadoEntrevistaEmailTemplate } from "@/app/components/emails/PostulanteAprobadoEntrevistaEmail";
import { PostulanteDeclinadoPreEmailTemplate } from "@/app/components/emails/PostulanteDeclinadoPreEmail";
import { PostulanteAceptadoSociedadEmailTemplate } from "@/app/components/emails/PostulanteAceptadoSociedadEmail";
import { PostulanteDeclinadoFinalEmailTemplate } from "@/app/components/emails/PostulanteDeclinadoFinalEmail";

const NOTION_TOKEN = process.env.NOTION_TOKEN;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export async function POST(req: Request) {
   try {
       const body = await req.json();
       const { type, candidatoId, column, value, targetEstatus, correo, nombre } = body;
       const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://siafi-unam-app.vercel.app";

       if (type === "VOTE" || type === "ASSIGN_NUCLEO") {
          // Normal property patch (E.g. updating Voto Pre *, Núcleo Asignado)
          const properties: any = {};
          properties[column] = { select: { name: value } };

          const res = await fetch(`https://api.notion.com/v1/pages/${candidatoId}`, {
             method: "PATCH",
             headers: {
               "Authorization": `Bearer ${NOTION_TOKEN}`,
               "Notion-Version": "2022-06-28",
               "Content-Type": "application/json"
             },
             body: JSON.stringify({ properties })
          });
          if(!res.ok) throw new Error("Error patching Notion property");
          return NextResponse.json({ success: true });
       }

       if (type === "UPDATE_NOTES") {
          const properties: any = {};
          properties[column] = { rich_text: [{ text: { content: value.substring(0, 2000) } }] };
          const res = await fetch(`https://api.notion.com/v1/pages/${candidatoId}`, {
             method: "PATCH",
             headers: {
               "Authorization": `Bearer ${NOTION_TOKEN}`,
               "Notion-Version": "2022-06-28",
               "Content-Type": "application/json"
             },
             body: JSON.stringify({ properties })
          });
          if(!res.ok) throw new Error("Error patching Notion notes");
          return NextResponse.json({ success: true });
       }
       
       if (type === "FINALIZE") {
          // 1. Patch Estatus del postulante
          const properties: any = {};
          
          // Estatus might be status or select depending on Notion config, usually status for "Estatus del postulante"
          properties["Estatus del postulante"] = { status: { name: targetEstatus } };
          
          const res = await fetch(`https://api.notion.com/v1/pages/${candidatoId}`, {
             method: "PATCH",
             headers: {
               "Authorization": `Bearer ${NOTION_TOKEN}`,
               "Notion-Version": "2022-06-28",
               "Content-Type": "application/json"
               },
               // If it fails with status, it probably was a Select column, let's try fallback logic if needed
             body: JSON.stringify({ properties })
          });

          if (!res.ok) {
             const errorTxt = await res.text();
             if (errorTxt.includes("status")) {
                // fallback to select
                properties["Estatus del postulante"] = { select: { name: targetEstatus } };
                await fetch(`https://api.notion.com/v1/pages/${candidatoId}`, {
                  method: "PATCH",
                  headers: { "Authorization": `Bearer ${NOTION_TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
                  body: JSON.stringify({ properties })
                });
             }
          }

          // 2. Send email based on targetEstatus
          let htmlEmail = "";
          let subject = "";

          if (targetEstatus === "Aprobado para Entrevista") {
             subject = "¡Aprobado para Entrevista SIAFI! Agenda tu espacio";
             htmlEmail = PostulanteAprobadoEntrevistaEmailTemplate({ nombre, baseUrl });
          } else if (targetEstatus === "No Seleccionado") {
             subject = "Actualización importante de tu postulación SIAFI";
             htmlEmail = PostulanteDeclinadoPreEmailTemplate({ nombre, baseUrl });
          } else if (targetEstatus === "Aceptado") {
             subject = "¡Bienvenido a SIAFI! Has sido aceptado";
             htmlEmail = PostulanteAceptadoSociedadEmailTemplate({ nombre, baseUrl });
          } else if (targetEstatus === "Rechazado") {
             subject = "Resultados Finales de tu Entrevista SIAFI";
             htmlEmail = PostulanteDeclinadoFinalEmailTemplate({ nombre, baseUrl });
          }

          if (htmlEmail && correo) {
             await transporter.sendMail({
                from: `"SIAFI Reclutamiento" <${process.env.EMAIL_USER}>`,
                to: correo,
                subject,
                html: htmlEmail
             });
          }

          // Generate an In-App Notion Notification so that the system notices the alert
          if (correo) {
             await fetch(`${baseUrl}/api/notifications`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     email: correo,
                     asunto: subject,
                     mensaje: "Ha habido una actualización en el estatus de tu postulación. Revisa la información."
                 })
             }).catch(e => console.log("Notif dispatch error", e));
          }

          return NextResponse.json({ success: true });
       }
       return NextResponse.json({ error: "Invalid type" }, { status: 400 });

   } catch (e: any) {
       console.error("Action handler error:", e);
       return NextResponse.json({ error: e.message }, { status: 500 });
   }
}
