import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supplierInputSchema } from "@shared/schema";
import type { SupplierInput } from "@shared/schema";

export interface ParsedSupplierData {
  suppliers: SupplierInput[];
  errors: string[];
}

export function parseCSV(fileContent: string): ParsedSupplierData {
  const suppliers: SupplierInput[] = [];
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
      const supplierName = row.supplier_name || row.supplier || "";
      const oidNumber = row.oid_number || row.oid || row.oid_num || "";
      const ingredientsRaw = row.ingredients || row.ingredient || "";

      if (!supplierName || !oidNumber || !ingredientsRaw) {
        errors.push(
          `Row ${index + 1}: Missing required fields (Supplier Name, OID Number, or Ingredients)`
        );
        return;
      }

      const ingredients = ingredientsRaw
        .split(",")
        .map((ing: string) => ing.trim())
        .filter((ing: string) => ing.length > 0);

      if (ingredients.length === 0) {
        errors.push(`Row ${index + 1}: No valid ingredients found`);
        return;
      }

      const supplier = {
        supplier_name: supplierName.trim(),
        oid_number: oidNumber.trim(),
        ingredients,
      };

      const validation = supplierInputSchema.safeParse(supplier);
      if (!validation.success) {
        errors.push(`Row ${index + 1}: Validation failed - ${validation.error.message}`);
        return;
      }

      suppliers.push(supplier);
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  return { suppliers, errors };
}

export function parseXLSX(fileBuffer: Buffer): ParsedSupplierData {
  const suppliers: SupplierInput[] = [];
  const errors: string[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    
    if (workbook.SheetNames.length === 0) {
      errors.push("XLSX file contains no sheets");
      return { suppliers, errors };
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

        const supplierName = normalizedRow.supplier_name || normalizedRow.supplier || "";
        const oidNumber = normalizedRow.oid_number || normalizedRow.oid || normalizedRow.oid_num || "";
        const ingredientsRaw = normalizedRow.ingredients || normalizedRow.ingredient || "";

        if (!supplierName || !oidNumber || !ingredientsRaw) {
          errors.push(
            `Row ${index + 2}: Missing required fields (Supplier Name, OID Number, or Ingredients)`
          );
          return;
        }

        const ingredients = String(ingredientsRaw)
          .split(",")
          .map((ing: string) => ing.trim())
          .filter((ing: string) => ing.length > 0);

        if (ingredients.length === 0) {
          errors.push(`Row ${index + 2}: No valid ingredients found`);
          return;
        }

        const supplier = {
          supplier_name: String(supplierName).trim(),
          oid_number: String(oidNumber).trim(),
          ingredients,
        };

        const validation = supplierInputSchema.safeParse(supplier);
        if (!validation.success) {
          errors.push(`Row ${index + 2}: Validation failed - ${validation.error.message}`);
          return;
        }

        suppliers.push(supplier);
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });

    return { suppliers, errors };
  } catch (error) {
    errors.push(`XLSX parsing error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { suppliers, errors };
  }
}

export function parseTextInput(text: string): ParsedSupplierData {
  const suppliers: SupplierInput[] = [];
  const errors: string[] = [];

  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  lines.forEach((line, index) => {
    try {
      const parts = line.split("|").map((part) => part.trim());

      if (parts.length < 3) {
        errors.push(
          `Line ${index + 1}: Invalid format. Expected: Supplier Name | OID Number | Ingredients`
        );
        return;
      }

      const [supplierName, oidNumber, ingredientsRaw] = parts;

      if (!supplierName || !oidNumber || !ingredientsRaw) {
        errors.push(`Line ${index + 1}: Missing required fields`);
        return;
      }

      const ingredients = ingredientsRaw
        .split(",")
        .map((ing) => ing.trim())
        .filter((ing) => ing.length > 0);

      if (ingredients.length === 0) {
        errors.push(`Line ${index + 1}: No valid ingredients found`);
        return;
      }

      const supplier = {
        supplier_name: supplierName,
        oid_number: oidNumber,
        ingredients,
      };

      const validation = supplierInputSchema.safeParse(supplier);
      if (!validation.success) {
        errors.push(`Line ${index + 1}: Validation failed - ${validation.error.message}`);
        return;
      }

      suppliers.push(supplier);
    } catch (error) {
      errors.push(`Line ${index + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  return { suppliers, errors };
}
