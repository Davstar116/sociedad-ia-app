"use client";

import { useState, useEffect } from "react";
import NeuralBackground from "../components/NeuralBackground";
import Image from "next/image";

// Componente de Estrellas Reutilizable
const StarRating = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => {
  return (
    <div className="flex justify-between items-center mb-2 bg-white/5 p-2 rounded hover:bg-white/10 transition-colors">
      <span className="text-sm text-gray-300 font-medium">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-xl transition-all ${star <= value ? 'text-sociedad-cyan scale-110 drop-shadow-[0_0_5px_rgba(0,186,255,0.8)]' : 'text-gray-600 hover:text-gray-400'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
};

export default function PostulacionPage() {
  // Estados de flujo
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'editing' | 'success_wait' | 'processing' | 'completed'>('editing');
  
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [fileName, setFileName] = useState("");

  const [formData, setFormData] = useState({
    nombre: "", email: "", telefono: "", carrera: "", semestre: "", nucleos: [] as string[], cvLink: "https://bucket-pendiente.com",
    respuestas: { aportacion: "", orgullo: "", inspiracion: "", motivo: "", fuente: "", expectativas: "", areasInteres: "" },
    skills: {
      lenguajes: { "C#": 1, "C": 1, "C++": 1, "Java": 1, "JavaScript": 1, "Python": 1 },
      tecnologias: { "TensorFlow/Keras": 1, "PyTorch": 1, "Scikit-learn": 1, "OpenCV": 1, "Linux": 1, "ROS/Docker": 1 },
      micros: { "Raspberry Pi": 1, "Arduino": 1, "Tiva": 1 }
    }
  });

  const opcionesNucleos = ["Organización", "Difusión", "Proyectos", "Capacitación"];

  // Helpers
  const handleChange = (f: string, v: any) => setFormData(p => ({ ...p, [f]: v }));
  const handleRespuesta = (f: string, v: string) => setFormData(p => ({ ...p, respuestas: { ...p.respuestas, [f]: v } }));
  const [file, setFile] = useState<File | null>(null);
  const handleSkill = (cat: "lenguajes" | "tecnologias" | "micros", key: string, val: number) => {
    setFormData(p => ({ ...p, skills: { ...p.skills, [cat]: { ...p.skills[cat], [key]: val } } }));
  };
  const handleNucleo = (n: string) => {
    setFormData(p => ({ ...p, nucleos: p.nucleos.includes(n) ? p.nucleos.filter(x => x !== n) : [...p.nucleos, n] }));
  };

  // Lógica de Envío con Animación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    try {
      let finalCvLink = formData.cvLink;

      // 1. SUBIDA DEL ARCHIVO A VERCEL BLOB
      if (file) {
        // Notificamos al usuario visualmente
        setMensaje("Subiendo documento a servidor seguro...");
        
        // Creamos un nombre único: Nombre_CV.pdf
        const uniqueName = `${formData.nombre.replace(/\s+/g, '_')}_CV.pdf`;
        
        const responseUpload = await fetch(
          `/api/upload?filename=${encodeURIComponent(uniqueName)}`,
          {
            method: 'POST',
            body: file,
          }
        );

        if (!responseUpload.ok) throw new Error("Error subiendo el archivo");
        
        const newBlob = await responseUpload.json();
        finalCvLink = newBlob.url; // ¡Obtenemos el link real!
      }

      // 2. GUARDADO EN NOTION
      const dataToSend = { ...formData, cvLink: finalCvLink };

      setMensaje("Encriptando perfil en Notion...");
      const res = await fetch("/api/registro", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataToSend)
      });

      if (res.ok) {
        setMensaje("¡Datos enviados correctamente!");
        setStatus('success_wait');
        setTimeout(() => setStatus('processing'), 2000);
        setTimeout(() => setStatus('completed'), 5000);
      } else {
        const err = await res.json();
        setMensaje("Error: " + err.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      setMensaje("Error en el proceso: " + (error.message || "Desconocido"));
      setLoading(false);
    }
  };

  // --- RENDERIZADO DE PANTALLAS ---

  // 1. PANTALLA DE PROCESAMIENTO (Thinking)
  if (status === 'processing') {
    return (
      <div className="relative min-h-screen text-white flex flex-col items-center justify-center bg-black overflow-hidden">
        <NeuralBackground />
        <div className="z-10 flex flex-col items-center animate-pulse">
           {/* Efecto de escaneo */}
           <div className="relative w-32 h-32 mb-8">
             <div className="absolute inset-0 border-4 border-sociedad-cyan rounded-full animate-spin border-t-transparent"></div>
             <div className="absolute inset-4 border-4 border-sociedad-blue rounded-full animate-spin border-b-transparent reverse-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-2xl">🧠</span>
             </div>
           </div>
           <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sociedad-cyan to-sociedad-blue tracking-widest">
             ANALIZANDO PERFIL...
           </h2>
           <p className="text-gray-500 text-sm mt-2">Encriptando datos en Database</p>
        </div>
      </div>
    );
  }

  // 2. PANTALLA FINAL (Completed)
  if (status === 'completed') {
    return (
      <div className="relative min-h-screen text-white flex flex-col items-center justify-center bg-black overflow-hidden p-6 text-center">
        <NeuralBackground />
        
        <div className="z-10 animate-in zoom-in duration-700 flex flex-col items-center max-w-2xl">
           {/* LOGO GIGANTE */}
           <div className="relative w-64 h-64 mb-8 drop-shadow-[0_0_30px_rgba(0,186,255,0.4)]">
             <Image src="/logo.png" alt="SIA Logo" fill className="object-contain" />
           </div>
           
           <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
             <span className="text-sociedad-cyan">Postulación</span> Recibida
           </h1>
           
           <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
             <p className="text-lg text-gray-300 leading-relaxed mb-4">
               Hemos registrado tu perfil exitosamente en la base de datos de <strong>SIAFI</strong>.
               Nuestro sistema de Inteligencia Artificial ha comenzado el protocolo de evaluación preliminar.
             </p>
             <p className="text-sociedad-cyan font-medium">
               Mantente atento a tu correo y celular. Te recomendamos seguir nuestras redes sociales.
             </p>
             <p className="text-sm text-gray-500 mt-6 uppercase tracking-widest">
               Fase 1: Completada
             </p>
           </div>

           <button onClick={() => window.location.reload()} className="mt-12 text-sm text-gray-600 hover:text-white transition-colors">
             Volver al inicio
           </button>
        </div>
      </div>
    );
  }

  // 3. PANTALLA DE EDICIÓN (Formulario Normal)
  return (
    <div className="relative min-h-screen text-white overflow-y-auto font-sans">
      <NeuralBackground />

      <div className="flex flex-col items-center justify-center min-h-screen p-4 z-10 relative py-10">
        
        {/* LOGO CABECERA (Más Grande: w-40) */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative w-40 h-40 transition-transform hover:scale-105 duration-500"> 
               <Image src="/logo.png" alt="SIA Logo" fill className="object-contain drop-shadow-[0_0_15px_rgba(0,186,255,0.5)]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Únete a <span className="text-sociedad-cyan">SIAFI</span>
          </h1>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className={`w-full max-w-2xl backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl transition-all duration-500 ${status === 'success_wait' ? 'opacity-0 scale-95' : 'opacity-100'}`}>
          
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded transition-all ${step >= i ? 'bg-sociedad-cyan shadow-[0_0_10px_#00baff]' : 'bg-gray-800'}`} />
            ))}
          </div>

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }}>
            
            {/* PASO 1 */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-sociedad-cyan pl-3">Identificación</h2>
                <input required placeholder="Nombre Completo" className="input-style w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none"
                  value={formData.nombre} onChange={e => handleChange("nombre", e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required type="email" placeholder="Email" className="input-style bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none"
                    value={formData.email} onChange={e => handleChange("email", e.target.value)} />
                  <input required type="tel" placeholder="Celular" className="input-style bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none"
                    value={formData.telefono} onChange={e => handleChange("telefono", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <input required placeholder="Carrera" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none"
                      value={formData.carrera} onChange={e => handleChange("carrera", e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <input required type="number" placeholder="Sem." min="1" max="12" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none text-center"
                      value={formData.semestre} onChange={e => handleChange("semestre", e.target.value)} />
                  </div>
                </div>

                {/* NÚCLEOS CON INDICACIÓN */}
                <div className="mt-6">
                  <label className="block text-sm text-sociedad-cyan mb-2 font-medium tracking-wide">
                    Selecciona el o los núcleos a los que te quieres postular:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {opcionesNucleos.map(op => (
                      <div key={op} onClick={() => handleNucleo(op)}
                       className={`cursor-pointer p-3 border rounded text-center text-sm font-medium transition-all ${formData.nucleos.includes(op) ? 'bg-sociedad-blue/40 border-sociedad-cyan text-white shadow-[0_0_10px_rgba(0,186,255,0.2)]' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}>
                        {op}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-dashed border-white/20 rounded p-4 text-center bg-black/20 mt-4 relative">
                    <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => {
                            const selected = e.target.files?.[0];
                            if (selected) {
                                if (selected.size > 5 * 1024 * 1024) { // Validación 5MB
                                    alert("El archivo pesa más de 5MB");
                                    return;
                                }
                                setFile(selected);
                                setFileName(selected.name);
                            }
                        }} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <span className="text-gray-400 text-sm">{fileName || "📂 Subir CV (PDF - Máx 5MB)"}</span>
                </div>
              </div>
            )}

            {/* PASO 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-sociedad-blue pl-3">Perfil SIAFI</h2>
                <textarea required rows={2} placeholder="¿Cuál crees que sería tu principal aportación al equipo?" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none text-sm"
                  value={formData.respuestas.aportacion} onChange={e => handleRespuesta("aportacion", e.target.value)} />
                <textarea required rows={2} placeholder="Describe un logro/proyecto del que te sientas más orgulloso" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none text-sm"
                  value={formData.respuestas.orgullo} onChange={e => handleRespuesta("orgullo", e.target.value)} />
                <textarea required rows={2} placeholder="¿Qué valoras más en la dinámica de trabajo en equipo?" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none text-sm"
                  value={formData.respuestas.inspiracion} onChange={e => handleRespuesta("inspiracion", e.target.value)} />
                <textarea required rows={2} placeholder="¿Por qué unirte a SIAFI?" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none text-sm"
                  value={formData.respuestas.motivo} onChange={e => handleRespuesta("motivo", e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input type="text" placeholder="¿Cómo te enteraste de nosotros?" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none text-sm"
                    value={formData.respuestas.fuente} onChange={e => handleRespuesta("fuente", e.target.value)} />
                   <input type="text" placeholder="Tus Áreas de Interés" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none text-sm"
                    value={formData.respuestas.areasInteres} onChange={e => handleRespuesta("areasInteres", e.target.value)} />
                </div>
                <textarea required rows={2} placeholder="¿Qué expectativas tienes?" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-sociedad-cyan outline-none text-sm"
                  value={formData.respuestas.expectativas} onChange={e => handleRespuesta("expectativas", e.target.value)} />
              </div>
            )}

            {/* PASO 3 */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 h-96 overflow-y-auto pr-2 custom-scrollbar">
                <h2 className="text-xl font-bold text-white mb-2 border-l-4 border-purple-500 pl-3">Evaluación Técnica (1-5)</h2>
                
                <div className="space-y-1">
                  <h3 className="text-sociedad-cyan font-bold text-sm uppercase tracking-wider mb-2">Lenguajes</h3>
                  {Object.keys(formData.skills.lenguajes).map(k => (
                    <StarRating key={k} label={k} value={formData.skills.lenguajes[k as keyof typeof formData.skills.lenguajes]} onChange={(v) => handleSkill("lenguajes", k, v)} />
                  ))}
                </div>
                <div className="space-y-1 pt-4 border-t border-white/10">
                  <h3 className="text-sociedad-cyan font-bold text-sm uppercase tracking-wider mb-2">Tecnologías IA/Robótica</h3>
                  {Object.keys(formData.skills.tecnologias).map(k => (
                    <StarRating key={k} label={k} value={formData.skills.tecnologias[k as keyof typeof formData.skills.tecnologias]} onChange={(v) => handleSkill("tecnologias", k, v)} />
                  ))}
                </div>
                <div className="space-y-1 pt-4 border-t border-white/10">
                  <h3 className="text-sociedad-cyan font-bold text-sm uppercase tracking-wider mb-2">Hardware</h3>
                  {Object.keys(formData.skills.micros).map(k => (
                    <StarRating key={k} label={k} value={formData.skills.micros[k as keyof typeof formData.skills.micros]} onChange={(v) => handleSkill("micros", k, v)} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl font-bold border border-white/20 text-gray-300 hover:bg-white/5">
                  Atrás
                </button>
              )}
              <button type="submit" disabled={loading || status !== 'editing'} className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-sociedad-blue to-sociedad-cyan text-white hover:scale-[1.02] transition-transform shadow-lg">
                {loading ? "Enviando..." : step === 3 ? "ENVIAR POSTULACIÓN" : "SIGUIENTE ➔"}
              </button>
            </div>
          </form>

          {mensaje && <div className={`mt-4 p-3 rounded text-center font-bold ${mensaje.includes("correctamente") ? "bg-green-500/20 text-green-400 border border-green-500/50" : "bg-red-500/20 text-red-400"}`}>{mensaje}</div>}
          
          <div className="mt-6 text-center border-t border-white/5 pt-4">
             <p className="text-xs text-gray-500 mb-1">¿Prefieres la versión clásica?</p>
             <a href="TU_LINK_DE_GOOGLE_FORMS" target="_blank" className="text-xs text-sociedad-cyan hover:underline">
               Abrir Formulario de Google
             </a>
          </div>

        </div>
      </div>
    </div>
  );
}