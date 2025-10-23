import { useCallback, useState } from "react";
import { Upload, FileText, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CompactFileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function CompactFileUpload({ onFileSelect, disabled }: CompactFileUploadProps) {
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
        h-full min-h-[280px] rounded-md border-2 border-dashed
        transition-all duration-150 ease-in-out p-6
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
      
      <Upload className="h-10 w-10 text-primary mb-3" />
      
      <p className="text-base font-medium text-foreground mb-1 text-center">
        Drop file here
      </p>
      
      <p className="text-xs text-muted-foreground mb-4 text-center">
        or click to browse
      </p>
      
      <div className="flex gap-2 mb-3">
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <FileText className="h-3 w-3" />
          CSV
        </Badge>
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <FileSpreadsheet className="h-3 w-3" />
          XLSX
        </Badge>
      </div>
      
      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        File should include:<br />
        NOP ID, Products
      </p>
    </div>
  );
}
