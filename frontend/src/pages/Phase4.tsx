/**
 * Phase 4: Geomagnetic Storm Prediction
 * 
 * Features:
 * - Time Regression model
 * - Storm intensity prediction
 * - Future timeline
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Calendar, ChevronRight, ChevronLeft, 
  Loader2, BarChart3, AlertCircle 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

const Phase4: React.FC = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE_URL}/api/geomagnetic/storm/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            use_real_time: true
          })
        });
        const data = await response.json();
        setPredictions(data);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    // REMOVED: Auto-refresh to prevent page reload during presentation
    // const interval = setInterval(fetchPredictions, 300000); // Refresh every 5 minutes
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
            <h1 className="text-4xl font-bold mb-2">Phase 4: Geomagnetic Storm Prediction</h1>
            <p className="text-slate-300">Time regression forecasting for future storm events</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/phase3')} variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={() => navigate('/phase5')} variant="outline">
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
            {/* Current Status */}
            {predictions?.current_storm_status && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Current Storm Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Storm Level</div>
                      <div className={`text-2xl font-bold ${getStormLevelColor(predictions.current_storm_status.storm_level)}`}>
                        {predictions.current_storm_status.storm_level}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Dst Index</div>
                      <div className="text-2xl font-bold">
                        {predictions.current_storm_status.indices?.Dst?.toFixed(0) || 'N/A'} nT
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Kp Index</div>
                      <div className="text-2xl font-bold">
                        {predictions.current_storm_status.indices?.Kp?.toFixed(1) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prediction Confidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Prediction Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-400">
                    {(predictions?.confidence * 100 || 0).toFixed(0)}%
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    Model Version: {predictions?.model_version || 'N/A'}
                  </p>
                  {predictions?.message && (
                    <p className="text-xs text-yellow-400 mt-2">{predictions.message}</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Forecast Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    Next 7 Days
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    {predictions?.predictions?.length || 0} prediction points
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Forecast Timeline Chart */}
            {predictions?.forecast_timeline && predictions.forecast_timeline.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    7-Day Forecast Timeline
                  </CardTitle>
                  <CardDescription>Predicted Dst and Kp indices over the next week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={predictions.forecast_timeline}>
                      <defs>
                        <linearGradient id="colorDst" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#9ca3af"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="expected_dst" 
                        stroke="#ef4444" 
                        fillOpacity={1}
                        fill="url(#colorDst)"
                        name="Predicted Dst (nT)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expected_kp" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Predicted Kp"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Detailed Predictions */}
            {predictions?.predictions && predictions.predictions.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle>Detailed Predictions</CardTitle>
                  <CardDescription>Day-by-day storm intensity predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.predictions.map((pred: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold mb-2">
                              {new Date(pred.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-slate-400">Dst:</span>{' '}
                                <span className="font-semibold">{pred.predicted_dst?.toFixed(0)} nT</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Kp:</span>{' '}
                                <span className="font-semibold">{pred.predicted_kp?.toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Storm Prob:</span>{' '}
                                <span className="font-semibold">{(pred.storm_probability * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={pred.confidence > 0.7 ? "default" : "secondary"}>
                            {(pred.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Phase4;

