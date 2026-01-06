/**
 * CMEDetectionPanel Component
 * 
 * This component provides the main interface for configuring and running CME detection analysis.
 * It integrates "extreme" animations using framer-motion for a visually engaging experience.
 * 
 * Features:
 * - Date range selection for analysis
 * - Advanced parameter configuration (velocity, width, etc.)
 * - Real-time analysis status updates
 * - Visualization of detection results
 * - Staggered entrance animations for UI elements
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Play, Pause, Settings, Download, AlertCircle, CheckCircle, Clock, Loader2, Database, RefreshCw, TrendingUp, BarChart3, Activity, Sparkles, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import type { AnalysisRequest, CMEEvent, AnalysisResult } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const CMEDetectionPanel: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('2025-08-01');
  const [endDate, setEndDate] = useState<string>('2025-08-29');
  const [analysisType, setAnalysisType] = useState<'full' | 'quick' | 'threshold_only'>('full');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [configName, setConfigName] = useState<string>('');
  const [showChartsModal, setShowChartsModal] = useState(false);

  const { toast } = useToast();

  // Advanced settings - optimized for real CME data
  const [advancedSettings, setAdvancedSettings] = useState({
    velocityThreshold: 200,  // Lower to include more real events
    accelerationThreshold: 10,
    angularWidthMin: 20,     // Much lower to include narrow CMEs
    confidenceThreshold: 0.5, // Lower confidence threshold
    includePartialHalos: true,  // Include partial halos
    filterWeakEvents: false     // Don't filter weak events
  });

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setInitialLoading(true);
        const request: AnalysisRequest = {
          start_date: startDate,
          end_date: endDate,
          analysis_type: analysisType,
          advanced_settings: advancedSettings  // Include settings for real data
        };
        const data = await api.analyzeCMEEvents(request);
        setAnalysisResult(data);
      } catch (error) {
        console.error('Failed to load initial CME data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load CME data');
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, []); // Only run on mount

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);

      const request: AnalysisRequest = {
        start_date: startDate,
        end_date: endDate,
        analysis_type: analysisType,
        advanced_settings: advancedSettings  // Include settings for filtering
      };

      const data = await api.analyzeCMEEvents(request);
      setAnalysisResult(data);

      // Show success toast with analysis results
      toast({
        title: "Analysis Complete! 🎉",
        description: `Found ${data.cme_events.length} CME events with ${((data.performance_metrics?.accuracy || 0.9) * 100).toFixed(1)}% accuracy`,
        duration: 5000,
      });

      console.log(`Analysis Complete: Found ${data.cme_events.length} CME events`);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');

      // Show error toast
      toast({
        title: "Analysis Failed ❌",
        description: error instanceof Error ? error.message : 'Analysis failed',
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!analysisResult || !analysisResult.cme_events.length) {
      alert('No data to export. Please run an analysis first.');
      return;
    }

    // Create CSV content
    const headers = ['DateTime', 'Speed (km/s)', 'Angular Width (°)', 'Source Location', 'Estimated Arrival', 'Confidence', 'Severity'];
    const csvContent = [
      headers.join(','),
      ...analysisResult.cme_events.map(event => [
        new Date(event.datetime).toISOString(),
        event.speed.toString(),
        event.angular_width.toString(),
        `"${event.source_location}"`,
        new Date(event.estimated_arrival).toISOString(),
        (event.confidence * 100).toFixed(1) + '%',
        getCMESeverity(event.speed).level
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cme_analysis_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAdvancedSettingsChange = (setting: string, value: any) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleConfigureSync = async () => {
    try {
      setSyncLoading(true);
      setError(null);

      const configurationName = configName.trim() || `Config_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}`;

      const response = await fetch('http://localhost:8000/api/data/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: configurationName,
          sync_type: 'configure',
          data_source: 'frontend',
          settings: advancedSettings
        }),
      });

      if (!response.ok) {
        throw new Error(`Configuration failed: ${response.statusText}`);
      }

      const result = await response.json();
      setLastSyncTime(result.sync_timestamp);
      setConfigName(''); // Clear the input

      console.log('Configuration updated successfully:', result.message);
      alert(`✅ ${result.message}`);

    } catch (error) {
      console.error('Configuration failed:', error);
      setError(error instanceof Error ? error.message : 'Configuration failed');
      alert(`❌ Configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDataSync = async () => {
    try {
      setSyncLoading(true);
      setError(null);

      const syncName = configName.trim() || `Sync_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}`;

      const response = await fetch('http://localhost:8000/api/data/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: syncName,
          sync_type: 'sync',
          data_source: 'frontend',
          settings: advancedSettings
        }),
      });

      if (!response.ok) {
        throw new Error(`Data sync failed: ${response.statusText}`);
      }

      const result = await response.json();
      setLastSyncTime(result.sync_timestamp);
      setConfigName(''); // Clear the input

      console.log('Data sync completed:', result.message);
      alert(`✅ ${result.message}`);

      // Optionally refresh the analysis after sync
      if (analysisResult) {
        await handleAnalyze();
      }

    } catch (error) {
      console.error('Data sync failed:', error);
      setError(error instanceof Error ? error.message : 'Data sync failed');
      alert(`❌ Data sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const getCMESeverity = (speed: number) => {
    if (speed >= 1000) return { level: 'High', color: 'destructive', bg: 'bg-red-500/20' };
    if (speed >= 600) return { level: 'Medium', color: 'warning', bg: 'bg-yellow-500/20' };
    return { level: 'Low', color: 'default', bg: 'bg-green-500/20' };
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!analysisResult) return { timeSeriesData: [], speedDistribution: [], severityDistribution: [] };

    // Time series data for CME events
    const timeSeriesData = analysisResult.cme_events.map(event => ({
      date: new Date(event.datetime).toLocaleDateString(),
      speed: event.speed,
      angular_width: event.angular_width,
      confidence: event.confidence * 100,
    }));

    // Speed distribution
    const speedRanges = [
      { range: '< 500 km/s', count: 0, color: '#10b981' },
      { range: '500-800 km/s', count: 0, color: '#f59e0b' },
      { range: '800-1000 km/s', count: 0, color: '#f97316' },
      { range: '> 1000 km/s', count: 0, color: '#ef4444' },
    ];

    analysisResult.cme_events.forEach(event => {
      if (event.speed < 500) speedRanges[0].count++;
      else if (event.speed < 800) speedRanges[1].count++;
      else if (event.speed < 1000) speedRanges[2].count++;
      else speedRanges[3].count++;
    });

    // Severity distribution
    const severityData = analysisResult.cme_events.map(event => {
      const severity = getCMESeverity(event.speed);
      return { ...event, severity: severity.level };
    });

    const severityDistribution = [
      { severity: 'Low', count: severityData.filter(e => e.severity === 'Low').length, color: '#10b981' },
      { severity: 'Medium', count: severityData.filter(e => e.severity === 'Medium').length, color: '#f59e0b' },
      { severity: 'High', count: severityData.filter(e => e.severity === 'High').length, color: '#ef4444' },
    ];

    return { timeSeriesData, speedDistribution: speedRanges, severityDistribution };
  };

  const { timeSeriesData, speedDistribution, severityDistribution } = prepareChartData();

  // Animation variants for staggered entrance of child elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1 // Stagger effect for children
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Analysis Controls */}
      <motion.div variants={itemVariants}>
        <Card className="space-card">
          <CardHeader>
            <CardTitle className="text-cosmic">CME Detection Analysis</CardTitle>
            <CardDescription>
              Configure and run halo CME detection analysis using SWIS-ASPEX data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-card/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analysis-type">Analysis Type</Label>
                <select
                  id="analysis-type"
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-card/50 border border-border/50 rounded-md text-sm"
                >
                  <option value="full">Full Analysis</option>
                  <option value="quick">Quick Scan</option>
                  <option value="threshold_only">Threshold Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-solar-orange hover:bg-solar-orange/90 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>

              <Button variant="outline" className="border-border/50" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}>
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>

              <Button variant="outline" className="border-border/50" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Settings Panel */}
      {showAdvancedSettings && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="space-card">
            <CardHeader>
              <CardTitle className="text-cosmic">Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced analysis parameters and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="velocity-threshold">Velocity Threshold (km/s)</Label>
                  <Input
                    id="velocity-threshold"
                    type="number"
                    value={advancedSettings.velocityThreshold}
                    onChange={(e) => handleAdvancedSettingsChange('velocityThreshold', Number(e.target.value))}
                    className="bg-card/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acceleration-threshold">Acceleration Threshold (m/s²)</Label>
                  <Input
                    id="acceleration-threshold"
                    type="number"
                    value={advancedSettings.accelerationThreshold}
                    onChange={(e) => handleAdvancedSettingsChange('accelerationThreshold', Number(e.target.value))}
                    className="bg-card/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="angular-width-min">Min Angular Width (°)</Label>
                  <Input
                    id="angular-width-min"
                    type="number"
                    value={advancedSettings.angularWidthMin}
                    onChange={(e) => handleAdvancedSettingsChange('angularWidthMin', Number(e.target.value))}
                    className="bg-card/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
                  <Input
                    id="confidence-threshold"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={advancedSettings.confidenceThreshold}
                    onChange={(e) => handleAdvancedSettingsChange('confidenceThreshold', Number(e.target.value))}
                    className="bg-card/50 border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-partial"
                    checked={advancedSettings.includePartialHalos}
                    onChange={(e) => handleAdvancedSettingsChange('includePartialHalos', e.target.checked)}
                    className="rounded border-border/50"
                  />
                  <Label htmlFor="include-partial">Include Partial Halo CMEs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="filter-weak"
                    checked={advancedSettings.filterWeakEvents}
                    onChange={(e) => handleAdvancedSettingsChange('filterWeakEvents', e.target.checked)}
                    className="rounded border-border/50"
                  />
                  <Label htmlFor="filter-weak">Filter Weak Events</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAdvancedSettings(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  // Apply advanced settings to analysis
                  setShowAdvancedSettings(false);
                  handleAnalyze();
                }}>
                  Apply & Analyze
                </Button>
              </div>
            </CardContent >
          </Card >
        </motion.div >
      )}

      {/* Detection Status */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="space-card">
          <CardHeader>
            <CardTitle className="text-cosmic">Detection Status</CardTitle>
            <CardDescription>Current system status and data synchronization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-400">System Status</p>
                  <p className="text-xs text-muted-foreground">Operational</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Last Scan</p>
                  <p className="text-xs text-muted-foreground">
                    {analysisResult?.data_summary?.current_date 
                      ? (() => {
                          try {
                            const lastScan = new Date(analysisResult.data_summary.current_date);
                            const now = new Date();
                            const diffMinutes = Math.floor((now.getTime() - lastScan.getTime()) / 60000);
                            if (diffMinutes < 1) return 'Just now';
                            if (diffMinutes < 60) return `${diffMinutes} min ago`;
                            const diffHours = Math.floor(diffMinutes / 60);
                            if (diffHours < 24) return `${diffHours} hr ago`;
                            return `${Math.floor(diffHours / 24)} days ago`;
                          } catch {
                            return 'Unknown';
                          }
                        })()
                      : 'Not scanned'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Active Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    {analysisResult?.cme_events?.length || 0} CME events
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <AlertCircle className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-purple-400">Confidence</p>
                  <p className="text-xs text-muted-foreground">
                    {analysisResult?.cme_events?.length > 0
                      ? (() => {
                          const avgConfidence = analysisResult.cme_events.reduce((sum, e) => sum + (e.confidence || 0), 0) / analysisResult.cme_events.length;
                          return `${(avgConfidence * 100).toFixed(1)}%`;
                        })()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Configuration and Sync Section */}
            <div className="border-t border-border/50 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cosmic">Data Configuration & Sync</h3>
                {lastSyncTime && (
                  <p className="text-sm text-muted-foreground">
                    Last sync: {new Date(lastSyncTime).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="config-name">Configuration/Sync Name</Label>
                  <Input
                    id="config-name"
                    type="text"
                    placeholder="Enter configuration name (optional)"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    className="bg-card/50 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Name will be auto-generated if not provided
                  </p>
                </div>

                <div className="flex items-end space-x-3">
                  <Button
                    onClick={handleConfigureSync}
                    disabled={syncLoading}
                    className="bg-cosmic-blue hover:bg-cosmic-blue/90 text-white flex-1"
                  >
                    {syncLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Configuring...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleDataSync}
                    disabled={syncLoading}
                    className="bg-stellar-purple hover:bg-stellar-purple/90 text-white flex-1"
                  >
                    {syncLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Sync Data
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-400">Configuration & Sync Information</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      • <strong>Configure:</strong> Save current settings with timestamp to database<br />
                      • <strong>Sync Data:</strong> Update data and sync with current date/time<br />
                      • All operations are stored with names in the database for tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CME Events List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="space-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-cosmic">Detected CME Events</CardTitle>
                <CardDescription>
                  Halo CME events identified in the analysis period
                </CardDescription>
              </div>
              {analysisResult?.cme_events && analysisResult.cme_events.length > 0 && (
                <div className="flex gap-2">
                  <Dialog open={showChartsModal} onOpenChange={setShowChartsModal}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30 hover:from-purple-600/30 hover:to-blue-600/30 transition-all duration-300"
                      >
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        Show Charts
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl w-[95vw] h-[90vh] bg-gradient-to-br from-slate-900/95 via-purple-900/20 to-blue-900/20 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20">
                      <DialogHeader className="border-b border-purple-500/20 pb-4">
                        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                          <Zap className="h-8 w-8 text-purple-400" />
                          CME Analysis Dashboard
                        </DialogTitle>
                        <DialogDescription className="text-slate-300 text-lg">
                          Interactive visualization of detected CME events and patterns
                        </DialogDescription>
                      </DialogHeader>

                      {/* Modal Content with Charts */}
                      <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                        {/* Time Series Chart */}
                        <div className="bg-gradient-to-br from-slate-800/40 to-purple-900/20 rounded-xl p-6 border border-purple-500/20">
                          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-purple-300">
                            <Activity className="h-5 w-5" />
                            CME Speed Over Time
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={timeSeriesData}>
                                <defs>
                                  <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                  </linearGradient>
                                  <linearGradient id="widthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                <XAxis
                                  dataKey="date"
                                  stroke="#9CA3AF"
                                  fontSize={12}
                                  tick={{ fill: '#9CA3AF' }}
                                />
                                <YAxis
                                  stroke="#9CA3AF"
                                  fontSize={12}
                                  tick={{ fill: '#9CA3AF' }}
                                  label={{ value: 'Speed (km/s)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(12px)',
                                    color: '#E2E8F0'
                                  }}
                                />
                                <Legend />
                                <Area
                                  type="monotone"
                                  dataKey="speed"
                                  stroke="#F59E0B"
                                  strokeWidth={3}
                                  fill="url(#speedGradient)"
                                  dot={{ fill: '#F59E0B', r: 6, strokeWidth: 2, stroke: '#FEF3C7' }}
                                  name="Speed (km/s)"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="angular_width"
                                  stroke="#10B981"
                                  strokeWidth={3}
                                  dot={{ fill: '#10B981', r: 5, strokeWidth: 2, stroke: '#D1FAE5' }}
                                  name="Angular Width (°)"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Speed Distribution Chart */}
                        <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/20 rounded-xl p-6 border border-blue-500/20">
                          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-blue-300">
                            <BarChart3 className="h-5 w-5" />
                            Speed Distribution
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={speedDistribution}>
                                <defs>
                                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.8} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                <XAxis
                                  dataKey="range"
                                  stroke="#9CA3AF"
                                  fontSize={12}
                                  tick={{ fill: '#9CA3AF' }}
                                />
                                <YAxis
                                  stroke="#9CA3AF"
                                  fontSize={12}
                                  tick={{ fill: '#9CA3AF' }}
                                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(12px)',
                                    color: '#E2E8F0'
                                  }}
                                />
                                <Bar
                                  dataKey="count"
                                  fill="url(#barGradient)"
                                  radius={[8, 8, 0, 0]}
                                  stroke="#8B5CF6"
                                  strokeWidth={1}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Severity Distribution Chart */}
                        <div className="bg-gradient-to-br from-slate-800/40 to-red-900/20 rounded-xl p-6 border border-red-500/20">
                          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-red-300">
                            <AlertTriangle className="h-5 w-5" />
                            Severity Distribution
                          </h3>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={severityDistribution}>
                                <defs>
                                  <linearGradient id="severityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0.2} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                <XAxis
                                  dataKey="severity"
                                  stroke="#9CA3AF"
                                  fontSize={12}
                                  tick={{ fill: '#9CA3AF' }}
                                />
                                <YAxis
                                  stroke="#9CA3AF"
                                  fontSize={12}
                                  tick={{ fill: '#9CA3AF' }}
                                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(12px)',
                                    color: '#E2E8F0'
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="count"
                                  stroke="#EF4444"
                                  strokeWidth={3}
                                  fill="url(#severityGradient)"
                                  dot={{ fill: '#EF4444', r: 6, strokeWidth: 2, stroke: '#FEE2E2' }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Analysis Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/30 text-center backdrop-blur-sm">
                            <div className="text-4xl font-bold text-blue-400 mb-2">
                              {analysisResult.cme_events.length}
                            </div>
                            <div className="text-slate-300 font-medium">Total Events</div>
                          </div>
                          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30 text-center backdrop-blur-sm">
                            <div className="text-4xl font-bold text-green-400 mb-2">
                              {(analysisResult.performance_metrics.accuracy * 100).toFixed(1)}%
                            </div>
                            <div className="text-slate-300 font-medium">Accuracy</div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30 text-center backdrop-blur-sm">
                            <div className="text-4xl font-bold text-purple-400 mb-2">
                              {severityDistribution.filter(s => s.severity === 'High' || s.severity === 'Extreme').reduce((sum, s) => sum + s.count, 0)}
                            </div>
                            <div className="text-slate-300 font-medium">High Severity</div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {initialLoading || loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-solar-orange mx-auto" />
                  <p className="text-muted-foreground">Analyzing SWIS data for CME signatures...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-4 text-destructive">
                  <AlertCircle className="h-8 w-8 mx-auto" />
                  <p>{error}</p>
                </div>
              </div>
            ) : analysisResult?.cme_events && analysisResult.cme_events.length > 0 ? (
              <div className="space-y-4">
                {analysisResult.cme_events.map((event: CMEEvent, index: number) => {
                  const severity = getCMESeverity(event.speed);
                  return (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-card/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className={`${severity.bg} border-${severity.color}/50 text-${severity.color}`}>
                            {severity.level} Severity
                          </Badge>
                          <Badge variant="outline" className="bg-cosmic-blue/20 text-cosmic-blue border-cosmic-blue/50">
                            {event.angular_width}° Halo
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className="text-lg font-semibold text-cosmic">{(event.confidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Detection Time</p>
                          <p className="font-medium text-cosmic">{formatDateTime(event.datetime)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Speed</p>
                          <p className="font-medium text-solar">{event.speed.toFixed(0)} km/s</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Source Location</p>
                          <p className="font-medium text-stellar-purple">{event.source_location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                          <p className="font-medium text-cyan-400">{formatDateTime(event.estimated_arrival)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No CME events detected in the specified date range</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting the date range or analysis parameters
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      {
        showChartsModal && analysisResult?.cme_events && analysisResult.cme_events.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="text-cosmic flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  CME Analysis Charts
                </CardTitle>
                <CardDescription>
                  Visual analysis of detected CME events and patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Time Series Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    CME Speed Over Time
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={12}
                          label={{ value: 'Speed (km/s)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="speed"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          dot={{ fill: '#F59E0B', r: 4 }}
                          name="Speed (km/s)"
                        />
                        <Line
                          type="monotone"
                          dataKey="angular_width"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ fill: '#10B981', r: 4 }}
                          name="Angular Width (°)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Speed Distribution Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Speed Distribution
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={speedDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="range"
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={12}
                          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#8B5CF6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Severity Distribution Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Severity Distribution
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={severityDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="severity"
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          fontSize={12}
                          label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#EF4444"
                          fill="#EF4444"
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Analysis Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                  <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-400">
                      {analysisResult.cme_events.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-2xl font-bold text-green-400">
                      {(analysisResult.performance_metrics.accuracy * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-2xl font-bold text-purple-400">
                      {severityDistribution.filter(s => s.severity === 'High' || s.severity === 'Extreme').reduce((sum, s) => sum + s.count, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">High Severity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      }

      {/* Performance Metrics */}
      {
        analysisResult?.performance_metrics && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="text-cosmic">Detection Performance</CardTitle>
                <CardDescription>Analysis accuracy and reliability metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(analysisResult.performance_metrics).map(([metric, value]) => (
                    <div key={metric} className="p-4 rounded-lg bg-gradient-to-br from-cosmic-blue/20 to-stellar-purple/20 border border-cosmic-blue/30">
                      <p className="text-sm text-muted-foreground capitalize">
                        {metric.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-bold text-cosmic">
                        {typeof value === 'number' ? (value * 100).toFixed(1) : value}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      }

      {/* Threshold Configuration */}
      {
        analysisResult?.thresholds && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="text-cosmic">Optimal Thresholds</CardTitle>
                <CardDescription>Automatically determined detection thresholds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(analysisResult.thresholds).map(([threshold, value]) => (
                    <div key={threshold} className="p-4 rounded-lg bg-gradient-to-br from-solar-orange/20 to-yellow-500/20 border border-solar-orange/30">
                      <p className="text-sm text-muted-foreground capitalize">
                        {threshold.replace(/_/g, ' ')}
                      </p>
                      <p className="text-2xl font-bold text-solar">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      }
    </motion.div >
  );
};

export default CMEDetectionPanel;
