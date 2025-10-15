import { motion } from "motion/react";
import { Loader2, Zap } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex flex-col items-center gap-6 text-center"
      >
        {/* Hexagonal rotating frame */}
        <div className="relative h-24 w-24">
          {/* Outer rotating hexagon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            <svg viewBox="0 0 96 96" className="h-full w-full">
              <polygon
                points="48,6 84,27 84,69 48,90 12,69 12,27"
                fill="none"
                stroke="url(#loadingGrad1)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <defs>
                <linearGradient id="loadingGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#fbbf24', stopOpacity: 0.8 }} />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Inner counter-rotating hexagon */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2"
          >
            <svg viewBox="0 0 88 88" className="h-full w-full">
              <polygon
                points="44,6 76,24 76,64 44,82 12,64 12,24"
                fill="url(#loadingGrad2)"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-cyan"
              />
              <defs>
                <linearGradient id="loadingGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.4 }} />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Zap className="h-10 w-10 text-gold" fill="currentColor" />
            </motion.div>
          </div>

          {/* Orbiting particles */}
          {[0, 120, 240].map((rotation, i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.3,
              }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className="h-2 w-2 -translate-y-14 rounded-full bg-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            </motion.div>
          ))}
        </div>
        
        <div className="space-y-3">
          <h3 className="bg-gradient-to-r from-cyan to-gold bg-clip-text text-transparent">
            Analyzing Contract
          </h3>
          <p className="text-muted-foreground">
            AI engine processing document...
          </p>
        </div>

        {/* Animated Progress Indicator */}
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-1 w-8 rounded-full bg-cyan/20"
              animate={{
                backgroundColor: [
                  'rgba(6, 182, 212, 0.2)',
                  'rgba(6, 182, 212, 1)',
                  'rgba(6, 182, 212, 0.2)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[12px] uppercase tracking-wider text-cyan"
        >
          System Active
        </motion.div>
      </motion.div>
    </div>
  );
}
