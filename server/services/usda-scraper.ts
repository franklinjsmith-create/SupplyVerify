import { chromium } from "playwright";
import type { Scope } from "@shared/schema";

export interface CertificationData {
  operation_name: string;
  certifier: string;
  effective_date: string;
  all_certified_products: string[];
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
    
    // CRITICAL: Wait for the scope table to fully load (Blazor renders this after operation name)
    // Wait for at least one scope name to appear in the table, indicating products data is rendered
    await page.waitForFunction(() => {
      const allText = document.body.textContent || '';
      return allText.includes('CROPS') || allText.includes('HANDLING') || 
             allText.includes('LIVESTOCK') || allText.includes('WILD CROPS');
    }, { timeout: 15000 });
    
    // Additional stability wait: ensure the DOM has settled after Blazor updates (optimized from 1500ms)
    await page.waitForTimeout(500);
    
    // Extract operation name and certifier from the page
    const pageData = await page.evaluate(() => {
      let operationName = "Not found";
      let certifier = "Not found";
      
      // Find all text nodes and elements
      const allElements = Array.from(document.querySelectorAll('*'));
      
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        const text = element.textContent?.trim() || "";
        
        // Look for "Operation Name:" label
        if (text.includes('Operation Name:') && element.nextElementSibling) {
          const nextText = element.nextElementSibling.textContent?.trim();
          if (nextText && nextText.length > 0) {
            operationName = nextText.replace(/^["']|["']$/g, '');
          }
        }
        
        // Look for "Certifier:" label  
        if (text.includes('Certifier:') && element.nextElementSibling) {
          const nextText = element.nextElementSibling.textContent?.trim();
          if (nextText && nextText.length > 0) {
            // Extract certifier name from format like "[EKOAGROS] Ekoagros"
            const match = nextText.match(/\[([^\]]+)\]\s*(.+)/);
            if (match && match[2]) {
              certifier = match[2].trim();
            } else {
              certifier = nextText;
            }
          }
        }
      }
      
      return { operationName, certifier };
    });
    
    const operationName = pageData.operationName;
    const certifier = pageData.certifier;
    
    // Extract scopes from table
    const scopesData = await page.evaluate(() => {
      const scopes: Array<{
        scope_name: string;
        status: string;
        effective_date: string;
        certified_products: string;
      }> = [];
      
      const scopeNames = ["CROPS", "HANDLING", "LIVESTOCK", "WILD CROPS"];
      const tables = Array.from(document.querySelectorAll('table'));
      
      // Find the table that contains scope information
      for (const table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'));
        
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          
          // Look for rows with scope names
          for (let i = 0; i < cells.length; i++) {
            const cellText = cells[i]?.textContent?.trim() || "";
            
            if (scopeNames.includes(cellText)) {
              // Found a scope row - extract data from this and following cells
              const scopeName = cellText;
              const status = cells[i + 1]?.textContent?.trim() || "Not found";
              const effectiveDate = cells[i + 2]?.textContent?.trim() || "Not found";
              const productsText = cells[i + 3]?.textContent?.trim() || "";
              
              scopes.push({
                scope_name: scopeName,
                status: status === "--" || status === "N/A" ? "Not certified" : status,
                effective_date: effectiveDate === "N/A" ? "Not found" : effectiveDate,
                certified_products: productsText,
              });
              break; // Move to next row
            }
          }
        });
      }
      
      return scopes;
    });
    
    await browser.close();
    
    // Process the scopes
    const scopes: Scope[] = [];
    const scopeNames = ["CROPS", "HANDLING", "LIVESTOCK", "WILD CROPS"];
    
    scopesData.forEach(scopeData => {
      const certifiedProducts: string[] = [];
      
      if (scopeData.certified_products && scopeData.certified_products !== "--") {
        // USDA format: "Category1: item1, item2; Category2: item3, item4"
        // Track normalized names to prevent duplicates
        const normalizedSet = new Set<string>();
        
        // Split by semicolons first (separates major category groups)
        let categoryGroups = scopeData.certified_products.split(';');
        
        // If no semicolons, try newlines as fallback (replace array, don't mutate)
        if (categoryGroups.length === 1 && scopeData.certified_products.includes('\n')) {
          categoryGroups = scopeData.certified_products.split(/[\n\r]+/).filter(g => g.trim());
        }
        
        categoryGroups.forEach(group => {
          const trimmedGroup = group.trim();
          if (!trimmedGroup) return;
          
          // Check if this group has a category prefix (e.g., "Extracts/Flavors: ...")
          // Split at the first colon to separate category from items
          const colonIndex = trimmedGroup.indexOf(':');
          let itemsText = trimmedGroup;
          
          if (colonIndex > 0) {
            // Extract items after the colon
            itemsText = trimmedGroup.substring(colonIndex + 1).trim();
          }
          
          // Split items by commas (but not within parentheses)
          const items = itemsText.split(/,(?![^()]*\))/);
          
          items.forEach(item => {
            const trimmedItem = item.trim();
            if (trimmedItem && trimmedItem.length > 2) {
              // Normalize for deduplication only
              const normalized = normalizeProductName(trimmedItem);
              if (normalized && !normalizedSet.has(normalized)) {
                normalizedSet.add(normalized);
                // Store ORIGINAL text for display (preserves parentheses)
                certifiedProducts.push(trimmedItem);
              }
            }
          });
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
    
    // Collect all certified products from all scopes
    const allCertifiedProducts: string[] = [];
    scopes.forEach(scope => {
      scope.certified_products.forEach(product => {
        if (!allCertifiedProducts.includes(product)) {
          allCertifiedProducts.push(product);
        }
      });
    });
    
    // Find the earliest effective date across all scopes
    let earliestDate = "Not found";
    const validDates = scopes
      .map(s => s.effective_date)
      .filter(d => d !== "Not found" && d !== "N/A");
    
    if (validDates.length > 0) {
      // Sort dates and take the earliest one
      const sortedDates = validDates.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      });
      earliestDate = sortedDates[0];
    }
    
    return {
      operation_name: operationName,
      certifier,
      effective_date: earliestDate,
      all_certified_products: allCertifiedProducts,
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
