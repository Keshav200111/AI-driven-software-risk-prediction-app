"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Zap,
  ChevronRight,
  ShieldCheck,
  Building2,
  ListChecks,
  FileWarning,
  Download,
} from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { getRiskBadgeClass, getRiskColor, type FullAnalysisResult } from "@/lib/risk-engine";

interface Props {
  result: FullAnalysisResult;
}

const EFFORT_COLOR: Record<string, string> = {
  HIGH: "text-red-600 bg-red-50 border-red-200",
  MEDIUM: "text-amber-600 bg-amber-50 border-amber-200",
  LOW: "text-green-600 bg-green-50 border-green-200",
};

const EFFORT_LABEL: Record<string, string> = {
  HIGH: "High Effort",
  MEDIUM: "Med Effort",
  LOW: "Low Effort",
};

export default function SecurityAdvisory({ result }: Props) {
  const { advisory } = result;
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (!response.ok) {
        const err = await response.text();
        console.error('Server response:', err);
        throw new Error('Server error: ' + err);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.project_name || 'Risk_Report'}_Analysis_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "PDF report downloaded successfully.",
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold">5</div>
          <span className="font-semibold text-foreground">Security Advisory</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Actionable mitigation & remediation steps</span>
      </div>

      {/* Executive Summary */}
      <Card
        className="border-l-4"
        style={{ borderLeftColor: getRiskColor(advisory.risk_level) }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileWarning className="w-5 h-5" style={{ color: getRiskColor(advisory.risk_level) }} />
            <CardTitle className="text-base">Executive Summary</CardTitle>
            <Badge className={`ml-auto text-xs border ${getRiskBadgeClass(advisory.risk_level)}`}>
              {advisory.risk_level} RISK
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">{advisory.summary}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <p className="text-2xl font-bold" style={{ color: getRiskColor(advisory.risk_level) }}>
                {advisory.risk_score.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Risk Score /100</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 text-center">
              <p className="text-2xl font-bold text-primary">{advisory.action_items.length}</p>
              <p className="text-xs text-muted-foreground">Action Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioritized Action Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            Prioritized Action Items
          </CardTitle>
          <CardDescription>Ranked remediation steps ordered by severity and impact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {advisory.action_items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/10 transition-colors"
            >
              {/* Priority Badge */}
              <div className="flex items-center gap-3 sm:w-8">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: getRiskColor(item.type) }}
                >
                  {item.priority}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {item.category}
                  </span>
                  <Badge className={`text-xs border ${getRiskBadgeClass(item.type)}`}>{item.type}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{item.action}</p>
              </div>

              {/* Meta */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${EFFORT_COLOR[item.effort]}`}>
                  {EFFORT_LABEL[item.effort]}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {item.timeline}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Mitigation Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Mitigation Guidelines
          </CardTitle>
          <CardDescription>Risk-level-specific security hardening steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {advisory.mitigations.map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Architectural Recommendations */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-primary">
            <Building2 className="w-4 h-4" />
            Architectural Recommendations
          </CardTitle>
          <CardDescription>Long-term security architecture improvements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {advisory.architectural_recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{rec}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Print/Export Notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        This security advisory was generated by the AI Risk Prediction Engine using Random Forest / Gradient Boosting 
        analysis. Always validate findings with a qualified security engineer before production deployment.
      </div>

      {/* Download PDF Button */}
      <div ref={contentRef} className="pt-8 border-t border-border">
        <Button 
          onClick={handleDownload}
          disabled={isGenerating}
          size="lg" 
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Download className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF Report...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-3" />
              Download Analysis Report (PDF)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
