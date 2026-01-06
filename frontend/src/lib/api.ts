/**
 * API Service for Aditya-L1 CME Detection System
 * 
 * Provides functions to interact with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AnalysisRequest {
  start_date: string;
  end_date: string;
  analysis_type?: 'full' | 'quick' | 'threshold_only';
  config_overrides?: Record<string, any>;
  advanced_settings?: {
    velocityThreshold?: number;
    accelerationThreshold?: number;
    angularWidthMin?: number;
    confidenceThreshold?: number;
    includePartialHalos?: boolean;
    filterWeakEvents?: boolean;
  };
}

export interface ThresholdConfig {
  velocity_enhancement: number;
  density_enhancement: number;
  temperature_anomaly: number;
  combined_score_threshold: number;
}

export interface CMEEvent {
  datetime: string;
  speed: number;
  angular_width: number;
  source_location: string;
  estimated_arrival: string;
  confidence: number;
}

export interface AnalysisResult {
  cme_events: CMEEvent[];
  thresholds: Record<string, number>;
  performance_metrics: Record<string, number>;
  data_summary: Record<string, any>;
  charts_data: Record<string, any>;
}

export interface ParticleData {
  timestamps: string[];
  // Plasma Parameters
  velocity: number[];
  density: number[];
  temperature: number[];
  flux: number[];
  // Magnetic Field Parameters
  bx?: number[];
  by?: number[];
  bz?: number[];
  bt?: number[];
  // Derived Parameters
  plasma_beta?: number[];
  alfven_mach?: number[];
  magnetosonic_mach?: number[];
  electric_field?: number[];
  flow_pressure?: number[];
  // Geomagnetic Indices
  dst?: number[];
  kp?: number[];
  ae?: number[];
  ap?: number[];
  al?: number[];
  au?: number[];
  // Additional Parameters
  flow_longitude?: number[];
  flow_latitude?: number[];
  alpha_proton_ratio?: number[];
  proton_flux?: number[];
  // CME Detection Data
  cme_detection?: number[];
  cme_confidence?: number[];
  cme_severity?: string[];
  detection_reasons?: string[];
  units: {
    velocity: string;
    density: string;
    temperature: string;
    flux: string;
    bx?: string;
    by?: string;
    bz?: string;
    bt?: string;
    plasma_beta?: string;
    alfven_mach?: string;
    magnetosonic_mach?: string;
    electric_field?: string;
    flow_pressure?: string;
    dst?: string;
    kp?: string;
    ae?: string;
    ap?: string;
    al?: string;
    au?: string;
    flow_longitude?: string;
    flow_latitude?: string;
    alpha_proton_ratio?: string;
    proton_flux?: string;
  };
  data_source?: string;
}

export interface MLAnalysisResult {
  analysis_type: string;
  file_info: {
    filename: string;
    size_bytes: number;
    data_points: number;
    synthetic_parameters?: string[] | null;
    note?: string | null;
  };
  ml_results: {
    events_detected: number;
    predictions: MLPrediction[];
    model_performance: ModelMetrics;
  };
  data_summary: {
    time_range: {
      start: string | null;
      end: string | null;
      duration_hours: number;
      duration_days?: number;
      data_points_per_hour?: number;
    };
    data_quality: {
      completeness: string;
      valid_measurements: number;
      missing_data_points?: number;
      data_gaps?: string;
      outlier_count?: string;
      quality_grade?: string;
    };
    parameter_statistics?: {
      velocity?: { mean: number; std: number; min: number; max: number; unit: string };
      density?: { mean: number; std: number; min: number; max: number; unit: string };
      temperature?: { mean: number; std: number; min: number; max: number; unit: string };
    };
  };
  analysis_summary?: {
    total_events_detected: number;
    high_severity_events: number;
    medium_severity_events: number;
    low_severity_events: number;
    average_confidence: number;
    max_velocity_detected: number;
    fastest_transit_time: number;
    detection_algorithm: string;
    validation_method: string;
    false_positive_estimate: string;
    sensitivity: string;
  };
  recommendations: string[];
  timestamp: string;
}

export interface ModelMetrics {
  total_data_points: number;
  analysis_coverage: string;
  feature_count: number;
  detection_rate: string;
  events_per_day?: number;
  model_version: string;
  processing_time: string;
  processing_speed?: string;
  calculation_steps?: CalculationStep[];
  solar_indices?: SolarIndices;
  data_quality_metrics?: {
    overall_quality_score: number;
    completeness: string;
    reliability: string;
    validation_status: string;
  };
}

export interface CalculationStep {
  step: number;
  description: string;
  details: string;
  parameters_extracted?: string[];
  outliers_removed?: number;
  gaps_filled?: number;
  features_generated?: {
    basic_parameters?: number;
    moving_averages?: number;
    gradients?: number;
    statistical_features?: number;
    wavelet_coefficients?: number;
    composite_indicators?: number;
    cross_correlations?: number;
    physics_derived?: number;
  };
  catalog_events?: number;
  matched_windows?: number;
  thresholds_determined?: any;
  background_statistics?: any;
  detection_method?: string;
  indicators_analyzed?: string[];
  detection_logic?: string;
  severity_distribution?: {
    high: number;
    medium: number;
    low: number;
  };
  confidence_statistics?: {
    mean: number;
    max: number;
    min: number;
  };
  physics_model?: string;
  transit_calculations?: any;
  data_quality_score: number;
  processing_time_ms: number;
}

export interface SolarIndices {
  sunspot_number?: {
    current: number;
    trend: string;
    '30_day_avg'?: number;
    source: string;
  };
  f10_7_flux?: {
    current: number;
    unit: string;
    trend: string;
    source: string;
  };
  kp_index?: {
    current: number;
    max_24h?: number;
    geomagnetic_storm_level?: string;
    source: string;
  };
  dst_index?: {
    current: number;
    unit: string;
    min_24h?: number;
    source: string;
  };
  ae_index?: {
    current: number;
    unit: string;
    max_24h?: number;
    source: string;
  };
  proton_flux_10mev?: {
    current: number;
    unit: string;
    threshold_exceeded: boolean;
    source: string;
  };
}

export interface MLPrediction {
  event_id: string;
  detection_time: string;
  parameters: {
    velocity: number;
    density: number;
    temperature: number;
    bz_gsm?: number;
    bt?: number;
    dynamic_pressure?: number;
    thermal_speed?: number;
    mach_number?: number;
    plasma_beta?: number;
  };
  ml_metrics: {
    probability: number;
    confidence_score: number;
    anomaly_score: number;
    detection_method?: string;
    feature_importance_score?: number;
  };
  physics: {
    estimated_arrival: string;
    transit_time_hours: number;
    transit_time_days?: number;
    severity: 'Low' | 'Medium' | 'High';
    velocity_category?: string;
    impact_potential?: string;
  };
  detection_details?: {
    triggered_indicators: string[];
    detection_reasons: string;
    parameter_anomalies?: {
      velocity_enhancement_ratio?: number;
      density_compression_ratio?: number;
      temperature_anomaly?: string;
    };
    space_weather_impact?: {
      geomagnetic_storm_probability?: string;
      aurora_activity?: string;
      satellite_impact_risk?: string;
    };
  };
  data_source: string;
  validation_status?: string;
}

export interface MLModelInfo {
  model_type: string;
  version: string;
  training_data: string;
  features: string[];
  performance_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
  };
  detection_capabilities: {
    min_velocity_threshold: string;
    temporal_resolution: string;
    prediction_horizon: string;
    confidence_threshold: string;
  };
  last_training: string;
  model_size: string;
  supported_formats: string[];
}

export interface CMEDetectionEvent {
  event_id?: number;
  id?: string;
  timestamp: string;
  confidence: number;
  severity: string;
  detection_reasons?: string;
  parameters?: {
    speed?: number;
    velocity?: number;
    density?: number;
    temperature?: number;
    bz_gsm?: number;
    bz?: number;
    bt?: number;
    [key: string]: any;
  };
  indicators?: {
    [key: string]: number | string;
  };
  indicator_count?: number;
}

export interface DetectionStatistics {
  average_confidence: number;
  max_confidence: number;
  min_confidence: number;
  severity_distribution?: {
    [key: string]: number;
  };
  most_common_indicators?: {
    [key: string]: number;
  };
}

export interface AnalysisSummary {
  total_parameters_analyzed?: number;
  total_indicators_evaluated?: number;
  detection_method: string;
  model_version?: string;
  algorithm?: string;
}

export interface DetectionResults {
  total_detections: number;
  detection_rate: number;
  data_points_analyzed: number;
  all_events?: CMEDetectionEvent[];
  statistics?: DetectionStatistics;
  analysis_summary?: AnalysisSummary;
  error?: string;
  status?: string;
}

export interface UploadResult {
  filename: string;
  file_size: number;
  status: 'analyzed' | 'error' | 'processed';
  processing_status: 'completed' | 'failed';
  processing_time?: string;
  data_quality?: {
    total_points: number;
    valid_points: number;
    coverage_percentage: number;
    time_range: {
      start: string;
      end: string;
    };
    parameter_ranges: {
      velocity?: { min: number; max: number; mean: number };
      density?: { min: number; max: number; mean: number };
      [key: string]: any;
    };
  };
  detection_results?: DetectionResults;
  ml_analysis?: {
    cme_events_detected: number;
    detection_method: string;
    model_confidence: string;
    analysis_timestamp: string;
  };
  detected_cme_events?: CMEDetectionEvent[];
  recommendations: string[];
  error?: string;
  raw_data_sample?: any;
}

export interface DataSummary {
  mission_status: string;
  data_coverage: string;
  last_update: string;
  total_cme_events: number;
  active_alerts: number;
  system_health: string;
}

export interface RecentCMEEvent {
  id?: string;
  date: string;
  magnitude: string;
  speed: number;
  angular_width: number;
  type: string;
  confidence: number;
  severity?: string;
  bz_gsm?: number | null;
  density?: number | null;
  temperature?: number | null;
  bt?: number | null;
}

export interface RecentCMEResponse {
  events: RecentCMEEvent[];
  total_count: number;
  date_range: string;
}

export interface RealtimeHistory {
  timestamps: string[];
  speed: number[];
  density: number[];
  temperature: number[];
}

export interface RealtimeData {
  success: boolean;
  data_source?: string;
  timestamp?: string;
  // Top-level convenience fields (may be present or derived from `solar_wind`)
  speed?: number;
  density?: number;
  temperature?: number;
  bz_gsm?: number;
  bt?: number;
  bx_gsm?: number;
  by_gsm?: number;
  lon_gsm?: number;
  lat_gsm?: number;
  cme_images_count?: number;
  cme_events?: any[];
  history?: RealtimeHistory | null;
  message?: string;
}

export interface ForecastData {
  success: boolean;
  forecast_period: {
    start: string;
    end: string;
    duration_days: number;
    total_points: number;
  };
  parameters: {
    [key: string]: number[];
  };
  timestamps: string[];
  statistics: {
    [key: string]: {
      min: number;
      max: number;
      mean: number;
      std: number;
      current: number | null;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
  };
  parameter_names: {
    [key: string]: string;
  };
  generated_at: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Create timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw error;
  }
}

export const api = {
  // Health check
  async healthCheck() {
    return apiRequest<{ status: string; timestamp: string; components: Record<string, boolean> }>('/health');
  },

  // Data summary
  async getDataSummary() {
    try {
      return await apiRequest<DataSummary>('/api/data/summary', {}, 150000); // 150s for CME detection (14-day detection takes 35-53s, adding buffer)
    } catch (error) {
      console.warn('Data summary fetch failed:', error);
      // Return default summary on error
      return {
        mission_status: "unknown",
        data_coverage: "N/A",
        last_update: new Date().toISOString(),
        total_cme_events: 0,
        active_alerts: 0,
        system_health: "unknown"
      } as DataSummary;
    }
  },

  // Recent CME events
  async getRecentCMEEvents() {
    return apiRequest<RecentCMEResponse>('/api/cme/recent', {}, 60000); // 60s timeout for CME detection
  },

  // CME Analysis
  async analyzeCMEEvents(request: AnalysisRequest) {
    return apiRequest<AnalysisResult>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Threshold optimization
  async optimizeThresholds(config: ThresholdConfig) {
    return apiRequest<{
      optimized_thresholds: Record<string, number>;
      optimization_method: string;
      confidence_score: number;
    }>('/api/thresholds/optimize', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  // Particle data for charts
  async getParticleData(timeRange: string = '7d', date?: string) {
    try {
      let url = `/api/charts/particle-data?time_range=${timeRange}`;
      if (date) {
        url += `&date=${encodeURIComponent(date)}`;
      }
      return await apiRequest<ParticleData>(url, {}, 60000); // Increased to 60s for large datasets
    } catch (error) {
      console.warn('Particle data fetch failed:', error);
      throw error; // Let component handle the error
    }
  },

  // Real-time telemetry data
  async getRealtimeLatest(): Promise<any> {
    return apiRequest('/api/data/realtime/latest', {
      method: 'GET',
    });
  },

  async getRealtimeData(): Promise<RealtimeData> {
    try {
      const raw = await apiRequest<any>('/api/data/realtime', {}, 60000); // Increased to 60s timeout

      // Backend may return fields nested under `solar_wind` or top-level keys.
      const sw = raw?.solar_wind || raw?.solarWind || raw || {};

      const mapped: RealtimeData = {
        success: raw?.success ?? true,
        data_source: raw?.data_source ?? raw?.source ?? undefined,
        timestamp: raw?.timestamp ?? raw?.time ?? undefined,
        speed: sw?.speed ?? sw?.velocity ?? sw?.wind_speed ?? raw?.speed ?? raw?.velocity ?? undefined,
        density: sw?.density ?? raw?.density ?? undefined,
        temperature: sw?.temperature ?? raw?.temperature ?? undefined,
        bz_gsm: sw?.bz_gsm ?? raw?.bz_gsm ?? raw?.bz ?? undefined,
        bt: sw?.bt ?? raw?.bt ?? undefined,
        bx_gsm: sw?.bx_gsm ?? raw?.bx_gsm ?? raw?.bx ?? undefined,
        by_gsm: sw?.by_gsm ?? raw?.by_gsm ?? raw?.by ?? undefined,
        lon_gsm: sw?.lon_gsm ?? raw?.lon_gsm ?? raw?.lon ?? undefined,
        lat_gsm: sw?.lat_gsm ?? raw?.lat_gsm ?? raw?.lat ?? undefined,
        cme_events: raw?.cme_events ?? raw?.cmes ?? [],
        cme_images_count: raw?.cme_images_count ?? (Array.isArray(raw?.cme_events) ? raw.cme_events.length : undefined),
        message: raw?.message ?? undefined,
        history: raw?.history ?? null,
      };

      return mapped;
    } catch (error) {
      console.warn('Realtime data fetch failed:', error);
      // Return default realtime data on error
      return {
        success: false,
        data_source: undefined,
        timestamp: undefined,
        speed: undefined,
        density: undefined,
        temperature: undefined,
        cme_events: [],
        cme_images_count: 0,
        message: 'Failed to fetch realtime data',
        history: null,
      } as RealtimeData;
    }
  },

  // File upload
  async uploadSWISData(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/data/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText);
    }

    return response.json();
  },

  // ML-based CDF analysis
  async analyzeCDFWithML(file: File): Promise<MLAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/ml/analyze-cdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText);
    }

    return response.json();
  },

  // Get ML model information
  async getMLModelInfo(): Promise<MLModelInfo> {
    return apiRequest<MLModelInfo>('/api/ml/model-info');
  },

  // Get forecast predictions
  async getForecastPredictions(): Promise<ForecastData> {
    return apiRequest<ForecastData>('/api/forecast/predictions');
  },

  // Get model calculations for a specific date (YYYY-MM-DD)
  async getModelCalculations(date: string): Promise<any> {
    return apiRequest<any>(`/api/model/calculations?date=${encodeURIComponent(date)}`);
  },

  // Get detection script source code
  async getDetectionScript(): Promise<any> {
    return apiRequest<any>('/api/model/script');
  },

  // Upload CDF file with detection option
  async uploadCDF(file: File, runDetection: boolean = false): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (runDetection) {
      formData.append('run_detection', 'true');
    }

    const response = await fetch(`${API_BASE_URL}/api/data/upload?run_detection=${runDetection}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText);
    }

    return response.json();
  },

  // Get live geomagnetic storm data
  async getLiveGeomagneticStorm(): Promise<any> {
    try {
      // Increased timeout to 60s - geomagnetic data can be slow
      const raw = await apiRequest<any>('/api/geomagnetic/storm/live', {}, 60000);
      return raw;
    } catch (error) {
      // Silent fail - return empty data instead of error
      console.debug('Geomagnetic storm data fetch failed (non-critical):', error);
      return { success: false, indices: {}, timeline: [], kp_data: { data: [] } };
    }
  },

  // Get space weather alerts
  async getSpaceWeatherAlerts(): Promise<any> {
    try {
      // Increased timeout to 60s - alerts can be slow
      const raw = await apiRequest<any>('/api/noaa/alerts', {}, 60000);
      return raw;
    } catch (error) {
      // Silent fail - return empty data instead of error
      console.debug('Space weather alerts fetch failed (non-critical):', error);
      return { success: false, data: [], total_alerts: 0 };
    }
  },

  // Get solar flares data
  async getSolarFlaresData(): Promise<any> {
    try {
      // Increased timeout to 60s - flares can be slow
      const raw = await apiRequest<any>('/api/noaa/solar-flares', {}, 60000);
      return raw;
    } catch (error) {
      // Silent fail - return empty data instead of error
      console.debug('Solar flares fetch failed (non-critical):', error);
      return { success: false, data: [], gifs: {}, has_gifs: false };
    }
  },

  // Get image sequence for GIF (non-blocking, longer timeout)
  async getImageSequenceForGif(source: string, count: number = 10): Promise<any> {
    try {
      // Increased timeout to 60 seconds for image fetching
      // Images are non-critical, so we don't want to block the UI
      const raw = await apiRequest<any>(`/api/noaa/images/${source}?count=${count}`, {}, 60000);
      return raw;
    } catch (error) {
      // Silent fail - images are optional, don't break the UI
      console.debug(`Image sequence fetch failed for ${source} (non-critical):`, error);
      return { success: false, data: [], images: [], gifs: {}, has_gifs: false };
    }
  },
};

// React Query hooks for data fetching
// Note: These hooks should be imported directly in components that use them
// This is kept for backward compatibility but components should import from @tanstack/react-query directly
export const useApi = () => {
  // Dynamic import to avoid issues if react-query is not available
  try {
    const { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');

  return {
    // Queries
    useHealthCheck: () => useQuery({
      queryKey: ['health'],
      queryFn: api.healthCheck,
      refetchInterval: false, // DISABLED: Prevent auto-refresh during presentation
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }),

    useDataSummary: () => useQuery({
      queryKey: ['data-summary'],
      queryFn: api.getDataSummary,
      refetchInterval: false, // DISABLED: Prevent auto-refresh during presentation
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }),

    useParticleData: () => useQuery({
      queryKey: ['particle-data'],
      queryFn: api.getParticleData,
      refetchInterval: false, // DISABLED: Prevent auto-refresh during presentation
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }),

    // Mutations
    useAnalyzeCME: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: api.analyzeCMEEvents,
        onSuccess: (data) => {
          // Invalidate and refetch related queries
          queryClient.invalidateQueries({ queryKey: ['data-summary'] });
          queryClient.setQueryData(['analysis-result'], data);
        },
      });
    },

    useOptimizeThresholds: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: api.optimizeThresholds,
        onSuccess: (data) => {
          queryClient.setQueryData(['thresholds'], data.optimized_thresholds);
        },
      });
    },

    useUploadSWISData: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: api.uploadSWISData,
        onSuccess: () => {
          // Invalidate data-related queries
          queryClient.invalidateQueries({ queryKey: ['particle-data'] });
          queryClient.invalidateQueries({ queryKey: ['data-summary'] });
        },
      });
    },

    // ML Analysis mutations
    useAnalyzeCDFWithML: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: api.analyzeCDFWithML,
        onSuccess: (data) => {
          // Cache ML analysis results
          queryClient.setQueryData(['ml-analysis', data.file_info.filename], data);
          queryClient.invalidateQueries({ queryKey: ['data-summary'] });
        },
      });
    },

    // ML Model info query
    useMLModelInfo: () => useQuery({
      queryKey: ['ml-model-info'],
      queryFn: api.getMLModelInfo,
      staleTime: 600000, // 10 minutes
    }),
  };
  } catch (e) {
    // Return empty hooks if react-query not available
    return {
      useHealthCheck: () => ({ data: null, isLoading: false, error: null }),
      useDataSummary: () => ({ data: null, isLoading: false, error: null }),
      useParticleData: () => ({ data: null, isLoading: false, error: null }),
      useAnalyzeCME: () => ({ mutate: () => {}, mutateAsync: async () => ({}) }),
      useOptimizeThresholds: () => ({ mutate: () => {}, mutateAsync: async () => ({}) }),
      useUploadSWISData: () => ({ mutate: () => {}, mutateAsync: async () => ({}) }),
      useAnalyzeCDFWithML: () => ({ mutate: () => {}, mutateAsync: async () => ({}) }),
      useMLModelInfo: () => ({ data: null, isLoading: false, error: null }),
    };
  }
};

export { ApiError }; 