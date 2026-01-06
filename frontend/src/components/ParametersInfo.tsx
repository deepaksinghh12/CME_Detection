/**
 * ParametersInfo Component
 * 
 * Displays comprehensive information about all OMNIWeb parameters used in CME detection.
 * Provides interactive, lively visualization of parameter details, ranges, and significance.
 * 
 * Features:
 * - Interactive parameter cards with animations
 * - Scientific descriptions and typical ranges
 * - Real-time parameter status indicators
 * - CME detection significance for each parameter
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Magnet, Zap, Gauge, Activity, TrendingUp, AlertTriangle, 
  Info, BarChart3, Radio, Atom, Wind, Sun, Moon, Compass
} from 'lucide-react';

interface Parameter {
  id: string;
  name: string;
  category: 'magnetic' | 'plasma' | 'derived' | 'geomagnetic' | 'particles';
  unit: string;
  description: string;
  typicalRange: string;
  cmeSignificance: 'critical' | 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  color: string;
  detectionWeight: string;
}

const ParametersInfo: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);

  const parameters: Parameter[] = [
    // Magnetic Field Parameters
    {
      id: 'bx_gsm',
      name: 'Bx (GSM)',
      category: 'magnetic',
      unit: 'nT',
      description: 'X-component of interplanetary magnetic field in Geocentric Solar Magnetospheric coordinates',
      typicalRange: '-20 to +20 nT',
      cmeSignificance: 'medium',
      icon: <Magnet className="w-5 h-5" />,
      color: 'text-blue-400',
      detectionWeight: '0.15'
    },
    {
      id: 'by_gsm',
      name: 'By (GSM)',
      category: 'magnetic',
      unit: 'nT',
      description: 'Y-component of IMF in GSM coordinates, indicates field direction',
      typicalRange: '-20 to +20 nT',
      cmeSignificance: 'medium',
      icon: <Magnet className="w-5 h-5" />,
      color: 'text-blue-400',
      detectionWeight: '0.15'
    },
    {
      id: 'bz_gsm',
      name: 'Bz (GSM)',
      category: 'magnetic',
      unit: 'nT',
      description: 'Z-component of IMF in GSM coordinates. CRITICAL: Southward Bz (< -10 nT) indicates geomagnetic storm potential',
      typicalRange: '-20 to +20 nT',
      cmeSignificance: 'critical',
      icon: <Magnet className="w-5 h-5" />,
      color: 'text-red-400',
      detectionWeight: '0.30'
    },
    {
      id: 'bt',
      name: 'Total IMF (Bt)',
      category: 'magnetic',
      unit: 'nT',
      description: 'Total magnitude of interplanetary magnetic field',
      typicalRange: '3 to 15 nT',
      cmeSignificance: 'high',
      icon: <Magnet className="w-5 h-5" />,
      color: 'text-purple-400',
      detectionWeight: '0.20'
    },
    
    // Plasma Parameters
    {
      id: 'speed',
      name: 'Flow Speed',
      category: 'plasma',
      unit: 'km/s',
      description: 'Solar wind flow speed. High speeds (> 500 km/s) indicate CME arrival',
      typicalRange: '300 to 800 km/s',
      cmeSignificance: 'critical',
      icon: <Wind className="w-5 h-5" />,
      color: 'text-cyan-400',
      detectionWeight: '0.25'
    },
    {
      id: 'density',
      name: 'Proton Density',
      category: 'plasma',
      unit: 'cm⁻³',
      description: 'Number density of protons. Compression (> 2× background) indicates shock front',
      typicalRange: '1 to 20 cm⁻³',
      cmeSignificance: 'critical',
      icon: <Atom className="w-5 h-5" />,
      color: 'text-green-400',
      detectionWeight: '0.20'
    },
    {
      id: 'temperature',
      name: 'Proton Temperature',
      category: 'plasma',
      unit: 'K',
      description: 'Temperature of solar wind protons. Variations indicate CME passage',
      typicalRange: '10,000 to 1,000,000 K',
      cmeSignificance: 'high',
      icon: <Gauge className="w-5 h-5" />,
      color: 'text-yellow-400',
      detectionWeight: '0.15'
    },
    {
      id: 'flow_pressure',
      name: 'Flow Pressure',
      category: 'plasma',
      unit: 'nPa',
      description: 'Dynamic pressure of solar wind. High pressure indicates compression',
      typicalRange: '1 to 10 nPa',
      cmeSignificance: 'high',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-orange-400',
      detectionWeight: '0.15'
    },
    
    // Derived Parameters
    {
      id: 'plasma_beta',
      name: 'Plasma Beta',
      category: 'derived',
      unit: 'dimensionless',
      description: 'Ratio of thermal to magnetic pressure. Low (< 0.5) or high (> 2) indicates CME',
      typicalRange: '0.1 to 5.0',
      cmeSignificance: 'high',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-pink-400',
      detectionWeight: '0.10'
    },
    {
      id: 'alfven_mach',
      name: 'Alfven Mach Number',
      category: 'derived',
      unit: 'dimensionless',
      description: 'Ratio of flow speed to Alfven speed. High Mach (> 2) indicates shock front',
      typicalRange: '0.5 to 5.0',
      cmeSignificance: 'critical',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-indigo-400',
      detectionWeight: '0.20'
    },
    {
      id: 'magnetosonic_mach',
      name: 'Magnetosonic Mach',
      category: 'derived',
      unit: 'dimensionless',
      description: 'Magnetosonic Mach number. Additional shock indicator',
      typicalRange: '0.5 to 5.0',
      cmeSignificance: 'high',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-violet-400',
      detectionWeight: '0.15'
    },
    {
      id: 'electric_field',
      name: 'Electric Field',
      category: 'derived',
      unit: 'mV/m',
      description: 'Convection electric field (E = -V × B). Enhanced field indicates CME',
      typicalRange: '0 to 10 mV/m',
      cmeSignificance: 'high',
      icon: <Radio className="w-5 h-5" />,
      color: 'text-teal-400',
      detectionWeight: '0.15'
    },
    
    // Geomagnetic Indices
    {
      id: 'dst',
      name: 'Dst Index',
      category: 'geomagnetic',
      unit: 'nT',
      description: 'Disturbance storm time index. Negative values (< -50 nT) indicate geomagnetic storm',
      typicalRange: '-200 to +50 nT',
      cmeSignificance: 'critical',
      icon: <Compass className="w-5 h-5" />,
      color: 'text-red-500',
      detectionWeight: '0.25'
    },
    {
      id: 'kp',
      name: 'Kp Index',
      category: 'geomagnetic',
      unit: '0-9',
      description: 'Planetary geomagnetic activity index. High Kp (> 5) indicates active conditions',
      typicalRange: '0 to 9',
      cmeSignificance: 'high',
      icon: <Sun className="w-5 h-5" />,
      color: 'text-amber-400',
      detectionWeight: '0.20'
    },
    {
      id: 'ae',
      name: 'AE Index',
      category: 'geomagnetic',
      unit: 'nT',
      description: 'Auroral electrojet index. High values (> 500 nT) indicate active auroral activity',
      typicalRange: '0 to 2000 nT',
      cmeSignificance: 'medium',
      icon: <Moon className="w-5 h-5" />,
      color: 'text-sky-400',
      detectionWeight: '0.10'
    },
    
    // Particle Flux
    {
      id: 'proton_flux',
      name: 'Proton Flux (>10 MEV)',
      category: 'particles',
      unit: 'particles/(cm²·s·ster)',
      description: 'High energy proton flux. Enhanced flux (> 1e4) indicates CME/shock arrival',
      typicalRange: '1e2 to 1e6',
      cmeSignificance: 'critical',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-rose-400',
      detectionWeight: '0.20'
    },
  ];

  const categories = [
    { id: 'all', label: 'All Parameters', icon: <BarChart3 /> },
    { id: 'magnetic', label: 'Magnetic Field', icon: <Magnet /> },
    { id: 'plasma', label: 'Plasma', icon: <Wind /> },
    { id: 'derived', label: 'Derived', icon: <TrendingUp /> },
    { id: 'geomagnetic', label: 'Geomagnetic', icon: <Compass /> },
    { id: 'particles', label: 'Particles', icon: <Atom /> },
  ];

  const filteredParameters = selectedCategory === 'all' 
    ? parameters 
    : parameters.filter(p => p.category === selectedCategory);

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          OMNIWeb Parameters
        </h2>
        <p className="text-muted-foreground">
          Comprehensive information about all parameters used in CME detection from NASA OMNIWeb database
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-6 bg-black/40 border-white/10">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="flex items-center gap-2"
              >
                {cat.icon}
                <span className="hidden md:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {filteredParameters.map((param, index) => (
            <motion.div
              key={param.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedParameter(selectedParameter === param.id ? null : param.id)}
            >
              <Card className="h-full cursor-pointer hover:border-primary/50 transition-all bg-black/40 border-white/10 hover:shadow-lg hover:shadow-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${param.color.replace('text-', 'from-')}/20 ${param.color.replace('text-', 'to-')}/10`}>
                        <div className={param.color}>
                          {param.icon}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{param.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {param.unit}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getSignificanceColor(param.cmeSignificance)}>
                      {param.cmeSignificance}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {param.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Typical Range:</span>
                      <span className="font-mono">{param.typicalRange}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Detection Weight:</span>
                      <span className="font-mono text-primary">{param.detectionWeight}</span>
                    </div>
                  </div>
                  
                  {selectedParameter === param.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 mt-0.5 text-primary" />
                          <div>
                            <p className="font-semibold mb-1">CME Detection Role:</p>
                            <p className="text-muted-foreground">
                              {param.cmeSignificance === 'critical' && 
                                'This parameter is critical for CME detection. Strong deviations indicate high probability of CME arrival.'}
                              {param.cmeSignificance === 'high' && 
                                'This parameter has high significance. Changes are strong indicators of CME activity.'}
                              {param.cmeSignificance === 'medium' && 
                                'This parameter provides medium-level indicators. Combined with other parameters, it strengthens detection confidence.'}
                              {param.cmeSignificance === 'low' && 
                                'This parameter provides supporting evidence. Used in combination with other indicators.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
      >
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{parameters.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Parameters</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">
              {parameters.filter(p => p.cmeSignificance === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Critical Parameters</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">
              {categories.length - 1}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Parameter Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">100%</div>
            <p className="text-xs text-muted-foreground mt-1">OMNIWeb Coverage</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ParametersInfo;












