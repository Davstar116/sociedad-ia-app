interface ForgotPasswordProps {
  nombre: string;
  baseUrl: string;
  tempPassword: string;
}

export function ForgotPasswordEmailTemplate({ nombre, baseUrl, tempPassword }: ForgotPasswordProps) {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Usuario";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <title>Recuperación de Contraseña - SIAFI</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
        <tr>
            <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111111; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden;">
                <tr><td style="height: 4px; background-color: #00baff;"></td></tr>
                <tr>
                <td style="padding: 20px 24px; background-color: #000000; border-bottom: 1px solid #1f2937;">
                    <img src="${cleanBaseUrl}/email/logo-text.png" alt="SIAFI Text" width="130" style="display: block; max-width: 130px;" />
                </td>
                </tr>
                <tr>
                <td style="padding: 30px 40px 40px 40px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #ffffff;">Recuperación de Contraseña 🔑</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">
                    Hola, <strong>${primerNombre}</strong>. Hemos recibido una solicitud para restablecer tu contraseña en SIAFI. Se ha generado una clave temporal para que puedas acceder.
                    </p>
                    
                    <div style="background-color: #0a0a0a; border: 1px solid #0051ff; border-radius: 12px; padding: 20px; margin-bottom: 30px; text-align: center;">
                        <p style="margin: 0 0 10px 0; font-size: 13px; color: #00baff; text-transform: uppercase; font-weight: bold;">Tu Contraseña Temporal</p>
                        <p style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 4px; font-family: monospace; font-weight: bold;">${tempPassword}</p>
                    </div>

                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
                        Por favor, inicia sesión con esta clave y dirígete de inmediato a la sección de Configuración para cambiarla por una nueva.
                    </p>
                </td>
                </tr>
            </table>
            </td>
        </tr>
        </table>
    </body>
    </html>
  `;
}