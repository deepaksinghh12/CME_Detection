/**
 * Phase 1: Live Space Weather Data - Scientist Grade
 * 
 * Features:
 * - 4-grid layout with comprehensive data visualization
 * - Parameter selector (manual selection)
 * - Real-time graphs and animations
 * - Parameter-specific animations (heavy/light based on parameter)
 * - Dynamic effects grid based on current values
 * - Space weather alerts with toast notifications
 * - Scientist-grade detailed analysis
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Loader2, AlertTriangle, 
  Activity, Gauge, Wind, Zap, TrendingUp, Sun, 
  Satellite, Navigation, Radio, Power, Sparkles,
  Image as ImageIcon, Flame, MapPin, Compass
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import ParameterSpecificAnimation from '@/components/ParameterSpecificAnimation';
import { getDynamicParameterInfo, type ParameterData } from './Phase1Helpers';

// Image Carousel Component for Animation Effect
const ImageCarousel: React.FC<{ images: string[]; interval?: number; alt?: string }> = ({ images, interval = 2000, alt = 'Animation' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        <p className="text-sm">No images available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={alt}
          className="w-full h-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onError={(e) => {
            // Skip to next image on error
            setCurrentIndex((prev) => (prev + 1) % images.length);
          }}
        />
      </AnimatePresence>
      {/* Progress indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
        {images.slice(0, Math.min(10, images.length)).map((_, idx) => (
          <div
            key={idx}
            className={`h-1 rounded transition-all ${
              idx === currentIndex % Math.min(10, images.length)
                ? 'w-4 bg-blue-400'
                : 'w-1 bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const Phase1: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedParam, setSelectedParam] = useState(0);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [geomagneticData, setGeomagneticData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any>(null);
  const [solarFlaresData, setSolarFlaresData] = useState<any>(null);
  const [lascoImages, setLascoImages] = useState<any>(null);
  const [suviImages, setSuviImages] = useState<any>(null);
  const [sunActivityTab, setSunActivityTab] = useState<'coronagraph' | 'euv' | 'flares'>('coronagraph');
  const [particleData, setParticleData] = useState<any>(null); // 7-day chart data

  // Define all parameters with comprehensive data
  const parameters: ParameterData[] = [
    {
      name: 'Kp Index',
      fullForm: 'Planetary K-index',
      value: geomagneticData?.indices?.Kp ?? (Array.isArray(geomagneticData?.kp_data?.data) ? geomagneticData.kp_data.data[geomagneticData.kp_data.data.length - 1]?.['kp'] : null) ?? null,
      unit: '',
      range: { min: 0, max: 9 },
      average: 2.5,
      limit: { normal: 4, warning: 5, danger: 7 },
      definition: 'Shows how much Earth\'s magnetic field is disturbed. Higher numbers mean stronger storms.',
      detailedInfo: 'Scale 0-9. Values above 5 mean moderate storms, above 7 mean severe storms that can affect power grids and satellites.',
      graphData: (() => {
        // Use particleData (7-day) if available
        if (particleData?.kp && particleData?.timestamps) {
          return particleData.timestamps.map((t: string, i: number) => ({
            time: new Date(t).toLocaleTimeString(),
            value: particleData.kp[i]
          })).filter((d: any) => d.value !== null && d.value !== undefined);
        }
        // Try timeline first
        if (geomagneticData?.timeline && Array.isArray(geomagneticData.timeline)) {
          const timelineData = geomagneticData.timeline
            .filter((d: any) => d.Kp !== null && d.Kp !== undefined && d.timestamp)
            .map((d: any) => {
              const kpVal = typeof d.Kp === 'number' ? d.Kp : parseFloat(d.Kp);
              if (isNaN(kpVal)) return null;
              return {
                time: new Date(d.timestamp).toLocaleTimeString(),
                value: kpVal
              };
            })
            .filter((d: any) => d !== null);
          if (timelineData.length > 0) return timelineData;
        }
        
        // Try kp_data
        if (geomagneticData?.kp_data?.data) {
          const kpData = Array.isArray(geomagneticData.kp_data.data) 
            ? geomagneticData.kp_data.data
            : (geomagneticData.kp_data.data?.toArray?.() || []);
          
          const graphData = kpData
            .slice(-24)
            .map((row: any) => {
              const kpVal = typeof row?.kp === 'number' ? row.kp : parseFloat(row?.kp);
              const timestamp = row?.timestamp || row?.time_tag;
              if (isNaN(kpVal) || !timestamp) return null;
              return {
                time: new Date(timestamp).toLocaleTimeString(),
                value: kpVal
              };
            })
            .filter((d: any) => d !== null);
          if (graphData.length > 0) return graphData;
        }
        
        return [];
      })(),
      effects: ['Geomagnetic activity', 'Aurora visibility', 'Satellite operations'],
      causes: ['Solar wind variations', 'CME impacts', 'High-speed streams'],
      safe: ['Normal operations', 'No precautions needed'],
      notSafe: ['Monitor satellite operations', 'GPS accuracy may degrade'],
      alerts: [],
      color: '#f59e0b',
      animationType: 'geomagnetic',
      kp: geomagneticData?.indices?.Kp,
      dst: geomagneticData?.indices?.Dst
    },
    {
      name: 'DST Index',
      fullForm: 'Disturbance Storm Time Index',
      value: geomagneticData?.indices?.Dst ?? (Array.isArray(geomagneticData?.dst_data?.data) ? geomagneticData.dst_data.data[geomagneticData.dst_data.data.length - 1]?.['dst'] : null) ?? null,
      unit: 'nT',
      range: { min: -500, max: 50 },
      average: -10,
      limit: { normal: -30, warning: -50, danger: -100 },
      definition: 'Measures how strong the ring current around Earth is. More negative = stronger storm.',
      detailedInfo: 'Negative values mean a stronger ring current. Values below -100 nT indicate extreme storms that can cause power outages.',
      graphData: (() => {
        // Use particleData (7-day) if available
        if (particleData?.dst && particleData?.timestamps) {
          return particleData.timestamps.map((t: string, i: number) => ({
            time: new Date(t).toLocaleTimeString(),
            value: particleData.dst[i]
          })).filter((d: any) => d.value !== null && d.value !== undefined);
        }
        // Try timeline first
        if (geomagneticData?.timeline && Array.isArray(geomagneticData.timeline)) {
          const timelineData = geomagneticData.timeline
            .filter((d: any) => d.Dst !== null && d.Dst !== undefined && d.timestamp)
            .map((d: any) => {
              const dstVal = typeof d.Dst === 'number' ? d.Dst : parseFloat(d.Dst);
              if (isNaN(dstVal)) return null;
              return {
                time: new Date(d.timestamp).toLocaleTimeString(),
                value: dstVal
              };
            })
            .filter((d: any) => d !== null);
          if (timelineData.length > 0) return timelineData;
        }
        
        // Try dst_data
        if (geomagneticData?.dst_data?.data) {
          const dstData = Array.isArray(geomagneticData.dst_data.data) 
            ? geomagneticData.dst_data.data
            : (geomagneticData.dst_data.data?.toArray?.() || []);
          
          const graphData = dstData
            .slice(-24)
            .map((row: any) => {
              const dstVal = typeof row?.dst === 'number' ? row.dst : parseFloat(row?.dst);
              const timestamp = row?.timestamp || row?.time_tag;
              if (isNaN(dstVal) || !timestamp) return null;
              return {
                time: new Date(timestamp).toLocaleTimeString(),
                value: dstVal
              };
            })
            .filter((d: any) => d !== null);
          if (graphData.length > 0) return graphData;
        }
        
        return [];
      })(),
      effects: ['Ring current intensity', 'Geomagnetic storm level', 'Radiation belt dynamics'],
      causes: ['Solar wind pressure', 'Southward IMF', 'CME arrival'],
      safe: ['Stable magnetosphere', 'Normal conditions'],
      notSafe: ['Power grid impacts', 'Satellite charging'],
      alerts: [],
      color: '#ef4444',
      animationType: 'geomagnetic',
      kp: geomagneticData?.indices?.Kp,
      dst: geomagneticData?.indices?.Dst
    },
    {
      name: 'Solar Wind Speed',
      fullForm: 'Solar Wind Bulk Velocity',
      value: realtimeData?.speed ?? realtimeData?.solar_wind?.speed ?? realtimeData?.velocity ?? null,
      unit: 'km/s',
      range: { min: 200, max: 1200 },
      average: 450,
      limit: { normal: 600, warning: 700, danger: 900 },
      definition: 'How fast particles from the Sun are moving towards Earth.',
      detailedInfo: 'Normal speed: 300-500 km/s. Fast wind (500-800 km/s) comes from coronal holes. Speeds above 900 km/s can cause major storms.',
      graphData: realtimeData?.history?.timestamps?.map((t: string, i: number) => ({
        time: new Date(t).toLocaleTimeString(),
        value: realtimeData.history.speed[i]
      })) || [],
      effects: ['Magnetosphere compression', 'Geomagnetic activity', 'Satellite drag'],
      causes: ['Coronal holes', 'CMEs', 'Solar wind structures'],
      safe: ['Normal solar wind', 'Stable conditions'],
      notSafe: ['Enhanced geomagnetic activity', 'Increased drag on satellites'],
      alerts: [],
      color: '#10b981',
      animationType: 'particle',
      density: realtimeData?.density ?? realtimeData?.solar_wind?.density,
      temperature: realtimeData?.temperature ?? realtimeData?.solar_wind?.temperature,
      lon: realtimeData?.lon ?? realtimeData?.lon_gsm ?? realtimeData?.solar_wind?.lon_gsm,
      lat: realtimeData?.lat ?? realtimeData?.lat_gsm ?? realtimeData?.solar_wind?.lat_gsm,
      bx: realtimeData?.bx ?? realtimeData?.bx_gsm ?? realtimeData?.solar_wind?.bx_gsm,
      by: realtimeData?.by ?? realtimeData?.by_gsm ?? realtimeData?.solar_wind?.by_gsm
    },
    {
      name: 'Solar Wind Density',
      fullForm: 'Solar Wind Proton Density',
      value: realtimeData?.density ?? realtimeData?.solar_wind?.density ?? null,
      unit: 'p/cm³',
      range: { min: 0, max: 50 },
      average: 7,
      limit: { normal: 15, warning: 25, danger: 40 },
      definition: 'How many particles are in the solar wind. More particles = more pressure on Earth\'s magnetic field.',
      detailedInfo: 'Normal: 3-10 particles per cubic centimeter. High density (above 25) often means a CME is passing by.',
      graphData: (() => {
        // Use particleData (7-day) if available, otherwise fallback to realtimeData.history
        if (particleData?.density && particleData?.timestamps) {
          return particleData.timestamps.map((t: string, i: number) => ({
            time: new Date(t).toLocaleTimeString(),
            value: particleData.density[i]
          })).filter((d: any) => d.value !== null && d.value !== undefined);
        }
        return realtimeData?.history?.timestamps?.map((t: string, i: number) => ({
          time: new Date(t).toLocaleTimeString(),
          value: realtimeData.history.density?.[i] ?? null
        })).filter((d: any) => d.value !== null && d.value !== undefined) || [];
      })(),
      effects: ['Dynamic pressure', 'Magnetosphere compression'],
      causes: ['Solar wind structures', 'CME plasma', 'Stream interfaces'],
      safe: ['Normal density', 'Stable conditions'],
      notSafe: ['Enhanced compression', 'Increased activity'],
      alerts: [],
      color: '#8b5cf6',
      animationType: 'particle',
      density: realtimeData?.density,
      temperature: realtimeData?.temperature
    },
    {
      name: 'Bz Component',
      fullForm: 'IMF Bz (GSM coordinates)',
      value: realtimeData?.bz ?? realtimeData?.solar_wind?.bz_gsm ?? null,
      unit: 'nT',
      range: { min: -30, max: 30 },
      average: 0,
      limit: { normal: -5, warning: -10, danger: -15 },
      definition: 'Direction of the magnetic field from the Sun. Negative (southward) = dangerous, allows energy to enter Earth.',
      detailedInfo: 'When Bz is negative (southward), Earth\'s magnetic field can connect with the solar wind, causing storms. More negative = stronger connection.',
      graphData: (() => {
        // Use particleData (7-day) if available, otherwise fallback to realtimeData.history
        if (particleData?.bz && particleData?.timestamps) {
          return particleData.timestamps.map((t: string, i: number) => ({
            time: new Date(t).toLocaleTimeString(),
            value: particleData.bz[i]
          })).filter((d: any) => d.value !== null && d.value !== undefined);
        }
        return realtimeData?.history?.timestamps?.map((t: string, i: number) => ({
          time: new Date(t).toLocaleTimeString(),
          value: realtimeData.history.bz_gsm?.[i] ?? realtimeData.history.bz?.[i] ?? null
        })).filter((d: any) => d.value !== null && d.value !== undefined) || [];
      })(),
      effects: ['Magnetic reconnection', 'Energy coupling', 'Geomagnetic storm intensity'],
      causes: ['Solar wind magnetic field', 'CME magnetic structure'],
      safe: ['Northward or neutral', 'Magnetosphere protected'],
      notSafe: ['Southward Bz', 'Enhanced storm risk'],
      alerts: [],
      color: '#ec4899',
      animationType: 'particle',
      bz: realtimeData?.bz ?? realtimeData?.solar_wind?.bz_gsm,
      bt: realtimeData?.bt ?? realtimeData?.solar_wind?.bt
    },
    {
      name: 'Bt (Total B)',
      fullForm: 'Total IMF Magnitude',
      value: realtimeData?.bt ?? realtimeData?.solar_wind?.bt ?? null,
      unit: 'nT',
      range: { min: 0, max: 40 },
      average: 6,
      limit: { normal: 10, warning: 20, danger: 30 },
      definition: 'Total strength of the magnetic field from the Sun. Higher values often mean a CME is coming.',
      detailedInfo: 'Normal: 2-10 nT. Values above 20 nT usually mean a CME or compressed solar wind region is passing by.',
      graphData: (() => {
        // Use particleData (7-day) if available, otherwise fallback to realtimeData.history
        if (particleData?.bt && particleData?.timestamps) {
          return particleData.timestamps.map((t: string, i: number) => ({
            time: new Date(t).toLocaleTimeString(),
            value: particleData.bt[i]
          })).filter((d: any) => d.value !== null && d.value !== undefined);
        }
        return realtimeData?.history?.timestamps?.map((t: string, i: number) => ({
          time: new Date(t).toLocaleTimeString(),
          value: realtimeData.history.bt?.[i] ?? null
        })).filter((d: any) => d.value !== null && d.value !== undefined) || [];
      })(),
      effects: ['Solar wind structure', 'CME detection'],
      causes: ['Solar wind variations', 'CME magnetic fields'],
      safe: ['Normal IMF', 'Typical values'],
      notSafe: ['Enhanced field', 'CME possible'],
      alerts: [],
      color: '#06b6d4',
      animationType: 'particle',
      bz: realtimeData?.bz ?? realtimeData?.solar_wind?.bz_gsm,
      bt: realtimeData?.bt ?? realtimeData?.solar_wind?.bt
    },
    {
      name: 'Solar Wind Temperature',
      fullForm: 'Solar Wind Proton Temperature',
      value: realtimeData?.temperature ?? realtimeData?.solar_wind?.temperature ?? null,
      unit: 'K',
      range: { min: 10000, max: 1000000 },
      average: 100000,
      limit: { normal: 200000, warning: 500000, danger: 800000 },
      definition: 'How hot the solar wind particles are. Very hot particles often mean a shock wave passed by.',
      detailedInfo: 'Normal: 50,000-200,000 Kelvin. Temperatures above 500,000 K usually mean a CME shock or compressed region.',
      graphData: realtimeData?.history?.timestamps?.map((t: string, i: number) => ({
        time: new Date(t).toLocaleTimeString(),
        value: realtimeData.history.temperature[i]
      })) || [],
      effects: ['Plasma state', 'Thermal pressure'],
      causes: ['Solar heating', 'Shocks', 'Compression'],
      safe: ['Normal temperature', 'Typical plasma'],
      notSafe: ['Heated plasma', 'Shock passage'],
      alerts: [],
      color: '#f97316',
      animationType: 'particle',
      temperature: realtimeData?.temperature
    },
    {
      name: 'F10.7 Flux',
      fullForm: 'Solar Radio Flux at 10.7 cm',
      value: geomagneticData?.indices?.['F10.7'] ?? (Array.isArray(geomagneticData?.f107_data?.data) ? geomagneticData.f107_data.data[geomagneticData.f107_data.data.length - 1]?.['flux'] : null) ?? null,
      unit: 'sfu',
      range: { min: 60, max: 300 },
      average: 120,
      limit: { normal: 150, warning: 200, danger: 250 },
      definition: 'Radio waves from the Sun at 10.7 cm. Higher values mean more sunspots and solar activity.',
      detailedInfo: 'Measured in solar flux units (sfu). Correlates with sunspot number. High values mean more active Sun, which affects Earth\'s atmosphere.',
      graphData: (() => {
        if (geomagneticData?.f107_data) {
          const f107Data = Array.isArray(geomagneticData.f107_data) 
            ? geomagneticData.f107_data
            : (Array.isArray(geomagneticData.f107_data?.data) 
              ? geomagneticData.f107_data.data
              : (geomagneticData.f107_data?.data?.toArray?.() || []));
          
          return f107Data
            .slice(-24)
            .map((row: any) => {
              const fluxVal = typeof row?.flux === 'number' ? row.flux : parseFloat(row?.flux);
              const timestamp = row?.timestamp || row?.time_tag;
              if (isNaN(fluxVal) || !timestamp) return null;
              return {
                time: new Date(timestamp).toLocaleTimeString(),
                value: fluxVal
              };
            })
            .filter((d: any) => d !== null && d.value !== null);
        }
        return [];
      })(),
      effects: ['Solar activity level', 'Ionospheric conditions', 'Satellite drag'],
      causes: ['Sunspots', 'Active regions', 'Solar cycle'],
      safe: ['Low solar activity', 'Stable ionosphere'],
      notSafe: ['High solar activity', 'Enhanced drag'],
      alerts: [],
      color: '#eab308',
      animationType: 'particle'
    },
    {
      name: 'Ap Index',
      fullForm: 'Planetary Ap Index',
      value: geomagneticData?.indices?.Ap ?? null,
      unit: '',
      range: { min: 0, max: 400 },
      average: 10,
      limit: { normal: 15, warning: 30, danger: 50 },
      definition: 'Daily average of geomagnetic activity. Higher values mean more active day.',
      detailedInfo: 'Average of 8 Kp values per day. Values above 30 mean active day, above 50 mean very active day with possible storms.',
      graphData: (() => {
        // Use Ap data from kp_data if available (Ap comes with Kp data)
        if (geomagneticData?.kp_data?.data) {
          const kpData = Array.isArray(geomagneticData.kp_data.data) 
            ? geomagneticData.kp_data.data
            : (geomagneticData.kp_data.data?.toArray?.() || []);
          
          return kpData
            .slice(-24)
            .map((row: any) => {
              // Prefer actual Ap value, fallback to Kp*10 conversion
              let apVal = null;
              if (row?.ap !== null && row?.ap !== undefined) {
                apVal = typeof row.ap === 'number' ? row.ap : parseFloat(row.ap);
              } else if (row?.kp !== null && row?.kp !== undefined) {
                const kpVal = typeof row.kp === 'number' ? row.kp : parseFloat(row.kp);
                // Convert Kp to approximate Ap using standard conversion
                if (!isNaN(kpVal)) {
                  const kpToAp: { [key: number]: number } = {
                    0: 0, 1: 3, 2: 7, 3: 15, 4: 27, 5: 48, 6: 80, 7: 140, 8: 240, 9: 400
                  };
                  const kpInt = Math.round(kpVal);
                  apVal = kpToAp[kpInt] ?? (kpVal * 10);
                }
              }
              const timestamp = row?.timestamp || row?.time_tag;
              if (apVal === null || isNaN(apVal) || !timestamp) return null;
              return {
                time: new Date(timestamp).toLocaleTimeString(),
                value: apVal
              };
            })
            .filter((d: any) => d !== null && d.value !== null);
        }
        return [];
      })(),
      effects: ['Daily activity level', 'Aurora chances'],
      causes: ['Solar wind activity', 'CME impacts'],
      safe: ['Quiet day', 'Low activity'],
      notSafe: ['Active day', 'Possible storms'],
      alerts: [],
      color: '#fb923c',
      animationType: 'ap_index',  // Unique animation type for Ap
      kp: geomagneticData?.indices?.Kp,
      dst: geomagneticData?.indices?.Dst,
      ap: geomagneticData?.indices?.Ap ?? (() => {
        // Try to get Ap from kp_data if available
        if (geomagneticData?.kp_data?.data) {
          const kpData = Array.isArray(geomagneticData.kp_data.data) 
            ? geomagneticData.kp_data.data
            : (geomagneticData.kp_data.data?.toArray?.() || []);
          if (kpData.length > 0) {
            const lastRow = kpData[kpData.length - 1];
            if (lastRow?.ap !== null && lastRow?.ap !== undefined) {
              return typeof lastRow.ap === 'number' ? lastRow.ap : parseFloat(lastRow.ap);
            }
          }
        }
        return null;
      })()
    },
    {
      name: 'Sun Activity',
      fullForm: 'Aditya L1 Solar Activity Monitoring',
      value: (Array.isArray(solarFlaresData?.data) ? solarFlaresData.data.length : 0) + (lascoImages?.data?.length ?? lascoImages?.images?.length ?? 0) + (suviImages?.data?.length ?? suviImages?.images?.length ?? 0),
      unit: ' sources',
      range: { min: 0, max: 30 },
      average: 10,
      limit: { normal: 15, warning: 20, danger: 25 },
      definition: 'Real-time solar activity data from Aditya L1 mission. Shows solar flares, coronal mass ejections, and active regions.',
      detailedInfo: 'Combined data from Aditya L1\'s multiple instruments: Solar Flare Monitor, Coronagraph, and Extreme UV Imager. Provides comprehensive view of solar activity.',
      graphData: [], // No graph for Sun Activity
      effects: ['CME detection', 'Flare monitoring', 'Space weather prediction'],
      causes: ['Solar eruptions', 'Active regions', 'Magnetic reconnection'],
      safe: ['Quiet Sun', 'Low activity'],
      notSafe: ['Active regions', 'CME detected', 'Flare activity'],
      alerts: [],
      color: '#dc2626',
      animationType: 'image'
    }
  ];

  const currentParam = parameters[selectedParam];

  // Initial data fetch (only once on mount)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Critical data - fetch first (blocking)
        const [realtime, geomagnetic, alerts, flares, particle] = await Promise.allSettled([
          api.getRealtimeData(),
          api.getLiveGeomagneticStorm(),
          api.getSpaceWeatherAlerts(),
          api.getSolarFlaresData(),
          api.getParticleData('7d'), // Fetch 7-day data for graphs
        ]);
        
        // Images - fetch in background (non-blocking, don't wait)
        // This prevents timeout from blocking the UI
        Promise.allSettled([
          api.getImageSequenceForGif('lasco-c3', 5),
          api.getImageSequenceForGif('suvi-094', 5)
        ]).then(([lasco, suvi]) => {
          if (lasco.status === 'fulfilled') {
            setLascoImages(lasco.value);
            console.log('✅ LASCO images:', lasco.value);
          } else {
            console.debug('⚠️ LASCO images failed (non-critical):', lasco.reason);
          }
          if (suvi.status === 'fulfilled') {
            setSuviImages(suvi.value);
            console.log('✅ SUVI images:', suvi.value);
          } else {
            console.debug('⚠️ SUVI images failed (non-critical):', suvi.reason);
          }
        }).catch(err => {
          console.debug('⚠️ Image fetching error (non-critical):', err);
        });

        if (realtime.status === 'fulfilled') {
          setRealtimeData(realtime.value);
          console.log('✅ Realtime data:', realtime.value);
        } else {
          console.warn('❌ Realtime data failed:', realtime.reason);
        }
        if (geomagnetic.status === 'fulfilled') {
          setGeomagneticData(geomagnetic.value);
          console.log('✅ Geomagnetic data:', geomagnetic.value);
        } else {
          console.warn('❌ Geomagnetic data failed:', geomagnetic.reason);
        }
        if (alerts.status === 'fulfilled') setAlertsData(alerts.value);
        if (flares.status === 'fulfilled') {
          setSolarFlaresData(flares.value);
          console.log('✅ Solar flares data:', flares.value);
        } else {
          console.warn('❌ Solar flares failed:', flares.reason);
        }
        if (particle.status === 'fulfilled') {
          setParticleData(particle.value);
          console.log('✅ Particle data (7-day):', particle.value);
        } else {
          console.warn('❌ Particle data failed:', particle.reason);
        }
        // Images are handled separately in background (see above)

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Real-time chart updates (NO page reload, only update values)
  useEffect(() => {
    if (loading) return; // Don't update while initial load
    
    const updateChartData = async () => {
      try {
        // Fast endpoint - only latest values, no history
        const latest = await api.getRealtimeLatest();
        
        if (latest?.success && realtimeData) {
          // Update realtimeData with new latest values (for parameter display)
          // This updates the values WITHOUT triggering full page reload
          setRealtimeData((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              speed: latest.speed ?? prev?.speed,
              density: latest.density ?? prev?.density,
              temperature: latest.temperature ?? prev?.temperature,
              bz: latest.bz ?? prev?.bz,
              bt: latest.bt ?? prev?.bt,
              lon: latest.lon ?? prev?.lon,
              lat: latest.lat ?? prev?.lat,
              // Update history with new point (keep last 24 points for chart)
              history: prev.history ? {
                ...prev.history,
                timestamps: [...(prev.history.timestamps || []).slice(-23), new Date().toISOString()],
                speed: [...(prev.history.speed || []).slice(-23), latest.speed ?? prev.speed],
                density: [...(prev.history.density || []).slice(-23), latest.density ?? prev.density],
                temperature: [...(prev.history.temperature || []).slice(-23), latest.temperature ?? prev.temperature],
              } : prev.history,
            };
          });
        }
      } catch (error) {
        // Silent fail - don't break the UI
        console.debug('Chart update failed (non-critical):', error);
      }
    };
    
    // Update charts every 15 seconds (fast, no reload, no loading state)
    const interval = setInterval(updateChartData, 15000);
    return () => clearInterval(interval);
  }, [loading, realtimeData]);

  // Show alerts as toasts
  useEffect(() => {
    if (alertsData?.success && alertsData?.data?.length > 0) {
      alertsData.data.slice(0, 3).forEach((alert: any) => {
        const message = alert.message || alert.description || 'Space weather alert';
        const isCritical = message.toLowerCase().includes('warning') || message.toLowerCase().includes('storm');
        
        toast[isCritical ? 'error' : 'warning'](message, {
          description: `${alert.issue_datetime || 'Current'}`,
          duration: 10000
        });
      });
    }
  }, [alertsData]);

  // Auto-rotate removed - user controls parameter selection manually

  // Navigation handlers
  const handlePrevious = () => {
    setSelectedParam((prev) => (prev - 1 + parameters.length) % parameters.length);
  };

  const handleNext = () => {
    setSelectedParam((prev) => (prev + 1) % parameters.length);
  };

  // Get dynamic info for current parameter
  const dynamicInfo = getDynamicParameterInfo(currentParam);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Loading real-time space weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-4 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="max-w-[1800px] mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Phase 1: Live Space Weather Data
          </h1>
          <p className="text-slate-400 text-lg">Scientist-Grade Real-Time Analysis & Visualization</p>
        </motion.div>

        {/* 4-Grid Layout - Special layout for Sun Activity */}
        {currentParam.name === 'Sun Activity' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grid 1: Aditya L1 Information */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="bg-slate-900/80 backdrop-blur border-slate-700 h-[650px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Aditya L1 Mission - Instrument Information
                  </CardTitle>
                  <CardDescription>Complete details about Aditya L1's solar monitoring instruments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto max-h-[530px]">
                  {/* Coronagraph Info */}
                  <div className="p-4 bg-blue-950/30 border border-blue-800/30 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Aditya L1 Coronagraph</h3>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>Purpose:</strong> Detects Coronal Mass Ejections (CMEs) by blocking the bright Sun's disk to see the faint corona.
                    </p>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>How it works:</strong> Uses an occulting disk to block direct sunlight, revealing the Sun's outer atmosphere where CMEs originate.
                    </p>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>What it shows:</strong> Real-time images of CMEs leaving the Sun, their size, speed, and direction towards Earth.
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Why it matters:</strong> Early warning system for space weather events that can affect satellites, power grids, and communications.
                    </p>
                  </div>

                  {/* EUV Imager Info */}
                  <div className="p-4 bg-purple-950/30 border border-purple-800/30 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-400 mb-2">Aditya L1 EUV Imager</h3>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>Purpose:</strong> Monitors the Sun in Extreme Ultraviolet (EUV) light to detect active regions and solar flares.
                    </p>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>How it works:</strong> Captures images at 94 Angstrom wavelength, showing very hot plasma (6 million Kelvin) and magnetic activity.
                    </p>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>What it shows:</strong> Active regions on the Sun, flare locations, and hot plasma structures that can produce CMEs.
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Why it matters:</strong> Helps predict solar flares and CMEs before they happen, giving advance warning for space weather.
                    </p>
                  </div>

                  {/* Flare Monitor Info */}
                  <div className="p-4 bg-orange-950/30 border border-orange-800/30 rounded-lg">
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">Aditya L1 Flare Monitor</h3>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>Purpose:</strong> Detects and classifies solar flares in real-time based on their X-ray intensity.
                    </p>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>How it works:</strong> Monitors X-ray emissions from the Sun, classifying flares as C (small), M (medium), or X (large) class.
                    </p>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>What it shows:</strong> Flare start time, peak time, location on Sun, and intensity class.
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Why it matters:</strong> X-class flares can cause radio blackouts, radiation storms, and often produce CMEs that affect Earth.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Grid 2: Coronagraph Images/GIFs */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-900/80 backdrop-blur border-slate-700 h-[650px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Aditya L1 Coronagraph
                  </CardTitle>
                  <CardDescription>CME Detection Images & Animations</CardDescription>
                </CardHeader>
                <CardContent className="h-[550px] overflow-auto">
                  {/* Priority: Show GIFs/Movies first if available */}
                  {lascoImages?.gifs && Object.keys(lascoImages.gifs).length > 0 ? (
                    <div className="space-y-4">
                      {lascoImages.gifs.movie_24h && (
                        <div className="mb-4">
                          <h4 className="text-xs text-slate-400 mb-2">Live Animation (24h) - Aditya L1 Coronagraph</h4>
                          <img
                            src={lascoImages.gifs.movie_24h}
                            alt="Aditya L1 Coronagraph Animation 24h"
                            className="w-full rounded border border-slate-700 mb-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {lascoImages.gifs.movie_7d && (
                        <div className="mb-4">
                          <h4 className="text-xs text-slate-400 mb-2">Live Animation (7 days) - Aditya L1 Coronagraph</h4>
                          <img
                            src={lascoImages.gifs.movie_7d}
                            alt="Aditya L1 Coronagraph Animation 7d"
                            className="w-full rounded border border-slate-700 mb-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {lascoImages.gifs.movie_mp4_24h && (
                        <div className="mb-4">
                          <h4 className="text-xs text-slate-400 mb-2">Live Video (24h) - Aditya L1 Coronagraph</h4>
                          <video
                            src={lascoImages.gifs.movie_mp4_24h}
                            className="w-full rounded border border-slate-700 mb-2"
                            controls
                            autoPlay
                            loop
                            muted
                            onError={(e) => {
                              (e.target as HTMLVideoElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {lascoImages.gifs.movie_latest && (
                        <div className="mb-4">
                          <h4 className="text-xs text-slate-400 mb-2">Latest Animation - Aditya L1 Coronagraph</h4>
                          <img
                            src={lascoImages.gifs.movie_latest}
                            alt="Aditya L1 Coronagraph Latest"
                            className="w-full rounded border border-slate-700 mb-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                  {lascoImages?.success && (lascoImages?.data || lascoImages?.images) && (lascoImages.data?.length > 0 || lascoImages.images?.length > 0) ? (
                    <div>
                      <h4 className="text-xs text-slate-400 mb-2">Recent Images</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {(lascoImages.data || lascoImages.images)?.slice(0, 6).map((url: string, idx: number) => (
                          <motion.img
                            key={idx}
                            src={url}
                            alt={`Aditya L1 Coronagraph ${idx + 1}`}
                            className="w-full h-24 object-cover rounded border border-slate-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <p className="text-sm">Loading Aditya L1 Coronagraph data...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Grid 3: EUV Images/GIFs */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-slate-900/80 backdrop-blur border-slate-700 h-[650px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Aditya L1 EUV Imager
                  </CardTitle>
                  <CardDescription>Active Region Monitoring</CardDescription>
                </CardHeader>
                <CardContent className="h-[550px] overflow-auto">
                  {/* Priority: Show GIFs/Movies first if available */}
                  {suviImages?.gifs && Object.keys(suviImages.gifs).length > 0 ? (
                    <div className="space-y-4">
                      {/* Check if URL is PHP page (star.nesdis.noaa.gov) - use iframe */}
                      {Object.entries(suviImages.gifs).map(([key, url]: [string, any]) => {
                        const isPhpPage = typeof url === 'string' && url.includes('star.nesdis.noaa.gov') && url.includes('.php');
                        
                        if (isPhpPage) {
                          // PHP page - can't embed, skip it (no clickable links)
                          return null;
                        } else if (url.includes('.mp4')) {
                          // MP4 video
                          return (
                            <div key={key} className="mb-4">
                              <h4 className="text-xs text-slate-400 mb-2">Live Video - Aditya L1 EUV Imager</h4>
                              <video
                                src={url}
                                className="w-full rounded border border-slate-700 mb-2"
                                controls
                                autoPlay
                                loop
                                muted
                                onError={(e) => {
                                  (e.target as HTMLVideoElement).style.display = 'none';
                                }}
                              />
                            </div>
                          );
                        } else {
                          // Regular GIF image
                          return (
                            <div key={key} className="mb-4">
                              <h4 className="text-xs text-slate-400 mb-2">Live Animation - Aditya L1 EUV Imager</h4>
                              <img
                                src={url}
                                alt={`Aditya L1 EUV Animation ${key}`}
                                className="w-full rounded border border-slate-700 mb-2"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          );
                        }
                      })}
                    </div>
                  ) : null}
                  {suviImages?.success && (suviImages?.data || suviImages?.images) && (suviImages.data?.length > 0 || suviImages.images?.length > 0) ? (
                    <div>
                      <h4 className="text-xs text-slate-400 mb-2">Recent Images</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {(suviImages.data || suviImages.images)?.slice(0, 6).map((url: string, idx: number) => (
                          <motion.img
                            key={idx}
                            src={url}
                            alt={`Aditya L1 EUV ${idx + 1}`}
                            className="w-full h-24 object-cover rounded border border-slate-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <p className="text-sm">Loading Aditya L1 EUV Imager data...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Grid 4: Flare Monitor */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="bg-slate-900/80 backdrop-blur border-slate-700 h-[650px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Aditya L1 Flare Monitor
                  </CardTitle>
                  <CardDescription>Real-time Solar Flare Detection</CardDescription>
                </CardHeader>
                <CardContent className="h-[550px] overflow-auto">
                  {/* Show flare GIFs if available */}
                  {solarFlaresData?.gifs && Object.keys(solarFlaresData.gifs).length > 0 ? (
                    <div className="mb-4">
                      {solarFlaresData.gifs.flare_animation && (
                        <div className="mb-4">
                          <h4 className="text-xs text-slate-400 mb-2">Solar Flare Animation</h4>
                          <img
                            src={solarFlaresData.gifs.flare_animation}
                            alt="Solar Flare Animation"
                            className="w-full rounded border border-slate-700 mb-2"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {Object.entries(solarFlaresData.gifs).map(([key, url]: [string, any]) => {
                        if (key === 'flare_animation') return null;
                        
                        const isPhpPage = typeof url === 'string' && url.includes('star.nesdis.noaa.gov') && url.includes('.php');
                        
                        // Skip PHP pages - can't embed, no clickable links
                        if (isPhpPage) {
                          return null;
                        }
                        
                        // Only show direct GIF/MP4/image files
                        if (typeof url === 'string' && (url.includes('.gif') || url.includes('.mp4') || url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg'))) {
                          return (
                            <div key={key} className="mb-4">
                              <h4 className="text-xs text-orange-400 mb-2 font-semibold">
                                Flare Animation: {key}
                              </h4>
                              {url.includes('.mp4') ? (
                                <video
                                  src={url}
                                  className="w-full rounded border border-slate-700 mb-2"
                                  controls
                                  autoPlay
                                  loop
                                  muted
                                  onError={(e) => {
                                    (e.target as HTMLVideoElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <img
                                  src={url}
                                  alt={`Flare Animation ${key}`}
                                  className="w-full rounded border border-slate-700 mb-2"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                          );
                        }
                        
                        // Skip everything else (no links)
                        return null;
                      })}
                    </div>
                  ) : null}
                  {solarFlaresData?.success && Array.isArray(solarFlaresData?.data) && solarFlaresData.data.length > 0 ? (
                    <div className="space-y-3">
                      {solarFlaresData.data.slice(0, 10).map((flare: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-4 bg-slate-800/50 rounded-lg border border-orange-500/30"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Flame className="h-5 w-5 text-orange-400" />
                            <span className="text-lg font-semibold text-orange-400">
                              {flare.class || flare.flare_class || flare.xray_class || 'Unknown'} Class Flare
                            </span>
                            {flare.source && (
                              <span className="text-xs text-slate-500">{flare.source}</span>
                            )}
                            <span className="text-xs text-slate-500 ml-auto">
                              {flare.begin_time || flare.begin || flare.peak_time || flare.peak || flare.time_tag || flare.time || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400 space-y-1">
                            {flare.peak_time && (
                              <div>
                                <span className="text-slate-500">Peak:</span> {flare.peak_time || flare.peak || flare.max_time}
                              </div>
                            )}
                            {flare.end_time && (
                              <div>
                                <span className="text-slate-500">End:</span> {flare.end_time || flare.end}
                              </div>
                            )}
                            {(flare.source_location || flare.location || flare.active_region) && (
                              <div>
                                <span className="text-slate-500">Location:</span> {flare.source_location || flare.location || flare.active_region}
                              </div>
                            )}
                            {flare.region && <div>Active Region: {flare.region}</div>}
                            {flare.intensity && <div>Intensity: {flare.intensity}</div>}
                            {flare.flux && <div>X-ray Flux: {flare.flux.toExponential(2)}</div>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Flame className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Loading Aditya L1 Flare Monitor data...</p>
                        {solarFlaresData && !solarFlaresData.success && (
                          <p className="text-xs text-red-400 mt-2">Error: {solarFlaresData.error || 'Failed to fetch flare data'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grid 1: Parameter Info with Navigation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-900/80 backdrop-blur border-slate-700 h-[650px] flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    onClick={handlePrevious}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <CardTitle className="text-2xl text-center flex-1">
                    {currentParam.name}
                  </CardTitle>
                  
                  <Button
                    onClick={handleNext}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-slate-800"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                <CardDescription className="text-center text-base">
                  {currentParam.fullForm}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 overflow-y-auto flex-1">
                {/* Current Value */}
                <div className="text-center p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Current Value</div>
                  <div className="text-5xl font-bold" style={{ color: currentParam.color }}>
                    {currentParam.value !== null ? currentParam.value.toFixed(currentParam.unit === 'nT' ? 1 : currentParam.unit === 'km/s' || currentParam.unit === 'K' ? 0 : 2) : 'N/A'} 
                    <span className="text-2xl ml-2">{currentParam.unit}</span>
                  </div>
                  <Badge 
                    className="mt-2"
                    variant={dynamicInfo.status === 'danger' ? 'destructive' : dynamicInfo.status === 'warning' ? 'default' : 'secondary'}
                  >
                    {dynamicInfo.statusMessage}
                  </Badge>
                </div>

                {/* Parameter Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Range:</span>
                    <span>{currentParam.range.min} - {currentParam.range.max} {currentParam.unit}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Average:</span>
                    <span>{currentParam.average.toFixed(currentParam.unit === 'K' ? 0 : 1)} {currentParam.unit}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                    <span className="text-slate-400">Normal Limit:</span>
                    <span>{currentParam.limit.normal} {currentParam.unit}</span>
                  </div>
                </div>

                {/* Definition */}
                <div className="p-3 bg-blue-950/30 border border-blue-800/30 rounded-lg">
                  <div className="text-xs text-blue-400 mb-1 font-semibold">DEFINITION</div>
                  <div className="text-sm text-slate-300">{currentParam.definition}</div>
                </div>

                {/* Detailed Info */}
                <div className="p-3 bg-purple-950/30 border border-purple-800/30 rounded-lg">
                  <div className="text-xs text-purple-400 mb-1 font-semibold">TECHNICAL DETAILS</div>
                  <div className="text-sm text-slate-300">{currentParam.detailedInfo}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Grid 2: Real-time Graph - Hidden for Sun Activity */}
          {currentParam.name !== 'Sun Activity' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-900/80 backdrop-blur border-slate-700 h-[650px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Real-Time Graph
                  </CardTitle>
                  <CardDescription>Last 24 hours of {currentParam.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentParam.graphData && currentParam.graphData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={500}>
                      <LineChart data={currentParam.graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #475569',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={currentParam.color}
                          strokeWidth={2}
                          name={`${currentParam.name} (${currentParam.unit})`}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[500px] flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No graph data available for this parameter</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Grid 3: Animations/Images - Hidden for Sun Activity */}
          {currentParam.name !== 'Sun Activity' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
            <Card className="bg-slate-900/80 backdrop-blur border-slate-700 h-[650px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentParam.animationType === 'image' ? <ImageIcon className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                  {currentParam.animationType === 'image' ? 'Live Images' : '3D Visualization'}
                </CardTitle>
                <CardDescription>
                  {currentParam.animationType === 'image' 
                    ? `Real-time ${currentParam.name} images` 
                    : 'Parameter-specific animation'}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[550px]">
                {currentParam.animationType === 'image' && currentParam.name === 'Sun Activity' ? (
                  <div className="w-full h-full bg-slate-950/50 rounded-lg overflow-hidden relative">
                    <div className="h-full flex flex-col">
                      {/* Tabs */}
                      <div className="flex border-b border-slate-700">
                        <button
                          onClick={() => setSunActivityTab('coronagraph')}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            sunActivityTab === 'coronagraph' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          Aditya L1 Coronagraph
                        </button>
                        <button
                          onClick={() => setSunActivityTab('euv')}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            sunActivityTab === 'euv' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          Aditya L1 EUV Imager
                        </button>
                        <button
                          onClick={() => setSunActivityTab('flares')}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            sunActivityTab === 'flares' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          Flare Monitor
                        </button>
                      </div>
                      
                      {/* Content Area - Show selected tab */}
                      <div className="flex-1 overflow-auto p-2">
                        {sunActivityTab === 'coronagraph' && (
                          lascoImages?.success && (lascoImages?.data || lascoImages?.images) && ((lascoImages.data || lascoImages.images)?.length > 0) ? (
                            <div className="h-full flex flex-col">
                              {/* Animated Image Carousel - Cycles through images */}
                              <div className="flex-1 mb-4 bg-black rounded-lg overflow-hidden relative">
                                <ImageCarousel 
                                  images={(lascoImages.data || lascoImages.images)?.slice(0, 20) || []}
                                  interval={2000}
                                  alt="Aditya L1 Coronagraph Animation"
                                />
                              </div>
                              
                              {/* Recent Images Grid */}
                              <div>
                                <h4 className="text-xs text-slate-400 mb-2">Recent Images</h4>
                                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                  {(lascoImages.data || lascoImages.images)?.slice(0, 6).map((url: string, idx: number) => (
                                    <motion.img
                                      key={idx}
                                      src={url}
                                      alt={`Aditya L1 Coronagraph ${idx + 1}`}
                                      className="w-full h-20 object-cover rounded border border-slate-700"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: idx * 0.1 }}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                              <p className="text-sm">Aditya L1 Coronagraph data loading...</p>
                            </div>
                          )
                        )}
                        
                        {sunActivityTab === 'euv' && (
                          suviImages?.success && (suviImages?.data || suviImages?.images) && ((suviImages.data || suviImages.images)?.length > 0) ? (
                            <div className="h-full flex flex-col">
                              {/* Animated Image Carousel - Cycles through images */}
                              <div className="flex-1 mb-4 bg-black rounded-lg overflow-hidden relative">
                                <ImageCarousel 
                                  images={(suviImages.data || suviImages.images)?.slice(0, 20) || []}
                                  interval={2000}
                                  alt="Aditya L1 EUV Animation"
                                />
                              </div>
                              
                              {/* Recent Images Grid */}
                              <div>
                                <h4 className="text-xs text-slate-400 mb-2">Recent Images</h4>
                                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                  {(suviImages.data || suviImages.images)?.slice(0, 6).map((url: string, idx: number) => (
                                    <motion.img
                                      key={idx}
                                      src={url}
                                      alt={`Aditya L1 EUV ${idx + 1}`}
                                      className="w-full h-20 object-cover rounded border border-slate-700"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: idx * 0.1 }}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                              <p className="text-sm">Aditya L1 EUV Imager data loading...</p>
                            </div>
                          )
                        )}
                        
                        {sunActivityTab === 'flares' && (
                          solarFlaresData?.success && solarFlaresData?.data && solarFlaresData.data.length > 0 ? (
                            <div>
                              <h4 className="text-xs text-slate-400 mb-2">Aditya L1 Flare Monitor</h4>
                              <div className="space-y-2">
                                {solarFlaresData.data.slice(0, 8).map((flare: any, idx: number) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-3 bg-slate-800/50 rounded border border-orange-500/30"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Flame className="h-4 w-4 text-orange-400" />
                                      <span className="text-sm font-semibold text-orange-400">
                                        {flare.class || flare.flare_class || flare.xray_class || 'Unknown'} Class Flare
                                      </span>
                                      {flare.source && (
                                        <span className="text-xs text-slate-500 ml-auto">{flare.source}</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-400 space-y-1">
                                      <div>
                                        <span className="text-slate-500">Start:</span> {flare.begin_time || flare.begin || flare.time_tag || flare.time || 'Unknown'}
                                      </div>
                                      {flare.peak_time && (
                                        <div>
                                          <span className="text-slate-500">Peak:</span> {flare.peak_time || flare.peak || flare.max_time}
                                        </div>
                                      )}
                                      {flare.end_time && (
                                        <div>
                                          <span className="text-slate-500">End:</span> {flare.end_time || flare.end}
                                        </div>
                                      )}
                                      {flare.source_location && (
                                        <div>
                                          <span className="text-slate-500">Location:</span> {flare.source_location || flare.location || flare.active_region}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                              <p className="text-sm">Aditya L1 Flare Monitor data loading...</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-950/50 rounded-lg overflow-hidden">
                    <ParameterSpecificAnimation
                      parameterName={currentParam.name}
                      value={currentParam.value}
                      animationType={currentParam.animationType}
                      lon={currentParam.lon}
                      lat={currentParam.lat}
                      density={currentParam.density}
                      temperature={currentParam.temperature}
                      bz={currentParam.bz}
                      bt={currentParam.bt}
                      bx={currentParam.bx}
                      by={currentParam.by}
                      kp={currentParam.kp}
                      dst={currentParam.dst}
                      ap={currentParam.ap}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          )}

          {/* Grid 4: Effects & Safety (Dynamic based on current value) - Hidden for Sun Activity */}
          {currentParam.name !== 'Sun Activity' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
            <Card className="bg-slate-900/80 backdrop-blur border-slate-700 h-[650px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Effects & Safety Analysis
                </CardTitle>
                <CardDescription>Based on current value: {currentParam.value !== null ? `${currentParam.value.toFixed(1)} ${currentParam.unit}` : 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto max-h-[530px]">
                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg">
                  <span className="font-semibold">Status:</span>
                  <Badge 
                    variant={dynamicInfo.status === 'danger' ? 'destructive' : dynamicInfo.status === 'warning' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {dynamicInfo.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Effects */}
                {dynamicInfo.effects && dynamicInfo.effects.length > 0 && (
                  <div className="p-3 bg-orange-950/30 border border-orange-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-orange-400" />
                      <div className="text-sm font-semibold text-orange-400">CURRENT EFFECTS</div>
                    </div>
                    <ul className="space-y-2">
                      {dynamicInfo.effects.map((effect, idx) => {
                        const getIcon = (text: string) => {
                          const lower = text.toLowerCase();
                          if (lower.includes('power') || lower.includes('grid') || lower.includes('voltage')) return <Power className="h-4 w-4 text-orange-300" />;
                          if (lower.includes('satellite') || lower.includes('spacecraft')) return <Satellite className="h-4 w-4 text-orange-300" />;
                          if (lower.includes('gps') || lower.includes('navigation') || lower.includes('positioning')) return <Navigation className="h-4 w-4 text-orange-300" />;
                          if (lower.includes('radio') || lower.includes('communication') || lower.includes('hf')) return <Radio className="h-4 w-4 text-orange-300" />;
                          if (lower.includes('aurora') || lower.includes('northern lights')) return <Sparkles className="h-4 w-4 text-orange-300" />;
                          if (lower.includes('ionosphere') || lower.includes('tec')) return <Zap className="h-4 w-4 text-orange-300" />;
                          return <Activity className="h-4 w-4 text-orange-300" />;
                        };
                        return (
                          <li key={idx} className="text-sm text-slate-300 pl-4 border-l-2 border-orange-700 flex items-start gap-2">
                            <span className="mt-0.5">{getIcon(effect)}</span>
                            <span>{effect}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Not Safe Conditions */}
                {dynamicInfo.notSafe && dynamicInfo.notSafe.length > 0 && (
                  <div className="p-3 bg-red-950/30 border border-red-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <div className="text-sm font-semibold text-red-400">PRECAUTIONS REQUIRED</div>
                    </div>
                    <ul className="space-y-2">
                      {dynamicInfo.notSafe.map((item, idx) => {
                        const getIcon = (text: string) => {
                          const lower = text.toLowerCase();
                          if (lower.includes('power') || lower.includes('grid')) return <Power className="h-4 w-4 text-red-300" />;
                          if (lower.includes('satellite') || lower.includes('spacecraft')) return <Satellite className="h-4 w-4 text-red-300" />;
                          if (lower.includes('gps') || lower.includes('navigation')) return <Navigation className="h-4 w-4 text-red-300" />;
                          if (lower.includes('radio') || lower.includes('communication')) return <Radio className="h-4 w-4 text-red-300" />;
                          if (lower.includes('aviation') || lower.includes('aircraft')) return <Navigation className="h-4 w-4 text-red-300" />;
                          return <AlertTriangle className="h-4 w-4 text-red-300" />;
                        };
                        return (
                          <li key={idx} className="text-sm text-slate-300 pl-4 border-l-2 border-red-700 flex items-start gap-2">
                            <span className="mt-0.5">{getIcon(item)}</span>
                            <span>{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Safe Conditions */}
                {dynamicInfo.safe && dynamicInfo.safe.length > 0 && (
                  <div className="p-3 bg-green-950/30 border border-green-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-green-400" />
                      <div className="text-sm font-semibold text-green-400">SAFE CONDITIONS</div>
                    </div>
                    <ul className="space-y-2">
                      {dynamicInfo.safe.map((item, idx) => {
                        const getIcon = (text: string) => {
                          const lower = text.toLowerCase();
                          if (lower.includes('power') || lower.includes('grid')) return <Power className="h-4 w-4 text-green-300" />;
                          if (lower.includes('satellite')) return <Satellite className="h-4 w-4 text-green-300" />;
                          if (lower.includes('gps') || lower.includes('navigation')) return <Navigation className="h-4 w-4 text-green-300" />;
                          if (lower.includes('radio') || lower.includes('communication')) return <Radio className="h-4 w-4 text-green-300" />;
                          return <Activity className="h-4 w-4 text-green-300" />;
                        };
                        return (
                          <li key={idx} className="text-sm text-slate-300 pl-4 border-l-2 border-green-700 flex items-start gap-2">
                            <span className="mt-0.5">{getIcon(item)}</span>
                            <span>{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Scientific Details */}
                {dynamicInfo.scientificDetails && dynamicInfo.scientificDetails.length > 0 && (
                  <div className="p-3 bg-blue-950/30 border border-blue-800/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="h-4 w-4 text-blue-400" />
                      <div className="text-sm font-semibold text-blue-400">SCIENTIFIC ANALYSIS</div>
                    </div>
                    <ul className="space-y-1">
                      {dynamicInfo.scientificDetails.map((detail, idx) => (
                        <li key={idx} className="text-sm text-slate-300 pl-4 border-l-2 border-blue-700">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          )}
        </div>
        )}

        {/* Parameter Selection Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Select Parameter:</span>
            <span className="text-xs text-slate-500">Select any parameter to view</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {parameters.map((param, idx) => (
              <Button
                key={idx}
                onClick={() => setSelectedParam(idx)}
                variant={selectedParam === idx ? 'default' : 'outline'}
                size="sm"
                className={`transition-all ${selectedParam === idx ? 'ring-2 ring-blue-500' : ''}`}
                style={{
                  backgroundColor: selectedParam === idx ? param.color : 'transparent',
                  borderColor: param.color
                }}
              >
                {param.name}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Phase1;
