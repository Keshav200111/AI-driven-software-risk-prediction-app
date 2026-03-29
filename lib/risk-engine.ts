// ─── Types ─────────────────────────────────────────────────────────────────
export interface RiskFeatures {
  cyclomatic_complexity: number;
  lines_of_code: number;
  dependency_count: number;
  known_cve_count: number;
  known_cwe_count: number;
  historical_defect_rate: number;
  code_duplication_ratio: number;
  test_coverage: number;
  api_security_score: number;
  outdated_dependency_ratio: number;
}

export interface CVEFinding {
  id: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  cvss: number;
}

export interface CWEFinding {
  id: string;
  name: string;
  impact: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface RiskFactor {
  factor: string;
  value: number;
  impact: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface HeatmapData {
  component: string;
  risk_score: number;
  vulnerability_count: number;
}

export interface TrendData {
  month: string;
  risk_score: number;
  vulnerabilities: number;
}

export interface ActionItem {
  priority: number;
  category: string;
  action: string;
  effort: "HIGH" | "MEDIUM" | "LOW";
  timeline: string;
  type: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface RiskAnalysis {
  project_name: string;
  risk_score: number;
  risk_level: string;
  cve_findings: CVEFinding[];
  cwe_findings: CWEFinding[];
  risk_factors: RiskFactor[];
  heatmap_data: HeatmapData[];
  trend_data: TrendData[];
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
}

export interface SecurityAdvisory {
  project_name: string;
  risk_level: string;
  risk_score: number;
  summary: string;
  mitigations: string[];
  action_items: ActionItem[];
  architectural_recommendations: string[];
}

export interface FullAnalysisResult {
  project_name: string;
  filename?: string;
  features: RiskFeatures;
  risk_score: number;
  risk_level: string;
  risk_probability: number;
  analysis: RiskAnalysis;
  advisory: SecurityAdvisory;
}

// ─── Color Helpers ────────────────────────────────────────────────────────────
export function getRiskColor(level: string): string {
  switch (level) {
    case "CRITICAL": return "#dc2626";
    case "HIGH":     return "#ea580c";
    case "MEDIUM":   return "#d97706";
    case "LOW":      return "#2563eb";
    case "MINIMAL":  return "#16a34a";
    default:         return "#6b7280";
  }
}

export function getRiskBadgeClass(level: string): string {
  switch (level) {
    case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
    case "HIGH":     return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM":   return "bg-amber-100 text-amber-700 border-amber-200";
    case "LOW":      return "bg-blue-100 text-blue-700 border-blue-200";
    case "MINIMAL":  return "bg-green-100 text-green-700 border-green-200";
    default:         return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

// ─── Mock Data Engine ─────────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function computeRiskScore(features: RiskFeatures): number {
  const normalized = {
    cyclomatic_complexity: Math.min(features.cyclomatic_complexity / 50, 1),
    known_cve_count: Math.min(features.known_cve_count / 20, 1),
    known_cwe_count: Math.min(features.known_cwe_count / 15, 1),
    historical_defect_rate: Math.min(features.historical_defect_rate, 1),
    outdated_dependency_ratio: Math.min(features.outdated_dependency_ratio, 1),
    code_duplication_ratio: Math.min(features.code_duplication_ratio, 1),
    test_coverage: Math.min(features.test_coverage, 1),
    api_security_score: Math.min(features.api_security_score / 100, 1),
    dependency_count: Math.min(features.dependency_count / 200, 1),
    lines_of_code: Math.min(features.lines_of_code / 100000, 1),
  };

  const score =
    normalized.cyclomatic_complexity * 0.20 +
    normalized.known_cve_count * 0.25 +
    normalized.known_cwe_count * 0.15 +
    normalized.historical_defect_rate * 0.15 +
    normalized.outdated_dependency_ratio * 0.10 +
    normalized.code_duplication_ratio * 0.05 +
    (1 - normalized.test_coverage) * 0.10 +
    (1 - normalized.api_security_score) * 0.10 +
    normalized.dependency_count * 0.05 +
    normalized.lines_of_code * 0.05;

  return Math.round(Math.min(100, Math.max(0, score * 100) + (seededRandom(score * 1000) - 0.5) * 5) * 10) / 10;
}

function getRiskLevel(score: number): string {
  if (score >= 75) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MEDIUM";
  if (score >= 15) return "LOW";
  return "MINIMAL";
}

const CVE_DATABASE: CVEFinding[] = [
  { id: "CVE-2023-44487", description: "HTTP/2 Rapid Reset Attack", severity: "HIGH", cvss: 7.5 },
  { id: "CVE-2024-21626", description: "runc container escape vulnerability", severity: "CRITICAL", cvss: 8.6 },
  { id: "CVE-2023-46604", description: "Apache ActiveMQ Remote Code Execution", severity: "CRITICAL", cvss: 9.8 },
  { id: "CVE-2024-6387", description: "OpenSSH RegreSSHion RCE via signal handler race", severity: "HIGH", cvss: 8.1 },
  { id: "CVE-2023-45853", description: "zlib integer overflow leading to heap corruption", severity: "CRITICAL", cvss: 9.8 },
  { id: "CVE-2024-3094", description: "XZ Utils backdoor enabling unauthorized SSH access", severity: "CRITICAL", cvss: 10.0 },
  { id: "CVE-2023-42793", description: "JetBrains TeamCity authentication bypass", severity: "CRITICAL", cvss: 9.8 },
  { id: "CVE-2024-1597", description: "pgjdbc SQL injection via JDBC URL", severity: "CRITICAL", cvss: 10.0 },
];

const CWE_DATABASE: CWEFinding[] = [
  { id: "CWE-79", name: "Cross-site Scripting (XSS)", impact: "HIGH" },
  { id: "CWE-89", name: "SQL Injection", impact: "CRITICAL" },
  { id: "CWE-22", name: "Path Traversal", impact: "HIGH" },
  { id: "CWE-434", name: "Unrestricted File Upload", impact: "CRITICAL" },
  { id: "CWE-502", name: "Deserialization of Untrusted Data", impact: "HIGH" },
  { id: "CWE-611", name: "XXE Injection via XML Parsing", impact: "HIGH" },
  { id: "CWE-918", name: "Server-Side Request Forgery (SSRF)", impact: "HIGH" },
  { id: "CWE-798", name: "Use of Hard-coded Credentials", impact: "CRITICAL" },
  { id: "CWE-352", name: "Cross-Site Request Forgery (CSRF)", impact: "MEDIUM" },
  { id: "CWE-306", name: "Missing Authentication for Critical Function", impact: "CRITICAL" },
];

export function runFullAnalysis(
  features: RiskFeatures,
  projectName: string,
  filename?: string
): FullAnalysisResult {
  const risk_score = computeRiskScore(features);
  const risk_level = getRiskLevel(risk_score);

  // CVE/CWE selections
  const numCves = Math.min(features.known_cve_count, CVE_DATABASE.length);
  const selectedCves = CVE_DATABASE.slice(0, Math.max(1, numCves));
  const numCwes = Math.min(features.known_cwe_count, CWE_DATABASE.length);
  const selectedCwes = CWE_DATABASE.slice(0, Math.max(1, numCwes));

  // Risk factors
  const risk_factors: RiskFactor[] = [
    {
      factor: "Code Complexity",
      value: features.cyclomatic_complexity,
      impact: Math.round(Math.min(features.cyclomatic_complexity / 50, 1) * 25 * 10) / 10,
      severity: features.cyclomatic_complexity > 25 ? "HIGH" : "MEDIUM",
    },
    {
      factor: "Known Vulnerabilities",
      value: features.known_cve_count,
      impact: Math.round(Math.min(features.known_cve_count / 20, 1) * 35 * 10) / 10,
      severity: features.known_cve_count > 10 ? "CRITICAL" : "HIGH",
    },
    {
      factor: "Dependency Risk",
      value: Math.round(features.outdated_dependency_ratio * 100 * 10) / 10,
      impact: Math.round(features.outdated_dependency_ratio * 15 * 10) / 10,
      severity: features.outdated_dependency_ratio > 0.3 ? "HIGH" : "MEDIUM",
    },
    {
      factor: "Historical Defects",
      value: Math.round(features.historical_defect_rate * 100 * 10) / 10,
      impact: Math.round(features.historical_defect_rate * 20 * 10) / 10,
      severity: features.historical_defect_rate > 0.3 ? "HIGH" : "LOW",
    },
    {
      factor: "Test Coverage Gap",
      value: Math.round((1 - features.test_coverage) * 100 * 10) / 10,
      impact: Math.round((1 - features.test_coverage) * 10 * 10) / 10,
      severity: features.test_coverage < 0.7 ? "MEDIUM" : "LOW",
    },
  ];

  // Heatmap
  const components = ["Auth Service", "API Gateway", "Data Layer", "UI Layer", "Messaging", "File Storage", "Cache Layer", "Logging"];
  const heatmap_data: HeatmapData[] = components.map((component, i) => ({
    component,
    risk_score: Math.round(Math.min(100, Math.max(5, risk_score + (seededRandom(i * 17 + risk_score) - 0.5) * 50)) * 10) / 10,
    vulnerability_count: Math.floor(seededRandom(i * 31 + risk_score) * 9),
  }));

  // Trend data
  const trend_data: TrendData[] = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map((month, i) => ({
    month,
    risk_score: Math.round(Math.min(100, Math.max(0, risk_score + (seededRandom(i * 13 + risk_score) - 0.5) * 30 + (5 - i) * -1.5)) * 10) / 10,
    vulnerabilities: Math.floor(seededRandom(i * 7 + risk_score) * 18) + 3,
  }));

  // Advisory
  const MITIGATION_TEMPLATES: Record<string, string[]> = {
    CRITICAL: [
      "Immediately patch all identified CVEs using vendor-supplied security updates.",
      "Implement emergency change freeze and conduct full security audit.",
      "Activate incident response plan and notify security stakeholders.",
      "Isolate affected components from production environment pending remediation.",
      "Enable WAF rules to block known exploit patterns immediately.",
    ],
    HIGH: [
      "Schedule patching cycle within 7 days for identified vulnerabilities.",
      "Refactor high-complexity modules to reduce attack surface.",
      "Conduct penetration testing focused on identified CWE patterns.",
      "Implement additional monitoring and alerting for suspicious activity.",
      "Review and tighten access control policies across affected services.",
    ],
    MEDIUM: [
      "Update outdated dependencies in the next scheduled release cycle.",
      "Increase test coverage to above 80% for critical modules.",
      "Perform static code analysis and address top-priority findings.",
      "Implement code review checklist targeting identified CWE categories.",
      "Document and track technical debt related to identified risk factors.",
    ],
    LOW: [
      "Monitor for new CVE disclosures related to current dependency versions.",
      "Add automated SAST/DAST scans to the CI/CD pipeline.",
      "Conduct quarterly security training for development teams.",
      "Review and update software composition analysis (SCA) tooling.",
    ],
    MINIMAL: [
      "Maintain current security posture with regular dependency updates.",
      "Continue automated security scanning in CI/CD.",
      "Schedule annual penetration testing.",
    ],
  };

  const mitigations = MITIGATION_TEMPLATES[risk_level] || MITIGATION_TEMPLATES["LOW"];

  const action_items: ActionItem[] = [];
  let priority = 1;

  if (features.known_cve_count > 5) {
    action_items.push({ priority: priority++, category: "Vulnerability Patching", action: `Patch ${features.known_cve_count} identified CVEs immediately`, effort: "HIGH", timeline: "24-48 hours", type: "CRITICAL" });
  }
  if (features.outdated_dependency_ratio > 0.3) {
    action_items.push({ priority: priority++, category: "Dependency Management", action: `Update ${Math.round(features.outdated_dependency_ratio * 100)}% of outdated dependencies`, effort: "MEDIUM", timeline: "1 week", type: "HIGH" });
  }
  if (features.test_coverage < 0.6) {
    action_items.push({ priority: priority++, category: "Quality Assurance", action: `Increase test coverage from ${Math.round(features.test_coverage * 100)}% to 80%+`, effort: "HIGH", timeline: "2-3 weeks", type: "MEDIUM" });
  }
  if (features.cyclomatic_complexity > 20) {
    action_items.push({ priority: priority++, category: "Code Quality", action: `Refactor modules with cyclomatic complexity > 20 (current: ${Math.round(features.cyclomatic_complexity)})`, effort: "HIGH", timeline: "1 month", type: "MEDIUM" });
  }
  if (features.api_security_score < 70) {
    action_items.push({ priority: priority++, category: "API Security", action: `Improve API security score from ${Math.round(features.api_security_score)} to 85+`, effort: "MEDIUM", timeline: "2 weeks", type: "HIGH" });
  }
  action_items.push({ priority: priority++, category: "Continuous Monitoring", action: "Integrate SAST/DAST scanning into CI/CD pipeline", effort: "LOW", timeline: "Ongoing", type: "LOW" });

  return {
    project_name: projectName,
    filename,
    features,
    risk_score,
    risk_level,
    risk_probability: Math.round(risk_score / 100 * 10000) / 10000,
    analysis: {
      project_name: projectName,
      risk_score,
      risk_level,
      cve_findings: selectedCves,
      cwe_findings: selectedCwes,
      risk_factors,
      heatmap_data,
      trend_data,
      total_vulnerabilities: selectedCves.length + selectedCwes.length,
      critical_count: selectedCves.filter(c => c.severity === "CRITICAL").length,
      high_count: selectedCves.filter(c => c.severity === "HIGH").length,
    },
    advisory: {
      project_name: projectName,
      risk_level,
      risk_score,
      summary: `The project has been assessed at ${risk_level} risk with a score of ${risk_score.toFixed(1)}/100. Immediate attention is required for ${features.known_cve_count} known CVEs and ${Math.round(features.outdated_dependency_ratio * 100)}% outdated dependencies.`,
      mitigations,
      action_items,
      architectural_recommendations: [
        "Adopt a Zero Trust security architecture across all service boundaries.",
        "Implement secrets management using HashiCorp Vault or AWS Secrets Manager.",
        "Enable mutual TLS (mTLS) for all inter-service communication.",
        "Deploy a Web Application Firewall (WAF) in front of public-facing APIs.",
        "Implement runtime application self-protection (RASP) for critical services.",
      ],
    },
  };
}

export function extractFeaturesFromFile(content: string, filename: string): RiskFeatures {
  const lines = content.split("\n");
  const loc = lines.length;

  const complexityKeywords = ["if", "elif", "else", "for", "while", "try", "except", "switch", "case", "catch"];
  const complexity = complexityKeywords.reduce((acc, kw) => acc + (content.split(kw).length - 1), 1);

  let depCount = 0;
  if (filename.includes("requirements") || filename.endsWith(".txt")) {
    depCount = lines.filter(l => l.trim() && !l.startsWith("#")).length;
  } else if (filename.includes("package.json")) {
    depCount = (content.match(/"version"/g) || []).length;
  } else {
    depCount = Math.max(5, Math.floor(loc / 50));
  }

  const cvePatterns = ["http/2", "openssl", "log4j", "spring", "apache", "nginx", "nodejs", "python", "java", "react", "express"];
  const cveCount = cvePatterns.filter(p => content.toLowerCase().includes(p)).length + Math.floor(seededRandom(loc) * 5);
  const cweCount = Math.floor(Math.min(8, cveCount * 0.8 + seededRandom(complexity) * 3));

  return {
    cyclomatic_complexity: Math.min(complexity, 50),
    lines_of_code: loc,
    dependency_count: depCount,
    known_cve_count: Math.max(1, cveCount),
    known_cwe_count: Math.max(1, cweCount),
    historical_defect_rate: Math.round((0.1 + seededRandom(loc * 0.7) * 0.4) * 100) / 100,
    code_duplication_ratio: Math.round((0.02 + seededRandom(complexity * 1.3) * 0.33) * 100) / 100,
    test_coverage: Math.round((0.2 + seededRandom(loc * 0.3) * 0.7) * 100) / 100,
    api_security_score: Math.round((30 + seededRandom(depCount * 1.7) * 65) * 10) / 10,
    outdated_dependency_ratio: Math.round((0.05 + seededRandom(depCount * 0.9) * 0.55) * 100) / 100,
  };
}

export const DEMO_RESULT: FullAnalysisResult = runFullAnalysis(
  {
    cyclomatic_complexity: 28.5,
    lines_of_code: 15420,
    dependency_count: 87,
    known_cve_count: 9,
    known_cwe_count: 6,
    historical_defect_rate: 0.32,
    code_duplication_ratio: 0.18,
    test_coverage: 0.54,
    api_security_score: 61.0,
    outdated_dependency_ratio: 0.38,
  },
  "Demo Application v2.1"
);
