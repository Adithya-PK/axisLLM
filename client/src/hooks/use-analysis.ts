import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { z } from "zod";

export function useParseEvidence() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.analysis.parse.input>) => {
      const validated = api.analysis.parse.input.parse(data);
      const res = await fetch(api.analysis.parse.path, {
        method: api.analysis.parse.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        throw new Error("Failed to parse evidence");
      }
      
      const json = await res.json();
      return api.analysis.parse.responses[200].parse(json);
    },
  });
}

export function useAnalyzeEvidence() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.analysis.analyze.input>) => {
      const validated = api.analysis.analyze.input.parse(data);
      const res = await fetch(api.analysis.analyze.path, {
        method: api.analysis.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        throw new Error("Failed to analyze evidence");
      }
      
      const json = await res.json();
      return api.analysis.analyze.responses[200].parse(json);
    },
  });
}

export function useChat() {
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.analysis.chat.input>) => {
      const validated = api.analysis.chat.input.parse(data);
      const res = await fetch(api.analysis.chat.path, {
        method: api.analysis.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) {
        throw new Error("Failed to generate chat response");
      }
      
      const json = await res.json();
      return api.analysis.chat.responses[200].parse(json);
    },
  });
}
