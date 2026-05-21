import React, { useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Canvas3DErrorBoundary from './Canvas3DErrorBoundary';

export const INK_COLORS = [
  { hex: '#ffffff', name: 'Blanco Ártico' },
  { hex: '#000000', name: 'Negro Ónix' },
  { hex: '#ef4444', name: 'Rojo Corporativo' },
  { hex: '#3b82f6', name: 'Azul Cobalto' },
  { hex: '#10b981', name: 'Verde Esmeralda' },
  { hex: '#f59e0b', name: 'Ámbar Industrial' },
  { hex: '#8b5cf6', name: 'Violeta Premium' },
  { hex: '#ec4899', name: 'Rosa Flamingo' },
];

export const TEMPLATES = [
  { id: 'none', label: 'Transparente', color: '#aee0f5' },
  { id: 'xmas', label: '🎄 Navidad', color: '#ef4444' },
  { id: 'grad', label: '🎓 Graduación', color: '#7c3aed' },
  { id: 'corporate', label: '🏢 Corporativo', color: '#1e3a8a' },
];

// ── Ruta del modelo 3D real ──
const MODEL_PATH = '/models/Cafe 16oz.glb';

// ── Tamaño del canvas de textura — Rectangular para compensar estiramiento cilíndrico ──
const TEX_W = 2048;
const TEX_H = 1024;

/**
 * Genera coordenadas UV cilíndricas para una geometría que carece de ellas.
 * Proyecta U = ángulo alrededor del eje Y, V = altura normalizada.
 * Esto es ideal para vasos, botellas, y cilindros en general.
 */
function generateCylindricalUVs(geometry) {
  const pos = geometry.attributes.position;
  if (!pos) return;

  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const minY = bb.min.y;
  const height = bb.max.y - bb.min.y || 1;

  const uvs = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // U: ángulo en el plano XZ, normalizado a [0, 1]
    let u = Math.atan2(z, x); // rango [-PI, PI]
    u = (u + Math.PI) / (2 * Math.PI); // normalizar a [0, 1]

    // V: altura normalizada
    const v = (y - minY) / height;

    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
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
    try { return new THREE.Color(color); } catch { return new THREE.Color('#ffffff'); }
  }, [color]);

  // ── Refs para gestión de textura ──
  const canvasRef = useRef(null);
  const textureRef = useRef(null);
  const logoImgRef = useRef(null);
  const [texVersion, setTexVersion] = useState(0);

  // Inicializar canvas y textura una sola vez (lazy init)
  if (!canvasRef.current) {
    const c = document.createElement('canvas');
    c.width = TEX_W;
    c.height = TEX_H;
    canvasRef.current = c;

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false; // GLB estándar usa flipY=false
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    textureRef.current = tex;
  }

  // Función para pintar el canvas con color base + logo
  const paintCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. Fondo sólido del color del vaso
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    // 2. Logo centrado y proporcional
    const img = logoImgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      // Use 30% of texture width as max logo dimension to avoid oversizing
      const maxW = TEX_W * 0.30;
      const maxH = TEX_H * 0.35;
      const aspect = img.naturalWidth / img.naturalHeight;

      let drawW, drawH;
      if (aspect >= 1) {
        // Landscape: fit to maxW
        drawW = Math.min(maxW, img.naturalWidth);
        drawH = drawW / aspect;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH * aspect;
        }
      } else {
        // Portrait: fit to maxH
        drawH = Math.min(maxH, img.naturalHeight);
        drawW = drawH * aspect;
        if (drawW > maxW) {
          drawW = maxW;
          drawH = drawW / aspect;
        }
      }

      // Center the logo on the canvas
      const x = (TEX_W - drawW) / 2;
      const y = (TEX_H - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
    }

    // Marcar textura para re-upload a GPU
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
    // Incrementar version para forzar re-aplicación del material
    setTexVersion(v => v + 1);
  }, [color]);

  // Cargar imagen del logo cuando cambie la URL
  useEffect(() => {
    if (!logo) {
      logoImgRef.current = null;
      paintCanvas();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImgRef.current = img;
      paintCanvas();
    };
    img.onerror = () => {
      logoImgRef.current = null;
      paintCanvas();
    };
    img.src = logo;

    return () => { img.onload = null; img.onerror = null; };
  }, [logo, paintCanvas]);

  // Repintar cuando cambia el color
  useEffect(() => {
    paintCanvas();
  }, [color, paintCanvas]);

  // ── Generar UVs + Aplicar materiales ──
  useLayoutEffect(() => {
    const mainMesh = findMainMesh(clonedScene);

    // Compute actual cylinder aspect ratio for texture repeat compensation
    let cylinderAspect = 1;
    if (mainMesh && mainMesh.geometry) {
      mainMesh.geometry.computeBoundingBox();
      const bb = mainMesh.geometry.boundingBox;
      if (bb) {
        const size = new THREE.Vector3();
        bb.getSize(size);
        // Approximate circumference vs height ratio
        const radius = Math.max(size.x, size.z) / 2;
        const circumference = 2 * Math.PI * radius;
        const height = size.y || 1;
        cylinderAspect = circumference / height;
      }
    }

    clonedScene.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;

      // Generar UVs cilíndricos si no existen
      if (!child.geometry.attributes.uv) {
        generateCylindricalUVs(child.geometry);
      }

      if (!child.material) return;

      const material = child.material.clone();
      material.roughness = 0.2;
      material.metalness = 0.05;

      // Aplicar textura con logo solo al mesh principal
      if (child === mainMesh && logo && textureRef.current) {
        textureRef.current.repeat.set(1, 1);
        textureRef.current.offset.set(0, 0);
        material.map = textureRef.current;
        material.color.setHex(0xffffff); // blanco para no teñir la textura
        material.needsUpdate = true;
      } else {
        material.map = null;
        material.color.copy(colorObj);
        material.needsUpdate = true;
      }

      child.material = material;
    });
  }, [clonedScene, colorObj, logo, texVersion]);

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
export default function VasoViewer3D({ color = '#ffffff', logo }) {
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
          <directionalLight position={[-4, 6, 4]} intensity={4} color="#c7d2fe" castShadow />
          <directionalLight position={[4, 4, -3]} intensity={3.5} color="#f5d0fe" />
          <pointLight position={[0, -3, 2]} intensity={1.2} color="#bfdbfe" />
          <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffffff" />
          <pointLight position={[3, 0, 3]} intensity={0.6} color="#e0e7ff" />

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
