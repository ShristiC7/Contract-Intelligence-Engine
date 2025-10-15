import { FileText, Upload, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "motion/react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No contracts detected",
  description = "Deploy your first contract to initiate AI-powered legal analysis.",
  actionLabel = "Upload Contract",
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[400px] items-center justify-center"
    >
      <div className="relative flex max-w-md flex-col items-center gap-8 text-center">
        {/* Animated Icon with Hexagonal Frame */}
        <div className="relative">
          {/* Floating hexagonal frame */}
          <motion.div
            animate={{
              y: [0, -15, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative h-32 w-32"
          >
            {/* Main hexagon */}
            <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full">
              <polygon
                points="64,8 112,36 112,92 64,120 16,92 16,36"
                fill="url(#emptyGrad)"
                stroke="currentColor"
                strokeWidth="2"
                className="text-cyan/40"
              />
              <defs>
                <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
                  <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.3 }} />
                </linearGradient>
              </defs>
            </svg>

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="h-16 w-16 text-cyan/60" />
            </div>

            {/* Corner tech accents */}
            <div className="absolute left-4 top-4 h-3 w-3 border-l-2 border-t-2 border-cyan" />
            <div className="absolute bottom-4 right-4 h-3 w-3 border-b-2 border-r-2 border-cyan" />
          </motion.div>
          
          {/* Floating Upload Icon */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -right-4 -top-4"
          >
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full">
                <polygon
                  points="28,2 49,14 49,42 28,54 7,42 7,14"
                  fill="url(#uploadBadgeGrad)"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-cyan"
                />
                <defs>
                  <linearGradient id="uploadBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.9 }} />
                  </linearGradient>
                </defs>
              </svg>
              <Upload className="relative z-10 h-6 w-6 text-background" />
            </div>
          </motion.div>

          {/* Floating sparkles */}
          {[
            { delay: 0, x: -40, y: -20 },
            { delay: 0.5, x: 40, y: -30 },
            { delay: 1, x: 0, y: 50 },
          ].map((pos, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: pos.delay,
              }}
              className="absolute"
              style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
            >
              <Sparkles className="h-4 w-4 text-gold" />
            </motion.div>
          ))}

          {/* Orbiting dots */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-2 w-2 -translate-y-20 rounded-full bg-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-2 w-2 translate-y-20 rounded-full bg-gold shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h3 className="bg-gradient-to-r from-cyan via-cyan-bright to-gold bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="leading-relaxed text-muted-foreground">{description}</p>
        </div>

        {/* Action Button */}
        {onAction && (
          <Button
            onClick={onAction}
            className="group relative overflow-hidden rounded-lg border border-cyan/30 bg-gradient-to-r from-cyan/20 to-navy-light/40 px-6 hover:from-cyan/30 hover:to-navy-light/60"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {actionLabel}
            </span>
            {/* Animated shine effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </Button>
        )}

        {/* Bottom status indicator */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          <span>System Ready</span>
        </div>
      </div>
    </motion.div>
  );
}
