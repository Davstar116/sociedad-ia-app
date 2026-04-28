"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import SophiaAvatar from "../components/SophiaAvatar";
import Image from "next/image";

export default function SophiaPage() {
  const [isCalling, setIsCalling] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState("Desconectado");
  const [currentModel, setCurrentModel] = useState<string>("/sophia_informal.vrm");
  const [demoMode, setDemoMode] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string>("/Walking.vrma");
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const connectToSophia = () => {
    setStatusText("Iniciando conexión...");
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        sendAudioToBackend(audioBlob);
      };

      // Usamos el protocolo seguro (wss:) si estamos en HTTPS (túnel seguro), de lo contrario ws:
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Apuntamos al mismo host, y Next.js se encargará de redirigir el tráfico al backend (puerto 8000)
      const wsUrl = `${protocol}//${window.location.host}/ws/sophia`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setStatusText("EN LÍNEA");
        setIsCalling(true);
        setIsReady(true);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "text") {
          console.log("SophIA dice:", data.content);
        } else if (data.type === "audio") {
          const audio = new Audio("data:audio/mp3;base64," + data.content);
          audio.crossOrigin = "anonymous";
          audio.play();
          
          /* LIP-SYNC LÓGICA DE AUDIO (Mantenida intacta) */
          try {
             // @ts-ignore
             if (!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
             // @ts-ignore
             const ctx = window.audioCtx;
             const source = ctx.createMediaElementSource(audio);
             const analyser = ctx.createAnalyser();
             analyser.fftSize = 64; 
             
             source.connect(analyser);
             analyser.connect(ctx.destination);
             
             const dataArray = new Uint8Array(analyser.frequencyBinCount);
             
             const lipSyncLoop = () => {
               if (audio.paused || audio.ended) {
                 // @ts-ignore
                 window.currentLipSyncVolume = 0;
                 return;
               }
               analyser.getByteFrequencyData(dataArray);
               let sum = 0;
               for(let i=0; i<dataArray.length; i++) {
                 sum += dataArray[i];
               }
               let avg = sum / dataArray.length;
               // @ts-ignore
               window.currentLipSyncVolume = Math.min(1, avg / 128);
               requestAnimationFrame(lipSyncLoop);
             };
             lipSyncLoop();
          } catch(e) {
             console.error("No se pudo iniciar el Lip-Sync AudioContext", e);
          }
        }
      };

      wsRef.current.onerror = (e) => {
        console.error("WS Error", e);
        setStatusText("ERROR DE CONEXIÓN");
        setIsCalling(false);
      };

      wsRef.current.onclose = () => {
        setStatusText("DESCONECTADO");
        setIsCalling(false);
        setIsReady(false);
      };
    }).catch(err => {
      console.error("Permiso denegado para micrófono:", err);
      setStatusText("Sin acceso al micrófono");
    });
  };

  const sendAudioToBackend = async (blob: Blob) => {
    setStatusText("PENSANDO...");
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(",")[1];
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "audio",
          content: base64data
        }));
      }
    };
  };

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatusText("ESCUCHANDO...");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsCalling(false);
    setIsReady(false);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlay || !demoMode) return;
    
    const animations = [
      '/Walking.vrma',
      '/Sad Walk.vrma',
      '/Rumba Dancing.vrma',
      '/Singing.vrma',
      '/Dismissing Gesture.vrma',
      '/Clapping.vrma'
    ];
    
    const intervalId = setInterval(() => {
      setCurrentAnimation(prev => {
        const currentIndex = animations.indexOf(prev);
        const nextIndex = (currentIndex + 1) % animations.length;
        return animations[nextIndex];
      });
    }, 8000); // Cambia de animación cada 8 segundos
    
    return () => clearInterval(intervalId);
  }, [isAutoPlay, demoMode]);

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden select-none font-sans">
      
      {/* GLOW ATMOSFÉRICO DE FONDO */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#0051ff] opacity-[0.05] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00baff] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#0051ff] opacity-[0.04] blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER / BRANDING PLATAFORMA */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center gap-3 md:gap-5 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-[#111111]/80 backdrop-blur-xl border border-[#0051ff]/30 p-2 md:p-4 rounded-2xl md:rounded-3xl shadow-lg shadow-[#0051ff]/10">
          <div className="w-10 h-10 md:w-[68px] md:h-[68px] relative opacity-90">
            <Image src="/logo.png" fill alt="SIAFI" className="object-contain" />
          </div>
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            SophIA <span className="text-[#00baff] text-[8px] md:text-[10px] px-2 py-0.5 rounded-full bg-[#00baff]/10 border border-[#00baff]/30 tracking-wider font-bold">BETA 3D</span>
          </h1>
          <p className="text-[10px] md:text-xs text-[#0051ff] font-bold font-mono tracking-widest uppercase mt-0.5">SIAFI</p>
        </div>
      </div>

      {/* BADGE DE ESTADO DEL SERVIDOR Y CONTROLES DE VESTIMENTA */}
      <div className="absolute top-4 right-4 md:top-8 md:right-6 z-20 animate-in fade-in duration-1000 flex flex-col items-end gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3 bg-[#111111]/80 backdrop-blur-md px-3 md:px-4 py-2 md:py-2.5 rounded-full border border-gray-800 shadow-xl">
           <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
             isCalling 
               ? isRecording 
                 ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse' 
                 : 'bg-[#00baff] shadow-[0_0_12px_#00baff] animate-pulse'
               : 'bg-gray-600'
           }`}></div>
           <span className="text-gray-300 font-bold text-[9px] md:text-[11px] tracking-widest uppercase font-mono">
             {statusText}
           </span>
        </div>

        {/* SELECTOR DE VESTIMENTA */}
        <div className="grid grid-cols-2 md:flex bg-[#111111]/80 backdrop-blur-md p-1 rounded-xl md:rounded-2xl border border-gray-800 shadow-xl gap-1 md:gap-0">
          <button 
            onClick={() => setCurrentModel("/sophia_informal.vrm")} 
            className={`px-3 md:px-4 py-1.5 md:py-1.5 text-[9px] md:text-[11px] font-bold rounded-lg md:rounded-xl transition-all uppercase tracking-wider ${currentModel === "/sophia_informal.vrm" ? "bg-[#0051ff] text-white shadow-[0_0_15px_rgba(0,81,255,0.4)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            Informal
          </button>
          <button 
            onClick={() => setCurrentModel("/sophia_formal.vrm")} 
            className={`px-3 md:px-4 py-1.5 md:py-1.5 text-[9px] md:text-[11px] font-bold rounded-lg md:rounded-xl transition-all uppercase tracking-wider ${currentModel === "/sophia_formal.vrm" ? "bg-[#0051ff] text-white shadow-[0_0_15px_rgba(0,81,255,0.4)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            Formal
          </button>
          <button 
            onClick={() => setCurrentModel("/sophia_escolar.vrm")} 
            className={`px-3 md:px-4 py-1.5 md:py-1.5 text-[9px] md:text-[11px] font-bold rounded-lg md:rounded-xl transition-all uppercase tracking-wider ${currentModel === "/sophia_escolar.vrm" ? "bg-[#0051ff] text-white shadow-[0_0_15px_rgba(0,81,255,0.4)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            Escolar
          </button>
          <button 
            onClick={() => setCurrentModel("/sophia_vestido.vrm")} 
            className={`px-3 md:px-4 py-1.5 md:py-1.5 text-[9px] md:text-[11px] font-bold rounded-lg md:rounded-xl transition-all uppercase tracking-wider ${currentModel === "/sophia_vestido.vrm" ? "bg-[#0051ff] text-white shadow-[0_0_15px_rgba(0,81,255,0.4)]" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            Gala
          </button>
        </div>
      </div>

      {/* LIENZO 3D MAESTRO */}
      <div className="absolute inset-0 z-10">
        <Canvas shadows flat camera={{ position: [0, 1.2, 4.5], fov: 45 }}>
          {/* Ligeramente transparente para fusionar el glow del fondo HDMI */}
          <color attach="background" args={['#0a0a0a']} /> 
          
          <ambientLight intensity={0.1} />
          <directionalLight 
             position={[-2, 3, 5]} 
             intensity={3.0} 
             castShadow 
             shadow-mapSize={[1024, 1024]} 
             shadow-bias={-0.0001}
          />
          
          <Suspense fallback={null}>
            <SophiaAvatar isSpeaking={isCalling} modelUrl={currentModel} demoMode={demoMode} currentAnimation={currentAnimation} />
            <ContactShadows opacity={0.3} scale={10} blur={2} far={4} color="#000000" position={[0,0.5,0]} />
          </Suspense>
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2} 
            minDistance={2.0}
            maxDistance={6}
            target={[0, 0.5, 0]} 
          />
        </Canvas>
      </div>

      {/* PANELES DE CONTROL INFERIORES */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-full px-6">
        
        {/* PANEL CONECTAR */}
        {!isReady && !isCalling && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={connectToSophia}
              className="animate-in slide-in-from-bottom-8 duration-500 bg-[#0051ff] hover:bg-[#0041cc] text-white font-bold text-base py-4 px-12 rounded-2xl transition-all active:scale-95 shadow-[0_0_25px_rgba(0,81,255,0.4)] border border-[#00baff]/30"
            >
              Comenzar
            </button>

            <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-10 duration-700">
              <button
                onClick={() => setDemoMode(!demoMode)}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${demoMode ? 'bg-purple-600 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] text-white' : 'bg-transparent border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'}`}
              >
                {demoMode ? 'Ocultar Modo Prueba' : 'Modo Prueba'}
              </button>
              
              {demoMode && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap justify-center gap-2 max-w-lg bg-[#111111]/80 backdrop-blur-md p-2 md:p-3 rounded-2xl border border-gray-800 shadow-xl w-full">
                    {[
                      { name: 'Caminar', file: '/Walking.vrma' },
                      { name: 'Triste', file: '/Sad Walk.vrma' },
                      { name: 'Baile', file: '/Rumba Dancing.vrma' },
                      { name: 'Cantar', file: '/Singing.vrma' },
                      { name: 'Gesto No', file: '/Dismissing Gesture.vrma' },
                      { name: 'Aplaudir', file: '/Clapping.vrma' },
                    ].map((anim) => (
                      <button
                        key={anim.file}
                        onClick={() => {
                          setCurrentAnimation(anim.file);
                          setIsAutoPlay(false);
                        }}
                        className={`px-2 py-2 md:px-4 md:py-1.5 text-[9px] md:text-[10px] rounded-lg font-bold uppercase transition-all whitespace-nowrap text-center ${currentAnimation === anim.file && !isAutoPlay ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'}`}
                      >
                        {anim.name}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setIsAutoPlay(!isAutoPlay)}
                    className={`px-6 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${isAutoPlay ? 'bg-[#00baff] border-[#00baff] shadow-[0_0_15px_rgba(0,186,255,0.4)] text-white' : 'bg-transparent border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'}`}
                  >
                    {isAutoPlay ? '⏸ Detener Secuencia Automática' : '▶️ Reproducción Automática Continua'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL DE INTERACCIÓN ACTIVA */}
        {isReady && isCalling && (
          <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
             <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 shadow-[0_0_30px_#ef4444] scale-95' 
                  : 'bg-[#111111]/80 backdrop-blur-xl border-2 border-[#00baff] shadow-[0_0_20px_rgba(0,186,255,0.3)] hover:scale-105'
              }`}
            >
              🎤
            </button>
            <div className="flex flex-col items-center gap-1.5">
               <span className="text-gray-400 text-[10px] tracking-widest uppercase font-mono font-bold">
                 {isRecording ? 'Transmitiendo...' : 'Mantén pulsado para hablar'}
               </span>
               <button 
                  onClick={disconnect}
                  className="mt-2 text-red-500 hover:text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-red-500/20 border border-transparent hover:border-red-500/50 transition-all"
               >
                  Desconectar Enlace
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
