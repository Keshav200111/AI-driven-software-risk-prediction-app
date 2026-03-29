"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Bug, Activity } from "lucide-react";
import { getRiskColor, getRiskBadgeClass, type FullAnalysisResult } from "@/lib/risk-engine";
import RiskGauge from "@/components/risk-gauge";

interface Props {
  result: FullAnalysisResult;
}

const SEVERITY_COLORS = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#d97706",
  LOW: "#2563eb",
  MINIMAL: "#16a34a",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: color }} />
    </Card>
  );
}

export default function RiskDashboard({ result }: Props) {
  const { analysis, features, risk_score, risk_level, advisory } = result;

  const trendDelta =
    analysis.trend_data.length >= 2
      ? analysis.trend_data[analysis.trend_data.length - 1].risk_score -
        analysis.trend_data[analysis.trend_data.length - 2].risk_score
      : 0;

  const radarData = [
    { subject: "Complexity", value: Math.min(100, features.cyclomatic_complexity * 2), fullMark: 100 },
    { subject: "Vulnerabilities", value: Math.min(100, features.known_cve_count * 5), fullMark: 100 },
    { subject: "Dependencies", value: Math.min(100, features.outdated_dependency_ratio * 100), fullMark: 100 },
    { subject: "Defect Rate", value: Math.min(100, features.historical_defect_rate * 100), fullMark: 100 },
    { subject: "API Security", value: Math.min(100, 100 - features.api_security_score), fullMark: 100 },
    { subject: "Test Gap", value: Math.min(100, (1 - features.test_coverage) * 100), fullMark: 100 },
  ];

  const heatmapSorted = [...analysis.heatmap_data].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{result.project_name}</h2>
          <p className="text-sm text-muted-foreground">
            {result.filename ? `Files: ${result.filename}` : "AI Risk Assessment Report"}
          </p>
        </div>
        <Badge className={`${getRiskBadgeClass(risk_level)} border text-sm font-semibold px-3 py-1`}>
          {risk_level} RISK — {risk_score.toFixed(1)}/100
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Shield}
          label="Risk Score"
          value={`${risk_score.toFixed(1)}`}
          sub="out of 100"
          color={getRiskColor(risk_level)}
        />
        <StatCard
          icon={Bug}
          label="Total CVEs"
          value={analysis.critical_count + analysis.high_count}
          sub={`${analysis.critical_count} critical`}
          color="#dc2626"
        />
        <StatCard
          icon={AlertTriangle}
          label="Vulnerabilities"
          value={analysis.total_vulnerabilities}
          sub="CVE + CWE findings"
          color="#ea580c"
        />
        <StatCard
          icon={Activity}
          label="Test Coverage"
          value={`${Math.round(features.test_coverage * 100)}%`}
          sub="code coverage"
          color={features.test_coverage < 0.6 ? "#ea580c" : "#16a34a"}
        />
      </div>

      {/* Gauge + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall Risk Score</CardTitle>
            <CardDescription>ML model prediction (0-100)</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <RiskGauge score={risk_score} level={risk_level} size={220} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk Factor Radar</CardTitle>
            <CardDescription>Multi-dimensional risk breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Radar
                  name="Risk Level"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Radar
                  name="Threshold"
                  dataKey="fullMark"
                  stroke="transparent"
                  fill="transparent"
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Trend */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Risk Trend (6 Months)</CardTitle>
              <CardDescription>Historical risk score trajectory</CardDescription>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${trendDelta > 0 ? "text-red-500" : "text-green-600"}`}>
              {trendDelta > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(trendDelta).toFixed(1)} pts
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analysis.trend_data}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="vulnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="risk_score"
                name="Risk Score"
                stroke="#2563eb"
                fill="url(#riskGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="vulnerabilities"
                name="Vulnerabilities"
                stroke="#ea580c"
                fill="url(#vulnGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Component Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Component Risk Heatmap</CardTitle>
          <CardDescription>Risk score by software component</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={heatmapSorted} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis type="category" dataKey="component" tick={{ fontSize: 11, fill: "#6b7280" }} width={90} />
              <Tooltip
                contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                formatter={(val: number) => [`${val.toFixed(1)}`, "Risk Score"]}
              />
              <Bar dataKey="risk_score" radius={[0, 4, 4, 0]}>
                {heatmapSorted.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.risk_score >= 75
                        ? "#dc2626"
                        : entry.risk_score >= 55
                        ? "#ea580c"
                        : entry.risk_score >= 35
                        ? "#d97706"
                        : "#2563eb"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Risk Factors Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Risk Factor Breakdown</CardTitle>
          <CardDescription>Contribution of each factor to overall score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.risk_factors.map((factor, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{factor.factor}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRiskBadgeClass(factor.severity)}`}
                  >
                    {factor.severity}
                  </Badge>
                </div>
                <span className="text-muted-foreground font-mono text-xs">
                  {factor.value.toFixed(1)} — impact: {factor.impact.toFixed(1)}pts
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (factor.impact / 35) * 100)}%`,
                    backgroundColor: SEVERITY_COLORS[factor.severity] || "#6b7280",
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
