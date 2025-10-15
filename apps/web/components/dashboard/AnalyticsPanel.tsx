import { TrendingUp, FileText, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { motion } from "motion/react";

const stats = [
  {
    title: "Total Contracts",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: FileText,
    color: "from-cyan to-blue-600",
    glow: "cyan",
  },
  {
    title: "Success Rate",
    value: "94%",
    change: "+3%",
    trend: "up",
    icon: CheckCircle,
    color: "from-green-500 to-emerald-600",
    glow: "green",
  },
  {
    title: "Risk Alerts",
    value: "3",
    change: "-25%",
    trend: "down",
    icon: AlertTriangle,
    color: "from-gold to-orange-500",
    glow: "gold",
  },
  {
    title: "Avg. Processing",
    value: "2.4m",
    change: "-15%",
    trend: "down",
    icon: Activity,
    color: "from-purple-500 to-pink-600",
    glow: "purple",
  },
];

const categoryData = [
  { name: "Employment", count: 8, percentage: 33, color: "cyan" },
  { name: "Vendor", count: 6, percentage: 25, color: "gold" },
  { name: "Real Estate", count: 5, percentage: 21, color: "purple" },
  { name: "Licensing", count: 5, percentage: 21, color: "green" },
];

const progressColors = {
  cyan: "bg-cyan",
  gold: "bg-gold",
  purple: "bg-purple-500",
  green: "bg-green-500",
};

export function AnalyticsPanel() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="group relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm transition-all hover:border-cyan/40">
                {/* Corner tech accents */}
                <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-cyan/20" />
                <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-cyan/20" />
                
                {/* Animated background gradient */}
                <motion.div
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.color} opacity-30 blur-3xl`}
                />

                <CardContent className="relative p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline gap-3">
                        <h2 className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                          {stat.value}
                        </h2>
                        <span className={`flex items-center gap-1 text-[12px] ${
                          stat.trend === 'up' ? 'text-green-500' : 'text-gold'
                        }`}>
                          <TrendingUp className={`h-3 w-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    
                    {/* Hexagonal icon container */}
                    <div className="relative h-12 w-12">
                      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full">
                        <polygon
                          points="24,2 42,13 42,35 24,46 6,35 6,13"
                          fill="url(#statGrad)"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className={`text-${stat.glow}-500`}
                        />
                        <defs>
                          <linearGradient id="statGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.2 }} />
                            <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.4 }} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-cyan" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Contract Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm">
          {/* Top tech accent */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent" />
          
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <CardTitle className="text-cyan">Contract Categories</CardTitle>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Distribution
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-5">
            {categoryData.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${progressColors[category.color as keyof typeof progressColors]} shadow-[0_0_6px_currentColor]`} />
                    <span className="text-foreground">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {category.count} contracts
                    </span>
                    <span className="min-w-[3ch] text-right text-cyan">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
                
                <div className="relative h-2 overflow-hidden rounded-full bg-navy-light/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percentage}%` }}
                    transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
                    className={`h-full ${progressColors[category.color as keyof typeof progressColors]} shadow-[0_0_10px_currentColor]`}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
