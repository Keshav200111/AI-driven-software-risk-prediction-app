"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileCode2, FileJson, Package, X, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { extractFeaturesFromFile, runFullAnalysis, type FullAnalysisResult } from "@/lib/risk-engine";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
}

interface Props {
  onAnalysisComplete: (result: FullAnalysisResult) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  code: <FileCode2 className="w-5 h-5 text-blue-500" />,
  json: <FileJson className="w-5 h-5 text-orange-500" />,
  deps: <Package className="w-5 h-5 text-green-500" />,
};

const ACCEPTED_TYPES = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".c", ".json", ".txt", ".xml", ".yaml", ".yml", ".toml"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileCategory(name: string): string {
  if ([".json", ".xml", ".yaml", ".yml", ".toml"].some(e => name.endsWith(e))) return "json";
  if ([".txt", "requirements", "package.json", "pom.xml"].some(e => name.includes(e))) return "deps";
  return "code";
}

export default function UploadModule({ onAnalysisComplete, isLoading, setIsLoading }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File): Promise<UploadedFile> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        resolve({
          name: file.name,
          size: file.size,
          type: file.type,
          content: (e.target?.result as string) || "",
        });
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    setError("");
    const valid = Array.from(fileList).filter(f =>
      ACCEPTED_TYPES.some(ext => f.name.toLowerCase().endsWith(ext)) || f.size < 5 * 1024 * 1024
    );
    if (valid.length === 0) {
      setError("Please upload code files (.py, .js, .ts, .java, .go, .json, .txt, etc.)");
      return;
    }
    const read = await Promise.all(valid.slice(0, 5).map(readFile));
    setFiles(prev => {
      const combined = [...prev, ...read];
      return combined.slice(0, 5);
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const runAnalysis = async () => {
    if (files.length === 0) {
      setError("Please upload at least one file before running analysis.");
      return;
    }
    setIsLoading(true);
    setError("");
    setProgress(0);

    const name = projectName.trim() || "Unnamed Project";

    const stages = [
      [15, "Parsing uploaded files..."],
      [30, "Extracting code metrics..."],
      [50, "Scanning for CVE/CWE patterns..."],
      [65, "Computing cyclomatic complexity..."],
      [80, "Running ML Risk Prediction model..."],
      [90, "Analyzing risk factors..."],
      [100, "Generating security advisory..."],
    ] as [number, string][];

    for (const [pct, msg] of stages) {
      await new Promise(r => setTimeout(r, 350 + Math.random() * 250));
      setProgress(pct);
      setStage(msg);
    }

    // Merge all file content for feature extraction
    const allContent = files.map(f => f.content).join("\n");
    const features = extractFeaturesFromFile(allContent, files[0].name);
    const result = runFullAnalysis(features, name, files.map(f => f.name).join(", "));

    await new Promise(r => setTimeout(r, 300));
    setIsLoading(false);
    setProgress(0);
    setStage("");
    onAnalysisComplete(result);
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">1</div>
          <span className="font-semibold text-foreground">Input & Feature Extraction</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Upload software artifacts for AI analysis</span>
      </div>

      {/* Project Name */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Project Configuration</CardTitle>
          <CardDescription>Name your project for the risk report</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            placeholder="e.g. PaymentService v3.2, AuthModule, main-app"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </CardContent>
      </Card>

      {/* Drop Zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports: .py, .js, .ts, .java, .go, .json, .xml, .yaml, .txt, .toml
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Source Code", "Metadata", "Dependencies", "Config Files"].map(t => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Uploaded Files ({files.length}/5)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                {FILE_TYPE_ICONS[getFileCategory(f.name)]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(f.size)} — {f.content.split("\n").length} lines
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize shrink-0">
                  {getFileCategory(f.name)}
                </Badge>
                <button
                  onClick={e => { e.stopPropagation(); removeFile(i); }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Processing Progress */}
      {isLoading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-primary">{stage}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}% — ML pipeline processing...</p>
          </CardContent>
        </Card>
      )}

      {/* Feature Extraction Info */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Extracted Risk Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              "Cyclomatic Complexity",
              "Lines of Code",
              "Dependency Count",
              "Known CVE Count",
              "Known CWE Count",
              "Historical Defect Rate",
              "Code Duplication Ratio",
              "Test Coverage",
              "API Security Score",
              "Outdated Dependency %",
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {f}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analyze Button */}
      <Button
        size="lg"
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base"
        onClick={runAnalysis}
        disabled={isLoading || files.length === 0}
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing...</>
        ) : (
          <><Upload className="w-5 h-5 mr-2" /> Run AI Risk Analysis</>
        )}
      </Button>
    </div>
  );
}
