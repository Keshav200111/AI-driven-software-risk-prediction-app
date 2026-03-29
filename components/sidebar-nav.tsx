"use client";

import { cn } from "@/lib/utils";
import {
  Upload,
  Brain,
  BarChart3,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  Shield,
  Activity,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  step: number;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "upload", label: "Input & Extraction", sublabel: "Upload software artifacts", icon: Upload, step: 1 },
  { id: "model", label: "ML Prediction", sublabel: "Risk score computation", icon: Brain, step: 2, disabled: true },
  { id: "analysis", label: "Risk Analysis", sublabel: "CVE/CWE breakdown", icon: BarChart3, step: 3 },
  { id: "dashboard", label: "Risk Dashboard", sublabel: "Interactive reports", icon: LayoutDashboard, step: 4 },
  { id: "advisory", label: "Security Advisory", sublabel: "Mitigation guidance", icon: ShieldCheck, step: 5 },
];

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasResult: boolean;
}

export default function SidebarNav({ activeTab, setActiveTab, hasResult }: Props) {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-sidebar-foreground leading-tight">RiskSense AI</p>
            <p className="text-xs text-sidebar-foreground/60">Risk Management System</p>
          </div>
        </div>
      </div>

      {/* Pipeline Label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-widest">
          Analysis Pipeline
        </p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = item.disabled || (!hasResult && item.id !== "upload");

          return (
            <button
              key={item.id}
              onClick={() => !isLocked && setActiveTab(item.id)}
              disabled={isLocked}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : isLocked
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/80 hover:text-sidebar-foreground cursor-pointer"
              )}
            >
              {/* Step number */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                  isActive
                    ? "bg-accent text-white"
                    : isLocked
                    ? "bg-sidebar-border text-sidebar-foreground/40"
                    : "bg-sidebar-border text-sidebar-foreground/60 group-hover:bg-accent/20 group-hover:text-accent"
                )}
              >
                {item.step}
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{item.label}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate mt-0.5">{item.sublabel}</p>
              </div>

              {isActive && <ChevronRight className="w-3.5 h-3.5 text-accent shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Pipeline Flow Indicator */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-1.5">
          {NAV_ITEMS.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                activeTab === item.id
                  ? "bg-accent"
                  : hasResult && i < NAV_ITEMS.findIndex(n => n.id === activeTab)
                  ? "bg-sidebar-foreground/30"
                  : "bg-sidebar-border"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-sidebar-foreground/40 mt-2 text-center">
          Sequential Analysis Pipeline
        </p>
      </div>

      {/* Status */}
      <div className="px-4 pb-4">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
          hasResult ? "bg-green-500/10 text-green-400" : "bg-sidebar-accent text-sidebar-foreground/60"
        )}>
          <Activity className="w-3 h-3" />
          {hasResult ? "Analysis complete" : "Awaiting input"}
        </div>
      </div>
    </aside>
  );
}
