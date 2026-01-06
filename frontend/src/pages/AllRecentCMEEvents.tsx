/**
 * All Recent CME Events Page
 * 
 * Displays all recent CME events in a full-page view
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ChevronRight, X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, type RecentCMEResponse, type RecentCMEEvent } from '@/lib/api';
import RawDataViewer from '@/components/RawDataViewer';

const AllRecentCMEEvents: React.FC = () => {
  const navigate = useNavigate();
  const [recentCMEs, setRecentCMEs] = useState<RecentCMEResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<RecentCMEEvent | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [showRawDataViewer, setShowRawDataViewer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getRecentCMEEvents();
        setRecentCMEs(data);
      } catch (error) {
        console.error('Failed to fetch recent CME events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="text-muted-foreground">Loading recent CME events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/', { state: { fromRecentEvents: true } })}
                className="text-white hover:text-cyan-400"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">All Recent CME Events</h1>
                <p className="text-sm text-gray-400">
                  {recentCMEs?.date_range || 'Latest Halo CME Detections'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
              {recentCMEs?.total_count || 0} Events
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Card className="space-card">
          <CardHeader>
            <CardTitle className="text-cosmic">Recent CME Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCMEs && recentCMEs.events.length > 0 ? (
              <div className="space-y-3">
                {recentCMEs.events.map((event, index) => (
                  <motion.div
                    key={event.id || index}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setEventModalOpen(true);
                    }}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-1 h-12 rounded-full ${
                        event.severity === 'High' ? 'bg-red-500' : 
                        event.severity === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500'
                      } group-hover:w-1.5 transition-all`}></div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-400">{event.type}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            (event.confidence || 0) >= 0.5 ? 'bg-green-500/20 text-green-400' :
                            (event.confidence || 0) >= 0.3 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {((event.confidence || 0) * 100).toFixed(0)}% conf
                          </span>
                          <Badge variant="outline" className={`text-xs ${
                            event.severity === 'High' ? 'border-red-500/50 text-red-400' :
                            event.severity === 'Medium' ? 'border-orange-500/50 text-orange-400' :
                            'border-yellow-500/50 text-yellow-400'
                          }`}>
                            {event.severity || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <Badge variant="outline" className={`text-xs mb-1 ${
                          event.magnitude.startsWith('X') ? 'border-red-500/50 text-red-400' :
                          event.magnitude.startsWith('M') ? 'border-orange-500/50 text-orange-400' :
                          'border-yellow-500/50 text-yellow-400'
                        }`}>{event.magnitude}</Badge>
                        <p className="text-xs text-gray-400 font-mono">{event.speed} km/s</p>
                        <p className="text-xs text-gray-500">{event.angular_width}° Halo</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <p className="text-lg">No recent events detected</p>
                <p className="text-sm mt-2">Check back later for new CME detections</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Details Modal */}
      <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
        <DialogContent className="max-w-2xl bg-black/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-cosmic">CME Event Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedEvent && new Date(selectedEvent.date).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Speed</p>
                  <p className="text-lg font-semibold">{selectedEvent.speed} km/s</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Magnitude</p>
                  <p className="text-lg font-semibold">{selectedEvent.magnitude}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Type</p>
                  <p className="text-sm font-medium">{selectedEvent.type}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Confidence</p>
                  <p className="text-sm font-medium">{((selectedEvent.confidence || 0) * 100).toFixed(1)}%</p>
                </div>
                {selectedEvent.density !== null && selectedEvent.density !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Density</p>
                    <p className="text-sm font-medium">{selectedEvent.density} cm⁻³</p>
                  </div>
                )}
                {selectedEvent.temperature !== null && selectedEvent.temperature !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Temperature</p>
                    <p className="text-sm font-medium">{selectedEvent.temperature} K</p>
                  </div>
                )}
                {selectedEvent.bz_gsm !== null && selectedEvent.bz_gsm !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Bz (GSM)</p>
                    <p className="text-sm font-medium">{selectedEvent.bz_gsm} nT</p>
                  </div>
                )}
                {selectedEvent.bt !== null && selectedEvent.bt !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Total IMF (Bt)</p>
                    <p className="text-sm font-medium">{selectedEvent.bt} nT</p>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Angular Width</p>
                <p className="text-sm font-medium">
                  {selectedEvent.angular_width}° {selectedEvent.angular_width >= 360 ? '(Full Halo)' : selectedEvent.angular_width >= 120 ? '(Partial Halo)' : '(Narrow CME)'}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/10 hover:bg-white/5"
                  onClick={() => setEventModalOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => {
                    setEventModalOpen(false);
                    setShowRawDataViewer(true);
                  }}
                >
                  View Raw Data <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Raw Data Viewer */}
      {showRawDataViewer && (
        <div className="fixed inset-0 z-50 overflow-auto">
          <RawDataViewer 
            eventDate={selectedEvent?.date ? (() => {
              try {
                const dateStr = selectedEvent.date;
                console.log('AllRecentCMEEvents: Parsing event date', { original: dateStr });
                
                // If already in YYYY-MM-DD format, use it directly
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  console.log('AllRecentCMEEvents: Using date as-is:', dateStr);
                  return dateStr;
                }
                
                // If ISO format with T, extract date part (before T)
                if (dateStr.includes('T')) {
                  const datePart = dateStr.split('T')[0];
                  console.log('AllRecentCMEEvents: Extracted from ISO:', datePart);
                  return datePart;
                }
                
                // If has space, take first part
                if (dateStr.includes(' ')) {
                  const datePart = dateStr.split(' ')[0];
                  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                    console.log('AllRecentCMEEvents: Extracted from space-separated:', datePart);
                    return datePart;
                  }
                }
                
                // Try parsing as Date and get YYYY-MM-DD in UTC to avoid timezone issues
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                  // Use UTC methods to avoid timezone conversion
                  const year = parsed.getUTCFullYear();
                  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
                  const day = String(parsed.getUTCDate()).padStart(2, '0');
                  const utcDate = `${year}-${month}-${day}`;
                  console.log('AllRecentCMEEvents: Parsed to UTC date:', utcDate);
                  return utcDate;
                }
                
                console.warn('AllRecentCMEEvents: Could not parse date:', dateStr);
                return dateStr;
              } catch (e) {
                console.error('Error parsing event date:', e, selectedEvent.date);
                return selectedEvent.date;
              }
            })() : undefined}
            onClose={() => setShowRawDataViewer(false)}
          />
        </div>
      )}
    </div>
  );
};

export default AllRecentCMEEvents;

