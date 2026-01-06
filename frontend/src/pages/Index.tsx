
/**
 * Index Page (Dashboard)
 * 
 * This is the main landing page of the application, serving as the central dashboard.
 * It integrates all major components (Particle Data, CME Detection, Thresholds, Data Management)
 * into a unified, tabbed interface with "extreme" space-themed animations.
 * 
 * Features:
 * - Real-time mission status and system health monitoring
 * - Animated overview cards for key metrics
 * - Tabbed navigation for accessing different system modules
 * - Global "extreme" animations using framer-motion (staggered entrances, hover effects)
 * - Responsive design with glassmorphism aesthetics
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Satellite, Activity, Database, Settings, BarChart3, AlertTriangle, Zap, Loader2, ChevronRight, ChevronUp, ChevronDown, X, ArrowRight, Wind, Thermometer, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleDataChart from '@/components/ParticleDataChart';
import CMEDetectionPanel from '@/components/CMEDetectionPanel';
import ParametersInfo from '@/components/ParametersInfo';
import DataImportExport from '@/components/DataImportExport';
import RawDataViewer from '@/components/RawDataViewer';
import ForecastPredictionsPanel from '@/components/ForecastPredictionsPanel';
import AllRecentEventsModal from '@/components/AllRecentEventsModal';
import { api, type DataSummary, type ParticleData, type RecentCMEResponse, type RealtimeData, type RecentCMEEvent } from '@/lib/api';

type LoadingStepKey = 'connection' | 'summary' | 'particle' | 'cme' | 'realtime';

const createInitialLoadingSteps = (): Record<LoadingStepKey, boolean> => ({
  connection: true,
  summary: false,
  particle: false,
  cme: false,
  realtime: false,
});

const loadingStepItems: { key: LoadingStepKey; label: string; delay?: number }[] = [
  { key: 'connection', label: 'Initializing Connection...', delay: 0 },
  { key: 'summary', label: 'Received Data Summary', delay: 500 },
  { key: 'particle', label: 'Received Particle Data', delay: 1000 },
  { key: 'cme', label: 'Received CME Events', delay: 1500 },
  { key: 'realtime', label: 'Live Telemetry Linked', delay: 2000 },
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
} as const;

const cardHoverVariants = {
  hover: {
    scale: 1.05,
    rotateX: 5,
    rotateY: 5,
    boxShadow: "0px 10px 30px rgba(0, 240, 255, 0.3)",
    transition: { duration: 0.3 }
  }
} as const;

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [particleData, setParticleData] = useState<ParticleData | null>(null);
  const [recentCMEs, setRecentCMEs] = useState<RecentCMEResponse | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingSteps, setLoadingSteps] = useState<Record<LoadingStepKey, boolean>>(createInitialLoadingSteps());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<RecentCMEEvent | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [maxSpeedData, setMaxSpeedData] = useState<{ max: number; current: number } | null>(null);
  const [showRawDataViewer, setShowRawDataViewer] = useState(false);
  const [showAllRecentEventsModal, setShowAllRecentEventsModal] = useState(false);

  const markStepComplete = useCallback((key: LoadingStepKey) => {
    setLoadingSteps(prev => ({ ...prev, [key]: true }));
    setCurrentStepIndex(prev => Math.min(prev + 1, loadingStepItems.length - 1));
  }, []);

  // Fetch data on component mount - NO RETRY LOGIC
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setLoadingSteps(createInitialLoadingSteps());
        setCurrentStepIndex(0);

        // Fetch data summary and particle data in parallel
        // Add individual error handling to prevent one failure from breaking all
        const p1 = api.getDataSummary()
          .then(result => {
            markStepComplete('summary');
            return result;
          })
          .catch(err => {
            markStepComplete('summary');
            console.warn('Data summary fetch failed:', err);
            return {
              mission_status: "unknown",
              data_coverage: "N/A",
              last_update: new Date().toISOString(),
              total_cme_events: 0,
              active_alerts: 0,
              system_health: "unknown"
            } as DataSummary;
          });
        
        // Fetch particle data for 7d range (default) - this gets NOAA data with flux proxy
        const p2 = api.getParticleData('7d')
          .then(result => {
            markStepComplete('particle');
            return result;
          })
          .catch(err => {
            markStepComplete('particle');
            console.warn('Particle data fetch failed:', err);
            return null;
          });
        
        const p3 = api.getRecentCMEEvents()
          .then(result => {
            markStepComplete('cme');
            return result;
          })
          .catch(err => {
            markStepComplete('cme');
            console.warn('CME events fetch failed:', err);
            return {
              events: [],
              total_count: 0,
              date_range: "Unknown",
              includes_predictions: false
            } as RecentCMEResponse;
          });
        
        const p4 = api.getRealtimeData()
          .then(result => {
            markStepComplete('realtime');
            return result;
          })
          .catch(err => {
            markStepComplete('realtime');
            console.warn('Realtime data fetch failed:', err);
            return null;
          });
        
        // REMOVED: Don't fetch 90d data on dashboard load - this is unnecessary and slow
        // Max speed can be calculated from the 7d data we already fetch
        // const p5 = api.getParticleData('90d')...

        // Create a timeout promise (130 seconds - 14-day CME detection takes 35-53s, adding 10s buffer)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out after 130 seconds')), 130000)
        );

        // Try to fetch data with timeout, but allow partial results
        try {
          const results = await Promise.race([
            Promise.all([p1, p2, p3, p4]),
            timeoutPromise
          ]) as [DataSummary, ParticleData, RecentCMEResponse, RealtimeData | null];
          const [summaryData, particleResponse, cmeEvents, realtimeResponse] = results;

          setDataSummary(summaryData);
          setParticleData(particleResponse);
          setRecentCMEs(cmeEvents);
          setRealtimeData(realtimeResponse);
          
          // Calculate max speed from 7d data (instead of fetching 90d separately)
          if (particleResponse && particleResponse.velocity && particleResponse.velocity.length > 0) {
            const validSpeeds = particleResponse.velocity.filter(v => v > 0 && !isNaN(v) && isFinite(v));
            if (validSpeeds.length > 0) {
              const maxSpeed = Math.max(...validSpeeds);
              const currentSpeed = validSpeeds[validSpeeds.length - 1];
              const speedData = { max: maxSpeed, current: currentSpeed };
              setMaxSpeedData(speedData);
            }
          }
        } catch (timeoutError) {
          console.warn('Initial fetch timed out:', timeoutError);
          setError('Request timed out. Please refresh the page.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // REMOVED: All auto-refresh intervals to prevent page reload during presentation
    // Data will only refresh when user manually navigates or refreshes
    // const fullRefreshInterval = setInterval(() => {
    //   fetchData();
    // }, 600000);
    // const realtimeRefreshInterval = setInterval(async () => {
    //   try {
    //     const realtimeResponse = await api.getRealtimeData();
    //     if (realtimeResponse) {
    //       setRealtimeData(realtimeResponse);
    //     }
    //     const summaryData = await api.getDataSummary();
    //     if (summaryData) {
    //       setDataSummary(summaryData);
    //     }
    //   } catch (err) {
    //     console.warn('Realtime refresh failed:', err);
    //   }
    // }, 180000);
    // return () => {
    //   clearInterval(fullRefreshInterval);
    //   clearInterval(realtimeRefreshInterval);
    // };
  }, []);

  // Helper functions for data display
  const getLatestParticleFlux = () => {
    // Priority 1: Try proton_flux (real data from OMNI/CSV) - most accurate
    if (particleData && particleData.proton_flux && particleData.proton_flux.length > 0) {
      for (let i = particleData.proton_flux.length - 1; i >= 0; i--) {
        const flux = particleData.proton_flux[i];
        if (flux != null && !isNaN(flux) && flux > 0 && flux < 1e8) {
          // Format: convert to appropriate unit (flux is typically 0.1-10 for 10MeV)
          if (flux >= 1000000) {
            return `${(flux / 1000000).toFixed(1)}M`;
          } else if (flux >= 1000) {
            return `${(flux / 1000).toFixed(1)}K`;
          } else {
            return flux.toFixed(2);
          }
        }
      }
    }
    // Priority 2: Use flux from particleData (might be proxy, but better than nothing)
    if (particleData && particleData.flux && particleData.flux.length > 0) {
      for (let i = particleData.flux.length - 1; i >= 0; i--) {
        const flux = particleData.flux[i];
        if (flux != null && !isNaN(flux) && flux > 0) {
          if (flux >= 1000000) {
            return `${(flux / 1000000).toFixed(1)}M`;
          } else if (flux >= 1000) {
            return `${(flux / 1000).toFixed(1)}K`;
          } else {
            return flux.toFixed(2);
          }
        }
      }
    }
    return 'N/A';
  };

  const getLatestSolarWindSpeed = () => {
    // Use maxSpeedData.current for consistent current speed (from all available data)
    if (maxSpeedData && maxSpeedData.current > 0) {
      return Math.round(maxSpeedData.current).toString();
    }
    // Fallback to realtimeData
    if (realtimeData && realtimeData.speed != null && !isNaN(realtimeData.speed) && realtimeData.speed > 0) {
      return Math.round(realtimeData.speed).toString();
    }
    // Fallback to particleData - find last valid velocity
    if (particleData && particleData.velocity && particleData.velocity.length > 0) {
      for (let i = particleData.velocity.length - 1; i >= 0; i--) {
        const velocity = particleData.velocity[i];
        if (velocity != null && !isNaN(velocity) && velocity > 0) {
          return Math.round(velocity).toString();
        }
      }
    }
    return 'N/A';
  };

  const getMaxSolarWindSpeed = () => {
    // Always return the max from all available data
    if (maxSpeedData && maxSpeedData.max > 0) {
      return Math.round(maxSpeedData.max).toString();
    }
    // Fallback: calculate from current particleData if available
    if (particleData && particleData.velocity && particleData.velocity.length > 0) {
      const maxSpeed = Math.max(...particleData.velocity.filter(v => v > 0 && !isNaN(v)));
      return Math.round(maxSpeed).toString();
    }
    return 'N/A';
  };

  const getLatestDensity = () => {
    // Use real data from realtimeData first (most recent)
    if (realtimeData && realtimeData.density != null && !isNaN(realtimeData.density) && realtimeData.density > 0) {
      return realtimeData.density.toFixed(1);
    }
    // Fallback to particleData - find last valid density
    if (particleData && particleData.density && particleData.density.length > 0) {
      for (let i = particleData.density.length - 1; i >= 0; i--) {
        const density = particleData.density[i];
        if (density != null && !isNaN(density) && density > 0) {
          return density.toFixed(1);
        }
      }
    }
    return 'N/A';
  };

  const getDataCoverage = () => dataSummary?.data_coverage || 'N/A';
  const getActiveCMECount = () => {
    // Prioritize active_alerts (events in last 48h), then total_cme_events
    if (dataSummary?.active_alerts !== undefined && dataSummary.active_alerts >= 0) {
      return dataSummary.active_alerts.toString();
    }
    if (dataSummary?.total_cme_events !== undefined && dataSummary.total_cme_events >= 0) {
      return dataSummary.total_cme_events.toString();
    }
    return '0';
  };
  const getMissionStatus = () => dataSummary?.mission_status || 'unknown';
  const getSystemHealth = () => dataSummary?.system_health || 'unknown';
  const getLastUpdate = () => dataSummary ? new Date(dataSummary.last_update).toLocaleString() : 'Unknown';
  
  // Determine SWIS status based on multiple factors (not just hardcoded)
  const getSWISStatus = () => {
    const health = getSystemHealth();
    const coverage = dataSummary?.data_coverage || 'N/A';
    const missionStatus = getMissionStatus();
    const hasRealtimeData = realtimeData && realtimeData.success;
    
    // Extract coverage percentage
    let coveragePct = 0;
    if (coverage !== 'N/A' && coverage.includes('%')) {
      const match = coverage.match(/(\d+\.?\d*)/);
      if (match) {
        coveragePct = parseFloat(match[1]);
      }
    }
    
    // Check data freshness
    let isDataRecent = false;
    if (dataSummary?.last_update) {
      try {
        const lastUpdate = new Date(dataSummary.last_update);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        isDataRecent = hoursSinceUpdate < 48; // Consider data recent if < 48 hours
      } catch (e) {
        isDataRecent = hasRealtimeData; // Fallback to realtime data check
      }
    } else {
      isDataRecent = hasRealtimeData;
    }
    
    // Priority 1: SWIS is ONLINE if system is healthy and operational
    if (missionStatus === 'operational') {
      // Excellent/Good health with decent coverage = ONLINE
      if ((health === 'excellent' || health === 'good') && coveragePct >= 40 && isDataRecent) {
        return { status: 'ONLINE', color: 'border-blue-500/50 text-blue-400' };
      }
      
      // Fair health with reasonable coverage = ONLINE (be more lenient)
      if (health === 'fair' && coveragePct >= 50 && isDataRecent) {
        return { status: 'ONLINE', color: 'border-blue-500/50 text-blue-400' };
      }
      
      // Good/Excellent health but lower coverage = LIMITED
      if ((health === 'excellent' || health === 'good') && coveragePct >= 30 && coveragePct < 40) {
        return { status: 'LIMITED', color: 'border-yellow-500/50 text-yellow-400' };
      }
      
      // Fair health with moderate coverage = LIMITED
      if (health === 'fair' && coveragePct >= 30 && coveragePct < 50) {
        return { status: 'LIMITED', color: 'border-yellow-500/50 text-yellow-400' };
      }
      
      // Fair health with good coverage but data not recent = LIMITED
      if (health === 'fair' && coveragePct >= 50 && !isDataRecent) {
        return { status: 'LIMITED', color: 'border-yellow-500/50 text-yellow-400' };
      }
      
      // Any health with very low coverage = LIMITED
      if (coveragePct > 0 && coveragePct < 30) {
        return { status: 'LIMITED', color: 'border-yellow-500/50 text-yellow-400' };
      }
      
      // Default for operational mission: LIMITED (conservative)
      if (health !== 'poor' && health !== 'unknown') {
        return { status: 'LIMITED', color: 'border-yellow-500/50 text-yellow-400' };
      }
    }
    
    // Priority 2: SWIS is OFFLINE if mission is not operational or system is very unhealthy
    if (missionStatus !== 'operational' || health === 'poor' || health === 'unknown') {
      return { status: 'OFFLINE', color: 'border-red-500/50 text-red-400' };
    }
    
    // Default fallback: LIMITED (conservative approach)
    return { status: 'LIMITED', color: 'border-yellow-500/50 text-yellow-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Holographic Loading Effect */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"></div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-8 relative z-10"
        >
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-t-transparent border-r-blue-400 border-b-transparent border-l-orange-400 rounded-full animate-reverse-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Satellite className="h-12 w-12 text-white animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-widest">
              SYSTEM INITIALIZATION
            </h2>
            <div className="flex items-center justify-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <p className="text-xs text-blue-300/70 font-mono">CONNECTING TO ADITYA-L1 TELEMETRY...</p>

            {/* Real-time data status */}
            <div className="mt-4 text-xs text-center font-mono bg-black/50 p-2 rounded border border-white/10 max-w-xs mx-auto">
              <div className="text-green-400/80">✓ Real-time data monitoring active</div>
            </div>

            <div className="mt-5 w-full max-w-xs mx-auto text-left font-mono text-sm bg-black/40 border border-white/5 rounded-lg p-4 shadow-lg shadow-sky-500/10">
              {loadingStepItems.map((item, index) => {
                const complete = loadingSteps[item.key];
                const isActive = index === currentStepIndex;
                const shouldShow = complete || isActive;
                if (!shouldShow) {
                  return null;
                }

                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-2 py-1 ${
                      complete
                        ? 'text-green-400'
                        : isActive
                          ? 'text-cyan-300'
                          : 'text-blue-300/70'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full border border-current"
                      style={{ backgroundColor: complete ? 'currentColor' : 'transparent' }}
                    ></span>
                    <span>{complete ? `✓ ${item.label}` : `… ${item.label}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto animate-bounce" />
          <p className="text-destructive font-bold text-xl">SYSTEM ERROR: {error}</p>
          <Button onClick={() => window.location.reload()} className="btn-extreme">
            RETRY CONNECTION
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-4"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-solar-orange/50 blur-lg rounded-full group-hover:bg-solar-orange/80 transition-all duration-500"></div>
                <Satellite className="h-10 w-10 text-solar-orange animate-slow-rotate relative z-10" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse-glow z-20"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-blue-400 tracking-wider">
                  ADITYA-L1 <span className="text-solar-orange">HALO ALERT</span>
                </h1>
                <p className="text-xs text-blue-300/70 tracking-widest uppercase">
                  SWIS-ASPEX Payload Analysis System
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-center space-x-4"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            >
              {realtimeData && (
                <Badge variant="outline" className="glass-card border-green-500/50 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  LIVE TELEMETRY
                </Badge>
              )}
              <Badge variant="outline" className={`glass-card ${getMissionStatus() === 'operational' ? 'border-green-500/50 text-green-400' : 'border-red-500/50 text-red-400'}`}>
                <div className={`w-2 h-2 ${getMissionStatus() === 'operational' ? 'bg-green-400' : 'bg-red-400'} rounded-full mr-2 animate-pulse`}></div>
                {getMissionStatus() === 'operational' ? 'L1 ORBIT STABLE' : 'ORBIT DEVIATION'}
              </Badge>
              <Badge variant="outline" className={`glass-card ${getSWISStatus().color}`}>
                SWIS {getSWISStatus().status}
              </Badge>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Overview Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          variants={containerVariants}
        >
          {[
            { title: "Active CME Events", icon: AlertTriangle, value: getActiveCMECount(), sub: realtimeData ? "L1 ORBIT SENSORS" : "Total detected", color: "text-yellow-400", border: "border-yellow-500/30" },
            { title: "Particle Flux", icon: Activity, value: getLatestParticleFlux(), sub: "particles/cm²/s", color: "text-cyan-400", border: "border-cyan-500/30" },
            { title: "Solar Wind Speed", icon: Zap, value: getLatestSolarWindSpeed(), sub: "km/s", color: "text-purple-400", border: "border-purple-500/30" },
            { title: "Proton Density", icon: Database, value: getLatestDensity(), sub: "cm⁻³", color: "text-green-400", border: "border-green-500/30" }
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover="hover"
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={cardHoverVariants} className={`glass-card p-6 border ${item.border} relative overflow-hidden group backdrop-blur-md bg-black/40`}>
                <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-white/10 to-white/0 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500`}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="flex flex-row items-center justify-between space-y-0 pb-2 mb-2 relative z-10">
                  <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">{item.title}</h3>
                  <item.icon className={`h-5 w-5 ${item.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                </div>
                <div className={`text-3xl font-bold ${item.color} mb-1 font-mono relative z-10`}>{item.value}</div>
                <p className="text-xs text-gray-500 uppercase tracking-wide relative z-10">{item.sub}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <motion.div variants={itemVariants}>
            <TabsList className="grid w-full grid-cols-7 bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-xl h-auto">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "particle-data", label: "Particle Data", icon: Activity },
                { id: "forecast", label: "🔮 Forecast", icon: Sparkles },
                { id: "cme-detection", label: "CME Detection", icon: AlertTriangle },
                { id: "parameters", label: "Parameters", icon: Settings },
                { id: "data-management", label: "Data", icon: Database },
                { id: "mission-details", label: "Mission", icon: Satellite }
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/50 border border-transparent transition-all duration-300 rounded-lg"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="overview" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  className="glass-card p-6 relative overflow-hidden"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/10 via-transparent to-transparent pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Mission Status</h2>
                      <p className="text-sm text-gray-400">Aditya-L1 Solar Observatory</p>
                    </div>
                    <Satellite className="h-12 w-12 text-primary animate-float" />
                  </div>

                  <div className="relative p-6 rounded-xl bg-black/30 border border-white/5 mb-6">
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { label: "Launch Date", value: "Sept 2, 2023", color: "text-cyan-400" },
                        { label: "L1 Arrival", value: "Jan 6, 2024", color: "text-green-400" },
                        { label: "Distance", value: "1.5M km", color: "text-purple-400" },
                        { label: "Orbital Period", value: "178 days", color: "text-orange-400" }
                      ].map((stat, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                          <p className={`font-mono font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      variant="ghost" 
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 group"
                      onClick={() => {
                        // Navigate to mission details tab
                        setActiveTab('mission-details');
                        // Scroll to top
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      View Mission Details <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>

                <motion.div
                  className="glass-card p-6"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Recent Activity</h2>
                      <p className="text-sm text-gray-400">Latest Halo CME Detections</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                  </div>

                  <div className="space-y-3">
                    {recentCMEs && recentCMEs.events.length > 0 ? (
                      <>
                        {recentCMEs.events.slice(0, 4).map((event, index) => (
                        <motion.div
                          key={event.id || index}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => {
                            setSelectedEvent(event);
                            setEventModalOpen(true);
                            // Don't navigate - just open modal
                          }}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-1 h-10 rounded-full ${
                              event.severity === 'High' ? 'bg-red-500' : 
                              event.severity === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500'
                            } group-hover:w-1.5 transition-all`}></div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                                {new Date(event.date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">{event.type}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  (event.confidence || 0) >= 0.5 ? 'bg-green-500/20 text-green-400' :
                                  (event.confidence || 0) >= 0.3 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {((event.confidence || 0) * 100).toFixed(0)}% conf
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <Badge variant="outline" className={`text-xs mb-1 ${
                                event.magnitude.startsWith('X') ? 'border-red-500/50 text-red-400' :
                                event.magnitude.startsWith('M') ? 'border-orange-500/50 text-orange-400' :
                                'border-yellow-500/50 text-yellow-400'
                              }`}>{event.magnitude}</Badge>
                              <p className="text-xs text-gray-400 font-mono">{event.speed} km/s</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                          </div>
                        </motion.div>
                      ))}
                        {recentCMEs.events.length > 4 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Button
                              variant="ghost"
                              onClick={() => setShowAllRecentEventsModal(true)}
                              className="w-full mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30"
                            >
                              See More ({recentCMEs.events.length - 4} more)
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </motion.div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <p>No recent events detected</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="particle-data">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                <ParticleDataChart />
              </motion.div>
            </TabsContent>

            <TabsContent value="forecast">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <ForecastPredictionsPanel />
              </motion.div>
            </TabsContent>

            <TabsContent value="cme-detection">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                <CMEDetectionPanel />
              </motion.div>
            </TabsContent>

            <TabsContent value="parameters">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <ParametersInfo />
              </motion.div>
            </TabsContent>

            <TabsContent value="data-management">
              <motion.div initial={{ opacity: 0, rotateX: -10 }} animate={{ opacity: 1, rotateX: 0 }} transition={{ duration: 0.4 }}>
                <DataImportExport />
              </motion.div>
            </TabsContent>

            <TabsContent value="mission-details">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card className="space-card border-white/10 bg-black/40 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                      <Satellite className="h-6 w-6 text-cyan-400" />
                      Aditya-L1 Mission Details
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-2">
                      Comprehensive information about the Aditya-L1 mission and SWIS-ASPEX payload
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mission Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">Mission Overview</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Launch Date:</span>
                            <span className="text-cyan-400 font-mono">September 2, 2023</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">L1 Arrival:</span>
                            <span className="text-green-400 font-mono">January 6, 2024</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Distance from Earth:</span>
                            <span className="text-purple-400 font-mono">~1.5 Million km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Orbital Period:</span>
                            <span className="text-orange-400 font-mono">~178 days</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">SWIS-ASPEX Payload</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Payload Type:</span>
                            <span className="text-cyan-400">Solar Wind Ion Spectrometer</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Update Frequency:</span>
                            <span className="text-green-400 font-mono">5 minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Data Coverage:</span>
                            <span className="text-purple-400">{getDataCoverage()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">System Status:</span>
                            <span className="text-orange-400">{getSystemHealth()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mission Objectives */}
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Primary Objectives</h3>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Study solar wind composition and dynamics in the L1 Lagrange point</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Monitor coronal mass ejections (CMEs) and their impact on space weather</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Analyze magnetic field variations and plasma parameters</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Provide early warning for space weather events affecting Earth</span>
                        </li>
                      </ul>
                    </div>

                    {/* Current Status */}
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Current Mission Status</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Mission Status</p>
                          <Badge variant="outline" className="text-green-400 border-green-500/50">
                            {getMissionStatus()}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">System Health</p>
                          <Badge variant="outline" className="text-cyan-400 border-cyan-500/50">
                            {getSystemHealth()}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Data Coverage</p>
                          <Badge variant="outline" className="text-purple-400 border-purple-500/50">
                            {getDataCoverage()}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Last Update</p>
                          <p className="text-xs text-gray-300">{getLastUpdate()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>

      {/* CME Event Detail Modal */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent className="bg-gray-900/95 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              CME Event Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedEvent && new Date(selectedEvent.date).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 mt-4"
            >
              {/* Event Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Magnitude</p>
                  <p className={`text-2xl font-bold ${
                    selectedEvent.magnitude.startsWith('X') ? 'text-red-400' :
                    selectedEvent.magnitude.startsWith('M') ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>{selectedEvent.magnitude}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Speed</p>
                  <p className="text-2xl font-bold text-cyan-400">{selectedEvent.speed} <span className="text-sm text-gray-400">km/s</span></p>
                </div>
              </div>

              {/* Detection Confidence */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-400">Detection Confidence</p>
                  <p className={`text-lg font-semibold ${
                    (selectedEvent.confidence || 0) >= 0.5 ? 'text-green-400' :
                    (selectedEvent.confidence || 0) >= 0.3 ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>{((selectedEvent.confidence || 0) * 100).toFixed(0)}%</p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      (selectedEvent.confidence || 0) >= 0.5 ? 'bg-green-500' :
                      (selectedEvent.confidence || 0) >= 0.3 ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${(selectedEvent.confidence || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Additional Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="h-4 w-4 text-blue-400" />
                    <p className="text-xs text-gray-400">Type</p>
                  </div>
                  <p className="text-sm font-medium">{selectedEvent.type}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <p className="text-xs text-gray-400">Severity</p>
                  </div>
                  <p className={`text-sm font-medium ${
                    selectedEvent.severity === 'High' ? 'text-red-400' :
                    selectedEvent.severity === 'Medium' ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>{selectedEvent.severity || 'Low'}</p>
                </div>
              </div>

              {/* Additional Parameters */}
              <div className="grid grid-cols-2 gap-4">
                {selectedEvent.bz_gsm !== null && selectedEvent.bz_gsm !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Bz (GSM)</p>
                    <p className={`text-lg font-semibold ${
                      (selectedEvent.bz_gsm || 0) < -10 ? 'text-red-400' :
                      (selectedEvent.bz_gsm || 0) < 0 ? 'text-orange-400' :
                      'text-green-400'
                    }`}>{selectedEvent.bz_gsm} nT</p>
                  </div>
                )}
                {selectedEvent.density !== null && selectedEvent.density !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Proton Density</p>
                    <p className="text-lg font-semibold text-purple-400">{selectedEvent.density} cm⁻³</p>
                  </div>
                )}
                {selectedEvent.temperature !== null && selectedEvent.temperature !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Temperature</p>
                    <p className="text-lg font-semibold text-orange-400">{selectedEvent.temperature.toLocaleString()} K</p>
                  </div>
                )}
                {selectedEvent.bt !== null && selectedEvent.bt !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Total IMF (Bt)</p>
                    <p className="text-lg font-semibold text-blue-400">{selectedEvent.bt} nT</p>
                  </div>
                )}
              </div>

              {/* Angular Width - Fix display to match type */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Angular Width</p>
                <p className="text-sm font-medium">
                  {selectedEvent.angular_width}° {selectedEvent.angular_width >= 360 ? '(Full Halo)' : selectedEvent.angular_width >= 120 ? '(Partial Halo)' : '(Narrow CME)'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/10 hover:bg-white/5"
                  onClick={() => setEventModalOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => {
                    setEventModalOpen(false);
                    setShowRawDataViewer(true);
                  }}
                >
                  View Raw Data <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* All Recent Events Modal */}
      {/* All Recent Events Modal */}
      <AllRecentEventsModal
        recentCMEs={recentCMEs}
        isOpen={showAllRecentEventsModal}
        onClose={() => setShowAllRecentEventsModal(false)}
      />

      {/* Raw Data Viewer Modal/Overlay */}
      {showRawDataViewer && !showAllRecentEventsModal && (
        <div className="fixed inset-0 z-50 overflow-auto">
          <RawDataViewer 
            eventDate={selectedEvent?.date ? (() => {
              try {
                const dateStr = String(selectedEvent.date).trim();
                
                // If already in YYYY-MM-DD format, use it directly
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  return dateStr;
                }
                
                // Extract from ISO format (before T)
                if (dateStr.includes('T')) {
                  const datePart = dateStr.split('T')[0];
                  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                    return datePart;
                  }
                }
                
                // Extract from space-separated format
                if (dateStr.includes(' ')) {
                  const datePart = dateStr.split(' ')[0];
                  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                    return datePart;
                  }
                }
                
                // Parse using UTC to avoid timezone shifts
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                  // Use UTC methods to prevent timezone conversion issues
                  const year = parsed.getUTCFullYear();
                  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
                  const day = String(parsed.getUTCDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                }
                
                console.warn('Index: Could not parse event date:', dateStr);
                return dateStr;
              } catch (e) {
                console.error('Error parsing event date:', e, selectedEvent.date);
                return String(selectedEvent.date);
              }
            })() : undefined}
            onClose={() => setShowRawDataViewer(false)}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Index;
