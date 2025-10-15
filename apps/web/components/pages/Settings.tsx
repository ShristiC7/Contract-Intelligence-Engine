import { User, Key, Bell, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { motion } from "motion/react";

export function Settings() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
          <h1 className="bg-gradient-to-r from-cyan to-cyan-bright bg-clip-text text-transparent">
            System Configuration
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage account settings, security protocols, and system preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm">
            {/* Corner accents */}
            <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-cyan/40" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-cyan/40" />
            
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full">
                    <polygon
                      points="24,2 42,13 42,35 24,46 6,35 6,13"
                      fill="url(#profileGrad)"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-cyan"
                    />
                    <defs>
                      <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.6 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="h-5 w-5 text-cyan" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-cyan">Profile Data</CardTitle>
                  <CardDescription>Update account credentials</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[13px] uppercase tracking-wider text-cyan/80">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  defaultValue="John Doe"
                  className="rounded-lg border-cyan/20 bg-navy-light/30 focus:border-cyan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] uppercase tracking-wider text-cyan/80">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@lawfirm.com"
                  defaultValue="john@lawfirm.com"
                  className="rounded-lg border-cyan/20 bg-navy-light/30 focus:border-cyan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-[13px] uppercase tracking-wider text-cyan/80">
                  Organization
                </Label>
                <Input
                  id="company"
                  placeholder="Your Company"
                  defaultValue="Legal Corp International"
                  className="rounded-lg border-cyan/20 bg-navy-light/30 focus:border-cyan"
                />
              </div>
              <Separator className="bg-cyan/10" />
              <Button className="w-full rounded-lg border border-cyan/30 bg-cyan/20 hover:bg-cyan/30">
                <Zap className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Keys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm">
            <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-gold/40" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-gold/40" />
            
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full">
                    <polygon
                      points="24,2 42,13 42,35 24,46 6,35 6,13"
                      fill="url(#keyGrad)"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-gold"
                    />
                    <defs>
                      <linearGradient id="keyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.6 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Key className="h-5 w-5 text-gold" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-gold">API Access</CardTitle>
                  <CardDescription>Manage integration keys</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-[13px] uppercase tracking-wider text-gold/80">
                  System API Key
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    defaultValue="sk-1234567890abcdef"
                    className="rounded-lg border-cyan/20 bg-navy-light/30"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    className="shrink-0 rounded-lg border-gold/30 text-gold hover:bg-gold/10"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-[13px] uppercase tracking-wider text-gold/80">
                  AI Engine Key
                </Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  className="rounded-lg border-cyan/20 bg-navy-light/30 focus:border-gold"
                />
                <p className="text-[12px] text-muted-foreground">
                  Required for AI legal analysis features
                </p>
              </div>
              <Separator className="bg-cyan/10" />
              <Button
                variant="outline"
                className="w-full rounded-lg border-gold/30 text-gold hover:bg-gold/10"
              >
                Generate New Key
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm">
            <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-purple-500/40" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-purple-500/40" />
            
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full">
                    <polygon
                      points="24,2 42,13 42,35 24,46 6,35 6,13"
                      fill="url(#bellGrad)"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-purple-500"
                    />
                    <defs>
                      <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0.6 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-purple-400">Alert System</CardTitle>
                  <CardDescription>Configure notification protocols</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-[13px] uppercase tracking-wider text-purple-400/80">
                    Email Notifications
                  </Label>
                  <p className="text-[12px] text-muted-foreground">
                    Analysis completion alerts
                  </p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-cyan" />
              </div>
              <Separator className="bg-cyan/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-[13px] uppercase tracking-wider text-purple-400/80">
                    Risk Alerts
                  </Label>
                  <p className="text-[12px] text-muted-foreground">
                    High-risk clause detection
                  </p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-gold" />
              </div>
              <Separator className="bg-cyan/10" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-[13px] uppercase tracking-wider text-purple-400/80">
                    Weekly Analytics
                  </Label>
                  <p className="text-[12px] text-muted-foreground">
                    Summary reports via email
                  </p>
                </div>
                <Switch className="data-[state=checked]:bg-cyan" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden rounded-lg border border-cyan/20 bg-card/40 backdrop-blur-sm">
            <div className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-green-500/40" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-green-500/40" />
            
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full">
                    <polygon
                      points="24,2 42,13 42,35 24,46 6,35 6,13"
                      fill="url(#shieldGrad)"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-green-500"
                    />
                    <defs>
                      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 0.6 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-green-400">Security Protocol</CardTitle>
                  <CardDescription>Manage access credentials</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-[13px] uppercase tracking-wider text-green-400/80">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-lg border-cyan/20 bg-navy-light/30 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-[13px] uppercase tracking-wider text-green-400/80">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-lg border-cyan/20 bg-navy-light/30 focus:border-green-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-[13px] uppercase tracking-wider text-green-400/80">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-lg border-cyan/20 bg-navy-light/30 focus:border-green-500"
                />
              </div>
              <Separator className="bg-cyan/10" />
              <Button className="w-full rounded-lg border border-green-500/30 bg-green-500/20 text-green-400 hover:bg-green-500/30">
                Update Password
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
