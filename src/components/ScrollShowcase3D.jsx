import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import Canvas3DErrorBoundary from './Canvas3DErrorBoundary';
import { FiArrowRight } from 'react-icons/fi';

/* ─── Secciones ─────────────────────────────────────────── */
const SECTIONS = [
  {
    model:    '/models/BOTELLA RP R28 500ml.glb',
    color:    '#a5f3fc',
    bg1: '#020d18', bg2: '#061a2e',
    glow:     'rgba(6,182,212,0.20)',
    accent:   '#06b6d4',
    tag:      'LÍNEA INDUSTRIAL',
    headline: ['Cristalinos.', 'Resistentes.', 'Certificados.'],
    desc:     'Grado alimenticio, cosmético y farmacéutico. Desde 30 ml hasta 5 litros en múltiples formatos.',
    link: '/catalogo', cta: 'Ver catálogo',
  },
  {
    model:    '/models/38 Flip Top Lisa (Sin liner).glb',
    color:    '#c7d2fe',
    bg1: '#08061e', bg2: '#12103a',
    glow:     'rgba(99,102,241,0.20)',
    accent:   '#818cf8',
    tag:      'TAPAS & CIERRES',
    headline: ['Precisión', 'en cada', 'cierre.'],
    desc:     '75+ SKUs compatibles con estándares internacionales. Disc-tops, flip-tops y roscas inviolables.',
    link: '/catalogo', cta: 'Explorar tapas',
  },
  {
    model:    '/models/R63.glb',
    color:    '#6ee7b7',
    bg1: '#021a0f', bg2: '#052e1a',
    glow:     'rgba(16,185,129,0.20)',
    accent:   '#10b981',
    tag:      'DISPENSADORES',
    headline: ['Alta', 'precisión,', 'cero fallas.'],
    desc:     'Roscas y dispensadores diseñados para cosméticos, farmacéuticos y productos de limpieza.',
    link: '/catalogo', cta: 'Ver línea',
  },
  {
    model:    '/models/Termo Kids tapa chupon.glb',
    color:    '#fcd34d',
    bg1: '#1a1002', bg2: '#2e1e05',
    glow:     'rgba(245,158,11,0.20)',
    accent:   '#f59e0b',
    tag:      'PROMOCIONALES',
    headline: ['Tu logo', 'en cada', 'pieza.'],
    desc:     'Personalización desde 10 piezas. Serigrafía, colores corporativos y modelos exclusivos.',
    link: '/promocionales', cta: 'Personalizar',
  },
];

SECTIONS.forEach(s => useGLTF.preload(s.model));

/* ─── Modelo (fade in/out, gira solo en Y) ───────────────── */
function ModelScene({ modelPath, color, visible }) {
  const { scene }   = useGLTF(modelPath);
  const rotatorRef  = useRef();   // ← solo gira en Y (siempre en origen)
  const pivotRef    = useRef();   // ← desplaza el modelo a su centro
  const centered    = useRef(false);
  const opacRef     = useRef(visible ? 1 : 0);
  const cloned      = useMemo(() => scene.clone(true), [scene]);

  const colorObj = useMemo(() => {
    try { return new THREE.Color(color); } catch { return new THREE.Color('#ccc'); }
  }, [color]);

  useEffect(() => {
    cloned.traverse(child => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(mat => {
        const m = mat.clone();
        m.color.copy(colorObj);
        m.transparent = true;
        m.opacity = opacRef.current;
        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
          m.roughness = 0.32; m.metalness = 0.15; m.envMapIntensity = 2.8;
        }
        m.needsUpdate = true;
        child.material = m;
      });
    });
  }, [cloned, colorObj]);

  useFrame((_, delta) => {
    if (!rotatorRef.current || !pivotRef.current) return;

    // Centrar y escalar una sola vez — pivotRef mueve el modelo a su centro
    if (!centered.current) {
      centered.current = true;
      rotatorRef.current.updateWorldMatrix(true, true);
      const box    = new THREE.Box3().setFromObject(rotatorRef.current);
      const size   = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale  = maxDim > 0 ? 1.15 / maxDim : 1;
      // pivotRef centra el modelo; rotatorRef escala el conjunto
      pivotRef.current.position.set(-center.x, -center.y, -center.z);
      rotatorRef.current.scale.setScalar(scale);
    }

    // Fade rápido sin ghosting
    const opTarget = visible ? 1 : 0;
    opacRef.current = THREE.MathUtils.lerp(opacRef.current, opTarget, delta * 14);
    if (opacRef.current < 0.04) opacRef.current = 0;
    if (opacRef.current > 0.96) opacRef.current = 1;

    rotatorRef.current.visible = opacRef.current > 0;
    if (!rotatorRef.current.visible) return;

    cloned.traverse(child => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { m.opacity = opacRef.current; });
      }
    });

    // Rotación pura en Y — el rotatorRef siempre está en (0,0,0)
    rotatorRef.current.rotation.y += delta * 0.22;

    // Bob vertical muy suave sobre el rotator
    rotatorRef.current.position.y = Math.sin(Date.now() * 0.0007) * 0.04;
  });

  return (
    <group ref={rotatorRef}>
      <group ref={pivotRef}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

/* ─── Canvas único, nunca se desmonta ────────────────────── */
function PersistentCanvas({ activeIdx }) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 3.8], fov: 44 }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.35, antialias: true, alpha: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 8, 4]}   intensity={1.1} />
      <directionalLight position={[-3, 3, -2]} intensity={0.45} color="#c7d9ff" />
      <Environment files="/studio_small_03_1k.hdr" />
      <Suspense fallback={null}>
        {SECTIONS.map((sec, i) => (
          <ModelScene key={sec.model} modelPath={sec.model} color={sec.color} visible={i === activeIdx} />
        ))}
        <ContactShadows position={[0, -0.85, 0]} opacity={0.25} scale={3.5} blur={2.5} color="#000820" />
      </Suspense>
    </Canvas>
  );
}

