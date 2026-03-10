import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { parseEvidence } from "./parser";
import { analyzeEvidence, chatWithEvidence, analyzeImage } from "./llm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Parse entities from text ──────────────────────────────────────────────
  app.post(api.analysis.parse.path, async (req, res) => {
    try {
      const input = api.analysis.parse.input.parse(req.body);
      const entities = parseEvidence(input.text);
      res.json({ entities });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error parsing evidence" });
    }
  });

  // ── Analyze evidence with LLM ─────────────────────────────────────────────
  app.post(api.analysis.analyze.path, async (req, res) => {
    try {
      const input = api.analysis.analyze.input.parse(req.body);
      const analysis = await analyzeEvidence(input.text, input.entities, input.evidenceType);
      res.json(analysis);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error analyzing evidence" });
    }
  });

  // ── Chat with evidence ────────────────────────────────────────────────────
  app.post(api.analysis.chat.path, async (req, res) => {
    try {
      const input = api.analysis.chat.input.parse(req.body);
      const reply = await chatWithEvidence(input.message, input.entities, input.raw_text, input.chat_history);
      res.json({ reply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error in chat" });
    }
  });

  // ── Image analysis via Moondream ──────────────────────────────────────────
  app.post("/api/analysis/image", async (req, res) => {
    try {
      const { base64Image, mimeType } = req.body;
      if (!base64Image) return res.status(400).json({ message: "No image data provided" });
      const description = await analyzeImage(base64Image, mimeType || "image/jpeg");
      res.json({ description });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error analyzing image" });
    }
  });

  // ── PDF text extraction via pdf-parse ─────────────────────────────────────
  app.post("/api/analysis/pdf", async (req, res) => {
    try {
      const { base64PDF } = req.body;
      if (!base64PDF) return res.status(400).json({ message: "No PDF data provided" });

      const pdfParse = require("pdf-parse");
      const buffer = Buffer.from(base64PDF, "base64");
      const result = await pdfParse(buffer);
      res.json({ text: result.text, pages: result.numpages });
    } catch (err) {
      console.error("PDF parse error:", err);
      res.status(500).json({ message: "Error extracting PDF text" });
    }
  });

  return httpServer;
}