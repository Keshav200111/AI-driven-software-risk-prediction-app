from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import random
import math
import re
from fastapi.responses import StreamingResponse
from jinja2 import Environment, FileSystemLoader, select_autoescape
# from weasyprint import HTML  # disabled - GTK runtime missing on Windows (libgobject)
from pydantic import BaseModel
import io

app = FastAPI(title="AI Risk Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class RiskFeatures(BaseModel):
    cyclomatic_complexity: float
    lines_of_code: int
    dependency_count: int
    known_cve_count: int
    known_cwe_count: int
    historical_defect_rate: float
    code_duplication_ratio: float
    test_coverage: float
    api_security_score: float
    outdated_dependency_ratio: float

class PredictionRequest(BaseModel):
    features: RiskFeatures
    project_name: Optional[str] = "Unknown Project"

class PredictionResponse(BaseModel):
    risk_score: float
    risk_level: str
    risk_probability: float
    features: RiskFeatures
    project_name: str

class AnalysisRequest(BaseModel):
    risk_score: float
    features: RiskFeatures
    project_name: Optional[str] = "Unknown Project"

class FullAnalysisResult(BaseModel):
    project_name: str
    filename: Optional[str] = None
    features: RiskFeatures
    risk_score: float
    risk_level: str
    risk_probability: float
    analysis: dict
    advisory: dict


# ─── Mock ML Model (Random Forest Simulation) ─────────────────────────────────

def compute_risk_score(features: RiskFeatures) -> float:
    """
    Simulates a trained Random Forest / Gradient Boosting model.
    Weights derived from feature importance analysis.
    """
    weights = {
        "cyclomatic_complexity": 0.20,
        "known_cve_count": 0.25,
        "known_cwe_count": 0.15,
        "historical_defect_rate": 0.15,
        "outdated_dependency_ratio": 0.10,
        "code_duplication_ratio": 0.05,
        "test_coverage": -0.10,  # higher coverage = lower risk
        "api_security_score": -0.10,  # higher score = lower risk
        "dependency_count": 0.05,
        "lines_of_code": 0.05,
    }

    # Normalize each feature to 0-1 range
    normalized = {
        "cyclomatic_complexity": min(features.cyclomatic_complexity / 50, 1.0),
        "known_cve_count": min(features.known_cve_count / 20, 1.0),
        "known_cwe_count": min(features.known_cwe_count / 15, 1.0),
        "historical_defect_rate": min(features.historical_defect_rate, 1.0),
        "outdated_dependency_ratio": min(features.outdated_dependency_ratio, 1.0),
        "code_duplication_ratio": min(features.code_duplication_ratio, 1.0),
        "test_coverage": min(features.test_coverage, 1.0),
        "api_security_score": min(features.api_security_score / 100, 1.0),
        "dependency_count": min(features.dependency_count / 200, 1.0),
        "lines_of_code": min(features.lines_of_code / 100000, 1.0),
    }

    score = sum(normalized[k] * v for k, v in weights.items())

    # Add small noise to simulate model variance
    noise = (random.random() - 0.5) * 0.05
    score = max(0.0, min(1.0, score + noise))

    return round(score * 100, 2)


def get_risk_level(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    elif score >= 55:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    elif score >= 15:
        return "LOW"
    return "MINIMAL"


# ─── CVE / CWE Database (mock) ────────────────────────────────────────────────

CVE_DATABASE = [
    {"id": "CVE-2023-44487", "description": "HTTP/2 Rapid Reset Attack", "severity": "HIGH", "cvss": 7.5},
    {"id": "CVE-2024-21626", "description": "runc container escape vulnerability", "severity": "CRITICAL", "cvss": 8.6},
    {"id": "CVE-2023-46604", "description": "Apache ActiveMQ RCE", "severity": "CRITICAL", "cvss": 9.8},
    {"id": "CVE-2024-6387", "description": "OpenSSH RegreSSHion RCE", "severity": "HIGH", "cvss": 8.1},
    {"id": "CVE-2023-45853", "description": "zlib integer overflow", "severity": "CRITICAL", "cvss": 9.8},
    {"id": "CVE-2024-3094", "description": "XZ Utils backdoor", "severity": "CRITICAL", "cvss": 10.0},
    {"id": "CVE-2023-42793", "description": "JetBrains TeamCity authentication bypass", "severity": "CRITICAL", "cvss": 9.8},
    {"id": "CVE-2024-1597", "description": "pgjdbc SQL injection", "severity": "CRITICAL", "cvss": 10.0},
]

CWE_DATABASE = [
    {"id": "CWE-79", "name": "Cross-site Scripting", "impact": "HIGH"},
    {"id": "CWE-89", "name": "SQL Injection", "impact": "CRITICAL"},
    {"id": "CWE-22", "name": "Path Traversal", "impact": "HIGH"},
    {"id": "CWE-434", "name": "Unrestricted File Upload", "impact": "CRITICAL"},
    {"id": "CWE-502", "name": "Deserialization of Untrusted Data", "impact": "HIGH"},
    {"id": "CWE-611", "name": "XXE Injection", "impact": "HIGH"},
    {"id": "CWE-918", "name": "SSRF", "impact": "HIGH"},
    {"id": "CWE-798", "name": "Hard-coded Credentials", "impact": "CRITICAL"},
    {"id": "CWE-352", "name": "Cross-Site Request Forgery", "impact": "MEDIUM"},
    {"id": "CWE-306", "name": "Missing Authentication", "impact": "CRITICAL"},
]

MITIGATION_TEMPLATES = {
    "CRITICAL": [
        "Immediately patch all identified CVEs using vendor-supplied security updates.",
        "Implement emergency change freeze and conduct full security audit.",
        "Activate incident response plan and notify security stakeholders.",
        "Isolate affected components from production environment pending remediation.",
        "Enable WAF rules to block known exploit patterns immediately.",
    ],
    "HIGH": [
        "Schedule patching cycle within 7 days for identified vulnerabilities.",
        "Refactor high-complexity modules to reduce attack surface.",
        "Conduct penetration testing focused on identified CWE patterns.",
        "Implement additional monitoring and alerting for suspicious activity.",
        "Review and tighten access control policies across affected services.",
    ],
    "MEDIUM": [
        "Update outdated dependencies in the next scheduled release cycle.",
        "Increase test coverage to above 80% for critical modules.",
        "Perform static code analysis and address top-priority findings.",
        "Implement code review checklist targeting identified CWE categories.",
        "Document and track technical debt related to identified risk factors.",
    ],
    "LOW": [
        "Monitor for new CVE disclosures related to current dependency versions.",
        "Add automated SAST/DAST scans to the CI/CD pipeline.",
        "Conduct quarterly security training for development teams.",
        "Review and update software composition analysis (SCA) tooling.",
    ],
    "MINIMAL": [
        "Maintain current security posture with regular dependency updates.",
        "Continue automated security scanning in CI/CD.",
        "Schedule annual penetration testing.",
    ],
}


# ─── Feature Extraction from uploaded file ────────────────────────────────────

def extract_features_from_content(content: str, filename: str) -> RiskFeatures:
    """Simulates feature extraction from code/metadata/dependency files."""
    lines = content.split("\n")
    loc = len(lines)
    
    # Heuristic complexity from content analysis
    complexity_keywords = ["if", "elif", "else", "for", "while", "try", "except", "switch", "case"]
    complexity = sum(content.count(kw) for kw in complexity_keywords) + 1
    
    # Dependency count from common file formats
    dep_count = 0
    if "requirements" in filename or filename.endswith(".txt"):
        dep_count = len([l for l in lines if l.strip() and not l.startswith("#")])
    elif "package.json" in filename:
        dep_count = content.count('"version"')
    elif "pom.xml" in filename:
        dep_count = content.count("<dependency>")
    else:
        dep_count = max(5, loc // 50)

    # Simulate discovered CVEs/CWEs based on content patterns
    cve_patterns = ["http/2", "openssl", "log4j", "spring", "apache", "nginx", "nodejs", "python", "java"]
    cve_count = sum(1 for p in cve_patterns if p.lower() in content.lower()) + random.randint(0, 3)
    cwe_count = random.randint(1, min(8, cve_count + 2))

    # Other metrics (simulated)
    defect_rate = round(random.uniform(0.05, 0.45), 2)
    duplication = round(random.uniform(0.02, 0.35), 2)
    test_coverage = round(random.uniform(0.20, 0.90), 2)
    api_security = round(random.uniform(30, 95), 1)
    outdated_ratio = round(random.uniform(0.05, 0.60), 2)

    return RiskFeatures(
        cyclomatic_complexity=float(min(complexity, 50)),
        lines_of_code=loc,
        dependency_count=dep_count,
        known_cve_count=cve_count,
        known_cwe_count=cwe_count,
        historical_defect_rate=defect_rate,
        code_duplication_ratio=duplication,
        test_coverage=test_coverage,
        api_security_score=api_security,
        outdated_dependency_ratio=outdated_ratio,
    )


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "AI Risk Prediction API is running", "version": "1.0.0"}


@app.post("/api/upload-analyze")
async def upload_and_analyze(
    file: UploadFile = File(...),
    project_name: Optional[str] = "Unnamed Project",
):
    """Upload a file and extract risk features + predict risk score."""
    try:
        content = await file.read()
        text_content = content.decode("utf-8", errors="ignore")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read uploaded file.")

    features = extract_features_from_content(text_content, file.filename or "unknown")
    risk_score = compute_risk_score(features)
    risk_level = get_risk_level(risk_score)

    return {
        "project_name": project_name,
        "filename": file.filename,
        "features": features.model_dump(),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_probability": round(risk_score / 100, 4),
    }


@app.post("/api/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    """Predict risk score from manually supplied features."""
    risk_score = compute_risk_score(request.features)
    risk_level = get_risk_level(risk_score)
    return PredictionResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        risk_probability=round(risk_score / 100, 4),
        features=request.features,
        project_name=request.project_name or "Unknown Project",
    )


@app.post("/api/analyze")
async def analyze_risks(request: AnalysisRequest):
    """Analyze identified risks and map to CVE/CWE database."""
    risk_level = get_risk_level(request.risk_score)

    # Select CVEs proportional to risk score
    num_cves = min(request.features.known_cve_count, len(CVE_DATABASE))
    selected_cves = random.sample(CVE_DATABASE, k=max(1, num_cves))

    # Select CWEs proportional to count
    num_cwes = min(request.features.known_cwe_count, len(CWE_DATABASE))
    selected_cwes = random.sample(CWE_DATABASE, k=max(1, num_cwes))

    # Risk factor breakdown
    factors = [
        {
            "factor": "Code Complexity",
            "value": request.features.cyclomatic_complexity,
            "impact": round(request.features.cyclomatic_complexity / 50 * 25, 1),
            "severity": "HIGH" if request.features.cyclomatic_complexity > 25 else "MEDIUM",
        },
        {
            "factor": "Known Vulnerabilities",
            "value": request.features.known_cve_count,
            "impact": round(min(request.features.known_cve_count / 20, 1.0) * 35, 1),
            "severity": "CRITICAL" if request.features.known_cve_count > 10 else "HIGH",
        },
        {
            "factor": "Dependency Risk",
            "value": round(request.features.outdated_dependency_ratio * 100, 1),
            "impact": round(request.features.outdated_dependency_ratio * 15, 1),
            "severity": "HIGH" if request.features.outdated_dependency_ratio > 0.3 else "MEDIUM",
        },
        {
            "factor": "Historical Defects",
            "value": round(request.features.historical_defect_rate * 100, 1),
            "impact": round(request.features.historical_defect_rate * 20, 1),
            "severity": "HIGH" if request.features.historical_defect_rate > 0.3 else "LOW",
        },
        {
            "factor": "Test Coverage Gap",
            "value": round((1 - request.features.test_coverage) * 100, 1),
            "impact": round((1 - request.features.test_coverage) * 10, 1),
            "severity": "MEDIUM" if request.features.test_coverage < 0.7 else "LOW",
        },
    ]

    # Heatmap data (component risk matrix)
    components = ["Auth Service", "API Gateway", "Data Layer", "UI Layer", "Messaging", "File Storage", "Cache Layer", "Logging"]
    heatmap_data = []
    for comp in components:
        base_risk = request.risk_score + random.uniform(-25, 25)
        heatmap_data.append({
            "component": comp,
            "risk_score": round(max(5, min(100, base_risk)), 1),
            "vulnerability_count": random.randint(0, 8),
        })

    # Trend data (last 6 months)
    trend_data = []
    for i in range(6):
        month_offset = 5 - i
        trend_score = request.risk_score + random.uniform(-15, 15) + (month_offset * -1.5)
        trend_data.append({
            "month": ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"][i],
            "risk_score": round(max(0, min(100, trend_score)), 1),
            "vulnerabilities": random.randint(3, 20),
        })

    return {
        "project_name": request.project_name,
        "risk_score": request.risk_score,
        "risk_level": risk_level,
        "cve_findings": selected_cves,
        "cwe_findings": selected_cwes,
        "risk_factors": factors,
        "heatmap_data": heatmap_data,
        "trend_data": trend_data,
        "total_vulnerabilities": len(selected_cves) + len(selected_cwes),
        "critical_count": sum(1 for c in selected_cves if c["severity"] == "CRITICAL"),
        "high_count": sum(1 for c in selected_cves if c["severity"] == "HIGH"),
    }


@app.post("/api/advisory")
async def generate_advisory(request: AnalysisRequest):
    """Generate security advisory and actionable mitigation steps."""
    risk_level = get_risk_level(request.risk_score)
    mitigations = MITIGATION_TEMPLATES.get(risk_level, MITIGATION_TEMPLATES["LOW"])

    # Prioritized action items
    action_items = []
    priority_counter = 1

    if request.features.known_cve_count > 5:
        action_items.append({
            "priority": priority_counter,
            "category": "Vulnerability Patching",
            "action": f"Patch {request.features.known_cve_count} identified CVEs immediately",
            "effort": "HIGH",
            "timeline": "24-48 hours",
            "type": "CRITICAL",
        })
        priority_counter += 1

    if request.features.outdated_dependency_ratio > 0.3:
        action_items.append({
            "priority": priority_counter,
            "category": "Dependency Management",
            "action": f"Update {round(request.features.outdated_dependency_ratio * 100)}% of outdated dependencies",
            "effort": "MEDIUM",
            "timeline": "1 week",
            "type": "HIGH",
        })
        priority_counter += 1

    if request.features.test_coverage < 0.6:
        action_items.append({
            "priority": priority_counter,
            "category": "Quality Assurance",
            "action": f"Increase test coverage from {round(request.features.test_coverage * 100)}% to 80%+",
            "effort": "HIGH",
            "timeline": "2-3 weeks",
            "type": "MEDIUM",
        })
        priority_counter += 1

    if request.features.cyclomatic_complexity > 20:
        action_items.append({
            "priority": priority_counter,
            "category": "Code Quality",
            "action": f"Refactor modules with cyclomatic complexity > 20 (current: {request.features.cyclomatic_complexity:.0f})",
            "effort": "HIGH",
            "timeline": "1 month",
            "type": "MEDIUM",
        })
        priority_counter += 1

    if request.features.api_security_score < 70:
        action_items.append({
            "priority": priority_counter,
            "category": "API Security",
            "action": f"Improve API security score from {request.features.api_security_score:.0f} to 85+",
            "effort": "MEDIUM",
            "timeline": "2 weeks",
            "type": "HIGH",
        })
        priority_counter += 1

    action_items.append({
        "priority": priority_counter,
        "category": "Continuous Monitoring",
        "action": "Integrate SAST/DAST scanning into CI/CD pipeline",
        "effort": "LOW",
        "timeline": "Ongoing",
        "type": "LOW",
    })

    return {
        "project_name": request.project_name,
        "risk_level": risk_level,
        "risk_score": request.risk_score,
        "summary": f"The project has been assessed at {risk_level} risk with a score of {request.risk_score:.1f}/100. "
                   f"Immediate attention is required for {request.features.known_cve_count} known CVEs and "
                   f"{round(request.features.outdated_dependency_ratio * 100)}% outdated dependencies.",
        "mitigations": mitigations,
        "action_items": action_items,
        "architectural_recommendations": [
            "Adopt a Zero Trust security architecture across all service boundaries.",
            "Implement secrets management using HashiCorp Vault or AWS Secrets Manager.",
            "Enable mutual TLS (mTLS) for all inter-service communication.",
            "Deploy a Web Application Firewall (WAF) in front of public-facing APIs.",
            "Implement runtime application self-protection (RASP) for critical services.",
        ],
    }


@app.get("/api/demo-analysis")
async def get_demo_analysis():
    """Returns a complete demo analysis result for quick preview."""
    demo_features = RiskFeatures(
        cyclomatic_complexity=28.5,
        lines_of_code=15420,
        dependency_count=87,
        known_cve_count=9,
        known_cwe_count=6,
        historical_defect_rate=0.32,
        code_duplication_ratio=0.18,
        test_coverage=0.54,
        api_security_score=61.0,
        outdated_dependency_ratio=0.38,
    )
    risk_score = 72.4
    risk_level = "HIGH"

    analysis_req = AnalysisRequest(features=demo_features, risk_score=risk_score, project_name="Demo Application v2.1")
    analysis = await analyze_risks(analysis_req)
    advisory = await generate_advisory(analysis_req)

    return {
        "project_name": "Demo Application v2.1",
        "features": demo_features.model_dump(),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_probability": round(risk_score / 100, 4),
        "analysis": analysis,
        "advisory": advisory,
    }

@app.post("/api/generate-report")
async def generate_report(result: FullAnalysisResult):
    """PDF report disabled - WeasyPrint GTK runtime missing. Use /api/advisory for HTML."""
    return {"error": "PDF generation disabled (install GTK3). Use /api/demo-analysis or /api/advisory for data.", "project": result.project_name}

