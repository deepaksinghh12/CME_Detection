/**
 * ParticleDataChart Component
 * 
 * This component visualizes real-time solar wind particle data from the SWIS instrument.
 * It provides interactive charts and data cards with "extreme" animations.
 * 
 * Features:
 * - Real-time data visualization for multiple parameters
 * - Interactive time range selection
 * - Dynamic trend indicators
 * - Animated data cards
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, ParticleData } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ParticleDataChart: React.FC = () => {
  const [selectedParameter, setSelectedParameter] = useState<string>('velocity');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [shouldFetch, setShouldFetch] = useState(false);

  // Only fetch data when component mounts (tab is actually visible)
  // This prevents unnecessary API calls when dashboard first loads
  useEffect(() => {
    // Small delay to ensure component is mounted before fetching
    const timer = setTimeout(() => {
      setShouldFetch(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch particle data from API - only when shouldFetch is true
  const { data: particleData, isLoading, error, refetch } = useQuery({
    queryKey: ['particle-data', timeRange],
    queryFn: async () => {
      return api.getParticleData(timeRange);
    },
    refetchInterval: false, // Disable auto-refetch - manual refresh only
    staleTime: 300000, // 5 minutes - consider data fresh for 5 minutes
    refetchOnMount: false, // Don't refetch if already loaded
    refetchOnWindowFocus: false, // Don't refetch on window focus
    enabled: shouldFetch, // Only fetch when component is ready
  });

  const parameters = [
    // Plasma Parameters
    { key: 'velocity', label: 'Solar Wind Velocity', unit: 'km/s', color: '#3b82f6' },
    { key: 'density', label: 'Particle Density', unit: 'cm⁻³', color: '#ef4444' },
    { key: 'temperature', label: 'Temperature', unit: 'K', color: '#10b981' },
    { key: 'flux', label: 'Particle Flux', unit: 'particles/(cm²·s)', color: '#f59e0b' },
    // Magnetic Field Parameters
    { key: 'bx', label: 'Bx (GSM)', unit: 'nT', color: '#8b5cf6' },
    { key: 'by', label: 'By (GSM)', unit: 'nT', color: '#a855f7' },
    { key: 'bz', label: 'Bz (GSM)', unit: 'nT', color: '#ec4899' },
    { key: 'bt', label: 'Total IMF (Bt)', unit: 'nT', color: '#f43f5e' },
    // Derived Parameters
    { key: 'plasma_beta', label: 'Plasma Beta', unit: 'dimensionless', color: '#06b6d4' },
    { key: 'alfven_mach', label: 'Alfven Mach', unit: 'dimensionless', color: '#14b8a6' },
    { key: 'magnetosonic_mach', label: 'Magnetosonic Mach', unit: 'dimensionless', color: '#22d3ee' },
    { key: 'electric_field', label: 'Electric Field', unit: 'mV/m', color: '#f59e0b' },
    { key: 'flow_pressure', label: 'Flow Pressure', unit: 'nPa', color: '#f97316' },
    // Geomagnetic Indices
    { key: 'dst', label: 'Dst Index', unit: 'nT', color: '#dc2626' },
    { key: 'kp', label: 'Kp Index', unit: '0-9', color: '#ea580c' },
    { key: 'ae', label: 'AE Index', unit: 'nT', color: '#0284c7' },
    { key: 'ap', label: 'Ap Index', unit: 'nT', color: '#c2410c' },
    { key: 'al', label: 'AL Index', unit: 'nT', color: '#991b1b' },
    { key: 'au', label: 'AU Index', unit: 'nT', color: '#1e40af' },
    // Additional Parameters
    { key: 'flow_longitude', label: 'Flow Longitude', unit: 'deg', color: '#7c3aed' },
    { key: 'flow_latitude', label: 'Flow Latitude', unit: 'deg', color: '#a855f7' },
    { key: 'alpha_proton_ratio', label: 'Alpha/Proton Ratio', unit: 'dimensionless', color: '#ec4899' },
    { key: 'proton_flux', label: 'Proton Flux (>10 MEV)', unit: 'particles/(cm²·s·ster)', color: '#f43f5e' },
    // CME Detection Parameters
    { key: 'cme_detection', label: 'CME Detection Flag', unit: '0/1', color: '#dc2626' },
    { key: 'cme_confidence', label: 'CME Confidence', unit: '0-1', color: '#ea580c' },
  ];

  const selectedParam = parameters.find(p => p.key === selectedParameter);

  const getCurrentValue = () => {
    if (!particleData) return null;
    const values = particleData[selectedParameter as keyof ParticleData] as number[] | undefined;
    if (!values || values.length === 0) return null;
    return values[values.length - 1];
  };

  const getTrend = () => {
    if (!particleData) return 'stable';
    const values = particleData[selectedParameter as keyof ParticleData] as number[] | undefined;
    if (!values || values.length < 2) return 'stable';

    const recent = values.slice(-10);
    const trend = recent[recent.length - 1] - recent[0];

    if (trend > 0) return 'increasing';
    if (trend < 0) return 'decreasing';
    return 'stable';
  };

  const formatValue = (value: number) => {
    if (selectedParameter === 'temperature') {
      return `${(value / 1000).toFixed(1)}k`;
    }
    if (selectedParameter === 'flux') {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toFixed(1);
  };

  const currentValue = getCurrentValue();
  const trend = getTrend();

  // Get chart data safely
  // Sample data to prevent lag with large datasets
  const sampleData = (data: number[], maxPoints: number = 200): number[] => {
    if (data.length <= maxPoints) return data;
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, i) => i % step === 0);
  };

  const sampleTimestamps = (timestamps: string[], maxPoints: number = 200): string[] => {
    if (timestamps.length <= maxPoints) return timestamps;
    const step = Math.ceil(timestamps.length / maxPoints);
    return timestamps.filter((_, i) => i % step === 0);
  };

  const getChartData = () => {
    if (!particleData) return null;
    
    // Map frontend parameter keys to backend response keys
    const paramKeyMap: Record<string, string> = {
      'velocity': 'velocity',
      'density': 'density',
      'temperature': 'temperature',
      'flux': 'flux',
      'bx': 'bx',
      'by': 'by',
      'bz': 'bz',
      'bt': 'bt',
      'plasma_beta': 'plasma_beta',
      'alfven_mach': 'alfven_mach',
      'magnetosonic_mach': 'magnetosonic_mach',
      'electric_field': 'electric_field',
      'flow_pressure': 'flow_pressure',
      'dst': 'dst',
      'kp': 'kp',
      'ae': 'ae',
      'ap': 'ap',
      'al': 'al',
      'au': 'au',
      'flow_longitude': 'flow_longitude',
      'flow_latitude': 'flow_latitude',
      'alpha_proton_ratio': 'alpha_proton_ratio',
      'proton_flux': 'proton_flux',  // Frontend uses 'proton_flux' for 10mev
    };
    
    const backendKey = paramKeyMap[selectedParameter] || selectedParameter;
    const dataValues = particleData[backendKey as keyof ParticleData] as number[] | undefined;
    
    if (!dataValues || dataValues.length === 0) {
      console.warn(`No data available for parameter: ${selectedParameter} (backend key: ${backendKey})`);
      return null;
    }
    
    // Filter out null/undefined but keep NaN for interpolation
    const filtered = dataValues.filter(v => v !== null && v !== undefined);
    if (filtered.length === 0) {
      console.warn(`All values are null/undefined for parameter: ${selectedParameter}`);
      return null;
    }
    
    // Sample to max 200 points to prevent lag
    return sampleData(dataValues, 200);
  };

  const chartData = getChartData();
  const chartTimestamps = particleData ? sampleTimestamps(particleData.timestamps, 200) : [];

  if (isLoading) {
    return (
      <Card className="space-card">
        <CardHeader>
          <CardTitle className="text-cosmic">Particle Data Analysis</CardTitle>
          <CardDescription>Real-time SWIS-ASPEX measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solar-orange"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load particle data';
    const isNoDataError = errorMessage.includes('No real data available') || 
                          errorMessage.includes('503') ||
                          errorMessage.includes('unavailable');
    
    return (
      <Card className="space-card">
        <CardHeader>
          <CardTitle className="text-cosmic">Particle Data Analysis</CardTitle>
          <CardDescription>Real-time SWIS-ASPEX measurements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-yellow-400">
            <div className="text-center max-w-md">
              <Activity className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">
                {isNoDataError ? 'No Real Data Available' : 'Failed to Load Data'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {isNoDataError 
                  ? 'OMNIWeb and NOAA data sources are currently unavailable. Please try a different time range or check back later.'
                  : errorMessage}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => refetch()} variant="outline" className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                {isNoDataError && (
                  <Button onClick={() => setTimeRange('7d')} variant="outline" className="mt-2">
                    Try 7 Days
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="space-card overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-cosmic">Particle Data Analysis</CardTitle>
              <CardDescription>Real-time SWIS-ASPEX measurements from Aditya-L1</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parameter Selection */}
          <div className="flex items-center space-x-4">
            <Select value={selectedParameter} onValueChange={setSelectedParameter}>
              <SelectTrigger className="w-48 bg-black/20 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parameters.map((param) => (
                  <SelectItem key={param.key} value={param.key}>
                    {param.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-black/20 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 min</SelectItem>
                <SelectItem value="5m">Last 5 min</SelectItem>
                <SelectItem value="10m">Last 10 min</SelectItem>
                <SelectItem value="30m">Last 30 min</SelectItem>
                <SelectItem value="1h">Last 1 hour</SelectItem>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="180d">Last 6 months</SelectItem>
                <SelectItem value="1y">Last 1 year</SelectItem>
                <SelectItem value="5y">Last 5 years (Historical)</SelectItem>
                <SelectItem value="10y">Last 10 years (Historical)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Value Display */}
          <AnimatePresence mode="wait">
            {currentValue && (
              <motion.div
                key={selectedParameter}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-4 border-l-4 border-l-cosmic-blue">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Current {selectedParam?.label}</p>
                      <p className="text-2xl font-bold text-white">
                        {formatValue(currentValue)}
                        <span className="text-sm text-gray-500 ml-1">{selectedParam?.unit}</span>
                      </p>
                    </div>
                    <div className={`p-2 rounded-full ${trend === 'increasing' ? 'bg-green-500/20' :
                      trend === 'decreasing' ? 'bg-red-500/20' : 'bg-blue-500/20'
                      }`}>
                      {trend === 'increasing' ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : trend === 'decreasing' ? (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-4 border-l-4 border-l-solar-orange">
                  <p className="text-sm text-gray-400">Data Points</p>
                  <p className="text-2xl font-bold text-white">
                    {particleData?.timestamps.length || 0}
                  </p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-4 border-l-4 border-l-green-500">
                  <p className="text-sm text-gray-400">Update Frequency</p>
                  <p className="text-2xl font-bold text-white">5 min</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chart Implementation - Enhanced Visual Design */}
          <div className="relative h-96 bg-gradient-to-br from-black/70 via-gray-900/50 to-black/70 rounded-xl border-2 border-cyan-500/30 p-6 shadow-2xl shadow-cyan-500/20 overflow-hidden backdrop-blur-sm">
            {/* Glow effect */}
            <div 
              className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-xl blur-xl opacity-50"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${selectedParam?.color || '#06b6d4'}20, transparent 70%)`,
              }}
            ></div>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.1) 2px, rgba(59, 130, 246, 0.1) 4px)`,
              }}></div>
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(59, 130, 246, 0.1) 2px, rgba(59, 130, 246, 0.1) 4px)`,
              }}></div>
            </div>
            
            {/* Chart Title Overlay */}
            <div className="absolute top-4 left-6 z-10">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedParam?.color || 'bg-cyan-400'} animate-pulse`}></div>
                <span className="text-sm font-semibold text-white/90">{selectedParam?.label}</span>
                <span className="text-xs text-gray-400">({selectedParam?.unit})</span>
              </div>
            </div>

            {/* Gradient Overlay for visual depth */}
            <div 
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: `linear-gradient(to bottom, ${selectedParam?.color || '#06b6d4'}08 0%, transparent 50%, ${selectedParam?.color || '#06b6d4'}03 100%)`,
              }}
            ></div>

            {!chartData ? (
              <div className="flex items-center justify-center h-full text-yellow-400 relative z-10">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                  <span className="text-sm">No data available for {selectedParam?.label}</span>
                </div>
              </div>
            ) : (
              <div className="relative z-10 h-full">
                <Line
                  data={{
                    labels: chartTimestamps.map(t => {
                      const date = new Date(t);
                      // Format based on time range
                      if (timeRange === '5y' || timeRange === '10y') {
                        // For very long ranges (5+ years): Show year and month
                        return date.toLocaleDateString([], { year: 'numeric', month: 'short' });
                      } else if (timeRange === '1y' || timeRange === '180d') {
                        // For 1 year or 6 months: Show month, day, and year
                        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
                      } else if (timeRange === '90d' || timeRange === '30d' || timeRange === '7d') {
                        // For months/weeks: Show month and day
                        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      } else if (timeRange === '1d' || timeRange === '1h') {
                        // For days/hours: Show date and time
                        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
                               date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      } else {
                        // For minutes: Show time only
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                    }),
                    datasets: [
                      {
                        label: selectedParam?.label,
                        data: chartData.map((val: number) => {
                          // Handle null, undefined, and fill values
                          if (val === null || val === undefined) {
                            return NaN;  // Chart.js will interpolate across NaN
                          }
                          if (isNaN(val) || Math.abs(val) > 9e4) {
                            return NaN;  // Invalid values become NaN for interpolation
                          }
                          return val;
                        }),
                        // Enhanced gradient fill with opacity
                        borderColor: selectedParam?.color || '#06b6d4',
                        backgroundColor: `${selectedParam?.color || '#06b6d4'}30`,
                        borderWidth: 2.5,
                        pointRadius: chartData && chartData.length > 100 ? 0 : 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: selectedParam?.color || '#06b6d4',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        // Smooth curve
                        cubicInterpolationMode: 'monotone',
                        // Shadow effect
                        shadowOffsetX: 0,
                        shadowOffsetY: 2,
                        shadowBlur: 8,
                        shadowColor: `${selectedParam?.color || '#06b6d4'}60`,
                        spanGaps: true,  // Connect across gaps for continuous lines
                        // Interpolate missing values for smoother visualization
                        elements: {
                          point: {
                            radius: 0,  // Hide points for cleaner look
                            hoverRadius: 4
                          },
                          line: {
                            tension: 0.4,  // Smooth curves
                            borderJoinStyle: 'round'  // Smooth line joins
                          }
                        }
                      },
                      // Add a subtle background trend line (moving average)
                      ...(chartData.length > 10 ? [{
                        label: 'Trend',
                        data: chartData.map((val: number, idx: number) => {
                          const window = Math.max(3, Math.min(7, Math.floor(chartData.length / 15)));
                          const start = Math.max(0, idx - window);
                          const end = Math.min(chartData.length, idx + window + 1);
                          // Filter out NaN, null, undefined, and fill values
                          const slice = (chartData.slice(start, end) as number[]).filter(v => 
                            typeof v === 'number' && 
                            !isNaN(v) && 
                            v !== null && 
                            v !== undefined &&
                            Math.abs(v) < 9e4  // Filter extreme fill values
                          );
                          if (slice.length === 0) return val;
                          return slice.reduce((a, b) => a + b, 0) / slice.length;
                        }),
                        borderColor: `${selectedParam?.color || '#06b6d4'}25`,
                        borderWidth: 1.5,
                        borderDash: [8, 4],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        tension: 0.4,
                        order: 0, // Render behind main line
                      }] : []),
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: 800,
                      easing: 'easeInOutQuart' as any,
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        titleColor: selectedParam?.color || '#06b6d4',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyColor: '#e5e7eb',
                        bodyFont: { size: 13 },
                        borderColor: selectedParam?.color || '#06b6d4',
                        borderWidth: 2,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                          title: (context) => {
                            const date = new Date(chartTimestamps[context[0].dataIndex]);
                            return date.toLocaleString();
                          },
                          label: (context) => {
                            const value = context.parsed.y;
                            const formatted = typeof value === 'number' 
                              ? value.toLocaleString('en-US', { 
                                  maximumFractionDigits: 2,
                                  minimumFractionDigits: 2 
                                })
                              : value;
                            return `${selectedParam?.label}: ${formatted} ${selectedParam?.unit}`;
                          },
                          labelColor: () => ({
                            borderColor: selectedParam?.color || '#06b6d4',
                            backgroundColor: selectedParam?.color || '#06b6d4',
                          }),
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          display: true,
                          color: 'rgba(59, 130, 246, 0.1)',
                          lineWidth: 1,
                          drawBorder: true,
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                        },
                        ticks: {
                          color: '#9ca3af',
                          // Significantly increase tick limits for better visibility
                          maxTicksLimit: timeRange === '10y' ? 25 :  // 10 years: ~2.5 ticks per year
                                        timeRange === '5y' ? 20 :    // 5 years: ~4 ticks per year
                                        timeRange === '1y' ? 15 :    // 1 year: ~1.25 ticks per month
                                        timeRange === '180d' ? 15 :  // 6 months: ~2.5 ticks per month
                                        timeRange === '90d' ? 12 :   // 3 months: ~4 ticks per month
                                        timeRange === '30d' ? 12 :   // 30 days: ~1 tick per 2.5 days
                                        timeRange === '7d' ? 10 :    // 7 days: ~1.4 ticks per day
                                        timeRange === '1d' ? 12 :    // 1 day: ~1 tick per 2 hours
                                        timeRange === '1h' ? 12 :    // 1 hour: ~1 tick per 5 min
                                        timeRange === '30m' ? 10 :   // 30 min: ~1 tick per 3 min
                                        timeRange === '10m' ? 8 :    // 10 min: ~1 tick per 1-2 min
                                        timeRange === '5m' ? 6 :     // 5 min: ~1 tick per min
                                        timeRange === '3m' ? 4 :     // 3 min: ~1 tick per min
                                        10,  // Default
                          font: { size: 10, weight: '500' },  // Slightly smaller font to fit more
                          padding: 5,
                          autoSkip: true,  // Allow auto-skip but with higher limit
                          maxRotation: timeRange === '5y' || timeRange === '10y' || timeRange === '1y' ? 45 : 0,  // Rotate for long labels
                          minRotation: 0,
                        },
                        title: {
                          display: true,
                          text: 'Time',
                          color: '#9ca3af',
                          font: { size: 12, weight: '600' },
                        },
                      },
                      y: {
                        grid: {
                          display: true,
                          color: 'rgba(59, 130, 246, 0.1)',
                          lineWidth: 1,
                          drawBorder: true,
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                        },
                        ticks: {
                          color: '#9ca3af',
                          font: { size: 11, weight: '500' },
                          padding: 8,
                          callback: (value) => {
                            if (typeof value === 'number') {
                              if (Math.abs(value) >= 1000) {
                                return (value / 1000).toFixed(1) + 'k';
                              }
                              return value.toFixed(1);
                            }
                            return value;
                          },
                        },
                        title: {
                          display: true,
                          text: `${selectedParam?.label} (${selectedParam?.unit})`,
                          color: selectedParam?.color || '#06b6d4',
                          font: { size: 12, weight: '600' },
                        },
                      },
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false,
                    },
                    elements: {
                      point: {
                        hoverRadius: 8,
                        hoverBorderWidth: 3,
                      },
                    },
                  }}
                />
              </div>
            )}
            
            {/* Stats Overlay */}
            {chartData && chartData.length > 0 && (
              <div className="absolute bottom-4 right-6 z-10 flex gap-3 text-xs">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="text-gray-400">Max: </span>
                  <span className="text-cyan-400 font-semibold">
                    {Math.max(...(chartData as number[])).toLocaleString('en-US', { maximumFractionDigits: 1 })}
                  </span>
                </div>
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="text-gray-400">Min: </span>
                  <span className="text-orange-400 font-semibold">
                    {Math.min(...(chartData as number[])).toLocaleString('en-US', { maximumFractionDigits: 1 })}
                  </span>
                </div>
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="text-gray-400">Avg: </span>
                  <span className="text-white font-semibold">
                    {(chartData as number[]).reduce((a, b) => a + b, 0) / chartData.length | 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Data Quality Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              // Calculate dynamic values
              const dataSource = particleData?.data_source || 'Unknown';
              const dataQuality = dataSource.includes('OMNIWeb') || dataSource.includes('NOAA') ? 'Excellent' : 'Unknown';
              
              // Calculate coverage from actual data
              const getCoverage = () => {
                if (!particleData) return 'N/A';
                const velocity = particleData.velocity || [];
                const density = particleData.density || [];
                const total = Math.max(velocity.length, density.length);
                if (total === 0) return 'N/A';
                const valid = velocity.filter(v => v !== null && v !== undefined && !isNaN(v)).length;
                const coverage = (valid / total * 100).toFixed(1);
                return `${coverage}%`;
              };
              
              // Calculate last update time
              const getLastUpdate = () => {
                if (!particleData || !particleData.timestamps || particleData.timestamps.length === 0) return 'Unknown';
                const lastTimestamp = particleData.timestamps[particleData.timestamps.length - 1];
                try {
                  const lastDate = new Date(lastTimestamp);
                  const now = new Date();
                  const diffMinutes = Math.floor((now.getTime() - lastDate.getTime()) / 60000);
                  if (diffMinutes < 1) return 'Just now';
                  if (diffMinutes < 60) return `${diffMinutes} min ago`;
                  const diffHours = Math.floor(diffMinutes / 60);
                  if (diffHours < 24) return `${diffHours} hr ago`;
                  return `${Math.floor(diffHours / 24)} days ago`;
                } catch {
                  return 'Unknown';
                }
              };
              
              const swisStatus = dataSource.includes('OMNIWeb') || dataSource.includes('NOAA') ? 'Online' : 'Unknown';
              
              return [
                { label: `Data Quality: ${dataQuality}`, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
                { label: `Coverage: ${getCoverage()}`, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                { label: `Last Update: ${getLastUpdate()}`, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                { label: `SWIS Status: ${swisStatus}`, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" }
              ];
            })().map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className={`flex items-center space-x-2 p-3 rounded-lg ${item.bg} border ${item.border}`}
              >
                <div className={`w-2 h-2 ${item.color.replace('text', 'bg')} rounded-full animate-pulse`}></div>
                <span className={`text-sm ${item.color}`}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ParticleDataChart;
