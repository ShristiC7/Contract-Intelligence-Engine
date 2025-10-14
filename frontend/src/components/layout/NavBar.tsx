import { Bell, Settings, Shield } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function NavBar() {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-orange-200/60 bg-white/80 backdrop-blur-xl">
      <div className="relative flex h-16 items-center justify-between px-6">
        {/* Animated top border */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
        
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            {/* Hexagon background */}
            <div className="absolute inset-0">
              <svg viewBox="0 0 40 40" className="h-full w-full">
                <polygon
                  points="20,2 35,11 35,29 20,38 5,29 5,11"
                  fill="url(#hexGrad)"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-orange-400"
                />
                <defs>
                  <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ff7b54', stopOpacity: 0.15 }} />
                    <stop offset="100%" style={{ stopColor: '#ffb347', stopOpacity: 0.25 }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <Shield className="relative z-10 h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              CONTRACT INTEL
            </h1>
            <p className="text-[11px] uppercase tracking-[0.15em] text-orange-500/70">
              AI Legal Analysis
            </p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-lg border border-orange-200 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-100/50"
          >
            <Bell className="h-4 w-4 text-orange-600" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg border border-orange-200 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-100/50"
          >
            <Settings className="h-4 w-4 text-orange-600" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative flex h-10 items-center gap-3 rounded-lg border border-orange-200 bg-orange-50/50 px-3 transition-colors hover:border-orange-300 hover:bg-orange-100/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
              <Avatar className="h-7 w-7 rounded-lg border border-orange-200">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 text-[11px] text-white">
                  JD
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] text-stone-700">J. Doe</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-lg border border-orange-200 bg-white/95 backdrop-blur-xl"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-stone-800">John Doe</p>
                  <p className="text-[13px] text-stone-600">Legal Analyst</p>
                  <p className="text-[11px] text-orange-600">john@lawfirm.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-orange-100" />
              <DropdownMenuItem className="rounded-md">Profile</DropdownMenuItem>
              <DropdownMenuItem className="rounded-md">Billing</DropdownMenuItem>
              <DropdownMenuItem className="rounded-md">Team</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-orange-100" />
              <DropdownMenuItem className="rounded-md text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
