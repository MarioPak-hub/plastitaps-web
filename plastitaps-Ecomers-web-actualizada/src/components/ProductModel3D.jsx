import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Canvas3DErrorBoundary from './Canvas3DErrorBoundary';

// ── Fallback geométrico: esfera + cubo animados cuando no hay .glb ───────────
function GeometricFallback({ color }) {
  const groupRef = useRef();
  const sphereRef = useRef();
  const cubeRef = useRef();

  const material = useMemo(() => {
    try {
      return new THREE.Color(color || '#0a192f');
    } catch {
      return new THREE.Color('#0a192f');
    }
  }, [color]);

  useFrame((_, delta) => {
    if (groupRef.current)  groupRef.current.rotation.y  += delta * 0.4;
    if (sphereRef.current) sphereRef.current.rotation.x += delta * 0.3;
    if (cubeRef.current)   cubeRef.current.rotation.z   += delta * 0.25;
  });

  return (
    <group ref={groupRef}>
      {/* Esfera principal */}
      <mesh ref={sphereRef} position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.9, 64, 64]} />
        <meshStandardMaterial
          color={material}
          roughness={0.15}
          metalness={0.35}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Cubo orbital decorativo */}
      <mesh ref={cubeRef} position={[1.5, 0.3, 0]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial
          color={material}
          roughness={0.2}
          metalness={0.5}
          opacity={0.8}
          transparent
        />
      </mesh>

      {/* Anillo difuso */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.04, 16, 100]} />
        <meshStandardMaterial
          color={material}
          roughness={0.1}
          metalness={0.6}
          opacity={0.4}
          transparent
        />
      </mesh>
    </group>
  );
}

// ── Cargador de modelo .glb real ──────────────────────────────────────────────
function GLBModel({ modelUrl, color }) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef();

  // Aplicar color dinámico a todos los materiales del modelo
  const colorObj = useMemo(() => {
    try { return new THREE.Color(color || '#ffffff'); } catch { return new THREE.Color('#ffffff'); }
  }, [color]);

  // Recorrer la escena y aplicar color solo si el material lo soporta
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clonamos el material para no mutar el cache global de useGLTF
        child.material = child.material.clone();
        if (child.material.color) {
          child.material.color.set(colorObj);
        }
        child.castShadow = true;
      }
    });
  }, [scene, colorObj]);

  // Rotación lenta de presentación
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.35;
  });

  return <primitive ref={groupRef} object={scene} />;
}

// ── Fallback de carga dentro de Suspense ─────────────────────────────────────
function LoadingSpinner() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 2;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.6, 0.08, 16, 50]} />
      <meshStandardMaterial color="#06b6d4" roughness={0.1} metalness={0.5} />
    </mesh>
  );
}

// ── Escena 3D principal ───────────────────────────────────────────────────────
function Scene({ modelUrl, color }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[-3, 5, 3]}  intensity={3.5} color="#c7d2fe" castShadow />
      <directionalLight position={[3, 3, -2]}  intensity={3}   color="#f5d0fe" />
      <pointLight       position={[0, -3, 2]}  intensity={1}   color="#bfdbfe" />

      <Suspense fallback={<LoadingSpinner />}>
        {modelUrl ? (
          <GLBModel modelUrl={modelUrl} color={color} />
        ) : (
          <GeometricFallback color={color} />
        )}
      </Suspense>

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.6}
        minDistance={2.5}
        maxDistance={7}
        autoRotate={false}
      />
    </>
  );
}

// ── Componente público exportable ─────────────────────────────────────────────
/**
 * ProductModel3D
 *
 * @param {string}  modelUrl   — Ruta al .glb (ej. "/models/cap.glb"). Si es null/undefined,
 *                               muestra el fallback geométrico estilizado.
 * @param {string}  color      — Color hex activo del selector (#rrggbb).
 * @param {number}  height     — Altura del canvas en px (default 340).
 */
export default function ProductModel3D({ modelUrl, color = '#0a192f', height = 340 }) {
  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <Canvas3DErrorBoundary>
        <Canvas
          shadows
          camera={{ position: [0, 0.5, 3.8], fov: 42 }}
          gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
          style={{ width: '100%', height: '100%' }}
        >
          <Scene modelUrl={modelUrl} color={color} />
        </Canvas>
      </Canvas3DErrorBoundary>
    </div>
  );
}
