/**
 * Phase 5: Video & Image Animation
 * 
 * Features:
 * - Combined CME + Storm animations
 * - Video generation
 * - Image export
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Video, Image, Download, Play, Pause, 
  ChevronLeft, Loader2, Film, Camera 
} from 'lucide-react';
import WindFlowAnimation from '@/components/WindFlowAnimation';

const Phase5: React.FC = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    // Simulate video generation
    setTimeout(() => {
      setIsGenerating(false);
      alert('Video generation complete! (This is a placeholder - actual implementation would generate video file)');
    }, 3000);
  };

  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `cme-animation-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
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
            <h1 className="text-4xl font-bold mb-2">Phase 5: Video & Image Animation</h1>
            <p className="text-slate-300">Combined CME and geomagnetic storm visualizations</p>
          </div>
          <Button onClick={() => navigate('/phase4')} variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
        </motion.div>

        {/* Animation Canvas */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Combined Space Weather Animation
            </CardTitle>
            <CardDescription>
              Real-time visualization of CME propagation and geomagnetic storm effects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[600px] w-full bg-slate-900 rounded-lg overflow-hidden">
              <WindFlowAnimation
                speed={500}
                direction={45}
                density={10}
                width={1200}
                height={600}
                color="#60a5fa"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ display: 'none' }}
              />
              
              {/* Control Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant="outline"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-sm text-slate-300">
                    {isPlaying ? 'Playing' : 'Paused'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleExportImage}
                    variant="outline"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Export Image
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerateVideo}
                    variant="default"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animation Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Image Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                Export high-resolution images of the current animation state. 
                Images are saved in PNG format with full quality.
              </p>
              <Button onClick={handleExportImage} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Current Frame
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                Generate animated video sequences showing CME propagation and 
                geomagnetic storm evolution over time.
              </p>
              <Button 
                onClick={handleGenerateVideo} 
                variant="default" 
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Generate Animation Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Animation Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Animation Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="font-semibold mb-2">CME Propagation</div>
                <div className="text-sm text-slate-300">
                  Visual representation of coronal mass ejection movement through space
                </div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="font-semibold mb-2">Solar Wind Flow</div>
                <div className="text-sm text-slate-300">
                  Animated particles showing solar wind direction and speed
                </div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="font-semibold mb-2">Storm Effects</div>
                <div className="text-sm text-slate-300">
                  Visualization of geomagnetic storm impact on Earth's magnetosphere
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Phase5;

