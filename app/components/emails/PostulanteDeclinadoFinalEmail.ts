interface EmailProps {
  nombre: string;
  baseUrl: string;
}

export function PostulanteDeclinadoFinalEmailTemplate({ nombre, baseUrl }: EmailProps) {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Candidato";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Resultados de tu Entrevista - SIAFI</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
        <tr>
            <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111111; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <tr><td style="height: 4px; background-color: #eab308;"></td></tr>
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
                    <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #ffffff;">Agradecemos mucho tu talento, ${primerNombre}</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #d1d5db; line-height: 1.6;">
                    El comité directivo de SIAFI ha dictaminado los resultados de esta fase de reclutamiento. Lamentablemente, te comunicamos que en esta convocatoria <strong>tu ingreso como miembro activo no ha sido seleccionado.</strong>
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                    Queremos recalcar que cada semestre nos vemos limitados en el cupo interno. Tomar esta decisión jamás es fácil, puesto que tu entrevista denotó capacidades muy valiosas. 
                    Te invitamos de todo corazón a seguir tus metas en el mundo de la tecnología y a involucrarte con la Sociedad a través de nuestros eventos en la facultad.
                    </p>
                    
                    <p style="margin: 0 0 30px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    Éxito absoluto en tu semestre.<br /><br />
                    Atentamente,<br />
                    <strong style="color: #ffffff;">Mesa Directiva & SophIA</strong><br />
                    SIAFI - UNAM
                    </p>
                </td></tr>
            </table></td>
        </tr>
        </table>
    </body>
    </html>
  `;
}
