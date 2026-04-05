interface EmailProps {
  nombre: string;
  baseUrl: string;
}

export function PostulanteDeclinadoPreEmailTemplate({ nombre, baseUrl }: EmailProps) {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Candidato";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Actualización de tu postulación - SIAFI</title>
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
                    <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #ffffff;">Agradecemos tu interés, ${primerNombre}</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #d1d5db; line-height: 1.6;">
                    Hemos revisado cuidadosamente tu perfil durante la revisión inicial. Debido a la alta cantidad de postulaciones de excelente calidad este semestre y nuestra capacidad limitada, lamentamos informarte que <strong>no podremos avanzar con tu perfil</strong> en esta ocasión a la fase de entrevistas.
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                    Agradecemos enormemente el tiempo que dedicaste. Te invitamos a involucrarte en nuestros eventos abiertos y a intentarlo nuevamente en nuestra próxima convocatoria.
                    </p>
                    
                    <p style="margin: 0 0 30px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    Te deseamos el mejor de los éxitos en tu semestre académico.<br /><br />
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
