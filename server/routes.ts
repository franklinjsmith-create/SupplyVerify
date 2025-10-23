import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { randomBytes } from "crypto";
import { parseCSV, parseXLSX, parseTextInput } from "./services/file-parser";
import { verifySuppliers, getProgress, initializeSession } from "./services/verification-service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const isValid = allowedExtensions.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV and XLSX files are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/verify", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileName = req.file.originalname.toLowerCase();
      const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      
      let parseResult;
      if (isExcel) {
        parseResult = parseXLSX(req.file.buffer);
      } else {
        const fileContent = req.file.buffer.toString("utf-8");
        parseResult = parseCSV(fileContent);
      }

      if (parseResult.errors.length > 0 && parseResult.suppliers.length === 0) {
        return res.status(400).json({
          error: "Failed to parse file",
          details: parseResult.errors,
        });
      }

      if (parseResult.errors.length > 0) {
        console.warn("Parsing warnings:", parseResult.errors);
      }

      const sessionId = randomBytes(16).toString("hex");
      initializeSession(sessionId, parseResult.suppliers.length);

      verifySuppliers(parseResult.suppliers, sessionId).catch((error) => {
        console.error("Background verification error:", error);
      });

      res.json({ sessionId, total: parseResult.suppliers.length });
    } catch (error) {
      console.error("Error processing file upload:", error);
      res.status(500).json({
        error: "Failed to process file",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/verify-text", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text provided" });
      }

      const parseResult = parseTextInput(text);

      if (parseResult.errors.length > 0 && parseResult.suppliers.length === 0) {
        return res.status(400).json({
          error: "Failed to parse text",
          details: parseResult.errors,
        });
      }

      if (parseResult.errors.length > 0) {
        console.warn("Parsing warnings:", parseResult.errors);
      }

      const sessionId = randomBytes(16).toString("hex");
      initializeSession(sessionId, parseResult.suppliers.length);

      verifySuppliers(parseResult.suppliers, sessionId).catch((error) => {
        console.error("Background verification error:", error);
      });

      res.json({ sessionId, total: parseResult.suppliers.length });
    } catch (error) {
      console.error("Error processing text input:", error);
      res.status(500).json({
        error: "Failed to process text",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/progress/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const progress = getProgress(sessionId);
    
    if (!progress) {
      return res.status(404).json({ error: "Session not found or expired" });
    }
    
    res.json(progress);
  });

  const httpServer = createServer(app);

  return httpServer;
}
