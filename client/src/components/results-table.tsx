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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [expandedAllProducts, setExpandedAllProducts] = useState<ExpandedRows>({});
  const [expandedMatchingProducts, setExpandedMatchingProducts] = useState<ExpandedRows>({});
  const [expandedMissingProducts, setExpandedMissingProducts] = useState<ExpandedRows>({});

  const toggleAllProducts = (index: number) => {
    setExpandedAllProducts(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleMatchingProducts = (index: number) => {
    setExpandedMatchingProducts(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleMissingProducts = (index: number) => {
    setExpandedMissingProducts(prev => ({
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
    <>
      {/* Desktop Table View (≥1024px) */}
      <div className="hidden lg:block rounded-md border border-border bg-card">
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
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMatchingProducts(index)}
                            className="gap-1.5 p-2"
                            data-testid={`button-expand-matching-${index}`}
                          >
                            {expandedMatchingProducts[index] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="text-xs">
                              {result.matching_products.length} product{result.matching_products.length !== 1 ? 's' : ''}
                            </span>
                          </Button>
                          {expandedMatchingProducts[index] && (
                            <ScrollArea className="h-96 mt-2">
                              <div className="pr-4">
                                <ul className="text-sm space-y-1.5 pl-2" data-testid={`list-matching-${index}`}>
                                  {result.matching_products.map((product, i) => (
                                    <li key={i} className="text-[hsl(var(--status-certified))] break-words">
                                      • {product}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.missing_products.length > 0 ? (
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMissingProducts(index)}
                            className="gap-1.5 p-2"
                            data-testid={`button-expand-missing-${index}`}
                          >
                            {expandedMissingProducts[index] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="text-xs">
                              {result.missing_products.length} product{result.missing_products.length !== 1 ? 's' : ''}
                            </span>
                          </Button>
                          {expandedMissingProducts[index] && (
                            <ScrollArea className="h-96 mt-2">
                              <div className="pr-4">
                                <ul className="text-sm space-y-1.5 pl-2" data-testid={`list-missing-${index}`}>
                                  {result.missing_products.map((product, i) => (
                                    <li key={i} className="text-[hsl(var(--status-warning))] break-words">
                                      • {product}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </ScrollArea>
                          )}
                        </div>
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
                            onClick={() => toggleAllProducts(index)}
                            className="gap-1.5 p-2"
                            data-testid={`button-expand-products-${index}`}
                          >
                            {expandedAllProducts[index] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="text-xs">
                              {result.all_certified_products.length} product{result.all_certified_products.length !== 1 ? 's' : ''}
                            </span>
                          </Button>
                          {expandedAllProducts[index] && (
                            <ScrollArea className="h-96 mt-2">
                              <div className="pr-4">
                                <ul className="text-sm space-y-1.5 pl-2" data-testid={`list-all-products-${index}`}>
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
                              </div>
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

      {/* Mobile/Tablet Card View (<1024px) */}
      <div className="lg:hidden space-y-4">
        {results.map((result, index) => (
          <Card key={`${result.nop_id}-${index}`} data-testid={`card-result-${index}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base mb-2">
                    {result.operation_name !== "Not found" && result.operation_name !== "Operation" ? (
                      <span data-testid={`text-operation-${index}`}>{result.operation_name}</span>
                    ) : (
                      <span className="text-muted-foreground" data-testid={`text-operation-${index}`}>
                        {result.operation_name}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">NOP ID:</span>
                      <span className="font-mono" data-testid={`text-nop-id-${index}`}>{result.nop_id}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground font-medium">Status:</span>
                      <StatusBadge status={result.certification_status} />
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  data-testid={`link-source-${index}`}
                  className="shrink-0"
                >
                  <a
                    href={result.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">View</span>
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Certifier */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Certifier</div>
                <div className="text-sm" data-testid={`text-certifier-${index}`}>{result.certifier}</div>
              </div>

              {/* Effective Date */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Effective Date</div>
                <div className="text-sm" data-testid={`text-effective-date-${index}`}>
                  {result.effective_date !== "Not found" ? (
                    <span>{result.effective_date}</span>
                  ) : (
                    <span className="text-muted-foreground">Not found</span>
                  )}
                </div>
              </div>

              {/* Matching Products */}
              {result.matching_products.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Matching Products
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMatchingProducts(index)}
                      className="gap-1.5 h-8"
                      data-testid={`button-expand-matching-${index}`}
                    >
                      {expandedMatchingProducts[index] ? (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span className="text-xs">Hide ({result.matching_products.length})</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4" />
                          <span className="text-xs">Show ({result.matching_products.length})</span>
                        </>
                      )}
                    </Button>
                  </div>
                  {expandedMatchingProducts[index] && (
                    <ScrollArea className="h-64 mt-2">
                      <div className="pr-4">
                        <ul className="text-sm space-y-1.5" data-testid={`list-matching-${index}`}>
                          {result.matching_products.map((product, i) => (
                            <li key={i} className="text-[hsl(var(--status-certified))] break-words">
                              • {product}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* Missing Products */}
              {result.missing_products.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Missing Products
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMissingProducts(index)}
                      className="gap-1.5 h-8"
                      data-testid={`button-expand-missing-${index}`}
                    >
                      {expandedMissingProducts[index] ? (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span className="text-xs">Hide ({result.missing_products.length})</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4" />
                          <span className="text-xs">Show ({result.missing_products.length})</span>
                        </>
                      )}
                    </Button>
                  </div>
                  {expandedMissingProducts[index] && (
                    <ScrollArea className="h-64 mt-2">
                      <div className="pr-4">
                        <ul className="text-sm space-y-1.5" data-testid={`list-missing-${index}`}>
                          {result.missing_products.map((product, i) => (
                            <li key={i} className="text-[hsl(var(--status-warning))] break-words">
                              • {product}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* All Certified Products */}
              {result.all_certified_products.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      All Certified Products
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllProducts(index)}
                      className="gap-1.5 h-8"
                      data-testid={`button-expand-products-${index}`}
                    >
                      {expandedAllProducts[index] ? (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span className="text-xs">Hide ({result.all_certified_products.length})</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4" />
                          <span className="text-xs">Show ({result.all_certified_products.length})</span>
                        </>
                      )}
                    </Button>
                  </div>
                  {expandedAllProducts[index] && (
                    <ScrollArea className="h-64 mt-2">
                      <div className="pr-4">
                        <ul className="text-sm space-y-1.5" data-testid={`list-all-products-${index}`}>
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
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
