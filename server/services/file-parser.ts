import Papa from "papaparse";
import * as XLSX from "xlsx";
import { operationInputSchema } from "@shared/schema";
import type { OperationInput } from "@shared/schema";

export interface ParsedOperationData {
  operations: OperationInput[];
  errors: string[];
}

export function parseCSV(fileContent: string): ParsedOperationData {
  const operations: OperationInput[] = [];
  const errors: string[] = [];

  const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      return header.trim().toLowerCase().replace(/\s+/g, "_");
    },
  });

  if (result.errors.length > 0) {
    result.errors.forEach((error) => {
      errors.push(`CSV parsing error at row ${error.row}: ${error.message}`);
    });
  }

  result.data.forEach((row: any, index: number) => {
    try {
      const operationName = row.operation_name || row.operation || row.supplier_name || row.supplier || "";
      const nopId = row.nop_id || row.nopid || row.oid_number || row.oid || row.oid_num || "";
      const productsRaw = row.products || row.product || row.ingredients || row.ingredient || "";

      if (!operationName || !nopId || !productsRaw) {
        errors.push(
          `Row ${index + 1}: Missing required fields (Operation Name, NOP ID, or Products)`
        );
        return;
      }

      const products = productsRaw
        .split(",")
        .map((prod: string) => prod.trim())
        .filter((prod: string) => prod.length > 0);

      if (products.length === 0) {
        errors.push(`Row ${index + 1}: No valid products found`);
        return;
      }

      const operation = {
        operation_name: operationName.trim(),
        nop_id: nopId.trim(),
        products,
      };

      const validation = operationInputSchema.safeParse(operation);
      if (!validation.success) {
        errors.push(`Row ${index + 1}: Validation failed - ${validation.error.message}`);
        return;
      }

      operations.push(operation);
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  return { operations, errors };
}

export function parseXLSX(fileBuffer: Buffer): ParsedOperationData {
  const operations: OperationInput[] = [];
  const errors: string[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    
    if (workbook.SheetNames.length === 0) {
      errors.push("XLSX file contains no sheets");
      return { operations, errors };
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, {
      raw: false,
      defval: "",
    });

    jsonData.forEach((row, index) => {
      try {
        const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, "_");
        const normalizedRow: any = {};
        
        Object.keys(row).forEach((key) => {
          normalizedRow[normalizeKey(key)] = row[key];
        });

        const operationName = normalizedRow.operation_name || normalizedRow.operation || normalizedRow.supplier_name || normalizedRow.supplier || "";
        const nopId = normalizedRow.nop_id || normalizedRow.nopid || normalizedRow.oid_number || normalizedRow.oid || normalizedRow.oid_num || "";
        const productsRaw = normalizedRow.products || normalizedRow.product || normalizedRow.ingredients || normalizedRow.ingredient || "";

        if (!operationName || !nopId || !productsRaw) {
          errors.push(
            `Row ${index + 2}: Missing required fields (Operation Name, NOP ID, or Products)`
          );
          return;
        }

        const products = String(productsRaw)
          .split(",")
          .map((prod: string) => prod.trim())
          .filter((prod: string) => prod.length > 0);

        if (products.length === 0) {
          errors.push(`Row ${index + 2}: No valid products found`);
          return;
        }

        const operation = {
          operation_name: String(operationName).trim(),
          nop_id: String(nopId).trim(),
          products,
        };

        const validation = operationInputSchema.safeParse(operation);
        if (!validation.success) {
          errors.push(`Row ${index + 2}: Validation failed - ${validation.error.message}`);
          return;
        }

        operations.push(operation);
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });

    return { operations, errors };
  } catch (error) {
    errors.push(`XLSX parsing error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { operations, errors };
  }
}

export function parseTextInput(text: string): ParsedOperationData {
  const operations: OperationInput[] = [];
  const errors: string[] = [];

  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  lines.forEach((line, index) => {
    try {
      const parts = line.split("|").map((part) => part.trim());

      if (parts.length < 3) {
        errors.push(
          `Line ${index + 1}: Invalid format. Expected: Operation Name | NOP ID | Products`
        );
        return;
      }

      const [operationName, nopId, productsRaw] = parts;

      if (!operationName || !nopId || !productsRaw) {
        errors.push(`Line ${index + 1}: Missing required fields`);
        return;
      }

      const products = productsRaw
        .split(",")
        .map((prod) => prod.trim())
        .filter((prod) => prod.length > 0);

      if (products.length === 0) {
        errors.push(`Line ${index + 1}: No valid products found`);
        return;
      }

      const operation = {
        operation_name: operationName,
        nop_id: nopId,
        products,
      };

      const validation = operationInputSchema.safeParse(operation);
      if (!validation.success) {
        errors.push(`Line ${index + 1}: Validation failed - ${validation.error.message}`);
        return;
      }

      operations.push(operation);
    } catch (error) {
      errors.push(`Line ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  return { operations, errors };
}
