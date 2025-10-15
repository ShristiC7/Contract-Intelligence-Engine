import { FileText, AlertTriangle, CheckCircle2, Info, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { motion } from "motion/react";
import { Separator } from "../ui/separator";

const analysisData = {
  title: "Software License Agreement - TechCorp",
  date: "October 14, 2025",
  status: "completed",
  riskLevel: "low",
  summary: {
    overview:
      "This Software License Agreement establishes a standard licensing relationship between TechCorp and the client. The agreement is well-structured and includes commonly accepted industry terms.",
    keyPoints: [
      "12-month subscription term with auto-renewal",
      "Standard intellectual property protections",
      "Reasonable data usage and privacy provisions",
      "Clear termination and refund policies",
    ],
    confidence: 92,
  },
  risks: [
    {
      level: "medium",
      title: "Limitation of Liability Cap",
      description:
        "The liability cap is set at 3 months of fees paid, which may be insufficient for critical business operations.",
      impact: "Could limit recourse in case of service failures or data breaches.",
    },
    {
      level: "low",
      title: "Automatic Renewal Clause",
      description:
        "Contract auto-renews unless cancelled 30 days before term end.",
      impact: "May result in unintended renewal if not tracked properly.",
    },
  ],
  clauses: [
    {
      title: "Grant of License",
      content:
        "TechCorp grants a non-exclusive, non-transferable license to use the software for internal business purposes.",
      category: "licensing",
    },
    {
      title: "Payment Terms",
      content:
        "Annual fees of $50,000 due within 30 days of invoice. Late payments subject to 1.5% monthly interest.",
      category: "financial",
    },
    {
      title: "Confidentiality",
      content:
        "Both parties agree to maintain confidentiality of proprietary information for 5 years post-termination.",
      category: "legal",
    },
    {
      title: "Termination",
      content:
        "Either party may terminate with 90 days written notice. Immediate termination allowed for material breach.",
      category: "termination",
    },
  ],
};

const riskLevelColors = {
  low: "border-green-500/30 bg-green-500/10 text-green-400",
  medium: "border-gold/30 bg-gold/10 text-gold",
  high: "border-red-500/30 bg-red-500/10 text-red-400",
};

const categoryColors = {
  licensing: "border-cyan/30 bg-cyan/10 text-cyan",
  financial: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  legal: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  termination: "border-red-500/30 bg-red-500/10 text-red-400",
};

export function AnalysisResults() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Hexagonal icon */}
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full">
                <polygon
                  points="32,4 56,18 56,46 32,60 8,46 8,18"
                  fill="url(#headerGrad)"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-cyan"
                />
                <defs>
                  <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
                    <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.6 }} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="h-8 w-8 text-cyan" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="bg-gradient-to-r from-cyan to-cyan-bright bg-clip-text text-transparent">
                {analysisData.title}
              </h1>
              <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <span>Analyzed: {analysisData.date}</span>
                <div className="h-3 w-px bg-cyan/20" />
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-gold" />
                  <span className="text-cyan">{analysisData.summary.confidence}% Confidence</span>
                </div>
              </div>
            </div>
          </div>
          
          <Badge
            variant="outline"
            className={riskLevelColors[analysisData.riskLevel as keyof typeof riskLevelColors]}
          >
            {analysisData.riskLevel.toUpperCase()} RISK
          </Badge>
        </div>

        <Card className="relative overflow-hidden rounded-lg border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-600/5">
          {/* Animated scan line */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 left-0 w-px bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
          />
          
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-[14px] text-green-400">Analysis Complete</p>
                <p className="text-[12px] text-muted-foreground">
                  Document processed and verified • {analysisData.summary.confidence}% confidence score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 rounded-lg border border-cyan/20 bg-card/40 p-1 backdrop-blur-sm">
            <TabsTrigger
              value="summary"
              className="rounded-md data-[state=active]:bg-cyan/20 data-[state=active]:text-cyan data-[state=active]:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="risks"
              className="rounded-md data-[state=active]:bg-cyan/20 data-[state=active]:text-cyan data-[state=active]:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              Risks
            </TabsTrigger>
            <TabsTrigger
              value="clauses"
              className="rounded-md data-[state=active]:bg-cyan/20 data-[state=active]:text-cyan data-[state=active]:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              Key Clauses
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm">
                {/* Corner accents */}
                <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-cyan" />
                <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-cyan" />
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="leading-relaxed text-muted-foreground">
                    {analysisData.summary.overview}
                  </p>

                  <Separator className="bg-cyan/10" />

                  <div className="space-y-4">
                    <h4 className="text-cyan">Key Highlights</h4>
                    <ul className="space-y-3">
                      {analysisData.summary.keyPoints.map((point, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.1 }}
                          className="flex gap-3"
                        >
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                          <span className="text-[14px] text-muted-foreground">
                            {point}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            {analysisData.risks.map((risk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm">
                  {/* Risk level indicator bar */}
                  <div className={`absolute left-0 top-0 h-full w-1 ${
                    risk.level === 'low' ? 'bg-green-500' :
                    risk.level === 'medium' ? 'bg-gold' :
                    'bg-red-500'
                  } shadow-[0_0_10px_currentColor]`} />
                  
                  <CardContent className="p-6 pl-8">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                            <AlertTriangle className="h-6 w-6 text-gold" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-foreground">{risk.title}</h4>
                            <Badge
                              variant="outline"
                              className={riskLevelColors[risk.level as keyof typeof riskLevelColors]}
                            >
                              {risk.level.toUpperCase()} SEVERITY
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pl-[60px]">
                        <div className="space-y-2">
                          <p className="text-[12px] uppercase tracking-wider text-cyan">
                            Description
                          </p>
                          <p className="text-[14px] leading-relaxed text-muted-foreground">
                            {risk.description}
                          </p>
                        </div>
                        <Separator className="bg-cyan/10" />
                        <div className="space-y-2">
                          <p className="text-[12px] uppercase tracking-wider text-gold">
                            Potential Impact
                          </p>
                          <p className="text-[14px] leading-relaxed text-muted-foreground">
                            {risk.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* Key Clauses Tab */}
          <TabsContent value="clauses" className="space-y-4">
            {analysisData.clauses.map((clause, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10">
                            <Info className="h-6 w-6 text-cyan" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-foreground">{clause.title}</h4>
                            <Badge
                              variant="outline"
                              className={categoryColors[clause.category as keyof typeof categoryColors]}
                            >
                              {clause.category.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <p className="pl-[60px] text-[14px] leading-relaxed text-muted-foreground">
                        {clause.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
