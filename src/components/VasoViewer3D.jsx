import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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

// ── The 3D cup (pure geometry + manual lights, no external loaders) ─────────
function RotatingCup({ color }) {
  const bodyRef = useRef();
  const rimRef  = useRef();
  const lidRef  = useRef();

  useFrame((_, delta) => {
    const d = delta * 0.45;
    if (bodyRef.current) bodyRef.current.rotation.y += d;
    if (rimRef.current)  rimRef.current.rotation.y  += d;
    if (lidRef.current)  lidRef.current.rotation.y  += d;
  });

  const c = useMemo(() => {
    try { return new THREE.Color(color); } catch { return new THREE.Color('#aee0f5'); }
  }, [color]);

  return (
    <group>
      <mesh ref={bodyRef} castShadow>
        <cylinderGeometry args={[0.76, 0.56, 2.45, 64]} />
        <meshStandardMaterial color={c} roughness={0.2} metalness={0.05} />
      </mesh>
      <mesh ref={rimRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.24, 0]}>
        <torusGeometry args={[0.78, 0.036, 12, 64]} />
        <meshStandardMaterial color={c} roughness={0.1} metalness={0.22} />
      </mesh>
      <mesh ref={lidRef} position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.79, 0.79, 0.09, 64]} />
        <meshStandardMaterial color={c} roughness={0.12} metalness={0.15} />
      </mesh>
    </group>
  );
}

// ── Canvas wrapped by ErrorBoundary (handles ALL WebGL / R3F failures) ──────
export default function VasoViewer3D({ color = '#aee0f5' }) {
  return (
    // Outer div MUST have an explicit pixel height — Canvas inherits it
    <div style={{ width: '100%', height: '420px' }}>
      <Canvas3DErrorBoundary>
        <Canvas
          shadows
          camera={{ position: [0, 0.8, 4.5], fov: 38 }}
          gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[-4, 6, 4]}  intensity={4}   color="#c7d2fe" castShadow />
          <directionalLight position={[4, 4, -3]}  intensity={3.5} color="#f5d0fe" />
          <pointLight       position={[0, -3, 2]}  intensity={1.2} color="#bfdbfe" />
          <pointLight       position={[0,  5, 0]}  intensity={0.8} color="#ffffff" />

          <RotatingCup color={color} />

          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.6}
            minDistance={3}
            maxDistance={8}
          />
        </Canvas>
      </Canvas3DErrorBoundary>
    </div>
  );
}
