import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ChevronRight, ArrowRight, Wind, AlertTriangle } from 'lucide-react';
import { type RecentCMEResponse, type RecentCMEEvent } from '@/lib/api';
import RawDataViewer from './RawDataViewer';

interface AllRecentEventsModalProps {
  recentCMEs: RecentCMEResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onEventClick?: (event: RecentCMEEvent) => void;
}

const AllRecentEventsModal: React.FC<AllRecentEventsModalProps> = ({
  recentCMEs,
  isOpen,
  onClose,
  onEventClick,
}) => {
  const [selectedEvent, setSelectedEvent] = React.useState<RecentCMEEvent | null>(null);
  const [eventModalOpen, setEventModalOpen] = React.useState(false);
  const [showRawDataViewer, setShowRawDataViewer] = React.useState(false);

  if (!isOpen || !recentCMEs) return null;

  const handleEventClick = (event: RecentCMEEvent) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleViewRawData = () => {
    setEventModalOpen(false);
    setShowRawDataViewer(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showRawDataViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-auto bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="min-h-screen p-6"
            >
              <Card className="space-card border-white/10 bg-black/40 backdrop-blur-xl max-w-6xl mx-auto my-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-white">
                        All Recent CME Events
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        {recentCMEs.date_range || 'Latest Halo CME Detections'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                        {recentCMEs.total_count || 0} Events
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white hover:text-cyan-400"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentCMEs.events.length > 0 ? (
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                      {recentCMEs.events.map((event, index) => (
                        <motion.div
                          key={event.id || index}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleEventClick(event)}
                          className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-sm font-medium text-white">
                                {new Date(event.date).toLocaleString()}
                              </p>
                              <Badge
                                variant={
                                  (event.confidence || 0) * 100 >= 70
                                    ? 'default'
                                    : (event.confidence || 0) * 100 >= 50
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className={
                                  (event.confidence || 0) * 100 >= 70
                                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                    : (event.confidence || 0) * 100 >= 50
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                    : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                                }
                              >
                                {((event.confidence || 0) * 100).toFixed(0)}% conf
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  event.severity === 'High'
                                    ? 'border-red-500/50 text-red-400'
                                    : event.severity === 'Medium'
                                    ? 'border-yellow-500/50 text-yellow-400'
                                    : 'border-gray-500/50 text-gray-400'
                                }
                              >
                                {event.severity}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>{event.type}</span>
                              <span>•</span>
                              <span>{event.speed} km/s</span>
                              <span>•</span>
                              <span>{event.magnitude}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No recent CME events found</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      {eventModalOpen && selectedEvent && (
        <Dialog open={eventModalOpen} onOpenChange={setEventModalOpen}>
          <DialogContent className="space-card bg-black/90 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-cosmic">CME Event Details</DialogTitle>
              <DialogDescription>
                {new Date(selectedEvent.date).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Event Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Magnitude</p>
                  <p className={`text-2xl font-bold ${
                    selectedEvent.magnitude.startsWith('X') ? 'text-red-400' :
                    selectedEvent.magnitude.startsWith('M') ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>{selectedEvent.magnitude}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Speed</p>
                  <p className="text-2xl font-bold text-cyan-400">{selectedEvent.speed} <span className="text-sm text-gray-400">km/s</span></p>
                </div>
              </div>

              {/* Detection Confidence */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-400">Detection Confidence</p>
                  <p className={`text-lg font-semibold ${
                    (selectedEvent.confidence || 0) >= 0.5 ? 'text-green-400' :
                    (selectedEvent.confidence || 0) >= 0.3 ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>{((selectedEvent.confidence || 0) * 100).toFixed(0)}%</p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      (selectedEvent.confidence || 0) >= 0.5 ? 'bg-green-500' :
                      (selectedEvent.confidence || 0) >= 0.3 ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${(selectedEvent.confidence || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Additional Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Type</p>
                  <p className="text-sm font-medium">{selectedEvent.type}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Severity</p>
                  <p className={`text-sm font-medium ${
                    selectedEvent.severity === 'High' ? 'text-red-400' :
                    selectedEvent.severity === 'Medium' ? 'text-orange-400' :
                    'text-yellow-400'
                  }`}>{selectedEvent.severity || 'Low'}</p>
                </div>
              </div>

              {/* Additional Parameters */}
              <div className="grid grid-cols-2 gap-4">
                {selectedEvent.bz_gsm !== null && selectedEvent.bz_gsm !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Bz (GSM)</p>
                    <p className={`text-lg font-semibold ${
                      (selectedEvent.bz_gsm || 0) < -10 ? 'text-red-400' :
                      (selectedEvent.bz_gsm || 0) < 0 ? 'text-orange-400' :
                      'text-green-400'
                    }`}>{selectedEvent.bz_gsm} nT</p>
                  </div>
                )}
                {selectedEvent.density !== null && selectedEvent.density !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Proton Density</p>
                    <p className="text-lg font-semibold text-purple-400">{selectedEvent.density} cm⁻³</p>
                  </div>
                )}
                {selectedEvent.temperature !== null && selectedEvent.temperature !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Temperature</p>
                    <p className="text-lg font-semibold text-orange-400">{selectedEvent.temperature.toLocaleString()} K</p>
                  </div>
                )}
                {selectedEvent.bt !== null && selectedEvent.bt !== undefined && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Total IMF (Bt)</p>
                    <p className="text-lg font-semibold text-blue-400">{selectedEvent.bt} nT</p>
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
                  onClick={handleViewRawData}
                >
                  View Raw Data <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Raw Data Viewer */}
      {showRawDataViewer && selectedEvent && (
        <RawDataViewer
          eventDate={selectedEvent?.date ? (() => {
            try {
              const dateStr = String(selectedEvent.date).trim();
              
              // If already in YYYY-MM-DD format, use it directly
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return dateStr;
              }
              
              // Extract from ISO format (before T)
              if (dateStr.includes('T')) {
                const datePart = dateStr.split('T')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                  return datePart;
                }
              }
              
              // Extract from space-separated format
              if (dateStr.includes(' ')) {
                const datePart = dateStr.split(' ')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                  return datePart;
                }
              }
              
              // Parse using UTC to avoid timezone shifts
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                // Use UTC methods to prevent timezone conversion issues
                const year = parsed.getUTCFullYear();
                const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
                const day = String(parsed.getUTCDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              }
              
              console.warn('RawDataViewer: Could not parse event date:', dateStr);
              return dateStr;
            } catch (e) {
              console.error('Error parsing event date:', e, selectedEvent.date);
              return String(selectedEvent.date);
            }
          })() : undefined}
          onClose={() => {
            setShowRawDataViewer(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </>
  );
};

export default AllRecentEventsModal;

