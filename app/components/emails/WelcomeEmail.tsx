import * as React from 'react';

interface EmailProps {
  nombre: string;
  carrera: string;
  semestre: string;
}

export const WelcomeEmail: React.FC<Readonly<EmailProps>> = ({
  nombre,
  carrera,
  semestre,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4', padding: '20px' }}>
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      
      {/* Header Corporativo */}
      <div style={{ backgroundColor: '#000000', padding: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#00BAFF', margin: 0, letterSpacing: '2px', fontSize: '24px' }}>SIAFI</h1>
        <p style={{ color: '#888888', fontSize: '12px', marginTop: '5px', textTransform: 'uppercase' }}>Sociedad de Inteligencia Artificial</p>
      </div>

      {/* Cuerpo del Mensaje */}
      <div style={{ padding: '40px 30px', color: '#333333' }}>
        <h2 style={{ fontSize: '20px', color: '#111111' }}>Hola, {nombre}.</h2>
        <p style={{ lineHeight: '1.6', color: '#555555' }}>
          Hemos recibido tu postulación exitosamente. SophIA ha ingresado tus datos en nuestra base neural y tu perfil está <strong>listo para ser analizado</strong>.
        </p>

        {/* Tarjeta de Resumen */}
        <div style={{ backgroundColor: '#F8FAFC', borderLeft: '4px solid #00BAFF', padding: '20px', margin: '20px 0' }}>
          <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Carrera:</strong> {carrera}</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Semestre:</strong> {semestre}</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Status:</strong> <span style={{ color: '#00BAFF' }}>En Revisión</span></p>
        </div>

        <p style={{ lineHeight: '1.6', color: '#555555' }}>
          El siguiente paso es la evaluación de tu perfil. Si eres seleccionado, recibirás una notificación para agendar tu entrevista.
        </p>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <a href="https://sociedad-ia-app.vercel.app/dashboard" style={{ backgroundColor: '#000000', color: '#ffffff', padding: '12px 25px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Ver Estado en la App
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#eeeeee', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#888888' }}>
        <p>© 2026 SIAFI - Facultad de Ingeniería, UNAM.</p>
        <p>Este es un mensaje automático generado por SophIA.</p>
      </div>
    </div>
  </div>
);