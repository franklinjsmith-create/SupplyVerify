import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium text-foreground">
          Fetching data from USDA database...
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          This may take a moment while we verify certifications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-md border border-border bg-card p-6">
        <Skeleton className="h-10 w-full mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full mb-2" />
        ))}
      </div>
    </div>
  );
}
