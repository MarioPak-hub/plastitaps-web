import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useEffect,
  Suspense
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import Canvas3DErrorBoundary from './Canvas3DErrorBoundary';

function ModelScene({ modelPath, color, controlsRef }) {
  const { scene } = useGLTF(modelPath);
  if (!scene) return null;

  const groupRef   = useRef();
  const centered   = useRef(false);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const colorObj = useMemo(() => {
    try { return new THREE.Color(color); }
    catch { return new THREE.Color('#cccccc'); }
  }, [color]);

  // Aplicar color + mejorar materiales para aprovechar el Environment HDR
  useLayoutEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          const m = mat.clone();
          m.color.copy(colorObj);

          // Mejorar propiedades PBR para reflejos más realistas
          if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            m.roughness        = Math.min(m.roughness ?? 0.45, 0.55);
            m.metalness        = Math.max(m.metalness ?? 0.05, 0.05);
            m.envMapIntensity  = 2.0;
          }
          m.needsUpdate = true;
          child.material = m;
        });
      }
    });
  }, [clonedScene, colorObj]);

  // Centrado + escalado en el primer frame
  useFrame(() => {
    if (centered.current || !groupRef.current) return;
    centered.current = true;

    groupRef.current.updateWorldMatrix(true, true);
    const box    = new THREE.Box3().setFromObject(groupRef.current);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim  = Math.max(size.x, size.y, size.z);
    const newScale = maxDim > 0 ? 1.5 / maxDim : 1;
    groupRef.current.scale.setScalar(newScale);

    // Bajar levemente para que la sombra quede debajo
    clonedScene.position.set(-center.x, -center.y + 0.05, -center.z);

    if (controlsRef?.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  });

  // Rotación suave automática
  useFrame((_, delta) => {
    if (groupRef.current && centered.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

const ProductModel3D = React.memo(function ProductModel3D({
  modelPath,
  selectedColor = '#cccccc'
}) {
  const controlsRef = useRef();

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas3DErrorBoundary>
        <Canvas
          camera={{ position: [0, 0.3, 3], fov: 42 }}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.3,
            antialias: true,
          }}
        >
          {/* Iluminación base */}
          <ambientLight intensity={0.2} />
          <directionalLight position={[4, 8, 4]}  intensity={1.0} castShadow />
          <directionalLight position={[-3, 3, -2]} intensity={0.4} color="#c7d9ff" />

          {/* Environment HDR — reflejos realistas tipo estudio */}
          <Environment preset="studio" />

          <Suspense fallback={null}>
            <ModelScene
              modelPath={modelPath}
              color={selectedColor}
              controlsRef={controlsRef}
            />
            {/* Sombra suave debajo del modelo */}
            <ContactShadows
              position={[0, -0.78, 0]}
              opacity={0.4}
              scale={4}
              blur={2.5}
              far={1.5}
              color="#001020"
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={1.8}
            maxDistance={6}
            enableDamping
            dampingFactor={0.06}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.7}
          />
        </Canvas>
      </Canvas3DErrorBoundary>
    </div>
  );
});

export default ProductModel3D;
