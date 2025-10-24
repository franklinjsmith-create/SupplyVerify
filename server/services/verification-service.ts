import { scrapeUSDAPage } from "./usda-scraper";
import type { OperationInput, VerificationResult } from "@shared/schema";

function normalizeProduct(product: string): string {
  return product
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function verifyOperation(
  operation: OperationInput
): Promise<VerificationResult> {
  try {
    const certificationData = await scrapeUSDAPage(operation.nop_id);

    let matchingProducts: string[] = [];
    let missingProducts: string[] = [];

    // Only verify products if they were provided
    if (operation.products && operation.products.length > 0) {
      const allCertifiedProducts = certificationData.scopes.flatMap(
        (scope) => scope.certified_products
      );

      const normalizedUserProducts = operation.products.map(normalizeProduct);
      const normalizedCertifiedProducts = allCertifiedProducts.map(normalizeProduct);

      normalizedUserProducts.forEach((userProduct, index) => {
        const isMatch = normalizedCertifiedProducts.some((certifiedProduct) => {
          return (
            certifiedProduct.includes(userProduct) ||
            userProduct.includes(certifiedProduct)
          );
        });

        if (isMatch) {
          matchingProducts.push(operation.products[index]);
        } else {
          missingProducts.push(operation.products[index]);
        }
      });
    }

    const hasCertifiedScope = certificationData.scopes.some(
      (scope) => scope.status.toLowerCase().includes("certified")
    );

    const certificationStatus = hasCertifiedScope ? "Certified" : "Not certified";

    return {
      operation_name: certificationData.operation_name,
      nop_id: operation.nop_id,
      certifier: certificationData.certifier,
      certification_status: certificationStatus,
      effective_date: certificationData.effective_date,
      all_certified_products: certificationData.all_certified_products,
      matching_products: matchingProducts,
      missing_products: missingProducts,
      source_url: `https://organic.ams.usda.gov/Integrity/CP/OPP?nopid=${operation.nop_id}`,
      scopes: certificationData.scopes,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during verification";
    console.error(`Error verifying operation ${operation.operation_name}:`, errorMessage);
    
    return {
      operation_name: operation.operation_name,
      nop_id: operation.nop_id,
      certifier: "Error",
      certification_status: "Failed",
      effective_date: "Not found",
      all_certified_products: [],
      matching_products: [],
      missing_products: operation.products || [],
      source_url: `https://organic.ams.usda.gov/Integrity/CP/OPP?nopid=${operation.nop_id}`,
    };
  }
}

export interface VerificationProgress {
  total: number;
  completed: number;
  current: string;
  results: VerificationResult[];
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
}

const progressStore = new Map<string, VerificationProgress>();

export function getProgress(sessionId: string): VerificationProgress | null {
  return progressStore.get(sessionId) || null;
}

export function initializeSession(sessionId: string, total: number): void {
  progressStore.set(sessionId, {
    total,
    completed: 0,
    current: "",
    results: [],
    status: "pending",
  });
}

export async function verifyOperations(
  operations: OperationInput[],
  sessionId: string
): Promise<void> {
  const progress = progressStore.get(sessionId);
  if (!progress) {
    throw new Error("Session not initialized");
  }

  if (operations.length === 0) {
    progress.status = "error";
    progress.error = "No operations to verify";
    progressStore.set(sessionId, { ...progress });
    setTimeout(() => progressStore.delete(sessionId), 60000);
    return;
  }

  progress.status = "processing";
  progressStore.set(sessionId, { ...progress });

  const CONCURRENT_LIMIT = 5;
  
  try {
    for (let i = 0; i < operations.length; i += CONCURRENT_LIMIT) {
      const batch = operations.slice(i, Math.min(i + CONCURRENT_LIMIT, operations.length));
      
      const batchPromises = batch.map(async (operation) => {
        const currentProgress = progressStore.get(sessionId);
        if (currentProgress) {
          currentProgress.current = operation.operation_name;
          progressStore.set(sessionId, { ...currentProgress });
        }
        
        const result = await verifyOperation(operation);
        
        const updatedProgress = progressStore.get(sessionId);
        if (updatedProgress) {
          updatedProgress.completed++;
          updatedProgress.results.push(result);
          progressStore.set(sessionId, { ...updatedProgress });
        }
        
        return result;
      });
      
      await Promise.all(batchPromises);
    }

    const finalProgress = progressStore.get(sessionId);
    if (finalProgress) {
      finalProgress.status = "completed";
      finalProgress.current = "";
      progressStore.set(sessionId, { ...finalProgress });
    }

    setTimeout(() => progressStore.delete(sessionId), 300000);
  } catch (error) {
    const errorProgress = progressStore.get(sessionId);
    if (errorProgress) {
      errorProgress.status = "error";
      errorProgress.error = error instanceof Error ? error.message : "Unknown error";
      progressStore.set(sessionId, { ...errorProgress });
    }
  }
}
