import * as React from 'react';

interface EmailProps {
  nombre: string;     // Nombre completo
  baseUrl: string;    // La dirección web de tu app
}

export const WelcomeEmail: React.FC<Readonly<EmailProps>> = ({
  nombre,
  baseUrl,
}) => {
  // Extraemos solo el primer nombre
  const primerNombre = nombre ? nombre.split(" ")[0] : "Candidato";

  return (
    <div style={{ margin: 0, padding: 0, backgroundColor: '#f4f5f7', fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif", color: '#334155' }}>
      <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ backgroundColor: '#f4f5f7' }}>
        <tr>
          <td align="center" style={{ padding: '24px 12px' }}>
            {/* Contenedor principal */}
            <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(16,24,40,0.08)' }}>

              {/* Header Negro Sólido */}
              <tr>
                <td style={{ padding: '16px 18px', backgroundColor: '#000000', color: '#ffffff' }}>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                    <tr>
                      <td valign="middle" style={{ verticalAlign: 'middle' }}>
                        {/* IMAGEN NATIVA 1: Escudo */}
                        <img 
                          src={`${baseUrl}/email/shield.png`} 
                          alt="Escudo" 
                          width="50" 
                          style={{ display: 'block', maxWidth: '50px', height: 'auto', border: 0 }} 
                        />
                      </td>
                      <td valign="middle" align="right" style={{ verticalAlign: 'middle', paddingRight: '0px' }}>
                        {/* IMAGEN NATIVA 2: Logo Texto */}
                        <img 
                          src={`${baseUrl}/email/logo-text.png`} 
                          alt="SIAFI" 
                          width="130" 
                          style={{ display: 'block', maxWidth: '130px', height: 'auto', border: 0 }} 
                        />
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              {/* Cuerpo */}
              <tr>
                <td style={{ padding: '24px' }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0f172a', fontWeight: 700 }}>
                    ¡Registro Exitoso, {primerNombre}!
                  </h2>
                  <p style={{ margin: '0 0 16px 0', color: '#334155', fontSize: '14px', lineHeight: 1.5 }}>
                    Confirmamos que tus datos han sido recibidos correctamente y almacenados en nuestra base neural segura.
                  </p>
                  
                  <p style={{ margin: '0 0 16px 0', color: '#334155', fontSize: '14px', lineHeight: 1.5 }}>
                    SophIA ha comenzado el análisis preliminar de tu perfil.
                  </p>

                  {/* (Se eliminó la sección del botón aquí) */}

                  <hr style={{ border: 'none', borderTop: '1px solid #e6eef2', margin: '18px 0' }} />

                  <p style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '14px', lineHeight: 1.5 }}><strong>¿Qué sigue ahora?</strong></p>
                  <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ margin: '8px 0 16px 0' }}>
                    <tr>
                      <td style={{ color: '#334155', fontSize: '14px', lineHeight: 1.5, paddingLeft: '18px' }}>
                        • Espera a que termine el periodo de recepción.<br />
                        • SophIA te notificará por este medio si pasas a la siguiente etapa.<br />
                        • Mantente atento a tu correo y a la App.
                      </td>
                    </tr>
                  </table>

                  <p style={{ margin: '0 0 18px 0', color: '#334155', fontSize: '14px', lineHeight: 1.5 }}>
                    Si tienes alguna pregunta, contáctanos en <a href="mailto:siafi.general@gmail.com" style={{ color: '#00baff', textDecoration: 'none' }}>siafi.general@gmail.com</a>.
                  </p>

                  <p style={{ margin: '0 0 0 0', color: '#334155', fontSize: '14px', lineHeight: 1.5 }}>
                    Atentamente,<br />
                    <strong style={{ color: '#0f172a' }}>Mesa Directiva & SophIA</strong><br />
                    Sociedad de Inteligencia Artificial - UNAM
                  </p>
                </td>
              </tr>

              {/* Footer Restaurado */}
              <tr>
                <td style={{ backgroundColor: '#f8fafc', padding: '14px 18px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                  <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                    <p style={{ margin: '0 0 6px 0' }}>© 2026 SIAFI - Facultad de Ingeniería, UNAM.</p>
                    <p style={{ margin: '0' }}>Este es un mensaje automático generado por SophIA.</p>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  );
};