import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("certified")) {
    return (
      <Badge
        className="gap-1.5 bg-[hsl(var(--status-certified-bg))] text-[hsl(var(--status-certified))] hover:bg-[hsl(var(--status-certified-bg))]"
        data-testid={`badge-status-${status}`}
      >
        <CheckCircle2 className="h-3 w-3" />
        Certified
      </Badge>
    );
  }

  if (normalizedStatus.includes("failed") || normalizedStatus.includes("error")) {
    return (
      <Badge
        className="gap-1.5 bg-[hsl(var(--status-error-bg))] text-[hsl(var(--status-error))] hover:bg-[hsl(var(--status-error-bg))]"
        data-testid={`badge-status-${status}`}
      >
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  if (normalizedStatus.includes("pending") || normalizedStatus.includes("processing")) {
    return (
      <Badge
        className="gap-1.5 bg-[hsl(var(--status-info-bg))] text-[hsl(var(--status-info))] hover:bg-[hsl(var(--status-info-bg))]"
        data-testid={`badge-status-${status}`}
      >
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  }

  return (
    <Badge
      className="gap-1.5 bg-[hsl(var(--status-warning-bg))] text-[hsl(var(--status-warning))] hover:bg-[hsl(var(--status-warning-bg))]"
      data-testid={`badge-status-${status}`}
    >
      <AlertCircle className="h-3 w-3" />
      {status}
    </Badge>
  );
}
