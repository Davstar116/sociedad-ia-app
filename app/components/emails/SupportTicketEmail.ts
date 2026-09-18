interface SupportTicketProps {
  nombre: string;
  correo: string;
  celular: string;
  rol: string;
  asunto: string;
  mensaje: string;
  baseUrl: string;
}

export function SupportTicketEmailTemplate({ nombre, correo, celular, rol, asunto, mensaje, baseUrl }: SupportTicketProps) {
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <title>Nuevo Ticket de Soporte - SophIA</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
        <tr>
            <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111111; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                
                <tr><td style="height: 4px; background-color: #00baff;"></td></tr>
                
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
                    <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #ffffff;">🛠️ Nuevo Ticket de Soporte Técnico</h2>
                    
                    <div style="background-color: #0a0a0a; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <p style="margin: 0 0 15px 0; font-size: 13px; color: #00baff; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Datos del Usuario</p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #d1d5db;"><strong>Nombre:</strong> ${nombre}</p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #d1d5db;"><strong>Correo:</strong> ${correo}</p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #d1d5db;"><strong>Celular:</strong> ${celular || "No registrado"}</p>
                        <p style="margin: 0; font-size: 14px; color: #d1d5db;"><strong>Rol:</strong> <span style="background-color: #1f2937; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${rol}</span></p>
                    </div>

                    <div style="background-color: #111111; border-left: 4px solid #0051ff; padding: 20px; margin-bottom: 30px;">
                        <p style="margin: 0 0 8px 0; font-size: 15px; color: #00baff; font-weight: bold;">Asunto: ${asunto}</p>
                        <p style="margin: 0; font-size: 14px; color: #d1d5db; line-height: 1.6; white-space: pre-wrap;">${mensaje}</p>
                    </div>
                    
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                        Este mensaje fue enviado automáticamente desde la plataforma SophIA.
                    </p>
                </td>
                </tr>

                <tr>
                <td style="background-color: #0a0a0a; padding: 24px 40px; border-top: 1px solid #1f2937; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280;">2026 SIAFI - Facultad de Ingeniería, UNAM.</p>
                    <p style="margin: 0 0 16px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #4b5563;">Este es un mensaje generado por SophIA.</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    ¿Problemas con el sistema? <br />
                    <a href="mailto:siafi.unam.reclutamiento@gmail.com" style="color: #00baff; text-decoration: none; font-weight: bold;">siafi.unam.reclutamiento@gmail.com</a>
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