import { z } from "zod";
import {
  parseRequestSchema,
  entitySchema,
  analyzeRequestSchema,
  analyzeResponseSchema,
  chatRequestSchema,
  chatResponseSchema,
} from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  analysis: {
    parse: {
      method: "POST" as const,
      path: "/api/parse" as const,
      input: parseRequestSchema,
      responses: {
        200: z.object({ entities: z.array(entitySchema) }),
        500: errorSchemas.internal,
      },
    },
    analyze: {
      method: "POST" as const,
      path: "/api/analyze" as const,
      input: analyzeRequestSchema,
      responses: {
        200: analyzeResponseSchema,
        500: errorSchemas.internal,
      },
    },
    chat: {
      method: "POST" as const,
      path: "/api/chat" as const,
      input: chatRequestSchema,
      responses: {
        200: chatResponseSchema,
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
