"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Bug, Code2, ChevronRight } from "lucide-react";
import { getRiskBadgeClass, type FullAnalysisResult } from "@/lib/risk-engine";

interface Props {
  result: FullAnalysisResult;
}

const CVSS_LABEL = (score: number) => {
  if (score >= 9) return "CRITICAL";
  if (score >= 7) return "HIGH";
  if (score >= 4) return "MEDIUM";
  return "LOW";
};

export default function RiskAnalysis({ result }: Props) {
  const { analysis, features } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">3</div>
          <span className="font-semibold text-foreground">Risk Analysis Engine</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">CVE/CWE mapping & impact quantification</span>
      </div>

      {/* Feature Metrics Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            Extracted Feature Metrics
          </CardTitle>
          <CardDescription>Raw values passed to the ML prediction model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Cyclomatic Complexity", value: features.cyclomatic_complexity.toFixed(1), unit: "" },
              { label: "Lines of Code", value: features.lines_of_code.toLocaleString(), unit: "LOC" },
              { label: "Dependencies", value: features.dependency_count, unit: "pkgs" },
              { label: "Known CVEs", value: features.known_cve_count, unit: "found" },
              { label: "Known CWEs", value: features.known_cwe_count, unit: "found" },
              { label: "Defect Rate", value: `${(features.historical_defect_rate * 100).toFixed(1)}%`, unit: "" },
              { label: "Duplication", value: `${(features.code_duplication_ratio * 100).toFixed(1)}%`, unit: "" },
              { label: "Test Coverage", value: `${(features.test_coverage * 100).toFixed(1)}%`, unit: "" },
              { label: "API Security", value: features.api_security_score.toFixed(1), unit: "/100" },
              { label: "Outdated Deps", value: `${(features.outdated_dependency_ratio * 100).toFixed(1)}%`, unit: "" },
            ].map((m, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  {m.value}
                  {m.unit && <span className="text-xs font-normal text-muted-foreground ml-1">{m.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CVE Findings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="w-4 h-4 text-destructive" />
            CVE Findings
            <Badge variant="destructive" className="ml-auto text-xs">{analysis.cve_findings.length} detected</Badge>
          </CardTitle>
          <CardDescription>Common Vulnerabilities and Exposures matched against dependency stack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.cve_findings.map((cve, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold text-primary">{cve.id}</span>
                  <Badge className={`text-xs border ${getRiskBadgeClass(cve.severity)}`}>
                    {cve.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{cve.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">CVSS Score</p>
                  <p
                    className="text-xl font-bold"
                    style={{
                      color:
                        cve.cvss >= 9 ? "#dc2626" : cve.cvss >= 7 ? "#ea580c" : "#d97706",
                    }}
                  >
                    {cve.cvss.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CWE Findings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            CWE Findings
            <Badge variant="outline" className="ml-auto text-xs border-orange-200 text-orange-700 bg-orange-50">
              {analysis.cwe_findings.length} patterns
            </Badge>
          </CardTitle>
          <CardDescription>Common Weakness Enumeration patterns identified in codebase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {analysis.cwe_findings.map((cwe, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full mt-2 shrink-0"
                  style={{
                    backgroundColor:
                      cwe.impact === "CRITICAL"
                        ? "#dc2626"
                        : cwe.impact === "HIGH"
                        ? "#ea580c"
                        : cwe.impact === "MEDIUM"
                        ? "#d97706"
                        : "#2563eb",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-primary">{cwe.id}</span>
                    <Badge className={`text-xs border ${getRiskBadgeClass(cwe.impact)}`}>
                      {cwe.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{cwe.name}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Impact Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-primary">Risk Impact Quantification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{analysis.critical_count}</p>
              <p className="text-xs text-muted-foreground mt-1">Critical CVEs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{analysis.high_count}</p>
              <p className="text-xs text-muted-foreground mt-1">High CVEs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">
                {analysis.cwe_findings.filter(c => c.impact === "CRITICAL" || c.impact === "HIGH").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">High-Impact CWEs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{analysis.total_vulnerabilities}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Findings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
