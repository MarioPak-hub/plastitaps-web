import React, { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Canvas3DErrorBoundary from './Canvas3DErrorBoundary';

export const INK_COLORS = [
  { hex: '#aee0f5', name: 'Transparente'         },
  { hex: '#ffffff', name: 'Blanco Ártico'         },
  { hex: '#000000', name: 'Negro Ónix'            },
  { hex: '#ef4444', name: 'Rojo Corporativo'      },
  { hex: '#3b82f6', name: 'Azul Cobalto'          },
  { hex: '#10b981', name: 'Verde Esmeralda'       },
  { hex: '#f59e0b', name: 'Ámbar Industrial'      },
  { hex: '#8b5cf6', name: 'Violeta Premium'       },
  { hex: '#ec4899', name: 'Rosa Flamingo'         },
];

export const TEMPLATES = [
  { id: 'none',      label: 'Transparente',      color: '#aee0f5' },
  { id: 'xmas',      label: '🎄 Navidad',        color: '#ef4444' },
  { id: 'grad',      label: '🎓 Graduación',     color: '#7c3aed' },
  { id: 'corporate', label: '🏢 Corporativo',    color: '#1e3a8a' },
];

// ── Ruta del modelo 3D real ──
const MODEL_PATH = '/models/Cafe 16oz.glb';

// ── Tamaño del canvas de textura ──
const TEX_SIZE = 1024;

/**
 * Crea un CanvasTexture que combina el color base con el logo del usuario.
 * El canvas 2D pinta:
 *   1. Fondo sólido del color elegido
 *   2. Logo centrado encima (respetando transparencia PNG)
 *
 * Devuelve la textura y un método para actualizarla.
 */
function useLogoTexture(color, logoUrl) {
  const canvasRef = useRef(null);
  const textureRef = useRef(null);
  const logoImageRef = useRef(null);
  const [, forceUpdate] = useState(0);

  // Inicializar canvas y textura una sola vez
  if (!canvasRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    canvasRef.current = canvas;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.flipY = false;
    textureRef.current = tex;
  }

  // Función para repintar el canvas
  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Fondo del color del vaso
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

    // 2. Logo centrado si existe
    const img = logoImageRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      const maxLogoSize = TEX_SIZE * 0.45;
      const aspect = img.naturalWidth / img.naturalHeight;
      let drawW, drawH;
      if (aspect >= 1) {
        drawW = maxLogoSize;
        drawH = maxLogoSize / aspect;
      } else {
        drawH = maxLogoSize;
        drawW = maxLogoSize * aspect;
      }
      const x = (TEX_SIZE - drawW) / 2;
      const y = (TEX_SIZE - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
    }

    // Marcar textura para re-upload a GPU
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [color]);

  // Cargar imagen del logo cuando cambie la URL
  useEffect(() => {
    if (!logoUrl) {
      logoImageRef.current = null;
      repaint();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImageRef.current = img;
      repaint();
      forceUpdate(n => n + 1);
    };
    img.onerror = (err) => {
      console.warn('[VasoViewer3D] Error cargando logo:', err);
      logoImageRef.current = null;
      repaint();
    };
    img.src = logoUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [logoUrl, repaint]);

  // Repintar cuando cambie el color
  useEffect(() => {
    repaint();
  }, [color, repaint]);

  return textureRef.current;
}

/**
 * Encuentra el mesh principal del vaso (el de mayor superficie geométrica).
 * Esto asegura que el logo se aplique al cuerpo del vaso, no a la tapa o base.
 */
function findMainMesh(object3d) {
  let best = null;
  let bestArea = 0;

  object3d.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;

    // Calcular bounding box como proxy del área
    child.geometry.computeBoundingBox();
    const bb = child.geometry.boundingBox;
    if (!bb) return;

    const size = new THREE.Vector3();
    bb.getSize(size);
    const area = size.x * size.y + size.y * size.z + size.x * size.z;

    if (area > bestArea) {
      bestArea = area;
      best = child;
    }
  });

  return best;
}

// ── Componente que carga el modelo GLB real y aplica la textura ──
function RealCupModel({ color, logo }) {
  const groupRef = useRef();
  const centered = useRef(false);
  const { scene } = useGLTF(MODEL_PATH);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const colorObj = useMemo(() => {
    try { return new THREE.Color(color); } catch { return new THREE.Color('#aee0f5'); }
  }, [color]);

  // Textura dinámica con logo
  const logoTexture = useLogoTexture(color, logo);

  // Aplicar color y textura a los materiales del modelo clonado
  useLayoutEffect(() => {
    const mainMesh = findMainMesh(clonedScene);

    clonedScene.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const material = child.material.clone();
      material.color.copy(colorObj);
      material.roughness = 0.2;
      material.metalness = 0.05;

      // Aplicar textura con logo solo al mesh principal
      if (child === mainMesh && logo && logoTexture) {
        material.map = logoTexture;
        material.needsUpdate = true;
      } else {
        material.map = null;
        material.needsUpdate = true;
      }

      child.material = material;
    });
  }, [clonedScene, colorObj, logo, logoTexture]);

  // One-shot centering + scaling
  useFrame(() => {
    if (centered.current || !groupRef.current) return;
    centered.current = true;

    groupRef.current.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const newScale = maxDim > 0 ? 2.2 / maxDim : 1;
    groupRef.current.scale.setScalar(newScale);
    clonedScene.position.sub(center);
  });

  // Rotación automática suave
  useFrame((_, delta) => {
    if (groupRef.current && centered.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Pre-cargar el modelo para evitar flashes
useGLTF.preload(MODEL_PATH);

// ── Canvas principal con el modelo 3D real ──
export default function VasoViewer3D({ color = '#aee0f5', logo }) {
  return (
    <div style={{ width: '100%', height: '420px' }}>
      <Canvas3DErrorBoundary>
        <Canvas
          shadows
          camera={{ position: [0, 1.2, 5], fov: 35 }}
          gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Iluminación optimizada para el modelo real */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[-4, 6, 4]}  intensity={4}   color="#c7d2fe" castShadow />
          <directionalLight position={[4, 4, -3]}  intensity={3.5} color="#f5d0fe" />
          <pointLight       position={[0, -3, 2]}  intensity={1.2} color="#bfdbfe" />
          <pointLight       position={[0,  5, 0]}  intensity={0.8} color="#ffffff" />
          <pointLight       position={[3,  0, 3]}  intensity={0.6} color="#e0e7ff" />

          <React.Suspense fallback={null}>
            <RealCupModel color={color} logo={logo} />
          </React.Suspense>

          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.6}
            minDistance={3}
            maxDistance={8}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </Canvas3DErrorBoundary>
    </div>
  );
}
