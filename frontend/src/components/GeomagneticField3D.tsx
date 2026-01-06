/**
 * 3D Geomagnetic Field Visualization
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface GeomagneticField3DProps {
  kp?: number;
  dst?: number;
  bz?: number;
}

function FieldLines({ kp = 2, dst = -10, bz = 0 }: GeomagneticField3DProps) {
  const linesRef = useRef<THREE.Line[]>([]);
  
  const intensity = Math.min(Math.abs(dst) / 100, 1); // Normalize DST, cap at 1
  const color = dst < -50 ? '#ff4444' : dst < -30 ? '#ffaa00' : '#00ff88';

  // Generate field lines using useMemo to avoid recreation
  const fieldLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 20; i++) {
      const points: THREE.Vector3[] = [];
      for (let j = 0; j < 50; j++) {
        const angle = (j / 50) * Math.PI * 2;
        const radius = 1 + (j / 50) * 2;
        const height = Math.sin(angle * 3) * intensity;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: color, 
        opacity: 0.6, 
        transparent: true 
      });
      const line = new THREE.Line(geometry, material);
      lines.push(line);
    }
    return lines;
  }, [intensity, color]);

  useFrame((state) => {
    fieldLines.forEach((line, i) => {
      if (line) {
        line.rotation.y = state.clock.elapsedTime * 0.1 + i * 0.1;
      }
    });
  });

  return (
    <>
      {fieldLines.map((line, i) => (
        <primitive key={i} object={line} ref={(el: THREE.Line | null) => {
          if (el) linesRef.current[i] = el;
        }} />
      ))}
    </>
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

const GeomagneticField3D: React.FC<GeomagneticField3DProps> = ({ kp = 2, dst = -10, bz = 0 }) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} />
        <Earth />
        <FieldLines kp={kp} dst={dst} bz={bz} />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};

export default GeomagneticField3D;

