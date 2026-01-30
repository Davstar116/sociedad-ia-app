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

  // Aseguramos que baseUrl no tenga barra al final para evitar dobles barras en las imágenes
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, "") : "";

  return (
    <div style={{ margin: 0, padding: 0, backgroundColor: '#f4f5f7', fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif", color: '#334155' }}>
      <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ backgroundColor: '#f4f5f7' }}>
        <tr>
          <td align="center" style={{ padding: '24px 12px' }}>
            <table role="presentation" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ maxWidth: '600px', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(16,24,40,0.08)' }}>

              {/* Header Negro */}
              <tr>
                <td style={{ padding: '16px 18px', backgroundColor: '#000000', color: '#ffffff' }}>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                    <tr>
                      <td valign="middle">
                        <img src={`${cleanBaseUrl}/email/shield.png`} alt="Escudo" width="50" style={{ display: 'block', maxWidth: '50px' }} />
                      </td>
                      <td valign="middle" align="right">
                        <img src={`${cleanBaseUrl}/email/logo-text.png`} alt="SIAFI" width="130" style={{ display: 'block', maxWidth: '130px' }} />
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
                    Confirmamos que tus datos han sido recibidos correctamente. SophIA ha generado automáticamente una cuenta de acceso para ti y comenzará el analisis preliminar de tu perfil.
                  </p>

                  {/* 🔐 CAJA DE CREDENCIALES */}
                  <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bce3eb', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#006d8f', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      Tus Credenciales de Acceso
                    </p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#334155' }}>
                      <strong>Usuario:</strong> {emailUsuario}
                    </p>
                    <p style={{ margin: '0', fontSize: '14px', color: '#334155' }}>
                      <strong>Contraseña:</strong> <span style={{ fontFamily: 'monospace', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', letterSpacing: '1px' }}>{passwordGenerada}</span>
                    </p>
                  </div>

                  <div style={{ textAlign: 'center', margin: '24px 0' }}>
                    <a href={`${cleanBaseUrl}/login`} style={{ backgroundColor: '#000000', color: '#ffffff', textDecoration: 'none', padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                      Acceder al Portal
                    </a>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #e6eef2', margin: '18px 0' }} />

                  {/* Caja Informativa */}
                  <div style={{ backgroundColor: '#F8FAFC', borderLeft: '4px solid #00BAFF', padding: '20px', margin: '20px 0' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333333', fontWeight: 'bold' }}>
                      ¿Qué sigue ahora?
                    </p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#555555' }}>• Puedes ingresar al portal usando tus credenciales para ver el estado de tu solicitud.</p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#555555' }}>• Mantente atent@ a tu correo electrónico, también por este medio te haremos saber el estado de tu solicitud.</p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#555555' }}>• Te recomendamos seguir nuestras redes sociales.</p>
                  </div>

                  {/* FIRMA ACTUALIZADA */}
                  <p style={{ margin: '0 0 0 0', color: '#334155', fontSize: '14px', lineHeight: '1.6' }}>
                    Atentamente,<br />
                    <strong style={{ color: '#0f172a' }}>Mesa Directiva & SophIA</strong><br />
                    SIAFI - UNAM
                  </p>
                </td>
              </tr>
              
              {/* FOOTER ACTUALIZADO */}
              <tr>
                <td style={{ backgroundColor: '#f8fafc', padding: '14px 18px', fontSize: '12px', color: '#64748b', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 6px 0' }}>2026 SIAFI - Facultad de Ingeniería, UNAM.</p>
                  <p style={{ margin: '0', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>
                    Este es un mensaje generado por SophIA.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  );
};