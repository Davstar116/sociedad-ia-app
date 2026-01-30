import { WelcomeEmail } from "../components/emails/WelcomeEmail";

export default function EmailPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center p-8">
      {/* Etiqueta flotante */}
      <div className="fixed top-4 left-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50 font-mono text-xs">
        👁️ VISTA PREVIA
      </div>

      <div className="shadow-2xl">
        {/* Pasamos la URL de producción y LAS NUEVAS CREDENCIALES SIMULADAS */}
        <WelcomeEmail 
          nombre="David Estudiante" 
          baseUrl="https://sociedad-ia-app.vercel.app"
          // 👇 Agregamos esto para que no de error y se vea completo
          emailUsuario="david@comunidad.unam.mx"
          passwordGenerada="X9P2-M5L1"
        />
      </div>
    </div>
  );
}