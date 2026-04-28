import asyncio
import json
import base64
import tempfile
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import ollama
import whisper
import edge_tts

app = FastAPI()

print("Cargando modelo Whisper en memoria (esto tomará unos segundos)...")
whisper_model = whisper.load_model("base") 
print("¡Modelo Whisper listo!")

SYSTEM_PROMPT = """Eres SophIA, la Inteligencia Artificial encarnada de la Sociedad IA. 
Eres carismática, muy natural y amigable. Respondes con energía.
Es INDISPENSABLE que respondas de forma sumamente concisa (1 a 3 oraciones cortas máximo). 
Actúa como si estuvieras en una videollamada real."""

# Voz de TTS (Gratuita, alta fidelidad, latencia ultra baja de Microsoft)
TTS_VOICE = "es-MX-DaliaNeural" 

def transcribe_audio(base64_audio: str) -> str:
    audio_bytes = base64.b64decode(base64_audio)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        temp_audio.write(audio_bytes)
        temp_filepath = temp_audio.name

    try:
        result = whisper_model.transcribe(temp_filepath, language="es")
        text = result["text"].strip()
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
            
    return text

async def generate_speech_base64(text: str) -> str:
    """Usa edge-tts para generar audio super rápido y lo devuelve en base64"""
    communicate = edge_tts.Communicate(text, TTS_VOICE)
    audio_data = bytearray()
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.extend(chunk["data"])
            
    return base64.b64encode(audio_data).decode('utf-8')

@app.websocket("/ws/sophia")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("📱 Cliente frontend conectado a SophIA")
    
    chat_history = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            user_text = ""

            if message.get("type") == "text":
                user_text = message["content"]
                print(f"[{'Usuario (Texto)'}] -> {user_text}")

            elif message.get("type") == "audio":
                print("🎤 Grabación recibida. Procesando STT...")
                base64_audio = message["content"]
                user_text = transcribe_audio(base64_audio)
                print(f"[{'Usuario (🎙️)'}] -> {user_text}")

            if user_text:
                chat_history.append({"role": "user", "content": user_text})

                # 1. PENSAR (LLM)
                print("🧠 Llama 3 Pensando...")
                response = ollama.chat(model='llama3', messages=chat_history)
                ia_text = response['message']['content']
                print(f"[SophIA text] -> {ia_text}")
                chat_history.append({"role": "assistant", "content": ia_text})

                # 2. ENVIAR TEXTO
                await websocket.send_json({
                    "type": "text",
                    "content": ia_text
                })
                
                # 3. GENERAR VOZ (TTS) Y ENVIAR AL FRONTEND
                print("🔊 Sintetizando voz neuronal rápida...")
                tts_base64 = await generate_speech_base64(ia_text)
                await websocket.send_json({
                    "type": "audio",
                    "content": tts_base64
                })
                print("✅ Audio de SophIA procesado y enviado con éxito al navegador.")

    except WebSocketDisconnect:
        print("🔌 Cliente desconectado")
