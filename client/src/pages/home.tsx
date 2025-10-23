import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileUploadZone } from "@/components/file-upload-zone";
import { TextInputZone } from "@/components/text-input-zone";
import { ResultsSummary } from "@/components/results-summary";
import { ResultsTable } from "@/components/results-table";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { ProgressIndicator } from "@/components/progress-indicator";
import { apiRequest } from "@/lib/queryClient";
import type { VerificationResponse } from "@shared/schema";

interface ProgressData {
  total: number;
  completed: number;
  current: string;
}

export default function Home() {
  const [results, setResults] = useState<VerificationResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionId && !results) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/progress/${sessionId}`);
          if (response.ok) {
            const data = await response.json();
            setProgress({
              total: data.total,
              completed: data.completed,
              current: data.current,
            });
            
            if (data.status === "completed") {
              clearInterval(interval);
              setProgress(null);
              if (data.results.length > 0) {
                setResults({ results: data.results });
                toast({
                  title: "Verification complete",
                  description: `Successfully verified ${data.results.length} supplier(s)`,
                });
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              } else {
                setSessionId(null);
                toast({
                  title: "No results",
                  description: "No suppliers were verified. Please check your input data.",
                  variant: "destructive",
                });
              }
            } else if (data.status === "error") {
              clearInterval(interval);
              setProgress(null);
              setSessionId(null);
              toast({
                title: "Verification failed",
                description: data.error || "An error occurred during verification",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch progress:", error);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, results, toast]);

  const verifyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/verify", formData);
      return await response.json() as { sessionId: string; total: number };
    },
    onSuccess: (data) => {
      setResults(null);
      setSessionId(data.sessionId);
      setProgress({
        total: data.total,
        completed: 0,
        current: "Initializing...",
      });
    },
    onError: (error: Error) => {
      setProgress(null);
      setSessionId(null);
      toast({
        title: "Verification failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    },
  });

  const verifyTextMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/verify-text", { text });
      return await response.json() as { sessionId: string; total: number };
    },
    onSuccess: (data) => {
      setResults(null);
      setSessionId(data.sessionId);
      setProgress({
        total: data.total,
        completed: 0,
        current: "Initializing...",
      });
    },
    onError: (error: Error) => {
      setProgress(null);
      setSessionId(null);
      toast({
        title: "Verification failed",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    toast({
      title: "File selected",
      description: `${file.name} is ready to upload`,
    });
  };

  const handleVerify = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to verify",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    verifyMutation.mutate(formData);
  };

  const handleTextSubmit = (text: string) => {
    verifyTextMutation.mutate(text);
  };

  const handleDownloadJSON = () => {
    if (!results) return;

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usda-verification-results-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Results exported as JSON",
    });
  };

  const isLoading = verifyMutation.isPending || verifyTextMutation.isPending || (sessionId !== null && results === null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <FileUp className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">
              USDA Organic Verification Tool
            </h1>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Supplier Data</CardTitle>
            <CardDescription>
              Verify supplier certifications and ingredients against the USDA Organic
              Integrity Database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploadZone
              onFileSelect={handleFileSelect}
              disabled={isLoading}
            />

            {selectedFile && (
              <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium" data-testid="text-selected-file">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <Button
                  onClick={handleVerify}
                  disabled={isLoading}
                  size="lg"
                  data-testid="button-verify"
                >
                  {isLoading ? "Verifying..." : "Verify Suppliers"}
                </Button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <TextInputZone
              onTextSubmit={handleTextSubmit}
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {isLoading && progress && (
          <ProgressIndicator
            current={progress.completed}
            total={progress.total}
            currentSupplier={progress.current}
          />
        )}

        {isLoading && !progress && <LoadingState />}

        {!isLoading && !results && <EmptyState />}

        {!isLoading && results && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Verification Results</h2>
              <Button
                variant="outline"
                onClick={handleDownloadJSON}
                className="gap-2"
                data-testid="button-download-json"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
            </div>

            <ResultsSummary results={results.results} />

            <div>
              <h3 className="text-xl font-semibold mb-4">Detailed Results</h3>
              <ResultsTable results={results.results} />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card mt-16">
        <div className="container max-w-7xl px-4 md:px-6 lg:px-8 py-6">
          <p className="text-sm text-muted-foreground text-center">
            Data sourced from the{" "}
            <a
              href="https://organic.ams.usda.gov/integrity/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              USDA Organic Integrity Database
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
