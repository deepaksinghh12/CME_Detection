/**
 * 3D Solar Wind Animation using Three.js
 * Uses lon/lat for direction
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

interface SolarWind3DProps {
  speed: number;
  lon: number; // Longitude in degrees
  lat: number; // Latitude in degrees
  density: number;
  bz: number;
}

function WindParticles({ speed, lon, lat, density, bz }: SolarWind3DProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = Math.floor(density * 100);

  // Convert lon/lat to direction vector
  const direction = useMemo(() => {
    const lonRad = (lon * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    return new THREE.Vector3(
      Math.cos(latRad) * Math.cos(lonRad),
      Math.sin(latRad),
      Math.cos(latRad) * Math.sin(lonRad)
    ).normalize();
  }, [lon, lat]);

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, [count]);

  const velocities = useMemo(() => {
    const velocities = new Float32Array(count * 3);
    const speedFactor = speed / 100;
    for (let i = 0; i < count * 3; i += 3) {
      const v = direction.clone().multiplyScalar(speedFactor);
      velocities[i] = v.x + (Math.random() - 0.5) * 0.1;
      velocities[i + 1] = v.y + (Math.random() - 0.5) * 0.1;
      velocities[i + 2] = v.z + (Math.random() - 0.5) * 0.1;
    }
    return velocities;
  }, [count, direction, speed]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const velocities = particlesRef.current.userData.velocities as Float32Array;

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] += velocities[i] * delta * 2;
      positions[i + 1] += velocities[i + 1] * delta * 2;
      positions[i + 2] += velocities[i + 2] * delta * 2;

      // Wrap around
      if (Math.abs(positions[i]) > 10) positions[i] = -Math.sign(positions[i]) * 10;
      if (Math.abs(positions[i + 1]) > 10) positions[i + 1] = -Math.sign(positions[i + 1]) * 10;
      if (Math.abs(positions[i + 2]) > 10) positions[i + 2] = -Math.sign(positions[i + 2]) * 10;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Color based on Bz
  const color = bz < -10 ? '#ff4444' : bz < -5 ? '#ffaa00' : '#00aaff';

  return (
    <points ref={particlesRef} userData={{ velocities }}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={color} transparent opacity={0.8} />
    </points>
  );
}

function Earth() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#4a90e2" emissive="#1a3a5a" />
    </mesh>
  );
}

function DirectionArrow({ lon, lat }: { lon: number; lat: number }) {
  const direction = useMemo(() => {
    const lonRad = (lon * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;
    return new THREE.Vector3(
      Math.cos(latRad) * Math.cos(lonRad),
      Math.sin(latRad),
      Math.cos(latRad) * Math.sin(lonRad)
    ).normalize().multiplyScalar(3);
  }, [lon, lat]);

  return (
    <arrowHelper
      args={[direction, new THREE.Vector3(0, 0, 0), 2, 0xffaa00, 0.3, 0.2]}
    />
  );
}

const SolarWind3D: React.FC<SolarWind3DProps> = ({ speed, lon, lat, density, bz }) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} />
        <Earth />
        <WindParticles speed={speed} lon={lon} lat={lat} density={density} bz={bz} />
        <DirectionArrow lon={lon} lat={lat} />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        <gridHelper args={[20, 20]} />
      </Canvas>
    </div>
  );
};

export default SolarWind3D;

