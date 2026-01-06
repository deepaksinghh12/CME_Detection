/**
 * Phase 3: Live Geomagnetic Storm
 * 
 * Features:
 * - Real-time geomagnetic monitoring
 * - Animation Dashboard
 * - Current storm effects
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Activity, AlertTriangle, TrendingDown, ChevronRight, 
  ChevronLeft, Loader2, Gauge, Zap 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Phase3: React.FC = () => {
  const navigate = useNavigate();
  const [stormData, setStormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStormData = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/geomagnetic/storm/live`);
        const data = await response.json();
        setStormData(data);
      } catch (error) {
        console.error('Error fetching storm data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStormData();
    // REMOVED: Auto-refresh to prevent page reload during presentation
    // const interval = setInterval(fetchStormData, 30000); // Refresh every 30s
    // return () => clearInterval(interval);
  }, []);

  const getStormLevelColor = (level: string) => {
    switch (level) {
      case 'Severe': return 'text-red-400';
      case 'Moderate': return 'text-orange-400';
      case 'Minor': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getStormLevelBadge = (level: string) => {
    switch (level) {
      case 'Severe': return <Badge variant="destructive">Severe</Badge>;
      case 'Moderate': return <Badge variant="default" className="bg-orange-500">Moderate</Badge>;
      case 'Minor': return <Badge variant="default" className="bg-yellow-500">Minor</Badge>;
      default: return <Badge variant="secondary">Quiet</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">Phase 3: Live Geomagnetic Storm</h1>
            <p className="text-slate-300">Real-time geomagnetic monitoring and effects</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/phase2')} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={() => navigate('/phase4')} variant="outline">
              Next Phase <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Current Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Storm Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getStormLevelColor(stormData?.storm_level || 'Quiet')}`}>
                      {stormData?.storm_level || 'Unknown'}
                    </div>
                    <div className="mt-2">
                      {getStormLevelBadge(stormData?.storm_level || 'Quiet')}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Dst Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${
                      stormData?.indices?.Dst && stormData.indices.Dst < -50 ? 'text-red-400' :
                      stormData?.indices?.Dst && stormData.indices.Dst < -30 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {stormData?.indices?.Dst?.toFixed(0) || 'N/A'} nT
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Disturbance storm time</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Kp Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${
                      stormData?.indices?.Kp && stormData.indices.Kp >= 5 ? 'text-red-400' :
                      stormData?.indices?.Kp && stormData.indices.Kp >= 4 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {stormData?.indices?.Kp?.toFixed(1) || 'N/A'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Planetary K-index</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      AE Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-400">
                      {stormData?.indices?.AE?.toFixed(0) || 'N/A'} nT
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Auroral electrojet</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Timeline Chart */}
            {stormData?.timeline && stormData.timeline.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>24-Hour Geomagnetic Timeline</CardTitle>
                  <CardDescription>Real-time geomagnetic indices over the past 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={stormData.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#9ca3af"
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Dst" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Dst (nT)"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Kp" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Kp Index"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Current Effects */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Current Storm Effects
                </CardTitle>
                <CardDescription>Impact assessment based on current geomagnetic conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="font-semibold mb-2">Satellite Operations</div>
                    <div className="text-sm text-slate-300">
                      {stormData?.storm_level === 'Severe' ? 
                        '⚠️ High risk of satellite anomalies' :
                        stormData?.storm_level === 'Moderate' ?
                        '⚡ Moderate risk - monitor closely' :
                        '✅ Normal operations'}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="font-semibold mb-2">Power Grids</div>
                    <div className="text-sm text-slate-300">
                      {stormData?.storm_level === 'Severe' ? 
                        '⚠️ Potential voltage fluctuations' :
                        stormData?.storm_level === 'Moderate' ?
                        '⚡ Monitor grid stability' :
                        '✅ Stable conditions'}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="font-semibold mb-2">Aurora Visibility</div>
                    <div className="text-sm text-slate-300">
                      {stormData?.storm_level === 'Severe' ? 
                        '🌟 Visible at mid-latitudes' :
                        stormData?.storm_level === 'Moderate' ?
                        '🌟 Visible at high latitudes' :
                        '🌟 Limited visibility'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Phase3;

