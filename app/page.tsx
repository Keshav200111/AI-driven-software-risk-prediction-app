"use client";

import { useState } from "react";
import SidebarNav from "@/components/sidebar-nav";
import UploadModule from "@/components/upload-module";
import MLModelPanel from "@/components/ml-model-panel";
import RiskAnalysis from "@/components/risk-analysis";
import RiskDashboard from "@/components/risk-dashboard";
import SecurityAdvisory from "@/components/security-advisory";
import { type FullAnalysisResult, DEMO_RESULT, getRiskColor } from "@/lib/risk-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronLeft,
  PlayCircle,
  RotateCcw,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_ORDER = ["upload", "model", "analysis", "dashboard", "advisory"] as const;
type TabId = (typeof TAB_ORDER)[number];

const TAB_LABELS: Record<TabId, string> = {
  upload: "Input & Extraction",
  model: "ML Prediction",
  analysis: "Risk Analysis",
  dashboard: "Risk Dashboard",
  advisory: "Security Advisory",
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("upload");
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasResult = result !== null;

  const handleAnalysisComplete = (res: FullAnalysisResult) => {
    setResult(res);
    setActiveTab("dashboard");
  };

  const loadDemo = () => {
    setResult(DEMO_RESULT);
    setActiveTab("dashboard");
  };

  const resetAll = () => {
    setResult(null);
    setActiveTab("upload");
  };

  const currentIdx = TAB_ORDER.indexOf(activeTab);
  const canGoNext = currentIdx < TAB_ORDER.length - 1 && (hasResult || activeTab === "upload");
  const canGoPrev = currentIdx > 0;

  const goNext = () => { if (canGoNext) setActiveTab(TAB_ORDER[currentIdx + 1]); };
  const goPrev = () => { if (canGoPrev) setActiveTab(TAB_ORDER[currentIdx - 1]); };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab as TabId); setSidebarOpen(false); }}
          hasResult={hasResult}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground hidden sm:block">RiskSense AI</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <span className="font-semibold text-foreground">{TAB_LABELS[activeTab]}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasResult && (
              <Badge
                className="text-xs font-semibold hidden sm:flex border"
                style={{
                  backgroundColor: getRiskColor(result!.risk_level) + "20",
                  color: getRiskColor(result!.risk_level),
                  borderColor: getRiskColor(result!.risk_level) + "40",
                }}
              >
                {result!.project_name} — {result!.risk_level}
              </Badge>
            )}
            {!hasResult && !isLoading && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-accent text-accent hover:bg-accent hover:text-white"
                onClick={loadDemo}
              >
                <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                Load Demo
              </Button>
            )}
            {hasResult && (
              <Button size="sm" variant="outline" className="text-xs" onClick={resetAll}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset
              </Button>
            )}
          </div>
        </header>

        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-0 px-6 pt-4 pb-0 overflow-x-auto">
          {TAB_ORDER.map((tab, i) => {
            const isCurrent = activeTab === tab;
            const isDone = hasResult && TAB_ORDER.indexOf(activeTab) > i;
            const isAvailable = hasResult || tab === "upload";
            return (
              <div key={tab} className="flex items-center shrink-0">
                <button
                  onClick={() => isAvailable && setActiveTab(tab)}
                  disabled={!isAvailable}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                      ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                      : isAvailable
                      ? "text-muted-foreground hover:bg-muted cursor-pointer"
                      : "text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0",
                      isCurrent
                        ? "bg-white text-primary"
                        : isDone
                        ? "bg-green-500 text-white"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  {TAB_LABELS[tab]}
                </button>
                {i < TAB_ORDER.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {activeTab === "upload" && (
              <UploadModule
                onAnalysisComplete={handleAnalysisComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {activeTab === "model" && result && <MLModelPanel result={result} />}
            {activeTab === "analysis" && result && <RiskAnalysis result={result} />}
            {activeTab === "dashboard" && result && <RiskDashboard result={result} />}
            {activeTab === "advisory" && result && <SecurityAdvisory result={result} />}

            {/* Empty state */}
            {!result && activeTab !== "upload" && (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">No analysis yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a file or load the demo to see results.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("upload")}>
                    Go to Upload
                  </Button>
                  <Button
                    size="sm"
                    className="bg-accent hover:bg-accent/90 text-white"
                    onClick={loadDemo}
                  >
                    Load Demo
                  </Button>
                </div>
              </div>
            )}

            {/* Prev / Next Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={!canGoPrev}
                className="gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Step {currentIdx + 1} of {TAB_ORDER.length}
              </span>
              <Button
                variant={canGoNext ? "default" : "outline"}
                size="sm"
                onClick={goNext}
                disabled={!canGoNext || isLoading}
                className={cn("gap-1.5", canGoNext && "bg-primary hover:bg-primary/90 text-primary-foreground")}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
