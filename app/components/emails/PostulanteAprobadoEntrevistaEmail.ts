interface EmailProps {
  nombre: string;
  baseUrl: string;
}

export function PostulanteAprobadoEntrevistaEmailTemplate({ nombre, baseUrl }: EmailProps) {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Candidato";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Aprobado para Entrevista - SIAFI</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
        <tr>
            <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111111; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <tr><td style="height: 4px; background-color: #10b981;"></td></tr>
                <tr>
                <td style="padding: 20px 24px; background-color: #000000; border-bottom: 1px solid #1f2937;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td valign="middle">
                        <img src="${cleanBaseUrl}/email/shield.png" alt="Escudo SIAFI" width="50" style="display: block; max-width: 50px;" />
                        </td>
                        <td valign="middle" align="right">
                        <img src="${cleanBaseUrl}/email/logo-text.png" alt="SIAFI Text" width="130" style="display: block; max-width: 130px;" />
                        </td>
                    </tr>
                    </table>
                </td>
                </tr>
                <tr>
                <td style="padding: 30px 40px 40px 40px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #ffffff;">¡Avanzas a la Entrevista, ${primerNombre}! 🎉</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">
                    Nos da muchísimo gusto informarte que después de una revisión detallada de tu perfil por parte de la directiva, <strong>has sido seleccionado(a)</strong> para pasar a la fase de entrevistas del reclutamiento.
                    </p>
                    
                    <div style="background-color: #0a0a0a; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px;">
                    <p style="margin: 0 0 10px 0; font-size: 15px; color: #ffffff; font-weight: bold;">Acción Requerida</p>
                    <p style="margin: 0 0 6px 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">Ingresa a tu portal de postulante cuanto antes para <strong>agendar el día y la hora</strong> de tu entrevista. Los lugares están sujetos a disponibilidad, ¡no lo dejes al final!</p>
                    </div>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                    <tr>
                        <td align="center">
                        <a href="https://siafi-unam-app.vercel.app/login" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">Programar Entrevista</a>
                        </td>
                    </tr>
                    </table>
                    
                    <p style="margin: 0 0 30px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    Mucho éxito,<br />
                    <strong style="color: #ffffff;">Mesa Directiva & SophIA</strong><br />
                    SIAFI - UNAM
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #1f2937; padding-top: 25px;">
                        <tr><td align="center"><p style="margin: 0 0 15px 0; font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Síguenos en nuestras redes</p></td></tr>
                    </table>
                </td></tr>
            </table></td>
        </tr>
        </table>
    </body>
    </html>
  `;
}
