import { z } from "zod";

export const operationInputSchema = z.object({
  operation_name: z.string().min(1, "Operation name is required"),
  nop_id: z.string().min(1, "NOP ID is required"),
  products: z.array(z.string()).min(1, "At least one product is required"),
});

export const scopeSchema = z.object({
  scope_name: z.string(),
  status: z.string(),
  effective_date: z.string(),
  certified_products: z.array(z.string()),
});

export const verificationResultSchema = z.object({
  operation_name: z.string(),
  nop_id: z.string(),
  certifier: z.string(),
  certification_status: z.string(),
  matching_products: z.array(z.string()),
  missing_products: z.array(z.string()),
  source_url: z.string(),
  scopes: z.array(scopeSchema).optional(),
});

export const verificationRequestSchema = z.object({
  operations: z.array(operationInputSchema),
});

export const verificationResponseSchema = z.object({
  results: z.array(verificationResultSchema),
});

export type OperationInput = z.infer<typeof operationInputSchema>;
export type Scope = z.infer<typeof scopeSchema>;
export type VerificationResult = z.infer<typeof verificationResultSchema>;
export type VerificationRequest = z.infer<typeof verificationRequestSchema>;
export type VerificationResponse = z.infer<typeof verificationResponseSchema>;
