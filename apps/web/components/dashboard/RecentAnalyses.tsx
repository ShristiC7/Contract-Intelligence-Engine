import { FileText, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { motion } from "motion/react";

const recentContracts = [
  {
    id: 1,
    title: "Software License Agreement - TechCorp",
    date: "2 hours ago",
    status: "completed",
    riskLevel: "low",
    confidence: 94,
    summary: "Standard SaaS agreement with favorable terms. No major red flags identified.",
  },
  {
    id: 2,
    title: "Employment Contract - Jane Smith",
    date: "5 hours ago",
    status: "completed",
    riskLevel: "medium",
    confidence: 87,
    summary: "Non-compete clause requires review. Termination terms are standard.",
  },
  {
    id: 3,
    title: "Vendor Service Agreement - DataFlow Inc",
    date: "1 day ago",
    status: "completed",
    riskLevel: "high",
    confidence: 91,
    summary: "Liability caps are unfavorable. Payment terms need negotiation.",
  },
  {
    id: 4,
    title: "Lease Agreement - Office Space Downtown",
    date: "2 days ago",
    status: "processing",
    riskLevel: "low",
    confidence: 0,
    summary: "Analysis in progress...",
  },
];

const riskColors = {
  low: "border-green-500/30 bg-green-500/10 text-green-400",
  medium: "border-gold/30 bg-gold/10 text-gold",
  high: "border-red-500/30 bg-red-500/10 text-red-400",
};

const statusIcons = {
  completed: CheckCircle2,
  processing: Clock,
};

export function RecentAnalyses() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          <h3 className="text-cyan">Recent Analyses</h3>
        </div>
        <button className="text-[13px] text-cyan transition-colors hover:text-cyan-bright">
          View Archive →
        </button>
      </div>

      <div className="grid gap-3">
        {recentContracts.map((contract, index) => {
          const StatusIcon = statusIcons[contract.status as keyof typeof statusIcons];
          
          return (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="group relative cursor-pointer overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm transition-all hover:border-cyan/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                {/* Animated gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan/0 via-cyan/5 to-cyan/0 opacity-0 transition-opacity group-hover:opacity-100" />
                
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${
                  contract.riskLevel === 'low' ? 'from-green-500 to-green-600' :
                  contract.riskLevel === 'medium' ? 'from-gold to-gold-bright' :
                  'from-red-500 to-red-600'
                }`} />

                <CardContent className="relative p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon with hexagonal frame */}
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full">
                        <polygon
                          points="24,2 42,13 42,35 24,46 6,35 6,13"
                          fill="url(#fileGrad)"
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-cyan/40"
                        />
                        <defs>
                          <linearGradient id="fileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.1 }} />
                            <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.3 }} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <FileText className="relative z-10 h-5 w-5 text-cyan" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h4 className="leading-tight text-foreground">
                            {contract.title}
                          </h4>
                          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {contract.date}
                            </div>
                            {contract.status === 'completed' && (
                              <>
                                <div className="h-3 w-px bg-cyan/20" />
                                <div className="flex items-center gap-1.5">
                                  <TrendingUp className="h-3 w-3 text-cyan" />
                                  <span className="text-cyan">{contract.confidence}% confidence</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className={riskColors[contract.riskLevel as keyof typeof riskColors]}
                          >
                            {contract.riskLevel.toUpperCase()}
                          </Badge>
                          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-cyan/20 bg-cyan/5">
                            <StatusIcon className={`h-4 w-4 ${
                              contract.status === 'completed' ? 'text-green-500' : 'text-gold'
                            }`} />
                          </div>
                        </div>
                      </div>

                      <p className="text-[13px] leading-relaxed text-muted-foreground">
                        {contract.summary}
                      </p>
                    </div>
                  </div>

                  {/* Bottom border accent */}
                  <div className="absolute bottom-0 left-12 right-0 h-px bg-gradient-to-r from-cyan/20 via-cyan/5 to-transparent" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
