import { z } from "zod";

export const entitySchema = z.object({
  type: z.string(),
  value: z.string(),
  flagged: z.boolean(),
});

export type Entity = z.infer<typeof entitySchema>;

export const parseRequestSchema = z.object({
  text: z.string(),
  filename: z.string(),
  evidenceType: z.string(),
});

export const analyzeRequestSchema = z.object({
  text: z.string(),
  entities: z.array(entitySchema),
  evidenceType: z.string(),
});

export const analyzeResponseSchema = z.object({
  risk_level: z.enum(["Low", "Medium", "High", "Critical"]),
  risk_score: z.number(),
  crime_type: z.string(),
  summary: z.string(),
  key_findings: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  applicable_laws: z.array(z.string()),
});

export const chatRequestSchema = z.object({
  message: z.string(),
  entities: z.array(entitySchema),
  raw_text: z.string(),
  chat_history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

export const chatResponseSchema = z.object({
  reply: z.string(),
});
