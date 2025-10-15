import { Upload, FileText, Scan } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "../ui/utils";

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file upload logic here
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "group relative overflow-hidden rounded-lg border-2 border-dashed p-12 transition-all",
        isDragging
          ? "border-orange-400 bg-orange-100/50 shadow-[0_0_40px_rgba(255,123,84,0.25)]"
          : "border-orange-300 bg-gradient-to-br from-orange-50/30 to-amber-50/20 hover:border-orange-400"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,123,84,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,123,84,0.08)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      {/* Scan Line Effect */}
      <motion.div
        animate={{
          y: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50"
      />

      {/* Corner Accents */}
      <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-orange-400" />
      <div className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-orange-400" />
      <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-orange-400" />
      <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-orange-400" />

      <div className="relative flex flex-col items-center justify-center gap-5 text-center">
        {/* Icon Container */}
        <motion.div
          animate={{
            y: isDragging ? -10 : 0,
            scale: isDragging ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* Hexagonal frame */}
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full">
              <polygon
                points="40,5 70,22 70,58 40,75 10,58 10,22"
                fill="url(#uploadGrad)"
                stroke="currentColor"
                strokeWidth="2"
                className={cn(
                  "transition-colors",
                  isDragging ? "text-orange-500" : "text-orange-400/40"
                )}
              />
              <defs>
                <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#ff7b54', stopOpacity: 0.15 }} />
                  <stop offset="100%" style={{ stopColor: '#ffb347', stopOpacity: 0.25 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isDragging ? (
                <Scan className="h-10 w-10 text-orange-600" />
              ) : (
                <Upload className="h-10 w-10 text-orange-600" />
              )}
            </div>
          </div>

          {/* Orbiting particles */}
          {!isDragging && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="h-2 w-2 -translate-y-12 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(255,123,84,0.5)]" />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="h-2 w-2 translate-y-12 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(255,179,71,0.5)]" />
              </motion.div>
            </>
          )}
        </motion.div>

        <div className="space-y-3">
          <h3 className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {isDragging ? "Release to Analyze" : "Deploy Contract for Analysis"}
          </h3>
          <p className="text-stone-600">
            or{" "}
            <button className="text-orange-600 transition-colors hover:text-orange-700">
              browse secure files
            </button>
          </p>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-stone-600">
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-orange-500" />
            <span>PDF, DOC, DOCX</span>
          </div>
          <div className="h-3 w-px bg-orange-300" />
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-amber-500" />
            <span>Max 10MB</span>
          </div>
          <div className="h-3 w-px bg-orange-300" />
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-green-500" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
