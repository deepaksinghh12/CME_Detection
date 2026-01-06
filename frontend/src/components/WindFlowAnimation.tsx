import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WindFlowAnimationProps {
  speed?: number; // Wind speed in km/s
  direction?: number; // Direction in degrees (0-360)
  density?: number; // Particle density
  width?: number;
  height?: number;
  color?: string;
}

const WindFlowAnimation: React.FC<WindFlowAnimationProps> = ({
  speed = 400,
  direction = 0,
  density = 5,
  width = 800,
  height = 600,
  color = '#60a5fa'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Convert direction from degrees to radians
    const angle = (direction * Math.PI) / 180;
    const baseSpeed = speed / 100; // Normalize speed for animation

    // Initialize particles
    const particles: typeof particlesRef.current = [];
    for (let i = 0; i < density * 20; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * baseSpeed + (Math.random() - 0.5) * 0.5,
        vy: Math.sin(angle) * baseSpeed + (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.7
      });
    }
    particlesRef.current = particles;

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Draw particle with trail effect
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 2
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw direction indicator (arrow)
        if (Math.random() > 0.95) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = particle.opacity * 0.5;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(
            particle.x + Math.cos(angle) * particle.size * 3,
            particle.y + Math.sin(angle) * particle.size * 3
          );
          ctx.stroke();
        }
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [speed, direction, density, width, height, color]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ background: 'transparent' }}
      />
      {/* Direction indicator */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
        <div className="flex items-center gap-2">
          <span>Direction: {direction}°</span>
          <span>Speed: {speed} km/s</span>
        </div>
      </div>
    </div>
  );
};

export default WindFlowAnimation;


