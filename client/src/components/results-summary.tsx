import { CheckCircle2, AlertTriangle, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VerificationResult } from "@shared/schema";

interface ResultsSummaryProps {
  results: VerificationResult[];
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  const totalOperations = results.length;
  const certifiedOperations = results.filter((r) =>
    r.certification_status.toLowerCase().includes("certified")
  ).length;
  const totalMissingProducts = results.reduce(
    (sum, r) => sum + r.missing_products.length,
    0
  );

  const certifiedPercentage =
    totalOperations > 0 ? Math.round((certifiedOperations / totalOperations) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card data-testid="card-total-operations">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Operations Processed
          </CardTitle>
          <FileCheck className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold" data-testid="text-total-operations">
            {totalOperations}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Verified against USDA OID
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-certified-operations">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Certified Operations
          </CardTitle>
          <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-certified))]" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold text-[hsl(var(--status-certified))]" data-testid="text-certified-count">
              {certifiedOperations}
            </div>
            <div className="text-lg text-muted-foreground">
              ({certifiedPercentage}%)
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active certifications found
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-missing-products">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Missing Products
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--status-warning))]" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-[hsl(var(--status-warning))]" data-testid="text-missing-count">
            {totalMissingProducts}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Products not found in certificates
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
