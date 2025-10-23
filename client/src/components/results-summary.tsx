import { CheckCircle2, AlertTriangle, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VerificationResult } from "@shared/schema";

interface ResultsSummaryProps {
  results: VerificationResult[];
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  const totalSuppliers = results.length;
  const certifiedSuppliers = results.filter((r) =>
    r.certification_status.toLowerCase().includes("certified")
  ).length;
  const totalMissingIngredients = results.reduce(
    (sum, r) => sum + r.missing_ingredients.length,
    0
  );

  const certifiedPercentage =
    totalSuppliers > 0 ? Math.round((certifiedSuppliers / totalSuppliers) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card data-testid="card-total-suppliers">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Suppliers Processed
          </CardTitle>
          <FileCheck className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold" data-testid="text-total-suppliers">
            {totalSuppliers}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Verified against USDA OID
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-certified-suppliers">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Certified Suppliers
          </CardTitle>
          <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-certified))]" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-semibold text-[hsl(var(--status-certified))]" data-testid="text-certified-count">
              {certifiedSuppliers}
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

      <Card data-testid="card-missing-ingredients">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Missing Ingredients
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-[hsl(var(--status-warning))]" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-[hsl(var(--status-warning))]" data-testid="text-missing-count">
            {totalMissingIngredients}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ingredients not found in certificates
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
