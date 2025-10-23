import { chromium } from "playwright";
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
  const url = `https://organic.ams.usda.gov/Integrity/CP/OPP?nopid=${oidNumber}`;
  
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for the content to be rendered (wait for operation name to appear)
    await page.waitForSelector('text=Operation Name', { timeout: 10000 });
    
    // Extract operation name
    const operationName = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('strong, td, label'));
      for (const label of labels) {
        if (label.textContent?.includes('Operation Name')) {
          const parent = label.parentElement;
          const nextSibling = parent?.nextElementSibling;
          if (nextSibling) {
            return nextSibling.textContent?.trim() || "Not found";
          }
          const text = parent?.textContent || "";
          return text.replace("Operation Name:", "").trim() || "Not found";
        }
      }
      return "Not found";
    });
    
    // Extract certifier
    const certifier = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('strong, td, label'));
      for (const label of labels) {
        if (label.textContent?.includes('Certifier:')) {
          const parent = label.parentElement;
          const nextSibling = parent?.nextElementSibling;
          if (nextSibling) {
            return nextSibling.textContent?.trim() || "Not found";
          }
          const text = parent?.textContent || "";
          return text.replace("Certifier:", "").trim() || "Not found";
        }
      }
      return "Not found";
    });
    
    // Extract scopes from table
    const scopesData = await page.evaluate(() => {
      const scopes: Array<{
        scope_name: string;
        status: string;
        effective_date: string;
        certified_products: string;
      }> = [];
      
      const scopeNames = ["CROPS", "HANDLING", "LIVESTOCK", "WILD CROPS"];
      const rows = Array.from(document.querySelectorAll('table tr'));
      
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        
        if (cells.length >= 4) {
          const scopeCell = cells[1]?.textContent?.trim() || "";
          
          if (scopeNames.includes(scopeCell)) {
            const status = cells[2]?.textContent?.trim() || "Not found";
            const effectiveDate = cells[3]?.textContent?.trim() || "Not found";
            const productsText = cells[4]?.textContent?.trim() || "";
            
            scopes.push({
              scope_name: scopeCell,
              status: status === "--" || status === "N/A" ? "Not certified" : status,
              effective_date: effectiveDate === "N/A" ? "Not found" : effectiveDate,
              certified_products: productsText,
            });
          }
        }
      });
      
      return scopes;
    });
    
    await browser.close();
    
    // Process the scopes
    const scopes: Scope[] = [];
    const scopeNames = ["CROPS", "HANDLING", "LIVESTOCK", "WILD CROPS"];
    
    scopesData.forEach(scopeData => {
      const certifiedProducts: string[] = [];
      
      if (scopeData.certified_products && scopeData.certified_products !== "--") {
        // Split by commas, but not within parentheses
        const productList = scopeData.certified_products
          .split(/,(?![^()]*\))/)
          .map(p => p.trim());
        
        productList.forEach(product => {
          if (product && product.length > 2) {
            const normalized = normalizeProductName(product);
            if (normalized && !certifiedProducts.includes(normalized)) {
              certifiedProducts.push(normalized);
            }
          }
        });
      }
      
      scopes.push({
        scope_name: scopeData.scope_name,
        status: scopeData.status,
        effective_date: scopeData.effective_date,
        certified_products: certifiedProducts,
      });
    });
    
    // Add any missing scopes
    scopeNames.forEach(scopeName => {
      if (!scopes.find(s => s.scope_name === scopeName)) {
        scopes.push({
          scope_name: scopeName,
          status: "Not found",
          effective_date: "Not found",
          certified_products: [],
        });
      }
    });
    
    if (operationName === "Not found" && certifier === "Not found") {
      throw new Error(`No certification data found for NOP ID ${oidNumber}. The page may be empty or the NOP ID may be invalid.`);
    }
    
    return {
      operation_name: operationName,
      certifier,
      scopes,
    };
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    if (error instanceof Error) {
      console.error(`Error scraping NOP ID ${oidNumber}:`, error.message);
      throw new Error(`Failed to fetch USDA data for NOP ID ${oidNumber}: ${error.message}`);
    }
    
    throw new Error(`Failed to fetch USDA data for NOP ID ${oidNumber}: Unknown error`);
  }
}
