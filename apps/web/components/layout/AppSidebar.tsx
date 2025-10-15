import { Home, Upload, BarChart3, Settings, FileText, Menu, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { motion } from "motion/react";
import { Progress } from "../ui/progress";

interface AppSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: "dashboard", label: "Command Center", icon: Home },
  { id: "upload", label: "Upload Docs", icon: Upload },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "contracts", label: "Archive", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ currentPage, onPageChange, isOpen, onToggle }: AppSidebarProps) {
  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-20 z-50 rounded-lg border border-orange-200 bg-white/90 backdrop-blur-xl hover:border-orange-300 lg:hidden"
        onClick={onToggle}
      >
        <Menu className="h-5 w-5 text-orange-600" />
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -280,
        }}
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-orange-200/60 bg-white/60 backdrop-blur-xl",
          "lg:translate-x-0"
        )}
      >
        {/* Vertical accent line */}
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-orange-300/50 via-orange-200/30 to-transparent" />
        
        <div className="relative flex h-full flex-col gap-6 px-4 py-6">
          {/* Tech decoration */}
          <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(255,123,84,0.5)]" />
          
          {/* Quick Actions */}
          <div className="space-y-3">
            <p className="px-3 text-[11px] uppercase tracking-wider text-orange-600/70">
              Quick Deploy
            </p>
            <Button
              className="relative w-full justify-start gap-3 overflow-hidden rounded-lg border border-orange-300 bg-gradient-to-r from-orange-100 to-amber-50 hover:from-orange-200 hover:to-amber-100"
              onClick={() => onPageChange("upload")}
            >
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-orange-700">Upload Contract</span>
              {/* Animated shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5">
            <p className="mb-3 px-3 text-[11px] uppercase tracking-wider text-orange-600/70">
              Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "relative w-full justify-start gap-3 rounded-lg transition-all",
                    isActive
                      ? "border border-orange-300 bg-orange-100/70 text-orange-700 shadow-[0_0_20px_rgba(255,123,84,0.15)]"
                      : "border border-transparent text-stone-600 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700"
                  )}
                  onClick={() => {
                    onPageChange(item.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg border border-orange-200 bg-orange-50/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <div className="absolute right-2 h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(255,123,84,0.6)]" />
                  )}
                </Button>
              );
            })}
          </nav>

          {/* System Status */}
          <div className="relative space-y-4 rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/30 p-4">
            {/* Corner accents */}
            <div className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-orange-400" />
            <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-orange-400" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-orange-600">
                  System Status
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                  <span className="text-[10px] text-green-600">ONLINE</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-stone-600">Docs Processed</span>
                  <span className="text-orange-700">24/50</span>
                </div>
                <Progress value={48} className="h-1.5 bg-orange-100/50" />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-stone-600">AI Usage</span>
                  <span className="text-amber-700">67%</span>
                </div>
                <Progress value={67} className="h-1.5 bg-orange-100/50" />
              </div>
            </div>
            
            <Button
              variant="link"
              className="h-auto p-0 text-[12px] text-orange-600 hover:text-orange-700"
            >
              Upgrade Plan →
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
