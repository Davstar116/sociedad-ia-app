import { WelcomeEmailTemplate } from "../components/emails/WelcomeEmail";

export default function EmailPreviewPage() {
  // Datos simulados para ver cómo quedaría el correo
  const htmlCorreo = WelcomeEmailTemplate({
    nombre: "David Postulante",
    baseUrl: "https://tu-proyecto.vercel.app",
    passwordGenerada: "A1B2C3D4",
    emailUsuario: "david@ejemplo.com"
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#000' }}>
      {/* Inyectamos el HTML crudo directamente en la página */}
      <div dangerouslySetInnerHTML={{ __html: htmlCorreo }} />
    </div>
  );
}