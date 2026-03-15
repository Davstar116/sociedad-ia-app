import * as React from 'react';

interface EmailProps {
  nombre: string;
  baseUrl: string;
  passwordGenerada: string;
  emailUsuario: string;
}

export const WelcomeEmail: React.FC<Readonly<EmailProps>> = ({
  nombre,
  baseUrl,
  passwordGenerada,
  emailUsuario
}) => {
  const primerNombre = nombre ? nombre.split(" ")[0] : "Candidato";
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Registro Exitoso - SIAFI</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#050505', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#ffffff' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ backgroundColor: '#050505', padding: '40px 20px' }}>
          <tr>
            <td align="center">
              <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ maxWidth: '600px', backgroundColor: '#111111', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                
                {/* Línea de acento superior */}
                <tr><td style={{ height: '4px', backgroundColor: '#0051ff' }}></td></tr>

                {/* Header Institucional Negro */}
                <tr>
                  <td style={{ padding: '20px 24px', backgroundColor: '#000000', borderBottom: '1px solid #1f2937' }}>
                    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td valign="middle">
                          <img src={`${cleanBaseUrl}/email/shield.png`} alt="Escudo SIAFI" width="50" style={{ display: 'block', maxWidth: '50px' }} />
                        </td>
                        <td valign="middle" align="right">
                          <img src={`${cleanBaseUrl}/email/logo-text.png`} alt="SIAFI Text" width="130" style={{ display: 'block', maxWidth: '130px' }} />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Cuerpo Principal */}
                <tr>
                  <td style={{ padding: '30px 40px 40px 40px' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', color: '#ffffff' }}>¡Registro Exitoso, {primerNombre}! 👋</h2>
                    
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#9ca3af', lineHeight: 1.6 }}>
                      Confirmamos que tus datos han sido recibidos correctamente para el reclutamiento <strong>2026-2</strong>. SophIA ha generado automáticamente una cuenta de acceso para ti y comenzará el análisis preliminar de tu perfil.
                    </p>

                    {/* Caja de Credenciales */}
                    <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ backgroundColor: '#0a0a0a', border: '1px solid #0051ff', borderRadius: '12px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '20px' }}>
                          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#00baff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Tus Credenciales de Acceso</p>
                          <p style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#ffffff' }}><span style={{ color: '#6b7280' }}>Usuario:</span> {emailUsuario}</p>
                          <p style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}><span style={{ color: '#6b7280' }}>Contraseña:</span> <strong style={{ letterSpacing: '2px', fontFamily: 'monospace', backgroundColor: '#1f2937', padding: '2px 6px', borderRadius: '4px' }}>{passwordGenerada}</strong></p>
                        </td>
                      </tr>
                    </table>

                    {/* Caja Informativa: Qué sigue */}
                    <div style={{ backgroundColor: '#0a0a0a', borderLeft: '4px solid #00baff', padding: '20px', marginBottom: '30px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#ffffff', fontWeight: 'bold' }}>¿Qué sigue ahora?</p>
                      <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#9ca3af', lineHeight: 1.5 }}>• Ingresa al portal usando tus credenciales para ver el estado de tu postulación.</p>
                      <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#9ca3af', lineHeight: 1.5 }}>• Te sugerimos mantenerte atent@ a tu bandeja de entrada o spam para futuras actualizaciones.</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', lineHeight: 1.5 }}>• Sigue nuestras redes sociales para no perderte ningún aviso.</p>
                    </div>

                    {/* Botón de Acción */}
                    <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginBottom: '30px' }}>
                      <tr>
                        <td align="center">
                          <a href={`${cleanBaseUrl}/login`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', backgroundColor: '#0051ff', color: '#ffffff', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none', padding: '14px 28px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Acceder al Portal</a>
                        </td>
                      </tr>
                    </table>

                    {/* Firma */}
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>
                      Atentamente,<br />
                      <strong style={{ color: '#ffffff' }}>Mesa Directiva & SophIA</strong><br />
                      SIAFI - UNAM
                    </p>
                  </td>
                </tr>

                {/* Footer Institucional */}
                <tr>
                  <td style={{ backgroundColor: '#0a0a0a', padding: '24px 40px', borderTop: '1px solid #1f2937', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280' }}>2026 SIAFI - Facultad de Ingeniería, UNAM.</p>
                    <p style={{ margin: '0 0 16px 0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4b5563' }}>Este es un mensaje generado por SophIA.</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                      ¿Problemas para acceder? <br />
                      <a href="mailto:siafi.reclutamiento@gmail.com" style={{ color: '#00baff', textDecoration: 'none', fontWeight: 'bold' }}>siafi.reclutamiento@gmail.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};