import { WelcomeEmail } from "../components/emails/WelcomeEmail";

export default function EmailPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center p-8">
      {/* Etiqueta para saber que es una prueba */}
      <div className="fixed top-4 left-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50">
        👁️ Modo Previsualización
      </div>

      {/* Renderizamos el componente con datos falsos (Mock Data) */}
      <div className="shadow-2xl">
        <WelcomeEmail 
          nombre="David Estudiante" 
          carrera="Ingeniería en Computación" 
          semestre="5" 
        />
      </div>
    </div>
  );
}