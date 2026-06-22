import React, { useRef, useMemo, useEffect } from 'react';
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

// ── Componente que carga el modelo GLB real y aplica el color ──
function RealCupModel({ color, modelPath }) {
  const groupRef = useRef();
  const centered = useRef(false);
  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const colorObj = useMemo(() => {
    try { return new THREE.Color(color); } catch { return new THREE.Color('#ffffff'); }
  }, [color]);

  // ── Tiñe todas las mallas del vaso con el color seleccionado ──
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const material = child.material.clone();
      material.roughness = 0.2;
      material.metalness = 0.05;
      material.map = null;
      material.color.copy(colorObj);
      material.needsUpdate = true;

      child.material = material;
    });
  }, [clonedScene, colorObj]);

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

// ── Canvas principal con el modelo 3D real ──
export default function VasoViewer3D({ color = '#ffffff', modelPath }) {
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
            <RealCupModel key={modelPath} color={color} modelPath={modelPath} />
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
