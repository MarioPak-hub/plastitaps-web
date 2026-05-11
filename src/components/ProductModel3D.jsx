import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  Suspense
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import Canvas3DErrorBoundary from './Canvas3DErrorBoundary';

function ModelScene({ modelPath, color, controlsRef }) {
  const { scene } = useGLTF(modelPath);
  if (!scene) return null;
  const groupRef = useRef();
  const centered = useRef(false);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const colorObj = useMemo(() => {
    try {
      return new THREE.Color(color);
    } catch {
      return new THREE.Color('#cccccc');
    }
  }, [color]);

  // Apply color to cloned materials
  useLayoutEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const material = child.material.clone();
        material.color.copy(colorObj);
        child.material = material;
      }
    });
  }, [clonedScene, colorObj]);

  // One-shot centering + scaling on first rendered frame.
  // useFrame runs AFTER the scene graph is committed and the Canvas has a
  // valid size, so Box3 calculations are accurate.
  useFrame(() => {
    if (centered.current || !groupRef.current) return;
    centered.current = true;

    // Force world matrix update now that the primitive is in the graph
    groupRef.current.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const newScale = maxDim > 0 ? 1.5 / maxDim : 1;

    // Apply scale
    groupRef.current.scale.setScalar(newScale);

    // Offset the scene so its center sits at origin (avoids
    // scaled-vs-unscaled mismatch with OrbitControls.target)
    clonedScene.position.sub(center);

    // Reset controls target to origin and update
    if (controlsRef?.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  });

  // Gentle auto-rotation
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
    <div style={{ width: '100%', height: '380px' }}>
      <Canvas3DErrorBoundary>
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          {/* Luces */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 3]} intensity={2.5} />
          <directionalLight position={[-3, 3, -3]} intensity={1.5} />

          <Suspense fallback={null}>
            <ModelScene
              modelPath={modelPath}
              color={selectedColor}
              controlsRef={controlsRef}
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={2}
            maxDistance={6}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </Canvas3DErrorBoundary>
    </div>
  );
});

export default ProductModel3D;