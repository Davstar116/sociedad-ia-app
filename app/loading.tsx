import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
      {/* Efecto de pulso en el logo */}
      <div className="relative w-32 h-32 animate-pulse">
        <Image 
          src="/logo.png" 
          alt="Cargando SophIA..." 
          fill 
          className="object-contain drop-shadow-[0_0_15px_rgba(0,186,255,0.6)]"
          priority
        />
      </div>
      
      {/* Spinner Sutil abajo */}
      <div className="mt-8 flex gap-2">
        <div className="w-3 h-3 bg-[#0051ff] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-[#00baff] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}