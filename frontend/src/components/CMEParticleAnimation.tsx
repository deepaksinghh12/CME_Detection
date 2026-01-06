/**
 * Realistic CME Particle Animation - FIXED VERSION
 * Shows particles flowing from Sun to Earth with proper physics
 */
import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface CMEParticleAnimationProps {
  speed?: number; // km/s
  density?: number; // particles/cm³
  temperature?: number; // K
  bz?: number; // nT
  bt?: number; // nT
  kp?: number; // 0-9
  dst?: number; // nT
}

function CMEParticles({ speed = 400, density = 5, temperature = 100000, bz = 0, bt = 5, kp = 2, dst = -10 }: CMEParticleAnimationProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = Math.min(Math.floor(density * 100), 2000); // Reduced for performance

  // Color based on conditions
  const particleColor = useMemo(() => {
    if (bz < -10) return new THREE.Color(0xff4444); // Red for strong southward Bz
    if (kp >= 6 || dst < -100) return new THREE.Color(0xff8800); // Orange for severe storm
    if (kp >= 4 || dst < -50) return new THREE.Color(0xffaa00); // Yellow for moderate storm
    return new THREE.Color(0x60a5fa); // Blue for normal
  }, [bz, kp, dst]);

  // Create particle system - FIXED: Don't resize buffers
  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    const speedFactor = speed / 1000; // Normalize speed

    for (let i = 0; i < count; i++) {
      // Start from Sun (left side)
      const angle = (Math.random() - 0.5) * Math.PI * 0.3; // Small spread
      const distance = Math.random() * 5; // Random distance from Sun

      pos[i * 3] = -10 + distance * Math.cos(angle);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Velocity towards Earth (right side)
      vel[i * 3] = speedFactor * (0.5 + Math.random() * 0.5);
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      // Size based on density
      siz[i] = 0.05 + (density / 20) * 0.1;
    }

    return { positions: pos, velocities: vel, sizes: siz };
  }, [count, speed, density]);

  // Store velocities in ref to avoid recreation
  const velocitiesRef = useRef(velocities);
  useEffect(() => {
    velocitiesRef.current = velocities;
  }, [velocities]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;

    for (let i = 0; i < count; i++) {
      // Update position
      positions[i * 3] += vel[i * 3] * delta;
      positions[i * 3 + 1] += vel[i * 3 + 1] * delta;
      positions[i * 3 + 2] += vel[i * 3 + 2] * delta;

      // Wrap around - if particle goes past Earth, reset to Sun
      if (positions[i * 3] > 10) {
        positions[i * 3] = -10 + (Math.random() - 0.5) * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Create field lines only once
  const fieldLines = useMemo(() => {
    if (Math.abs(bz) <= 5) return null;

    const lines: JSX.Element[] = [];
    for (let i = 0; i < 10; i++) {
      const points: THREE.Vector3[] = [];
      const startX = -8 + i * 1.5;
      for (let j = 0; j < 50; j++) {
        const t = j / 50;
        const x = startX + t * 16;
        const y = Math.sin(t * Math.PI * 2 + i) * (bz < 0 ? 1 : -1) * 0.5;
        const z = Math.cos(t * Math.PI * 2 + i) * 0.5;
        points.push(new THREE.Vector3(x, y, z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(
        <line key={i} geometry={geometry}>
          <lineBasicMaterial color={bz < 0 ? "#ff4444" : "#00ff88"} opacity={0.5} transparent />
        </line>
      );
    }
    return <group>{lines}</group>;
  }, [bz]);

  return (
    <>
      {/* Sun - Large and glowing */}
      <mesh position={[-10, 0, 0]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={3} />
      </mesh>
      {/* Sun corona */}
      <mesh position={[-10, 0, 0]}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.3} />
      </mesh>

      {/* Aditya L1 - Spacecraft at L1 point (between Sun and Earth) */}
      <group position={[-1, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.15, 0.15, 0.3]} />
          <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Solar panels */}
        <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.3, 0.05, 0.1]} />
          <meshStandardMaterial color="#00aaff" />
        </mesh>
        <mesh position={[0, -0.2, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.3, 0.05, 0.1]} />
          <meshStandardMaterial color="#00aaff" />
        </mesh>
      </group>

      {/* Earth */}
      <mesh position={[10, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#4a90e2" emissive="#1a3a5a" />
      </mesh>
      {/* Earth atmosphere */}
      <mesh position={[10, 0, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#87ceeb" transparent opacity={0.2} />
      </mesh>

      {/* CME Particles - FIXED: Use fixed-size buffers */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={count}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color={particleColor}
          transparent
          opacity={0.8}
          sizeAttenuation={true}
        />
      </points>

      {/* Magnetic field lines */}
      {fieldLines}
    </>
  );
}

const CMEParticleAnimation: React.FC<CMEParticleAnimationProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[-10, 0, 0]} intensity={2} color="#ffaa00" />
        <pointLight position={[10, 0, 0]} intensity={0.5} color="#4a90e2" />
        <Stars radius={20} depth={50} count={100} />
        <CMEParticles {...props} />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};

export default CMEParticleAnimation;
