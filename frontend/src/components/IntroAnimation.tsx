import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroAnimationProps {
    onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
    const [stage, setStage] = useState(0);
    const [bootLog, setBootLog] = useState<string[]>([]);

    useEffect(() => {
        // Glitchy boot sequence
        const logs = [
            "INITIALIZING KERNEL...",
            "LOADING SWIS TELEMETRY MODULES...",
            "BYPASSING SECURITY PROTOCOLS...",
            "ESTABLISHING SECURE LINK TO L1...",
            "CALIBRATING PLASMA SENSORS...",
            "DETECTING SOLAR ANOMALIES...",
            "SYSTEM READY."
        ];

        let logIndex = 0;
        const logInterval = setInterval(() => {
            if (logIndex < logs.length) {
                setBootLog(prev => [...prev, logs[logIndex]]);
                logIndex++;
            } else {
                clearInterval(logInterval);
            }
        }, 150);

        const timeouts = [
            setTimeout(() => setStage(1), 1500), // Glitch start
            setTimeout(() => setStage(2), 3000), // Logo slam
            setTimeout(() => setStage(3), 4500), // Access Granted
            setTimeout(() => {
                setStage(4);
                setTimeout(onComplete, 500);
            }, 5500),
        ];

        return () => {
            timeouts.forEach(clearTimeout);
            clearInterval(logInterval);
        };
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col items-center justify-center font-mono"
            initial={{ opacity: 1 }}
            animate={stage === 4 ? { opacity: 0, pointerEvents: 'none' } : { opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            {/* Scanline */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-4 w-full animate-scanline"></div>

            {/* Stage 0: Boot Logs */}
            <AnimatePresence>
                {stage === 0 && (
                    <motion.div
                        className="absolute bottom-10 left-10 text-green-500 text-xs md:text-sm font-bold tracking-wider"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {bootLog.map((log, i) => (
                            <div key={i} className="mb-1">&gt; {log}</div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stage 1 & 2: Glitchy Logo */}
            <AnimatePresence>
                {stage >= 1 && stage < 3 && (
                    <motion.div
                        className="relative z-10"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0, filter: "blur(20px)" }}
                        transition={{ type: "spring", bounce: 0.5 }}
                    >
                        <div className="relative">
                            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter mix-blend-difference relative z-20">
                                ADITYA-L1
                            </h1>
                            {/* Glitch Layers */}
                            <motion.h1
                                className="text-6xl md:text-9xl font-black text-red-500 tracking-tighter absolute top-0 left-0 z-10 opacity-70"
                                animate={{ x: [-2, 2, -1, 3, 0], y: [1, -1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.2 }}
                            >
                                ADITYA-L1
                            </motion.h1>
                            <motion.h1
                                className="text-6xl md:text-9xl font-black text-cyan-500 tracking-tighter absolute top-0 left-0 z-10 opacity-70"
                                animate={{ x: [2, -2, 1, -3, 0], y: [-1, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.2, delay: 0.1 }}
                            >
                                ADITYA-L1
                            </motion.h1>
                        </div>
                        <motion.div
                            className="h-1 bg-white mt-4"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.5 }}
                        />
                        <p className="text-right text-white/80 mt-2 font-bold tracking-[0.5em] text-sm md:text-base">
                            SYSTEM OVERRIDE
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stage 3: Access Granted */}
            <AnimatePresence>
                {stage === 3 && (
                    <motion.div
                        className="relative z-10 border-4 border-green-500 p-8 bg-green-500/10 backdrop-blur-sm"
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-black text-green-500 tracking-widest uppercase text-center">
                            ACCESS GRANTED
                        </h2>
                        <div className="w-full h-2 bg-green-500 mt-4 animate-pulse"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Flash Overlay */}
            <motion.div
                className="absolute inset-0 bg-white pointer-events-none"
                initial={{ opacity: 0 }}
                animate={stage === 3 ? { opacity: [0, 0.8, 0] } : { opacity: 0 }}
                transition={{ duration: 0.1 }}
            />
        </motion.div>
    );
};

export default IntroAnimation;
