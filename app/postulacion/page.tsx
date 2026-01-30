"use client";

import { useState } from "react";
import NetworkBackground from "@/app/components/ui/NetworkBackground";
import Image from "next/image";
import Link from "next/link";

// Componente StarRating
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
            className={`text-xl transition-all ${star <= value ? 'text-[#00baff] scale-110 drop-shadow-[0_0_5px_rgba(0,186,255,0.8)]' : 'text-gray-600 hover:text-gray-400'}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
};

export default function PostulacionPage() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'editing' | 'success_wait' | 'processing' | 'completed'>('editing');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [fileName, setFileName] = useState("");

  const [formData, setFormData] = useState({
    nombre: "", // UNIFICADO: Nombre Completo
    email: "", 
    telefono: "", 
    carrera: "", 
    semestre: "", 
    nucleos: [] as string[], 
    cvLink: "", 
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
    // @ts-ignore
    setFormData(p => ({ ...p, skills: { ...p.skills, [cat]: { ...p.skills[cat], [key]: val } } }));
  };
  
  const handleNucleo = (n: string) => {
    setFormData(p => ({ ...p, nucleos: p.nucleos.includes(n) ? p.nucleos.filter(x => x !== n) : [...p.nucleos, n] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    try {
      let finalCvLink = formData.cvLink;

      // 1. SUBIDA CV
      if (file) {
        setMensaje("Subiendo documento...");
        // Usamos solo el nombre completo para el archivo
        const uniqueName = `${formData.nombre.replace(/\s+/g, '_')}_CV.pdf`;
        
        try {
            const responseUpload = await fetch(`/api/upload?filename=${encodeURIComponent(uniqueName)}`, { method: 'POST', body: file });
            if (responseUpload.ok) {
                const newBlob = await responseUpload.json();
                finalCvLink = newBlob.url;
            }
        } catch (err) {
            console.warn("Error subiendo archivo (continuando sin link)", err);
        }
      }

      // 2. ENVÍO A LA API MAESTRA
      const dataToSend = {
        nombre: formData.nombre, // Solo enviamos el nombre completo
        email: formData.email,
        celular: formData.telefono,
        carrera: formData.carrera,
        semestre: formData.semestre,
        nucleos: formData.nucleos, // Enviamos el array directo
        respuestas: formData.respuestas,
        skills: formData.skills,
        cvLink: finalCvLink
      };

      setMensaje("Procesando perfil y generando credenciales...");
      
      const res = await fetch("/api/register", {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(dataToSend)
      });

      if (res.ok) {
        setMensaje("¡Éxito!");
        setStatus('success_wait');
        setTimeout(() => setStatus('processing'), 1500);
        setTimeout(() => setStatus('completed'), 4000);
      } else {
        const err = await res.json();
        setMensaje("Error: " + (err.error || "Algo salió mal"));
        setLoading(false);
      }
    } catch (error: any) {
      console.error(error);
      setMensaje("Error de conexión");
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---

  if (status === 'processing') {
    return (
      <div className="relative min-h-screen text-white flex flex-col items-center justify-center bg-black overflow-hidden">
        <NetworkBackground />
        <div className="z-10 flex flex-col items-center animate-pulse">
           <div className="relative w-32 h-32 mb-8">
             <div className="absolute inset-0 border-4 border-[#00baff] rounded-full animate-spin border-t-transparent"></div>
             <div className="absolute inset-4 border-4 border-[#0051ff] rounded-full animate-spin border-b-transparent reverse-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl">🧠</span></div>
           </div>
           <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00baff] to-[#0051ff] tracking-widest">PROCESANDO PERFIL...</h2>
           <p className="text-gray-500 text-sm mt-2">Generando cuenta de acceso</p>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="relative min-h-screen text-white flex flex-col items-center justify-center bg-black overflow-hidden p-6 text-center">
        <NetworkBackground />
        <div className="z-10 animate-in zoom-in duration-700 flex flex-col items-center max-w-2xl">
           <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight"><span className="text-[#00baff]">Postulación</span> Exitosa</h1>
           <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
             <p className="text-lg text-gray-300 leading-relaxed mb-4">Tus respuestas han sido guardadas y tu cuenta ha sido creada.</p>
             <p className="text-[#00baff] font-medium text-xl mb-2">📩 Revisa tu correo</p>
             <p className="text-sm text-gray-400">Te enviamos tus credenciales de acceso.</p>
           </div>
           <Link href="/login" className="mt-8 px-8 py-3 bg-gradient-to-r from-[#0051ff] to-[#00baff] rounded-full font-bold text-white hover:scale-105 transition-transform">Ir al Portal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white overflow-y-auto font-sans">
      <NetworkBackground />
      <div className="flex flex-col items-center justify-center min-h-screen p-4 z-10 relative py-10">
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Únete a <span className="text-[#00baff]">SIAFI</span></h1>
        </div>

        <div className={`w-full max-w-2xl backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl transition-all duration-500 ${status === 'success_wait' ? 'opacity-0 scale-95' : 'opacity-100'}`}>
          
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(i => (<div key={i} className={`h-1 flex-1 rounded transition-all ${step >= i ? 'bg-[#00baff] shadow-[0_0_10px_#00baff]' : 'bg-gray-800'}`} />))}
          </div>

          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }}>
            
            {/* PASO 1: DATOS PERSONALES */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-[#00baff] pl-3">Identificación</h2>
                
                {/* NOMBRE COMPLETO UNIFICADO */}
                <div>
                    <input required placeholder="Nombre Completo" className="input-style w-full bg-black/30 border border-white/10 rounded p-3 focus:border-[#00baff] outline-none"
                    value={formData.nombre} onChange={e => handleChange("nombre", e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required type="email" placeholder="Email" className="input-style bg-black/30 border border-white/10 rounded p-3 focus:border-[#00baff] outline-none"
                    value={formData.email} onChange={e => handleChange("email", e.target.value)} />
                  <input required type="tel" placeholder="Celular" className="input-style bg-black/30 border border-white/10 rounded p-3 focus:border-[#00baff] outline-none"
                    value={formData.telefono} onChange={e => handleChange("telefono", e.target.value)} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <input required placeholder="Carrera" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-[#00baff] outline-none"
                      value={formData.carrera} onChange={e => handleChange("carrera", e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <input required type="number" placeholder="Semestre" min="1" max="12" className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-[#00baff] outline-none text-center"
                      value={formData.semestre} onChange={e => handleChange("semestre", e.target.value)} />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm text-[#00baff] mb-2 font-medium tracking-wide">Selecciona el o los núcleos:</label>
                  <div className="grid grid-cols-2 gap-3">
                    {opcionesNucleos.map(op => (
                      <div key={op} onClick={() => handleNucleo(op)} className={`cursor-pointer p-3 border rounded text-center text-sm font-medium transition-all ${formData.nucleos.includes(op) ? 'bg-[#0051ff]/40 border-[#00baff] text-white' : 'border-white/10 text-gray-400'}`}>
                        {op}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-dashed border-white/20 rounded p-4 text-center bg-black/20 mt-4 relative">
                    <input type="file" accept=".pdf" onChange={(e) => {
                        const f = e.target.files?.[0]; 
                        if(f) { setFile(f); setFileName(f.name); }
                    }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <span className="text-gray-400 text-sm">{fileName || "📂 Subir CV (PDF - Máx 5MB)"}</span>
                </div>
              </div>
            )}

            {/* PASO 2: RESPUESTAS */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-[#0051ff] pl-3">Perfil SIAFI</h2>
                {Object.keys(formData.respuestas).map((key) => {
                    const placeholders: any = {
                        aportacion: "¿Cuál sería tu principal aportación?",
                        orgullo: "Logro del que te sientas más orgulloso",
                        inspiracion: "¿Qué valoras en trabajo en equipo?",
                        motivo: "¿Por qué unirte a SIAFI?",
                        fuente: "¿Cómo te enteraste de nosotros?",
                        expectativas: "¿Qué expectativas tienes?",
                        areasInteres: "Tus Áreas de Interés"
                    };
                    const isShort = key === 'fuente' || key === 'areasInteres';
                    return isShort ? (
                        <input key={key} type="text" placeholder={placeholders[key]} className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-[#00baff] outline-none text-sm"
                        value={(formData.respuestas as any)[key]} onChange={e => handleRespuesta(key, e.target.value)} />
                    ) : (
                        <textarea key={key} rows={2} placeholder={placeholders[key]} className="w-full bg-black/30 border border-white/10 rounded p-3 focus:border-[#00baff] outline-none text-sm"
                        value={(formData.respuestas as any)[key]} onChange={e => handleRespuesta(key, e.target.value)} />
                    );
                })}
              </div>
            )}

            {/* PASO 3: SKILLS */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 h-96 overflow-y-auto pr-2 custom-scrollbar">
                <h2 className="text-xl font-bold text-white mb-2 border-l-4 border-purple-500 pl-3">Evaluación Técnica</h2>
                <div className="space-y-1"><h3 className="text-[#00baff] font-bold text-sm uppercase tracking-wider mb-2">Lenguajes</h3>{Object.keys(formData.skills.lenguajes).map(k => (
                  // @ts-ignore
                  <StarRating key={k} label={k} value={formData.skills.lenguajes[k]} onChange={(v) => handleSkill("lenguajes", k, v)} />))}</div>
                <div className="space-y-1 pt-4 border-t border-white/10"><h3 className="text-[#00baff] font-bold text-sm uppercase tracking-wider mb-2">Tecnologías</h3>{Object.keys(formData.skills.tecnologias).map(k => (
                  // @ts-ignore
                  <StarRating key={k} label={k} value={formData.skills.tecnologias[k]} onChange={(v) => handleSkill("tecnologias", k, v)} />))}</div>
                <div className="space-y-1 pt-4 border-t border-white/10"><h3 className="text-[#00baff] font-bold text-sm uppercase tracking-wider mb-2">Hardware</h3>{Object.keys(formData.skills.micros).map(k => (
                  // @ts-ignore
                  <StarRating key={k} label={k} value={formData.skills.micros[k]} onChange={(v) => handleSkill("micros", k, v)} />))}</div>
              </div>
            )}

            <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
              {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl font-bold border border-white/20 text-gray-300 hover:bg-white/5">Atrás</button>}
              <button type="submit" disabled={loading || status !== 'editing'} className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-[#0051ff] to-[#00baff] text-white hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50">
                {loading ? "Enviando..." : step === 3 ? "ENVIAR POSTULACIÓN" : "SIGUIENTE ➔"}
              </button>
            </div>
          </form>
          {mensaje && <div className={`mt-4 p-3 rounded text-center font-bold ${mensaje.includes("Éxito") ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-300"}`}>{mensaje}</div>}
        </div>
      </div>
    </div>
  );
}