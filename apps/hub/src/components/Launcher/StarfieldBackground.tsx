'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════
// STARFIELD BACKGROUND - Deep Space Cyber-Noir Particle System
// React Three Fiber component with floating particles/nodes
// ═══════════════════════════════════════════════════════════════════════════

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  
  // Generate random particle positions
  const particleCount = 3000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  // Animate particles
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.01;
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#CDABC3" // Holographic Pink
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function NebulaClouds() {
  const ref = useRef<THREE.Points>(null);
  
  // Larger, fewer particles for nebula effect
  const nebulaCount = 500;
  const positions = useMemo(() => {
    const pos = new Float32Array(nebulaCount * 3);
    for (let i = 0; i < nebulaCount; i++) {
      // Cluster particles in organic shapes
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 10 + Math.random() * 15;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#725A8D" // Electric Lavender
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function DataNodes() {
  const ref = useRef<THREE.Points>(null);
  
  // Fewer, brighter data nodes
  const nodeCount = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00D4FF" // Data Cyan
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function Scene() {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.1} />
      
      {/* Main starfield */}
      <ParticleField />
      
      {/* Nebula clouds */}
      <NebulaClouds />
      
      {/* Data nodes */}
      <DataNodes />
    </>
  );
}

export function StarfieldBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Base gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(40, 28, 85, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(114, 90, 141, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(13, 10, 20, 1) 0%, #030205 100%)
          `,
        }}
      />
      
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>
      
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3, 2, 5, 0.8) 100%)',
        }}
      />
    </div>
  );
}

export default StarfieldBackground;
