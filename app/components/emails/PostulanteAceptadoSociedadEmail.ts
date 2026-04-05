interface EmailProps {
  nombre: string;
  baseUrl: string;
}

export function PostulanteAceptadoSociedadEmailTemplate({ nombre, baseUrl }: EmailProps) {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Miembro";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>¡Bienvenido(a) a SIAFI!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
        <tr>
            <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111111; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,255,150,0.15);">
                <tr><td style="height: 6px; background-image: linear-gradient(to right, #00baff, #0051ff, #f9a8d4);"></td></tr>
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
                    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff;">¡Felicidades, ${primerNombre}! 🤖✨</h2>
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #d1d5db; line-height: 1.6;">
                    Después de dictaminar el perfil posterior a tu entrevista, la Directiva General de SIAFI se enorgullece de oficializar que <strong>has sido ACEPTADO(A)</strong> como nuevo miembro de la Sociedad de Inteligencia Artificial de la Facultad de Ingeniería.
                    </p>
                    
                    <div style="background-color: #0051ff15; border-left: 4px solid #0051ff; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-size: 15px; color: #ffffff; font-weight: bold;">Siguiente Paso Obligatorio:</p>
                    <p style="margin: 0 0 6px 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">Debes integrarte al canal oficial de WhatsApp exclusivo para los nuevos ingresos. Las dinámicas de inducción comenzarán por allí.</p>
                    </div>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                    <tr>
                        <td align="center">
                        <a href="https://chat.whatsapp.com/K9BFLW6FjLQBP3PavhpWXn?mode=gi_t" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #25D366; color: #ffffff; font-size: 15px; font-weight: bold; text-decoration: none; padding: 15px 35px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(37,211,102,0.4);">
                          Unirme al Grupo
                        </a>
                        </td>
                    </tr>
                    </table>
                    
                    <p style="margin: 0 0 30px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    Bienvenido a la comunidad constructora de tecnología.<br /><br />
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
