import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Code, Download, RefreshCw, FileCode, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScriptViewerProps {
  onClose?: () => void;
}

interface ScriptData {
  script_info: {
    filename: string;
    path: string;
    size: number;
    lines: number;
    last_modified: string;
  };
  content: string;
  language: string;
}

const ScriptViewer: React.FC<ScriptViewerProps> = ({ onClose }) => {
  const [data, setData] = useState<ScriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchScript();
  }, []);

  const fetchScript = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/model/script`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch script: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch script');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (data?.content) {
      navigator.clipboard.writeText(data.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (data?.content) {
      const blob = new Blob([data.content], { type: 'text/python' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.script_info.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

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
                <Code className="h-6 w-6 text-cyan-400" />
                CME Detection Script
              </CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                View the complete source code of the CME detection algorithm
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
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
          {loading && (
            <div className="text-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <p className="text-gray-400">Loading script...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {data && (
            <>
              {/* Script Info */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="text-sm font-semibold text-white">{data.script_info.filename}</p>
                      <p className="text-xs text-gray-400">{data.script_info.path}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-500/50">
                    {data.script_info.lines} lines
                  </Badge>
                  <Badge variant="outline" className="text-purple-400 border-purple-500/50">
                    {(data.script_info.size / 1024).toFixed(1)} KB
                  </Badge>
                  <Badge variant="outline" className="text-green-400 border-green-500/50">
                    {data.language}
                  </Badge>
                  <p className="text-xs text-gray-400">
                    Modified: {new Date(data.script_info.last_modified).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Code Display */}
              <div className="bg-black/60 rounded-lg border border-white/10 overflow-hidden">
                <div className="bg-black/80 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">Source Code</span>
                  <Button variant="ghost" size="sm" onClick={fetchScript}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="overflow-auto max-h-[600px] p-4">
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    <code>{data.content}</code>
                  </pre>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScriptViewer;