/* ─── Partículas flotantes ───────────────────────────────── */
function Particles({ accent }) {
  const pts = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random()*100, y: Math.random()*100,
    size: Math.random()*2.5+1, dur: Math.random()*9+6,
    delay: Math.random()*5, op: Math.random()*0.3+0.08,
  })), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pts.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, background:accent, opacity:p.op }}
          animate={{ y:[0,-24,0], opacity:[p.op,p.op*2,p.op] }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity, ease:'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────── */
export default function ScrollShowcase3D() {
  const containerRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start','end end'] });

  useMotionValueEvent(scrollYProgress, 'change', v => {
    setActiveIdx(Math.min(Math.floor(v * SECTIONS.length), SECTIONS.length - 1));
  });

  const sec = SECTIONS[activeIdx];

  return (
    <div ref={containerRef} style={{ height:`${SECTIONS.length * 100}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* Fondo */}
        <AnimatePresence mode="sync">
          <motion.div key={`bg-${activeIdx}`} className="absolute inset-0"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.85 }}
            style={{ background:`radial-gradient(ellipse 120% 100% at 55% 50%, ${sec.bg2} 0%, ${sec.bg1} 100%)` }}
          />
        </AnimatePresence>

        {/* Glow */}
        <AnimatePresence mode="sync">
          <motion.div key={`gl-${activeIdx}`} className="absolute inset-0 pointer-events-none"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:1 }}
            style={{ background:`radial-gradient(ellipse 50% 60% at 72% 50%, ${sec.glow} 0%, transparent 70%)` }}
          />
        </AnimatePresence>

        {/* Partículas */}
        <AnimatePresence mode="sync">
          <motion.div key={`p-${activeIdx}`} className="absolute inset-0"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.5 }}>
            <Particles accent={sec.accent} />
          </motion.div>
        </AnimatePresence>

        {/* Layout: texto izq + canvas der */}
        <div className="relative z-10 h-full flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center h-full">

            {/* Texto */}
            <div className="flex items-center">
              <AnimatePresence mode="wait">
                <motion.div key={`txt-${activeIdx}`}
                  initial={{ opacity:0, x:-35 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                  transition={{ duration:0.5, ease:[0.4,0,0.2,1] }}
                  className="flex flex-col gap-4 sm:gap-5"
                >
                  <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border w-fit"
                    style={{ color:sec.accent, borderColor:`${sec.accent}45`, background:`${sec.accent}15` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:sec.accent }} />
                    {sec.tag}
                  </span>

                  <div className="flex flex-col">
                    {sec.headline.map((line, li) => (
                      <motion.span key={li} className="font-black font-outfit text-white leading-none"
                        style={{ fontSize:'clamp(2.4rem,6.5vw,5rem)' }}
                        initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay:li*0.08+0.1, duration:0.45 }}>
                        {line}
                      </motion.span>
                    ))}
                  </div>

                  <motion.p className="text-sm sm:text-base leading-relaxed"
                    style={{ color:'rgba(255,255,255,0.55)', maxWidth:'36ch' }}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35, duration:0.5 }}>
                    {sec.desc}
                  </motion.p>

                  <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45, duration:0.4 }}>
                    <Link to={sec.link}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                      style={{ background:`linear-gradient(135deg, ${sec.accent}, ${sec.accent}bb)`, color:'#07111f', boxShadow:`0 8px 28px ${sec.accent}40` }}>
                      {sec.cta} <FiArrowRight />
                    </Link>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Canvas 3D */}
            <div className="w-full h-full flex items-center justify-center" style={{ minHeight:'320px', maxHeight:'520px' }}>
              <div className="w-full h-full" style={{ height:'clamp(320px,55vh,520px)' }}>
                <Canvas3DErrorBoundary>
                  <PersistentCanvas activeIdx={activeIdx} />
                </Canvas3DErrorBoundary>
              </div>
            </div>

          </div>
        </div>

        {/* Puntos nav */}
        <div className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
          {SECTIONS.map((_, i) => (
            <motion.div key={i}
              animate={{ scale:i===activeIdx?1.3:0.65, opacity:i===activeIdx?1:0.3 }}
              transition={{ duration:0.3 }}
              className="w-2 h-2 rounded-full"
              style={{ background: i===activeIdx ? sec.accent : '#fff' }}
            />
          ))}
        </div>

        {/* Número sección */}
        <div className="absolute left-6 sm:left-10 bottom-8 z-20 flex items-baseline gap-2">
          <AnimatePresence mode="wait">
            <motion.span key={activeIdx} className="font-black font-outfit leading-none"
              style={{ fontSize:'clamp(2.2rem,4.5vw,3.5rem)', color:`${sec.accent}45` }}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.25 }}>
              0{activeIdx+1}
            </motion.span>
          </AnimatePresence>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color:'rgba(255,255,255,0.2)' }}>
            / 0{SECTIONS.length}
          </span>
        </div>

        {/* Scroll hint */}
        <AnimatePresence>
          {activeIdx === 0 && (
            <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.4 }}>
              <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color:'rgba(255,255,255,0.25)' }}>Scroll</span>
              <div className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5" style={{ borderColor:'rgba(255,255,255,0.18)' }}>
                <motion.div className="w-1 h-2 rounded-full" style={{ background:sec.accent }}
                  animate={{ y:[0,12,0] }} transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
