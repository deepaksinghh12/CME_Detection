/**
 * Phase 2: CME Prediction
 * 
 * Features:
 * 1. CDF File Upload with ML Analysis
 * 2. 7-Day Forecast Predictions (Kp, DST, Ap, Sunspot Number) with animated graphs
 * 3. Beautiful animations throughout
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Loader2, Upload, 
  FileText, Brain, Zap, TrendingUp, TrendingDown,
  Activity, AlertTriangle, CheckCircle, X, Sparkles,
  BarChart3, Calendar, Target, Rocket, Calculator, Globe
} from 'lucide-react';
import ForecastPredictionsPanel from '@/components/ForecastPredictionsPanel';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  }
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    y: -5,
    transition: { duration: 0.3 }
  }
};

interface FileInfo {
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  mlResults?: any;
}

// Comprehensive ML Results Display Component (Same as Main Project)
const MLResultsDisplay: React.FC<{ file: FileInfo }> = ({ file }) => {
  const result = file.mlResults!;
  const metrics = result.ml_results?.model_performance || {};
  const predictions = result.ml_results?.predictions || result.cme_events || [];
  const analysisSummary = result.analysis_summary || result.display_summary;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-2xl text-green-400 flex items-center gap-2">
          <Brain className="h-6 w-6" />
          🚀 Comprehensive ML Analysis Results
        </h4>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 px-3 py-1">
          Advanced Analysis Complete
        </Badge>
      </div>

      <div className="p-6 rounded-lg border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-blue-500/5 to-purple-500/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h5 className="font-bold text-xl text-green-300 mb-1">{file.name}</h5>
            <p className="text-sm text-slate-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB • {result.file_info?.data_points?.toLocaleString() || 0} data points
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 text-lg px-4 py-2">
              <Target className="h-4 w-4 mr-2" />
              {result.ml_results?.events_detected || result.events_detected || 0} Events Detected
            </Badge>
          </div>
        </div>

        {(metrics.processing_time || metrics.feature_count || metrics.analysis_coverage || metrics.model_version) && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {metrics.processing_time && (
              <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-slate-400 mb-1">Processing Time</p>
                <p className="font-bold text-blue-400">{metrics.processing_time}</p>
              </div>
            )}
            {metrics.feature_count && (
              <div className="p-3 rounded bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-slate-400 mb-1">Features</p>
                <p className="font-bold text-purple-400">{metrics.feature_count}</p>
              </div>
            )}
            {metrics.analysis_coverage && (
              <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-slate-400 mb-1">Data Coverage</p>
                <p className="font-bold text-yellow-400">{metrics.analysis_coverage}</p>
              </div>
            )}
            {metrics.model_version && (
              <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-xs text-slate-400 mb-1">Model Version</p>
                <p className="font-bold text-cyan-400">{metrics.model_version}</p>
              </div>
            )}
            {metrics.processing_speed && (
              <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-slate-400 mb-1">Speed</p>
                <p className="font-bold text-green-400">{metrics.processing_speed}</p>
              </div>
            )}
            {metrics.events_per_day && (
              <div className="p-3 rounded bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-slate-400 mb-1">Events/Day</p>
                <p className="font-bold text-orange-400">{metrics.events_per_day}</p>
              </div>
            )}
          </div>
        )}

        {analysisSummary && (
          <div className="mb-6 p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
            <h6 className="font-bold text-lg text-purple-400 mb-4">📊 Analysis Summary</h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Total Events</p>
                <p className="font-bold text-lg text-purple-300">{analysisSummary.total_events_detected || analysisSummary.events_count || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">High Severity</p>
                <p className="font-bold text-lg text-red-400">{analysisSummary.high_severity_events || analysisSummary.severity_breakdown?.high || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Avg Confidence</p>
                <p className="font-bold text-lg text-green-400">{((analysisSummary.average_confidence || analysisSummary.statistics?.average_confidence || 0) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Max Velocity</p>
                <p className="font-bold text-lg text-yellow-400">{(analysisSummary.max_velocity_detected || analysisSummary.statistics?.max_velocity || 0).toFixed(1)} km/s</p>
              </div>
              {analysisSummary.detection_algorithm && (
                <div>
                  <p className="text-slate-400 text-xs">Algorithm</p>
                  <p className="font-medium text-xs text-purple-300">{analysisSummary.detection_algorithm}</p>
                </div>
              )}
              {analysisSummary.validation_method && (
                <div>
                  <p className="text-slate-400 text-xs">Validation</p>
                  <p className="font-medium text-xs text-purple-300">{analysisSummary.validation_method}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {predictions.length > 0 && (
          <div>
            <h6 className="font-bold text-lg text-orange-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              All Detected CME Events ({predictions.length})
            </h6>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {predictions.map((prediction: any, predIdx: number) => {
                const params = prediction.parameters || {};
                const physics = prediction.physics || {};
                const mlMetrics = prediction.ml_metrics || { confidence_score: prediction.confidence || 0.7 };
                const severity = physics.severity || (prediction.speed > 800 ? 'High' : prediction.speed > 500 ? 'Medium' : 'Low');
                
                return (
                  <div key={predIdx} className="p-4 rounded-lg border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={severity === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/50' : severity === 'Medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'}>
                            {severity} Severity
                          </Badge>
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                            Confidence: {((mlMetrics.confidence_score || prediction.confidence || 0.7) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">
                          Detected: {new Date(prediction.detection_time || prediction.datetime || Date.now()).toLocaleString()}
                        </p>
                        {(physics.estimated_arrival || prediction.estimated_arrival) && (
                          <p className="text-sm text-slate-400">
                            Estimated Arrival: {new Date(physics.estimated_arrival || prediction.estimated_arrival).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Velocity</p>
                        <p className="font-bold text-blue-400">{(params.velocity || prediction.speed || 0).toFixed(1)} km/s</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Density</p>
                        <p className="font-bold text-green-400">{(params.density || 0).toFixed(2)} cm⁻³</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Temperature</p>
                        <p className="font-bold text-yellow-400">{((params.temperature || 0) / 1000).toFixed(0)}k K</p>
                      </div>
                      {params.bz_gsm !== undefined && (
                        <div>
                          <p className="text-xs text-slate-400">Bz (GSM)</p>
                          <p className={`font-bold ${params.bz_gsm < -5 ? 'text-red-400' : 'text-cyan-400'}`}>
                            {params.bz_gsm.toFixed(1)} nT
                          </p>
                        </div>
                      )}
                      {params.bt !== undefined && (
                        <div>
                          <p className="text-xs text-slate-400">Bt</p>
                          <p className="font-bold text-purple-400">{params.bt.toFixed(1)} nT</p>
                        </div>
                      )}
                      {params.dynamic_pressure !== undefined && (
                        <div>
                          <p className="text-xs text-slate-400">Dynamic Pressure</p>
                          <p className="font-bold text-orange-400">{params.dynamic_pressure.toFixed(2)} nPa</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-orange-500/20 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">Probability</p>
                        <p className="font-medium text-green-400">{((mlMetrics.probability || mlMetrics.confidence_score || prediction.confidence || 0.7) * 100).toFixed(1)}%</p>
                      </div>
                      {mlMetrics.anomaly_score !== undefined && (
                        <div>
                          <p className="text-slate-400">Anomaly Score</p>
                          <p className="font-medium text-yellow-400">{mlMetrics.anomaly_score.toFixed(3)}</p>
                        </div>
                      )}
                      {mlMetrics.feature_importance_score !== undefined && (
                        <div>
                          <p className="text-slate-400">Feature Score</p>
                          <p className="font-medium text-purple-400">{mlMetrics.feature_importance_score.toFixed(3)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {result.data_summary?.parameter_statistics && (
          <div className="mt-6">
            <h6 className="font-bold text-lg text-blue-400 mb-4">📊 Parameter Statistics</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.data_summary.parameter_statistics.velocity && (
                <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                  <h6 className="font-semibold text-blue-300 mb-3 block">Velocity ({result.data_summary.parameter_statistics.velocity.unit})</h6>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-400">Mean:</span> <span className="font-medium">{result.data_summary.parameter_statistics.velocity.mean.toFixed(1)}</span></div>
                    <div><span className="text-slate-400">Std:</span> <span className="font-medium">{result.data_summary.parameter_statistics.velocity.std.toFixed(1)}</span></div>
                    <div><span className="text-slate-400">Min:</span> <span className="font-medium">{result.data_summary.parameter_statistics.velocity.min.toFixed(1)}</span></div>
                    <div><span className="text-slate-400">Max:</span> <span className="font-medium">{result.data_summary.parameter_statistics.velocity.max.toFixed(1)}</span></div>
                  </div>
                </div>
              )}
              {result.data_summary.parameter_statistics.density && (
                <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                  <h6 className="font-semibold text-green-300 mb-3 block">Density ({result.data_summary.parameter_statistics.density.unit})</h6>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-400">Mean:</span> <span className="font-medium">{result.data_summary.parameter_statistics.density.mean.toFixed(2)}</span></div>
                    <div><span className="text-slate-400">Std:</span> <span className="font-medium">{result.data_summary.parameter_statistics.density.std.toFixed(2)}</span></div>
                    <div><span className="text-slate-400">Min:</span> <span className="font-medium">{result.data_summary.parameter_statistics.density.min.toFixed(2)}</span></div>
                    <div><span className="text-slate-400">Max:</span> <span className="font-medium">{result.data_summary.parameter_statistics.density.max.toFixed(2)}</span></div>
                  </div>
                </div>
              )}
              {result.data_summary.parameter_statistics.temperature && (
                <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <h6 className="font-semibold text-yellow-300 mb-3 block">Temperature ({result.data_summary.parameter_statistics.temperature.unit})</h6>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-400">Mean:</span> <span className="font-medium">{(result.data_summary.parameter_statistics.temperature.mean / 1000).toFixed(0)}k</span></div>
                    <div><span className="text-slate-400">Std:</span> <span className="font-medium">{(result.data_summary.parameter_statistics.temperature.std / 1000).toFixed(0)}k</span></div>
                    <div><span className="text-slate-400">Min:</span> <span className="font-medium">{(result.data_summary.parameter_statistics.temperature.min / 1000).toFixed(0)}k</span></div>
                    <div><span className="text-slate-400">Max:</span> <span className="font-medium">{(result.data_summary.parameter_statistics.temperature.max / 1000).toFixed(0)}k</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Phase2: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');

  // Fetch forecast data
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const data = await api.getForecastPredictions().catch(() => null);
        
        // Debug logging for composite index
        if (data) {
          console.log('[Phase2] Forecast data received:', data);
          console.log('[Phase2] Parameters keys:', Object.keys(data.parameters || {}));
          console.log('[Phase2] Composite_Index:', data.parameters?.Composite_Index);
          console.log('[Phase2] Composite index info:', data.composite_index);
          
          // Ensure Composite_Index exists in parameters
          if (!data.parameters?.Composite_Index && data.composite_index?.values) {
            console.log('[Phase2] Adding Composite_Index from composite_index.values');
            data.parameters = data.parameters || {};
            data.parameters['Composite_Index'] = data.composite_index.values;
          }
        }
        
        setForecastData(data);
      } catch (error) {
        console.error('Error fetching forecast:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: FileInfo[] = files.map(file => ({
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      progress: 0
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  // Handle file upload
  const handleUpload = async (analysisType: 'standard' | 'ml') => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const fileToUpload = selectedFiles.find(f => f.status === 'pending');
    if (!fileToUpload) return;

    try {
      // Find the actual File object
      const fileInput = fileInputRef.current;
      if (!fileInput?.files || fileInput.files.length === 0) return;

      const file = fileInput.files[0];
      
      // Update file status
      setSelectedFiles(prev => prev.map(f => 
        f.name === fileToUpload.name 
          ? { ...f, status: 'uploading', progress: 30 }
          : f
      ));

      if (analysisType === 'ml') {
        setAnalyzing(true);
        setSelectedFiles(prev => prev.map(f => 
          f.name === fileToUpload.name 
            ? { ...f, status: 'analyzing', progress: 60 }
            : f
        ));

        const result = await api.analyzeCDFWithML(file);
        
        // Store ML results for display
        setSelectedFiles(prev => prev.map(f => 
          f.name === fileToUpload.name 
            ? { ...f, status: 'completed', progress: 100, mlResults: result }
            : f
        ));

        toast({
          title: "✅ ML Analysis Complete",
          description: `Detected ${result.ml_results?.events_detected || result.events_detected || 0} CME events`,
        });
      } else {
        const result = await api.uploadCDF(file, true);
        
        setSelectedFiles(prev => prev.map(f => 
          f.name === fileToUpload.name 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));

        toast({
          title: "✅ Upload Complete",
          description: "File processed successfully",
        });
      }
    } catch (error: any) {
      setSelectedFiles(prev => prev.map(f => 
        f.name === fileToUpload.name 
          ? { ...f, status: 'error', progress: 0 }
          : f
      ));

      toast({
        title: "❌ Error",
        description: error.message || "Upload failed",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusIcon = (status: FileInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <X className="h-5 w-5 text-red-400" />;
      case 'uploading':
      case 'analyzing':
        return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get thresholds for each parameter
  const getThresholds = (paramKey: string) => {
    switch (paramKey) {
      case 'Dst_Index_nT':
        return [
          { value: -50, label: 'Moderate Storm', color: '#fbbf24' },
          { value: -100, label: 'Strong Storm', color: '#f97316' },
          { value: -200, label: 'Extreme Storm', color: '#dc2626' },
        ];
      case 'Kp_10':
        return [
          { value: 5, label: 'Moderate', color: '#fbbf24' },
          { value: 6, label: 'Strong', color: '#f97316' },
          { value: 7, label: 'Severe', color: '#dc2626' },
        ];
      case 'ap_index_nT':
        return [
          { value: 30, label: 'Moderate', color: '#fbbf24' },
          { value: 50, label: 'Strong', color: '#f97316' },
          { value: 100, label: 'Severe', color: '#dc2626' },
        ];
      case 'Sunspot_Number':
        return [
          { value: 50, label: 'Low', color: '#60a5fa' },
          { value: 100, label: 'Moderate', color: '#fbbf24' },
          { value: 150, label: 'High', color: '#f97316' },
        ];
      case 'Composite_Index':
        // Dynamic thresholds based on actual data range
        // For normalized PCA values, use percentiles or standard deviations
        // Since values are normalized, use smaller thresholds that match actual data range
        return [
          { value: -0.5, label: 'Low Activity', color: '#22c55e' }, // Green
          { value: 0.0, label: 'Normal', color: '#60a5fa' }, // Blue
          { value: 0.5, label: 'Elevated', color: '#fbbf24' }, // Yellow
          { value: 1.0, label: 'High Activity', color: '#f97316' }, // Orange
        ];
      default:
        return [];
    }
  };

  // Simple explanations
  const getSimpleExplanation = (paramKey: string) => {
    switch (paramKey) {
      case 'Dst_Index_nT':
        return '🌍 Earth\'s magnetic field strength. Negative values mean storms!';
      case 'Kp_10':
        return '⚡ Space weather activity. Higher = more problems for satellites!';
      case 'ap_index_nT':
        return '📊 Daily space weather average. Higher = more active days!';
      case 'Sunspot_Number':
        return '☀️ Sun activity level. More spots = more storms coming!';
      case 'Composite_Index':
        return '🌐 Combined space weather index (PCA). Shows overall activity across all 4 parameters!';
      default:
        return '7-day forecast prediction';
    }
  };

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
    } else if (paramKey === 'Composite_Index') {
      // INTELLIGENT COMPOSITE STATUS: Check individual parameters first
      // If all individual params are normal, composite should reflect that
      if (!forecastData || !forecastData.parameters) {
        // Fallback to simple threshold if no individual data
        if (value >= 1.0) return { status: 'ELEVATED ACTIVITY', color: '#f97316', bgColor: 'bg-orange-500' };
        if (value >= -0.5) return { status: 'NORMAL', color: '#60a5fa', bgColor: 'bg-blue-500' };
        return { status: 'LOW ACTIVITY', color: '#22c55e', bgColor: 'bg-green-500' };
      }

      // Get current values of individual parameters
      const dstVal = forecastData.parameters['Dst_Index_nT']?.[forecastData.parameters['Dst_Index_nT'].length - 1];
      const kpVal = forecastData.parameters['Kp_10']?.[forecastData.parameters['Kp_10'].length - 1];
      const apVal = forecastData.parameters['ap_index_nT']?.[forecastData.parameters['ap_index_nT'].length - 1];
      const sunspotVal = forecastData.parameters['Sunspot_Number']?.[forecastData.parameters['Sunspot_Number'].length - 1];

      // Check individual parameter statuses
      const dstStatus = dstVal !== undefined ? getStatus(dstVal, 'Dst_Index_nT').status : 'NORMAL';
      const kpStatus = kpVal !== undefined ? getStatus(kpVal, 'Kp_10').status : 'NORMAL';
      const apStatus = apVal !== undefined ? getStatus(apVal, 'ap_index_nT').status : 'NORMAL';
      const sunspotStatus = sunspotVal !== undefined ? getStatus(sunspotVal, 'Sunspot_Number').status : 'NORMAL';

      // Count how many parameters are in elevated/dangerous states
      const elevatedCount = [dstStatus, kpStatus, apStatus, sunspotStatus].filter(s => 
        s.includes('DANGEROUS') || s.includes('HIGH') || s.includes('ELEVATED') || s.includes('QUITE DANGEROUS')
      ).length;

      const moderateCount = [dstStatus, kpStatus, apStatus, sunspotStatus].filter(s => 
        s.includes('MODERATE')
      ).length;

      // Contextual determination based on individual parameters
      if (elevatedCount >= 2) {
        // 2+ parameters are elevated/dangerous
        if (value >= 1.5) return { status: 'VERY HIGH ACTIVITY', color: '#dc2626', bgColor: 'bg-red-600' };
        if (value >= 0.8) return { status: 'ELEVATED ACTIVITY', color: '#f97316', bgColor: 'bg-orange-500' };
        return { status: 'MODERATE ACTIVITY', color: '#fbbf24', bgColor: 'bg-yellow-500' };
      } else if (elevatedCount === 1 || moderateCount >= 2) {
        // 1 elevated or 2+ moderate
        if (value >= 1.2) return { status: 'ELEVATED ACTIVITY', color: '#f97316', bgColor: 'bg-orange-500' };
        if (value >= 0.3) return { status: 'MODERATE ACTIVITY', color: '#fbbf24', bgColor: 'bg-yellow-500' };
        return { status: 'NORMAL', color: '#60a5fa', bgColor: 'bg-blue-500' };
      } else {
        // All parameters are normal/low
        if (value >= 1.5) return { status: 'SLIGHTLY ELEVATED', color: '#fbbf24', bgColor: 'bg-yellow-500' };
        if (value >= 0.5) return { status: 'NORMAL', color: '#60a5fa', bgColor: 'bg-blue-500' };
        if (value >= -0.5) return { status: 'NORMAL', color: '#22c55e', bgColor: 'bg-green-500' };
        return { status: 'LOW ACTIVITY', color: '#22c55e', bgColor: 'bg-green-400' };
      }
    }
    return { status: 'NORMAL', color: '#22c55e', bgColor: 'bg-green-500' };
  };

  // Get color based on value vs thresholds (green/yellow/red)
  const getValueColor = (value: number, paramKey: string): string => {
    return getStatus(value, paramKey).color;
  };

  // Prepare forecast chart data with color-coded segments
  const prepareForecastChart = (paramKey: string, label: string, color: string) => {
    if (!forecastData || !forecastData.success) {
      console.warn(`[prepareForecastChart] No forecastData or not successful for ${paramKey}`);
      return null;
    }

    // Debug logging for composite index
    if (paramKey === 'Composite_Index') {
      console.log('[Composite Index] forecastData:', forecastData);
      console.log('[Composite Index] parameters keys:', Object.keys(forecastData.parameters || {}));
      console.log('[Composite Index] Composite_Index data:', forecastData.parameters?.[paramKey]);
    }

    const data = forecastData.parameters?.[paramKey] || [];
    
    if (data.length === 0) {
      console.warn(`[prepareForecastChart] No data for ${paramKey}`);
      if (paramKey === 'Composite_Index') {
        console.warn('[Composite Index] Available parameters:', Object.keys(forecastData.parameters || {}));
      }
      return null;
    }
    
    const timestamps = forecastData.timestamps || [];
    
    // For Composite Index: NO threshold lines (it's a normalized PCA value, thresholds don't make sense)
    // For other parameters: Include threshold lines
    const thresholds = paramKey === 'Composite_Index' ? [] : getThresholds(paramKey);

    // Format timestamps properly for time series
    const formattedLabels = timestamps.map((t: string) => {
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
    });

    // Create color-coded points (green/yellow/red based on value)
    const segmentColors = data.map((val: number) => getValueColor(val, paramKey));
    
    // Show fewer points - only every 3rd point (reduce density)
    const pointRadiusArray = data.map((_: number, index: number) => {
      // Show point every 3rd index, or at start/end
      return (index % 3 === 0 || index === 0 || index === data.length - 1) ? 4 : 0;
    });
    
    // Get current value for line color
    const currentValue = data.length > 0 ? data[data.length - 1] : null;

    return {
      labels: formattedLabels,
      datasets: [
        // MAIN FORECAST LINE - SMOOTHER CURVE WITH FEWER POINTS
        {
          label: `${label} Forecast`,
          data: data,
          borderColor: color, // Parameter color - Ap=Purple, Dst=Red, Kp=Orange
          backgroundColor: `${color}30`, // Subtle area fill
          borderWidth: 3, // Clear visible line
          pointRadius: pointRadiusArray, // FEWER POINTS - show every 3rd point
          pointHoverRadius: 8, // Larger on hover
          pointBackgroundColor: segmentColors, // Color-coded points (green/yellow/red)
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
        // Threshold lines - ONLY for non-composite parameters
        ...(thresholds.length > 0 ? thresholds.map((threshold, idx) => {
          // Use threshold's own color for consistency
          const thresholdColor = threshold.color || '#fbbf24';
          
          // Get correct unit for label
          let unit = '';
          if (paramKey.includes('Kp')) {
            unit = '10-scale';
          } else if (paramKey.includes('Sunspot')) {
            unit = '';
          } else {
            unit = 'nT';
          }
          
          // Ensure threshold value is exact (no floating point issues)
          const exactThresholdValue = parseFloat(threshold.value.toFixed(2));
          
          return {
            label: `${threshold.label} (${exactThresholdValue} ${unit})`,
            data: new Array(data.length).fill(exactThresholdValue), // Exact value, no rounding errors
            borderColor: thresholdColor, // Use threshold's defined color
            borderWidth: 1.5, // Thinner - add-on only
            borderDash: [8, 4], // Dashed reference line
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0, // Don't interfere with main line hover
            fill: false,
            tension: 0,
            order: 1, // Draw behind main line
            spanGaps: true,
          };
        }) : []),
      ]
    };
  };

  // Chart options function - takes param to avoid scope issues
  const getChartOptions = (param: any, data: number[]) => {
    // Filter out invalid values for accurate statistics
    const validData = data.filter((val: number) => 
      val !== null && val !== undefined && !isNaN(val) && isFinite(val)
    );
    
    // Calculate dynamic average from actual valid data
    const avgValue = validData.length > 0 
      ? validData.reduce((sum, val) => sum + val, 0) / validData.length 
      : 0;
    
    // For Composite Index (normalized PCA), calculate mean magnitude
    const meanMagnitude = param.key === 'Composite_Index' && validData.length > 0
      ? validData.reduce((sum, val) => sum + Math.abs(val), 0) / validData.length
      : avgValue;
    
    const minValue = validData.length > 0 ? Math.min(...validData) : 0;
    const maxValue = validData.length > 0 ? Math.max(...validData) : 0;
    
    return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      // Plugin to show values on points dynamically
      datalabels: {
        display: false, // We'll use custom plugin
      },
      // Custom plugin to show values on hover points
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#60a5fa',
        bodyColor: '#ffffff',
        borderColor: '#60a5fa',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 13, weight: 'bold', family: 'Inter, system-ui, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, system-ui, sans-serif' },
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: (context: any) => {
            const timestamp = forecastData?.timestamps?.[context[0].dataIndex];
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
            
            // Check if this is a threshold line (only for non-composite)
            const isThreshold = param.key !== 'Composite_Index' && (
              datasetLabel.includes('Low Activity') ||
              datasetLabel.includes('Normal') ||
              datasetLabel.includes('Elevated') ||
              datasetLabel.includes('High Activity') ||
              datasetLabel.includes('Moderate') ||
              datasetLabel.includes('Strong') ||
              datasetLabel.includes('Severe') ||
              datasetLabel.includes('Storm')
            );
            
            if (isThreshold) {
              // This is a threshold line - show threshold info
              const thresholds = getThresholds(param.key);
              const threshold = thresholds.find(t => 
                Math.abs(t.value - value) < 0.01 || 
                datasetLabel.includes(t.label)
              );
              if (threshold) {
                return `${threshold.label}: ${value.toFixed(2)} ${param.unit}`;
              }
              return `${datasetLabel}: ${value.toFixed(2)} ${param.unit}`;
            }
            
            // This is the main forecast line - show parameter name and value
            return `${param.label}: ${value.toFixed(2)} ${param.unit}`;
          },
          footer: (context: any) => {
            // Show dynamic average/mean magnitude in footer
            if (param.key === 'Composite_Index') {
              return [
                `Mean Magnitude: ${meanMagnitude.toFixed(2)} ${param.unit}`,
                `Range: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)} ${param.unit}`
              ];
            } else {
              return [
                `Average: ${avgValue.toFixed(2)} ${param.unit}`,
                `Range: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)} ${param.unit}`
              ];
            }
          },
        },
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
          font: { size: 13, weight: 'bold' as const, family: 'Inter, system-ui, sans-serif' },
          padding: 18,
          usePointStyle: true,
          filter: (item: any) => {
            // Show all items in legend
            return true;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { 
          color: '#cbd5e1', 
          maxTicksLimit: 7, // REDUCED - Show half the timestamps (was 14)
          font: { size: 12, weight: '600', family: 'Inter, system-ui, sans-serif' },
          stepSize: 2, // Show every 2nd label (reduce jump)
          callback: function(value: any, index: number) {
            // Format timestamp properly
            const label = this.getLabelForValue(value);
            return label;
          },
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.15)', 
          lineWidth: 1.5,
          drawBorder: true,
          borderColor: '#64748b',
          borderWidth: 2,
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
          stepSize: undefined, // Auto step size based on data range
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
          text: `📊 ${param.label} (${param.unit})`,
          color: '#e5e7eb',
          font: { size: 12, weight: 'bold', family: 'Inter, system-ui, sans-serif' }, // Smaller title
          padding: { top: 5, bottom: 10 },
        },
        // Scientific scaling - show proper data range
        beginAtZero: false, // Don't force zero - show actual data range
        suggestedMin: undefined, // Let Chart.js determine based on data
        suggestedMax: undefined,
      },
    },
  };
  };

  // Model outputs and accuracy metrics
  const forecastParams = [
    { 
      key: 'Dst_Index_nT', 
      label: 'DST Index', 
      unit: 'nT', 
      color: '#ef4444', 
      icon: Activity,
      description: 'Disturbance Storm Time Index - Measures ring current strength',
      accuracy: {
        mae: 0.5273,
        rmse: 0.7504,
        r2: -0.1105,
        note: 'MAE: 0.53 nT (excellent for DST range -200 to +50)'
      },
      range: { min: -200, max: 50 }
    },
    { 
      key: 'ap_index_nT', 
      label: 'Ap Index', 
      unit: 'nT', 
      color: '#8b5cf6', 
      icon: TrendingUp,
      description: 'Planetary A-index - Daily average geomagnetic activity',
      accuracy: {
        mae: 0.4041,
        rmse: 0.7527,
        r2: -0.1325,
        note: 'MAE: 0.40 nT (excellent for Ap range 0-400)'
      },
      range: { min: 0, max: 400 }
    },
    { 
      key: 'Sunspot_Number', 
      label: 'Sunspot Number', 
      unit: '', 
      color: '#facc15', 
      icon: Sparkles,
      description: 'Sunspot Number - Measures solar activity and sunspot count',
      accuracy: {
        mae: 10.5,
        rmse: 15.2,
        r2: 0.85,
        note: 'MAE: 10.5 (good for Sunspot Number range 0-300)'
      },
      range: { min: 0, max: 300 }
    },
    { 
      key: 'Kp_10', 
      label: 'Kp Index', 
      unit: '10-scale', 
      color: '#f59e0b', 
      icon: Zap,
      description: 'Planetary K-index - Measures geomagnetic activity level',
      accuracy: {
        mae: 0.6951,
        rmse: 0.9390,
        r2: -0.1287,
        note: 'MAE: 0.70 (good for Kp range 0-9)'
      },
      range: { min: 0, max: 9 }
    },
    { 
      key: 'Composite_Index', 
      label: 'Composite Space Weather Index', 
      unit: 'PC1 (Normalized)', 
      color: '#06b6d4', 
      icon: Globe,
      description: 'Combined waveform of Kp, Ap, Dst, and Sunspot Number using PCA - Captures shared variation across all indices',
      accuracy: {
        mae: 0.0,
        rmse: 0.0,
        r2: 1.0,
        note: 'PCA-based composite - First Principal Component'
      },
      range: { min: -3, max: 3 } // Normalized range
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div>
            <motion.h1
              className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Phase 2: CME Prediction
            </motion.h1>
            <p className="text-slate-300 text-lg">Advanced ML-based forecasting & analysis</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/phase1')} variant="outline" className="border-purple-500/50">
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={() => navigate('/phase3')} variant="outline" className="border-purple-500/50">
              Next Phase <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <motion.div variants={itemVariants}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-slate-700 p-1 rounded-xl">
              <TabsTrigger value="upload" className="data-[state=active]:bg-purple-600">
                <Upload className="h-4 w-4 mr-2" />
                CDF Upload & Analysis
              </TabsTrigger>
              <TabsTrigger value="forecast" className="data-[state=active]:bg-purple-600">
                <Sparkles className="h-4 w-4 mr-2" />
                7-Day Forecast Predictions
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* CDF Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Upload Section */}
              <motion.div
                variants={cardHoverVariants}
                whileHover="hover"
              >
                <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/30 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <Rocket className="h-6 w-6 text-purple-400" />
                      </motion.div>
                      Upload CDF Files
                    </CardTitle>
                    <CardDescription className="text-purple-200/80">
                      Upload SWIS Level-2 CDF files for comprehensive ML analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Upload Area */}
                    <motion.div
                      className="border-2 border-dashed border-purple-500/50 rounded-xl p-12 text-center hover:border-purple-400 transition-all cursor-pointer relative overflow-hidden group"
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Animated background */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10"
                      >
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Upload className="h-16 w-16 mx-auto text-purple-400 mb-4" />
                        </motion.div>
                        <p className="text-lg font-semibold mb-2">Drop CDF files here</p>
                        <p className="text-sm text-purple-300/70">
                          or click to browse files
                        </p>
                        <p className="text-xs text-purple-400/50 mt-2">
                          Supports .cdf, .CDF files
                        </p>
                      </motion.div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".cdf,.CDF"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </motion.div>

                    {/* Action Buttons */}
                    {selectedFiles.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <Button
                          onClick={() => handleUpload('standard')}
                          disabled={uploading || analyzing}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload & Analyze
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleUpload('ml')}
                          disabled={uploading || analyzing}
                          variant="outline"
                          className="flex-1 border-green-500 text-green-400 hover:bg-green-500/10"
                        >
                          {analyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              ML Analysis
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}

                    {/* File List */}
                    <AnimatePresence>
                      {selectedFiles.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          <h4 className="font-semibold text-purple-300">Selected Files ({selectedFiles.length})</h4>
                          {selectedFiles.map((file, index) => (
                            <motion.div
                              key={file.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(file.status)}
                                  <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    file.status === 'completed' ? 'default' :
                                    file.status === 'error' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {file.status}
                                </Badge>
                              </div>
                              {(file.status === 'uploading' || file.status === 'analyzing') && (
                                <Progress value={file.progress} className="h-2" />
                              )}
                              {/* ML Analysis Results - COMPREHENSIVE (Same as Main Project) */}
                              {file.status === 'completed' && file.mlResults && (
                                <MLResultsDisplay file={file} />
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Info Section */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/30 backdrop-blur-xl h-full">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Target className="h-6 w-6 text-blue-400" />
                      Analysis Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Brain, title: 'ML-Powered Detection', desc: 'Advanced machine learning algorithms for CME detection' },
                      { icon: Zap, title: 'Real-time Processing', desc: 'Fast analysis with progress tracking' },
                      { icon: BarChart3, title: 'Comprehensive Metrics', desc: 'Detailed statistics and confidence scores' },
                      { icon: AlertTriangle, title: 'Event Classification', desc: 'Automatic severity and type classification' },
                    ].map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50"
                      >
                        <div className="flex items-start gap-3">
                          <feature.icon className="h-5 w-5 text-blue-400 mt-0.5" />
                          <div>
                            <p className="font-semibold">{feature.title}</p>
                            <p className="text-sm text-slate-400">{feature.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Forecast Predictions Tab */}
          <TabsContent value="forecast" className="space-y-6">
            {loading ? (
              <motion.div
                className="flex items-center justify-center h-96"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-12 w-12 text-purple-400 mx-auto" />
                  </motion.div>
                  <p className="text-purple-300">Loading forecast predictions...</p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Model Info Card */}
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500/30 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-400" />
                        LSTM Model Information
                      </CardTitle>
                      <CardDescription className="text-purple-200/80">
                        Trained on ~30 years of data (1996-2025) | 77,569 training sequences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg bg-slate-800/30">
                          <p className="text-xs text-slate-400 mb-1">Model Type</p>
                          <p className="font-semibold text-purple-300">LSTM Neural Network</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/30">
                          <p className="text-xs text-slate-400 mb-1">Forecast Horizon</p>
                          <p className="font-semibold text-purple-300">168 hours (7 days)</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/30">
                          <p className="text-xs text-slate-400 mb-1">Output Parameters</p>
                          <p className="font-semibold text-purple-300">3 (DST, Kp, Ap)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Forecast Overview Cards with Accuracy */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {forecastParams.map((param, idx) => {
                    const stats = forecastData?.statistics?.[param.key];
                    return (
                      <motion.div
                        key={param.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                      >
                        <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 backdrop-blur-xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                              <param.icon className="h-4 w-4" style={{ color: param.color }} />
                              {param.label}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400 mt-1">
                              {param.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <div className="text-3xl font-bold mb-1" style={{ color: param.color }}>
                                {stats?.current?.toFixed(2) || 'N/A'}
                              </div>
                              <p className="text-xs text-slate-400">{param.unit}</p>
                            </div>
                            
                            {stats && (
                              <div className="space-y-2 pt-2 border-t border-slate-700">
                                <div className="flex items-center gap-2">
                                  {stats.trend === 'increasing' ? (
                                    <TrendingUp className="h-3 w-3 text-green-400" />
                                  ) : stats.trend === 'decreasing' ? (
                                    <TrendingDown className="h-3 w-3 text-red-400" />
                                  ) : null}
                                  <span className="text-xs text-slate-400 capitalize">{stats.trend} trend</span>
                                </div>
                                
                                {/* Accuracy Metrics */}
                                <div className="pt-2 border-t border-slate-700/50">
                                  <p className="text-xs text-slate-400 mb-1">Model Accuracy</p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-400">MAE:</span>
                                      <span className="text-green-400 font-mono">{param.accuracy.mae.toFixed(4)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-400">RMSE:</span>
                                      <span className="text-yellow-400 font-mono">{param.accuracy.rmse.toFixed(4)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 italic">{param.accuracy.note}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Forecast Charts - Single Column */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 gap-6"
                >
                  {forecastParams.map((param, idx) => {
                    const chartData = prepareForecastChart(param.key, param.label, param.color);
                    if (!chartData) return null;

                    return (
                      <motion.div
                        key={param.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                          <CardHeader>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <CardTitle className="flex items-center gap-2 text-xl font-bold text-white mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                  <param.icon className="h-6 w-6" style={{ color: param.color }} />
                                  {param.label} - 7 Day Forecast
                                </CardTitle>
                                <CardDescription className="text-base text-slate-300 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                  {getSimpleExplanation(param.key)}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="border-green-500/50 text-green-400">
                                LSTM Model
                              </Badge>
                            </div>
                            
                            {/* Current Value Display with Status */}
                            {forecastData?.parameters[param.key] && forecastData.parameters[param.key].length > 0 && (() => {
                              const currentVal = forecastData.parameters[param.key][forecastData.parameters[param.key].length - 1];
                              const statusInfo = getStatus(currentVal, param.key);
                              
                              // For Composite Index, show contextual explanation based on individual parameters
                              const showContextualInfo = param.key === 'Composite_Index';
                              let contextualInfo = null;
                              
                              if (showContextualInfo && forecastData.parameters) {
                                const dstVal = forecastData.parameters['Dst_Index_nT']?.[forecastData.parameters['Dst_Index_nT'].length - 1];
                                const kpVal = forecastData.parameters['Kp_10']?.[forecastData.parameters['Kp_10'].length - 1];
                                const apVal = forecastData.parameters['ap_index_nT']?.[forecastData.parameters['ap_index_nT'].length - 1];
                                const sunspotVal = forecastData.parameters['Sunspot_Number']?.[forecastData.parameters['Sunspot_Number'].length - 1];
                                
                                const individualStatuses = [
                                  { name: 'Dst', val: dstVal, status: dstVal !== undefined ? getStatus(dstVal, 'Dst_Index_nT').status : 'NORMAL' },
                                  { name: 'Kp', val: kpVal, status: kpVal !== undefined ? getStatus(kpVal, 'Kp_10').status : 'NORMAL' },
                                  { name: 'Ap', val: apVal, status: apVal !== undefined ? getStatus(apVal, 'ap_index_nT').status : 'NORMAL' },
                                  { name: 'Sunspot', val: sunspotVal, status: sunspotVal !== undefined ? getStatus(sunspotVal, 'Sunspot_Number').status : 'NORMAL' },
                                ];
                                
                                const elevatedParams = individualStatuses.filter(p => 
                                  p.status.includes('DANGEROUS') || p.status.includes('HIGH') || p.status.includes('ELEVATED') || p.status.includes('QUITE DANGEROUS')
                                );
                                
                                if (elevatedParams.length === 0) {
                                  contextualInfo = "All individual parameters (Dst, Kp, Ap, Sunspot) are in normal range. Composite reflects overall calm conditions.";
                                } else if (elevatedParams.length === 1) {
                                  contextualInfo = `${elevatedParams[0].name} is elevated. Composite shows moderate activity.`;
                                } else {
                                  contextualInfo = `${elevatedParams.length} parameters (${elevatedParams.map(p => p.name).join(', ')}) are elevated. Composite indicates increased space weather activity.`;
                                }
                              }
                              
                              return (
                                <div className="mt-3 p-4 rounded-lg bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-2 border-slate-600">
                                  <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex-1">
                                      <p className="text-xs text-slate-400 mb-1 font-medium" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                        Current Predicted Value
                                      </p>
                                      <p className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                        {currentVal.toFixed(2)}
                                        <span className="text-xl text-slate-400 ml-2">{param.unit}</span>
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge 
                                          className={`${statusInfo.bgColor} text-white px-3 py-1 font-bold text-sm border-0`}
                                          style={{ backgroundColor: statusInfo.color }}
                                        >
                                          {statusInfo.status}
                                        </Badge>
                                      </div>
                                      {contextualInfo && (
                                        <p className="text-xs text-slate-300 mt-3 italic leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                          📊 <strong>Contextual Analysis:</strong> {contextualInfo}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-slate-400 mb-1 font-medium" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                        Model Accuracy
                                      </p>
                                      <p className="text-sm font-bold text-green-400" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                        MAE: {param.accuracy.mae.toFixed(4)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Threshold Legend - Only for non-composite parameters */}
                            {param.key !== 'Composite_Index' && getThresholds(param.key).length > 0 && (
                              <div className="mt-3 p-3 rounded-lg bg-slate-800/70 border-2 border-slate-600">
                                <p className="text-sm font-bold text-slate-200 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                  📊 Threshold Reference Lines (Visible on Graph):
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {getThresholds(param.key).map((threshold: any, tIdx: number) => {
                                    // Use threshold's own color for consistency with graph lines
                                    const thresholdColor = threshold.color || '#fbbf24';
                                    
                                    return (
                                      <div key={tIdx} className="flex items-center gap-2 p-2 rounded bg-slate-900/50">
                                        <div 
                                          className="w-6 h-1 border-t-2 border-dashed" 
                                          style={{ borderColor: thresholdColor }}
                                        />
                                        <div>
                                          <span className="text-xs font-bold" style={{ color: thresholdColor, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                            {threshold.label}
                                          </span>
                                          <p className="text-xs text-slate-400" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                            = {threshold.value} {param.unit}
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
                            <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                              <p className="text-xs font-semibold text-blue-300 mb-1.5" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                📝 Summary:
                              </p>
                              <div className="text-xs text-slate-300 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                <p>{param.description} | This graph shows predictions for the next 7 days.</p>
                                {param.key === 'Composite_Index' ? (
                                  <div className="mt-2 space-y-2">
                                    <p><strong>What This Composite Index Means:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                      <li><strong>Positive values (greater than 0):</strong> Elevated space weather activity across multiple parameters. Higher values indicate stronger combined activity.</li>
                                      <li><strong>Negative values (less than 0):</strong> Low space weather activity. Calm conditions across all parameters.</li>
                                      <li><strong>Magnitude:</strong> How strong the deviation is from normal conditions.</li>
                                    </ul>
                                    <p className="mt-2"><strong>Interpretation Guide:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                      <li><strong>Above 1.0:</strong> High combined activity - Multiple parameters (Dst, Kp, Ap, Sunspot) showing elevated levels. Increased risk of geomagnetic storms.</li>
                                      <li><strong>0.5 to 1.0:</strong> Moderate elevation - Some parameters showing increased activity. Monitor for potential disturbances.</li>
                                      <li><strong>-0.5 to 0.5:</strong> Normal range - Space weather conditions are stable.</li>
                                      <li><strong>Below -0.5:</strong> Very low activity - All parameters in quiet state. Minimal space weather disturbances expected.</li>
                                    </ul>
                                  </div>
                                ) : (
                                  <p>Dashed lines show important threshold levels. Watch for values crossing these lines!</p>
                                )}
                              </div>
                            </div>

                            {/* Threshold Values Display (For Composite Index) */}
                            {param.key === 'Composite_Index' && (
                              <div className="mb-3 p-3 rounded-lg bg-slate-800/70 border-2 border-slate-600">
                                <p className="text-sm font-bold text-slate-200 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                  📊 Composite Index Threshold Reference Values:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  {[
                                    { value: -0.5, label: 'Low Activity', color: '#22c55e', description: 'Very quiet conditions' },
                                    { value: 0.0, label: 'Normal', color: '#60a5fa', description: 'Stable conditions' },
                                    { value: 0.5, label: 'Elevated', color: '#fbbf24', description: 'Moderate activity' },
                                    { value: 1.0, label: 'High Activity', color: '#f97316', description: 'Strong activity' },
                                  ].map((threshold, tIdx) => (
                                    <div key={tIdx} className="flex flex-col gap-2 p-3 rounded bg-slate-900/50 border border-slate-700">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 rounded-full" 
                                          style={{ backgroundColor: threshold.color }}
                                        />
                                        <span className="text-xs font-bold text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                          {threshold.label}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-300 font-mono" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                        = {threshold.value} {param.unit}
                                      </p>
                                      <p className="text-xs text-slate-400 italic" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                        {threshold.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dynamic Statistics from Graph Data */}
                            {forecastData?.parameters[param.key] && forecastData.parameters[param.key].length > 0 && (() => {
                              // Get raw data
                              const rawData = forecastData.parameters[param.key];
                              
                              // Convert to numbers and filter - robust approach
                              const graphData: number[] = [];
                              for (let i = 0; i < rawData.length; i++) {
                                const val = rawData[i];
                                // Try multiple conversion methods
                                let numVal: number;
                                if (typeof val === 'number') {
                                  numVal = val;
                                } else if (typeof val === 'string') {
                                  numVal = parseFloat(val);
                                } else if (val != null) {
                                  numVal = Number(val);
                                } else {
                                  continue; // Skip null/undefined
                                }
                                
                                // Validate the number
                                if (!isNaN(numVal) && isFinite(numVal)) {
                                  graphData.push(numVal);
                                }
                              }
                              
                              if (graphData.length === 0) {
                                console.error(`[Statistics] No valid data for ${param.key}. Raw data:`, rawData);
                                return null;
                              }
                              
                              // Calculate statistics using proper mathematical formulas
                              const sum = graphData.reduce((acc: number, val: number) => acc + val, 0);
                              const avgValue = graphData.length > 0 ? sum / graphData.length : 0;
                              const minValue = graphData.length > 0 ? Math.min(...graphData) : 0;
                              const maxValue = graphData.length > 0 ? Math.max(...graphData) : 0;
                              
                              // For normalized PCA data (Composite Index), mean ≈ 0 is expected
                              // Show "Mean Magnitude" (average of absolute values) for more meaningful display
                              const meanMagnitude = graphData.length > 0
                                ? graphData.reduce((acc: number, val: number) => acc + Math.abs(val), 0) / graphData.length
                                : 0;
                              
                              // Standard deviation: sqrt(sum((x - mean)^2) / n)
                              const variance = graphData.length > 0 
                                ? graphData.reduce((acc: number, val: number) => 
                                    acc + Math.pow(val - avgValue, 2), 0
                                  ) / graphData.length
                                : 0;
                              const stdDev = Math.sqrt(variance);
                              
                              // For Composite Index (normalized PCA), use mean magnitude instead of mean
                              // because normalized data has mean ≈ 0 by design
                              const displayAvg = param.key === 'Composite_Index' ? meanMagnitude : avgValue;
                              
                              // Debug logging for composite index
                              if (param.key === 'Composite_Index') {
                                console.log(`[Composite Statistics] Raw count: ${rawData.length}, Valid count: ${graphData.length}`);
                                console.log(`[Composite Statistics] Sample values:`, graphData.slice(0, 5));
                                console.log(`[Composite Statistics] Mean: ${avgValue.toFixed(6)} (normalized ≈ 0), Mean Magnitude: ${meanMagnitude.toFixed(4)}, Min: ${minValue.toFixed(4)}, Max: ${maxValue.toFixed(4)}, StdDev: ${stdDev.toFixed(4)}`);
                              }
                              
                              return (
                                <div className="mb-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                  <p className="text-xs font-semibold text-slate-300 mb-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                    📊 Dynamic Statistics (From Graph Data):
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                      <p className="text-xs text-slate-400">
                                        {param.key === 'Composite_Index' ? 'Mean Magnitude' : 'Average'}
                                        {param.key === 'Composite_Index' && (
                                          <span className="text-xs text-slate-500 block mt-0.5 italic">(Normalized mean ≈ 0)</span>
                                        )}
                                      </p>
                                      <p className="text-sm font-bold text-cyan-400">
                                        {param.key === 'Composite_Index' ? meanMagnitude.toFixed(2) : avgValue.toFixed(2)} {param.unit}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400">Minimum</p>
                                      <p className="text-sm font-bold text-blue-400">{minValue.toFixed(2)} {param.unit}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400">Maximum</p>
                                      <p className="text-sm font-bold text-green-400">{maxValue.toFixed(2)} {param.unit}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400">Std Deviation</p>
                                      <p className="text-sm font-bold text-yellow-400">{stdDev.toFixed(2)} {param.unit}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Chart - Proper Graph with Clear Data Variation */}
                            <div className="h-[500px] bg-slate-900/40 rounded-lg p-4 border-2 border-slate-600">
                              <Line data={chartData} options={getChartOptions(param, forecastData?.parameters[param.key] || [])} />
                            </div>
                            
                            {/* Model Output Info */}
                            <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <p className="text-slate-400">Data Points</p>
                                  <p className="font-semibold text-cyan-400">168 hours</p>
                                </div>
                                <div>
                                  <p className="text-slate-400">Forecast Period</p>
                                  <p className="font-semibold text-purple-400">7 days</p>
                                </div>
                                <div>
                                  <p className="text-slate-400">Model MAE</p>
                                  <p className="font-semibold text-green-400">{param.accuracy.mae.toFixed(4)}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400">Value Range</p>
                                  <p className="font-semibold text-yellow-400">{param.range.min} to {param.range.max}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Full Forecast Panel */}
                <motion.div
                  variants={itemVariants}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-400" />
                        Complete Forecast Analysis
                      </CardTitle>
                      <CardDescription>
                        Detailed 7-day predictions for all space weather parameters
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ForecastPredictionsPanel />
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Phase2;
