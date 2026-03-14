"use client";

import { useState } from "react";
import Link from "next/link";
// Hemos removido NetworkBackground para usar fondos sólidos

// Componente StarRating (Rediseñado para encajar en el minimalismo)
const StarRating = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => {
  return (
    <div className="flex justify-between items-center mb-2 bg-[#0a0a0a] p-3 rounded-xl border border-gray-800 hover:border-[#0051ff]/30 transition-colors">
      <span className="text-sm text-gray-300 font-medium">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-xl transition-all ${
              star <= value 
                ? 'text-[#00baff] scale-110 drop-shadow-[0_0_8px_rgba(0,186,255,0.4)]' 
                : 'text-gray-700 hover:text-gray-500'
            }`}
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
    nombre: "", 
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
        nombre: formData.nombre,
        email: formData.email,
        celular: formData.telefono,
        carrera: formData.carrera,
        semestre: formData.semestre,
        nucleos: formData.nucleos,
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

      let dataRes;
      try {
        dataRes = await res.json();
      } catch (e) {
        console.error("Error parseando JSON:", e);
        throw new Error(`Error crítico del servidor (${res.status}). Revisa los logs.`);
      }

      if (res.ok) {
        setMensaje("¡Éxito!");
        setStatus('success_wait');
        setTimeout(() => setStatus('processing'), 1500);
        setTimeout(() => setStatus('completed'), 4000);
      } else {
        setMensaje("Error Servidor: " + (dataRes.error || dataRes.message || "Error desconocido"));
        setLoading(false);
      }

    } catch (error: any) {
      console.error(error);
      setMensaje("Fallo Técnico: " + (error.message || "Error de red"));
      setLoading(false);
    }
  };

  // --- RENDERIZADO: PANTALLA DE PROCESAMIENTO ---
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center animate-pulse">
           <div className="text-6xl mb-6">⚙️</div>
           <h2 className="text-2xl font-black text-white tracking-widest uppercase">Procesando Perfil</h2>
           <p className="text-gray-500 text-sm mt-2">Analizando datos y generando credenciales...</p>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: PANTALLA DE ÉXITO ---
  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="animate-in zoom-in duration-700 flex flex-col items-center max-w-md w-full bg-[#111111] border border-gray-800 p-10 rounded-2xl shadow-2xl">
           <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6 border border-green-500/20">
             ✓
           </div>
           <h1 className="text-3xl font-black mb-4 text-white tracking-tight">Postulación Exitosa</h1>
           <p className="text-sm text-gray-400 leading-relaxed mb-6">
             Tus respuestas han sido guardadas. Hemos creado tu cuenta de acceso temporal para continuar con el proceso.
           </p>
           <div className="w-full bg-[#0a0a0a] border border-gray-800 p-4 rounded-xl mb-8">
             <p className="text-[#00baff] font-bold text-sm uppercase tracking-wider mb-1">📩 Revisa tu correo</p>
             <p className="text-xs text-gray-500">Te hemos enviado tus credenciales de acceso.</p>
           </div>
           <Link href="/login" className="w-full py-4 bg-[#0051ff] hover:bg-[#0041cc] rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-[#0051ff]/20">
             Ir al Portal de Acceso
           </Link>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: FORMULARIO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center p-4 py-12">
      
      {/* Header Formulario */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-2">Únete a <span className="text-[#00baff]">SIAFI</span></h1>
        <p className="text-gray-400 text-sm">Reclutamiento 2026-2</p>
      </div>

      {/* Contenedor Principal de la Tarjeta */}
      <div className={`w-full max-w-3xl bg-[#111111] border border-[#0051ff]/30 rounded-2xl p-6 md:p-10 shadow-2xl shadow-black/50 transition-all duration-500 ${status === 'success_wait' ? 'opacity-0 scale-95' : 'opacity-100'}`}>
        
        {/* Barra de Progreso Minimalista */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                step >= i ? 'bg-[#0051ff]' : 'bg-gray-800'
              }`} 
            />
          ))}
        </div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(s => s + 1); }}>
          
          {/* --- PASO 1: DATOS PERSONALES --- */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-8">
              <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">Identificación</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Paso 1 de 3</p>
              </div>
              
              <input required placeholder="Nombre Completo" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
              value={formData.nombre} onChange={e => handleChange("nombre", e.target.value)} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input required type="email" placeholder="Correo electrónico" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
                value={formData.email} onChange={e => handleChange("email", e.target.value)} />
                
                <input required type="tel" placeholder="Celular (10 dígitos)" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
                value={formData.telefono} onChange={e => handleChange("telefono", e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2">
                  <input required placeholder="Carrera" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
                  value={formData.carrera} onChange={e => handleChange("carrera", e.target.value)} />
                </div>
                <div className="col-span-1">
                  <input required type="number" placeholder="Semestre" min="1" max="12" className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm text-center focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
                  value={formData.semestre} onChange={e => handleChange("semestre", e.target.value)} />
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-xs text-gray-400 mb-3 font-bold uppercase tracking-widest">Núcleos de Interés (Selecciona uno o más)</label>
                <div className="grid grid-cols-2 gap-3">
                  {opcionesNucleos.map(op => (
                    <div 
                        key={op} 
                        onClick={() => handleNucleo(op)} 
                        className={`cursor-pointer p-4 border rounded-xl text-center text-sm font-bold transition-all ${
                            formData.nucleos.includes(op) 
                            ? 'bg-[#0051ff]/10 border-[#0051ff] text-[#00baff]' 
                            : 'bg-[#0a0a0a] border-gray-800 text-gray-500 hover:border-gray-600'
                        }`}
                    >
                      {op}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-800 hover:border-[#0051ff]/50 rounded-xl p-6 text-center bg-[#0a0a0a] mt-6 relative transition-all">
                  <input type="file" accept=".pdf" onChange={(e) => {
                      const f = e.target.files?.[0]; 
                      if(f) { setFile(f); setFileName(f.name); }
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="text-3xl mb-2">📄</div>
                  <span className="text-gray-400 text-sm font-medium">{fileName || "Haz clic o arrastra tu CV (PDF - Máx 5MB)"}</span>
              </div>
            </div>
          )}

          {/* --- PASO 2: RESPUESTAS --- */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-8">
              <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">Perfil SIAFI</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Paso 2 de 3</p>
              </div>

              {Object.keys(formData.respuestas).map((key) => {
                  const placeholders: any = {
                      aportacion: "¿Cuál sería tu principal aportación al equipo?",
                      orgullo: "Menciona un logro del que te sientas más orgullos@",
                      inspiracion: "¿Qué valoras más al trabajar en equipo?",
                      motivo: "¿Por qué te gustaría unirte a SIAFI?",
                      fuente: "¿Cómo te enteraste de nuestra convocatoria?",
                      expectativas: "¿Qué expectativas tienes al ingresar?",
                      areasInteres: "Menciona tus áreas de interés principales"
                  };
                  const isShort = key === 'fuente' || key === 'areasInteres';
                  return isShort ? (
                      <input key={key} type="text" placeholder={placeholders[key]} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600"
                      value={(formData.respuestas as any)[key]} onChange={e => handleRespuesta(key, e.target.value)} />
                  ) : (
                      <textarea key={key} rows={3} placeholder={placeholders[key]} className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-sm focus:border-[#0051ff] focus:ring-1 focus:ring-[#0051ff]/30 outline-none transition-all placeholder:text-gray-600 resize-none"
                      value={(formData.respuestas as any)[key]} onChange={e => handleRespuesta(key, e.target.value)} />
                  );
              })}
            </div>
          )}

          {/* --- PASO 3: SKILLS --- */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="sticky top-0 bg-[#111111] pt-2 pb-4 z-10 border-b border-gray-800 mb-4">
                  <h2 className="text-2xl font-bold text-white mb-1">Evaluación Técnica</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Paso 3 de 3 · Sé honesto con tu nivel (1 Básico - 5 Experto)</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-[#0051ff] font-bold text-sm uppercase tracking-widest mb-3">Lenguajes de Programación</h3>
                {Object.keys(formData.skills.lenguajes).map(k => (
                  // @ts-ignore
                  <StarRating key={k} label={k} value={formData.skills.lenguajes[k]} onChange={(v) => handleSkill("lenguajes", k, v)} />
                ))}
              </div>
              
              <div className="space-y-2 pt-6">
                <h3 className="text-[#0051ff] font-bold text-sm uppercase tracking-widest mb-3">Tecnologías / Frameworks</h3>
                {Object.keys(formData.skills.tecnologias).map(k => (
                  // @ts-ignore
                  <StarRating key={k} label={k} value={formData.skills.tecnologias[k]} onChange={(v) => handleSkill("tecnologias", k, v)} />
                ))}
              </div>
              
              <div className="space-y-2 pt-6">
                <h3 className="text-[#0051ff] font-bold text-sm uppercase tracking-widest mb-3">Hardware / Microcontroladores</h3>
                {Object.keys(formData.skills.micros).map(k => (
                  // @ts-ignore
                  <StarRating key={k} label={k} value={formData.skills.micros[k]} onChange={(v) => handleSkill("micros", k, v)} />
                ))}
              </div>
            </div>
          )}

          {/* BOTONES DE NAVEGACIÓN */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-800">
            {step > 1 && (
                <button 
                    type="button" 
                    onClick={() => setStep(s => s - 1)} 
                    className="px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
                >
                    Atrás
                </button>
            )}
            
            <button 
                type="submit" 
                disabled={loading || status !== 'editing'} 
                className="flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0051ff] hover:bg-[#0041cc] text-white transition-all active:scale-95 shadow-lg shadow-[#0051ff]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : step === 3 ? "Enviar Postulación" : "Siguiente"}
            </button>
          </div>

        </form>

        {/* FEEDBACK MESAJE */}
        {mensaje && (
            <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold border ${
                mensaje.includes("Éxito") 
                ? "bg-green-950/30 border-green-500/30 text-green-400" 
                : "bg-blue-950/30 border-blue-500/30 text-[#00baff]"
            }`}>
                {mensaje}
            </div>
        )}
      </div>

    </div>
  );
}