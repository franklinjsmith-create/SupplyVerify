import axios from "axios";
import * as cheerio from "cheerio";
import type { Scope } from "@shared/schema";

export interface CertificationData {
  operation_name: string;
  certifier: string;
  scopes: Scope[];
}

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[*\u00a0]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function scrapeUSDAPage(oidNumber: string): Promise<CertificationData> {
  const url = `https://organic.ams.usda.gov/Integrity/Operations/Details?operationId=${oidNumber}`;

  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      validateStatus: (status) => status < 500,
    });

    if (response.status === 404) {
      throw new Error(`OID ${oidNumber} not found in USDA database`);
    }

    if (response.status !== 200) {
      throw new Error(`USDA server returned status ${response.status} for OID ${oidNumber}`);
    }

    const $ = cheerio.load(response.data);

    const operationName =
      $('h1:contains("Operation Name")').next().text().trim() ||
      $('label:contains("Operation Name")').next().text().trim() ||
      $('dt:contains("Operation Name")').next().text().trim() ||
      $('div:contains("Operation Name")').first().text().replace("Operation Name", "").trim() ||
      "Not found";

    const certifier =
      $('h3:contains("Certifier")').next().text().trim() ||
      $('label:contains("Certifier")').next().text().trim() ||
      $('dt:contains("Certifier")').next().text().trim() ||
      $('strong:contains("Certifier")').parent().text().replace("Certifier", "").trim() ||
      "Not found";

    const scopes: Scope[] = [];

    const scopeNames = ["CROPS", "HANDLING", "LIVESTOCK", "WILD CROPS"];

    scopeNames.forEach((scopeName) => {
      const scopeSection = $(`h3:contains("${scopeName}"), h4:contains("${scopeName}")`).first();

      if (scopeSection.length > 0) {
        const container = scopeSection.parent();

        const statusText =
          container.find('span:contains("Status")').text() ||
          container.find('label:contains("Status")').next().text() ||
          container.find('dt:contains("Status")').next().text() ||
          "Not found";

        const status = statusText.includes("Certified") ? "Certified" : "Not found";

        const dateText =
          container.find('span:contains("Effective Date")').text() ||
          container.find('label:contains("Effective Date")').next().text() ||
          container.find('dt:contains("Effective Date")').next().text() ||
          "Not found";

        const effectiveDate = dateText.replace("Effective Date:", "").trim() || "Not found";

        const certifiedProducts: string[] = [];
        
        container.find("ul li, table td").each((_, element) => {
          const text = $(element).text().trim();
          if (text && text.length > 2 && !text.includes("Status") && !text.includes("Effective")) {
            const normalized = normalizeProductName(text);
            if (normalized && !certifiedProducts.includes(normalized)) {
              certifiedProducts.push(normalized);
            }
          }
        });

        container.find("p").each((_, element) => {
          const text = $(element).text().trim();
          if (text && !text.includes("Status") && !text.includes("Effective")) {
            const items = text.split(/[,;]/).map((item) => normalizeProductName(item));
            items.forEach((item) => {
              if (item && item.length > 2 && !certifiedProducts.includes(item)) {
                certifiedProducts.push(item);
              }
            });
          }
        });

        scopes.push({
          scope_name: scopeName,
          status,
          effective_date: effectiveDate,
          certified_products: certifiedProducts,
        });
      } else {
        scopes.push({
          scope_name: scopeName,
          status: "Not found",
          effective_date: "Not found",
          certified_products: [],
        });
      }
    });

    if (operationName === "Not found" && certifier === "Not found") {
      throw new Error(`No certification data found for OID ${oidNumber}. The page may be empty or the OID may be invalid.`);
    }

    return {
      operation_name: operationName,
      certifier,
      scopes,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error scraping OID ${oidNumber}:`, error.message);
      throw new Error(`Failed to fetch USDA data for OID ${oidNumber}: ${error.message}`);
    }
    
    throw new Error(`Failed to fetch USDA data for OID ${oidNumber}: Unknown error`);
  }
}
