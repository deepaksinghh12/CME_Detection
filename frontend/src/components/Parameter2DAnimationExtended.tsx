/**
 * Extended 2D Canvas Animations - Additional Features
 * This file contains extended animations and features to keep main file manageable
 */
import React from 'react';

// Extended helper functions and utilities
export const ExtendedAnimationHelpers = {
  // Calculate arrival time from L1 to Earth
  calculateArrivalTime: (speed: number, distance: number = 1500000): { minutes: number; seconds: number } => {
    if (speed <= 0) return { minutes: 0, seconds: 0 };
    const totalSeconds = distance / speed;
    return {
      minutes: Math.floor(totalSeconds / 60),
      seconds: Math.floor(totalSeconds % 60)
    };
  },

  // Get color based on value and thresholds
  getValueColor: (value: number, normal: number, warning: number, danger: number): string => {
    if (value >= danger) return '#ff0000';
    if (value >= warning) return '#ff8800';
    if (value >= normal) return '#ffaa00';
    return '#60a5fa';
  },

  // Format large numbers
  formatNumber: (num: number, decimals: number = 1): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  },

  // Create glassmorphism panel
  drawGlassPanel: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number = 10
  ) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height);
    }

    ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, width, height);
    }
  }
};

// Export types for extended features
export interface ExtendedParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export default ExtendedAnimationHelpers;






