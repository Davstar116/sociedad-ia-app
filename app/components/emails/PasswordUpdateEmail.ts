interface PasswordUpdateProps {
  nombre: string;
  baseUrl: string;
  newPassword?: string;
  emailUsuario: string;
}

export function PasswordUpdateEmailTemplate({ nombre, baseUrl, newPassword, emailUsuario }: PasswordUpdateProps) {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Usuario";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Actualización de Seguridad - SIAFI</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
        <tr>
            <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111111; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                
                <tr><td style="height: 4px; background-color: #ef4444;"></td></tr>
                
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
                    <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #ffffff;">Alerta de Seguridad 🔒</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">
                    Hola, <strong>${primerNombre}</strong>. Te confirmamos que los datos y/o la contraseña de tu cuenta en SIAFI han sido actualizados recientemente desde tu panel de configuración.
                    </p>
                    
                    ${newPassword ? `
                    <div style="background-color: #0a0a0a; border: 1px solid #ef4444; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0 0 10px 0; font-size: 13px; color: #ef4444; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Tus Nuevas Credenciales</p>
                        <p style="margin: 0 0 8px 0; font-size: 15px; color: #ffffff;"><span style="color: #6b7280;">Usuario:</span> ${emailUsuario}</p>
                        <p style="margin: 0; font-size: 15px; color: #ffffff;"><span style="color: #6b7280;">Nueva Contraseña:</span> <strong style="letter-spacing: 2px; font-family: monospace; background-color: #1f2937; padding: 2px 6px; border-radius: 4px;">${newPassword}</strong></p>
                    </div>
                    ` : ''}

                    <div style="background-color: #111111; border-left: 4px solid #00baff; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #ffffff; font-weight: bold;">¿No fuiste tú?</p>
                        <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
                            Si no realizaste este cambio, por favor contáctanos inmediatamente a soporte para proteger tu cuenta.
                        </p>
                    </div>
                    
                    <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    Atentamente,<br />
                    <strong style="color: #ffffff;">Equipo de Seguridad SophIA</strong><br />
                    SIAFI - UNAM
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