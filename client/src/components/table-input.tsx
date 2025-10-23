import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableInputProps {
  onSubmit: (data: Array<{ nopId: string; products: string }>) => void;
  disabled?: boolean;
}

interface Row {
  id: string;
  nopId: string;
  products: string;
}

export function TableInput({ onSubmit, disabled }: TableInputProps) {
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), nopId: "", products: "" },
  ]);

  const handleAddRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), nopId: "", products: "" }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const handleNopIdChange = (id: string, value: string) => {
    setRows(
      rows.map((row) =>
        row.id === id ? { ...row, nopId: value.replace(/\D/g, "").slice(0, 10) } : row
      )
    );
  };

  const handleProductsChange = (id: string, value: string) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, products: value } : row))
    );
  };

  const handleSubmit = () => {
    const validRows = rows.filter(
      (row) => row.nopId.trim()
    );
    if (validRows.length > 0) {
      onSubmit(validRows);
    }
  };

  const hasValidData = rows.some(
    (row) => row.nopId.trim()
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px] font-semibold">NOP ID</TableHead>
              <TableHead className="font-semibold">Products</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id} className="hover-elevate">
                <TableCell>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g., 8150001085"
                    value={row.nopId}
                    onChange={(e) => handleNopIdChange(row.id, e.target.value)}
                    disabled={disabled}
                    className="font-mono"
                    data-testid={`input-nop-id-${index}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    placeholder="e.g., ginger, turmeric, black pepper"
                    value={row.products}
                    onChange={(e) =>
                      handleProductsChange(row.id, e.target.value)
                    }
                    disabled={disabled}
                    data-testid={`input-products-${index}`}
                  />
                </TableCell>
                <TableCell>
                  {rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={disabled}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`button-remove-row-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handleAddRow}
          disabled={disabled}
          className="gap-2"
          data-testid="button-add-row"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </Button>

        <p className="text-xs text-muted-foreground text-left sm:text-right max-w-md">
          Enter the 10-digit NOP ID and comma-separated products for each operation. Products are optional.
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          onClick={handleSubmit}
          disabled={disabled || !hasValidData}
          size="lg"
          data-testid="button-verify-table"
        >
          Verify Operations
        </Button>
      </div>
    </div>
  );
}
