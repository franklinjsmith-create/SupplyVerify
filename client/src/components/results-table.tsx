import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StatusBadge } from "./status-badge";
import type { VerificationResult } from "@shared/schema";

interface ResultsTableProps {
  results: VerificationResult[];
}

interface ExpandedRows {
  [key: number]: boolean;
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});

  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const normalizeProduct = (product: string): string => {
    return product.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, " ").trim();
  };

  const isProductMatch = (certifiedProduct: string, matchingProducts: string[]): boolean => {
    const normalized = normalizeProduct(certifiedProduct);
    return matchingProducts.some(mp => {
      const normalizedMatch = normalizeProduct(mp);
      return normalized.includes(normalizedMatch) || normalizedMatch.includes(normalized);
    });
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <ScrollArea className="w-full">
        <div className="min-w-[1400px]">
          <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="min-w-[180px]">Operation</TableHead>
              <TableHead className="min-w-[120px] font-mono">NOP ID</TableHead>
              <TableHead className="min-w-[180px]">Certifier</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[130px]">Effective Date</TableHead>
              <TableHead className="min-w-[200px]">Matching Products</TableHead>
              <TableHead className="min-w-[200px]">Missing Products</TableHead>
              <TableHead className="min-w-[250px]">All Certified Products</TableHead>
              <TableHead className="min-w-[100px]">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow
                key={`${result.nop_id}-${index}`}
                className="hover-elevate"
                data-testid={`row-result-${index}`}
              >
                <TableCell>
                  <div>
                    {result.operation_name !== "Not found" && result.operation_name !== "Operation" ? (
                      <div data-testid={`text-operation-${index}`}>
                        {result.operation_name}
                      </div>
                    ) : (
                      <div className="text-muted-foreground" data-testid={`text-operation-${index}`}>
                        {result.operation_name}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm" data-testid={`text-nop-id-${index}`}>
                  {result.nop_id}
                </TableCell>
                <TableCell data-testid={`text-certifier-${index}`}>
                  {result.certifier}
                </TableCell>
                <TableCell>
                  <StatusBadge status={result.certification_status} />
                </TableCell>
                <TableCell data-testid={`text-effective-date-${index}`}>
                  {result.effective_date !== "Not found" ? (
                    <span className="text-sm">{result.effective_date}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not found</span>
                  )}
                </TableCell>
                <TableCell>
                  {result.matching_products.length > 0 ? (
                    <ScrollArea className="max-h-32">
                      <ul className="text-sm space-y-1" data-testid={`list-matching-${index}`}>
                        {result.matching_products.map((product, i) => (
                          <li key={i} className="text-[hsl(var(--status-certified))]">
                            • {product}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  {result.missing_products.length > 0 ? (
                    <ScrollArea className="max-h-32">
                      <ul className="text-sm space-y-1" data-testid={`list-missing-${index}`}>
                        {result.missing_products.map((product, i) => (
                          <li key={i} className="text-[hsl(var(--status-warning))]">
                            • {product}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  {result.all_certified_products.length > 0 ? (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(index)}
                        className="gap-1.5 p-2"
                        data-testid={`button-expand-products-${index}`}
                      >
                        {expandedRows[index] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="text-xs">
                          {result.all_certified_products.length} product{result.all_certified_products.length !== 1 ? 's' : ''}
                        </span>
                      </Button>
                      {expandedRows[index] && (
                        <ScrollArea className="max-h-96 mt-2">
                          <ul className="text-sm space-y-1.5 pl-2 pr-4" data-testid={`list-all-products-${index}`}>
                            {result.all_certified_products.map((product, i) => {
                              const isMatch = isProductMatch(product, result.matching_products);
                              return (
                                <li
                                  key={i}
                                  className={`break-words ${isMatch ? "text-[hsl(var(--status-certified))] font-medium" : ""}`}
                                >
                                  • {product}
                                </li>
                              );
                            })}
                          </ul>
                          <ScrollBar orientation="vertical" />
                        </ScrollArea>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    data-testid={`link-source-${index}`}
                  >
                    <a
                      href={result.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-1.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
