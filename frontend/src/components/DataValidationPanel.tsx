import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Shield, Database, Activity } from 'lucide-react';

interface ValidationResult {
  source: string;
  is_real_data: boolean;
  confidence_score: number;
  data_freshness?: {
    age_hours: number;
    is_recent: boolean;
  };
  issues: string[];
  timestamp?: string;
}

interface ValidationSummary {
  overall_status: string;
  authentic_sources: number;
  total_sources: number;
  overall_confidence: number;
}

const DataValidationPanel: React.FC = () => {
  const [validationResults, setValidationResults] = useState<{[key: string]: ValidationResult}>({});
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastValidation, setLastValidation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const validateAllSources = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/validate/data-sources');
      const data = await response.json();
      
      setValidationResults(data.source_validations);
      setSummary(data.summary);
      setLastValidation(data.validation_timestamp);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateSpecificSource = async (sourceName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/validate/source/${sourceName}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      setValidationResults(prev => ({
        ...prev,
        [sourceName]: data.validation_result
      }));
    } catch (error) {
      console.error(`Validation failed for ${sourceName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const quickCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/validate/quick-check');
      const data = await response.json();
      
      // Convert quick check results to validation format
      const quickResults: {[key: string]: ValidationResult} = {};
      Object.entries(data.source_results).forEach(([source, result]: [string, any]) => {
        quickResults[source] = {
          source,
          is_real_data: result.is_real_data,
          confidence_score: result.is_real_data ? 0.8 : 0.3,
          issues: result.error ? [result.error] : [],
          timestamp: result.last_checked
        };
      });
      
      setValidationResults(quickResults);
      setSummary({
        overall_status: data.overall_status,
        authentic_sources: data.authentic_sources,
        total_sources: data.total_sources,
        overall_confidence: data.authentic_sources / data.total_sources
      });
      setLastValidation(data.timestamp);
    } catch (error) {
      console.error('Quick check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isReal: boolean, confidence: number) => {
    if (isReal && confidence > 0.7) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (confidence > 0.3) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (isReal: boolean, confidence: number) => {
    if (isReal && confidence > 0.7) return 'bg-green-100 text-green-800';
    if (confidence > 0.3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    quickCheck(); // Run quick check on component mount
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Data Validation & Authenticity
          </h2>
          <p className="text-muted-foreground mt-1">
            Verify that real data is being loaded from all sources
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={quickCheck} disabled={loading} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Quick Check
          </Button>
          <Button onClick={validateAllSources} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Full Validation
          </Button>
        </div>
      </div>

      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Overall Data Health</CardTitle>
              <Badge className={getOverallStatusColor(summary.overall_status)}>
                {summary.overall_status.toUpperCase()}
              </Badge>
            </div>
            {lastValidation && (
              <CardDescription>
                Last validated: {new Date(lastValidation).toLocaleString()}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.authentic_sources}
                </div>
                <div className="text-sm text-muted-foreground">Authentic Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {summary.total_sources}
                </div>
                <div className="text-sm text-muted-foreground">Total Sources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {(summary.overall_confidence * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Confidence</div>
              </div>
            </div>
            <Progress 
              value={summary.overall_confidence * 100} 
              className="h-3"
            />
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
          <TabsTrigger value="issues">Issues & Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(validationResults).map(([source, result]) => (
              <Card key={source}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">
                      {source === 'issdc' ? 'ISSDC (ISRO)' : 
                       source === 'nasa_spdf' ? 'NASA SPDF' : 
                       source.toUpperCase()}
                    </CardTitle>
                    {getStatusIcon(result.is_real_data, result.confidence_score)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status:</span>
                      <Badge className={getStatusColor(result.is_real_data, result.confidence_score)}>
                        {result.is_real_data ? 'Authentic' : 'Suspicious'}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Confidence:</span>
                      <span className="font-mono text-sm">
                        {(result.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>

                    {result.data_freshness && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Age:</span>
                        <span className="text-sm">
                          {result.data_freshness.age_hours.toFixed(1)}h
                        </span>
                      </div>
                    )}

                    {result.issues.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Issues:</span>
                        <div className="text-xs text-red-600 mt-1">
                          {result.issues.length} issue(s) found
                        </div>
                      </div>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => validateSpecificSource(source)}
                      disabled={loading}
                      className="w-full"
                    >
                      Re-validate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {Object.entries(validationResults).map(([source, result]) => (
            <Card key={source}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {source === 'issdc' ? 'ISSDC (ISRO) - Detailed Analysis' : 
                   source === 'nasa_spdf' ? 'NASA SPDF - Detailed Analysis' : 
                   `${source.toUpperCase()} - Detailed Analysis`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium mb-2">Authentication Status</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Real Data:</span>
                        <Badge className={getStatusColor(result.is_real_data, result.confidence_score)}>
                          {result.is_real_data ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence Score:</span>
                        <span>{(result.confidence_score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {result.data_freshness && (
                    <div>
                      <h4 className="font-medium mb-2">Data Freshness</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Age:</span>
                          <span>{result.data_freshness.age_hours.toFixed(1)} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recent:</span>
                          <Badge variant={result.data_freshness.is_recent ? 'default' : 'destructive'}>
                            {result.data_freshness.is_recent ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {result.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Detected Issues</h4>
                    <div className="space-y-2">
                      {result.issues.map((issue, index) => (
                        <Alert key={index} className="border-yellow-200">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {issue}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations & Actions</CardTitle>
              <CardDescription>
                Based on current validation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary?.overall_confidence && summary.overall_confidence < 0.5 && (
                  <Alert className="border-red-200">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical:</strong> Low overall data confidence detected. 
                      Immediate investigation required.
                    </AlertDescription>
                  </Alert>
                )}

                {summary && summary.authentic_sources < summary.total_sources && (
                  <Alert className="border-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Some data sources are providing suspicious data. 
                      Review configurations and monitor closely.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Recommended Actions:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Run validation checks before important analysis</li>
                    <li>• Monitor data sources for consistency patterns</li>
                    <li>• Set up automated alerts for data quality issues</li>
                    <li>• Keep validation logs for compliance and debugging</li>
                    <li>• Contact data providers if persistent issues occur</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Best Practices:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Validate data after each sync operation</li>
                    <li>• Compare multiple sources for cross-validation</li>
                    <li>• Archive validation reports for historical analysis</li>
                    <li>• Implement fallback mechanisms for failed sources</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataValidationPanel;
