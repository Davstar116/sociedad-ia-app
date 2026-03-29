interface PostulanteEntrevistaProps {
  nombre: string;
  baseUrl: string;
  fechaLegible: string;
  hora: string;
  meetLink: string;
}

export function PostulanteEntrevistaEmailTemplate({ nombre, baseUrl, fechaLegible, hora, meetLink }: PostulanteEntrevistaProps) {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Candidato";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Entrevista Confirmada - SIAFI</title>
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
                        <td valign="middle" style="width: 50px;">
                            <img src="${cleanBaseUrl}/email/shield.png" alt="SIAFI" width="45" height="45" style="display: block; width: 45px; height: 45px; object-fit: contain;" />
                        </td>
                        <td valign="middle" align="right">
                            <img src="${cleanBaseUrl}/email/logo-text.png" alt="SIAFI" width="120" style="display: block; width: 120px; object-fit: contain;" />
                        </td>
                    </tr>
                    </table>
                </td>
                </tr>
                
                <tr>
                <td style="padding: 30px 40px 40px 40px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #ffffff;">Entrevista Confirmada, ${primerNombre} 📅</h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; color: #9ca3af; line-height: 1.6;">
                    Tu horario ha sido registrado exitosamente en nuestro sistema. Estamos muy emocionados por platicar contigo y conocer más sobre tu visión y pasión por la tecnología.
                    </p>
                    
                    <div style="background-color: #0a0a0a; border: 1px solid #0051ff; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                        <p style="margin: 0 0 10px 0; font-size: 13px; color: #00baff; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Detalles de tu Entrevista</p>
                        <p style="margin: 0 0 5px 0; font-size: 15px; color: #ffffff;"><strong>Fecha:</strong> ${fechaLegible}</p>
                        <p style="margin: 0 0 15px 0; font-size: 15px; color: #ffffff;"><strong>Hora:</strong> ${hora}</p>
                        <a href="${meetLink}" target="_blank" style="display: inline-block; background-color: #0051ff; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
                            📹 Unirse a la Videollamada
                        </a>
                    </div>

                    <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #1f2937;">
                        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #ffffff;">Recomendaciones 💡</h3>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                            <li style="margin-bottom: 8px;">Conéctate <strong>puntual</strong> a la sesión en la hora acordada.</li>
                            <li style="margin-bottom: 8px;">Busca un lugar tranquilo y con buena conexión a internet.</li>
                            <li style="margin-bottom: 8px;">Asegúrate de que tu <strong>cámara y micrófono</strong> funcionen correctamente.</li>
                            <li>¡Sé tú mismo! Queremos conocer al futuro miembro de nuestra sociedad.</li>
                        </ul>
                    </div>
                    
                    <p style="margin: 0 0 30px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    ¡Mucho éxito!<br />
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
                    ¿Problemas para acceder al enlace? <br />
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