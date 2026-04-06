import * as React from 'react';

interface CredencialesProps {
  nombre: string;
  cargo: string;
  correo: string;
  baseUrl: string;
}

export function CredencialesDirectivoEmailTemplate({ nombre, cargo, correo, baseUrl }: CredencialesProps) {
  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111111; border: 1px solid #333333; border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #00baff, #581c87); padding: 40px 20px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                                ¡Bienvenido al Equipo Administrativo!
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="font-size: 16px; color: #e5e5e5; line-height: 1.6; margin-bottom: 20px;">
                                Hola <strong>${nombre}</strong>,
                            </p>
                            <p style="font-size: 16px; color: #a3a3a3; line-height: 1.6; margin-bottom: 30px;">
                                Tu cuenta como Administrador de la Sociedad de Inteligencia Artificial (SIAFI) ha sido configurada exitosamente por el Presidente. Ahora cuentas con el cargo de <strong>${cargo}</strong>.
                            </p>
                            
                            <div style="background-color: #050505; border: 1px solid #333333; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                                <h3 style="color: #00baff; margin-top: 0; margin-bottom: 15px; font-size: 14px; text-transform: uppercase;">Tus Credenciales de Acceso</h3>
                                <p style="margin: 5px 0; color: #e5e5e5;"><strong>Correo:</strong> ${correo}</p>
                                <p style="margin: 5px 0; color: #e5e5e5;"><strong>Contraseña:</strong> LiderSiafi2026!</p>
                            </div>

                            <p style="font-size: 14px; color: #a3a3a3; line-height: 1.6; margin-bottom: 30px; font-style: italic;">
                                Una vez que inicies sesión por primera vez, te recomendamos cambiar tu contraseña desde tu perfil por motivos de seguridad.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${baseUrl}/login" style="display: inline-block; padding: 14px 32px; background-color: #00baff; color: #000000; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; border-radius: 8px; letter-spacing: 1px;">
                                            Iniciar Sesión Ahora
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px; background-color: #000000; border-top: 1px solid #333333;">
                            <p style="font-size: 12px; color: #666666; margin: 0;">
                                Sociedad de Inteligencia Artificial FI - UNAM
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
