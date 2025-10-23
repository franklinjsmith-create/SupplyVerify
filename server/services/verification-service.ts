import { scrapeUSDAPage } from "./usda-scraper";
import type { SupplierInput, VerificationResult } from "@shared/schema";

function normalizeIngredient(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function verifySupplier(
  supplier: SupplierInput
): Promise<VerificationResult> {
  try {
    const certificationData = await scrapeUSDAPage(supplier.oid_number);

    const allCertifiedProducts = certificationData.scopes.flatMap(
      (scope) => scope.certified_products
    );

    const normalizedUserIngredients = supplier.ingredients.map(normalizeIngredient);
    const normalizedCertifiedProducts = allCertifiedProducts.map(normalizeIngredient);

    const matchingIngredients: string[] = [];
    const missingIngredients: string[] = [];

    normalizedUserIngredients.forEach((userIngredient, index) => {
      const isMatch = normalizedCertifiedProducts.some((certifiedProduct) => {
        return (
          certifiedProduct.includes(userIngredient) ||
          userIngredient.includes(certifiedProduct)
        );
      });

      if (isMatch) {
        matchingIngredients.push(supplier.ingredients[index]);
      } else {
        missingIngredients.push(supplier.ingredients[index]);
      }
    });

    const hasCertifiedScope = certificationData.scopes.some(
      (scope) => scope.status.toLowerCase().includes("certified")
    );

    const certificationStatus = hasCertifiedScope ? "Certified" : "Not certified";

    return {
      supplier_name: supplier.supplier_name,
      oid_number: supplier.oid_number,
      operation_name: certificationData.operation_name,
      certifier: certificationData.certifier,
      certification_status: certificationStatus,
      matching_ingredients: matchingIngredients,
      missing_ingredients: missingIngredients,
      source_url: `https://organic.ams.usda.gov/Integrity/Operations/Details?operationId=${supplier.oid_number}`,
      scopes: certificationData.scopes,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during verification";
    console.error(`Error verifying supplier ${supplier.supplier_name}:`, errorMessage);
    
    return {
      supplier_name: supplier.supplier_name,
      oid_number: supplier.oid_number,
      operation_name: "Verification failed",
      certifier: "Error",
      certification_status: "Failed",
      matching_ingredients: [],
      missing_ingredients: supplier.ingredients,
      source_url: `https://organic.ams.usda.gov/Integrity/Operations/Details?operationId=${supplier.oid_number}`,
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

export async function verifySuppliers(
  suppliers: SupplierInput[],
  sessionId: string
): Promise<void> {
  const progress = progressStore.get(sessionId);
  if (!progress) {
    throw new Error("Session not initialized");
  }

  if (suppliers.length === 0) {
    progress.status = "error";
    progress.error = "No suppliers to verify";
    progressStore.set(sessionId, { ...progress });
    setTimeout(() => progressStore.delete(sessionId), 60000);
    return;
  }

  progress.status = "processing";
  progressStore.set(sessionId, { ...progress });

  const CONCURRENT_LIMIT = 3;
  
  try {
    for (let i = 0; i < suppliers.length; i += CONCURRENT_LIMIT) {
      const batch = suppliers.slice(i, Math.min(i + CONCURRENT_LIMIT, suppliers.length));
      
      const batchPromises = batch.map(async (supplier) => {
        const currentProgress = progressStore.get(sessionId);
        if (currentProgress) {
          currentProgress.current = supplier.supplier_name;
          progressStore.set(sessionId, { ...currentProgress });
        }
        
        const result = await verifySupplier(supplier);
        
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
