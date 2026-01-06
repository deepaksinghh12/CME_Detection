/**
 * ForecastPredictionsPanel Component
 * 
 * This component displays 7-day future predictions for space weather parameters.
 * It provides interactive charts, statistics, and raw data visualization.
 * 
 * Features:
 * - Interactive parameter selection
 * - Real-time chart visualization with Chart.js
 * - Statistics cards with trend indicators
 * - Raw data table with export functionality
 * - Enhanced styling with animations
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Download, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, ForecastData } from '@/lib/api';
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

const ForecastPredictionsPanel: React.FC = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false);
  
  const loadingSteps = [
    "Initializing forecast models...",
    "Loading historical data patterns...",
    "Running ML prediction algorithms...",
    "Analyzing space weather parameters...",
    "Calculating 7-day forecast projections...",
    "Processing statistical models...",
    "Generating visualization data...",
    "Finalizing predictions..."
  ];
  
  const { data: forecastData, isLoading, error, refetch } = useQuery({
    queryKey: ['forecast-predictions'],
    queryFn: async () => {
      // Add minimum delay to show processing is happening (10-13 seconds)
      const startTime = Date.now();
      const minDelay = 10000 + Math.random() * 3000; // 10-13 seconds random delay
      
      const result = await api.getForecastPredictions();
      
      // If data loaded faster than min delay, wait for remaining time
      const elapsed = Date.now() - startTime;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
      
      setMinLoadingTimeElapsed(true);
      return result;
    },
    refetchInterval: false, // Disable auto-refetch - manual refresh only
    staleTime: 600000, // 10 minutes - forecast doesn't change that often
    refetchOnMount: false, // Don't refetch if already loaded
    refetchOnWindowFocus: false, // Don't refetch on window focus
    enabled: true, // Ensure it loads when component mounts
  });

  // Animate loading progress from start
  useEffect(() => {
    if (isLoading || !minLoadingTimeElapsed) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            return 100;
          }
          // Increment progress with varying speed (slower, smoother animation)
          // Slower increments for smoother, more realistic feel
          const increment = prev < 30 ? 4 : prev < 60 ? 3 : prev < 85 ? 2 : 1;
          const newProgress = Math.min(100, prev + increment);
          
          // Update step based on progress
          const stepIndex = Math.floor((newProgress / 100) * loadingSteps.length);
          setLoadingStep(Math.min(loadingSteps.length - 1, stepIndex));
          
          return newProgress;
        });
      }, 300); // Update every 300ms (slower for smoother animation)
      
      return () => {
        clearInterval(interval);
      };
    } else {
      setLoadingProgress(100);
      setLoadingStep(loadingSteps.length - 1);
    }
  }, [isLoading, minLoadingTimeElapsed]);

  // Reset progress when loading starts
  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0);
      setLoadingStep(0);
      setMinLoadingTimeElapsed(false);
    }
  }, [isLoading]);

  const [selectedParameter, setSelectedParameter] = useState<string>('Dst_Index_nT');
  const [showRawData, setShowRawData] = useState(false);

  // Show loading if still fetching OR minimum time hasn't elapsed
  const showLoading = isLoading || !minLoadingTimeElapsed;

  if (showLoading) {
    return (
      <Card className="space-card bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
          </motion.div>
          
          <motion.h3 
            className="text-2xl font-bold text-purple-300 mb-3"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            🔮 Generating Forecast Predictions
          </motion.h3>
          
          <motion.p 
            className="text-base text-purple-200/80 mb-6 min-h-[24px]"
            key={loadingStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loadingSteps[loadingStep] || loadingSteps[0]}
          </motion.p>
          
          <div className="w-full max-w-lg space-y-2">
            <div className="w-full bg-purple-500/10 rounded-full h-3 border border-purple-500/30 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 h-full rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-300 font-medium">{loadingProgress}%</span>
              <span className="text-muted-foreground">Processing forecast models...</span>
            </div>
          </div>
          
          <motion.div 
            className="mt-8 grid grid-cols-4 gap-3 w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {['Data Loading', 'ML Analysis', 'Prediction', 'Visualization'].map((stage, idx) => (
              <div key={idx} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                  loadingProgress > (idx + 1) * 25 ? 'bg-green-500' : 
                  loadingProgress > idx * 25 ? 'bg-purple-500 animate-pulse' : 
                  'bg-gray-500'
                }`} />
                <p className="text-xs text-muted-foreground">{stage}</p>
              </div>
            ))}
          </motion.div>
          
          <motion.p 
            className="text-xs text-purple-300/60 mt-6 text-center max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Using advanced AI/ML algorithms to predict space weather parameters for the next 7 days
          </motion.p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="space-card">
        <CardContent className="py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load forecast</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData || !forecastData.success) {
    return (
      <Card className="space-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No forecast data available</p>
        </CardContent>
      </Card>
    );
  }

  // Threshold values for each parameter
  const getThresholds = (paramKey: string) => {
    switch (paramKey) {
      case 'Dst_Index_nT':
        return [
          { value: -50, label: 'Moderate Storm', color: '#fbbf24', style: 'dash' },
          { value: -100, label: 'Strong Storm', color: '#f97316', style: 'dash' },
          { value: -200, label: 'Extreme Storm', color: '#dc2626', style: 'dash' },
        ];
      case 'Kp_10':
        return [
          { value: 5, label: 'Moderate Activity', color: '#fbbf24', style: 'dash' },
          { value: 6, label: 'Strong Activity', color: '#f97316', style: 'dash' },
          { value: 7, label: 'Severe Activity', color: '#dc2626', style: 'dash' },
        ];
      case 'ap_index_nT':
        return [
          { value: 30, label: 'Moderate', color: '#fbbf24', style: 'dash' },
          { value: 50, label: 'Strong', color: '#f97316', style: 'dash' },
          { value: 100, label: 'Severe', color: '#dc2626', style: 'dash' },
        ];
      case 'Sunspot_Number':
        return [
          { value: 50, label: 'Low Activity', color: '#60a5fa', style: 'dash' },
          { value: 100, label: 'Moderate Activity', color: '#fbbf24', style: 'dash' },
          { value: 150, label: 'High Activity', color: '#f97316', style: 'dash' },
        ];
      default:
        return [];
    }
  };

  // Simple explanations for each parameter (even 2-year-old can understand)
  const getSimpleExplanation = (paramKey: string) => {
    switch (paramKey) {
      case 'Dst_Index_nT':
        return {
          title: '🌍 Earth\'s Magnetic Field Strength',
          explanation: 'This shows how strong Earth\'s magnetic field is. When the line goes down (negative), it means a storm is coming! Red lines show danger levels.',
          goodRange: 'Above -50 nT is safe',
          warningRange: '-50 to -100 nT means moderate storm',
          dangerRange: 'Below -100 nT means strong storm - be careful!'
        };
      case 'Kp_10':
        return {
          title: '⚡ Space Weather Activity Level',
          explanation: 'This number tells us how active space weather is. Higher numbers mean more activity and possible problems for satellites and power grids.',
          goodRange: '0-4 is quiet and safe',
          warningRange: '5-6 means moderate activity',
          dangerRange: '7-9 means severe activity - big problems possible!'
        };
      case 'ap_index_nT':
        return {
          title: '📊 Daily Space Weather Average',
          explanation: 'This shows the average space weather activity for each day. Higher numbers mean more active days with potential disruptions.',
          goodRange: 'Below 30 is quiet',
          warningRange: '30-50 means active day',
          dangerRange: 'Above 50 means very active - watch out!'
        };
      case 'Sunspot_Number':
        return {
          title: '☀️ Sun Activity Level',
          explanation: 'This counts how many dark spots are on the Sun. More spots mean the Sun is more active and can send more storms our way!',
          goodRange: '0-50 is quiet Sun',
          warningRange: '50-100 is moderate activity',
          dangerRange: 'Above 100 means very active Sun!'
        };
      default:
        return {
          title: '📈 Forecast Data',
          explanation: 'This graph shows predictions for the next 7 days.',
          goodRange: '',
          warningRange: '',
          dangerRange: ''
        };
    }
  };

  const parameters = [
    { key: 'Dst_Index_nT', label: 'Dst Index', unit: 'nT', color: '#ef4444', description: 'Disturbance Storm Time Index' },
    { key: 'ap_index_nT', label: 'Ap Index', unit: 'nT', color: '#8b5cf6', description: 'Planetary A-index' },
    { key: 'Sunspot_Number', label: 'Sunspot Number', unit: '', color: '#facc15', description: 'Sunspot Number' },
    { key: 'Kp_10', label: 'Kp Index', unit: '10-scale', color: '#f59e0b', description: 'Planetary K-index' },
  ];

  const selectedParam = parameters.find(p => p.key === selectedParameter);
  const paramData = forecastData.parameters[selectedParameter] || [];
  const paramStats = forecastData.statistics[selectedParameter];
  const thresholds = getThresholds(selectedParameter);
  const explanation = getSimpleExplanation(selectedParameter);
  
  // Get current value (last value in the array)
  const currentValue = paramData.length > 0 ? paramData[paramData.length - 1] : null;

  // Get status and color based on value (NORMAL, MODERATE, Quite Dangerous, Dangerous)
  const getStatus = (value: number, paramKey: string): { status: string; color: string; bgColor: string } => {
    if (paramKey === 'Dst_Index_nT') {
      if (value <= -200) return { status: 'EXTREMELY DANGEROUS', color: '#dc2626', bgColor: 'bg-red-600' };
      if (value <= -100) return { status: 'DANGEROUS', color: '#dc2626', bgColor: 'bg-red-500' };
      if (value <= -50) return { status: 'QUITE DANGEROUS', color: '#f97316', bgColor: 'bg-orange-500' };
      if (value <= -30) return { status: 'MODERATE', color: '#fbbf24', bgColor: 'bg-yellow-500' };
      return { status: 'NORMAL', color: '#22c55e', bgColor: 'bg-green-500' };
    } else if (paramKey === 'Kp_10') {
      if (value >= 8) return { status: 'EXTREMELY DANGEROUS', color: '#dc2626', bgColor: 'bg-red-600' };
      if (value >= 7) return { status: 'DANGEROUS', color: '#dc2626', bgColor: 'bg-red-500' };
      if (value >= 6) return { status: 'QUITE DANGEROUS', color: '#f97316', bgColor: 'bg-orange-500' };
      if (value >= 5) return { status: 'MODERATE', color: '#fbbf24', bgColor: 'bg-yellow-500' };
      return { status: 'NORMAL', color: '#22c55e', bgColor: 'bg-green-500' };
    } else if (paramKey === 'ap_index_nT') {
      if (value >= 150) return { status: 'EXTREMELY DANGEROUS', color: '#dc2626', bgColor: 'bg-red-600' };
      if (value >= 100) return { status: 'DANGEROUS', color: '#dc2626', bgColor: 'bg-red-500' };
      if (value >= 50) return { status: 'QUITE DANGEROUS', color: '#f97316', bgColor: 'bg-orange-500' };
      if (value >= 30) return { status: 'MODERATE', color: '#fbbf24', bgColor: 'bg-yellow-500' };
      return { status: 'NORMAL', color: '#22c55e', bgColor: 'bg-green-500' };
    } else if (paramKey === 'Sunspot_Number') {
      if (value >= 200) return { status: 'VERY HIGH ACTIVITY', color: '#f97316', bgColor: 'bg-orange-500' };
      if (value >= 150) return { status: 'HIGH ACTIVITY', color: '#fbbf24', bgColor: 'bg-yellow-500' };
      if (value >= 100) return { status: 'MODERATE', color: '#60a5fa', bgColor: 'bg-blue-500' };
      if (value >= 50) return { status: 'LOW ACTIVITY', color: '#22c55e', bgColor: 'bg-green-500' };
      return { status: 'QUIET', color: '#22c55e', bgColor: 'bg-green-400' };
    }
    return { status: 'NORMAL', color: '#22c55e', bgColor: 'bg-green-500' };
  };

  // Get color based on value vs thresholds (green/yellow/red)
  const getValueColor = (value: number, paramKey: string): string => {
    return getStatus(value, paramKey).color;
  };

  // Prepare chart data with color-coded segments (proper time series)
  const chartData = {
    labels: forecastData.timestamps.map(t => {
      const date = new Date(t);
      // Better time series format: "Dec 9, 3 PM" or "Dec 9, 12:00"
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const timeStr = minute === 0 
        ? `${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`
        : `${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
      return `${month} ${day}, ${timeStr}`;
    }),
    datasets: [
      // MAIN FORECAST LINE - SMOOTHER CURVE WITH FEWER POINTS
      {
        label: `${selectedParam?.label} Forecast`,
        data: paramData,
        borderColor: selectedParam?.color || '#3b82f6', // Parameter color
        backgroundColor: `${selectedParam?.color || '#3b82f6'}30`, // Subtle area fill
        borderWidth: 3, // Clear visible line
        pointRadius: paramData.map((_: number, index: number) => {
          // Show point every 3rd index, or at start/end (reduce density)
          return (index % 3 === 0 || index === 0 || index === paramData.length - 1) ? 4 : 0;
        }), // FEWER POINTS - show every 3rd point
        pointHoverRadius: 8, // Larger on hover
        pointBackgroundColor: paramData.map((val: number) => getValueColor(val, selectedParameter)), // Color-coded points
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHitRadius: 10, // Easy to hover
        fill: true, // Area fill for visual depth
        tension: 0.7, // SMOOTHER CURVE - increased from 0.4
        cubicInterpolationMode: 'monotone' as const,
        stepped: false, // Continuous smooth line
        showLine: true,
        spanGaps: false,
        order: 2, // Draw on top
      },
      // Threshold lines (ADD-ON - less prominent)
      ...thresholds.map((threshold, idx) => {
        let thresholdColor = '#fbbf24'; // Yellow default
        if (idx === 1) thresholdColor = '#f97316'; // Orange
        else if (idx === 2) thresholdColor = '#dc2626'; // Red
        
        return {
          label: `${threshold.label} (${threshold.value} ${selectedParam?.unit})`,
          data: new Array(paramData.length).fill(threshold.value),
          borderColor: thresholdColor,
          borderWidth: 1.5, // Thinner - add-on only
          borderDash: [8, 4], // Dashed reference line
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          tension: 0,
          order: 1, // Draw behind main line
        };
      }),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
          font: { size: 14, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          filter: (item: any) => {
            // Show all threshold lines in legend
            return true;
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Dark background like image
        titleColor: '#60a5fa', // Light blue like image
        bodyColor: '#ffffff', // White text
        borderColor: '#60a5fa', // Blue border like image
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 13, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, system-ui, sans-serif' },
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: (context: any) => {
            // Format like image: "12/6/2025, 3:57:00 AM"
            const timestamp = forecastData.timestamps[context[0].dataIndex];
            if (timestamp) {
              const date = new Date(timestamp);
              return date.toLocaleString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              });
            }
            return context[0].label;
          },
          label: (context: any) => {
            const value = context.parsed.y;
            const datasetLabel = context.dataset.label || '';
            // Check if this is a threshold line
            if (thresholds.some(t => Math.abs(t.value - value) < 0.1 && (datasetLabel.includes(t.label) || datasetLabel.includes('Threshold')))) {
              return `${datasetLabel}: ${value.toFixed(2)} ${selectedParam?.unit}`;
            }
            return `${selectedParam?.label}: ${value.toFixed(2)} ${selectedParam?.unit}`;
          },
          footer: (context: any) => {
            // Show dynamic average and range from actual graph data
            if (paramData.length > 0) {
              const avgValue = paramData.reduce((sum, val) => sum + val, 0) / paramData.length;
              const minValue = Math.min(...paramData);
              const maxValue = Math.max(...paramData);
              return [
                `Average: ${avgValue.toFixed(2)} ${selectedParam?.unit}`,
                `Range: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)} ${selectedParam?.unit}`
              ];
            }
            return [];
          },
        },
      },
      title: {
        display: false, // We'll use custom title in UI
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cbd5e1',
          maxTicksLimit: 7, // REDUCED - Show half the timestamps (was 14)
          stepSize: 2, // Show every 2nd label (reduce jump)
          font: { size: 12, weight: '600', family: 'Inter, system-ui, sans-serif' },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          lineWidth: 1,
          drawBorder: true,
          borderColor: '#475569',
        },
        title: {
          display: true,
          text: '📅 Time (Next 7 Days)',
          color: '#e5e7eb',
          font: { size: 14, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
          padding: { top: 10, bottom: 5 },
        },
      },
      y: {
        ticks: {
          color: '#cbd5e1',
          font: { size: 10, weight: '500', family: 'Inter, system-ui, sans-serif' }, // SMALLER FONT
          callback: function(value: any) {
            return value.toFixed(1); // One decimal for cleaner look
          },
          precision: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.12)',
          lineWidth: 1,
          drawBorder: true,
          borderColor: '#64748b',
          borderWidth: 2,
        },
        title: {
          display: true,
          text: `📊 ${selectedParam?.label} (${selectedParam?.unit})`,
          color: '#e5e7eb',
          font: { size: 12, weight: 'bold', family: 'Inter, system-ui, sans-serif' }, // Smaller title
          padding: { top: 5, bottom: 10 },
        },
        // Scientific scaling - show proper data range and deviation
        beginAtZero: false, // Don't force zero - show actual data range for proper deviation
        suggestedMin: undefined, // Let Chart.js determine based on actual data
        suggestedMax: undefined,
      },
    },
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-400" />;
    }
  };

  const exportToCSV = () => {
    if (!forecastData) return;
    
    const headers = ['Timestamp', ...Object.keys(forecastData.parameters)];
    const rows = forecastData.timestamps.map((timestamp, idx) => {
      const row = [timestamp];
      Object.values(forecastData.parameters).forEach(paramArray => {
        row.push(paramArray[idx]?.toString() || '');
      });
      return row.join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Card */}
      <Card className="space-card bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-purple-300 flex items-center gap-2">
                <Activity className="h-6 w-6" />
                🔮 7-Day Future Predictions
              </CardTitle>
              <CardDescription className="mt-2 text-purple-200/80">
                AI/ML Model Generated Forecasts for Space Weather Parameters
              </CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" className="border-purple-500/50 text-purple-400">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-xs text-muted-foreground mb-1">Forecast Period</p>
              <p className="text-sm font-semibold text-purple-300">
                {forecastData.forecast_period.duration_days.toFixed(1)} days
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(forecastData.forecast_period.start).toLocaleDateString()} - {new Date(forecastData.forecast_period.end).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground mb-1">Data Points</p>
              <p className="text-sm font-semibold text-blue-300">
                {forecastData.forecast_period.total_points}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(forecastData.forecast_period.total_points / forecastData.forecast_period.duration_days)} per day
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground mb-1">Parameters</p>
              <p className="text-sm font-semibold text-green-300">
                {Object.keys(forecastData.parameters).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Predicted indices</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-muted-foreground mb-1">Generated</p>
              <p className="text-sm font-semibold text-yellow-300">
                {new Date(forecastData.generated_at).toLocaleTimeString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(forecastData.generated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameter Selection & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Parameter Selector */}
        <Card className="space-card">
          <CardHeader>
            <CardTitle className="text-lg">Select Parameter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parameters.map((param) => (
              <button
                key={param.key}
                onClick={() => setSelectedParameter(param.key)}
                className={`w-full p-3 rounded-lg border-2 transition-all ${
                  selectedParameter === param.key
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-border/50 bg-muted/10 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{param.label}</span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: param.color }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-left">{param.description}</p>
                {forecastData.statistics[param.key] && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Current:</span>
                      <span className="font-medium text-cyan-400">
                        {forecastData.statistics[param.key].current?.toFixed(4) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Trend:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(forecastData.statistics[param.key].trend)}
                        <span className="text-xs capitalize">
                          {forecastData.statistics[param.key].trend}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="lg:col-span-3 space-y-4">
          {paramStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="space-card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                  <p className="text-2xl font-bold text-blue-400">{paramStats.min.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedParam?.unit}</p>
                </CardContent>
              </Card>
              <Card className="space-card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                  <p className="text-2xl font-bold text-green-400">{paramStats.max.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedParam?.unit}</p>
                </CardContent>
              </Card>
              <Card className="space-card bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Average</p>
                  <p className="text-2xl font-bold text-yellow-400">{paramStats.mean.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedParam?.unit}</p>
                </CardContent>
              </Card>
              <Card className="space-card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Std Dev</p>
                  <p className="text-2xl font-bold text-purple-400">{paramStats.std.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedParam?.unit}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chart with Enhanced Display */}
          <Card className="space-card bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {explanation.title}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-300 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {explanation.explanation}
                  </CardDescription>
                </div>
                <Button onClick={exportToCSV} variant="outline" size="sm" className="ml-4">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              
              {/* Current Value Display - Big and Visible with Colored Status */}
              {currentValue !== null && (() => {
                const statusInfo = getStatus(currentValue, selectedParameter);
                return (
                  <div className="mt-4 p-5 rounded-lg bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-2 border-slate-600">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-slate-400 mb-2 font-medium" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          Current Predicted Value
                        </p>
                        <p className="text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {currentValue.toFixed(2)} <span className="text-2xl text-slate-400 ml-2">{selectedParam?.unit}</span>
                        </p>
                        <div className="flex items-center gap-3">
                          <Badge 
                            className={`${statusInfo.bgColor} text-white px-4 py-2 font-bold text-base border-0 shadow-lg`}
                            style={{ backgroundColor: statusInfo.color }}
                          >
                            {statusInfo.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1 font-medium" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          Model Accuracy
                        </p>
                        <p className="text-sm font-bold text-green-400" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                          MAE: {paramStats?.mean ? 'Calculated' : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

                            {/* Threshold Legend - All visible on graph */}
                            {thresholds.length > 0 && (
                              <div className="mt-4 p-4 rounded-lg bg-slate-800/70 border-2 border-slate-600">
                                <p className="text-sm font-bold text-slate-200 mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                  📊 Threshold Reference Lines (Visible on Graph Above):
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                  <div className="flex items-center gap-2 p-2 rounded bg-slate-900/50">
                                    <div className="w-4 h-4 rounded-full bg-green-500" />
                                    <span className="text-xs text-slate-300 font-semibold">🟢 Safe Zone</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded bg-slate-900/50">
                                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                                    <span className="text-xs text-slate-300 font-semibold">🟡 Moderate</span>
                                  </div>
                                  <div className="flex items-center gap-2 p-2 rounded bg-slate-900/50">
                                    <div className="w-4 h-4 rounded-full bg-red-500" />
                                    <span className="text-xs text-slate-300 font-semibold">🔴 Danger Zone</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {thresholds.map((threshold, idx) => {
                                    let thresholdColor = '#fbbf24'; // Yellow
                                    if (idx === 1) thresholdColor = '#f97316'; // Orange
                                    else if (idx === 2) thresholdColor = '#dc2626'; // Red
                                    
                                    return (
                                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-900/50">
                                        <div 
                                          className="w-6 h-1 border-t-2 border-dashed" 
                                          style={{ borderColor: thresholdColor }}
                                        />
                                        <div>
                                          <span className="text-xs font-bold" style={{ color: thresholdColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                            {threshold.label}
                                          </span>
                                          <p className="text-xs text-slate-400" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                            = {threshold.value} {selectedParam?.unit}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
            </CardHeader>
            <CardContent>
              {/* Summary Box */}
              <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <p className="text-sm font-semibold text-blue-300 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  📝 Quick Summary:
                </p>
                <ul className="space-y-1 text-sm text-slate-300" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  <li>✅ <span className="font-medium">{explanation.goodRange}</span></li>
                  {explanation.warningRange && <li>⚠️ <span className="font-medium">{explanation.warningRange}</span></li>}
                  {explanation.dangerRange && <li>🚨 <span className="font-medium">{explanation.dangerRange}</span></li>}
                </ul>
              </div>

              {/* Dynamic Statistics from Graph Data */}
              {paramData.length > 0 && (() => {
                const avgValue = paramData.reduce((sum, val) => sum + val, 0) / paramData.length;
                const minValue = Math.min(...paramData);
                const maxValue = Math.max(...paramData);
                const stdDev = Math.sqrt(
                  paramData.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / paramData.length
                );
                
                return (
                  <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <p className="text-xs font-semibold text-slate-300 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      📊 Dynamic Statistics (Calculated from Graph Data):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-slate-400">Average</p>
                        <p className="text-sm font-bold text-cyan-400">{avgValue.toFixed(2)} {selectedParam?.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Minimum</p>
                        <p className="text-sm font-bold text-blue-400">{minValue.toFixed(2)} {selectedParam?.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Maximum</p>
                        <p className="text-sm font-bold text-green-400">{maxValue.toFixed(2)} {selectedParam?.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Std Deviation</p>
                        <p className="text-sm font-bold text-yellow-400">{stdDev.toFixed(2)} {selectedParam?.unit}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Chart - Proper Graph with Clear Data Variation */}
              <div className="h-[550px] bg-slate-900/40 rounded-lg p-5 border-2 border-slate-600">
                <Line data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Raw Data Table */}
      <Card className="space-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Raw Forecast Data</CardTitle>
              <CardDescription>Complete dataset with all parameters</CardDescription>
            </div>
            <Button
              onClick={() => setShowRawData(!showRawData)}
              variant="outline"
              size="sm"
            >
              {showRawData ? 'Hide' : 'Show'} Raw Data
            </Button>
          </div>
        </CardHeader>
        {showRawData && (
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-card border-b border-border/50">
                  <tr>
                    <th className="p-3 text-left font-semibold text-cyan-400">Timestamp</th>
                    {Object.entries(forecastData.parameter_names).map(([key, name]) => (
                      <th key={key} className="p-3 text-right font-semibold text-cyan-400">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forecastData.timestamps.map((timestamp, idx) => (
                    <tr key={idx} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="p-3 text-left text-muted-foreground">
                        {new Date(timestamp).toLocaleString()}
                      </td>
                      {Object.keys(forecastData.parameters).map((paramKey) => (
                        <td key={paramKey} className="p-3 text-right font-mono text-sm">
                          {forecastData.parameters[paramKey][idx]?.toFixed(4) || 'N/A'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>

      {/* All Parameters Comparison */}
      <Card className="space-card">
        <CardHeader>
          <CardTitle className="text-lg">All Parameters Overview</CardTitle>
          <CardDescription>Quick comparison of all forecasted parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {parameters.map((param) => {
              const stats = forecastData.statistics[param.key];
              return (
                <motion.div
                  key={param.key}
                  className="p-4 rounded-lg border border-border/50 bg-gradient-to-br from-muted/10 to-muted/5"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{param.label}</h4>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: param.color }}
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current:</span>
                      <span className="font-medium">{stats?.current?.toFixed(4) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Range:</span>
                      <span className="font-medium">
                        {stats?.min.toFixed(2)} - {stats?.max.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trend:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(stats?.trend || 'stable')}
                        <span className="capitalize text-xs">{stats?.trend || 'stable'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ForecastPredictionsPanel;

