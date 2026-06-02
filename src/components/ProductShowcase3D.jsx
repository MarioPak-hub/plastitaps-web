import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Canvas3DErrorBoundary from './Canvas3DErrorBoundary';

const FEATURED_MODELS = [
  { path: '/models/BOTELLA RP R28 500ml.glb',               name: 'Botella PET R28',   category: 'Envases',       slug: 'botella-rp-r28-500ml' },
  { path: '/models/Vaso 24oz.glb',                          name: 'Vaso 24 oz',         category: 'Vasos',         slug: 'vasos-para-bebidas-colores-16-oz-con-tapa' },
  { path: '/models/R63.glb',                                name: 'Tapa R63',           category: 'Tapas',         slug: 'tapa-rosca-63mm-lisa' },
  { path: '/models/TARRO GALON CILINDRICO R110 3750 ml.glb', name: 'Tarro Galón',       category: 'Contenedores',  slug: 'tarro-cil-ndrico-r110' },
  { path: '/models/38 Flip Top Lisa (Sin liner).glb',       name: 'Flip Top 38mm',      category: 'Tapas',         slug: '38-flip-top-lisa-sin-liner' },
  { path: '/models/Termo Kids tapa chupon.glb',             name: 'Termo Kids',         category: 'Promocionales', slug: 'tapa-deportiva-rosca-28mm-chupon' },
];

function ModelScene({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  const groupRef  = useRef();
  const centered  = useRef(false);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Mejorar materiales del modelo clonado para aprovechar el Environment
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
            mat.roughness    = Math.min(mat.roughness ?? 0.4, 0.55);
            mat.metalness    = Math.max(mat.metalness ?? 0.1, 0.05);
            mat.envMapIntensity = 1.8;
            mat.needsUpdate  = true;
          }
        });
      }
    });
  }, [clonedScene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!centered.current) {
      centered.current = true;
      groupRef.current.updateWorldMatrix(true, true);
      const box    = new THREE.Box3().setFromObject(groupRef.current);
      const size   = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale  = maxDim > 0 ? 1.35 / maxDim : 1;
      groupRef.current.scale.setScalar(scale);
      // Centrar horizontalmente, bajar levemente para las sombras
      clonedScene.position.set(-center.x, -center.y + 0.05, -center.z);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

function ModelCard({ model, index, onProductClick }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      onClick={() => onProductClick && onProductClick(model.slug)}
      className="group relative bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-blue-500/60 overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.18)] cursor-pointer"
    >
      {/* Category badge */}
      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-slate-950/70 backdrop-blur-sm border border-slate-700/60 rounded-full">
        <span className="text-blue-300 text-[10px] font-bold uppercase tracking-wider">{model.category}</span>
      </div>

      {/* Glow circle behind model */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500" />

      {/* 3D Canvas — solo se monta cuando la tarjeta es visible */}
      <div className="h-56 relative">
        {visible && (
          <Canvas3DErrorBoundary>
            <Canvas
              camera={{ position: [0, 0.4, 2.8], fov: 42 }}
              gl={{
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.25,
                antialias: true,
              }}
            >
              {/* Iluminación base */}
              <ambientLight intensity={0.25} />
              <directionalLight position={[4, 8, 4]}  intensity={1.2} castShadow />
              <directionalLight position={[-4, 3, -2]} intensity={0.5} color="#c7d9ff" />

              {/* Environment HDR — da reflejos realistas (archivo local) */}
              <Environment files="/studio_small_03_1k.hdr" />

              <Suspense fallback={null}>
                <ModelScene modelPath={model.path} />
                {/* Sombra suave debajo del modelo */}
                <ContactShadows
                  position={[0, -0.72, 0]}
                  opacity={0.45}
                  scale={3.5}
                  blur={2.2}
                  far={1.5}
                  color="#000022"
                />
              </Suspense>

              {/* Controles: autorotación + interacción manual */}
              <OrbitControls
                enablePan={false}
                enableZoom={false}
                autoRotate
                autoRotateSpeed={2.5}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.8}
              />
            </Canvas>
          </Canvas3DErrorBoundary>
        )}
        {/* fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold font-outfit text-sm leading-tight">{model.name}</h3>
          <p className="text-slate-500 text-[11px] mt-0.5">Clic para ver producto</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-blue-600 flex items-center justify-center transition-colors duration-300">
          <FiArrowRight className="text-slate-400 group-hover:text-white text-xs transition-colors duration-300" />
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductShowcase3D({ onProductClick }) {
  return (
    <section className="py-20 sm:py-24 bg-slate-950 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-700/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full mb-5"
          >
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Visualización Interactiva</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit text-white mb-4 leading-tight"
          >
            Explora nuestros productos{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">en 3D</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Gira e inspecciona cada detalle de nuestros envases y tapas antes de cotizar. Tecnología de visualización en tiempo real.
          </motion.p>
        </div>

        {/* Grid de modelos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {FEATURED_MODELS.map((model, i) => (
            <ModelCard key={i} model={model} index={i} onProductClick={onProductClick} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link to="/catalogo">
            <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 hover:-translate-y-0.5">
              Ver catálogo completo
              <FiArrowRight />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
