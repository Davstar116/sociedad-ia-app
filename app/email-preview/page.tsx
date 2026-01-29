import { WelcomeEmail } from "../components/emails/WelcomeEmail";

export default function EmailPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center p-8">
      <div className="shadow-2xl">
        <WelcomeEmail 
          nombre="David Ejemplo" 
          baseUrl="https://sociedad-ia-app.vercel.app" // URL hardcodeada para probar vista
        />
      </div>
    </div>
  );
}