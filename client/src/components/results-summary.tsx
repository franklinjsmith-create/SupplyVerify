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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      <Card data-testid="card-total-operations">
        <CardHeader className="flex flex-row items-center justify-between gap-3 sm:gap-4 space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Total Operations Processed
          </CardTitle>
          <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-semibold" data-testid="text-total-operations">
            {totalOperations}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Verified against USDA OID
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-certified-operations">
        <CardHeader className="flex flex-row items-center justify-between gap-3 sm:gap-4 space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Certified Operations
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[hsl(var(--status-certified))] shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-semibold text-[hsl(var(--status-certified))]" data-testid="text-certified-count">
              {certifiedOperations}
            </div>
            <div className="text-base sm:text-lg text-muted-foreground">
              ({certifiedPercentage}%)
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active certifications found
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-missing-products" className="sm:col-span-2 md:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between gap-3 sm:gap-4 space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Missing Products
          </CardTitle>
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-[hsl(var(--status-warning))] shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-semibold text-[hsl(var(--status-warning))]" data-testid="text-missing-count">
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
