/**
 * Parameter-Specific Animations
 * Different animation styles for different parameters
 * Now using 2D canvas animations for better performance and clarity
 */
import React from 'react';
import Parameter2DAnimation from './Parameter2DAnimation';

interface ParameterSpecificAnimationProps {
  parameterName: string;
  value: number | null;
  animationType: 'wind' | 'geomagnetic' | 'particle' | 'field' | 'image';
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
}

const ParameterSpecificAnimation: React.FC<ParameterSpecificAnimationProps> = (props) => {
  // Use 2D animations for all parameters - better performance and clarity
  return <Parameter2DAnimation {...props} />;
};

export default ParameterSpecificAnimation;

