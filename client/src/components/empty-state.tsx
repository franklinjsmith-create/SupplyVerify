import { FileSearch } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FileSearch className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-2xl font-semibold text-foreground mb-2">
        Upload a file to begin verification
      </h3>
      
      <p className="text-muted-foreground text-center max-w-md">
        Upload a CSV or XLSX file containing your supplier information, or paste
        text data in pipe-delimited format to verify certifications against the
        USDA Organic Integrity Database.
      </p>
    </div>
  );
}
