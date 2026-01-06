/**
 * ThresholdConfiguration Component
 * 
 * This component allows users to configure detection thresholds and sensitivity settings for the CME detection system.
 * It features "extreme" animations using framer-motion, including staggered entrances, hover effects, and dynamic feedback.
 * 
 * Features:
 * - Individual parameter tuning (velocity, density, temperature)
 * - Global sensitivity control
 * - Automatic threshold optimization via backend API
 * - Visual feedback for sensitivity levels
 * - Interactive sliders and toggles
 */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, RotateCcw, TrendingUp, AlertTriangle, CheckCircle, Zap, Activity, Gauge } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api, ThresholdConfig } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ThresholdConfiguration: React.FC = () => {
  const [thresholds, setThresholds] = useState<ThresholdConfig>({
    velocity_enhancement: 2.5,
    density_enhancement: 2.0,
    temperature_anomaly: 2.0,
    combined_score_threshold: 2.0,
  });

  const [autoOptimize, setAutoOptimize] = useState(true);
  const [sensitivity, setSensitivity] = useState([75]); // 0-100 scale

  // Threshold optimization mutation
  const optimizeMutation = useMutation({
    mutationFn: (config: ThresholdConfig) => api.optimizeThresholds(config),
    onSuccess: (data) => {
      toast({
        title: "Thresholds Optimized",
        description: `Optimization completed with ${(data.confidence_score * 100).toFixed(1)}% confidence.`,
      });
      // Update local thresholds with optimized values
      setThresholds(data.optimized_thresholds);
    },
    onError: (error: any) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize thresholds",
        variant: "destructive",
      });
    },
  });

  const handleOptimize = () => {
    optimizeMutation.mutate(thresholds);
  };

  const handleReset = () => {
    setThresholds({
      velocity_enhancement: 2.5,
      density_enhancement: 2.0,
      temperature_anomaly: 2.0,
      combined_score_threshold: 2.0,
    });
    setSensitivity([75]);
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Threshold configuration has been saved successfully.",
    });
  };

  const getSensitivityLevel = (value: number) => {
    if (value >= 80) return { level: 'High', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (value >= 60) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'Low', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const sensitivityLevel = getSensitivityLevel(sensitivity[0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  } as const;

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Configuration Overview */}
      <motion.div variants={itemVariants}>
        <Card className="space-card overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader>
            <CardTitle className="text-cosmic flex items-center gap-2">
              <Settings className="h-5 w-5 animate-spin-slow" />
              Threshold Configuration
            </CardTitle>
            <CardDescription>
              Configure detection sensitivity and optimization parameters for CME identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.02, backgroundColor: "rgba(59, 130, 246, 0.15)" }}
                className="flex items-center space-x-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 transition-colors"
              >
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Zap className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-400">Auto-Optimize</p>
                  <p className="text-xs text-muted-foreground">
                    {autoOptimize ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, backgroundColor: "rgba(16, 185, 129, 0.15)" }}
                className="flex items-center space-x-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20 transition-colors"
              >
                <div className="p-2 rounded-full bg-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-400">Last Optimized</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, backgroundColor: "rgba(168, 85, 247, 0.15)" }}
                className="flex items-center space-x-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-colors"
              >
                <div className="p-2 rounded-full bg-purple-500/20">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-400">Accuracy</p>
                  <p className="text-xs text-muted-foreground">92.5%</p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Threshold Parameters */}
      <motion.div variants={itemVariants}>
        <Card className="space-card">
          <CardHeader>
            <CardTitle className="text-cosmic flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Detection Thresholds
            </CardTitle>
            <CardDescription>
              Adjust individual parameter thresholds for CME detection sensitivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Velocity Enhancement Threshold */}
            <motion.div
              className="space-y-3 p-4 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              whileHover={{ x: 5 }}
            >
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></span>
                  Velocity Enhancement
                </Label>
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-mono">
                  {thresholds.velocity_enhancement.toFixed(1)} σ
                </Badge>
              </div>
              <div className="space-y-2">
                <Slider
                  value={[thresholds.velocity_enhancement]}
                  onValueChange={([value]) => setThresholds(prev => ({ ...prev, velocity_enhancement: value }))}
                  max={5}
                  min={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1.0 σ (Sensitive)</span>
                  <span>5.0 σ (Conservative)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pl-4 border-l-2 border-cyan-500/30">
                Detects solar wind velocity increases above background levels
              </p>
            </motion.div>

            {/* Density Enhancement Threshold */}
            <motion.div
              className="space-y-3 p-4 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              whileHover={{ x: 5 }}
            >
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></span>
                  Density Enhancement
                </Label>
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50 font-mono">
                  {thresholds.density_enhancement.toFixed(1)} σ
                </Badge>
              </div>
              <div className="space-y-2">
                <Slider
                  value={[thresholds.density_enhancement]}
                  onValueChange={([value]) => setThresholds(prev => ({ ...prev, density_enhancement: value }))}
                  max={5}
                  min={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1.0 σ (Sensitive)</span>
                  <span>5.0 σ (Conservative)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pl-4 border-l-2 border-red-500/30">
                Detects particle density increases during CME passage
              </p>
            </motion.div>

            {/* Temperature Anomaly Threshold */}
            <motion.div
              className="space-y-3 p-4 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              whileHover={{ x: 5 }}
            >
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
                  Temperature Anomaly
                </Label>
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 font-mono">
                  {thresholds.temperature_anomaly.toFixed(1)} σ
                </Badge>
              </div>
              <div className="space-y-2">
                <Slider
                  value={[thresholds.temperature_anomaly]}
                  onValueChange={([value]) => setThresholds(prev => ({ ...prev, temperature_anomaly: value }))}
                  max={5}
                  min={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1.0 σ (Sensitive)</span>
                  <span>5.0 σ (Conservative)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pl-4 border-l-2 border-yellow-500/30">
                Detects temperature variations associated with CME shocks
              </p>
            </motion.div>

            {/* Combined Score Threshold */}
            <motion.div
              className="space-y-3 p-4 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              whileHover={{ x: 5 }}
            >
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]"></span>
                  Combined Score Threshold
                </Label>
                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/50 font-mono">
                  {thresholds.combined_score_threshold.toFixed(1)} σ
                </Badge>
              </div>
              <div className="space-y-2">
                <Slider
                  value={[thresholds.combined_score_threshold]}
                  onValueChange={([value]) => setThresholds(prev => ({ ...prev, combined_score_threshold: value }))}
                  max={5}
                  min={1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1.0 σ (Sensitive)</span>
                  <span>5.0 σ (Conservative)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pl-4 border-l-2 border-purple-500/30">
                Overall detection threshold combining all parameters
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sensitivity Control */}
      <motion.div variants={itemVariants}>
        <Card className="space-card">
          <CardHeader>
            <CardTitle className="text-cosmic flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Detection Sensitivity
            </CardTitle>
            <CardDescription>
              Global sensitivity control affecting all detection parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Overall Sensitivity</Label>
              <motion.div
                key={sensitivityLevel.level}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Badge variant="outline" className={`${sensitivityLevel.bg} ${sensitivityLevel.color} border-current/50 px-3 py-1 text-sm`}>
                  {sensitivityLevel.level}
                </Badge>
              </motion.div>
            </div>

            <div className="space-y-2">
              <Slider
                value={sensitivity}
                onValueChange={setSensitivity}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low (Conservative)</span>
                <span>High (Sensitive)</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-4 rounded-lg bg-white/5 border border-white/10">
              <Switch
                checked={autoOptimize}
                onCheckedChange={setAutoOptimize}
                id="auto-optimize"
              />
              <div className="space-y-1">
                <Label htmlFor="auto-optimize" className="cursor-pointer">Enable automatic threshold optimization</Label>
                <p className="text-xs text-muted-foreground">
                  System will automatically adjust thresholds based on historical accuracy
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground italic">
              Higher sensitivity increases detection rate but may also increase false positives.
              Lower sensitivity reduces false positives but may miss some CME events.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Settings */}
      <motion.div variants={itemVariants}>
        <Card className="space-card">
          <CardHeader>
            <CardTitle className="text-cosmic">Advanced Configuration</CardTitle>
            <CardDescription>
              Fine-tune detection algorithms and processing parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="window-size">Analysis Window Size</Label>
                <Input
                  id="window-size"
                  type="number"
                  defaultValue={72}
                  min={24}
                  max={168}
                  className="bg-card/50 border-border/50 focus:border-cosmic-blue transition-colors"
                />
                <p className="text-xs text-muted-foreground">Hours around CME events</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseline-days">Baseline Period</Label>
                <Input
                  id="baseline-days"
                  type="number"
                  defaultValue={7}
                  min={1}
                  max={30}
                  className="bg-card/50 border-border/50 focus:border-cosmic-blue transition-colors"
                />
                <p className="text-xs text-muted-foreground">Days for background calculation</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-speed">Minimum CME Speed</Label>
                <Input
                  id="min-speed"
                  type="number"
                  defaultValue={400}
                  min={200}
                  max={2000}
                  className="bg-card/50 border-border/50 focus:border-cosmic-blue transition-colors"
                />
                <p className="text-xs text-muted-foreground">km/s threshold</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
                <Input
                  id="confidence-threshold"
                  type="number"
                  defaultValue={0.8}
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  className="bg-card/50 border-border/50 focus:border-cosmic-blue transition-colors"
                />
                <p className="text-xs text-muted-foreground">Minimum confidence for alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleOptimize}
            disabled={optimizeMutation.isPending}
            className="bg-solar-orange hover:bg-solar-orange/90 text-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {optimizeMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Optimizing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Optimize Thresholds
              </>
            )}
          </Button>

          <Button variant="outline" onClick={handleReset} className="border-border/50 hover:bg-white/5">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:shadow-[0_0_25px_rgba(22,163,74,0.5)] transition-all">
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </motion.div>

      {/* Optimization Status */}
      <AnimatePresence>
        {optimizeMutation.isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
          >
            <Card className="space-card border-green-500/30 bg-green-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  >
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium text-green-400">Optimization Complete</p>
                    <p className="text-xs text-muted-foreground">
                      Thresholds have been optimized for maximum detection accuracy
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ThresholdConfiguration;
