import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  currentSupplier?: string;
}

export function ProgressIndicator({ current, total, currentSupplier }: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-4 py-8">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium text-foreground">
          Verifying suppliers...
        </p>
        {currentSupplier && (
          <p className="text-sm text-muted-foreground mt-2">
            Currently processing: {currentSupplier}
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <Progress value={percentage} className="h-2" />
        <p className="text-sm text-center text-muted-foreground">
          {current} of {total} suppliers verified ({percentage}%)
        </p>
      </div>
    </div>
  );
}
