import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DeploymentDisclaimer = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show after a small delay to grab attention
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-4 right-4 z-[9999] max-w-md w-full md:w-auto"
            >
                <div className="bg-slate-900/95 backdrop-blur-md border border-yellow-500/50 rounded-lg shadow-2xl p-4 flex items-start gap-4">
                    <div className="p-2 bg-yellow-500/10 rounded-full shrink-0">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>

                    <div className="flex-1 mr-2">
                        <h3 className="text-yellow-500 font-bold text-sm uppercase tracking-wider mb-1">
                            System Initialization
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Deployment is currently in progress. Some real-time data streams may show
                            <span className="font-mono text-yellow-400 bg-yellow-500/10 px-1 mx-1 rounded">N/A</span>
                            while connections are being established.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-slate-500 hover:text-white transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DeploymentDisclaimer;
