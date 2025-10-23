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

      if (!nopId) {
        errors.push(
          `Row ${index + 1}: Missing required field (NOP ID)`
        );
        return;
      }

      const products = productsRaw
        ? productsRaw
            .split(",")
            .map((prod: string) => prod.trim())
            .filter((prod: string) => prod.length > 0)
        : [];

      const operation = {
        operation_name: operationName.trim() || `Operation ${nopId.trim()}`,
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

        if (!nopId) {
          errors.push(
            `Row ${index + 2}: Missing required field (NOP ID)`
          );
          return;
        }

        const products = productsRaw
          ? String(productsRaw)
              .split(",")
              .map((prod: string) => prod.trim())
              .filter((prod: string) => prod.length > 0)
          : [];

        const operation = {
          operation_name: operationName ? String(operationName).trim() : `Operation ${String(nopId).trim()}`,
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

      if (parts.length < 1) {
        errors.push(
          `Line ${index + 1}: Invalid format. Expected: NOP ID | Products (optional) OR Operation Name | NOP ID | Products (optional)`
        );
        return;
      }

      // Handle different input formats:
      // 1 part: NOP ID only
      // 2 parts: NOP ID | Products
      // 3+ parts: Operation Name | NOP ID | Products
      let operationName = "";
      let nopId = "";
      let productsRaw = "";

      if (parts.length === 1) {
        // Just NOP ID
        nopId = parts[0];
      } else if (parts.length === 2) {
        // NOP ID | Products
        nopId = parts[0];
        productsRaw = parts[1];
      } else {
        // Operation Name | NOP ID | Products
        operationName = parts[0];
        nopId = parts[1];
        productsRaw = parts[2] || "";
      }

      if (!nopId) {
        errors.push(`Line ${index + 1}: Missing required field (NOP ID)`);
        return;
      }

      const products = productsRaw
        ? productsRaw
            .split(",")
            .map((prod) => prod.trim())
            .filter((prod) => prod.length > 0)
        : [];

      const operation = {
        operation_name: operationName.trim() || `Operation ${nopId.trim()}`,
        nop_id: nopId.trim(),
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
