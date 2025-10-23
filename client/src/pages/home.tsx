import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CompactFileUpload } from "@/components/compact-file-upload";
import { TableInput } from "@/components/table-input";
import { ResultsSummary } from "@/components/results-summary";
import { ResultsTable } from "@/components/results-table";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { ProgressIndicator } from "@/components/progress-indicator";
import { apiRequest } from "@/lib/queryClient";
import type { VerificationResponse } from "@shared/schema";
import * as XLSX from "xlsx";

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
                  description: `Successfully verified ${data.results.length} operation(s)`,
                });
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              } else {
                setSessionId(null);
                toast({
                  title: "No results",
                  description: "No operations were verified. Please check your input data.",
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
      setSelectedFile(null);
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
    const formData = new FormData();
    formData.append("file", file);
    verifyMutation.mutate(formData);
    toast({
      title: "File uploaded",
      description: `Processing ${file.name}...`,
    });
  };

  const handleTableSubmit = (data: Array<{ nopId: string; products: string }>) => {
    // Convert table data to pipe-delimited format that backend expects
    const textData = data
      .map((row) => `Operation | ${row.nopId} | ${row.products}`)
      .join("\n");
    verifyTextMutation.mutate(textData);
  };

  const handleDownloadExcel = () => {
    if (!results) return;

    // Create worksheet data
    const worksheetData = results.results.map((result) => ({
      "Operation": result.operation_name,
      "NOP ID": result.nop_id,
      "Certifier": result.certifier,
      "Status": result.certification_status,
      "Matching Products": result.matching_products.join(", "),
      "Missing Products": result.missing_products.join(", "),
      "Source URL": result.source_url,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Verification Results");

    // Auto-size columns
    const maxWidth = 50;
    const columnWidths = Object.keys(worksheetData[0] || {}).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...worksheetData.map((row) => String(row[key as keyof typeof row] || "").length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet["!cols"] = columnWidths;

    // Generate file and trigger download
    const fileName = `usda-verification-results-${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Download started",
      description: "Results exported as Excel",
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
              USDA Organic Operation Status & Product Verification Tool
            </h1>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Upload Operation Data</CardTitle>
            <CardDescription>
              Verify operation certification status and products against the USDA Organic Integrity Database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_0.5fr] gap-6 items-start">
              {/* Left: Table Input */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Manual Entry</h3>
                <TableInput onSubmit={handleTableSubmit} disabled={isLoading} />
              </div>

              {/* Middle: OR Divider */}
              <div className="hidden lg:flex flex-col items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-full w-px bg-border min-h-[100px]" />
                  <span className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-full">
                    OR
                  </span>
                  <div className="h-full w-px bg-border min-h-[100px]" />
                </div>
              </div>

              {/* Mobile: OR Divider */}
              <div className="lg:hidden relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Right: File Upload */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Upload File</h3>
                <CompactFileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
              </div>
            </div>
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
                onClick={handleDownloadExcel}
                className="gap-2"
                data-testid="button-download-excel"
              >
                <Download className="h-4 w-4" />
                Download Excel
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
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
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
