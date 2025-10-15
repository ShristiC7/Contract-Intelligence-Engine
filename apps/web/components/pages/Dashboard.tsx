import { UploadZone } from "../dashboard/UploadZone";
import { RecentAnalyses } from "../dashboard/RecentAnalyses";
import { AnalyticsPanel } from "../dashboard/AnalyticsPanel";
import { motion } from "motion/react";

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(255,123,84,0.5)]" />
          <h1 className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
            Command Center
          </h1>
        </div>
        <p className="text-stone-600">
          Welcome back to the Contract Intelligence Engine. Your AI-powered legal analysis system is online.
        </p>
      </motion.div>

      {/* Upload Section */}
      <UploadZone />

      {/* Analytics */}
      <AnalyticsPanel />

      {/* Recent Analyses */}
      <RecentAnalyses />
    </div>
  );
}
