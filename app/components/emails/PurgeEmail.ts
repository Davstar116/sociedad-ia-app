interface PurgeEmailProps {
  nombre: string;
  baseUrl: string;
}

export function PurgeEmailTemplate({ nombre, baseUrl }: PurgeEmailProps) {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Candidato";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Aviso de Sistema - SIAFI</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
        <tr>
            <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111111; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                
                <tr><td style="height: 4px; background-color: #0051ff;"></td></tr>
                
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
                    <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #ef4444;">Aviso de Sistema ⚠️</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #ffffff; line-height: 1.6;">
                      Hola <strong>${primerNombre}</strong>,
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">
                      Nos comunicamos contigo porque hemos detectado que creaste una cuenta estándar en la plataforma de SophIA en lugar de llenar el formulario oficial de postulación para el Reclutamiento 2026-2.
                    </p>
                    
                    <div style="background-color: #ef44441a; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 30px;">
                      <p style="margin: 0 0 10px 0; font-size: 15px; color: #ffffff; font-weight: bold;">Acción Tomada</p>
                      <p style="margin: 0; font-size: 14px; color: #fca5a5; line-height: 1.5;">Para evitar conflictos técnicos en nuestro sistema y asegurar que tu perfil sea evaluado correctamente, <strong>la cuenta que creaste ha sido eliminada.</strong></p>
                    </div>

                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #00baff; font-weight: bold; line-height: 1.6;">
                      Por favor, realiza tu registro de forma correcta ingresando al siguiente enlace y completando las preguntas de evaluación:
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                    <tr>
                        <td align="center">
                        <a href="${cleanBaseUrl}/postulacion" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0051ff; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px;">Ir al Formulario Correcto</a>
                        </td>
                    </tr>
                    </table>

                    <p style="margin: 0 0 30px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                      Una vez que llenes tu registro correctamente, el sistema creará automáticamente una cuenta para ti y recibirás un nuevo correo con tus credenciales y otra información.
                    </p>
                    
                    <p style="margin: 0 0 30px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    Atentamente,<br />
                    <strong style="color: #ffffff;">Mesa Directiva & SophIA</strong><br />
                    SIAFI - UNAM
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #1f2937; padding-top: 25px;">
                        <tr>
                            <td align="center">
                                <p style="margin: 0 0 15px 0; font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Síguenos en nuestras redes</p>
                                <table cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td style="padding: 0 12px;">
                                            <a href="https://www.instagram.com/unam.siafi?igsh=cWdteXJlZmZ3OTl" target="_blank" style="text-decoration: none;">
                                                <img src="https://img.icons8.com/ios-filled/50/ffffff/instagram-new.png" alt="Instagram" width="28" height="28" style="display: block; border: 0;" />
                                            </a>
                                        </td>
                                        <td style="padding: 0 12px;">
                                            <a href="https://www.facebook.com/share/1DrHanvRs1/" target="_blank" style="text-decoration: none;">
                                                <img src="https://img.icons8.com/ios-filled/50/ffffff/facebook-new.png" alt="Facebook" width="28" height="28" style="display: block; border: 0;" />
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                </td>
                </tr>
                
                <tr>
                <td style="background-color: #0a0a0a; padding: 24px 40px; border-top: 1px solid #1f2937; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280;">2026 SIAFI - Facultad de Ingeniería, UNAM.</p>
                    <p style="margin: 0 0 16px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #4b5563;">Este es un mensaje generado por SophIA.</p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    ¿Problemas para acceder? <br />
                    <a href="mailto:siafi.reclutamiento@gmail.com" style="color: #00baff; text-decoration: none; font-weight: bold;">siafi.reclutamiento@gmail.com</a>
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