/**
 * DataImportExport Component
 * 
 * This component manages data ingestion, synchronization, and export for the CME detection system.
 * It supports multiple data sources (ISSDC, CACTUS, NASA SPDF) and handles file uploads with ML analysis.
 * 
 * Features:
 * - Real-time data synchronization with external APIs
 * - File upload with progress tracking and ML-based CME detection
 * - Comprehensive data management dashboard
 * - Export functionality for analysis results
 * - "Extreme" animations for interactive elements
 */
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Download, Upload, FileText, Calendar, Globe, CheckCircle, AlertCircle, Clock, AlertTriangle, Trash2, Loader2, Brain, Zap, Target, Calculator, Code, Eye } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, MLAnalysisResult, UploadResult } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ModelCalculationsViewer from './ModelCalculationsViewer';
import ScriptViewer from './ScriptViewer';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  analysisType?: 'standard' | 'ml';
  mlResults?: MLAnalysisResult;
  uploadResults?: UploadResult;
}

const DataImportExport = () => {
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [dataSource, setDataSource] = useState('issdc');
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [syncLoading, setSyncLoading] = useState<{ [key: string]: boolean }>({});
  const [lastSyncTimes, setLastSyncTimes] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCalculationsViewer, setShowCalculationsViewer] = useState(false);
  const [showScriptViewer, setShowScriptViewer] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleImport = () => {
    setIsImporting(true);
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsImporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleSyncAll = async () => {
    try {
      // Set loading state for all connections
      const loadingState = dataConnections.reduce((acc, conn) => {
        acc[conn.id] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      setSyncLoading(loadingState);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/data/sync-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Comprehensive sync failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update all last sync times
      const currentTime = new Date().toLocaleString();
      const newSyncTimes = dataConnections.reduce((acc, conn) => {
        acc[conn.id] = currentTime;
        return acc;
      }, {} as { [key: string]: string });
      setLastSyncTimes(newSyncTimes);

      // Show comprehensive success toast
      toast({
        title: "🚀 Comprehensive Sync Completed",
        description: `Successfully synced ${result.successful_sources}/${result.total_sources} data sources. Total records: ${result.total_records}`,
      });

      console.log('Comprehensive sync completed:', result);

    } catch (error) {
      console.error('Comprehensive sync failed:', error);
      toast({
        title: "❌ Comprehensive Sync Failed",
        description: `Failed to sync all data sources: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive",
      });
    } finally {
      // Clear all loading states
      setSyncLoading({});
    }
  };

  const handleSyncNow = async (connectionId: string, connectionName: string) => {
    try {
      setSyncLoading(prev => ({ ...prev, [connectionId]: true }));

      // Generate specific sync name based on connection
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
      const syncName = `${connectionName.replace(/\s+/g, '_')}_Sync_${timestamp}`;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/data/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: syncName,
          sync_type: 'sync',
          data_source: connectionId,
          settings: {
            dataTypes: dataConnections.find(c => c.id === connectionId)?.dataTypes || [],
            autoSync: true,
            connectionName: connectionName,
            syncTimestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update last sync time with current timestamp
      const syncTime = new Date().toLocaleString();
      setLastSyncTimes(prev => ({ ...prev, [connectionId]: syncTime }));

      // Show success toast
      toast({
        title: "✅ Sync Completed Successfully",
        description: `${connectionName}: Processed ${result.records_processed} records at ${syncTime}`,
      });

      console.log(`Sync completed for ${connectionName}:`, result);

    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "❌ Sync Failed",
        description: `${connectionName}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive",
      });
    } finally {
      setSyncLoading(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const handleConfigure = async (connectionId: string, connectionName: string) => {
    try {
      setSyncLoading(prev => ({ ...prev, [connectionId]: true }));

      // Generate specific configuration name
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
      const configName = `${connectionName.replace(/\s+/g, '_')}_Config_${timestamp}`;

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/data/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: configName,
          sync_type: 'configure',
          data_source: connectionId,
          settings: {
            dataTypes: dataConnections.find(c => c.id === connectionId)?.dataTypes || [],
            autoSync: true,
            syncInterval: '1h',
            connectionName: connectionName,
            configTimestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Configuration failed: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "⚙️ Configuration Updated",
        description: `${connectionName}: Settings saved at ${new Date().toLocaleString()}`,
      });

      console.log(`Configuration updated for ${connectionName}:`, result);

    } catch (error) {
      console.error('Configuration failed:', error);
      toast({
        title: "❌ Configuration Failed",
        description: `${connectionName}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        variant: "destructive",
      });
    } finally {
      setSyncLoading(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const dataConnections = [
    {
      id: 'issdc',
      name: 'ISSDC (ISRO)',
      description: 'Indian Space Science Data Centre',
      status: 'connected',
      lastSync: '2024-12-28 14:30:00',
      dataTypes: ['SWIS Level-2', 'Particle Flux', 'Solar Wind Parameters'],
      icon: Database,
      purpose: 'Primary data source for Aditya-L1 SWIS particle measurements and solar wind parameters',
      realTimeData: true,
      dataVolume: '~2GB/day',
      updateFrequency: '10-minute cadence'
    },
    {
      id: 'cactus',
      name: 'CACTUS CME Database',
      description: 'Computer Aided CME Tracking',
      status: 'connected',
      lastSync: '2024-12-28 12:15:00',
      dataTypes: ['CME Events', 'Halo CME Catalog', 'Event Properties'],
      icon: Globe,
      purpose: 'Reference catalog for CME events validation and historical analysis',
      realTimeData: true,
      dataVolume: '~50MB/month',
      updateFrequency: 'Daily updates'
    },
    {
      id: 'nasa_spdf',
      name: 'NASA SPDF',
      description: 'Space Physics Data Facility',
      status: 'connected',
      lastSync: 'Never',
      dataTypes: ['CDF Files', 'Solar Wind Data', 'Magnetic Field'],
      icon: Database,
      purpose: 'Supplementary magnetic field and multi-mission solar wind data for cross-validation',
      realTimeData: true,
      dataVolume: '~1GB/day',
      updateFrequency: '1-minute cadence'
    }
  ];

  const recentImports = [
    {
      id: '001',
      source: 'ISSDC',
      type: 'SWIS Level-2 Data',
      date: '2024-12-28',
      size: '2.4 GB',
      records: '144,000',
      status: 'completed'
    },
    {
      id: '002',
      source: 'CACTUS',
      type: 'CME Event Catalog',
      date: '2024-12-27',
      size: '8.2 MB',
      records: '1,256',
      status: 'completed'
    },
    {
      id: '003',
      source: 'ISSDC',
      type: 'Particle Flux Data',
      date: '2024-12-26',
      size: '1.8 GB',
      records: '96,000',
      status: 'processing'
    }
  ];

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadSWISData(file),
    onSuccess: (data: UploadResult) => {
      const isSuccess = data.status === 'analyzed';
      toast({
        title: isSuccess ? "🚀 File Analyzed Successfully" : "⚠️ File Upload Issue",
        description: isSuccess
          ? `${data.filename}: Detected ${data.ml_analysis?.cme_events_detected || 0} CME events`
          : `${data.filename}: ${data.error || 'Processing failed'}`,
        variant: isSuccess ? "default" : "destructive"
      });

      // Update file status with results
      setSelectedFiles(prev => prev.map(f =>
        f.name === data.filename
          ? {
            ...f,
            status: isSuccess ? 'completed' as const : 'error' as const,
            progress: 100,
            uploadResults: data,
            analysisType: 'standard'
          }
          : f
      ));
    },
    onError: (error: any) => {
      toast({
        title: "❌ Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      setSelectedFiles(prev => prev.map(f =>
        f.status === 'uploading'
          ? { ...f, status: 'error' as const, progress: 0 }
          : f
      ));
    },
  });

  // ML Analysis mutation
  const mlAnalysisMutation = useMutation({
    mutationFn: (file: File) => api.analyzeCDFWithML(file),
    onSuccess: (data: MLAnalysisResult) => {
      toast({
        title: "🧠 ML Analysis Completed",
        description: `${data.file_info.filename}: AI detected ${data.ml_results.events_detected} CME events with ${data.ml_results.model_performance.model_version}`,
      });

      // Update file status with ML results
      setSelectedFiles(prev => prev.map(f =>
        f.name === data.file_info.filename
          ? {
            ...f,
            status: 'completed' as const,
            progress: 100,
            mlResults: data,
            analysisType: 'ml'
          }
          : f
      ));
    },
    onError: (error: any) => {
      toast({
        title: "🤖 ML Analysis Failed",
        description: error.message || "ML analysis encountered an error",
        variant: "destructive",
      });
      setSelectedFiles(prev => prev.map(f =>
        f.status === 'analyzing'
          ? { ...f, status: 'error' as const, progress: 0 }
          : f
      ));
    },
  });

  // Get ML model info
  const { data: mlModelInfo, error: mlModelError, isLoading: mlModelLoading } = useQuery({
    queryKey: ['ml-model-info'],
    queryFn: async () => {
      try {
        console.log('Fetching ML model info from:', `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/ml/model-info`);
        const result = await api.getMLModelInfo();
        console.log('ML model info received:', result);
        return result;
      } catch (error) {
        console.error('Error fetching ML model info:', error);
        throw error;
      }
    },
    staleTime: 600000, // 10 minutes
    retry: 3,
    retryDelay: 1000,
  });

  // Get data summary - removed refetchInterval to prevent duplicate calls
  // Index.tsx already handles this
  const { data: dataSummary } = useQuery({
    queryKey: ['data-summary'],
    queryFn: api.getDataSummary,
    staleTime: 300000, // 5 minutes - consider data fresh for 5 minutes
    refetchOnMount: false, // Don't refetch if already loaded
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles: FileInfo[] = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      status: 'pending' as const,
      progress: 0,
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleUpload = async (analysisType: 'standard' | 'ml' = 'standard') => {
    const pendingFiles = selectedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    for (const fileInfo of pendingFiles) {
      const file = Array.from(fileInputRef.current?.files || []).find(f => f.name === fileInfo.name);
      if (!file) continue;

      // Update status to uploading or analyzing
      const newStatus: 'uploading' | 'analyzing' = analysisType === 'ml' ? 'analyzing' : 'uploading';
      setSelectedFiles(prev => prev.map(f =>
        f.name === fileInfo.name
          ? { ...f, status: newStatus, analysisType }
          : f
      ));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setSelectedFiles(prev => prev.map(f => {
          if (f.name === fileInfo.name && (f.status === 'uploading' || f.status === 'analyzing') && f.progress < 90) {
            return { ...f, progress: f.progress + Math.random() * 10 };
          }
          return f;
        }));
      }, 200);

      try {
        if (analysisType === 'ml') {
          await mlAnalysisMutation.mutateAsync(file);
        } else {
          await uploadMutation.mutateAsync(file);
        }
        clearInterval(progressInterval);
      } catch (error) {
        clearInterval(progressInterval);
        // Error handling is done in mutations
      }
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'analyzing':
        return <Brain className="h-4 w-4 text-green-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'uploading':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'analyzing':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'connected':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

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
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Data Sources Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="space-card glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Sources</CardTitle>
            <Database className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {dataConnections.filter(d => d.status === 'connected').length}
            </div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card className="space-card glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Volume</CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cosmic">47.2 GB</div>
            <p className="text-xs text-muted-foreground">Total imported</p>
          </CardContent>
        </Card>

        <Card className="space-card glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">2h ago</div>
            <p className="text-xs text-muted-foreground">Auto-sync enabled</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-md">
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-6">
          {/* Comprehensive Sync Controls */}
          <Card className="space-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-cosmic">Data Source Management</CardTitle>
                  <CardDescription>
                    Manage connections and synchronize real-time data from all sources
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="border-accent/50 text-accent hover:bg-accent/10"
                  disabled={Object.values(syncLoading).some(loading => loading)}
                  onClick={() => handleSyncAll()}
                >
                  {Object.values(syncLoading).some(loading => loading) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Syncing All...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Sync All Sources
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dataConnections.map((connection) => {
              const Icon = connection.icon;
              return (
                <Card key={connection.id} className="space-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-6 w-6 text-cosmic" />
                        <div>
                          <CardTitle className="text-base">{connection.name}</CardTitle>
                          <CardDescription>{connection.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(connection.status)}>
                        {getStatusIcon(connection.status)}
                        <span className="ml-1 capitalize">{connection.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Purpose</Label>
                      <p className="text-sm mt-1">{connection.purpose}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data Types</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {connection.dataTypes.map((type, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Data Volume</Label>
                        <p className="text-sm font-mono">{connection.dataVolume}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Update Frequency</Label>
                        <p className="text-sm font-mono">{connection.updateFrequency}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Sync</Label>
                      <p className="text-sm font-mono">
                        {lastSyncTimes[connection.id] || connection.lastSync}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border/50"
                        disabled={syncLoading[connection.id]}
                        onClick={() => handleConfigure(connection.id, connection.name)}
                      >
                        {syncLoading[connection.id] ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Configuring...
                          </>
                        ) : (
                          'Configure'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border/50"
                        disabled={syncLoading[connection.id]}
                        onClick={() => handleSyncNow(connection.id, connection.name)}
                      >
                        {syncLoading[connection.id] ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Syncing...
                          </>
                        ) : (
                          'Sync Now'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import Configuration */}
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="text-cosmic">Import SWIS Data</CardTitle>
                <CardDescription>
                  Import Level-2 data from ISSDC or upload local files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Data Source</Label>
                  <select
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-muted/20 border border-border/50 rounded-md text-sm"
                  >
                    <option value="issdc">ISSDC (ISRO)</option>
                    <option value="cactus">CACTUS CME Database</option>
                    <option value="local">Local Files (CDF)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      defaultValue="2024-08-01"
                      className="mt-1 bg-muted/20 border-border/50"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <Input
                      type="date"
                      defaultValue="2024-12-28"
                      className="mt-1 bg-muted/20 border-border/50"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Parameters</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Particle Flux', 'Number Density', 'Temperature', 'Velocity'].map((param) => (
                      <label key={param} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span>{param}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {isImporting && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Import Progress</Label>
                      <span className="text-sm text-accent">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full bg-accent text-accent-foreground"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Start Import'}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Imports */}
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="text-cosmic">Recent Imports</CardTitle>
                <CardDescription>
                  History of data imports and processing status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentImports.map((importItem) => (
                    <div key={importItem.id} className="p-3 bg-muted/20 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(importItem.status)}
                          <span className="font-semibold text-sm">{importItem.source}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{importItem.date}</span>
                      </div>

                      <div className="text-sm text-muted-foreground mb-1">{importItem.type}</div>

                      <div className="flex justify-between text-xs">
                        <span>{importItem.size}</span>
                        <span>{importItem.records} records</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Options */}
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="text-cosmic">Export Data</CardTitle>
                <CardDescription>
                  Export processed data and analysis results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Export Type</Label>
                  <select className="w-full mt-1 px-3 py-2 bg-muted/20 border border-border/50 rounded-md text-sm">
                    <option>CME Detection Results</option>
                    <option>Threshold Analysis</option>
                    <option>Raw SWIS Data</option>
                    <option>Statistical Summary</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Format</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {['CSV', 'JSON', 'CDF'].map((format) => (
                      <label key={format} className="flex items-center space-x-2 text-sm">
                        <input type="radio" name="format" defaultChecked={format === 'CSV'} />
                        <span>{format}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Date Range</Label>
                    <Input
                      type="date"
                      defaultValue="2024-12-01"
                      className="mt-1 bg-muted/20 border-border/50"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">To</Label>
                    <Input
                      type="date"
                      defaultValue="2024-12-28"
                      className="mt-1 bg-muted/20 border-border/50"
                    />
                  </div>
                </div>

                <Button className="w-full bg-accent text-accent-foreground">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Export
                </Button>
              </CardContent>
            </Card>

            {/* Reports */}
            <Card className="space-card">
              <CardHeader>
                <CardTitle className="text-cosmic">Analysis Reports</CardTitle>
                <CardDescription>
                  Generate comprehensive analysis reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { title: 'Monthly CME Summary', desc: 'December 2024 analysis', size: '2.4 MB' },
                    { title: 'Threshold Validation Report', desc: 'Current configuration analysis', size: '1.8 MB' },
                    { title: 'SWIS Data Quality Report', desc: 'Coverage and accuracy metrics', size: '956 KB' }
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div>
                        <div className="font-semibold text-sm">{report.title}</div>
                        <div className="text-xs text-muted-foreground">{report.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{report.size}</div>
                        <Button variant="outline" size="sm" className="mt-1 border-border/50">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* File Upload */}
      <Card className="space-card">
        <CardHeader>
          <CardTitle className="text-cosmic">Import SWIS Data</CardTitle>
          <CardDescription>
            Upload SWIS Level-2 CDF files for CME detection analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop SWIS CDF files here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".cdf,.CDF"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleUpload('standard')}
                    disabled={uploadMutation.isPending || selectedFiles.every(f => f.status !== 'pending')}
                    className="bg-solar-orange hover:bg-solar-orange/90 text-white"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload All
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleUpload('ml')}
                    disabled={mlAnalysisMutation.isPending || selectedFiles.every(f => f.status !== 'pending')}
                    variant="outline"
                    className="border-green-500 text-green-500 hover:bg-green-50"
                  >
                    {mlAnalysisMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        ML Analysis
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFiles([])}
                    className="border-border/50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/20">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {file.lastModified.toLocaleDateString()}
                        </p>
                        {file.analysisType === 'ml' && (
                          <p className="text-xs text-green-400">
                            🧠 ML Analysis {file.status === 'completed' ? 'Complete' : 'Pending'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {file.status === 'uploading' && (
                        <div className="w-24">
                          <Progress value={file.progress} className="h-2" />
                        </div>
                      )}

                      <Badge variant="outline" className={getStatusColor(file.status)}>
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(file.name)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comprehensive CME Detection Results from Upload */}
              {selectedFiles.some(f => f.uploadResults?.detection_results || f.uploadResults?.detected_cme_events) && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-cyan-400 text-lg">🔍 Comprehensive CME Detection Analysis</h4>
                  <div className="space-y-4">
                    {selectedFiles
                      .filter(f => f.uploadResults?.detection_results || f.uploadResults?.detected_cme_events)
                      .map((file, index) => {
                        const result = file.uploadResults!;
                        const detection = result.detection_results;
                        const events = result.detected_cme_events || [];
                        const stats = detection?.statistics;
                        const summary = detection?.analysis_summary;

                        return (
                          <div key={index} className="p-6 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/5">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-cyan-500/20">
                              <div>
                                <h5 className="font-semibold text-lg text-cyan-300">{file.name}</h5>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Processing Time: {result.processing_time || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 text-lg px-4 py-2">
                                  <Target className="h-4 w-4 mr-2" />
                                  {detection?.total_detections || 0} CME Events
                                </Badge>
                                {stats && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Avg Confidence: {(stats.average_confidence * 100).toFixed(1)}%
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Summary Statistics */}
                            {stats && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                                  <span className="text-xs text-muted-foreground">Detection Rate</span>
                                  <p className="text-lg font-bold text-cyan-400">
                                    {detection?.detection_rate?.toFixed(2) || 0}%
                                  </p>
                                </div>
                                <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                                  <span className="text-xs text-muted-foreground">Max Confidence</span>
                                  <p className="text-lg font-bold text-green-400">
                                    {(stats.max_confidence * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                                  <span className="text-xs text-muted-foreground">Data Points Analyzed</span>
                                  <p className="text-lg font-bold text-blue-400">
                                    {detection?.data_points_analyzed || 0}
                                  </p>
                                </div>
                                <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                                  <span className="text-xs text-muted-foreground">Model Version</span>
                                  <p className="text-sm font-medium text-purple-400">
                                    {summary?.model_version || 'v2.1.3'}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Severity Distribution */}
                            {stats?.severity_distribution && (
                              <div className="mb-4 p-3 rounded bg-purple-500/10 border border-purple-500/20">
                                <h6 className="font-medium text-purple-300 mb-2">📊 Severity Distribution</h6>
                                <div className="flex gap-4 text-sm">
                                  {Object.entries(stats.severity_distribution).map(([severity, count]) => (
                                    <div key={severity}>
                                      <span className="text-muted-foreground capitalize">{severity}:</span>
                                      <span className="ml-2 font-bold text-purple-400">{count as number}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* All Detected CME Events */}
                            {events && events.length > 0 && (
                              <div className="mt-4">
                                <h6 className="font-semibold text-cyan-300 mb-3 flex items-center">
                                  <Zap className="h-4 w-4 mr-2" />
                                  Detected CME Events ({events.length})
                                </h6>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {events.slice(0, 10).map((event: any, eventIdx: number) => (
                                    <div key={eventIdx} className="p-4 rounded-lg border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/5">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={
                                              event.severity === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                                              event.severity === 'Medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                            }>
                                              Event #{event.event_id || eventIdx + 1} • {event.severity}
                                            </Badge>
                                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                              {(event.confidence * 100).toFixed(1)}% Confidence
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(event.timestamp).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Detection Reasons */}
                                      {event.detection_reasons && (
                                        <div className="mb-3 p-2 rounded bg-orange-500/10 border border-orange-500/20">
                                          <p className="text-xs font-medium text-orange-300 mb-1">🔍 Detection Reasons:</p>
                                          <p className="text-xs text-muted-foreground">{event.detection_reasons}</p>
                                        </div>
                                      )}

                                      {/* Key Parameters */}
                                      {event.parameters && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                                          {event.parameters.speed && (
                                            <div>
                                              <span className="text-muted-foreground">Speed:</span>
                                              <p className="font-medium text-green-400">{event.parameters.speed.toFixed(1)} km/s</p>
                                            </div>
                                          )}
                                          {event.parameters.density && (
                                            <div>
                                              <span className="text-muted-foreground">Density:</span>
                                              <p className="font-medium text-blue-400">{event.parameters.density.toFixed(2)} cm⁻³</p>
                                            </div>
                                          )}
                                          {event.parameters.bz_gsm && (
                                            <div>
                                              <span className="text-muted-foreground">Bz (GSM):</span>
                                              <p className="font-medium text-purple-400">{event.parameters.bz_gsm.toFixed(1)} nT</p>
                                            </div>
                                          )}
                                          {event.parameters.bt && (
                                            <div>
                                              <span className="text-muted-foreground">Bt:</span>
                                              <p className="font-medium text-cyan-400">{event.parameters.bt.toFixed(1)} nT</p>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Triggered Indicators */}
                                      {event.indicators && Object.keys(event.indicators).length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-orange-500/20">
                                          <p className="text-xs font-medium text-orange-300 mb-1">
                                            ⚡ Triggered Indicators ({event.indicator_count || 0}):
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {Object.entries(event.indicators)
                                              .filter(([_, val]) => typeof val === 'number' && val > 0)
                                              .slice(0, 6)
                                              .map(([indicator, value]) => (
                                                <Badge key={String(indicator)} variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                                                  {String(indicator).replace(/_/g, ' ')}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                                </Badge>
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {events.length > 10 && (
                                    <p className="text-xs text-center text-muted-foreground pt-2">
                                      ... and {events.length - 10} more events (showing top 10 by confidence)
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Analysis Method */}
                            {summary && (
                              <div className="mt-4 p-3 rounded bg-blue-500/10 border border-blue-500/20">
                                <p className="text-xs font-medium text-blue-300 mb-1">🧠 Analysis Method:</p>
                                <p className="text-xs text-muted-foreground">{summary.detection_method}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Algorithm: {summary.algorithm}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Parameters Analyzed: {summary.total_parameters_analyzed || 'N/A'} • 
                                  Indicators Evaluated: {summary.total_indicators_evaluated || 'N/A'}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ML Analysis Results - COMPREHENSIVE */}
              {selectedFiles.some(f => f.mlResults) && (
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-2xl text-green-400 flex items-center gap-2">
                      <Brain className="h-6 w-6" />
                      🚀 Comprehensive ML Analysis Results
                    </h4>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 px-3 py-1">
                      Advanced Analysis Complete
                    </Badge>
                  </div>

                  {selectedFiles
                    .filter(f => f.mlResults)
                    .map((file, fileIndex) => {
                      const result = file.mlResults!;
                      const metrics = result.ml_results.model_performance;
                      const predictions = result.ml_results.predictions || [];
                      const analysisSummary = result.analysis_summary;

                      return (
                        <div key={fileIndex} className="space-y-6">
                          {/* File Header */}
                          <div className="p-6 rounded-lg border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-blue-500/5 to-purple-500/5">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h5 className="font-bold text-xl text-green-300 mb-1">{file.name}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB • {result.file_info.data_points.toLocaleString()} data points
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 text-lg px-4 py-2">
                                  <Target className="h-4 w-4 mr-2" />
                                  {result.ml_results.events_detected} Events Detected
                                </Badge>
                              </div>
                            </div>

                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                              <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Processing Time</p>
                                <p className="font-bold text-blue-400">{metrics.processing_time}</p>
                              </div>
                              <div className="p-3 rounded bg-purple-500/10 border border-purple-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Features</p>
                                <p className="font-bold text-purple-400">{metrics.feature_count}</p>
                              </div>
                              <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Data Coverage</p>
                                <p className="font-bold text-yellow-400">{metrics.analysis_coverage}</p>
                              </div>
                              <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Model Version</p>
                                <p className="font-bold text-cyan-400">{metrics.model_version}</p>
                              </div>
                              {metrics.processing_speed && (
                                <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                                  <p className="text-xs text-muted-foreground mb-1">Speed</p>
                                  <p className="font-bold text-green-400">{metrics.processing_speed}</p>
                                </div>
                              )}
                              {metrics.events_per_day && (
                                <div className="p-3 rounded bg-orange-500/10 border border-orange-500/20">
                                  <p className="text-xs text-muted-foreground mb-1">Events/Day</p>
                                  <p className="font-bold text-orange-400">{metrics.events_per_day}</p>
                                </div>
                              )}
                            </div>

                            {/* Calculation Steps */}
                            {metrics.calculation_steps && metrics.calculation_steps.length > 0 && (
                              <div className="mb-6">
                                <h6 className="font-bold text-lg text-cyan-400 mb-4 flex items-center gap-2">
                                  <Calculator className="h-5 w-5" />
                                  Step-by-Step Calculation Process
                                </h6>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                  {metrics.calculation_steps.map((step, stepIdx) => (
                                    <div key={stepIdx} className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                                            Step {step.step}
                                          </Badge>
                                          <span className="font-semibold text-cyan-300">{step.description}</span>
                                        </div>
                                        <div className="text-right">
                                          <Badge variant="outline" className="text-xs">
                                            {step.processing_time_ms}ms
                                          </Badge>
                                          <Badge variant="outline" className="text-xs ml-2 bg-green-500/20 text-green-400">
                                            Quality: {step.data_quality_score}%
                                          </Badge>
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">{step.details}</p>
                                      {step.features_generated && (
                                        <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                                          {Object.entries(step.features_generated).map(([key, value]) => (
                                            <div key={key} className="text-muted-foreground">
                                              {key.replace(/_/g, ' ')}: <span className="text-cyan-400 font-medium">{value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {step.indicators_analyzed && (
                                        <div className="mt-2">
                                          <p className="text-xs text-muted-foreground mb-1">Indicators:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {step.indicators_analyzed.slice(0, 8).map((ind, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                                                {ind}
                                              </Badge>
                                            ))}
                                            {step.indicators_analyzed.length > 8 && (
                                              <Badge variant="outline" className="text-xs">
                                                +{step.indicators_analyzed.length - 8} more
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Solar Indices */}
                            {metrics.solar_indices && (
                              <div className="mb-6">
                                <h6 className="font-bold text-lg text-yellow-400 mb-4 flex items-center gap-2">
                                  <Globe className="h-5 w-5" />
                                  Real-Time Solar Indices (External Data Sources)
                                </h6>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                  {metrics.solar_indices.sunspot_number && (
                                    <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                                      <p className="text-xs text-muted-foreground mb-1">Sunspot Number</p>
                                      <p className="font-bold text-yellow-400 text-lg">{metrics.solar_indices.sunspot_number.current}</p>
                                      <p className="text-xs text-muted-foreground mt-1">Source: {metrics.solar_indices.sunspot_number.source}</p>
                                    </div>
                                  )}
                                  {metrics.solar_indices.f10_7_flux && (
                                    <div className="p-3 rounded bg-orange-500/10 border border-orange-500/20">
                                      <p className="text-xs text-muted-foreground mb-1">F10.7 Flux</p>
                                      <p className="font-bold text-orange-400 text-lg">{metrics.solar_indices.f10_7_flux.current} {metrics.solar_indices.f10_7_flux.unit}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{metrics.solar_indices.f10_7_flux.source}</p>
                                    </div>
                                  )}
                                  {metrics.solar_indices.kp_index && (
                                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                                      <p className="text-xs text-muted-foreground mb-1">Kp Index</p>
                                      <p className="font-bold text-red-400 text-lg">{metrics.solar_indices.kp_index.current}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{metrics.solar_indices.kp_index.geomagnetic_storm_level}</p>
                                    </div>
                                  )}
                                  {metrics.solar_indices.dst_index && (
                                    <div className="p-3 rounded bg-pink-500/10 border border-pink-500/20">
                                      <p className="text-xs text-muted-foreground mb-1">Dst Index</p>
                                      <p className="font-bold text-pink-400 text-lg">{metrics.solar_indices.dst_index.current} {metrics.solar_indices.dst_index.unit}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{metrics.solar_indices.dst_index.source}</p>
                                    </div>
                                  )}
                                  {metrics.solar_indices.ae_index && (
                                    <div className="p-3 rounded bg-indigo-500/10 border border-indigo-500/20">
                                      <p className="text-xs text-muted-foreground mb-1">AE Index</p>
                                      <p className="font-bold text-indigo-400 text-lg">{metrics.solar_indices.ae_index.current} {metrics.solar_indices.ae_index.unit}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{metrics.solar_indices.ae_index.source}</p>
                                    </div>
                                  )}
                                  {metrics.solar_indices.proton_flux_10mev && (
                                    <div className="p-3 rounded bg-teal-500/10 border border-teal-500/20">
                                      <p className="text-xs text-muted-foreground mb-1">Proton Flux 10MeV</p>
                                      <p className="font-bold text-teal-400 text-lg">{metrics.solar_indices.proton_flux_10mev.current} {metrics.solar_indices.proton_flux_10mev.unit}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{metrics.solar_indices.proton_flux_10mev.source}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Analysis Summary */}
                            {analysisSummary && (
                              <div className="mb-6 p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                                <h6 className="font-bold text-lg text-purple-400 mb-4">📊 Analysis Summary</h6>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Total Events</p>
                                    <p className="font-bold text-lg text-purple-300">{analysisSummary.total_events_detected}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">High Severity</p>
                                    <p className="font-bold text-lg text-red-400">{analysisSummary.high_severity_events}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Avg Confidence</p>
                                    <p className="font-bold text-lg text-green-400">{(analysisSummary.average_confidence * 100).toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Max Velocity</p>
                                    <p className="font-bold text-lg text-yellow-400">{analysisSummary.max_velocity_detected.toFixed(1)} km/s</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Algorithm</p>
                                    <p className="font-medium text-xs text-purple-300">{analysisSummary.detection_algorithm}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Validation</p>
                                    <p className="font-medium text-xs text-purple-300">{analysisSummary.validation_method}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">False Positive</p>
                                    <p className="font-medium text-xs text-purple-300">{analysisSummary.false_positive_estimate}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Sensitivity</p>
                                    <p className="font-medium text-xs text-purple-300">{analysisSummary.sensitivity}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* All Detected Events */}
                            {predictions.length > 0 && (
                              <div>
                                <h6 className="font-bold text-lg text-orange-400 mb-4 flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5" />
                                  All Detected CME Events ({predictions.length})
                                </h6>
                                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                  {predictions.map((prediction, predIdx) => (
                                    <div key={predIdx} className="p-4 rounded-lg border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/5">
                                      <div className="flex items-start justify-between mb-3">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <Badge className={prediction.physics.severity === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/50' : prediction.physics.severity === 'Medium' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'}>
                                              {prediction.physics.severity} Severity
                                            </Badge>
                                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                                              Confidence: {(prediction.ml_metrics.confidence_score * 100).toFixed(1)}%
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">Event ID: {prediction.event_id}</span>
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            Detected: {new Date(prediction.detection_time).toLocaleString()}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Estimated Arrival: {new Date(prediction.physics.estimated_arrival).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Parameters Grid */}
                                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3 text-sm">
                                        <div>
                                          <p className="text-xs text-muted-foreground">Velocity</p>
                                          <p className="font-bold text-blue-400">{prediction.parameters.velocity.toFixed(1)} km/s</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Density</p>
                                          <p className="font-bold text-green-400">{prediction.parameters.density.toFixed(2)} cm⁻³</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Temperature</p>
                                          <p className="font-bold text-yellow-400">{(prediction.parameters.temperature / 1000).toFixed(0)}k K</p>
                                        </div>
                                        {prediction.parameters.bz_gsm !== undefined && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Bz (GSM)</p>
                                            <p className={`font-bold ${prediction.parameters.bz_gsm < -5 ? 'text-red-400' : 'text-cyan-400'}`}>
                                              {prediction.parameters.bz_gsm.toFixed(1)} nT
                                            </p>
                                          </div>
                                        )}
                                        {prediction.parameters.bt !== undefined && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Bt</p>
                                            <p className="font-bold text-purple-400">{prediction.parameters.bt.toFixed(1)} nT</p>
                                          </div>
                                        )}
                                        {prediction.parameters.dynamic_pressure !== undefined && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Dynamic Pressure</p>
                                            <p className="font-bold text-orange-400">{prediction.parameters.dynamic_pressure.toFixed(2)} nPa</p>
                                          </div>
                                        )}
                                        {prediction.parameters.mach_number !== undefined && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Mach Number</p>
                                            <p className="font-bold text-pink-400">{prediction.parameters.mach_number.toFixed(2)}</p>
                                          </div>
                                        )}
                                        {prediction.parameters.plasma_beta !== undefined && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Plasma Beta</p>
                                            <p className="font-bold text-indigo-400">{prediction.parameters.plasma_beta.toFixed(2)}</p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Detection Details */}
                                      {prediction.detection_details && (
                                        <div className="mt-3 pt-3 border-t border-orange-500/20">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <p className="text-xs text-muted-foreground mb-2">Triggered Indicators:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {prediction.detection_details.triggered_indicators.map((ind, idx) => (
                                                  <Badge key={idx} variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                                                    {ind}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground mb-1">Detection Reasons:</p>
                                              <p className="text-xs text-orange-300">{prediction.detection_details.detection_reasons}</p>
                                            </div>
                                            {prediction.detection_details.space_weather_impact && (
                                              <div>
                                                <p className="text-xs text-muted-foreground mb-2">Space Weather Impact:</p>
                                                <div className="space-y-1">
                                                  <p className="text-xs">Geomagnetic Storm: <span className="font-medium text-red-400">{prediction.detection_details.space_weather_impact.geomagnetic_storm_probability}</span></p>
                                                  <p className="text-xs">Aurora Activity: <span className="font-medium text-purple-400">{prediction.detection_details.space_weather_impact.aurora_activity}</span></p>
                                                  <p className="text-xs">Satellite Impact Risk: <span className="font-medium text-yellow-400">{prediction.detection_details.space_weather_impact.satellite_impact_risk}</span></p>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* ML Metrics */}
                                      <div className="mt-3 pt-3 border-t border-orange-500/20 grid grid-cols-3 gap-3 text-xs">
                                        <div>
                                          <p className="text-muted-foreground">Probability</p>
                                          <p className="font-medium text-green-400">{(prediction.ml_metrics.probability * 100).toFixed(1)}%</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Anomaly Score</p>
                                          <p className="font-medium text-yellow-400">{prediction.ml_metrics.anomaly_score.toFixed(3)}</p>
                                        </div>
                                        {prediction.ml_metrics.feature_importance_score !== undefined && (
                                          <div>
                                            <p className="text-muted-foreground">Feature Score</p>
                                            <p className="font-medium text-purple-400">{prediction.ml_metrics.feature_importance_score.toFixed(3)}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Data Quality Metrics */}
                            {metrics.data_quality_metrics && (
                              <div className="mt-6 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
                                <h6 className="font-bold text-lg text-cyan-400 mb-3">📈 Data Quality Metrics</h6>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Overall Quality</p>
                                    <p className="font-bold text-2xl text-cyan-400">{metrics.data_quality_metrics.overall_quality_score}%</p>
                                    <Badge className="bg-green-500/20 text-green-400 mt-1">Grade A</Badge>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Completeness</p>
                                    <p className="font-bold text-xl text-cyan-400">{metrics.data_quality_metrics.completeness}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Reliability</p>
                                    <p className="font-bold text-xl text-green-400">{metrics.data_quality_metrics.reliability}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Validation</p>
                                    <p className="font-medium text-xs text-cyan-300">{metrics.data_quality_metrics.validation_status}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Parameter Statistics */}
                            {result.data_summary.parameter_statistics && (
                              <div className="mt-6">
                                <h6 className="font-bold text-lg text-blue-400 mb-4">📊 Parameter Statistics</h6>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {result.data_summary.parameter_statistics.velocity && (
                                    <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                                      <h6 className="font-semibold text-blue-300 mb-3 block">Velocity ({result.data_summary.parameter_statistics.velocity.unit})</h6>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-muted-foreground">Mean:</span> <span className="font-medium">{result.data_summary.parameter_statistics.velocity.mean.toFixed(1)}</span></div>
                                        <div><span className="text-muted-foreground">Std:</span> <span className="font-medium">{result.data_summary.parameter_statistics.velocity.std.toFixed(1)}</span></div>
                                        <div><span className="text-muted-foreground">Min:</span> <span className="font-medium">{result.data_summary.parameter_statistics.velocity.min.toFixed(1)}</span></div>
                                        <div><span className="text-muted-foreground">Max:</span> <span className="font-medium">{result.data_summary.parameter_statistics.velocity.max.toFixed(1)}</span></div>
                                      </div>
                                    </div>
                                  )}
                                  {result.data_summary.parameter_statistics.density && (
                                    <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                                      <h6 className="font-semibold text-green-300 mb-3 block">Density ({result.data_summary.parameter_statistics.density.unit})</h6>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-muted-foreground">Mean:</span> <span className="font-medium">{result.data_summary.parameter_statistics.density.mean.toFixed(2)}</span></div>
                                        <div><span className="text-muted-foreground">Std:</span> <span className="font-medium">{result.data_summary.parameter_statistics.density.std.toFixed(2)}</span></div>
                                        <div><span className="text-muted-foreground">Min:</span> <span className="font-medium">{result.data_summary.parameter_statistics.density.min.toFixed(2)}</span></div>
                                        <div><span className="text-muted-foreground">Max:</span> <span className="font-medium">{result.data_summary.parameter_statistics.density.max.toFixed(2)}</span></div>
                                      </div>
                                    </div>
                                  )}
                                  {result.data_summary.parameter_statistics.temperature && (
                                    <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                                      <h6 className="font-semibold text-yellow-300 mb-3 block">Temperature ({result.data_summary.parameter_statistics.temperature.unit})</h6>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-muted-foreground">Mean:</span> <span className="font-medium">{(result.data_summary.parameter_statistics.temperature.mean / 1000).toFixed(0)}k</span></div>
                                        <div><span className="text-muted-foreground">Std:</span> <span className="font-medium">{(result.data_summary.parameter_statistics.temperature.std / 1000).toFixed(0)}k</span></div>
                                        <div><span className="text-muted-foreground">Min:</span> <span className="font-medium">{(result.data_summary.parameter_statistics.temperature.min / 1000).toFixed(0)}k</span></div>
                                        <div><span className="text-muted-foreground">Max:</span> <span className="font-medium">{(result.data_summary.parameter_statistics.temperature.max / 1000).toFixed(0)}k</span></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Overview */}
      <Card className="space-card">
        <CardHeader>
          <CardTitle className="text-cosmic">Data Management Overview</CardTitle>
          <CardDescription>
            Monitor data coverage, import SWIS files, and export analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Database className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-400">Data Coverage</p>
                <p className="text-xs text-muted-foreground">
                  {dataSummary?.data_coverage || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <FileText className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-400">Total Files</p>
                <p className="text-xs text-muted-foreground">
                  {dataSummary?.total_cme_events || 15} CDF files
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Last Update</p>
                <p className="text-xs text-muted-foreground">
                  {dataSummary?.last_update 
                    ? (() => {
                        try {
                          const lastUpdate = new Date(dataSummary.last_update);
                          const now = new Date();
                          const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);
                          if (diffMinutes < 1) return 'Just now';
                          if (diffMinutes < 60) return `${diffMinutes} min ago`;
                          const diffHours = Math.floor(diffMinutes / 60);
                          if (diffHours < 24) return `${diffHours} hr ago`;
                          return lastUpdate.toLocaleTimeString();
                        } catch {
                          return 'Unknown';
                        }
                      })()
                    : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <AlertTriangle className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-purple-400">System Health</p>
                <p className="text-xs text-muted-foreground">
                  {dataSummary?.system_health || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality */}
      <Card className="space-card">
        <CardHeader>
          <CardTitle className="text-cosmic">Data Quality Monitor</CardTitle>
          <CardDescription>
            Monitor data quality metrics and processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Quality Metrics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Completeness</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={dataSummary?.data_coverage 
                        ? parseFloat(dataSummary.data_coverage.replace('%', '')) 
                        : 0} 
                      className="w-20 h-2" 
                    />
                    <span className="text-sm font-medium">{dataSummary?.data_coverage || '0%'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Signal Quality</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={95.2} className="w-20 h-2" />
                    <span className="text-sm font-medium">95.2%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Calibration Status</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={100} className="w-20 h-2" />
                    <span className="text-sm font-medium">100%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Processing Status</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm">SWIS Data Processing</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-sm">CME Detection</span>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                    Running
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-sm">Threshold Optimization</span>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                    Scheduled
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons for Model Viewing */}
      <div className="mt-6 flex gap-4 justify-center">
        <Button
          onClick={() => setShowCalculationsViewer(true)}
          variant="outline"
          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
        >
          <Calculator className="h-4 w-4 mr-2" />
          View Model Calculations
        </Button>
        <Button
          onClick={() => setShowScriptViewer(true)}
          variant="outline"
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
        >
          <Code className="h-4 w-4 mr-2" />
          View Detection Script
        </Button>
      </div>

      {/* Model Calculations Viewer Modal */}
      {showCalculationsViewer && (
        <div className="fixed inset-0 z-50 overflow-auto">
          <ModelCalculationsViewer
            date={selectedDate}
            timeRange="30d"
            onClose={() => setShowCalculationsViewer(false)}
          />
        </div>
      )}

      {/* Script Viewer Modal */}
      {showScriptViewer && (
        <div className="fixed inset-0 z-50 overflow-auto">
          <ScriptViewer
            onClose={() => setShowScriptViewer(false)}
          />
        </div>
      )}
    </motion.div>
  );
};

export default DataImportExport;
