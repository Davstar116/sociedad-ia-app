import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin, VRM, VRMUtils } from "@pixiv/three-vrm";
import { createVRMAnimationClip, VRMAnimationLoaderPlugin } from "@pixiv/three-vrm-animation";

interface SophiaAvatarProps {
  isSpeaking: boolean;
  modelUrl: string;
  demoMode?: boolean;
  currentAnimation?: string;
}

export default function SophiaAvatar({ isSpeaking, modelUrl, demoMode, currentAnimation }: SophiaAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [vrm, setVrm] = useState<VRM | null>(null);
  
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    // Limpiamos el vrm anterior si existe
    setVrm(null);
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }
    currentActionRef.current = null;

    // Instanciamos el loader nativo que lee y activa los sistemas propietarios de VRoid
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      modelUrl, // Carga tu archivo 3D original
      (gltf) => {
        const vrmData = gltf.userData.vrm as VRM;
        
        // Optimizar de forma oficial para evitar cuellos de botella
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.removeUnnecessaryJoints(gltf.scene);
        
        // Activar sombras en todo el modelo sin romper la piel MToon oficial
        vrmData.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Configurar mixer para el nuevo VRM
        mixerRef.current = new THREE.AnimationMixer(vrmData.scene);

        setVrm(vrmData);
      },
      (progress) => console.log("Cargando Motor VRM...", progress),
      (error) => console.error("Error al cargar Motor VRM", error)
    );
  }, [modelUrl]);

  // Manejar el cambio de animaciones
  useEffect(() => {
    if (!vrm || !mixerRef.current || !demoMode || !currentAnimation) {
      // Si salimos del modo demo, hacemos fadeout de la animación actual
      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.5);
      }
      return;
    }

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
    
    loader.load(currentAnimation, (gltf) => {
      const vrmAnimations = gltf.userData.vrmAnimations;
      if (vrmAnimations && vrmAnimations.length > 0) {
        const vrmAnimation = vrmAnimations[0];
        // Crear el clip de animación adaptado a este VRM específico
        const clip = createVRMAnimationClip(vrmAnimation, vrm);
        const action = mixerRef.current!.clipAction(clip);
        
        // Transición suave entre animaciones
        if (currentActionRef.current) {
          currentActionRef.current.fadeOut(0.5);
        }
        
        action.reset();
        action.fadeIn(0.5);
        action.play();
        
        currentActionRef.current = action;
      }
    });
  }, [vrm, currentAnimation, demoMode]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Gravedad base sutil de nuestro mundo (Bajamos el avatar a -0.5 para que compense el nuevo tamaño gigante)
      groupRef.current.position.y = -0.5 + (demoMode ? 0 : Math.sin(t * 1.5) * 0.010);
    }

    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    if (vrm) {
       // --- MOTOR PIXIV DE FÍSICAS "SPRINGBONES" OFICIAL ---
       // Esto procesa automáticamente toda gravedad e inercia de forma purista
       vrm.update(delta);

       // --- IDLE BÁSICO Y POSTURA DE DESCANSO (Solo si no estamos en demo mode) ---
       if (!demoMode) {
           const spine = vrm.humanoid?.getNormalizedBoneNode("spine");
           const neck = vrm.humanoid?.getNormalizedBoneNode("neck");
           const leftArm = vrm.humanoid?.getNormalizedBoneNode("leftUpperArm");
           const rightArm = vrm.humanoid?.getNormalizedBoneNode("rightUpperArm");

           if (leftArm) leftArm.rotation.z = -1.2 + Math.sin(t * 1.5) * 0.02;
           if (rightArm) rightArm.rotation.z = 1.2 - Math.sin(t * 1.5) * 0.02;

           if (spine) {
              spine.rotation.z = Math.sin(t * 1.2) * 0.01;
              spine.rotation.x = Math.sin(t * 1.8) * 0.01; 
           }
           if (neck) neck.rotation.y = Math.sin(t * 0.8) * 0.02;
       }

       // --- LÓGICA DE ESTADO "HABLANDO" Y LIPSYNC OFICIAL VRM ---
       // @ts-ignore
       const volume = window.currentLipSyncVolume || 0;
       const head = vrm.humanoid?.getNormalizedBoneNode("head");

       if (head && volume > 0) {
         head.rotation.x = (volume * 0.05) * Math.sin(t * 15);
       } else if (head && !demoMode) {
         head.rotation.x *= 0.9;
       }

       // VRM Expression Manager controla de forma nativa la boca y los ojos
       if (vrm.expressionManager) {
           const targetOpen = volume * 1.5;
           const currentAa = vrm.expressionManager.getValue("aa") || 0;
           vrm.expressionManager.setValue("aa", currentAa + (targetOpen - currentAa) * 0.4);
       }
    }
  });

  return (
    // Hemos aumentado muchísimo la escala de 1.2 a 1.4 y empujado hacia abajo a -0.5 para excelente encuadre.
    <group ref={groupRef} position={[0, -0.5, 0]} scale={[1.4, 1.4, 1.4]}>
      {/* Inserta a SophIA renderizada con su propio motor japonés */}
      {vrm && <primitive object={vrm.scene} />}
    </group>
  );
}
