import { z } from "zod";

export const supplierInputSchema = z.object({
  supplier_name: z.string().min(1, "Supplier name is required"),
  oid_number: z.string().min(1, "OID number is required"),
  ingredients: z.array(z.string()).min(1, "At least one ingredient is required"),
});

export const scopeSchema = z.object({
  scope_name: z.string(),
  status: z.string(),
  effective_date: z.string(),
  certified_products: z.array(z.string()),
});

export const verificationResultSchema = z.object({
  supplier_name: z.string(),
  oid_number: z.string(),
  operation_name: z.string(),
  certifier: z.string(),
  certification_status: z.string(),
  matching_ingredients: z.array(z.string()),
  missing_ingredients: z.array(z.string()),
  source_url: z.string(),
  scopes: z.array(scopeSchema).optional(),
});

export const verificationRequestSchema = z.object({
  suppliers: z.array(supplierInputSchema),
});

export const verificationResponseSchema = z.object({
  results: z.array(verificationResultSchema),
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;
export type Scope = z.infer<typeof scopeSchema>;
export type VerificationResult = z.infer<typeof verificationResultSchema>;
export type VerificationRequest = z.infer<typeof verificationRequestSchema>;
export type VerificationResponse = z.infer<typeof verificationResponseSchema>;
