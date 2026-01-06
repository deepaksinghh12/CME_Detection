import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, X, Calendar, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, type ParticleData } from '@/lib/api';

interface RawDataViewerProps {
  eventDate?: string;
  onClose?: () => void;
}

const RawDataViewer: React.FC<RawDataViewerProps> = ({ eventDate, onClose }) => {
  const [data, setData] = useState<ParticleData | null>(null);
  const [loading, setLoading] = useState(true);
  // When eventDate is provided, use 1 day range and don't show selector
  const [timeRange, setTimeRange] = useState<string>(eventDate ? '1d' : '7d');
  const [selectedDate, setSelectedDate] = useState<string | null>(eventDate || null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // If eventDate is provided, pass it as date parameter to fetch data for that specific date
        let dateToFetch: string | undefined = undefined;
        if (eventDate) {
          try {
            // Handle different date formats
            let dateStr = eventDate.trim();
            console.log('RawDataViewer: Received eventDate:', dateStr);
            
            // If already in YYYY-MM-DD format, use it directly
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              dateToFetch = dateStr;
              console.log('RawDataViewer: Using date as-is:', dateToFetch);
            } else if (dateStr.includes('T')) {
              // ISO format: extract date part (before T)
              dateToFetch = dateStr.split('T')[0];
              console.log('RawDataViewer: Extracted from ISO:', dateToFetch);
            } else if (dateStr.includes(' ')) {
              // Space-separated: take first part
              const datePart = dateStr.split(' ')[0];
              if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                dateToFetch = datePart;
                console.log('RawDataViewer: Extracted from space-separated:', dateToFetch);
              }
            } else {
              // Try to parse and format using UTC to avoid timezone issues
              const eventDateObj = new Date(dateStr);
              if (!isNaN(eventDateObj.getTime())) {
                // Use UTC methods to avoid timezone conversion
                const year = eventDateObj.getUTCFullYear();
                const month = String(eventDateObj.getUTCMonth() + 1).padStart(2, '0');
                const day = String(eventDateObj.getUTCDate()).padStart(2, '0');
                dateToFetch = `${year}-${month}-${day}`;
                console.log('RawDataViewer: Parsed to UTC date:', dateToFetch);
              } else {
                console.warn('RawDataViewer: Could not parse eventDate:', dateStr);
              }
            }
            console.log('RawDataViewer: Final dateToFetch:', dateToFetch);
          } catch (e) {
            console.error('RawDataViewer: Error parsing eventDate:', e, eventDate);
          }
        }
        const result = await api.getParticleData('1d', dateToFetch);
        console.log('RawDataViewer: Fetched data', { 
          hasTimestamps: !!result?.timestamps, 
          timestampCount: result?.timestamps?.length || 0,
          hasVelocity: !!result?.velocity,
          velocityCount: result?.velocity?.length || 0,
          eventDate,
          dateToFetch
        });
        setData(result);
      } catch (error) {
        console.error('Failed to fetch raw data:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, eventDate]);

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    if (value > 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value > 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const exportToCSV = () => {
    if (!data || !data.timestamps) return;

    const headers = ['Timestamp', 'Velocity (km/s)', 'Density (cm⁻³)', 'Temperature (K)', 'Flux', 'Bx (nT)', 'By (nT)', 'Bz (nT)', 'Bt (nT)'];
    const rows = data.timestamps.map((ts, idx) => {
      return [
        ts,
        data.velocity?.[idx]?.toFixed(2) || 'N/A',
        data.density?.[idx]?.toFixed(2) || 'N/A',
        data.temperature?.[idx]?.toFixed(2) || 'N/A',
        data.flux?.[idx]?.toFixed(2) || 'N/A',
        data.bx?.[idx]?.toFixed(2) || 'N/A',
        data.by?.[idx]?.toFixed(2) || 'N/A',
        data.bz?.[idx]?.toFixed(2) || 'N/A',
        data.bt?.[idx]?.toFixed(2) || 'N/A',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cme_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter data by selected date if provided
  const filteredData = React.useMemo(() => {
    if (!data || !selectedDate) return data;
    
    // Check if data has timestamps
    if (!data.timestamps || data.timestamps.length === 0) {
      return data; // Return original data if no timestamps
    }
    
    // Parse target date - use YYYY-MM-DD format directly to avoid timezone issues
    let targetDateStr: string;
    if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      targetDateStr = selectedDate; // Already in correct format
    } else {
      // Try to extract YYYY-MM-DD from the date string
      const parsed = new Date(selectedDate);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getUTCFullYear();
        const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
        const day = String(parsed.getUTCDate()).padStart(2, '0');
        targetDateStr = `${year}-${month}-${day}`;
      } else {
        console.warn('RawDataViewer: Could not parse selectedDate:', selectedDate);
        return data;
      }
    }
    
    console.log('RawDataViewer: Filtering data for date:', targetDateStr);
    
    const filtered: ParticleData = {
      ...data,
      timestamps: [],
      velocity: [],
      density: [],
      temperature: [],
      flux: [],
      bx: [],
      by: [],
      bz: [],
      bt: [],
      units: data.units || {}
    };

    data.timestamps.forEach((ts, idx) => {
      try {
        // Parse timestamp and compare date part only (YYYY-MM-DD)
        const tsDate = new Date(ts);
        if (isNaN(tsDate.getTime())) return;
        
        const tsYear = tsDate.getUTCFullYear();
        const tsMonth = String(tsDate.getUTCMonth() + 1).padStart(2, '0');
        const tsDay = String(tsDate.getUTCDate()).padStart(2, '0');
        const tsDateStr = `${tsYear}-${tsMonth}-${tsDay}`;
        if (tsDateStr === targetDateStr) {
          filtered.timestamps?.push(ts);
          if (data.velocity && idx < data.velocity.length) filtered.velocity?.push(data.velocity[idx]);
          if (data.density && idx < data.density.length) filtered.density?.push(data.density[idx]);
          if (data.temperature && idx < data.temperature.length) filtered.temperature?.push(data.temperature[idx]);
          if (data.flux && idx < data.flux.length) filtered.flux?.push(data.flux[idx]);
          if (data.bx && idx < data.bx.length) filtered.bx?.push(data.bx[idx]);
          if (data.by && idx < data.by.length) filtered.by?.push(data.by[idx]);
          if (data.bz && idx < data.bz.length) filtered.bz?.push(data.bz[idx]);
          if (data.bt && idx < data.bt.length) filtered.bt?.push(data.bt[idx]);
        }
      } catch (e) {
        console.warn('Error filtering timestamp:', ts, e);
      }
    });

    return filtered;
  }, [data, selectedDate]);

  const displayData = filteredData || data;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6"
    >
      <Card className="space-card border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Database className="h-6 w-6 text-cyan-400" />
                Raw Data Viewer
              </CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                View detailed particle and magnetic field measurements in tabular format
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!displayData}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls - Hide time range selector if opened from event date */}
          {!eventDate && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Time Range:</span>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                >
                  <option value="3m">Last 3 minutes</option>
                  <option value="5m">Last 5 minutes</option>
                  <option value="10m">Last 10 minutes</option>
                  <option value="30m">Last 30 minutes</option>
                  <option value="1h">Last 1 hour</option>
                  <option value="1d">Last 1 day</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>
            </div>
          )}
          {eventDate && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-cyan-400 border-cyan-500/50 text-lg px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                Showing data for: {new Date(eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Badge>
            </div>
          )}

          {/* Data Table */}
          {loading ? (
            <div className="text-center py-20 text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading data...</p>
            </div>
          ) : !displayData || !displayData.timestamps || displayData.timestamps.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available for the selected time range</p>
              <p className="text-xs mt-2 text-gray-500">
                {displayData ? `Data structure received but no timestamps found.` : 'Failed to fetch data from server.'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  const fetchData = async () => {
                    try {
                      setLoading(true);
                      const result = await api.getParticleData(timeRange);
                      setData(result);
                    } catch (error) {
                      console.error('Retry failed:', error);
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchData();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Velocity (km/s)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Density (cm⁻³)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Temperature (K)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Flux
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Bx (nT)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        By (nT)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Bz (nT)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                        Bt (nT)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-black/20 divide-y divide-white/5">
                    {displayData.timestamps.map((timestamp, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {new Date(timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-cyan-400">
                          {formatValue(displayData.velocity?.[idx])}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-400">
                          {formatValue(displayData.density?.[idx])}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-400">
                          {formatValue(displayData.temperature?.[idx])}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-400">
                          {formatValue(displayData.flux?.[idx])}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-400">
                          {formatValue(displayData.bx?.[idx])}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-400">
                          {formatValue(displayData.by?.[idx])}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-pink-400">
                          {formatValue(displayData.bz?.[idx])}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-400">
                          {formatValue(displayData.bt?.[idx])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-400 text-center">
                Showing {displayData.timestamps.length} data points
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RawDataViewer;

