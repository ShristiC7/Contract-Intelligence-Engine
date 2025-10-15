import { Upload as UploadIcon, FileText, CheckCircle2, Zap } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { motion } from "motion/react";
import { cn } from "../ui/utils";

export function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
    simulateUpload();
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          <h1 className="bg-gradient-to-r from-cyan to-cyan-bright bg-clip-text text-transparent">
            Contract Deployment
          </h1>
        </div>
        <p className="text-muted-foreground">
          Upload legal contracts for instant AI-powered analysis and risk assessment.
        </p>
      </div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "group relative overflow-hidden rounded-lg border-2 border-dashed p-20 transition-all",
          isDragging
            ? "border-cyan bg-cyan/10 shadow-[0_0_40px_rgba(6,182,212,0.3)]"
            : isUploading
            ? "border-cyan border-solid bg-gradient-to-br from-cyan/5 to-navy-light/10"
            : "border-cyan/30 bg-gradient-to-br from-cyan/5 to-navy-light/10 hover:border-cyan/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[length:30px_30px]" />
        </div>

        {/* Scan Line Effect */}
        {(isDragging || isUploading) && (
          <motion.div
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          />
        )}

        {/* Corner Accents */}
        <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-cyan" />
        <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-cyan" />
        <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-cyan" />
        <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-cyan" />

        <div className="relative flex flex-col items-center justify-center gap-6 text-center">
          {uploadProgress === 100 ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="relative h-24 w-24"
            >
              <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full">
                <polygon
                  points="48,6 84,27 84,69 48,90 12,69 12,27"
                  fill="url(#successGrad)"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-green-500"
                />
                <defs>
                  <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 0.6 }} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              animate={{
                y: isDragging ? -10 : 0,
                scale: isDragging ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="relative h-24 w-24"
            >
              {/* Hexagonal frame */}
              <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full">
                <motion.polygon
                  animate={isUploading ? { rotate: 360 } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  points="48,6 84,27 84,69 48,90 12,69 12,27"
                  fill="url(#uploadFrameGrad)"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={cn(
                    "origin-center transition-colors",
                    isDragging || isUploading ? "text-cyan" : "text-cyan/40"
                  )}
                />
                <defs>
                  <linearGradient id="uploadFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.4 }} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isDragging ? (
                  <FileText className="h-12 w-12 text-cyan" />
                ) : (
                  <UploadIcon className="h-12 w-12 text-cyan" />
                )}
              </div>
            </motion.div>
          )}

          {isUploading ? (
            <div className="w-full max-w-md space-y-4">
              <h3 className="bg-gradient-to-r from-cyan to-gold bg-clip-text text-transparent">
                {uploadProgress === 100 ? "Deployment Complete!" : "Deploying Contract..."}
              </h3>
              
              <div className="space-y-2">
                <Progress
                  value={uploadProgress}
                  className="h-2 bg-navy-light/50"
                />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Processing...</span>
                  <span className="text-cyan">{uploadProgress}%</span>
                </div>
              </div>

              {/* Processing stages */}
              <div className="space-y-2 text-left">
                {[
                  { label: "Uploading", threshold: 30 },
                  { label: "Scanning", threshold: 60 },
                  { label: "Analyzing", threshold: 90 },
                  { label: "Complete", threshold: 100 },
                ].map((stage, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-[12px] transition-colors",
                      uploadProgress >= stage.threshold
                        ? "text-cyan"
                        : "text-muted-foreground"
                    )}
                  >
                    {uploadProgress >= stage.threshold ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-current" />
                    )}
                    <span>{stage.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h2 className="bg-gradient-to-r from-cyan to-cyan-bright bg-clip-text text-transparent">
                  {isDragging ? "Release to Deploy" : "Deploy Contract File"}
                </h2>
                <p className="text-muted-foreground">
                  or{" "}
                  <button
                    onClick={simulateUpload}
                    className="text-cyan transition-colors hover:text-cyan-bright"
                  >
                    browse secure storage
                  </button>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                  <span>PDF, DOC, DOCX</span>
                </div>
                <div className="h-3 w-px bg-cyan/20" />
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                  <span>Max 10MB</span>
                </div>
                <div className="h-3 w-px bg-cyan/20" />
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                  <span>256-bit Encrypted</span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Recent Uploads Preview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-gold shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
          <h3 className="text-gold">Recent Deployments</h3>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group relative cursor-pointer overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm transition-all hover:border-cyan/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                {/* Top accent */}
                <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    {/* Hexagonal icon */}
                    <div className="relative h-12 w-12 shrink-0">
                      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full">
                        <polygon
                          points="24,2 42,13 42,35 24,46 6,35 6,13"
                          fill="url(#recentGrad)"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-cyan/40"
                        />
                        <defs>
                          <linearGradient id="recentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
                            <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.3 }} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-cyan" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <h4 className="leading-tight">Contract_{i}.pdf</h4>
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Zap className="h-3 w-3 text-gold" />
                        <span>{i} hour{i > 1 ? "s" : ""} ago</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
