import { useCallback, useState } from "react";
import { Upload, FileText, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileUploadZone({ onFileSelect, disabled }: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        const validExtensions = [".csv", ".xlsx", ".xls"];
        const isValid = validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (isValid) {
          onFileSelect(file);
        } else {
          toast({
            title: "Invalid file type",
            description: "Please upload a CSV or XLSX file.",
            variant: "destructive",
          });
        }
      }
    },
    [onFileSelect, disabled, toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center
        min-h-64 rounded-md border-2 border-dashed
        transition-all duration-150 ease-in-out
        ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-border bg-card hover-elevate"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      data-testid="file-upload-zone"
    >
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        data-testid="input-file"
      />
      
      <Upload className="h-12 w-12 text-primary mb-4" />
      
      <p className="text-lg font-medium text-foreground mb-2">
        Drag & drop your file here
      </p>
      
      <p className="text-sm text-muted-foreground mb-6">
        or click to browse
      </p>
      
      <div className="flex gap-2">
        <Badge variant="secondary" className="gap-1.5">
          <FileText className="h-3 w-3" />
          CSV
        </Badge>
        <Badge variant="secondary" className="gap-1.5">
          <FileSpreadsheet className="h-3 w-3" />
          XLSX
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground mt-4 text-center px-4">
        File should include columns: Supplier Name, OID Number, Ingredients
      </p>
    </div>
  );
}
