import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Calculator, RefreshCw, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModelCalculationsViewerProps {
  date?: string; // Date only (YYYY-MM-DD)
  timeRange?: string;
  onClose?: () => void;
}

interface CalculationStep {
  step: string;
  formula: string;
  result: string;
  weight: number;
  contribution: number;
}

interface CalculationPoint {
  timestamp: string;
  raw_data: Record<string, number | null>;
  background_values: Record<string, number>;
  calculations: CalculationStep[];
  indicators: Record<string, number>;
  confidence: number;
  severity: string;
  summary: {
    total_indicators: number;
    active_indicators: string[];
    confidence_score: number;
    severity: string;
  };
}

interface CalculationsData {
  date: string;
  total_data_points: number;
  calculations: CalculationPoint[];
  summary: {
    date: string;
    total_points: number;
    high_severity: number;
    medium_severity: number;
    low_severity: number;
    minor_severity: number;
    avg_confidence: number;
  };
}

const ModelCalculationsViewer: React.FC<ModelCalculationsViewerProps> = ({ 
  date, 
  timeRange = '30d',
  onClose 
}) => {
  const [data, setData] = useState<CalculationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Default to today's date, but don't auto-fetch
  const [selectedDate, setSelectedDate] = useState<string>(date || new Date().toISOString().split('T')[0]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(0);

  const fetchCalculations = async (dateStr: string) => {
    if (!dateStr) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Call the new endpoint with date only (OMNIWeb fetches for any date)
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/model/calculations?date=${encodeURIComponent(dateStr)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch calculations: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
      setSelectedPointIndex(0); // Reset to first data point
    } catch (err) {
      if (err instanceof Error) {
        // Try to extract error message from response
        if (err.message.includes('404')) {
          setError('No data available for this date. OMNIWeb has data from 1963 onwards. Please try a valid date within OMNIWeb\'s range.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to fetch calculations');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Only set initial date from prop, don't auto-fetch
  useEffect(() => {
    if (date) {
      setSelectedDate(date);
      // Don't auto-fetch - user must click Calculate button
    }
  }, [date]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleCalculate = () => {
    if (selectedDate) {
      fetchCalculations(selectedDate);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'medium': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
      case 'low': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
      default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    }
  };

  const currentPoint = data?.calculations[selectedPointIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6"
    >
      <Card className="space-card border-white/10 bg-black/40 backdrop-blur-xl max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Calculator className="h-6 w-6 text-cyan-400" />
                Model Calculations Viewer
              </CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Step-by-step breakdown of how the CME detection model processes raw data for entire day
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Input */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <Button onClick={handleCalculate} disabled={!selectedDate || loading} className="mt-6">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate
            </Button>
          </div>

          {loading && (
            <div className="text-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-gray-400">Calculating...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {data && data.calculations.length > 0 && (
            <div className="space-y-6">
              {/* Day Summary */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Day Summary - {data.date}</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Points</p>
                    <p className="text-2xl font-bold text-cyan-400">{data.summary.total_points}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">High Severity</p>
                    <p className="text-2xl font-bold text-red-400">{data.summary.high_severity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Medium</p>
                    <p className="text-2xl font-bold text-orange-400">{data.summary.medium_severity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Low</p>
                    <p className="text-2xl font-bold text-yellow-400">{data.summary.low_severity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Minor</p>
                    <p className="text-2xl font-bold text-gray-400">{data.summary.minor_severity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Avg Confidence</p>
                    <p className="text-2xl font-bold text-purple-400">{(data.summary.avg_confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Data Point Navigation */}
              {data.calculations.length > 1 && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPointIndex(Math.max(0, selectedPointIndex - 1))}
                    disabled={selectedPointIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Data Point</p>
                    <p className="text-lg font-bold text-white">
                      {selectedPointIndex + 1} / {data.calculations.length}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {currentPoint ? new Date(currentPoint.timestamp).toLocaleString() : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPointIndex(Math.min(data.calculations.length - 1, selectedPointIndex + 1))}
                    disabled={selectedPointIndex === data.calculations.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {currentPoint && (
                <>
                  {/* Current Point Summary */}
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Detection Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Confidence Score</p>
                        <p className="text-2xl font-bold text-cyan-400">{(currentPoint.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Severity</p>
                        <Badge className={getSeverityColor(currentPoint.severity)}>{currentPoint.severity}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Active Indicators</p>
                        <p className="text-2xl font-bold text-green-400">{currentPoint.summary.total_indicators}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Timestamp</p>
                        <p className="text-sm text-gray-300 font-mono">{new Date(currentPoint.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* ALL Raw Data Parameters */}
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Raw Input Data (All {Object.keys(currentPoint.raw_data).length} Parameters)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Object.entries(currentPoint.raw_data).map(([key, value]) => (
                        <div key={key} className="bg-black/40 rounded p-3 border border-white/5">
                          <p className="text-xs text-gray-400 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-sm font-mono text-cyan-400">
                            {value !== null ? (typeof value === 'number' ? value.toFixed(2) : value) : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ALL Background Values */}
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Background (Baseline) Values</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Object.entries(currentPoint.background_values).map(([key, value]) => (
                        <div key={key} className="bg-black/40 rounded p-3 border border-white/5">
                          <p className="text-xs text-gray-400 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-sm font-mono text-purple-400">{value.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step-by-Step Calculations */}
                  {currentPoint.calculations.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Step-by-Step Calculations</h3>
                      <div className="space-y-4">
                        {currentPoint.calculations.map((calc, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-black/40 rounded-lg p-4 border border-white/5"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                                    Step {idx + 1}
                                  </span>
                                  <h4 className="text-sm font-semibold text-white">{calc.step}</h4>
                                </div>
                                <p className="text-sm text-gray-300 font-mono mb-2">{calc.formula}</p>
                                <div className="flex items-center gap-2">
                                  <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/50">
                                    {calc.result}
                                  </Badge>
                                  <span className="text-xs text-gray-400">
                                    Weight: {calc.weight} | Contribution: {(calc.contribution * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Indicators */}
                  {currentPoint.summary.active_indicators.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Active Detection Indicators</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {currentPoint.summary.active_indicators.map((indicator, idx) => (
                          <div key={idx} className="bg-green-500/10 border border-green-500/30 rounded p-3">
                            <p className="text-xs text-gray-400 mb-1 capitalize">{indicator.replace(/_/g, ' ')}</p>
                            <p className="text-sm font-semibold text-green-400">
                              {(currentPoint.indicators[indicator] * 100).toFixed(0)}% contribution
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {data && data.calculations.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>No data available for the selected date</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ModelCalculationsViewer;
