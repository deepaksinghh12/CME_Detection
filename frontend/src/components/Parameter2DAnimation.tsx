/**
 * 2D Canvas-based Animations for Each Parameter
 * Different visual style for each parameter type
 */
import React, { useRef, useEffect } from "react";

interface Parameter2DAnimationProps {
  parameterName: string;
  value: number | null;
  animationType: "wind" | "geomagnetic" | "particle" | "field" | "image";
  lon?: number;
  lat?: number;
  density?: number;
  temperature?: number;
  bz?: number;
  bt?: number;
  bx?: number;
  by?: number;
  kp?: number;
  dst?: number;
  ap?: number;
}

const Parameter2DAnimation: React.FC<Parameter2DAnimationProps> = ({
  parameterName,
  value,
  animationType,
  lon,
  lat,
  density,
  temperature,
  bz,
  bt,
  bx,
  by,
  kp,
  dst,
  ap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Polyfill for roundRect if not available
    if (!ctx.roundRect) {
      (ctx as any).roundRect = function (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
      };
    }

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationFrame: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      // Kp Index - Geomagnetic field lines animation (CLEAR & EDUCATIONAL)
      if (parameterName === "Kp Index") {
        const kpValue = kp ?? value ?? 2;
        const intensity = Math.min(kpValue / 9, 1);

        // SOLAR WIND COMING FROM LEFT (Sun is fixed at center-left)
        const sunX = 50;
        const sunY = canvas.height / 2;
        const sunRadius = 32;

        // EARTH FIXED POSITION (stable, no movement)
        const orbitCenterX = sunX + 150; // Orbit center (Sun is at one focus)
        const orbitCenterY = sunY;
        const orbitSemiMajor = 200; // Semi-major axis
        const orbitSemiMinor = 60; // Semi-minor axis (elliptical)

        // Earth at fixed position (center of orbit)
        const centerX = orbitCenterX + orbitSemiMajor; // Fixed Earth position
        const centerY = orbitCenterY; // Fixed Earth position
        const earthRadius = 45;

        // Aditya L1 satellite - ALWAYS between Sun and Earth (moves with Earth)
        // L1 is always ~1.5M km from Earth, towards Sun
        const sunToEarthDist = Math.sqrt(
          (centerX - sunX) ** 2 + (centerY - sunY) ** 2
        );
        const l1DistanceFromEarth = 130; // Visual distance (~1.5M km)
        const l1X =
          centerX - (l1DistanceFromEarth / sunToEarthDist) * (centerX - sunX);
        const l1Y =
          centerY - (l1DistanceFromEarth / sunToEarthDist) * (centerY - sunY);
        const satelliteSize = 14;

        // Satellite body (main) - MUCH BIGGER and more visible
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();

        // Satellite body (detailed) - bigger
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.7,
          l1Y - satelliteSize * 0.4,
          satelliteSize * 1.4,
          satelliteSize * 0.8
        );

        // Solar panels (MUCH bigger and more visible)
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 6, 8, 12);
        ctx.fillRect(l1X + satelliteSize, l1Y - 6, 8, 12);

        // Antenna (bigger)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 7);
        ctx.stroke();
        ctx.restore();

        // Satellite label (bigger font)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 18);

        // L1 Orbit (circular orbit around L1 point) - MUCH MORE VISIBLE
        const l1OrbitRadius = 20; // Bigger orbit
        ctx.save();
        // Outer glow
        ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(l1X, l1Y, l1OrbitRadius + 2, 0, Math.PI * 2);
        ctx.stroke();
        // Main orbit circle
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.arc(l1X, l1Y, l1OrbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("L1 Orbit", l1X, l1Y - l1OrbitRadius - 8);
        ctx.restore();

        // Distance marker: Earth to L1 (THICKER, more visible dashed line)
        ctx.save();
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(l1X - satelliteSize - 2, l1Y);
        ctx.lineTo(centerX - earthRadius, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Distance marker: Sun to L1 (subtle, for reference only)
        ctx.save();
        ctx.strokeStyle = "rgba(255, 170, 0, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(sunX + sunRadius, sunY);
        ctx.lineTo(l1X - satelliteSize - 2, l1Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Sun to L1 distance label (smaller, less prominent)
        const sunL1LabelX = (sunX + l1X) / 2;
        const sunL1LabelY = (sunY + l1Y) / 2 - 25;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(sunL1LabelX - 55, sunL1LabelY - 8, 110, 16);
        ctx.fillStyle = "#ffaa00";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("~148.5M km", sunL1LabelX, sunL1LabelY + 3);

        // Distance label: Earth to L1 (will be drawn AFTER field lines, above them)
        const labelX = (l1X + centerX) / 2;
        const labelY = centerY - 105; // Above field lines (will be drawn later)

        // Earth (bigger, smoother)
        const earthGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
        ctx.fill();

        // Earth continents (smoother)
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(centerX - 10, centerY - 5, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 8, centerY + 10, 6, 0, Math.PI * 2);
        ctx.fill();

        // Kp and G Index display (based on real NOAA thresholds)
        let gIndex = 0;
        if (kpValue >= 9) gIndex = 5;
        else if (kpValue >= 8) gIndex = 4;
        else if (kpValue >= 7) gIndex = 3;
        else if (kpValue >= 6) gIndex = 2;
        else if (kpValue >= 5) gIndex = 1;

        ctx.fillStyle =
          kpValue >= 8
            ? "#ff0000"
            : kpValue >= 7
            ? "#ff4400"
            : kpValue >= 5
            ? "#ff8800"
            : "#60a5fa";
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Kp: ${kpValue.toFixed(1)}`, 10, 22);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.fillText(`G${gIndex} Storm`, 10, 40);

        // Danger level (real thresholds)
        let dangerText = "QUIET";
        let dangerColor = "#60a5fa";
        if (kpValue >= 9) {
          dangerText = "EXTREME";
          dangerColor = "#ff0000";
        } else if (kpValue >= 8) {
          dangerText = "SEVERE";
          dangerColor = "#ff2200";
        } else if (kpValue >= 7) {
          dangerText = "STRONG";
          dangerColor = "#ff4400";
        } else if (kpValue >= 6) {
          dangerText = "MODERATE";
          dangerColor = "#ff8800";
        } else if (kpValue >= 5) {
          dangerText = "MINOR";
          dangerColor = "#ffaa00";
        } else if (kpValue >= 4) {
          dangerText = "UNSETTLED";
          dangerColor = "#ffcc00";
        }
        ctx.fillStyle = dangerColor;
        ctx.font = "bold 12px Arial";
        ctx.fillText(`Level: ${dangerText}`, 10, 58);

        // Draw Sun (variables already declared above)
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffff00"); // Brighter center
        sunGradient.addColorStop(0.3, "#ffaa00");
        sunGradient.addColorStop(0.6, "#ff6600");
        sunGradient.addColorStop(1, "#ff3300");
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Sun glow effect (outer ring)
        ctx.strokeStyle = "rgba(255, 200, 0, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius + 5, 0, Math.PI * 2);
        ctx.stroke();

        // Sun label (bigger and more visible)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 18);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 18);

        // Earth's Elliptical Orbit around Sun (visible orbit path) - DRAWN FIRST
        ctx.save();
        ctx.strokeStyle = "rgba(100, 150, 255, 0.5)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 5]);

        // Draw elliptical orbit path
        ctx.beginPath();
        for (let i = 0; i <= 360; i += 2) {
          const angle = (i * Math.PI) / 180;
          const x = orbitCenterX + orbitSemiMajor * Math.cos(angle);
          const y = orbitCenterY + orbitSemiMinor * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Orbit label (at top of orbit)
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - orbitSemiMinor - 20
        );

        // REALISTIC SOLAR WIND PARTICLES - Flow from Sun, rotate around Earth, then disappear
        const fieldBoundaryRadius = earthRadius + 60;

        // Initialize solar wind particles system
        if (!(window as any).solarWindParticles) {
          (window as any).solarWindParticles = [];
        }
        let solarParticles = (window as any).solarWindParticles;

        // Number of particles based on Kp
        const totalParticles = 20 + Math.floor(kpValue * 3);

        // Create new particles from Sun (towards Earth's current position)
        if (solarParticles.length < totalParticles) {
          for (let i = solarParticles.length; i < totalParticles; i++) {
            const angleOffset = (Math.random() - 0.5) * 0.8;
            // Calculate direction from Sun to Earth (fixed position)
            const sunToEarthAngle = Math.atan2(centerY - sunY, centerX - sunX);
            const baseSpeed = 3 + Math.random() * 2;
            solarParticles.push({
              x: sunX + sunRadius + 5,
              y: sunY + angleOffset * 50,
              vx: Math.cos(sunToEarthAngle) * baseSpeed, // Speed towards Earth's fixed position
              vy: Math.sin(sunToEarthAngle) * baseSpeed,
              deflected: false,
              penetrated: false,
              rotations: 0, // Track rotations around Earth
              lastAngle: null, // Track angle for rotation counting
              distance: 0, // Distance from Earth
              id: i,
            });
          }
        }

        // Update and draw particles
        for (let i = solarParticles.length - 1; i >= 0; i--) {
          const p = solarParticles[i];

          // Calculate distance and angle from Earth center
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const distFromEarth = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // Track rotations around Earth
          if (p.deflected && p.lastAngle !== null) {
            let angleDiff = angle - p.lastAngle;
            // Normalize angle difference to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            // Count rotations (accumulate angle changes)
            if (!p.rotationAngle) p.rotationAngle = 0;
            p.rotationAngle += Math.abs(angleDiff);
            if (p.rotationAngle >= Math.PI * 2) {
              p.rotations += 1;
              p.rotationAngle = 0;
            }
          }
          p.lastAngle = angle;
          p.distance = distFromEarth;

          // REALISTIC BEHAVIOR BASED ON Kp VALUE:
          if (kpValue < 5) {
            // LOW Kp: Particles DEFLECTED and rotate around Earth
            if (distFromEarth < fieldBoundaryRadius && !p.deflected) {
              // Particle hits field - DEFLECT IT
              p.deflected = true;
              p.rotations = 0;
              p.rotationAngle = 0;
            }

            if (p.deflected) {
              // Rotate around Earth - BUT NOT INSIDE L1 ORBIT
              const orbitRadius = distFromEarth;
              const orbitSpeed = 0.05;
              const newAngle = angle + orbitSpeed;

              // Check distance from L1 - particles should NOT go inside L1 orbit
              const dxFromL1 = p.x - l1X;
              const dyFromL1 = p.y - l1Y;
              const distFromL1 = Math.sqrt(
                dxFromL1 * dxFromL1 + dyFromL1 * dyFromL1
              );

              // After 2-3 rotations, spiral outward AWAY from Earth (right side only)
              if (p.rotations >= 2) {
                // Spiral outward smoothly - ONLY to the RIGHT of Earth (away from Sun and L1)
                const outwardSpeed = 0.5;
                let newRadius = orbitRadius + outwardSpeed;

                // Calculate new position based on angle and radius
                let newX = centerX + Math.cos(newAngle) * newRadius;
                let newY = centerY + Math.sin(newAngle) * newRadius;

                // Smooth constraint: Ensure particle stays RIGHT of Earth
                // If too close to left side, adjust angle to keep it on right
                if (newX < centerX + 30) {
                  // Force angle to right side (0 to 180 degrees, avoiding left side)
                  const rightAngle = Math.max(0, Math.min(Math.PI, newAngle));
                  newX = centerX + Math.cos(rightAngle) * newRadius;
                  newY = centerY + Math.sin(rightAngle) * newRadius;
                  // Recalculate radius to maintain smooth movement
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );
                }

                // Check L1 orbit boundary FIRST (before other constraints)
                const newDistFromL1 = Math.sqrt(
                  (newX - l1X) ** 2 + (newY - l1Y) ** 2
                );
                if (newDistFromL1 < l1OrbitRadius + 10) {
                  // Push out smoothly, but keep it on right side
                  const pushAngle = Math.atan2(newY - l1Y, newX - l1X);
                  const pushDistance = l1OrbitRadius + 15;
                  newX = l1X + Math.cos(pushAngle) * pushDistance;
                  newY = l1Y + Math.sin(pushAngle) * pushDistance;
                  // Recalculate radius after L1 push
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );

                  // Ensure it's still on right side after L1 push
                  if (newX < centerX + 30) {
                    // Adjust to right side while maintaining distance from L1
                    const rightAngle = Math.atan2(newY - centerY, 30);
                    newX = centerX + Math.cos(rightAngle) * newRadius;
                    newY = centerY + Math.sin(rightAngle) * newRadius;
                    newRadius = Math.sqrt(
                      (newX - centerX) ** 2 + (newY - centerY) ** 2
                    );
                  }
                }

                // Final check: Ensure particle is on right side
                if (newX < centerX + 30) {
                  newX = centerX + 30;
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );
                }

                p.x = newX;
                p.y = newY;

                // Smooth removal: Move off screen first, then reset in next cycle
                if (
                  p.x > canvas.width - 20 ||
                  newRadius > canvas.width * 0.35
                ) {
                  // Move off screen smoothly instead of instant reset
                  p.x = canvas.width + 100;
                  p.y = canvas.height + 100;
                  p.deflected = false;
                  p.penetrated = false;
                  p.rotations = 0;
                  p.rotationAngle = 0;
                  p.lastAngle = null;
                  continue;
                }
              } else {
                // Normal rotation - but respect L1 orbit boundary
                const newX = centerX + Math.cos(newAngle) * orbitRadius;
                const newY = centerY + Math.sin(newAngle) * orbitRadius;
                const newDistFromL1 = Math.sqrt(
                  (newX - l1X) ** 2 + (newY - l1Y) ** 2
                );

                // If particle would go inside L1 orbit, push it out
                if (newDistFromL1 < l1OrbitRadius + 5) {
                  const pushAngle = Math.atan2(newY - l1Y, newX - l1X);
                  p.x = l1X + Math.cos(pushAngle) * (l1OrbitRadius + 8);
                  p.y = l1Y + Math.sin(pushAngle) * (l1OrbitRadius + 8);
                } else {
                  p.x = newX;
                  p.y = newY;
                }
              }
            } else {
              // Still coming from Sun - move towards Earth (update direction as Earth moves)
              // Update velocity to point towards Earth's current position
              const sunToEarthAngle = Math.atan2(
                centerY - sunY,
                centerX - sunX
              );
              const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
              p.vx = Math.cos(sunToEarthAngle) * speed;
              p.vy = Math.sin(sunToEarthAngle) * speed;

              p.x += p.vx;
              p.y += p.vy;
            }

            // Push away if too close
            if (distFromEarth < earthRadius + 10) {
              const pushAngle = Math.atan2(dy, dx);
              p.x = centerX + Math.cos(pushAngle) * (earthRadius + 15);
              p.y = centerY + Math.sin(pushAngle) * (earthRadius + 15);
            }
          } else if (kpValue < 7) {
            // MEDIUM Kp: Some penetrate, some deflect
            if (
              distFromEarth < fieldBoundaryRadius &&
              !p.deflected &&
              !p.penetrated
            ) {
              if (Math.random() > 0.4) {
                p.deflected = true;
                p.rotations = 0;
                p.rotationAngle = 0;
              } else {
                p.penetrated = true;
              }
            }

            if (p.deflected) {
              const orbitRadius = distFromEarth;
              const orbitSpeed = 0.04;
              const newAngle = angle + orbitSpeed;

              if (p.rotations >= 2) {
                // Spiral outward smoothly - ONLY to the RIGHT of Earth (away from Sun and L1)
                const outwardSpeed = 0.4;
                let newRadius = orbitRadius + outwardSpeed;
                let newAngle = angle + orbitSpeed;

                // Calculate new position based on angle and radius
                let newX = centerX + Math.cos(newAngle) * newRadius;
                let newY = centerY + Math.sin(newAngle) * newRadius;

                // Smooth constraint: Ensure particle stays RIGHT of Earth
                // If too close to left side, adjust angle to keep it on right
                if (newX < centerX + 30) {
                  // Force angle to right side (0 to 180 degrees, avoiding left side)
                  const rightAngle = Math.max(0, Math.min(Math.PI, newAngle));
                  newX = centerX + Math.cos(rightAngle) * newRadius;
                  newY = centerY + Math.sin(rightAngle) * newRadius;
                  // Recalculate radius to maintain smooth movement
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );
                }

                // Check L1 orbit boundary FIRST (before other constraints)
                const newDistFromL1 = Math.sqrt(
                  (newX - l1X) ** 2 + (newY - l1Y) ** 2
                );
                if (newDistFromL1 < l1OrbitRadius + 10) {
                  // Push out smoothly, but keep it on right side
                  const pushAngle = Math.atan2(newY - l1Y, newX - l1X);
                  const pushDistance = l1OrbitRadius + 15;
                  newX = l1X + Math.cos(pushAngle) * pushDistance;
                  newY = l1Y + Math.sin(pushAngle) * pushDistance;
                  // Recalculate radius after L1 push
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );

                  // Ensure it's still on right side after L1 push
                  if (newX < centerX + 30) {
                    // Adjust to right side while maintaining distance from L1
                    const rightAngle = Math.atan2(newY - centerY, 30);
                    newX = centerX + Math.cos(rightAngle) * newRadius;
                    newY = centerY + Math.sin(rightAngle) * newRadius;
                    newRadius = Math.sqrt(
                      (newX - centerX) ** 2 + (newY - centerY) ** 2
                    );
                  }
                }

                // Final check: Ensure particle is on right side
                if (newX < centerX + 30) {
                  newX = centerX + 30;
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );
                }

                p.x = newX;
                p.y = newY;

                // Smooth removal: Move off screen first, then reset in next cycle
                if (
                  p.x > canvas.width - 20 ||
                  newRadius > canvas.width * 0.35
                ) {
                  // Move off screen smoothly instead of instant reset
                  p.x = canvas.width + 100;
                  p.y = canvas.height + 100;
                  p.deflected = false;
                  p.penetrated = false;
                  p.rotations = 0;
                  p.rotationAngle = 0;
                  p.lastAngle = null;
                  continue;
                }
              } else {
                // Normal rotation - respect L1 orbit
                const newX = centerX + Math.cos(newAngle) * orbitRadius;
                const newY = centerY + Math.sin(newAngle) * orbitRadius;
                const newDistFromL1 = Math.sqrt(
                  (newX - l1X) ** 2 + (newY - l1Y) ** 2
                );

                if (newDistFromL1 < l1OrbitRadius + 5) {
                  const pushAngle = Math.atan2(newY - l1Y, newX - l1X);
                  p.x = l1X + Math.cos(pushAngle) * (l1OrbitRadius + 8);
                  p.y = l1Y + Math.sin(pushAngle) * (l1OrbitRadius + 8);
                } else {
                  p.x = newX;
                  p.y = newY;
                }
              }
            } else if (!p.penetrated) {
              // Update direction towards Earth as it moves
              const sunToEarthAngle = Math.atan2(
                centerY - sunY,
                centerX - sunX
              );
              const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
              p.vx = Math.cos(sunToEarthAngle) * speed;
              p.vy = Math.sin(sunToEarthAngle) * speed;

              p.x += p.vx;
              p.y += p.vy;
            }
          } else {
            // HIGH Kp: Most penetrate
            if (distFromEarth < fieldBoundaryRadius && !p.penetrated) {
              if (Math.random() > 0.2) {
                p.penetrated = true;
              } else {
                p.deflected = true;
                p.rotations = 0;
                p.rotationAngle = 0;
              }
            }

            if (p.deflected) {
              const orbitRadius = distFromEarth;
              const orbitSpeed = 0.03;
              const newAngle = angle + orbitSpeed;

              if (p.rotations >= 2) {
                // Spiral outward smoothly - ONLY to the RIGHT of Earth (away from Sun and L1)
                const outwardSpeed = 0.35;
                let newRadius = orbitRadius + outwardSpeed;
                let newAngle = angle + orbitSpeed;

                // Calculate new position based on angle and radius
                let newX = centerX + Math.cos(newAngle) * newRadius;
                let newY = centerY + Math.sin(newAngle) * newRadius;

                // Smooth constraint: Ensure particle stays RIGHT of Earth
                // If too close to left side, adjust angle to keep it on right
                if (newX < centerX + 30) {
                  // Force angle to right side (0 to 180 degrees, avoiding left side)
                  const rightAngle = Math.max(0, Math.min(Math.PI, newAngle));
                  newX = centerX + Math.cos(rightAngle) * newRadius;
                  newY = centerY + Math.sin(rightAngle) * newRadius;
                  // Recalculate radius to maintain smooth movement
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );
                }

                // Check L1 orbit boundary FIRST (before other constraints)
                const newDistFromL1 = Math.sqrt(
                  (newX - l1X) ** 2 + (newY - l1Y) ** 2
                );
                if (newDistFromL1 < l1OrbitRadius + 10) {
                  // Push out smoothly, but keep it on right side
                  const pushAngle = Math.atan2(newY - l1Y, newX - l1X);
                  const pushDistance = l1OrbitRadius + 15;
                  newX = l1X + Math.cos(pushAngle) * pushDistance;
                  newY = l1Y + Math.sin(pushAngle) * pushDistance;
                  // Recalculate radius after L1 push
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );

                  // Ensure it's still on right side after L1 push
                  if (newX < centerX + 30) {
                    // Adjust to right side while maintaining distance from L1
                    const rightAngle = Math.atan2(newY - centerY, 30);
                    newX = centerX + Math.cos(rightAngle) * newRadius;
                    newY = centerY + Math.sin(rightAngle) * newRadius;
                    newRadius = Math.sqrt(
                      (newX - centerX) ** 2 + (newY - centerY) ** 2
                    );
                  }
                }

                // Final check: Ensure particle is on right side
                if (newX < centerX + 30) {
                  newX = centerX + 30;
                  newRadius = Math.sqrt(
                    (newX - centerX) ** 2 + (newY - centerY) ** 2
                  );
                }

                p.x = newX;
                p.y = newY;

                // Smooth removal: Move off screen first, then reset in next cycle
                if (
                  p.x > canvas.width - 20 ||
                  newRadius > canvas.width * 0.35
                ) {
                  // Move off screen smoothly instead of instant reset
                  p.x = canvas.width + 100;
                  p.y = canvas.height + 100;
                  p.deflected = false;
                  p.penetrated = false;
                  p.rotations = 0;
                  p.rotationAngle = 0;
                  p.lastAngle = null;
                  continue;
                }
              } else {
                // Normal rotation - respect L1 orbit
                const newX = centerX + Math.cos(newAngle) * orbitRadius;
                const newY = centerY + Math.sin(newAngle) * orbitRadius;
                const newDistFromL1 = Math.sqrt(
                  (newX - l1X) ** 2 + (newY - l1Y) ** 2
                );

                if (newDistFromL1 < l1OrbitRadius + 5) {
                  const pushAngle = Math.atan2(newY - l1Y, newX - l1X);
                  p.x = l1X + Math.cos(pushAngle) * (l1OrbitRadius + 8);
                  p.y = l1Y + Math.sin(pushAngle) * (l1OrbitRadius + 8);
                } else {
                  p.x = newX;
                  p.y = newY;
                }
              }
            } else if (!p.penetrated) {
              // Update direction towards Earth as it moves
              const sunToEarthAngle = Math.atan2(
                centerY - sunY,
                centerX - sunX
              );
              const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
              p.vx = Math.cos(sunToEarthAngle) * speed;
              p.vy = Math.sin(sunToEarthAngle) * speed;

              p.x += p.vx;
              p.y += p.vy;
            }
          }

          // Reset particles that are off screen (moved off screen in previous frame)
          if (
            p.x > canvas.width + 50 ||
            p.x < -50 ||
            p.y > canvas.height + 50 ||
            p.y < -50
          ) {
            // Reset from Sun towards Earth's current position
            const sunToEarthAngle = Math.atan2(centerY - sunY, centerX - sunX);
            const baseSpeed = 3 + Math.random() * 2;
            p.x = sunX + sunRadius + 5;
            p.y = sunY + (Math.random() - 0.5) * 50;
            p.vx = Math.cos(sunToEarthAngle) * baseSpeed;
            p.vy = Math.sin(sunToEarthAngle) * baseSpeed;
            p.deflected = false;
            p.penetrated = false;
            p.rotations = 0;
            p.rotationAngle = 0;
            p.lastAngle = null;
            continue; // Skip drawing this frame, will appear next frame
          }

          // Remove particles that hit Earth (only if not deflected/penetrated)
          if (!p.deflected && !p.penetrated && distFromEarth < earthRadius) {
            // Reset from Sun towards Earth's current position
            const sunToEarthAngle = Math.atan2(centerY - sunY, centerX - sunX);
            const baseSpeed = 3 + Math.random() * 2;
            p.x = sunX + sunRadius + 5;
            p.y = sunY + (Math.random() - 0.5) * 50;
            p.vx = Math.cos(sunToEarthAngle) * baseSpeed;
            p.vy = Math.sin(sunToEarthAngle) * baseSpeed;
            p.deflected = false;
            p.penetrated = false;
            p.rotations = 0;
            p.rotationAngle = 0;
            p.lastAngle = null;
            continue; // Skip drawing this frame
          }

          // Draw particle
          let particleColor;
          let particleSize = 4;

          if (p.penetrated) {
            particleColor =
              kpValue >= 8 ? "rgba(255, 0, 0, 1.0)" : "rgba(255, 100, 0, 0.9)";
            particleSize = 5;
          } else if (p.deflected) {
            particleColor = "rgba(255, 200, 0, 0.8)";
            particleSize = 4;
          } else {
            particleColor = "rgba(255, 150, 0, 0.8)";
            particleSize = 4;
          }

          ctx.fillStyle = particleColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 5;
          ctx.shadowColor = particleColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Arrow showing solar wind direction (THICKER and more visible) - NO TEXT LABEL
        ctx.strokeStyle = "#ffaa00";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sunX + sunRadius + 15, sunY);
        ctx.lineTo(centerX - fieldBoundaryRadius - 10, centerY);
        ctx.stroke();
        // Arrowhead (bigger)
        ctx.beginPath();
        ctx.moveTo(centerX - fieldBoundaryRadius - 10, centerY);
        ctx.lineTo(centerX - fieldBoundaryRadius - 18, centerY - 8);
        ctx.lineTo(centerX - fieldBoundaryRadius - 18, centerY + 8);
        ctx.closePath();
        ctx.fill();
        // Solar Wind text REMOVED as requested

        // Show shield status (better position, not overlapping with labels)
        const shieldStatusY = centerY - 75;
        if (kpValue < 5) {
          ctx.fillStyle = "#00ff00";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "🛡️ SHIELD ACTIVE - Particles Blocked",
            centerX,
            shieldStatusY
          );
        } else if (kpValue < 7) {
          ctx.fillStyle = "#ffaa00";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "⚠️ SHIELD WEAKENED - Some Penetration",
            centerX,
            shieldStatusY
          );
        } else {
          ctx.fillStyle = "#ff0000";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "🚨 SHIELD BREACHED - High Penetration",
            centerX,
            shieldStatusY
          );
        }

        // Geomagnetic field lines (REALISTIC - compression/distortion based on Kp)
        ctx.save();
        const fieldColor =
          kpValue >= 8
            ? "#ff0000"
            : kpValue >= 7
            ? "#ff4400"
            : kpValue >= 5
            ? "#ff8800"
            : "#60a5fa";
        ctx.strokeStyle = fieldColor;
        ctx.lineWidth = 2.5 + intensity * 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Field strength indicator (thicker = stronger field)
        const fieldStrength = kpValue < 5 ? 1.0 : kpValue < 7 ? 0.7 : 0.4; // Field weakens with higher Kp

        // Draw field lines - compression on day side (left), extension on night side (right)
        const fieldLineCount = 16;
        for (let i = 0; i < fieldLineCount; i++) {
          const angle = (i / fieldLineCount) * Math.PI * 2;
          const isDaySide = Math.abs(angle - Math.PI) < Math.PI / 2; // Left side (facing Sun)

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);

          const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 20;
          const steps = 60;

          for (let step = 0; step <= steps; step++) {
            const baseR =
              earthRadius + (step / steps) * (maxRadius - earthRadius);

            let r = baseR;

            // REALISTIC FIELD COMPRESSION:
            if (kpValue >= 5) {
              // High Kp: Field compressed on day side, extended on night side
              if (isDaySide) {
                // Compression (field pushed closer to Earth)
                r = baseR * (1 - intensity * 0.3); // Up to 30% compression
              } else {
                // Extension (field stretched on night side - magnetotail)
                r = baseR * (1 + intensity * 0.2); // Up to 20% extension
              }
            }

            // Distortion/wave effect (more at higher Kp)
            const distortion = intensity * 20 * fieldStrength;
            const wave = Math.sin(time * 0.2 + r * 0.1) * distortion;

            const x =
              centerX +
              Math.cos(angle) * r +
              Math.cos(Math.PI) * wave * (isDaySide ? 1 : 0.5);
            const y = centerY + Math.sin(angle) * r;

            if (step === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();

        // Label for field lines
        ctx.fillStyle = fieldColor;
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Magnetic Field",
          centerX,
          centerY + earthRadius + 25
        );

        // Distance label: Earth to L1 (drawn AFTER field lines, above them) - Cleaner
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(labelX - 50, labelY - 11, 100, 22);
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(labelX - 50, labelY - 11, 100, 22);
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("~1.5M km", labelX, labelY + 4);

        // Show field status based on Kp
        if (kpValue < 5) {
          ctx.fillStyle = "#00ff00";
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "✓ Field Strong - Normal Shape",
            centerX,
            centerY + earthRadius + 40
          );
        } else if (kpValue < 7) {
          ctx.fillStyle = "#ff8800";
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "⚠️ Field Compressed - Day Side Squashed",
            centerX,
            centerY + earthRadius + 40
          );
        } else {
          ctx.fillStyle = "#ff0000";
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "🚨 Field Heavily Distorted - Breach Risk",
            centerX,
            centerY + earthRadius + 40
          );
        }

        // Charged particles trapped in field (showing disturbance)
        const particleCount = Math.floor(intensity * 40);
        if (!(window as any).kpParticles) {
          (window as any).kpParticles = [];
        }
        let particlesArray = (window as any).kpParticles;

        // Update/create particles around field lines
        for (let i = 0; i < particleCount; i++) {
          if (!particlesArray[i]) {
            const angle = Math.random() * Math.PI * 2;
            const distance = earthRadius + 20 + Math.random() * 80;
            particlesArray[i] = {
              x: centerX + Math.cos(angle) * distance,
              y: centerY + Math.sin(angle) * distance,
              angle: angle,
              distance: distance,
              speed: 0.01 + Math.random() * 0.02,
              life: Math.random() * Math.PI * 2,
            };
          } else {
            // Particles spiral along field lines
            particlesArray[i].life += particlesArray[i].speed;
            const distortion = intensity * 15;
            const wave = Math.sin(particlesArray[i].life) * distortion;
            particlesArray[i].x =
              centerX +
              Math.cos(particlesArray[i].angle) * particlesArray[i].distance +
              Math.cos(Math.PI) * wave;
            particlesArray[i].y =
              centerY +
              Math.sin(particlesArray[i].angle) * particlesArray[i].distance +
              Math.sin(Math.PI) * wave;
          }

          const alpha = 0.5 + Math.sin(particlesArray[i].life) * 0.3;
          ctx.fillStyle =
            kpValue >= 8
              ? `rgba(255, 0, 0, ${alpha})`
              : kpValue >= 7
              ? `rgba(255, 68, 0, ${alpha})`
              : kpValue >= 5
              ? `rgba(255, 136, 0, ${alpha})`
              : `rgba(255, 200, 100, ${alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(
            particlesArray[i].x,
            particlesArray[i].y,
            2.5 + intensity,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        if (particlesArray.length > particleCount) {
          (window as any).kpParticles = particlesArray.slice(0, particleCount);
        }

        // Explanation box at bottom
        const explanationY = canvas.height - 80;
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.fillRect(10, explanationY, canvas.width - 20, 70);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.strokeRect(10, explanationY, canvas.width - 20, 70);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "left";
        ctx.fillText("💡 What is Kp Index?", 15, explanationY + 18);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        if (kpValue < 5) {
          ctx.fillText(
            "• Kp = Geomagnetic activity index (0-9 scale) measuring how disturbed Earth's magnetic field is",
            15,
            explanationY + 33
          );
          ctx.fillText(
            `• Current: ${kpValue.toFixed(
              1
            )} = LOW activity (Field STRONG - Particles DEFLECTED/BLOCKED)`,
            15,
            explanationY + 47
          );
          ctx.fillText(
            "• Why yellow particles? Strong field = Particles deflected away = Safe, blocked by magnetosphere",
            15,
            explanationY + 61
          );
          ctx.fillText(
            "• Why normal field shape? Low Kp = Weak solar wind = Field stays normal = Strong shield protecting Earth",
            15,
            explanationY + 75
          );
        } else if (kpValue < 7) {
          ctx.fillText(
            "• Kp = Geomagnetic activity index (0-9 scale) measuring how disturbed Earth's magnetic field is",
            15,
            explanationY + 33
          );
          ctx.fillText(
            `• Current: ${kpValue.toFixed(
              1
            )} = MEDIUM activity (Field WEAKENED - SOME particles penetrate)`,
            15,
            explanationY + 47
          );
          ctx.fillText(
            "• Why orange particles? Weakened field = Some particles penetrate = Field not strong enough",
            15,
            explanationY + 61
          );
          ctx.fillText(
            "• Why compressed field? Medium Kp = Stronger solar wind = Pushes field inward = Compression on day side",
            15,
            explanationY + 75
          );
        } else {
          ctx.fillText(
            "• Kp = Geomagnetic activity index (0-9 scale) measuring how disturbed Earth's magnetic field is",
            15,
            explanationY + 33
          );
          ctx.fillText(
            `• Current: ${kpValue.toFixed(
              1
            )} = HIGH activity (Field HEAVILY DISTORTED - MOST particles penetrate)`,
            15,
            explanationY + 47
          );
          ctx.fillText(
            "• Why RED particles? Distorted field = Most particles penetrate = Dangerous, reaching Earth",
            15,
            explanationY + 61
          );
          ctx.fillText(
            "• Why severely compressed? High Kp = Very strong solar wind = Field heavily compressed = Shield breached!",
            15,
            explanationY + 75
          );
        }

        // Device effects panel (REAL scientific thresholds from NOAA)
        const deviceEffects = [];

        // Power Grid (real thresholds: G1=minor fluctuations, G2=voltage alarms, G3=corrections needed, G4=widespread problems, G5=transformer damage)
        if (kpValue >= 9) {
          deviceEffects.push({
            device: "Power Grid",
            impact: "TRANSFORMER DAMAGE RISK",
            color: "#ff0000",
          });
        } else if (kpValue >= 8) {
          deviceEffects.push({
            device: "Power Grid",
            impact: "WIDESPREAD PROBLEMS",
            color: "#ff2200",
          });
        } else if (kpValue >= 7) {
          deviceEffects.push({
            device: "Power Grid",
            impact: "VOLTAGE CORRECTIONS",
            color: "#ff4400",
          });
        } else if (kpValue >= 6) {
          deviceEffects.push({
            device: "Power Grid",
            impact: "VOLTAGE ALARMS",
            color: "#ff8800",
          });
        } else if (kpValue >= 5) {
          deviceEffects.push({
            device: "Power Grid",
            impact: "MINOR FLUCTUATIONS",
            color: "#ffaa00",
          });
        } else {
          deviceEffects.push({
            device: "Power Grid",
            impact: "NORMAL",
            color: "#60a5fa",
          });
        }

        // GPS (real: G1=minor, G2=degraded, G3=degraded hours, G4=degraded hours, G5=degraded hours)
        if (kpValue >= 7) {
          deviceEffects.push({
            device: "GPS",
            impact: "DEGRADED (HOURS)",
            color: "#ff0000",
          });
        } else if (kpValue >= 6) {
          deviceEffects.push({
            device: "GPS",
            impact: "DEGRADED",
            color: "#ff8800",
          });
        } else if (kpValue >= 5) {
          deviceEffects.push({
            device: "GPS",
            impact: "MINOR ERRORS",
            color: "#ffaa00",
          });
        } else {
          deviceEffects.push({
            device: "GPS",
            impact: "NORMAL",
            color: "#60a5fa",
          });
        }

        // Satellites (real: G1=drag increase, G2=orientation issues, G3=surface charging, G4=orientation problems, G5=extensive problems)
        if (kpValue >= 8) {
          deviceEffects.push({
            device: "Satellites",
            impact: "EXTENSIVE PROBLEMS",
            color: "#ff0000",
          });
        } else if (kpValue >= 7) {
          deviceEffects.push({
            device: "Satellites",
            impact: "ORIENTATION ISSUES",
            color: "#ff4400",
          });
        } else if (kpValue >= 6) {
          deviceEffects.push({
            device: "Satellites",
            impact: "SURFACE CHARGING",
            color: "#ff8800",
          });
        } else if (kpValue >= 5) {
          deviceEffects.push({
            device: "Satellites",
            impact: "DRAG INCREASE",
            color: "#ffaa00",
          });
        } else {
          deviceEffects.push({
            device: "Satellites",
            impact: "NORMAL",
            color: "#60a5fa",
          });
        }

        // HF Radio (real: G1=weak fade, G2=fade, G3=intermittent, G4=blackout, G5=complete blackout)
        if (kpValue >= 9) {
          deviceEffects.push({
            device: "HF Radio",
            impact: "COMPLETE BLACKOUT",
            color: "#ff0000",
          });
        } else if (kpValue >= 8) {
          deviceEffects.push({
            device: "HF Radio",
            impact: "BLACKOUT",
            color: "#ff2200",
          });
        } else if (kpValue >= 7) {
          deviceEffects.push({
            device: "HF Radio",
            impact: "INTERMITTENT",
            color: "#ff4400",
          });
        } else if (kpValue >= 6) {
          deviceEffects.push({
            device: "HF Radio",
            impact: "FADE",
            color: "#ff8800",
          });
        } else if (kpValue >= 5) {
          deviceEffects.push({
            device: "HF Radio",
            impact: "WEAK FADE",
            color: "#ffaa00",
          });
        } else {
          deviceEffects.push({
            device: "HF Radio",
            impact: "NORMAL",
            color: "#60a5fa",
          });
        }

        // Aurora visibility (real effect)
        if (kpValue >= 9) {
          deviceEffects.push({
            device: "Aurora",
            impact: "VISIBLE TO 40° LAT",
            color: "#ff00ff",
          });
        } else if (kpValue >= 8) {
          deviceEffects.push({
            device: "Aurora",
            impact: "VISIBLE TO 45° LAT",
            color: "#ff44ff",
          });
        } else if (kpValue >= 7) {
          deviceEffects.push({
            device: "Aurora",
            impact: "VISIBLE TO 50° LAT",
            color: "#ff88ff",
          });
        } else if (kpValue >= 6) {
          deviceEffects.push({
            device: "Aurora",
            impact: "VISIBLE TO 55° LAT",
            color: "#ffaaff",
          });
        } else if (kpValue >= 5) {
          deviceEffects.push({
            device: "Aurora",
            impact: "VISIBLE TO 60° LAT",
            color: "#ffccff",
          });
        } else {
          deviceEffects.push({
            device: "Aurora",
            impact: "POLAR REGIONS ONLY",
            color: "#60a5fa",
          });
        }

        const panelX = canvas.width - 180;
        const panelY = 10;
        const panelWidth = 170;
        const panelHeight = deviceEffects.length * 26 + 30;

        // Panel background (smoother)
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Panel title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Real Effects (NOAA)", panelX + 8, panelY + 20);

        // Device effects
        deviceEffects.forEach((effect, idx) => {
          const y = panelY + 35 + idx * 24;
          ctx.fillStyle = effect.color;
          ctx.font = "bold 10px Arial";
          ctx.fillText(effect.device, panelX + 8, y);
          ctx.fillStyle = effect.color;
          ctx.font = "9px Arial";
          ctx.fillText(effect.impact, panelX + 8, y + 13);
        });
      }

      // Ap Index - SIMPLE & CLEAR DAILY ACTIVITY VISUALIZATION
      else if (parameterName === "Ap Index") {
        // USE LIVE DATA - ap prop takes priority, then value, then default
        const apValue = ap ?? value ?? 10;
        const intensity = Math.min(apValue / 400, 1);

        // PROPER LAYOUT - Everything well spaced
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.42; // Moved up for better spacing
        const earthRadius = 45; // Smaller Earth

        // Earth (SIMPLE)
        const earthGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        // Continents
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(centerX - 12, centerY - 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 10, centerY + 12, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", centerX, centerY + earthRadius + 25);
        ctx.fillText("EARTH", centerX, centerY + earthRadius + 25);

        // Activity level based on REAL Ap value
        let activityLevel = "QUIET";
        let activityColor = "#60a5fa";
        let activityEmoji = "✅";
        let effectText = "No effects - Normal day";
        let auroraText = "Aurora: Not visible";
        if (apValue > 50) {
          activityLevel = "VERY ACTIVE";
          activityColor = "#ff0000";
          activityEmoji = "🚨";
          effectText = "Power grid issues, GPS errors, Satellite problems";
          auroraText = "Aurora: Very bright, visible at lower latitudes";
        } else if (apValue > 30) {
          activityLevel = "ACTIVE";
          activityColor = "#ff4400";
          activityEmoji = "⚠️";
          effectText = "Minor GPS errors, Some satellite issues";
          auroraText = "Aurora: Bright, visible at mid-latitudes";
        } else if (apValue > 15) {
          activityLevel = "UNSETTLED";
          activityColor = "#ff8800";
          activityEmoji = "⚡";
          effectText = "Very minor effects possible";
          auroraText = "Aurora: Visible near poles";
        }

        // TITLE SECTION (TOP - PROPERLY SPACED)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        const titleY = 30;
        ctx.strokeText(
          "AP INDEX = Daily Geomagnetic Activity",
          centerX,
          titleY
        );
        ctx.fillText("AP INDEX = Daily Geomagnetic Activity", centerX, titleY);

        ctx.font = "bold 12px Arial";
        ctx.strokeText("(Average of 8 × 3-hour periods)", centerX, titleY + 18);
        ctx.fillText("(Average of 8 × 3-hour periods)", centerX, titleY + 18);

        // SIMPLE & CLEAR ANIMATION: One ring showing activity level
        const ringRadius = earthRadius + 55; // Proper spacing
        const ringThickness = 4 + intensity * 7;

        // Activity ring around Earth (VISIBLE & CLEAR - Shows geomagnetic activity)
        ctx.strokeStyle = activityColor;
        ctx.lineWidth = ringThickness;
        ctx.shadowBlur = 20 * intensity;
        ctx.shadowColor = activityColor;

        // Pulse effect (SHOWS ACTIVITY HAPPENING - Ring expands/contracts)
        const pulse = Math.sin(time * 2) * intensity * 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Particles flowing around Earth (CLEAR & VISIBLE - Shows charged particles)
        const particleCount = Math.floor(10 + intensity * 25); // 10-35 particles
        for (let p = 0; p < particleCount; p++) {
          const angle =
            (p / particleCount) * Math.PI * 2 + time * (0.5 + intensity * 0.4);
          const px = centerX + Math.cos(angle) * ringRadius;
          const py = centerY + Math.sin(angle) * ringRadius;

          // Particle with glow (shows charged particles moving)
          ctx.fillStyle = activityColor;
          ctx.shadowBlur = 15;
          ctx.shadowColor = activityColor;
          ctx.beginPath();
          ctx.arc(px, py, 4 + intensity * 5, 0, Math.PI * 2);
          ctx.fill();

          // Particle trail (shows movement direction - CLEAR)
          if (intensity > 0.15) {
            ctx.strokeStyle = activityColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            const trailAngle = angle - (0.5 + intensity * 0.4) * 20;
            const trailX = centerX + Math.cos(trailAngle) * ringRadius;
            const trailY = centerY + Math.sin(trailAngle) * ringRadius;
            ctx.beginPath();
            ctx.moveTo(trailX, trailY);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // VISUAL EFFECTS: Show what happens when particles flow (PROPERLY SPACED)
        const effectDistance = 100; // Proper distance - no overlap
        const iconSize = 5; // Smaller icons
        const labelOffset = 22; // Distance for labels below icons

        // Satellites (top right - 45 degrees)
        const satAngle = Math.PI * 0.25;
        const satX = centerX + Math.cos(satAngle) * effectDistance;
        const satY = centerY - Math.sin(satAngle) * effectDistance;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(satX, satY, iconSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          satX - iconSize * 0.75,
          satY - iconSize * 0.4,
          iconSize * 1.5,
          iconSize * 0.8
        );
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(satX - iconSize - 3, satY - 1, 3, 3);
        ctx.fillRect(satX + iconSize, satY - 1, 3, 3);

        // Satellite status (affected by activity) - PROPERLY POSITIONED
        if (intensity > 0.3) {
          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(satX, satY);
          ctx.lineTo(
            centerX + Math.cos(satAngle) * ringRadius,
            centerY + Math.sin(satAngle) * ringRadius
          );
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#ff0000";
          ctx.font = "bold 9px Arial";
          ctx.fillText("⚠️", satX + 8, satY - 3);
        } else {
          ctx.fillStyle = "#00ff00";
          ctx.font = "bold 9px Arial";
          ctx.fillText("✓", satX + 8, satY - 3);
        }
        // Label BELOW icon - PROPERLY SPACED
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Satellite", satX, satY + labelOffset);
        ctx.textAlign = "left";

        // GPS Signal (top left - 135 degrees) - PROPERLY POSITIONED
        const gpsAngle = Math.PI * 0.75;
        const gpsX = centerX + Math.cos(gpsAngle) * effectDistance;
        const gpsY = centerY - Math.sin(gpsAngle) * effectDistance;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("📡", gpsX, gpsY);

        // GPS status - PROPERLY POSITIONED
        if (intensity > 0.4) {
          ctx.strokeStyle = "#ff4400";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(gpsX, gpsY);
          ctx.lineTo(
            centerX + Math.cos(gpsAngle) * ringRadius,
            centerY + Math.sin(gpsAngle) * ringRadius
          );
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#ff4400";
          ctx.font = "bold 9px Arial";
          ctx.fillText("⚠️", gpsX - 25, gpsY - 3);
        } else {
          ctx.fillStyle = "#00ff00";
          ctx.font = "bold 9px Arial";
          ctx.fillText("✓", gpsX - 25, gpsY - 3);
        }
        // Label BELOW icon - PROPERLY SPACED
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GPS", gpsX, gpsY + labelOffset);
        ctx.textAlign = "left";

        // Power Grid (bottom right - 225 degrees) - PROPERLY POSITIONED
        const powerAngle = Math.PI * 1.25;
        const powerX = centerX + Math.cos(powerAngle) * effectDistance;
        const powerY = centerY + Math.sin(powerAngle) * effectDistance;
        ctx.fillStyle = "#ffaa00";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⚡", powerX, powerY);

        // Power grid status - PROPERLY POSITIONED
        if (intensity > 0.5) {
          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(powerX, powerY);
          ctx.lineTo(
            centerX + Math.cos(powerAngle) * ringRadius,
            centerY + Math.sin(powerAngle) * ringRadius
          );
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#ff0000";
          ctx.font = "bold 9px Arial";
          ctx.fillText("🚨", powerX + 8, powerY - 3);
        } else {
          ctx.fillStyle = "#00ff00";
          ctx.font = "bold 9px Arial";
          ctx.fillText("✓", powerX + 8, powerY - 3);
        }
        // Label BELOW icon - PROPERLY SPACED
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Power", powerX, powerY + labelOffset);
        ctx.textAlign = "left";

        // Radio Communication (bottom left - 315 degrees) - PROPERLY POSITIONED
        const radioAngle = Math.PI * 1.75;
        const radioX = centerX + Math.cos(radioAngle) * effectDistance;
        const radioY = centerY + Math.sin(radioAngle) * effectDistance;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("📻", radioX, radioY);

        // Radio status - PROPERLY POSITIONED
        if (intensity > 0.35) {
          ctx.strokeStyle = "#ff8800";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(radioX, radioY);
          ctx.lineTo(
            centerX + Math.cos(radioAngle) * ringRadius,
            centerY + Math.sin(radioAngle) * ringRadius
          );
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#ff8800";
          ctx.font = "bold 9px Arial";
          ctx.fillText("⚠️", radioX - 25, radioY - 3);
        } else {
          ctx.fillStyle = "#00ff00";
          ctx.font = "bold 9px Arial";
          ctx.fillText("✓", radioX - 25, radioY - 3);
        }
        // Label BELOW icon - PROPERLY SPACED
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Radio", radioX, radioY + labelOffset);
        ctx.textAlign = "left";

        // CLEAR LABEL: What is happening? (PROPERLY POSITIONED - NO OVERLAP)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        const labelY = centerY - ringRadius - 38; // Proper spacing from ring
        ctx.strokeText("Geomagnetic Activity Around Earth", centerX, labelY);
        ctx.fillText("Geomagnetic Activity Around Earth", centerX, labelY);

        // Activity level indicator (PROPERLY SPACED)
        ctx.fillStyle = activityColor;
        ctx.font = "bold 11px Arial";
        ctx.strokeText(
          `Activity Level: ${activityLevel}`,
          centerX,
          labelY + 16
        );
        ctx.fillText(`Activity Level: ${activityLevel}`, centerX, labelY + 16);

        // AURORA VISUALIZATION (Shows aurora when activity is high) - PROPERLY POSITIONED
        if (intensity > 0.2) {
          // Aurora appears at Earth's poles (top and bottom)
          const auroraIntensity = Math.min((intensity - 0.2) / 0.8, 1);

          // Northern Aurora (top of Earth) - PROPERLY SIZED
          const auroraNorthY = centerY - earthRadius - 6;
          const auroraNorthWidth = 55 + auroraIntensity * 45;
          const auroraNorthHeight = 10 + auroraIntensity * 18;

          // Aurora colors (green, blue, purple, red)
          const auroraColors = [
            `rgba(0, 255, 100, ${0.3 + auroraIntensity * 0.5})`, // Green
            `rgba(100, 200, 255, ${0.2 + auroraIntensity * 0.4})`, // Blue
            `rgba(200, 100, 255, ${0.1 + auroraIntensity * 0.3})`, // Purple
            `rgba(255, 100, 100, ${0.1 + auroraIntensity * 0.2})`, // Red (for high activity)
          ];

          // Draw northern aurora (wavy, flowing effect)
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = auroraColors[i];
            ctx.beginPath();
            const waveOffset = Math.sin(time * 2 + i) * 10;
            for (
              let x = centerX - auroraNorthWidth / 2;
              x < centerX + auroraNorthWidth / 2;
              x += 2
            ) {
              const wave =
                Math.sin((x - centerX) / 15 + time * 1.5 + i) *
                (5 + auroraIntensity * 10);
              const y = auroraNorthY + wave + waveOffset;
              if (x === centerX - auroraNorthWidth / 2) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.lineTo(
              centerX + auroraNorthWidth / 2,
              auroraNorthY + auroraNorthHeight
            );
            ctx.lineTo(
              centerX - auroraNorthWidth / 2,
              auroraNorthY + auroraNorthHeight
            );
            ctx.closePath();
            ctx.fill();
          }

          // Southern Aurora (bottom of Earth) - PROPERLY SIZED
          const auroraSouthY = centerY + earthRadius + 6;
          const auroraSouthWidth = 55 + auroraIntensity * 45;
          const auroraSouthHeight = 10 + auroraIntensity * 18;

          // Draw southern aurora
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = auroraColors[i];
            ctx.beginPath();
            const waveOffset = Math.sin(time * 2 + i + Math.PI) * 10;
            for (
              let x = centerX - auroraSouthWidth / 2;
              x < centerX + auroraSouthWidth / 2;
              x += 2
            ) {
              const wave =
                Math.sin((x - centerX) / 15 + time * 1.5 + i + Math.PI) *
                (5 + auroraIntensity * 10);
              const y = auroraSouthY - wave - waveOffset;
              if (x === centerX - auroraSouthWidth / 2) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.lineTo(
              centerX + auroraSouthWidth / 2,
              auroraSouthY - auroraSouthHeight
            );
            ctx.lineTo(
              centerX - auroraSouthWidth / 2,
              auroraSouthY - auroraSouthHeight
            );
            ctx.closePath();
            ctx.fill();
          }

          // Aurora label (VISIBLE - Properly positioned above aurora)
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          ctx.fillRect(centerX - 65, auroraNorthY - 16, 130, 18);
          ctx.fillStyle = "#00ff88";
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText("✨ Aurora Visible", centerX, auroraNorthY - 4);
          ctx.fillText("✨ Aurora Visible", centerX, auroraNorthY - 4);
        } else {
          // No aurora message (VISIBLE - Properly positioned, no overlap)
          const auroraMsgY = labelY + 34; // Below activity level, proper spacing
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.fillRect(centerX - 110, auroraMsgY - 8, 220, 16);
          ctx.fillStyle = "#888888";
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.strokeText(
            "Aurora: Not visible (low activity)",
            centerX,
            auroraMsgY + 4
          );
          ctx.fillText(
            "Aurora: Not visible (low activity)",
            centerX,
            auroraMsgY + 4
          );
        }

        // SIMPLE DATA PANEL (BOTTOM - CLEAR & EASY TO UNDERSTAND)
        const panelX = 15;
        const panelY = canvas.height - 160; // More space from bottom
        const panelWidth = canvas.width - 30;
        const panelHeight = 145; // Increased for Aurora row
        const panelPadding = 20;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
        ctx.fill();
        ctx.strokeStyle = activityColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
        ctx.stroke();

        // Row 1: Ap Value & Status (PROPERLY ALIGNED)
        ctx.fillStyle = activityColor;
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          `Ap Index: ${apValue.toFixed(0)}`,
          panelX + panelPadding,
          panelY + 30
        );

        ctx.fillStyle = activityColor;
        ctx.font = "bold 17px Arial";
        ctx.fillText(
          `${activityEmoji} ${activityLevel}`,
          panelX + panelPadding + 200,
          panelY + 30
        );

        // Progress bar (PROPERLY POSITIONED)
        const progressWidth = 280;
        const progressHeight = 9;
        const progressX = panelX + panelPadding + 480;
        const progressY = panelY + 22;
        const progressValue = Math.min(apValue / 400, 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.4)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 4);
        ctx.fill();

        ctx.fillStyle = activityColor;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          4
        );
        ctx.fill();

        // Labels (PROPERLY SPACED)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "left";
        ctx.fillText("QUIET", progressX, progressY - 7);
        ctx.textAlign = "right";
        ctx.fillText("VERY ACTIVE", progressX + progressWidth, progressY - 7);
        ctx.textAlign = "left";

        // Row 2: What it means (PROPERLY SPACED)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.fillText(
          "What does this mean?",
          panelX + panelPadding,
          panelY + 58
        );
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "Daily average of geomagnetic activity (8 × 3-hour periods)",
          panelX + panelPadding,
          panelY + 75
        );

        // Row 3: Effects (PROPERLY SPACED)
        ctx.fillStyle = activityColor;
        ctx.font = "bold 14px Arial";
        ctx.fillText("Effects:", panelX + panelPadding, panelY + 98);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px Arial";
        ctx.fillText(effectText, panelX + panelPadding + 70, panelY + 98);

        // Row 4: Aurora (PROPERLY SPACED)
        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 14px Arial";
        ctx.fillText("Aurora:", panelX + panelPadding, panelY + 120);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px Arial";
        ctx.fillText(auroraText, panelX + panelPadding + 70, panelY + 120);

        // EDUCATIONAL EXPLANATION BOX (BOTTOM)
        const explanationY = canvas.height - 120;
        const explanationHeight = 105;
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = activityColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is Ap Index?",
          explanationX + 10,
          explanationY + 20
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• Ap = Daily average of geomagnetic activity (average of 8 × 3-hour Kp values)",
          explanationX + 10,
          explanationY + 40
        );
        ctx.fillText(
          `• Current: ${apValue.toFixed(
            0
          )} = ${activityLevel.toLowerCase()} day (Range: 0-400)`,
          explanationX + 10,
          explanationY + 55
        );
        ctx.fillText(
          "• Why the ring around Earth? Ring shows geomagnetic activity level = Charged particles flowing around Earth",
          explanationX + 10,
          explanationY + 70
        );
        ctx.fillText(
          "• Why effects shown? High Ap = More particles = More energy = Affects satellites, GPS, power grids, radio",
          explanationX + 10,
          explanationY + 85
        );
        ctx.fillText(
          "• Why aurora? Charged particles enter atmosphere at poles = Collide with air molecules = Aurora lights!",
          explanationX + 10,
          explanationY + 100
        );
        ctx.fillText(effectText, panelX + panelPadding + 70, panelY + 98);

        // Row 4: Aurora (PROPERLY SPACED - VISIBLE)
        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 14px Arial";
        ctx.fillText("Aurora:", panelX + panelPadding, panelY + 118);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px Arial";
        ctx.fillText(auroraText, panelX + panelPadding + 70, panelY + 118);
      }

      // DST Index - Ring Current Visualization (REAL-TIME & CLEAR)
      else if (parameterName === "DST Index") {
        // USE LIVE DATA - dst prop takes priority, then value, then default
        const dstValue = dst ?? value ?? -10;
        const absDst = Math.abs(dstValue);
        const intensity = Math.min(absDst / 200, 1);

        // FIXED LAYOUT - NO EARTH ROTATION, BUT ELLIPTICAL ORBIT VISIBLE
        // Earth position (FIXED - no rotation)
        const centerX = canvas.width * 0.65; // Fixed position, shifted right
        const centerY = canvas.height * 0.5; // Center vertically

        // Sun position (fixed, left side)
        const sunX = 70;
        const sunY = centerY;
        const sunRadius = 30;

        // L1 position (between Sun and Earth, FIXED)
        const sunToEarthDist = centerX - sunX;
        const l1DistFromEarth = 120; // ~1.5M km (adjusted for scale)
        const l1X = centerX - l1DistFromEarth;
        const l1Y = centerY;

        const earthRadius = 40;
        const l1OrbitRadius = 18;

        // Earth's ELLIPTICAL ORBIT path (dashed, visible)
        const orbitCenterX = (sunX + centerX) / 2; // Center of ellipse between Sun and Earth
        const orbitCenterY = centerY;
        const semiMajorAxis = (centerX - sunX) / 2; // Half the distance from Sun to Earth
        const semiMinorAxis = 50; // Elliptical shape

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)"; // More visible blue
        ctx.lineWidth = 2; // Thicker for visibility
        ctx.setLineDash([8, 4]); // Dashed pattern
        ctx.beginPath();
        // Draw elliptical orbit
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for Earth's orbit
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - semiMinorAxis - 15
        );

        // Sun
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffeb3b");
        sunGradient.addColorStop(0.5, "#ff9800");
        sunGradient.addColorStop(1, "#ff5722");
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 18);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 18);

        // Solar wind arrow (from Sun to Earth)
        const arrowAngle = Math.atan2(centerY - sunY, centerX - sunX);
        const arrowStartX = sunX + sunRadius + 10;
        const arrowStartY = sunY;
        const arrowLength = Math.min(sunToEarthDist * 0.3, 150);
        const arrowEndX = arrowStartX + Math.cos(arrowAngle) * arrowLength;
        const arrowEndY = arrowStartY + Math.sin(arrowAngle) * arrowLength;

        ctx.strokeStyle = "#ffaa00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowEndX, arrowEndY);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX - 10 * Math.cos(arrowAngle - 0.3),
          arrowEndY - 10 * Math.sin(arrowAngle - 0.3)
        );
        ctx.lineTo(
          arrowEndX - 10 * Math.cos(arrowAngle + 0.3),
          arrowEndY - 10 * Math.sin(arrowAngle + 0.3)
        );
        ctx.closePath();
        ctx.fillStyle = "#ffaa00";
        ctx.fill();

        // Aditya L1 Satellite (BIGGER & DETAILED)
        const satelliteSize = 14;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        // Satellite body
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.6,
          l1Y - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );
        // Solar panels
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 4, 8, 8);
        ctx.fillRect(l1X + satelliteSize, l1Y - 4, 8, 8);
        // Antenna
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("Aditya L1", l1X, l1Y + satelliteSize + 15);
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 15);

        // L1 Orbit
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ff00";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, l1OrbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 11px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText("L1 Orbit", l1X, l1Y - l1OrbitRadius - 8);
        ctx.fillText("L1 Orbit", l1X, l1Y - l1OrbitRadius - 8);

        // PROPER DISTANCE MARKERS (Clear, Non-Overlapping)

        // Distance marker 1: Sun to Earth (~150M km) - ABOVE
        const sunToEarthMidX = (sunX + centerX) / 2;
        const sunToEarthMidY = sunY - 50; // Well above
        ctx.strokeStyle = "#888888";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(sunX + sunRadius, sunY);
        ctx.lineTo(centerX - earthRadius, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label with background
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(sunToEarthMidX - 60, sunToEarthMidY - 12, 120, 22);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("~150 Million km", sunToEarthMidX, sunToEarthMidY + 5);

        // Distance marker 2: Earth to L1 (~1.5M km) - BELOW to avoid overlap
        const earthToL1MidX = (centerX + l1X) / 2;
        const earthToL1MidY = centerY + 80; // Below Earth
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX - earthRadius, centerY);
        ctx.lineTo(l1X + l1OrbitRadius, l1Y);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label with background
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(earthToL1MidX - 50, earthToL1MidY - 12, 100, 22);
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 12px Arial";
        ctx.fillText("~1.5 Million km", earthToL1MidX, earthToL1MidY + 5);

        // Earth
        const earthGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        // Continents
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(centerX - 8, centerY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 6, centerY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", centerX, centerY + earthRadius + 18);
        ctx.fillText("EARTH", centerX, centerY + earthRadius + 18);

        // RING CURRENT VISUALIZATION (Main Feature - CLEAR & VISIBLE)
        // Ring current is a torus of charged particles around Earth's equator
        // More negative DST = stronger ring current = more particles = stronger storm

        const ringCurrentRadius = 60 + intensity * 40; // Expands with storm intensity
        const ringThickness = 8 + intensity * 12; // Thicker with stronger storm
        const particleCount = Math.min(30 + Math.floor(intensity * 50), 80);

        // Label: "RING CURRENT" above Earth (CLEAR, FULLY VISIBLE, NOT HIDDEN)
        const ringLabelY = centerY - ringCurrentRadius - 70; // Even higher to avoid distance markers and panels
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px Arial"; // Bigger for visibility
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5; // Thicker stroke for better visibility
        // Draw text with background for better visibility
        const textWidth = ctx.measureText("RING CURRENT").width;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Dark background
        ctx.fillRect(
          centerX - textWidth / 2 - 10,
          ringLabelY - 18,
          textWidth + 20,
          28
        );
        ctx.fillStyle = "#ffffff";
        ctx.strokeText("RING CURRENT", centerX, ringLabelY);
        ctx.fillText("RING CURRENT", centerX, ringLabelY);

        // Simple explanation arrow pointing to ring current (visible)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3; // Thicker for visibility
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, ringLabelY + 20);
        ctx.lineTo(centerX, centerY - ringCurrentRadius - 5);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring current particles (charged particles flowing around Earth)
        if (!(window as any).dstParticles) {
          (window as any).dstParticles = [];
          for (let i = 0; i < particleCount; i++) {
            (window as any).dstParticles.push({
              angle: (Math.PI * 2 * i) / particleCount,
              speed: 0.03 + Math.random() * 0.02,
              radius: ringCurrentRadius + (Math.random() - 0.5) * ringThickness,
              life: Math.random() * Math.PI * 2,
            });
          }
        }

        const particlesArray = (window as any).dstParticles;

        // Update and draw ring current particles
        particlesArray.forEach((p: any, i: number) => {
          p.angle += p.speed * (1 + intensity * 2); // Faster with stronger storm
          p.life += 0.1;

          // Particle position on ring current torus
          const particleX = centerX + Math.cos(p.angle) * p.radius;
          const particleY = centerY + Math.sin(p.angle) * p.radius;

          // Color based on DST value (more negative = redder)
          let particleColor;
          if (dstValue <= -200) {
            particleColor = `rgba(255, 0, 0, ${0.8 + Math.sin(p.life) * 0.2})`; // Red - Extreme
          } else if (dstValue <= -100) {
            particleColor = `rgba(255, 68, 0, ${0.7 + Math.sin(p.life) * 0.2})`; // Orange-Red - Severe
          } else if (dstValue <= -50) {
            particleColor = `rgba(255, 136, 0, ${
              0.6 + Math.sin(p.life) * 0.2
            })`; // Orange - Moderate
          } else if (dstValue <= -30) {
            particleColor = `rgba(255, 200, 100, ${
              0.5 + Math.sin(p.life) * 0.2
            })`; // Yellow - Minor
          } else {
            particleColor = `rgba(100, 200, 255, ${
              0.6 + Math.sin(p.life) * 0.2
            })`; // Blue - Quiet (more visible)
          }

          ctx.fillStyle = particleColor;
          ctx.shadowBlur = 10 + intensity * 5; // Brighter glow for visibility
          ctx.shadowColor = particleColor;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 4 + intensity * 3, 0, Math.PI * 2); // Bigger particles
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Ring current torus visualization (3D effect - MORE VISIBLE)
        for (let ring = 0; ring < 3; ring++) {
          const currentRadius = ringCurrentRadius + ring * 15;
          const alpha = 0.5 + intensity * 0.4; // More visible

          ctx.strokeStyle =
            dstValue <= -200
              ? `rgba(255, 0, 0, ${alpha})`
              : dstValue <= -100
              ? `rgba(255, 68, 0, ${alpha})`
              : dstValue <= -50
              ? `rgba(255, 136, 0, ${alpha})`
              : dstValue <= -30
              ? `rgba(255, 200, 100, ${alpha})`
              : `rgba(100, 200, 255, ${alpha})`;
          ctx.lineWidth = 3 + intensity * 4; // Thicker lines

          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor =
            dstValue <= -200
              ? "#ff0000"
              : dstValue <= -100
              ? "#ff4400"
              : dstValue <= -50
              ? "#ff8800"
              : dstValue <= -30
              ? "#ffaa00"
              : "#60a5fa";

          ctx.beginPath();
          for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
            const x = centerX + Math.cos(angle + time * 0.5) * currentRadius;
            const y = centerY + Math.sin(angle + time * 0.5) * currentRadius;
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Energy flow visualization (particles entering ring current from solar wind)
        const energyParticleCount = Math.min(Math.floor(intensity * 20), 15);
        for (let i = 0; i < energyParticleCount; i++) {
          const flowAngle =
            time * 0.5 + (i * Math.PI * 2) / energyParticleCount;
          const flowRadius =
            ringCurrentRadius + 30 + Math.sin(flowAngle * 2) * 10;
          const flowX = centerX + Math.cos(flowAngle) * flowRadius;
          const flowY = centerY + Math.sin(flowAngle) * flowRadius;

          // Draw energy particle flowing into ring current
          ctx.fillStyle =
            dstValue <= -100
              ? "rgba(255, 100, 0, 0.8)"
              : "rgba(255, 200, 100, 0.6)";
          ctx.beginPath();
          ctx.arc(flowX, flowY, 2 + intensity, 0, Math.PI * 2);
          ctx.fill();
        }

        // DST VALUE DISPLAY WITH VISUAL GAUGE (Top Left - COMPACT, NO OVERLAPPING)
        const gaugeX = 10;
        const gaugeY = 10;
        const gaugeWidth = 200; // Slightly smaller
        const gaugeHeight = 95; // Slightly taller to fit all without overlap

        // Background box
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.fillRect(gaugeX - 5, gaugeY - 5, gaugeWidth, gaugeHeight);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.strokeRect(gaugeX - 5, gaugeY - 5, gaugeWidth, gaugeHeight);

        // DST Value (BIG)
        ctx.fillStyle =
          dstValue <= -200
            ? "#ff0000"
            : dstValue <= -100
            ? "#ff4400"
            : dstValue <= -50
            ? "#ff8800"
            : dstValue <= -30
            ? "#ffaa00"
            : "#60a5fa";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Dst: ${dstValue.toFixed(1)} nT`, gaugeX, gaugeY + 20);

        // Storm Level (BIG)
        let stormLevel = "QUIET";
        let stormColor = "#60a5fa";
        let stormEmoji = "✅";
        if (dstValue <= -200) {
          stormLevel = "EXTREME STORM";
          stormColor = "#ff0000";
          stormEmoji = "🚨";
        } else if (dstValue <= -100) {
          stormLevel = "SEVERE STORM";
          stormColor = "#ff4400";
          stormEmoji = "⚠️";
        } else if (dstValue <= -50) {
          stormLevel = "MODERATE STORM";
          stormColor = "#ff8800";
          stormEmoji = "⚡";
        } else if (dstValue <= -30) {
          stormLevel = "MINOR STORM";
          stormColor = "#ffaa00";
          stormEmoji = "🌟";
        }

        ctx.fillStyle = stormColor;
        ctx.font = "bold 16px Arial";
        ctx.fillText(`${stormEmoji} ${stormLevel}`, gaugeX, gaugeY + 40); // Moved up slightly

        // Visual Danger Meter (Progress Bar) - MOVED DOWN to avoid overlap with QUIET
        const meterY = gaugeY + 55; // Moved down from 50 to 55
        const meterWidth = gaugeWidth - 10;
        const meterHeight = 8;

        // Background
        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.fillRect(gaugeX, meterY, meterWidth, meterHeight);

        // Fill based on DST intensity (more negative = more filled)
        const fillPercent = Math.min(absDst / 200, 1);
        ctx.fillStyle =
          dstValue <= -200
            ? "#ff0000"
            : dstValue <= -100
            ? "#ff4400"
            : dstValue <= -50
            ? "#ff8800"
            : dstValue <= -30
            ? "#ffaa00"
            : "#60a5fa";
        ctx.fillRect(gaugeX, meterY, meterWidth * fillPercent, meterHeight);

        // Labels on meter - MOVED DOWN to avoid overlap
        ctx.fillStyle = "#ffffff";
        ctx.font = "9px Arial";
        ctx.textAlign = "left";
        ctx.fillText("SAFE", gaugeX, meterY - 5); // Moved up from -3 to -5 for more space
        ctx.textAlign = "right";
        ctx.fillText("DANGER", gaugeX + meterWidth, meterY - 5); // Moved up from -3 to -5
        ctx.textAlign = "left";

        // Ring Current Status (CLEAR, COMPACT) - MOVED DOWN
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial"; // Smaller
        ctx.fillText("Ring Current:", gaugeX, gaugeY + 72); // Moved down from 68 to 72
        ctx.fillStyle =
          dstValue <= -100
            ? "#ff0000"
            : dstValue <= -50
            ? "#ff8800"
            : "#60a5fa";
        ctx.font = "bold 11px Arial"; // Smaller
        const ringStatus =
          dstValue <= -200
            ? "🔴 EXTREME"
            : dstValue <= -100
            ? "🟠 VERY INTENSE"
            : dstValue <= -50
            ? "🟡 INTENSIFYING"
            : dstValue <= -30
            ? "🟢 SLIGHTLY ACTIVE"
            : "🔵 NORMAL";
        ctx.fillText(ringStatus, gaugeX, gaugeY + 86); // Moved down from 82 to 86

        // SIMPLE EXPLANATION BOX (Bottom - Easy to Understand, NON-OVERLAPPING)
        const explanationY = canvas.height - 115; // Moved up to avoid bottom edge
        const explanationHeight = 105;
        ctx.fillStyle = "rgba(15, 23, 42, 0.98)"; // More opaque for better readability
        ctx.fillRect(10, explanationY, canvas.width - 20, explanationHeight);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 3; // Thicker border
        ctx.strokeRect(10, explanationY, canvas.width - 20, explanationHeight);

        // Title (BOLD & BIG)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial"; // Bigger
        ctx.textAlign = "left";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText(
          "📊 What is DST? (Simple Explanation)",
          15,
          explanationY + 22
        );
        ctx.fillText(
          "📊 What is DST? (Simple Explanation)",
          15,
          explanationY + 22
        );

        ctx.fillStyle = "#e2e8f0"; // Lighter gray for better readability
        ctx.font = "bold 13px Arial"; // BOLD & BIGGER

        // Simple explanation based on DST value (ALL BOLD & READABLE)
        if (dstValue <= -200) {
          ctx.fillStyle = "#ff0000";
          ctx.font = "bold 14px Arial"; // Bigger
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText("🚨 EXTREME DANGER!", 15, explanationY + 42);
          ctx.fillText("🚨 EXTREME DANGER!", 15, explanationY + 42);
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 13px Arial"; // BOLD
          ctx.fillText(
            "• Why RED particles? Strong ring current = Many charged particles = Dangerous energy",
            15,
            explanationY + 58
          );
          ctx.fillText(
            "• Why around Earth? Ring current flows around equator = Charged particles trapped in magnetic field",
            15,
            explanationY + 74
          );
          ctx.fillText(
            "• Result: Strong current = Induces electric fields = Power grid issues, GPS errors, satellite damage!",
            15,
            explanationY + 90
          );
        } else if (dstValue <= -100) {
          ctx.fillStyle = "#ff4400";
          ctx.font = "bold 14px Arial"; // Bigger
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText("⚠️ SEVERE STORM!", 15, explanationY + 42);
          ctx.fillText("⚠️ SEVERE STORM!", 15, explanationY + 42);
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 13px Arial"; // BOLD
          ctx.fillText(
            "• Why ring around Earth? Ring current = Charged particles flowing around equator = Creates magnetic field",
            15,
            explanationY + 58
          );
          ctx.fillText(
            "• Why orange-red particles? Strong current = Many particles = More energy = Dangerous for satellites",
            15,
            explanationY + 74
          );
          ctx.fillText(
            "• Result: Strong current = Induces electric fields = Power fluctuations, GPS errors, satellite problems!",
            15,
            explanationY + 90
          );
        } else if (dstValue <= -50) {
          ctx.fillStyle = "#ff8800";
          ctx.font = "bold 14px Arial"; // Bigger
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText("⚡ MODERATE STORM", 15, explanationY + 42);
          ctx.fillText("⚡ MODERATE STORM", 15, explanationY + 42);
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 13px Arial"; // BOLD
          ctx.fillText(
            "• Why ring around Earth? Ring current = Charged particles flowing around equator = Creates magnetic field",
            15,
            explanationY + 58
          );
          ctx.fillText(
            "• Why orange particles? Moderate current = Some particles = Moderate energy = Some effects",
            15,
            explanationY + 74
          );
          ctx.fillText(
            "• Result: Moderate current = Minor electric fields = Minor power fluctuations, slight GPS errors",
            15,
            explanationY + 90
          );
        } else if (dstValue <= -30) {
          ctx.fillStyle = "#ffaa00";
          ctx.font = "bold 14px Arial"; // Bigger
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText("🌟 MINOR STORM", 15, explanationY + 42);
          ctx.fillText("🌟 MINOR STORM", 15, explanationY + 42);
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 13px Arial"; // BOLD
          ctx.fillText(
            "• Why ring around Earth? Ring current = Charged particles flowing around equator = Creates magnetic field",
            15,
            explanationY + 58
          );
          ctx.fillText(
            "• Why yellow particles? Weak current = Few particles = Low energy = Very minor effects",
            15,
            explanationY + 74
          );
          ctx.fillText(
            "• Result: Weak current = Minimal electric fields = Everything mostly normal, very small effects",
            15,
            explanationY + 90
          );
        } else {
          ctx.fillStyle = "#60a5fa";
          ctx.font = "bold 14px Arial"; // Bigger
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText(
            "✅ ALL CLEAR - QUIET CONDITIONS",
            15,
            explanationY + 42
          );
          ctx.fillText(
            "✅ ALL CLEAR - QUIET CONDITIONS",
            15,
            explanationY + 42
          );
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 13px Arial"; // BOLD
          ctx.fillText(
            "• Charged particles around Earth are NORMAL",
            15,
            explanationY + 58
          );
          ctx.fillText(
            "• Blue particles = Safe conditions, no danger",
            15,
            explanationY + 74
          );
          ctx.fillText(
            "• ✅ All systems working normally, no problems expected",
            15,
            explanationY + 90
          );
        }

        // Visual indicator: What the particles mean (BIGGER & MORE VISIBLE, NO OVERLAPPING)
        const indicatorX = canvas.width - 190;
        const indicatorY = explanationY + 5; // Moved up slightly
        const indicatorWidth = 180; // Slightly wider
        const indicatorHeight = 95; // Taller to fit all without overlap
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)"; // More opaque
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 3; // Thicker border
        ctx.strokeRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial"; // Bigger
        ctx.textAlign = "left";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText("Particle Colors:", indicatorX + 10, indicatorY + 20);
        ctx.fillText("Particle Colors:", indicatorX + 10, indicatorY + 20);

        ctx.font = "bold 12px Arial"; // BOLD & BIGGER
        // Blue (safe) - BIGGER
        ctx.fillStyle = "#60a5fa";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#60a5fa";
        ctx.beginPath();
        ctx.arc(indicatorX + 12, indicatorY + 35, 7, 0, Math.PI * 2); // Bigger circle
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#e2e8f0"; // Lighter for readability
        ctx.fillText("= Safe (Normal)", indicatorX + 24, indicatorY + 40);

        // Yellow (minor) - BIGGER
        ctx.fillStyle = "#ffaa00";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ffaa00";
        ctx.beginPath();
        ctx.arc(indicatorX + 12, indicatorY + 52, 7, 0, Math.PI * 2); // Bigger circle
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("= Minor Effects", indicatorX + 24, indicatorY + 57);

        // Orange (moderate) - BIGGER
        ctx.fillStyle = "#ff8800";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ff8800";
        ctx.beginPath();
        ctx.arc(indicatorX + 12, indicatorY + 69, 7, 0, Math.PI * 2); // Bigger circle
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("= Moderate Risk", indicatorX + 24, indicatorY + 74);

        // Red (severe) - BIGGER, NO OVERLAPPING - MOVED TO NEW ROW
        ctx.fillStyle = "#ff0000";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ff0000";
        ctx.beginPath();
        ctx.arc(indicatorX + 12, indicatorY + 86, 7, 0, Math.PI * 2); // Moved to new row, bigger circle
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ff0000"; // Red text for danger
        ctx.font = "bold 13px Arial"; // Even bigger for danger
        ctx.fillText("= DANGER!", indicatorX + 24, indicatorY + 91); // Moved to new row, no overlap
      }

      // Solar Wind Speed - ULTRA ADVANCED VISUALIZATION
      else if (parameterName === "Solar Wind Speed") {
        // USE LIVE DATA - All parameters from props
        const speed = value ?? 400;
        const speedFactor = speed / 1000;
        // REDUCED PARTICLE COUNT - Less chaotic, clearer visualization
        const particleCount = Math.min(Math.max(speed / 15, 15), 50);
        const densityValue = density ?? 5;
        const tempValue = temperature ?? 100000;
        const lonValue = lon ?? 0; // Longitude in degrees
        const latValue = lat ?? 0; // Latitude in degrees
        const bzValue = (bz ?? 0) as number;
        const btValue = (bt ?? 0) as number;
        const bxValue = (bx ?? 0) as number;
        const byValue = (by ?? 0) as number;

        // Calculate direction from magnetic field components
        const directionAngle = Math.atan2(byValue, bxValue); // Direction in radians
        const directionDeg = ((directionAngle * 180) / Math.PI).toFixed(1);

        // Calculate arrival time (distance from L1 to Earth ~1.5M km = 1,500,000 km)
        // FIXED: Should be in minutes, not hours (typical arrival is 30-60 minutes)
        const distanceL1ToEarth = 1500000; // km
        const arrivalTimeSeconds = speed > 0 ? distanceL1ToEarth / speed : 0;
        const arrivalTimeMinutes = Math.floor(arrivalTimeSeconds / 60);
        const arrivalTimeSecondsRem = Math.floor(arrivalTimeSeconds % 60);

        // Fixed layout (declare FIRST before using in particles)
        const centerX = canvas.width * 0.65;
        const centerY = canvas.height * 0.5;
        const objectOffsetY = 50; // Move all objects down
        const sunX = 70;
        const sunY = centerY + objectOffsetY; // Sun aligned with Earth and L1
        const sunRadius = 32;
        const earthX = canvas.width - 80;
        const earthY = centerY + objectOffsetY; // Earth moved down
        const earthRadius = 42;
        const l1X = earthX - 130; // ~1.5M km from Earth
        const l1Y = centerY + objectOffsetY; // L1 aligned with Sun and Earth
        const l1OrbitRadius = 20;
        const satelliteSize = 15;

        // Initialize particle system with trails (persistent across frames)
        if (!(window as any).solarWindParticlesAdvanced) {
          (window as any).solarWindParticlesAdvanced = [];
        }
        let particles = (window as any).solarWindParticlesAdvanced;

        // Add new particles periodically
        if (particles.length < particleCount) {
          for (let i = particles.length; i < particleCount; i++) {
            particles.push({
              x: sunX + sunRadius + 20,
              y: centerY + objectOffsetY + (Math.random() - 0.5) * 50, // Particles moved down
              vx: speedFactor * 8 * (1 + Math.random() * 0.2), // Realistic slower velocity
              vy: (Math.random() - 0.5) * 8, // Reduced vertical velocity
              size: 2.5 + Math.random() * 2, // Slightly smaller
              life: Math.random(),
              trail: [] as Array<{ x: number; y: number; alpha: number }>,
            });
          }
        }

        // Remove excess particles
        if (particles.length > particleCount) {
          particles = particles.slice(0, particleCount);
          (window as any).solarWindParticlesAdvanced = particles;
        }

        // Earth's elliptical orbit (visible)
        const orbitCenterX = (sunX + earthX) / 2;
        const orbitCenterY = centerY + objectOffsetY; // Orbit center moved down
        const semiMajorAxis = (earthX - sunX) / 2;
        const semiMinorAxis = 50;

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Sun
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffeb3b");
        sunGradient.addColorStop(0.5, "#ff9800");
        sunGradient.addColorStop(1, "#ff5722");
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 18);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 18);

        // Solar wind arrow (from Sun to Earth, with direction)
        const arrowAngle = Math.atan2(earthY - sunY, earthX - sunX);
        const arrowStartX = sunX + sunRadius + 10;
        const arrowStartY = sunY;
        const arrowLength = Math.min((earthX - sunX) * 0.4, 200);
        const arrowEndX = arrowStartX + Math.cos(arrowAngle) * arrowLength;
        const arrowEndY = arrowStartY + Math.sin(arrowAngle) * arrowLength;

        ctx.strokeStyle =
          speed > 700 ? "#ff0000" : speed > 500 ? "#ff8800" : "#ffaa00";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowEndX, arrowEndY);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX - 12 * Math.cos(arrowAngle - 0.3),
          arrowEndY - 12 * Math.sin(arrowAngle - 0.3)
        );
        ctx.lineTo(
          arrowEndX - 12 * Math.cos(arrowAngle + 0.3),
          arrowEndY - 12 * Math.sin(arrowAngle + 0.3)
        );
        ctx.closePath();
        ctx.fillStyle =
          speed > 700 ? "#ff0000" : speed > 500 ? "#ff8800" : "#ffaa00";
        ctx.fill();

        // Distance marker: Sun to Earth
        const sunToEarthMidX = (sunX + earthX) / 2;
        const sunToEarthMidY = sunY - 50;
        ctx.strokeStyle = "#888888";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(sunX + sunRadius, sunY);
        ctx.lineTo(earthX - earthRadius, earthY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(sunToEarthMidX - 60, sunToEarthMidY - 12, 120, 22);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("~150 Million km", sunToEarthMidX, sunToEarthMidY + 5);

        // Aditya L1 Satellite (BIGGER & DETAILED)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.6,
          l1Y - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 4, 8, 8);
        ctx.fillRect(l1X + satelliteSize, l1Y - 4, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("Aditya L1", l1X, l1Y + satelliteSize + 15);
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 15);

        // L1 Orbit
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ff00";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, l1OrbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 11px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText("L1 Orbit", l1X, l1Y - l1OrbitRadius - 8);
        ctx.fillText("L1 Orbit", l1X, l1Y - l1OrbitRadius - 8);

        // Distance marker: Earth to L1
        const earthToL1MidX = (earthX + l1X) / 2;
        const earthToL1MidY = earthY + 80;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(earthX - earthRadius, earthY);
        ctx.lineTo(l1X + l1OrbitRadius, l1Y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(earthToL1MidX - 50, earthToL1MidY - 12, 100, 22);
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 12px Arial";
        ctx.fillText("~1.5 Million km", earthToL1MidX, earthToL1MidY + 5);

        // Earth
        const earthGradient = ctx.createRadialGradient(
          earthX,
          earthY,
          0,
          earthX,
          earthY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(earthX - 8, earthY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 6, earthY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", earthX, earthY + earthRadius + 18);
        ctx.fillText("EARTH", earthX, earthY + earthRadius + 18);

        // HORIZONTAL DATA PANEL - NO OVERLAPPING, COMPACT
        const panelX = 15;
        const panelY = 15;
        const panelWidth = canvas.width - 30; // Full width minus margins
        const panelHeight = 140; // Reduced height for horizontal layout
        const panelRadius = 10;
        const panelPadding = 15;

        // Glassmorphism background
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, panelRadius);
        ctx.fill();

        // Border
        ctx.strokeStyle = "rgba(100, 200, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, panelRadius);
        ctx.stroke();

        // HORIZONTAL LAYOUT - All data in rows, no vertical stacking
        let currentX = panelX + panelPadding;
        const row1Y = panelY + 25;
        const row2Y = panelY + 60;
        const row3Y = panelY + 95;
        const row4Y = panelY + 125;

        // Row 1: Speed & Level
        const speedColor =
          speed > 700 ? "#ff4444" : speed > 500 ? "#ff8800" : "#60a5fa";
        ctx.fillStyle = speedColor;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`Speed: ${speed.toFixed(0)} km/s`, currentX, row1Y);
        currentX += 180;

        let speedLevel = "NORMAL";
        let levelColor = "#60a5fa";
        let levelEmoji = "✓";
        if (speed > 900) {
          speedLevel = "EXTREME";
          levelColor = "#ff0000";
          levelEmoji = "⚠️";
        } else if (speed > 700) {
          speedLevel = "HIGH";
          levelColor = "#ff4400";
          levelEmoji = "⚠️";
        } else if (speed > 500) {
          speedLevel = "MODERATE";
          levelColor = "#ff8800";
          levelEmoji = "⚡";
        }

        ctx.fillStyle = levelColor;
        ctx.font = "bold 16px Arial";
        ctx.fillText(`${levelEmoji} ${speedLevel}`, currentX, row1Y);
        currentX += 120;

        // Progress bar (horizontal, smaller)
        const progressWidth = 200;
        const progressHeight = 6;
        const progressX = currentX;
        const progressY = row1Y - 8;
        const progressValue = Math.min((speed - 200) / (1200 - 200), 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 3);
        ctx.fill();

        const progressGradient = ctx.createLinearGradient(
          progressX,
          progressY,
          progressX + progressWidth * progressValue,
          progressY
        );
        if (speed > 700) {
          progressGradient.addColorStop(0, "#ff0000");
          progressGradient.addColorStop(1, "#ff4400");
        } else if (speed > 500) {
          progressGradient.addColorStop(0, "#ff8800");
          progressGradient.addColorStop(1, "#ffaa00");
        } else {
          progressGradient.addColorStop(0, "#60a5fa");
          progressGradient.addColorStop(1, "#90cdf4");
        }
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          3
        );
        ctx.fill();

        // Row 2: Arrival Time & Position
        currentX = panelX + panelPadding;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("⏱️ Arrival:", currentX, row2Y);
        currentX += 70;
        ctx.fillStyle = speed > 0 ? "#60a5fa" : "#888888";
        ctx.font = "bold 13px Arial";
        if (speed > 0) {
          if (arrivalTimeMinutes > 0) {
            ctx.fillText(
              `${arrivalTimeMinutes}m ${arrivalTimeSecondsRem}s`,
              currentX,
              row2Y
            );
          } else {
            ctx.fillText(`${arrivalTimeSecondsRem}s`, currentX, row2Y);
          }
        } else {
          ctx.fillText("Calculating...", currentX, row2Y);
        }
        currentX += 120;

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("📍 Position:", currentX, row2Y);
        currentX += 75;
        ctx.fillStyle = "#60a5fa";
        ctx.font = "bold 12px Arial";
        ctx.fillText(`Lat: ${latValue.toFixed(1)}°`, currentX, row2Y);
        currentX += 80;
        ctx.fillText(`Lon: ${lonValue.toFixed(1)}°`, currentX, row2Y);

        // Row 3: Wind Direction & Density/Temp (COMPASS REMOVED - only text)
        currentX = panelX + panelPadding;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("🧭 Direction:", currentX, row3Y);
        currentX += 75;

        // Just show angle value (no compass in panel)
        ctx.fillStyle = "#60a5fa";
        ctx.font = "bold 12px Arial";
        ctx.fillText(`${directionDeg}°`, currentX, row3Y);
        currentX += 60;

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Density:", currentX, row3Y);
        currentX += 60;
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px Arial";
        ctx.fillText(`${densityValue.toFixed(1)} cm⁻³`, currentX, row3Y);
        currentX += 100;

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Temp:", currentX, row3Y);
        currentX += 50;
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px Arial";
        const tempK = (tempValue / 1000).toFixed(0);
        ctx.fillText(`${tempK}K`, currentX, row3Y);

        // CLEAR EXPLANATION BOX (Bottom of canvas - MOVED TO BOTTOM)
        const explanationHeight = 80;
        const explanationY = canvas.height - explanationHeight - 15; // At bottom of canvas
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(100, 200, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is Solar Wind Speed?",
          explanationX + 10,
          explanationY + 18
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• Speed = How fast solar wind particles travel from Sun to Earth (km/s)",
          explanationX + 10,
          explanationY + 35
        );
        ctx.fillText(
          `• Current: ${speed.toFixed(0)} km/s = ${
            speed > 600
              ? "FAST (CME possible!)"
              : speed > 400
              ? "MODERATE"
              : "NORMAL"
          }`,
          explanationX + 10,
          explanationY + 50
        );
        const arrivalText =
          arrivalTimeMinutes > 0
            ? `${arrivalTimeMinutes} min`
            : `${arrivalTimeSecondsRem} sec`;
        ctx.fillText(
          `• Why arrival time? Distance L1→Earth ~1.5M km ÷ Speed = ${arrivalText} to reach Earth`,
          explanationX + 10,
          explanationY + 65
        );
        ctx.fillText(
          "• Why faster = redder? Higher speed = More energy = Particles glow brighter = Red color",
          explanationX + 10,
          explanationY + 80
        );
        ctx.fillText(
          "• Why L1 monitoring? L1 measures wind BEFORE it hits Earth = Early warning system!",
          explanationX + 10,
          explanationY + 95
        );

        // Wind Direction Indicator on Main Canvas (SMALLER - NO OVERLAP, KEEP SAME POSITION)
        if (Math.abs(bxValue) > 0.1 || Math.abs(byValue) > 0.1) {
          const windDirX = l1X;
          const windDirY = centerY - 50; // Keep compass at same absolute position (not moved down with objects)
          const windDirLength = 35; // Smaller arrow
          const compassRadius = 18; // Smaller compass to avoid overlap

          // Compass circle with glow (smaller)
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(100, 200, 255, 0.7)";
          ctx.strokeStyle = "rgba(100, 200, 255, 0.6)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(windDirX, windDirY, compassRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Cardinal directions (smaller font)
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.font = "bold 9px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;
          ctx.strokeText("N", windDirX, windDirY - compassRadius - 3);
          ctx.fillText("N", windDirX, windDirY - compassRadius - 3);
          ctx.strokeText("S", windDirX, windDirY + compassRadius + 10);
          ctx.fillText("S", windDirX, windDirY + compassRadius + 10);
          ctx.strokeText("E", windDirX + compassRadius + 3, windDirY + 3);
          ctx.fillText("E", windDirX + compassRadius + 3, windDirY + 3);
          ctx.strokeText("W", windDirX - compassRadius - 3, windDirY + 3);
          ctx.fillText("W", windDirX - compassRadius - 3, windDirY + 3);
          ctx.textAlign = "left";

          // Arrow with glow (smaller)
          ctx.strokeStyle = "#60a5fa";
          ctx.lineWidth = 3;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#60a5fa";
          ctx.beginPath();
          ctx.moveTo(windDirX, windDirY);
          ctx.lineTo(
            windDirX + Math.cos(directionAngle) * windDirLength,
            windDirY + Math.sin(directionAngle) * windDirLength
          );
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Arrowhead (smaller)
          ctx.beginPath();
          const windDirEndX =
            windDirX + Math.cos(directionAngle) * windDirLength;
          const windDirEndY =
            windDirY + Math.sin(directionAngle) * windDirLength;
          ctx.moveTo(windDirEndX, windDirEndY);
          ctx.lineTo(
            windDirEndX - 9 * Math.cos(directionAngle - 0.3),
            windDirEndY - 9 * Math.sin(directionAngle - 0.3)
          );
          ctx.lineTo(
            windDirEndX - 9 * Math.cos(directionAngle + 0.3),
            windDirEndY - 9 * Math.sin(directionAngle + 0.3)
          );
          ctx.closePath();
          ctx.fillStyle = "#60a5fa";
          ctx.fill();

          // Label with background (smaller)
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.beginPath();
          ctx.roundRect(
            windDirX - 40,
            windDirY - compassRadius - 25,
            80,
            18,
            4
          );
          ctx.fill();
          ctx.fillStyle = "#60a5fa";
          ctx.font = "bold 11px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;
          ctx.strokeText(
            `Wind: ${directionDeg}°`,
            windDirX,
            windDirY - compassRadius - 12
          );
          ctx.fillText(
            `Wind: ${directionDeg}°`,
            windDirX,
            windDirY - compassRadius - 12
          );
          ctx.textAlign = "left";
        }

        // ADVANCED PARTICLE SYSTEM WITH TRAILS (REALISTIC SPEED)
        particles.forEach((p: any, i: number) => {
          // Update particle position - REALISTIC SLOWER MOVEMENT
          p.x += p.vx * 0.5; // Much slower, realistic speed multiplier
          p.y += p.vy * 0.3 + Math.sin(time * 1.5 + i) * 0.8; // Reduced vertical movement
          p.life += 0.015;

          // Add to trail (max 4 points for cleaner look)
          p.trail.push({ x: p.x, y: p.y, alpha: 1.0 });
          if (p.trail.length > 4) p.trail.shift();

          // Reset particle if it goes off screen
          if (p.x > earthX + 50) {
            p.x = sunX + sunRadius + 20;
            p.y = centerY + objectOffsetY + (Math.random() - 0.5) * 50; // Particles moved down
            p.vx = speedFactor * 8 * (1 + Math.random() * 0.2); // Realistic slower velocity
            p.vy = (Math.random() - 0.5) * 8; // Reduced vertical velocity
            p.trail = [];
          }

          // Draw trail (fading effect) - CLEAR VISUALIZATION
          for (let t = 0; t < p.trail.length; t++) {
            const trailPoint = p.trail[t];
            const trailAlpha = (t / p.trail.length) * 0.3;

            // Color based on speed
            let trailColor;
            if (speed > 700) {
              trailColor = `rgba(255, 50, 50, ${trailAlpha})`; // Red
            } else if (speed > 500) {
              trailColor = `rgba(255, 150, 50, ${trailAlpha})`; // Orange
            } else {
              trailColor = `rgba(100, 200, 255, ${trailAlpha})`; // Blue
            }

            ctx.fillStyle = trailColor;
            ctx.shadowBlur = 5;
            ctx.shadowColor = trailColor;
            ctx.beginPath();
            ctx.arc(
              trailPoint.x,
              trailPoint.y,
              p.size * (t / p.trail.length) * 0.6,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // Draw main particle - CLEAR AND VISIBLE
          let particleColor;
          if (speed > 700) {
            particleColor = `rgba(255, 0, 0, ${0.9 + Math.sin(p.life) * 0.1})`; // Red
          } else if (speed > 500) {
            particleColor = `rgba(255, 136, 0, ${
              0.8 + Math.sin(p.life) * 0.1
            })`; // Orange
          } else {
            particleColor = `rgba(100, 200, 255, ${
              0.7 + Math.sin(p.life) * 0.1
            })`; // Blue
          }

          ctx.fillStyle = particleColor;
          ctx.shadowBlur = 10 + speedFactor * 5;
          ctx.shadowColor = particleColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Update particles array
        (window as any).solarWindParticlesAdvanced = particles;
      }

      // Solar Wind Density - PERFECT EDUCATIONAL ANIMATION
      else if (parameterName === "Solar Wind Density") {
        const densityValue = density ?? value ?? 5;
        const tempValue = temperature ?? 100000;
        const speedValue = value ?? 400; // Use speed if available
        const particleCount = Math.min(Math.max(densityValue * 4, 30), 100); // More particles for better visualization

        // Layout - aligned properly
        const objectOffsetY = 50;
        const centerX = canvas.width * 0.65;
        const centerY = canvas.height * 0.5;
        const sunX = 70;
        const sunY = centerY + objectOffsetY;
        const sunRadius = 32;
        const earthX = canvas.width - 80;
        const earthY = centerY + objectOffsetY;
        const earthRadius = 42;
        const l1X = earthX - 130;
        const l1Y = centerY + objectOffsetY;
        const satelliteSize = 15;

        // Earth's elliptical orbit (visible)
        const orbitCenterX = (sunX + earthX) / 2;
        const orbitCenterY = centerY + objectOffsetY;
        const semiMajorAxis = (earthX - sunX) / 2;
        const semiMinorAxis = 50;

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit label
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - semiMinorAxis - 15
        );
        ctx.textAlign = "left";

        // Sun
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffeb3b");
        sunGradient.addColorStop(0.5, "#ff9800");
        sunGradient.addColorStop(1, "#ff5722");
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 18);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 18);

        // Aditya L1
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.6,
          l1Y - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 4, 8, 8);
        ctx.fillRect(l1X + satelliteSize, l1Y - 4, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("Aditya L1", l1X, l1Y + satelliteSize + 15);
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 15);

        // Earth
        const earthGradient = ctx.createRadialGradient(
          earthX,
          earthY,
          0,
          earthX,
          earthY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(earthX - 8, earthY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 6, earthY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", earthX, earthY + earthRadius + 18);
        ctx.fillText("EARTH", earthX, earthY + earthRadius + 18);

        // HORIZONTAL DATA PANEL
        const panelX = 15;
        const panelY = 15;
        const panelWidth = canvas.width - 30;
        const panelHeight = 120;
        const panelPadding = 15;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.stroke();

        // Row 1: Density & Level
        let densityLevel = "NORMAL";
        let densityColor = "#8b5cf6";
        if (densityValue > 40) {
          densityLevel = "EXTREME";
          densityColor = "#ff0000";
        } else if (densityValue > 25) {
          densityLevel = "HIGH";
          densityColor = "#ff4400";
        } else if (densityValue > 15) {
          densityLevel = "MODERATE";
          densityColor = "#ff8800";
        }

        ctx.fillStyle = densityColor;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          `Density: ${densityValue.toFixed(1)} cm⁻³`,
          panelX + panelPadding,
          panelY + 30
        );

        ctx.fillStyle = densityColor;
        ctx.font = "bold 16px Arial";
        ctx.fillText(
          `Level: ${densityLevel}`,
          panelX + panelPadding + 200,
          panelY + 30
        );

        // Progress bar
        const progressWidth = 200;
        const progressHeight = 6;
        const progressX = panelX + panelPadding + 350;
        const progressY = panelY + 20;
        const progressValue = Math.min(densityValue / 50, 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 3);
        ctx.fill();

        const progressGradient = ctx.createLinearGradient(
          progressX,
          progressY,
          progressX + progressWidth * progressValue,
          progressY
        );
        if (densityValue > 25) {
          progressGradient.addColorStop(0, "#ff0000");
          progressGradient.addColorStop(1, "#ff4400");
        } else if (densityValue > 15) {
          progressGradient.addColorStop(0, "#ff8800");
          progressGradient.addColorStop(1, "#ffaa00");
        } else {
          progressGradient.addColorStop(0, "#8b5cf6");
          progressGradient.addColorStop(1, "#a78bfa");
        }
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          3
        );
        ctx.fill();

        // Row 2: Additional info
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Temp:", panelX + panelPadding, panelY + 60);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px Arial";
        const tempK = (tempValue / 1000).toFixed(0);
        ctx.fillText(`${tempK}K`, panelX + panelPadding + 60, panelY + 60);

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Speed:", panelX + panelPadding + 150, panelY + 60);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
          `${speedValue.toFixed(0)} km/s`,
          panelX + panelPadding + 210,
          panelY + 60
        );

        // Explanation
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 10px Arial";
        ctx.fillText(
          "💡 High density = More particles = Higher pressure on Earth's magnetic field",
          panelX + panelPadding,
          panelY + 85
        );
        ctx.fillText(
          `Current: ${densityValue.toFixed(1)} particles/cm³ ${
            densityValue > 25 ? "(CME possible!)" : "(Normal)"
          }`,
          panelX + panelPadding,
          panelY + 100
        );

        // PERFECT PARTICLE SYSTEM: Realistic flow from Sun → L1 → Earth
        // Initialize particle system
        if (!(window as any).densityParticles) {
          (window as any).densityParticles = [];
        }
        let densityParticles = (window as any).densityParticles;

        // Create new particles based on density (more density = more particles)
        const flowSpeed = 0.15; // Realistic slow speed
        if (densityParticles.length < particleCount) {
          for (let i = densityParticles.length; i < particleCount; i++) {
            densityParticles.push({
              x: sunX + sunRadius + 10,
              y: sunY + (Math.random() - 0.5) * 60,
              progress: Math.random(), // 0 to 1 along path
              size: 2 + (densityValue / 50) * 2,
              speed: flowSpeed * (0.8 + Math.random() * 0.4), // Variable speed
              trail: [] as Array<{ x: number; y: number }>,
            });
          }
        }

        // Remove excess particles
        if (densityParticles.length > particleCount) {
          densityParticles = densityParticles.slice(0, particleCount);
          (window as any).densityParticles = densityParticles;
        }

        // Update and draw particles
        densityParticles.forEach((p: any) => {
          // Update progress (particles move from Sun to Earth)
          p.progress += p.speed * 0.01;
          if (p.progress > 1) {
            p.progress = 0; // Reset to Sun
            p.x = sunX + sunRadius + 10;
            p.y = sunY + (Math.random() - 0.5) * 60;
          }

          // Calculate position along path Sun → L1 → Earth
          const totalDistance = earthX - sunX;
          const l1Progress = (l1X - sunX) / totalDistance;

          let x, y;
          if (p.progress < l1Progress) {
            // Between Sun and L1
            const segmentProgress = p.progress / l1Progress;
            x =
              sunX +
              sunRadius +
              10 +
              segmentProgress * (l1X - sunX - sunRadius - 10);
            y = sunY + (p.y - sunY) * (1 - segmentProgress * 0.3); // Slight curve
          } else {
            // Between L1 and Earth
            const segmentProgress =
              (p.progress - l1Progress) / (1 - l1Progress);
            x = l1X + segmentProgress * (earthX - l1X - earthRadius - 20);
            y = earthY + (p.y - sunY) * (1 - segmentProgress * 0.5); // Curve towards Earth
          }

          p.x = x;
          p.y = y;

          // Add to trail (max 3 points)
          p.trail.push({ x, y });
          if (p.trail.length > 3) p.trail.shift();

          // Draw trail (shows flow direction)
          p.trail.forEach((point: any, idx: number) => {
            const trailAlpha = (idx / p.trail.length) * 0.4;
            ctx.fillStyle = `rgba(139, 92, 246, ${trailAlpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw particle (color intensity based on density)
          const alpha = 0.5 + (densityValue / 50) * 0.4;
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.shadowBlur = 5 + (densityValue / 50) * 3;
          ctx.shadowColor = "rgba(139, 92, 246, 0.6)";
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // EARTH'S MAGNETIC FIELD - Shows compression based on density
        const fieldCompression = Math.min(densityValue / 30, 1); // 0 to 1
        const fieldRadius = earthRadius + 50 - fieldCompression * 20; // Compressed when density is high

        // Magnetic field lines (distorted by high density)
        ctx.strokeStyle =
          densityValue > 25
            ? "rgba(255, 100, 100, 0.6)"
            : "rgba(100, 200, 255, 0.5)";
        ctx.lineWidth = 2 + fieldCompression * 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor =
          densityValue > 25
            ? "rgba(255, 100, 100, 0.4)"
            : "rgba(100, 200, 255, 0.3)";

        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          for (let r = earthRadius; r < fieldRadius; r += 3) {
            const compression = fieldCompression * Math.sin(r * 0.1) * 10;
            const x = earthX + Math.cos(angle) * r;
            const y = earthY + Math.sin(angle) * r + compression;
            if (r === earthRadius) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Field compression indicator
        if (fieldCompression > 0.3) {
          ctx.fillStyle = "rgba(255, 100, 100, 0.3)";
          ctx.beginPath();
          ctx.arc(earthX, earthY, fieldRadius, 0, Math.PI * 2);
          ctx.fill();

          // Warning text
          ctx.fillStyle = "#ff4444";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText(
            "⚠️ Magnetic Field Compressed!",
            earthX,
            earthY - fieldRadius - 20
          );
          ctx.fillText(
            "⚠️ Magnetic Field Compressed!",
            earthX,
            earthY - fieldRadius - 20
          );
        }

        // Flow direction arrow and label (CLEAR VISUALIZATION)
        const arrowY = sunY - 70;
        const arrowStartX = sunX + sunRadius + 10;
        const arrowEndX = earthX - earthRadius - 10;

        ctx.strokeStyle = "rgba(139, 92, 246, 0.7)";
        ctx.fillStyle = "rgba(139, 92, 246, 0.7)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - 15, arrowY - 8);
        ctx.lineTo(arrowEndX - 15, arrowY + 8);
        ctx.closePath();
        ctx.fill();

        // Flow label with background
        const labelX = (sunX + earthX) / 2;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect(labelX - 80, arrowY - 18, 160, 20, 5);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText("Solar Wind Flow →", labelX, arrowY - 5);
        ctx.fillText("Solar Wind Flow →", labelX, arrowY - 5);

        // Density explanation box (BOTTOM - EDUCATIONAL)
        const explanationY = canvas.height - 90;
        const explanationHeight = 75;
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is Solar Wind Density?",
          explanationX + 10,
          explanationY + 18
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• Density = Number of particles per cubic centimeter (protons, electrons)",
          explanationX + 10,
          explanationY + 35
        );
        ctx.fillText(
          `• Current: ${densityValue.toFixed(1)} particles/cm³ = ${
            densityValue > 25
              ? "HIGH (CME possible!)"
              : densityValue > 15
              ? "MODERATE"
              : "NORMAL"
          }`,
          explanationX + 10,
          explanationY + 50
        );
        ctx.fillText(
          "• Why particles flowing? Solar wind constantly streams from Sun = Particles travel Sun → L1 → Earth",
          explanationX + 10,
          explanationY + 65
        );
        ctx.fillText(
          "• Why field compression? More particles = More pressure = Pushes Earth's magnetic field inward = Compression",
          explanationX + 10,
          explanationY + 80
        );
        ctx.fillText(
          "• Result: Compressed field = More geomagnetic activity = Possible storms if Bz is southward!",
          explanationX + 10,
          explanationY + 95
        );
      }

      // Bz Component - PERFECT EDUCATIONAL ANIMATION
      else if (parameterName === "Bz Component") {
        const bzValue = bz ?? value ?? 0;
        const btValue = bt ?? 5;
        const isSouthward = bzValue < 0;
        const intensity = Math.min(Math.abs(bzValue) / 20, 1);

        // Layout - aligned properly
        const objectOffsetY = 50;
        const centerX = canvas.width * 0.65;
        const centerY = canvas.height * 0.5;
        const sunX = 70;
        const sunY = centerY + objectOffsetY;
        const sunRadius = 32;
        const earthX = canvas.width - 80;
        const earthY = centerY + objectOffsetY;
        const earthRadius = 42;
        const l1X = earthX - 130;
        const l1Y = centerY + objectOffsetY;
        const satelliteSize = 15;

        // Earth's elliptical orbit (visible)
        const orbitCenterX = (sunX + earthX) / 2;
        const orbitCenterY = centerY + objectOffsetY;
        const semiMajorAxis = (earthX - sunX) / 2;
        const semiMinorAxis = 50;

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit label
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - semiMinorAxis - 15
        );
        ctx.textAlign = "left";

        // Sun
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffeb3b");
        sunGradient.addColorStop(0.5, "#ff9800");
        sunGradient.addColorStop(1, "#ff5722");
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 18);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 18);

        // Aditya L1
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.6,
          l1Y - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 4, 8, 8);
        ctx.fillRect(l1X + satelliteSize, l1Y - 4, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("Aditya L1", l1X, l1Y + satelliteSize + 15);
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 15);

        // Earth
        const earthGradient = ctx.createRadialGradient(
          earthX,
          earthY,
          0,
          earthX,
          earthY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(earthX - 8, earthY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 6, earthY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", earthX, earthY + earthRadius + 18);
        ctx.fillText("EARTH", earthX, earthY + earthRadius + 18);

        // PERFECT MAGNETIC FIELD FLOW: Sun → L1 → Earth
        // Initialize magnetic field particles
        if (!(window as any).bzParticles) {
          (window as any).bzParticles = [];
        }
        let bzParticles = (window as any).bzParticles;

        // Create magnetic field particles (more particles = stronger field)
        const particleCount = Math.min(Math.max(Math.abs(bzValue) * 2, 20), 60);
        const flowSpeed = 0.12; // Realistic slow speed

        if (bzParticles.length < particleCount) {
          for (let i = bzParticles.length; i < particleCount; i++) {
            bzParticles.push({
              x: sunX + sunRadius + 10,
              y: sunY + (Math.random() - 0.5) * 50,
              progress: Math.random(),
              size: 2.5 + intensity * 2,
              speed: flowSpeed * (0.8 + Math.random() * 0.4),
              direction: isSouthward ? -1 : 1, // -1 = southward, +1 = northward
              trail: [] as Array<{ x: number; y: number }>,
            });
          }
        }

        // Remove excess particles
        if (bzParticles.length > particleCount) {
          bzParticles = bzParticles.slice(0, particleCount);
          (window as any).bzParticles = bzParticles;
        }

        // Update and draw magnetic field particles
        bzParticles.forEach((p: any) => {
          // Update progress (particles flow from Sun to Earth)
          p.progress += p.speed * 0.01;
          if (p.progress > 1) {
            p.progress = 0;
            p.x = sunX + sunRadius + 10;
            p.y = sunY + (Math.random() - 0.5) * 50;
          }

          // Calculate position along path Sun → L1 → Earth
          const totalDistance = earthX - sunX;
          const l1Progress = (l1X - sunX) / totalDistance;

          let x, y;
          if (p.progress < l1Progress) {
            // Between Sun and L1
            const segmentProgress = p.progress / l1Progress;
            x =
              sunX +
              sunRadius +
              10 +
              segmentProgress * (l1X - sunX - sunRadius - 10);
            y = sunY + (p.y - sunY) * (1 - segmentProgress * 0.2);
          } else {
            // Between L1 and Earth
            const segmentProgress =
              (p.progress - l1Progress) / (1 - l1Progress);
            x = l1X + segmentProgress * (earthX - l1X - earthRadius - 20);
            y = earthY + (p.y - sunY) * (1 - segmentProgress * 0.3);
          }

          p.x = x;
          p.y = y;

          // Add to trail
          p.trail.push({ x, y });
          if (p.trail.length > 3) p.trail.shift();

          // Draw trail (shows flow direction)
          p.trail.forEach((point: any, idx: number) => {
            const trailAlpha = (idx / p.trail.length) * 0.3;
            const color = isSouthward
              ? `rgba(255, 100, 100, ${trailAlpha})`
              : `rgba(100, 200, 255, ${trailAlpha})`;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw particle (color based on direction)
          const alpha = 0.6 + intensity * 0.3;
          const particleColor = isSouthward
            ? `rgba(255, 100, 100, ${alpha})`
            : `rgba(100, 200, 255, ${alpha})`;
          ctx.fillStyle = particleColor;
          ctx.shadowBlur = 6 + intensity * 3;
          ctx.shadowColor = isSouthward
            ? "rgba(255, 100, 100, 0.6)"
            : "rgba(100, 200, 255, 0.6)";
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Direction indicator on particle (arrow)
          const arrowLength = p.size * 1.5;
          const arrowAngle = p.direction > 0 ? -Math.PI / 2 : Math.PI / 2; // Northward = up, Southward = down
          ctx.strokeStyle = particleColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.cos(arrowAngle) * arrowLength,
            y + Math.sin(arrowAngle) * arrowLength
          );
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // EARTH'S MAGNETOSPHERE - COMPLETE VISUALIZATION
        const magnetosphereRadius = earthRadius + 60;
        const fieldColor = isSouthward
          ? "rgba(255, 100, 100, 0.5)"
          : "rgba(100, 200, 255, 0.5)";

        // Radial magnetic field lines from Earth (more visible)
        ctx.strokeStyle = fieldColor;
        ctx.lineWidth = 2 + intensity * 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = isSouthward
          ? "rgba(255, 100, 100, 0.6)"
          : "rgba(100, 200, 255, 0.6)";

        // Draw radial field lines (12 lines for better visualization)
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const distortion = isSouthward ? intensity * Math.sin(angle) * 20 : 0; // Southward Bz distorts field

          ctx.beginPath();
          // Draw curved field lines
          for (let r = earthRadius + 5; r < magnetosphereRadius; r += 2) {
            const curveFactor = Math.sin(
              ((r - earthRadius) / (magnetosphereRadius - earthRadius)) *
                Math.PI
            );
            const x = earthX + Math.cos(angle) * r;
            const y = earthY + Math.sin(angle) * r + distortion * curveFactor;
            if (r === earthRadius + 5) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Magnetosphere boundary (outer ring)
        ctx.strokeStyle = fieldColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(earthX, earthY, magnetosphereRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Magnetosphere status indicator with background
        const statusY = earthY - magnetosphereRadius - 30;
        const statusBgWidth = isSouthward ? 220 : 140;
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.beginPath();
        ctx.roundRect(
          earthX - statusBgWidth / 2,
          statusY - 12,
          statusBgWidth,
          24,
          6
        );
        ctx.fill();

        if (isSouthward && intensity > 0.3) {
          // Warning: Southward Bz allows energy entry
          ctx.fillStyle = "rgba(255, 100, 100, 0.3)";
          ctx.beginPath();
          ctx.arc(earthX, earthY, magnetosphereRadius, 0, Math.PI * 2);
          ctx.fill();

          // Energy entry visualization (red particles entering)
          if (intensity > 0.5) {
            for (let i = 0; i < 5; i++) {
              const entryAngle = (i / 5) * Math.PI * 2 + time;
              const entryX =
                earthX + Math.cos(entryAngle) * magnetosphereRadius;
              const entryY =
                earthY + Math.sin(entryAngle) * magnetosphereRadius;
              ctx.fillStyle = `rgba(255, 50, 50, ${
                0.6 + Math.sin(time * 2 + i) * 0.3
              })`;
              ctx.shadowBlur = 10;
              ctx.shadowColor = "#ff0000";
              ctx.beginPath();
              ctx.arc(
                entryX,
                earthY + Math.sin(entryAngle) * (earthRadius + 10),
                3,
                0,
                Math.PI * 2
              );
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }

          ctx.fillStyle = "#ff4444";
          ctx.font = "bold 14px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          const warningText =
            intensity > 0.7 ? "🚨 ENERGY ENTRY!" : "⚠️ Energy Entry Possible!";
          ctx.strokeText(warningText, earthX, statusY + 3);
          ctx.fillText(warningText, earthX, statusY + 3);
        } else if (!isSouthward) {
          // Safe: Northward Bz protects
          ctx.fillStyle = "rgba(100, 200, 255, 0.25)";
          ctx.beginPath();
          ctx.arc(earthX, earthY, magnetosphereRadius, 0, Math.PI * 2);
          ctx.fill();

          // Protection visualization (blue shield effect)
          ctx.strokeStyle = "rgba(100, 200, 255, 0.6)";
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#60a5fa";
          ctx.beginPath();
          ctx.arc(earthX, earthY, magnetosphereRadius + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = "#60a5fa";
          ctx.font = "bold 14px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText("✓ Protected", earthX, statusY + 3);
          ctx.fillText("✓ Protected", earthX, statusY + 3);
        }
        ctx.textAlign = "left";

        // Large direction arrow above L1 (CLEAR VISUALIZATION)
        const arrowY = l1Y - 70;
        const arrowSize = 25;
        ctx.fillStyle = isSouthward ? "#ff4444" : "#60a5fa";
        ctx.shadowBlur = 15;
        ctx.shadowColor = isSouthward ? "#ff4444" : "#60a5fa";

        if (isSouthward) {
          // Southward arrow (points down)
          ctx.beginPath();
          ctx.moveTo(l1X, arrowY);
          ctx.lineTo(l1X - arrowSize, arrowY + arrowSize);
          ctx.lineTo(l1X + arrowSize, arrowY + arrowSize);
          ctx.closePath();
          ctx.fill();
        } else {
          // Northward arrow (points up)
          ctx.beginPath();
          ctx.moveTo(l1X, arrowY + arrowSize);
          ctx.lineTo(l1X - arrowSize, arrowY);
          ctx.lineTo(l1X + arrowSize, arrowY);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Direction label with background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect(l1X - 50, arrowY - 30, 100, 20, 5);
        ctx.fill();
        ctx.fillStyle = isSouthward ? "#ff4444" : "#60a5fa";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        const directionText = isSouthward ? "↓ Southward" : "↑ Northward";
        ctx.strokeText(directionText, l1X, arrowY - 15);
        ctx.fillText(directionText, l1X, arrowY - 15);
        ctx.textAlign = "left";

        // Flow label (Sun to Earth)
        const flowLabelY = sunY - 70;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect((sunX + earthX) / 2 - 80, flowLabelY - 10, 160, 18, 5);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.strokeText(
          "Magnetic Field Flow →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.fillText(
          "Magnetic Field Flow →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.textAlign = "left";

        // HORIZONTAL DATA PANEL
        const panelX = 15;
        const panelY = 15;
        const panelWidth = canvas.width - 30;
        const panelHeight = 140;
        const panelPadding = 15;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = isSouthward
          ? "rgba(255, 68, 68, 0.4)"
          : "rgba(236, 72, 153, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.stroke();

        // Row 1: Bz Value & Status
        const bzColor = isSouthward ? "#ff4444" : "#60a5fa";
        ctx.fillStyle = bzColor;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 10;
        ctx.shadowColor = bzColor;
        ctx.fillText(
          `Bz: ${bzValue.toFixed(1)} nT`,
          panelX + panelPadding,
          panelY + 30
        );
        ctx.shadowBlur = 0;

        let bzStatus = "";
        let statusColor = "";

        if (bzValue >= -2) {
          bzStatus = "✓ NEUTRAL / SAFE";
          statusColor = "#60a5fa";
        } else if (bzValue > -7) {
          bzStatus = "⚠️ MILD SOUTHWARD";
          statusColor = "#facc15"; // yellow
        } else if (bzValue > -10) {
          bzStatus = "⚠️ MODERATE SOUTHWARD";
          statusColor = "#ff8800";
        } else if (bzValue > -15) {
          bzStatus = "⚠️ STRONG SOUTHWARD";
          statusColor = "#ff4400";
        } else {
          bzStatus = "🚨 EXTREME SOUTHWARD";
          statusColor = "#ff0000";
        }

        ctx.fillStyle = statusColor;
        ctx.font = "bold 16px Arial";
        ctx.fillText(bzStatus, panelX + panelPadding + 180, panelY + 30);

        // Progress bar
        const progressWidth = 200;
        const progressHeight = 6;
        const progressX = panelX + panelPadding + 450;
        const progressY = panelY + 20;
        // Normalize: -30 to +30 nT range
        const progressValue = Math.min((Math.abs(bzValue) + 30) / 60, 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 3);
        ctx.fill();

        const progressGradient = ctx.createLinearGradient(
          progressX,
          progressY,
          progressX + progressWidth * progressValue,
          progressY
        );
        if (isSouthward) {
          progressGradient.addColorStop(0, "#ff0000");
          progressGradient.addColorStop(1, "#ff4400");
        } else {
          progressGradient.addColorStop(0, "#60a5fa");
          progressGradient.addColorStop(1, "#90cdf4");
        }
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          3
        );
        ctx.fill();

        // Row 2: Additional info
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Total B (Bt):", panelX + panelPadding, panelY + 60);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 13px Arial";
        ctx.fillText(
          `${btValue.toFixed(1)} nT`,
          panelX + panelPadding + 110,
          panelY + 60
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
          "Field Direction:",
          panelX + panelPadding + 220,
          panelY + 60
        );
        ctx.fillStyle = isSouthward ? "#ff4444" : "#60a5fa";
        ctx.font = "bold 13px Arial";
        ctx.fillText(
          isSouthward ? "↓ Southward" : "↑ Northward",
          panelX + panelPadding + 330,
          panelY + 60
        );

        // Row 3: Storm risk indicator
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Storm Risk:", panelX + panelPadding, panelY + 85);
        ctx.fillStyle = isSouthward ? "#ff4444" : "#22c55e";
        ctx.font = "bold 13px Arial";
        const stormRisk = isSouthward
          ? intensity > 0.7
            ? "HIGH ⚠️"
            : intensity > 0.4
            ? "MODERATE ⚠️"
            : "LOW"
          : "NONE ✓";
        ctx.fillText(stormRisk, panelX + panelPadding + 100, panelY + 85);

        // Row 4: Explanation (in panel)
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 11px Arial";
        const explanation = isSouthward
          ? "⚠️ Southward Bz opens Earth's magnetic field = Energy can enter = Storm risk!"
          : "✓ Northward Bz protects Earth's magnetosphere = SAFE";
        ctx.fillText(explanation, panelX + panelPadding, panelY + 110);
        ctx.fillText(
          `Current: ${bzValue.toFixed(1)} nT ${
            bzValue <= -10
              ? "(DANGEROUS - Strong southward!)"
              : bzValue <= -5
              ? "(MODERATE - Monitor conditions)"
              : "(SAFE)"
          }`,
          panelX + panelPadding,
          panelY + 125
        );

        // Educational explanation box (BOTTOM - PERFECT FOR JUDGES)
        const explanationY = canvas.height - 110;
        const explanationHeight = 95;
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = isSouthward
          ? "rgba(255, 68, 68, 0.5)"
          : "rgba(100, 200, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is Bz Component?",
          explanationX + 10,
          explanationY + 20
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• Bz = Vertical component of interplanetary magnetic field (north-south direction)",
          explanationX + 10,
          explanationY + 40
        );
        if (isSouthward) {
          ctx.fillText(
            `• Current: ${bzValue.toFixed(
              1
            )} nT SOUTHWARD = DANGEROUS (allows energy entry)`,
            explanationX + 10,
            explanationY + 55
          );
          ctx.fillText(
            '• Why "Energy Entry"? Southward Bz opposes Earth\'s northward field = Field lines reconnect = Opens magnetosphere',
            explanationX + 10,
            explanationY + 70
          );
          ctx.fillText(
            "• Result: Solar wind particles enter Earth's atmosphere = Geomagnetic storms, aurora, satellite damage!",
            explanationX + 10,
            explanationY + 85
          );
        } else {
          ctx.fillText(
            `• Current: ${bzValue.toFixed(
              1
            )} nT NORTHWARD = SAFE (protects Earth)`,
            explanationX + 10,
            explanationY + 55
          );
          ctx.fillText(
            '• Why "Protected"? Northward Bz aligns with Earth\'s field = Field lines stay closed = Magnetosphere shield intact',
            explanationX + 10,
            explanationY + 70
          );
          ctx.fillText(
            "• Result: Solar wind particles deflected away = No energy entry = No storms = Earth is safe!",
            explanationX + 10,
            explanationY + 85
          );
        }
      }

      // Bt (Total B) - PERFECT EDUCATIONAL ANIMATION
      else if (parameterName === "Bt (Total B)") {
        const btValue = bt ?? value ?? 5;
        const bzValue = bz ?? 0;
        const intensity = Math.min(btValue / 30, 1);

        // Layout - aligned properly
        const objectOffsetY = 50;
        const centerX = canvas.width * 0.65;
        const centerY = canvas.height * 0.5;
        const sunX = 70;
        const sunY = centerY + objectOffsetY;
        const sunRadius = 32;
        const earthX = canvas.width - 80;
        const earthY = centerY + objectOffsetY;
        const earthRadius = 42;
        const l1X = earthX - 130;
        const l1Y = centerY + objectOffsetY;
        const satelliteSize = 15;

        // Earth's elliptical orbit (visible)
        const orbitCenterX = (sunX + earthX) / 2;
        const orbitCenterY = centerY + objectOffsetY;
        const semiMajorAxis = (earthX - sunX) / 2;
        const semiMinorAxis = 50;

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit label
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - semiMinorAxis - 15
        );
        ctx.textAlign = "left";

        // Sun (magnetic field source)
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffeb3b");
        sunGradient.addColorStop(0.5, "#ff9800");
        sunGradient.addColorStop(1, "#ff5722");
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 18);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 18);

        // Aditya L1 (measuring total field strength)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.6,
          l1Y - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 4, 8, 8);
        ctx.fillRect(l1X + satelliteSize, l1Y - 4, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("Aditya L1", l1X, l1Y + satelliteSize + 15);
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 15);

        // L1 measuring indicator
        ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("📡 Measuring Bt", l1X, l1Y - satelliteSize - 20);
        ctx.textAlign = "left";

        // Earth
        const earthGradient = ctx.createRadialGradient(
          earthX,
          earthY,
          0,
          earthX,
          earthY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(earthX - 8, earthY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 6, earthY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", earthX, earthY + earthRadius + 18);
        ctx.fillText("EARTH", earthX, earthY + earthRadius + 18);

        // PERFECT MAGNETIC FIELD FLOW: Sun → L1 → Earth
        // Initialize magnetic field particles
        if (!(window as any).btParticles) {
          (window as any).btParticles = [];
        }
        let btParticles = (window as any).btParticles;

        // Create magnetic field particles (more Bt = more particles = stronger field)
        const particleCount = Math.min(Math.max(btValue * 3, 25), 80);
        const flowSpeed = 0.12; // Realistic slow speed

        if (btParticles.length < particleCount) {
          for (let i = btParticles.length; i < particleCount; i++) {
            btParticles.push({
              x: sunX + sunRadius + 10,
              y: sunY + (Math.random() - 0.5) * 50,
              progress: Math.random(),
              size: 2 + intensity * 2.5,
              speed: flowSpeed * (0.8 + Math.random() * 0.4),
              trail: [] as Array<{ x: number; y: number }>,
            });
          }
        }

        // Remove excess particles
        if (btParticles.length > particleCount) {
          btParticles = btParticles.slice(0, particleCount);
          (window as any).btParticles = btParticles;
        }

        // Update and draw magnetic field particles
        btParticles.forEach((p: any) => {
          // Update progress (particles flow from Sun to Earth)
          p.progress += p.speed * 0.01;
          if (p.progress > 1) {
            p.progress = 0;
            p.x = sunX + sunRadius + 10;
            p.y = sunY + (Math.random() - 0.5) * 50;
          }

          // Calculate position along path Sun → L1 → Earth
          const totalDistance = earthX - sunX;
          const l1Progress = (l1X - sunX) / totalDistance;

          let x, y;
          if (p.progress < l1Progress) {
            // Between Sun and L1
            const segmentProgress = p.progress / l1Progress;
            x =
              sunX +
              sunRadius +
              10 +
              segmentProgress * (l1X - sunX - sunRadius - 10);
            y = sunY + (p.y - sunY) * (1 - segmentProgress * 0.2);
          } else {
            // Between L1 and Earth
            const segmentProgress =
              (p.progress - l1Progress) / (1 - l1Progress);
            x = l1X + segmentProgress * (earthX - l1X - earthRadius - 20);
            y = earthY + (p.y - sunY) * (1 - segmentProgress * 0.3);
          }

          p.x = x;
          p.y = y;

          // Add to trail
          p.trail.push({ x, y });
          if (p.trail.length > 3) p.trail.shift();

          // Draw trail (shows flow direction)
          p.trail.forEach((point: any, idx: number) => {
            const trailAlpha = (idx / p.trail.length) * 0.3;
            ctx.fillStyle = `rgba(139, 92, 246, ${trailAlpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw particle (color intensity based on Bt strength)
          const alpha = 0.5 + intensity * 0.4;
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.shadowBlur = 6 + intensity * 4;
          ctx.shadowColor = "rgba(139, 92, 246, 0.7)";
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // MAGNETIC FIELD STRENGTH VISUALIZATION - Circular field lines around Earth
        // Stronger Bt = more visible, thicker field lines
        const fieldColor = `rgba(139, 92, 246, ${0.4 + intensity * 0.5})`;
        ctx.strokeStyle = fieldColor;
        ctx.lineWidth = 1.5 + intensity * 3;
        ctx.shadowBlur = 8 + intensity * 5;
        ctx.shadowColor = "rgba(139, 92, 246, 0.6)";

        // Draw concentric field lines (stronger Bt = more rings visible)
        const ringCount = Math.floor(3 + intensity * 4); // 3 to 7 rings
        for (let ring = 1; ring <= ringCount; ring++) {
          const radius = earthRadius + 20 + ring * 12;
          const pulse = Math.sin(time * 1.5 + ring) * intensity * 3;
          ctx.beginPath();
          ctx.arc(earthX, earthY, radius + pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Field strength indicator
        let fieldLevel = "NORMAL";
        let fieldColorText = "#8b5cf6";
        let showWarning = false;
        if (btValue > 20) {
          fieldLevel = "VERY STRONG";
          fieldColorText = "#ff4400";
          showWarning = true;
        } else if (btValue > 15) {
          fieldLevel = "STRONG";
          fieldColorText = "#ff8800";
          showWarning = true;
        } else if (btValue > 10) {
          fieldLevel = "MODERATE";
          fieldColorText = "#ffaa00";
        }

        // WARNING EFFECT for high Bt (CME possible!)
        if (showWarning && bzValue < -5) {
          // Pulsing warning ring around Earth
          const warningRadius = earthRadius + 60;
          const pulse = Math.sin(time * 3) * 5;
          ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#ff0000";
          ctx.beginPath();
          ctx.arc(earthX, earthY, warningRadius + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Warning text with background
          ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
          ctx.beginPath();
          ctx.roundRect(earthX - 90, earthY - earthRadius - 50, 180, 25, 5);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px Arial";
          ctx.textAlign = "center";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeText("🚨 CME DETECTED!", earthX, earthY - earthRadius - 32);
          ctx.fillText("🚨 CME DETECTED!", earthX, earthY - earthRadius - 32);
        }

        ctx.fillStyle = fieldColorText;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText(
          `Field Strength: ${fieldLevel}`,
          earthX,
          earthY - earthRadius - 25
        );
        ctx.fillText(
          `Field Strength: ${fieldLevel}`,
          earthX,
          earthY - earthRadius - 25
        );
        ctx.textAlign = "left";

        // Enhanced field lines for high Bt (more intense, pulsing)
        if (btValue > 15) {
          // Additional outer warning rings
          for (let i = 0; i < 2; i++) {
            const outerRadius = earthRadius + 80 + i * 15;
            const outerPulse = Math.sin(time * 2 + i) * intensity * 8;
            ctx.strokeStyle = `rgba(255, ${100 - i * 30}, 0, ${
              0.3 + intensity * 0.3
            })`;
            ctx.lineWidth = 2 + intensity * 2;
            ctx.shadowBlur = 10 + intensity * 5;
            ctx.shadowColor = `rgba(255, ${100 - i * 30}, 0, 0.6)`;
            ctx.beginPath();
            ctx.arc(earthX, earthY, outerRadius + outerPulse, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
        }

        // Flow label (Sun to Earth)
        const flowLabelY = sunY - 70;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect((sunX + earthX) / 2 - 80, flowLabelY - 10, 160, 18, 5);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.strokeText(
          "Total Magnetic Field Flow →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.fillText(
          "Total Magnetic Field Flow →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.textAlign = "left";

        // HORIZONTAL DATA PANEL
        const panelX = 15;
        const panelY = 15;
        const panelWidth = canvas.width - 30;
        const panelHeight = 120;
        const panelPadding = 15;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.stroke();

        // Row 1: Bt Value & Level
        ctx.fillStyle = fieldColorText;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          `Bt: ${btValue.toFixed(1)} nT`,
          panelX + panelPadding,
          panelY + 30
        );

        ctx.fillStyle = fieldColorText;
        ctx.font = "bold 16px Arial";
        ctx.fillText(
          `Level: ${fieldLevel}`,
          panelX + panelPadding + 180,
          panelY + 30
        );

        // Progress bar
        const progressWidth = 200;
        const progressHeight = 6;
        const progressX = panelX + panelPadding + 400;
        const progressY = panelY + 20;
        const progressValue = Math.min(btValue / 30, 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 3);
        ctx.fill();

        const progressGradient = ctx.createLinearGradient(
          progressX,
          progressY,
          progressX + progressWidth * progressValue,
          progressY
        );
        if (btValue > 20) {
          progressGradient.addColorStop(0, "#ff0000");
          progressGradient.addColorStop(1, "#ff4400");
        } else if (btValue > 15) {
          progressGradient.addColorStop(0, "#ff8800");
          progressGradient.addColorStop(1, "#ffaa00");
        } else {
          progressGradient.addColorStop(0, "#8b5cf6");
          progressGradient.addColorStop(1, "#a78bfa");
        }
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          3
        );
        ctx.fill();

        // Row 2: Additional info
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Bz Component:", panelX + panelPadding, panelY + 60);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
          `${bzValue.toFixed(1)} nT`,
          panelX + panelPadding + 100,
          panelY + 60
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "Field Strength:",
          panelX + panelPadding + 200,
          panelY + 60
        );
        ctx.fillStyle = fieldColorText;
        ctx.font = "bold 12px Arial";
        ctx.fillText(
          `${
            btValue > 20
              ? "Very High (CME possible!)"
              : btValue > 15
              ? "High"
              : "Normal"
          }`,
          panelX + panelPadding + 300,
          panelY + 60
        );

        // Explanation
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 10px Arial";
        ctx.fillText(
          "💡 Total B (Bt) = Overall magnetic field strength. High Bt + Southward Bz = CME detection!",
          panelX + panelPadding,
          panelY + 85
        );
        ctx.fillText(
          `Current: ${btValue.toFixed(1)} nT ${
            btValue > 20 ? "(CME possible - Monitor Bz!)" : "(Normal)"
          }`,
          panelX + panelPadding,
          panelY + 100
        );

        // Educational explanation box (BOTTOM - PERFECT FOR JUDGES)
        const explanationY = canvas.height - 95;
        const explanationHeight = 80;
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is Bt (Total B)?",
          explanationX + 10,
          explanationY + 18
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• Bt = Total magnitude of interplanetary magnetic field (combines Bx, By, Bz components)",
          explanationX + 10,
          explanationY + 35
        );
        ctx.fillText(
          `• Current: ${btValue.toFixed(1)} nT = ${fieldLevel} field strength`,
          explanationX + 10,
          explanationY + 50
        );
        ctx.fillText(
          `• High Bt (${
            btValue > 20 ? ">20 nT" : ">15 nT"
          }) + Southward Bz = Strong CME indicator!`,
          explanationX + 10,
          explanationY + 65
        );
      }

      // Solar Wind Temperature - COMPLETE SCIENTIFIC ANIMATION
      else if (parameterName === "Solar Wind Temperature") {
        const tempValue = temperature ?? value ?? 100000; // Temperature in Kelvin
        const tempK = tempValue; // Full Kelvin value
        const tempFactor = Math.min(tempValue / 1000000, 1); // Normalize for visualization
        const densityValue = density ?? 5;

        // Layout - aligned properly
        const objectOffsetY = 50;
        const centerX = canvas.width * 0.65;
        const centerY = canvas.height * 0.5;
        const sunX = 70;
        const sunY = centerY + objectOffsetY;
        const sunRadius = 35;
        const earthX = canvas.width - 80;
        const earthY = centerY + objectOffsetY;
        const earthRadius = 42;
        const l1X = earthX - 130;
        const l1Y = centerY + objectOffsetY;
        const satelliteSize = 15;

        // Earth's elliptical orbit (visible)
        const orbitCenterX = (sunX + earthX) / 2;
        const orbitCenterY = centerY + objectOffsetY;
        const semiMajorAxis = (earthX - sunX) / 2;
        const semiMinorAxis = 50;

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit label
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - semiMinorAxis - 15
        );
        ctx.textAlign = "left";

        // SUN - Temperature affects brightness and color
        const sunIntensity = Math.min(tempValue / 200000, 1);
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        if (tempK > 500000) {
          sunGradient.addColorStop(0, "#ffffff");
          sunGradient.addColorStop(0.3, "#ffeb3b");
          sunGradient.addColorStop(0.6, "#ff9800");
          sunGradient.addColorStop(1, "#ff0000");
        } else if (tempK > 200000) {
          sunGradient.addColorStop(0, "#ffeb3b");
          sunGradient.addColorStop(0.4, "#ff9800");
          sunGradient.addColorStop(0.7, "#ff5722");
          sunGradient.addColorStop(1, "#d32f2f");
        } else {
          sunGradient.addColorStop(0, "#ffeb3b");
          sunGradient.addColorStop(0.5, "#ff9800");
          sunGradient.addColorStop(1, "#ff5722");
        }
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 25 + sunIntensity * 25;
        ctx.shadowColor =
          tempK > 500000 ? "#ff0000" : tempK > 200000 ? "#ff5722" : "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sun label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 20);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 20);

        // Temperature indicator on Sun
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 10px Arial";
        ctx.fillText(
          `${(tempK / 1000).toFixed(0)}K`,
          sunX,
          sunY - sunRadius - 8
        );

        // Aditya L1 - Measuring temperature
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.6,
          l1Y - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 4, 8, 8);
        ctx.fillRect(l1X + satelliteSize, l1Y - 4, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("Aditya L1", l1X, l1Y + satelliteSize + 15);
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 15);

        // Temperature measurement indicator
        ctx.fillStyle = "rgba(0, 255, 0, 0.6)";
        ctx.font = "bold 9px Arial";
        ctx.fillText("🌡️ Measuring", l1X, l1Y - satelliteSize - 18);

        // EARTH WITH MAGNETOSPHERE (affected by temperature)
        const earthGradient = ctx.createRadialGradient(
          earthX,
          earthY,
          0,
          earthX,
          earthY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();

        // Continents
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(earthX - 8, earthY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 6, earthY + 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Magnetosphere (compressed by hot solar wind)
        const magnetosphereRadius = earthRadius + 50 - tempFactor * 20; // Compressed by hot wind
        const magnetosphereColor =
          tempK > 500000 ? "#ff4400" : tempK > 200000 ? "#ff8800" : "#60a5fa";
        ctx.strokeStyle = `rgba(96, 165, 250, ${0.4 + tempFactor * 0.3})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = magnetosphereColor;
        ctx.beginPath();
        ctx.arc(earthX, earthY, magnetosphereRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Magnetosphere label
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("MAGNETOSPHERE", earthX, earthY - magnetosphereRadius - 5);

        // Earth label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", earthX, earthY + earthRadius + 20);
        ctx.fillText("EARTH", earthX, earthY + earthRadius + 20);

        // PERFECT THERMAL PARTICLE SYSTEM - Shows kinetic energy (temperature = speed)
        // Initialize particle system
        if (!(window as any).thermalParticles) {
          (window as any).thermalParticles = [];
        }
        let thermalParticles = (window as any).thermalParticles;

        // Particle count based on temperature (more particles = more activity)
        const particleCount = Math.min(
          Math.max(Math.floor(tempK / 5000), 30),
          80
        );
        const baseSpeed = 0.08; // Base movement speed
        const speedMultiplier = 1 + tempFactor * 3; // Hotter = faster particles

        // Add particles
        if (thermalParticles.length < particleCount) {
          for (let i = thermalParticles.length; i < particleCount; i++) {
            thermalParticles.push({
              x: sunX + sunRadius + 10,
              y: sunY + (Math.random() - 0.5) * 60,
              progress: Math.random(),
              speed: baseSpeed * speedMultiplier * (0.8 + Math.random() * 0.4),
              size: 2 + tempFactor * 3,
              phase: Math.random() * Math.PI * 2,
              trail: [] as Array<{ x: number; y: number; alpha: number }>,
            });
          }
        }

        // Remove excess particles
        if (thermalParticles.length > particleCount) {
          thermalParticles = thermalParticles.slice(0, particleCount);
          (window as any).thermalParticles = thermalParticles;
        }

        // Update and draw thermal particles
        thermalParticles.forEach((p: any) => {
          // Update progress (faster with higher temperature)
          p.progress += p.speed * 0.015;
          if (p.progress > 1) {
            p.progress = 0;
            p.x = sunX + sunRadius + 10;
            p.y = sunY + (Math.random() - 0.5) * 60;
            p.phase = Math.random() * Math.PI * 2;
          }

          // Calculate position along path Sun → L1 → Earth
          const totalDistance = earthX - sunX;
          const l1Progress = (l1X - sunX) / totalDistance;

          let x, y;
          if (p.progress < l1Progress) {
            // Between Sun and L1
            const segmentProgress = p.progress / l1Progress;
            x =
              sunX +
              sunRadius +
              10 +
              segmentProgress * (l1X - sunX - sunRadius - 10);
            y = sunY + (p.y - sunY) * (1 - segmentProgress * 0.2);
          } else {
            // Between L1 and Earth
            const segmentProgress =
              (p.progress - l1Progress) / (1 - l1Progress);
            x = l1X + segmentProgress * (earthX - l1X - earthRadius - 20);
            y = earthY + (p.y - sunY) * (1 - segmentProgress * 0.3);
          }

          p.x = x;
          p.y = y;

          // Add to trail (shows particle path/speed)
          p.trail.push({ x, y, alpha: 1 });
          if (p.trail.length > 5) p.trail.shift();

          // Draw trail (longer trail = faster particle = higher temperature)
          p.trail.forEach((point: any, idx: number) => {
            const trailAlpha = (idx / p.trail.length) * 0.4;
            const trailColor = getTemperatureColor(tempK);
            ctx.fillStyle = `${trailColor}${Math.floor(trailAlpha * 255)
              .toString(16)
              .padStart(2, "0")}`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, p.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
          });

          // Color based on temperature (Blue = Cold, Red = Hot)
          const particleColor = getTemperatureColor(tempK);
          const alpha = 0.6 + tempFactor * 0.3;

          // Draw particle with motion blur effect (faster = more blur)
          ctx.fillStyle = particleColor;
          ctx.shadowBlur = 5 + tempFactor * 8;
          ctx.shadowColor = particleColor;
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Speed indicator (small arrow showing direction)
          const arrowLength = p.size * 2;
          const arrowAngle = Math.atan2(
            y - (p.trail.length > 1 ? p.trail[p.trail.length - 2].y : y),
            x - (p.trail.length > 1 ? p.trail[p.trail.length - 2].x : x)
          );
          ctx.strokeStyle = particleColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.cos(arrowAngle) * arrowLength,
            y + Math.sin(arrowAngle) * arrowLength
          );
          ctx.stroke();
        });

        // Temperature color function
        function getTemperatureColor(temp: number): string {
          if (temp < 50000) return "rgba(100, 150, 255, 0.8)"; // Blue (cold)
          if (temp < 100000) return "rgba(100, 200, 255, 0.8)"; // Cyan
          if (temp < 200000) return "rgba(255, 255, 100, 0.8)"; // Yellow
          if (temp < 500000) return "rgba(255, 150, 0, 0.8)"; // Orange
          return "rgba(255, 50, 50, 0.9)"; // Red (very hot)
        }

        // Flow label
        const flowLabelY = sunY - 80;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect((sunX + earthX) / 2 - 100, flowLabelY - 10, 200, 18, 5);
        ctx.fill();
        ctx.fillStyle = getTemperatureColor(tempK);
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.strokeText(
          "Hot Solar Wind Particles →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.fillText(
          "Hot Solar Wind Particles →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.textAlign = "left";

        // COMPREHENSIVE DATA PANEL
        const panelX = 15;
        const panelY = 15;
        const panelWidth = canvas.width - 30;
        const panelHeight = 140;
        const panelPadding = 15;

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(249, 115, 22, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.stroke();

        // Row 1: Temperature & Level
        let tempLevel = "NORMAL";
        let tempColor = "#f97316";
        if (tempK > 800000) {
          tempLevel = "EXTREME";
          tempColor = "#ff0000";
        } else if (tempK > 500000) {
          tempLevel = "VERY HIGH";
          tempColor = "#ff4400";
        } else if (tempK > 200000) {
          tempLevel = "HIGH";
          tempColor = "#ff8800";
        } else if (tempK < 50000) {
          tempLevel = "LOW";
          tempColor = "#60a5fa";
        }

        ctx.fillStyle = tempColor;
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 15;
        ctx.shadowColor = tempColor;
        ctx.fillText(
          `Temperature: ${tempK.toLocaleString()} K`,
          panelX + panelPadding,
          panelY + 35
        );
        ctx.shadowBlur = 0;

        ctx.fillStyle = tempColor;
        ctx.font = "bold 18px Arial";
        ctx.fillText(
          `Level: ${tempLevel}`,
          panelX + panelPadding + 300,
          panelY + 35
        );

        // Progress bar
        const progressWidth = 200;
        const progressHeight = 8;
        const progressX = panelX + panelPadding + 500;
        const progressY = panelY + 25;
        const progressValue = Math.min(tempK / 1000000, 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 4);
        ctx.fill();

        const progressGradient = ctx.createLinearGradient(
          progressX,
          progressY,
          progressX + progressWidth * progressValue,
          progressY
        );
        if (tempK > 500000) {
          progressGradient.addColorStop(0, "#ff0000");
          progressGradient.addColorStop(1, "#ff4400");
        } else if (tempK > 200000) {
          progressGradient.addColorStop(0, "#ff8800");
          progressGradient.addColorStop(1, "#ffaa00");
        } else {
          progressGradient.addColorStop(0, "#f97316");
          progressGradient.addColorStop(1, "#fb923c");
        }
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          4
        );
        ctx.fill();

        // Row 2: Particle speed & kinetic energy
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Particle Speed:", panelX + panelPadding, panelY + 65);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 13px Arial";
        const avgSpeed = Math.sqrt((tempK * 1.38e-23) / 1.67e-27) / 1000; // Simplified kinetic energy calculation
        ctx.fillText(
          `${avgSpeed.toFixed(0)} km/s (estimated)`,
          panelX + panelPadding + 120,
          panelY + 65
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Density:", panelX + panelPadding + 300, panelY + 65);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 13px Arial";
        ctx.fillText(
          `${densityValue.toFixed(1)} cm⁻³`,
          panelX + panelPadding + 370,
          panelY + 65
        );

        // Row 3: Effects
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Effects:", panelX + panelPadding, panelY + 90);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px Arial";
        const effects =
          tempK > 500000
            ? "Magnetosphere compression, CME shock possible, enhanced space weather"
            : tempK > 200000
            ? "Magnetosphere heating, moderate compression, increased activity"
            : "Normal magnetosphere, typical solar wind conditions";
        ctx.fillText(effects, panelX + panelPadding + 70, panelY + 90);

        // Row 4: Status
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 10px Arial";
        const status =
          tempK > 500000
            ? "⚠️ Very hot - CME shock or compressed region detected!"
            : tempK > 200000
            ? "⚡ Elevated - Monitor for increased activity"
            : "✓ Normal - Typical solar wind temperature";
        ctx.fillText(status, panelX + panelPadding, panelY + 115);

        // EDUCATIONAL EXPLANATION BOX (BOTTOM)
        const explanationY = canvas.height - 110;
        const explanationHeight = 95;
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(249, 115, 22, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is Solar Wind Temperature?",
          explanationX + 10,
          explanationY + 20
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• Temperature = Average kinetic energy of solar wind particles (protons, electrons)",
          explanationX + 10,
          explanationY + 40
        );
        ctx.fillText(
          `• Current: ${tempK.toLocaleString()} K = ${tempLevel.toLowerCase()} temperature (Normal: 50,000-200,000 K)`,
          explanationX + 10,
          explanationY + 55
        );
        ctx.fillText(
          "• Higher temperature = Faster moving particles = More kinetic energy = Stronger impact on Earth",
          explanationX + 10,
          explanationY + 70
        );
        ctx.fillText(
          "• Very hot temperatures (>500,000 K) usually indicate CME shock waves or compressed regions",
          explanationX + 10,
          explanationY + 85
        );
      }

      // Bx Component - REMOVED
      else if (false && parameterName === "Bx Component") {
        const bxValue =
          bx !== null && bx !== undefined
            ? bx
            : value !== null && value !== undefined
            ? value
            : 0;
        const btValue = bt ?? 5;
        const intensity = Math.min(Math.abs(bxValue) / 20, 1);
        const isPositive = bxValue > 0;

        // Layout - aligned properly
        const objectOffsetY = 50;
        const centerX = canvas.width * 0.65;
        const centerY = canvas.height * 0.5;
        const sunX = 70;
        const sunY = centerY + objectOffsetY;
        const sunRadius = 32;
        const earthX = canvas.width - 80;
        const earthY = centerY + objectOffsetY;
        const earthRadius = 42;
        const l1X = earthX - 130;
        const l1Y = centerY + objectOffsetY;
        const satelliteSize = 15;

        // Earth's elliptical orbit (visible)
        const orbitCenterX = (sunX + earthX) / 2;
        const orbitCenterY = centerY + objectOffsetY;
        const semiMajorAxis = (earthX - sunX) / 2;
        const semiMinorAxis = 50;

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit label
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - semiMinorAxis - 15
        );
        ctx.textAlign = "left";

        // Sun
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffeb3b");
        sunGradient.addColorStop(0.5, "#ff9800");
        sunGradient.addColorStop(1, "#ff5722");
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 18);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 18);

        // Aditya L1 (measuring Bx component)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.6,
          l1Y - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 4, 8, 8);
        ctx.fillRect(l1X + satelliteSize, l1Y - 4, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("Aditya L1", l1X, l1Y + satelliteSize + 15);
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 15);

        // L1 monitoring indicator
        ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("📡 Measuring Bx", l1X, l1Y - satelliteSize - 20);
        ctx.textAlign = "left";

        // Earth
        const earthGradient = ctx.createRadialGradient(
          earthX,
          earthY,
          0,
          earthX,
          earthY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(earthX - 8, earthY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 6, earthY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", earthX, earthY + earthRadius + 18);
        ctx.fillText("EARTH", earthX, earthY + earthRadius + 18);

        // PERFECT MAGNETIC FIELD FLOW: Sun → L1 → Earth (East-West direction)
        // Initialize magnetic field particles
        if (!(window as any).bxParticles) {
          (window as any).bxParticles = [];
        }
        let bxParticles = (window as any).bxParticles;

        // Create magnetic field particles (more Bx = more particles)
        const particleCount = Math.min(Math.max(Math.abs(bxValue) * 3, 25), 70);
        const flowSpeed = 0.12; // Realistic slow speed

        if (bxParticles.length < particleCount) {
          for (let i = bxParticles.length; i < particleCount; i++) {
            bxParticles.push({
              x: sunX + sunRadius + 10,
              y: sunY + (Math.random() - 0.5) * 50,
              progress: Math.random(),
              size: 2 + intensity * 2.5,
              speed: flowSpeed * (0.8 + Math.random() * 0.4),
              direction: isPositive ? 1 : -1, // +1 = East, -1 = West
              trail: [] as Array<{ x: number; y: number }>,
            });
          }
        }

        // Remove excess particles
        if (bxParticles.length > particleCount) {
          bxParticles = bxParticles.slice(0, particleCount);
          (window as any).bxParticles = bxParticles;
        }

        // Update and draw magnetic field particles
        bxParticles.forEach((p: any) => {
          // Update progress (particles flow from Sun to Earth)
          p.progress += p.speed * 0.01;
          if (p.progress > 1) {
            p.progress = 0;
            p.x = sunX + sunRadius + 10;
            p.y = sunY + (Math.random() - 0.5) * 50;
          }

          // Calculate position along path Sun → L1 → Earth
          const totalDistance = earthX - sunX;
          const l1Progress = (l1X - sunX) / totalDistance;

          let x, y;
          if (p.progress < l1Progress) {
            // Between Sun and L1
            const segmentProgress = p.progress / l1Progress;
            x =
              sunX +
              sunRadius +
              10 +
              segmentProgress * (l1X - sunX - sunRadius - 10);
            y = sunY + (p.y - sunY) * (1 - segmentProgress * 0.2);
          } else {
            // Between L1 and Earth
            const segmentProgress =
              (p.progress - l1Progress) / (1 - l1Progress);
            x = l1X + segmentProgress * (earthX - l1X - earthRadius - 20);
            y = earthY + (p.y - sunY) * (1 - segmentProgress * 0.3);
          }

          p.x = x;
          p.y = y;

          // Add to trail
          p.trail.push({ x, y });
          if (p.trail.length > 3) p.trail.shift();

          // Draw trail (shows flow direction)
          p.trail.forEach((point: any, idx: number) => {
            const trailAlpha = (idx / p.trail.length) * 0.3;
            ctx.fillStyle = `rgba(168, 85, 247, ${trailAlpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw particle (color based on direction)
          const alpha = 0.5 + intensity * 0.4;
          const bxColor = isPositive
            ? `rgba(168, 85, 247, ${alpha})`
            : `rgba(147, 51, 234, ${alpha})`;
          ctx.fillStyle = bxColor;
          ctx.shadowBlur = 6 + intensity * 4;
          ctx.shadowColor = isPositive
            ? "rgba(168, 85, 247, 0.7)"
            : "rgba(147, 51, 234, 0.7)";
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Direction indicator on particle (horizontal arrow)
          const arrowLength = p.size * 1.5;
          const arrowAngle = p.direction > 0 ? 0 : Math.PI; // East = right, West = left
          ctx.strokeStyle = bxColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.cos(arrowAngle) * arrowLength,
            y + Math.sin(arrowAngle) * arrowLength
          );
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // HORIZONTAL FIELD LINES VISUALIZATION (East-West direction)
        const bxColor = isPositive ? "#a855f7" : "#9333ea";
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + intensity * 0.4})`;
        ctx.lineWidth = 2 + intensity * 2;
        ctx.shadowBlur = 8 + intensity * 4;
        ctx.shadowColor = "rgba(168, 85, 247, 0.5)";

        // Draw horizontal field lines (East-West direction)
        for (let i = 0; i < 8; i++) {
          const yPos = earthY - 60 + i * 15;
          const direction = isPositive ? 1 : -1;

          ctx.beginPath();
          for (let x = l1X + 20; x < earthX - 20; x += 3) {
            const waveY =
              yPos +
              Math.sin((x - l1X) * 0.05 + time * 2) *
                intensity *
                direction *
                10;
            if (x === l1X + 20) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Large direction arrow above L1 (CLEAR VISUALIZATION)
        const arrowY = l1Y - 70;
        const arrowSize = 25;
        ctx.fillStyle = bxColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = bxColor;

        if (isPositive) {
          // East arrow (points right)
          ctx.beginPath();
          ctx.moveTo(l1X, arrowY);
          ctx.lineTo(l1X + arrowSize, arrowY - arrowSize * 0.5);
          ctx.lineTo(l1X + arrowSize, arrowY + arrowSize * 0.5);
          ctx.closePath();
          ctx.fill();
        } else {
          // West arrow (points left)
          ctx.beginPath();
          ctx.moveTo(l1X, arrowY);
          ctx.lineTo(l1X - arrowSize, arrowY - arrowSize * 0.5);
          ctx.lineTo(l1X - arrowSize, arrowY + arrowSize * 0.5);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Direction label with background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect(l1X - 50, arrowY - 30, 100, 20, 5);
        ctx.fill();
        ctx.fillStyle = bxColor;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        const directionText = isPositive ? "→ East" : "← West";
        ctx.strokeText(directionText, l1X, arrowY - 15);
        ctx.fillText(directionText, l1X, arrowY - 15);
        ctx.textAlign = "left";

        // Flow label (Sun to Earth)
        const flowLabelY = sunY - 70;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect((sunX + earthX) / 2 - 80, flowLabelY - 10, 160, 18, 5);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.strokeText(
          "East-West Field Flow →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.fillText(
          "East-West Field Flow →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.textAlign = "left";

        // HORIZONTAL DATA PANEL
        const panelX = 15;
        const panelY = 15;
        const panelWidth = canvas.width - 30;
        const panelHeight = 120;
        const panelPadding = 15;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.stroke();

        // Row 1: Bx Value & Direction
        ctx.fillStyle = bxColor;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 10;
        ctx.shadowColor = bxColor;
        ctx.fillText(
          `Bx: ${bxValue.toFixed(1)} nT`,
          panelX + panelPadding,
          panelY + 30
        );
        ctx.shadowBlur = 0;

        ctx.fillStyle = bxColor;
        ctx.font = "bold 16px Arial";
        ctx.fillText(
          `Direction: ${isPositive ? "→ East" : "← West"}`,
          panelX + panelPadding + 180,
          panelY + 30
        );

        // Progress bar
        const progressWidth = 200;
        const progressHeight = 6;
        const progressX = panelX + panelPadding + 380;
        const progressY = panelY + 20;
        const progressValue = Math.min(Math.abs(bxValue) / 20, 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 3);
        ctx.fill();

        const progressGradient = ctx.createLinearGradient(
          progressX,
          progressY,
          progressX + progressWidth * progressValue,
          progressY
        );
        progressGradient.addColorStop(0, "#a855f7");
        progressGradient.addColorStop(1, "#c084fc");
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          3
        );
        ctx.fill();

        // Row 2: Additional info
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Total B (Bt):", panelX + panelPadding, panelY + 60);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
          `${btValue.toFixed(1)} nT`,
          panelX + panelPadding + 100,
          panelY + 60
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Component:", panelX + panelPadding + 200, panelY + 60);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
          "East-West (X-axis)",
          panelX + panelPadding + 290,
          panelY + 60
        );

        // Explanation (in panel)
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 10px Arial";
        ctx.fillText(
          "💡 Bx is the East-West component of the IMF. Works with By and Bz to determine field structure.",
          panelX + panelPadding,
          panelY + 85
        );
        ctx.fillText(
          `Current: ${bxValue.toFixed(1)} nT ${
            Math.abs(bxValue) > 10
              ? "(Unusual orientation - CME possible!)"
              : "(Normal)"
          }`,
          panelX + panelPadding,
          panelY + 100
        );

        // Educational explanation box (BOTTOM - PERFECT FOR JUDGES)
        const explanationY = canvas.height - 95;
        const explanationHeight = 80;
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is Bx Component?",
          explanationX + 10,
          explanationY + 18
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• Bx = East-West (X-axis) component of interplanetary magnetic field",
          explanationX + 10,
          explanationY + 35
        );
        ctx.fillText(
          `• Current: ${bxValue.toFixed(1)} nT = ${
            isPositive ? "Eastward" : "Westward"
          } field direction`,
          explanationX + 10,
          explanationY + 50
        );
        ctx.fillText(
          `• Large Bx (${
            Math.abs(bxValue) > 10 ? ">10 nT" : "<10 nT"
          }) + Southward Bz = Twisted CME field structure!`,
          explanationX + 10,
          explanationY + 65
        );
      }

      // By Component - REMOVED
      else if (false && parameterName === "By Component") {
        const byValue =
          by !== null && by !== undefined
            ? by
            : value !== null && value !== undefined
            ? value
            : 0;
        const btValue = bt ?? 5;
        const intensity = Math.min(Math.abs(byValue) / 20, 1);
        const isPositive = byValue > 0;

        // Layout - aligned properly
        const objectOffsetY = 50;
        const centerX = canvas.width * 0.65;
        const centerY = canvas.height * 0.5;
        const sunX = 70;
        const sunY = centerY + objectOffsetY;
        const sunRadius = 32;
        const earthX = canvas.width - 80;
        const earthY = centerY + objectOffsetY;
        const earthRadius = 42;
        const l1X = earthX - 130;
        const l1Y = centerY + objectOffsetY;
        const satelliteSize = 15;

        // Earth's elliptical orbit (visible)
        const orbitCenterX = (sunX + earthX) / 2;
        const orbitCenterY = centerY + objectOffsetY;
        const semiMajorAxis = (earthX - sunX) / 2;
        const semiMinorAxis = 50;

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit label
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - semiMinorAxis - 15
        );
        ctx.textAlign = "left";

        // Sun
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffeb3b");
        sunGradient.addColorStop(0.5, "#ff9800");
        sunGradient.addColorStop(1, "#ff5722");
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 18);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 18);

        // Aditya L1 (measuring By component)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(l1X, l1Y, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          l1X - satelliteSize * 0.6,
          l1Y - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(l1X - satelliteSize - 8, l1Y - 4, 8, 8);
        ctx.fillRect(l1X + satelliteSize, l1Y - 4, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(l1X, l1Y - satelliteSize);
        ctx.lineTo(l1X, l1Y - satelliteSize - 6);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("Aditya L1", l1X, l1Y + satelliteSize + 15);
        ctx.fillText("Aditya L1", l1X, l1Y + satelliteSize + 15);

        // L1 monitoring indicator
        ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("📡 Measuring By", l1X, l1Y - satelliteSize - 20);
        ctx.textAlign = "left";

        // Earth
        const earthGradient = ctx.createRadialGradient(
          earthX,
          earthY,
          0,
          earthX,
          earthY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(earthX - 8, earthY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 6, earthY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", earthX, earthY + earthRadius + 18);
        ctx.fillText("EARTH", earthX, earthY + earthRadius + 18);

        // PERFECT MAGNETIC FIELD FLOW: Sun → L1 → Earth (North-South direction)
        // Initialize magnetic field particles
        if (!(window as any).byParticles) {
          (window as any).byParticles = [];
        }
        let byParticles = (window as any).byParticles;

        // Create magnetic field particles (more By = more particles)
        const particleCount = Math.min(Math.max(Math.abs(byValue) * 3, 25), 70);
        const flowSpeed = 0.12; // Realistic slow speed

        if (byParticles.length < particleCount) {
          for (let i = byParticles.length; i < particleCount; i++) {
            byParticles.push({
              x: sunX + sunRadius + 10,
              y: sunY + (Math.random() - 0.5) * 50,
              progress: Math.random(),
              size: 2 + intensity * 2.5,
              speed: flowSpeed * (0.8 + Math.random() * 0.4),
              direction: isPositive ? 1 : -1, // +1 = North, -1 = South
              trail: [] as Array<{ x: number; y: number }>,
            });
          }
        }

        // Remove excess particles
        if (byParticles.length > particleCount) {
          byParticles = byParticles.slice(0, particleCount);
          (window as any).byParticles = byParticles;
        }

        // Update and draw magnetic field particles
        byParticles.forEach((p: any) => {
          // Update progress (particles flow from Sun to Earth)
          p.progress += p.speed * 0.01;
          if (p.progress > 1) {
            p.progress = 0;
            p.x = sunX + sunRadius + 10;
            p.y = sunY + (Math.random() - 0.5) * 50;
          }

          // Calculate position along path Sun → L1 → Earth
          const totalDistance = earthX - sunX;
          const l1Progress = (l1X - sunX) / totalDistance;

          let x, y;
          if (p.progress < l1Progress) {
            // Between Sun and L1
            const segmentProgress = p.progress / l1Progress;
            x =
              sunX +
              sunRadius +
              10 +
              segmentProgress * (l1X - sunX - sunRadius - 10);
            y = sunY + (p.y - sunY) * (1 - segmentProgress * 0.2);
          } else {
            // Between L1 and Earth
            const segmentProgress =
              (p.progress - l1Progress) / (1 - l1Progress);
            x = l1X + segmentProgress * (earthX - l1X - earthRadius - 20);
            y = earthY + (p.y - sunY) * (1 - segmentProgress * 0.3);
          }

          p.x = x;
          p.y = y;

          // Add to trail
          p.trail.push({ x, y });
          if (p.trail.length > 3) p.trail.shift();

          // Draw trail (shows flow direction)
          p.trail.forEach((point: any, idx: number) => {
            const trailAlpha = (idx / p.trail.length) * 0.3;
            ctx.fillStyle = `rgba(244, 114, 182, ${trailAlpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw particle (color based on direction)
          const alpha = 0.5 + intensity * 0.4;
          const byColor = isPositive
            ? `rgba(244, 114, 182, ${alpha})`
            : `rgba(236, 72, 153, ${alpha})`;
          ctx.fillStyle = byColor;
          ctx.shadowBlur = 6 + intensity * 4;
          ctx.shadowColor = isPositive
            ? "rgba(244, 114, 182, 0.7)"
            : "rgba(236, 72, 153, 0.7)";
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Direction indicator on particle (vertical arrow)
          const arrowLength = p.size * 1.5;
          const arrowAngle = p.direction > 0 ? -Math.PI / 2 : Math.PI / 2; // North = up, South = down
          ctx.strokeStyle = byColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.cos(arrowAngle) * arrowLength,
            y + Math.sin(arrowAngle) * arrowLength
          );
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // VERTICAL FIELD LINES VISUALIZATION (North-South direction)
        const byColor = isPositive ? "#f472b6" : "#ec4899";
        ctx.strokeStyle = `rgba(244, 114, 182, ${0.4 + intensity * 0.4})`;
        ctx.lineWidth = 2 + intensity * 2;
        ctx.shadowBlur = 8 + intensity * 4;
        ctx.shadowColor = "rgba(244, 114, 182, 0.5)";

        // Draw vertical field lines (North-South direction)
        for (let i = 0; i < 8; i++) {
          const xPos = l1X + 20 + i * 15;
          const direction = isPositive ? 1 : -1;

          ctx.beginPath();
          for (let y = earthY - 60; y < earthY + 60; y += 3) {
            const waveX =
              xPos +
              Math.sin((y - earthY) * 0.05 + time * 2) *
                intensity *
                direction *
                10;
            if (y === earthY - 60) ctx.moveTo(waveX, y);
            else ctx.lineTo(waveX, y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Large direction arrow above L1 (CLEAR VISUALIZATION)
        const arrowY = l1Y - 70;
        const arrowSize = 25;
        ctx.fillStyle = byColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = byColor;

        if (isPositive) {
          // North arrow (points up)
          ctx.beginPath();
          ctx.moveTo(l1X, arrowY + arrowSize);
          ctx.lineTo(l1X - arrowSize * 0.5, arrowY);
          ctx.lineTo(l1X + arrowSize * 0.5, arrowY);
          ctx.closePath();
          ctx.fill();
        } else {
          // South arrow (points down)
          ctx.beginPath();
          ctx.moveTo(l1X, arrowY);
          ctx.lineTo(l1X - arrowSize * 0.5, arrowY + arrowSize);
          ctx.lineTo(l1X + arrowSize * 0.5, arrowY + arrowSize);
          ctx.closePath();
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Direction label with background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect(l1X - 50, arrowY - 30, 100, 20, 5);
        ctx.fill();
        ctx.fillStyle = byColor;
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        const directionText = isPositive ? "↑ North" : "↓ South";
        ctx.strokeText(directionText, l1X, arrowY - 15);
        ctx.fillText(directionText, l1X, arrowY - 15);
        ctx.textAlign = "left";

        // Flow label (Sun to Earth)
        const flowLabelY = sunY - 70;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        ctx.roundRect((sunX + earthX) / 2 - 80, flowLabelY - 10, 160, 18, 5);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.strokeText(
          "North-South Field Flow →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.fillText(
          "North-South Field Flow →",
          (sunX + earthX) / 2,
          flowLabelY + 3
        );
        ctx.textAlign = "left";

        // HORIZONTAL DATA PANEL
        const panelX = 15;
        const panelY = 15;
        const panelWidth = canvas.width - 30;
        const panelHeight = 120;
        const panelPadding = 15;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(244, 114, 182, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.stroke();

        // Row 1: By Value & Direction
        ctx.fillStyle = byColor;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 10;
        ctx.shadowColor = byColor;
        ctx.fillText(
          `By: ${byValue.toFixed(1)} nT`,
          panelX + panelPadding,
          panelY + 30
        );
        ctx.shadowBlur = 0;

        ctx.fillStyle = byColor;
        ctx.font = "bold 16px Arial";
        ctx.fillText(
          `Direction: ${isPositive ? "↑ North" : "↓ South"}`,
          panelX + panelPadding + 180,
          panelY + 30
        );

        // Progress bar
        const progressWidth = 200;
        const progressHeight = 6;
        const progressX = panelX + panelPadding + 380;
        const progressY = panelY + 20;
        const progressValue = Math.min(Math.abs(byValue) / 20, 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 3);
        ctx.fill();

        const progressGradient = ctx.createLinearGradient(
          progressX,
          progressY,
          progressX + progressWidth * progressValue,
          progressY
        );
        progressGradient.addColorStop(0, "#f472b6");
        progressGradient.addColorStop(1, "#f9a8d4");
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          3
        );
        ctx.fill();

        // Row 2: Additional info
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Total B (Bt):", panelX + panelPadding, panelY + 60);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
          `${btValue.toFixed(1)} nT`,
          panelX + panelPadding + 100,
          panelY + 60
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Component:", panelX + panelPadding + 200, panelY + 60);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
          "North-South (Y-axis)",
          panelX + panelPadding + 290,
          panelY + 60
        );

        // Explanation (in panel)
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 10px Arial";
        ctx.fillText(
          "💡 By is the North-South horizontal component. Large values can indicate twisted CME fields.",
          panelX + panelPadding,
          panelY + 85
        );
        ctx.fillText(
          `Current: ${byValue.toFixed(1)} nT ${
            Math.abs(byValue) > 10 ? "(Unusual - CME possible!)" : "(Normal)"
          }`,
          panelX + panelPadding,
          panelY + 100
        );

        // Educational explanation box (BOTTOM - PERFECT FOR JUDGES)
        const explanationY = canvas.height - 95;
        const explanationHeight = 80;
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(244, 114, 182, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is By Component?",
          explanationX + 10,
          explanationY + 18
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• By = North-South (Y-axis) component of interplanetary magnetic field",
          explanationX + 10,
          explanationY + 35
        );
        ctx.fillText(
          `• Current: ${byValue.toFixed(1)} nT = ${
            isPositive ? "Northward" : "Southward"
          } field direction`,
          explanationX + 10,
          explanationY + 50
        );
        ctx.fillText(
          `• Large By (${
            Math.abs(byValue) > 10 ? ">10 nT" : "<10 nT"
          }) + Southward Bz = Twisted CME field structure!`,
          explanationX + 10,
          explanationY + 65
        );
      }

      // F10.7 Flux - ADVANCED SOLAR RADIO FLUX ANIMATION
      else if (parameterName === "F10.7 Flux") {
        const f107Value = value ?? 120;
        const intensity = Math.min((f107Value - 60) / 240, 1); // Normalize 60-300 range
        const activityLevel =
          f107Value < 100
            ? "QUIET"
            : f107Value < 150
            ? "MODERATE"
            : f107Value < 200
            ? "ACTIVE"
            : "VERY ACTIVE";
        const activityColor =
          f107Value < 100
            ? "#60a5fa"
            : f107Value < 150
            ? "#fbbf24"
            : f107Value < 200
            ? "#f97316"
            : "#ef4444";

        // Calculate ionosphere thickness FIRST (needed for radio waves section)
        const ionosphereThickness = 8 + intensity * 12;

        // Layout
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const sunX = centerX - 180;
        const sunY = centerY;
        const sunRadius = 50;
        const earthX = centerX + 180;
        const earthY = centerY;
        const earthRadius = 35;

        // Earth's elliptical orbit (visible)
        const orbitCenterX = (sunX + earthX) / 2;
        const orbitCenterY = centerY;
        const semiMajorAxis = (earthX - sunX) / 2;
        const semiMinorAxis = 50;

        ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
          const x = orbitCenterX + Math.cos(angle) * semiMajorAxis;
          const y = orbitCenterY + Math.sin(angle) * semiMinorAxis;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit label
        ctx.fillStyle = "rgba(100, 150, 255, 0.8)";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Earth's Orbit",
          orbitCenterX,
          orbitCenterY - semiMinorAxis - 15
        );
        ctx.textAlign = "left";

        // SUN WITH SUNSPOTS AND ACTIVITY
        // Sun body with gradient
        const sunGradient = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          sunRadius
        );
        sunGradient.addColorStop(0, "#ffeb3b");
        sunGradient.addColorStop(0.4, "#ff9800");
        sunGradient.addColorStop(0.7, "#ff5722");
        sunGradient.addColorStop(1, "#d32f2f");
        ctx.fillStyle = sunGradient;
        ctx.shadowBlur = 30 + intensity * 20;
        ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sunspots (more with higher F10.7)
        const sunspotCount = Math.floor(3 + intensity * 8);
        for (let i = 0; i < sunspotCount; i++) {
          const angle = (i / sunspotCount) * Math.PI * 2 + time * 0.3;
          const distance = sunRadius * (0.3 + Math.random() * 0.5);
          const spotX = sunX + Math.cos(angle) * distance;
          const spotY = sunY + Math.sin(angle) * distance;
          const spotSize = 3 + intensity * 4;

          // Sunspot (dark center)
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.beginPath();
          ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
          ctx.fill();

          // Sunspot penumbra
          ctx.fillStyle = "rgba(100, 50, 0, 0.5)";
          ctx.beginPath();
          ctx.arc(spotX, spotY, spotSize * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Solar activity flares (more intense with higher F10.7)
        if (intensity > 0.3) {
          for (let i = 0; i < Math.floor(intensity * 5); i++) {
            const flareAngle = (i / 5) * Math.PI * 2 + time;
            const flareX = sunX + Math.cos(flareAngle) * sunRadius;
            const flareY = sunY + Math.sin(flareAngle) * sunRadius;
            const flareLength = 15 + intensity * 25;

            ctx.strokeStyle = `rgba(255, 200, 0, ${0.6 + intensity * 0.4})`;
            ctx.lineWidth = 2 + intensity * 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ffeb3b";
            ctx.beginPath();
            ctx.moveTo(flareX, flareY);
            ctx.lineTo(
              flareX + Math.cos(flareAngle) * flareLength,
              flareY + Math.sin(flareAngle) * flareLength
            );
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        // Sun label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("SUN", sunX, sunY + sunRadius + 20);
        ctx.fillText("SUN", sunX, sunY + sunRadius + 20);

        // RADIO WAVES PROPAGATION (10.7 cm wavelength)
        // ionosphereThickness already defined above
        // Initialize radio wave particles
        if (!(window as any).f107RadioWaves) {
          (window as any).f107RadioWaves = [];
        }
        let radioWaves = (window as any).f107RadioWaves;

        // Create radio wave particles based on F10.7 value
        const waveCount = Math.min(
          Math.max(Math.floor(f107Value / 10), 10),
          40
        );
        const waveSpeed = 0.15;

        if (radioWaves.length < waveCount) {
          for (let i = radioWaves.length; i < waveCount; i++) {
            const angle = (i / waveCount) * Math.PI * 2;
            radioWaves.push({
              angle: angle,
              distance: sunRadius + 5,
              speed: waveSpeed * (0.8 + Math.random() * 0.4),
              size: 2 + intensity * 2,
              phase: Math.random() * Math.PI * 2,
            });
          }
        }

        // Remove excess waves
        if (radioWaves.length > waveCount) {
          radioWaves = radioWaves.slice(0, waveCount);
          (window as any).f107RadioWaves = radioWaves;
        }

        // Draw radio waves propagating from Sun to Earth
        radioWaves.forEach((wave: any, idx: number) => {
          wave.distance += wave.speed;
          const maxDistance =
            Math.sqrt((earthX - sunX) ** 2 + (earthY - sunY) ** 2) +
            earthRadius;
          if (wave.distance > maxDistance) {
            wave.distance = sunRadius + 5;
            wave.phase = Math.random() * Math.PI * 2;
          }

          // Calculate position
          const waveX = sunX + Math.cos(wave.angle) * wave.distance;
          const waveY = sunY + Math.sin(wave.angle) * wave.distance;

          // Draw radio wave (concentric circles with pulsing effect)
          const alpha = Math.max(0.2, 1 - (wave.distance - sunRadius) / 300);
          const pulsePhase = wave.phase + time * 3;
          const pulseSize = wave.size + Math.sin(pulsePhase) * 1.5;

          ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 0.6})`;
          ctx.lineWidth = 1.5;

          // Draw multiple concentric circles for wave effect
          for (let ring = 0; ring < 3; ring++) {
            const ringRadius = pulseSize + ring * 3;
            const ringAlpha = alpha * (1 - ring * 0.3);
            ctx.strokeStyle = `rgba(255, 200, 0, ${ringAlpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(waveX, waveY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Draw wave particle with glow
          ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
          ctx.shadowBlur = 5 + intensity * 3;
          ctx.shadowColor = "#ffeb3b";
          ctx.beginPath();
          ctx.arc(waveX, waveY, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw connection line to Earth if wave is close
          const distanceToEarth = Math.sqrt(
            (waveX - earthX) ** 2 + (waveY - earthY) ** 2
          );
          if (
            distanceToEarth < earthRadius + ionosphereThickness + 30 &&
            distanceToEarth > earthRadius + ionosphereThickness
          ) {
            ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(waveX, waveY);
            ctx.lineTo(earthX, earthY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });

        // EARTH WITH IONOSPHERE EFFECTS
        // Earth body
        const earthGradient = ctx.createRadialGradient(
          earthX,
          earthY,
          0,
          earthX,
          earthY,
          earthRadius
        );
        earthGradient.addColorStop(0, "#60a5fa");
        earthGradient.addColorStop(0.7, "#4a90e2");
        earthGradient.addColorStop(1, "#2563eb");
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();

        // Continents
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(earthX - 8, earthY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 6, earthY + 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Ionosphere visualization (affected by F10.7) - MULTI-LAYER
        // ionosphereThickness already defined above for radio waves
        const ionosphereColor = intensity > 0.5 ? "#f97316" : "#fbbf24";

        // Draw multiple ionosphere layers (F, E, D layers)
        for (let layer = 0; layer < 3; layer++) {
          const layerThickness = ionosphereThickness * (0.3 + layer * 0.35);
          const layerAlpha = (0.2 + intensity * 0.3) * (1 - layer * 0.2);
          ctx.strokeStyle = `rgba(251, 191, 36, ${layerAlpha})`;
          ctx.lineWidth = 1.5 - layer * 0.3;
          ctx.shadowBlur = 8 - layer * 2;
          ctx.shadowColor = ionosphereColor;
          ctx.beginPath();
          ctx.arc(earthX, earthY, earthRadius + layerThickness, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Ionosphere glow effect (more intense with higher F10.7)
        if (intensity > 0.3) {
          ctx.fillStyle = `rgba(251, 191, 36, ${intensity * 0.15})`;
          ctx.beginPath();
          ctx.arc(
            earthX,
            earthY,
            earthRadius + ionosphereThickness,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Ionosphere label
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "IONOSPHERE",
          earthX,
          earthY - earthRadius - ionosphereThickness - 5
        );

        // Earth label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText("EARTH", earthX, earthY + earthRadius + 20);
        ctx.fillText("EARTH", earthX, earthY + earthRadius + 20);

        // SATELLITE DRAG VISUALIZATION (affected by F10.7)
        const satelliteY = earthY - earthRadius - ionosphereThickness - 25;
        const satelliteSize = 6;

        // Satellite orbit path
        ctx.strokeStyle = `rgba(100, 200, 255, ${0.3 + intensity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(
          earthX,
          earthY,
          earthRadius + ionosphereThickness + 20,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Satellite (affected by drag)
        const satelliteX =
          earthX +
          Math.cos(time * 0.5) * (earthRadius + ionosphereThickness + 20);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(satelliteX, satelliteY, satelliteSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(
          satelliteX - satelliteSize * 0.6,
          satelliteY - satelliteSize * 0.3,
          satelliteSize * 1.2,
          satelliteSize * 0.6
        );

        // Drag effect (more drag with higher F10.7)
        if (intensity > 0.4) {
          ctx.strokeStyle = `rgba(239, 68, 68, ${intensity * 0.6})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(satelliteX, satelliteY);
          ctx.lineTo(satelliteX - 15 * intensity, satelliteY);
          ctx.stroke();

          // Drag label
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 9px Arial";
          ctx.textAlign = "center";
          ctx.fillText("↑ Drag", satelliteX - 8 * intensity, satelliteY - 10);
        }

        // COMPREHENSIVE DATA PANEL
        const panelX = 15;
        const panelY = 15;
        const panelWidth = canvas.width - 30;
        const panelHeight = 140;
        const panelPadding = 15;

        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.strokeStyle = `rgba(251, 191, 36, 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        ctx.stroke();

        // Row 1: F10.7 Value & Activity Level
        ctx.fillStyle = activityColor;
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 15;
        ctx.shadowColor = activityColor;
        ctx.fillText(
          `F10.7: ${f107Value.toFixed(1)} sfu`,
          panelX + panelPadding,
          panelY + 35
        );
        ctx.shadowBlur = 0;

        ctx.fillStyle = activityColor;
        ctx.font = "bold 18px Arial";
        ctx.fillText(
          `Activity: ${activityLevel}`,
          panelX + panelPadding + 250,
          panelY + 35
        );

        // Progress bar
        const progressWidth = 250;
        const progressHeight = 8;
        const progressX = panelX + panelPadding + 450;
        const progressY = panelY + 25;
        const progressValue = Math.min((f107Value - 60) / 240, 1);

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 4);
        ctx.fill();

        const progressGradient = ctx.createLinearGradient(
          progressX,
          progressY,
          progressX + progressWidth * progressValue,
          progressY
        );
        if (f107Value < 100) {
          progressGradient.addColorStop(0, "#60a5fa");
          progressGradient.addColorStop(1, "#93c5fd");
        } else if (f107Value < 150) {
          progressGradient.addColorStop(0, "#fbbf24");
          progressGradient.addColorStop(1, "#fcd34d");
        } else if (f107Value < 200) {
          progressGradient.addColorStop(0, "#f97316");
          progressGradient.addColorStop(1, "#fb923c");
        } else {
          progressGradient.addColorStop(0, "#ef4444");
          progressGradient.addColorStop(1, "#f87171");
        }
        ctx.fillStyle = progressGradient;
        ctx.beginPath();
        ctx.roundRect(
          progressX,
          progressY,
          progressWidth * progressValue,
          progressHeight,
          4
        );
        ctx.fill();

        // Row 2: Sunspot correlation
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Sunspots:", panelX + panelPadding, panelY + 65);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 13px Arial";
        const estimatedSunspots = Math.floor((f107Value - 67) / 0.9);
        ctx.fillText(
          `${estimatedSunspots > 0 ? estimatedSunspots : "Few"} (estimated)`,
          panelX + panelPadding + 90,
          panelY + 65
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Wavelength:", panelX + panelPadding + 200, panelY + 65);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 13px Arial";
        ctx.fillText(
          "10.7 cm (2800 MHz)",
          panelX + panelPadding + 290,
          panelY + 65
        );

        // Row 3: Effects
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Effects:", panelX + panelPadding, panelY + 90);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px Arial";
        const effects =
          f107Value > 200
            ? "High ionosphere density, increased satellite drag, enhanced radio propagation"
            : f107Value > 150
            ? "Moderate ionosphere activity, normal satellite drag"
            : "Quiet ionosphere, minimal effects";
        ctx.fillText(effects, panelX + panelPadding + 70, panelY + 90);

        // Row 4: Solar cycle context & measurement info
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "bold 10px Arial";
        const cycleStatus =
          f107Value > 150
            ? "Solar Maximum (High Activity)"
            : f107Value < 100
            ? "Solar Minimum (Low Activity)"
            : "Rising/Declining Phase";
        ctx.fillText(
          `Solar Cycle: ${cycleStatus}`,
          panelX + panelPadding,
          panelY + 115
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.font = "bold 9px Arial";
        ctx.fillText(
          `Measured: Dominion Radio Astrophysical Observatory (DRAO), Canada`,
          panelX + panelPadding + 300,
          panelY + 115
        );

        // EDUCATIONAL EXPLANATION BOX (BOTTOM)
        const explanationY = canvas.height - 110;
        const explanationHeight = 95;
        const explanationX = panelX;
        const explanationWidth = panelWidth;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.fill();
        ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          explanationX,
          explanationY,
          explanationWidth,
          explanationHeight,
          8
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "💡 What is F10.7 Flux?",
          explanationX + 10,
          explanationY + 20
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 11px Arial";
        ctx.fillText(
          "• F10.7 = Solar radio flux at 10.7 cm wavelength (2800 MHz) - Measured continuously since 1947",
          explanationX + 10,
          explanationY + 40
        );
        ctx.fillText(
          `• Current: ${f107Value.toFixed(
            1
          )} sfu = ${activityLevel.toLowerCase()} solar activity (Range: 60-300 sfu)`,
          explanationX + 10,
          explanationY + 55
        );
        ctx.fillText(
          "• Higher values = More sunspots = More active Sun = Stronger ionosphere = Increased satellite drag",
          explanationX + 10,
          explanationY + 70
        );
        ctx.fillText(
          "• Used to predict space weather effects on Earth's atmosphere, satellite operations, and radio communications",
          explanationX + 10,
          explanationY + 85
        );
      }

      // Default - Simple particle animation
      else {
        for (let i = 0; i < 50; i++) {
          const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width;
          const y = (Math.cos(time * 0.7 + i) * 0.5 + 0.5) * canvas.height;

          ctx.fillStyle = `rgba(100, 200, 255, 0.5)`;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      // Clean up particles when component unmounts or parameter changes
      if (parameterName === "Kp Index") {
        (window as any).kpParticles = [];
        (window as any).solarWindParticles = [];
      }
    };
  }, [
    parameterName,
    value,
    animationType,
    lon,
    lat,
    density,
    temperature,
    bz,
    bt,
    bx,
    by,
    kp,
    dst,
    ap,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{
        background: "radial-gradient(circle, #0f172a 0%, #1e293b 100%)",
      }}
    />
  );
};

export default Parameter2DAnimation;
