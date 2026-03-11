import { Entity } from "@shared/schema";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.1:8b";
const VISION_MODEL = "llava:7b";

const CRIME_TYPES = [
  "Cyber Fraud","Online Harassment","Identity Theft","Extortion",
  "Drug Trafficking","Human Trafficking","Financial Fraud","Unauthorized Hacking",
  "Child Exploitation","Terrorism","Murder","Theft","Forgery",
  "Blackmail","Ransomware Attack","Phishing","Stalking",
  "Sexual Harassment","Money Laundering","Impersonation","Corporate Espionage",
  "Data Exfiltration","Credential Theft",
];

function toStr(val: any): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map(v => String(v ?? "")).join("\n\n");
  return String(val ?? "");
}
function toStrArr(val: any): string[] {
  if (Array.isArray(val)) return val.map(v => String(v ?? "")).filter(Boolean);
  if (typeof val === "string" && val.trim()) return [val];
  return [];
}
const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

function detectCrime(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("exfiltrat") || t.includes("data theft")) return "Data Exfiltration";
  if (t.includes("phishing") || t.includes("fake link") || t.includes("fake sbi")) return "Phishing";
  if (t.includes("ransom")) return "Ransomware Attack";
  if (t.includes("blackmail") || t.includes("nude")) return "Blackmail";
  if (t.includes("hack") || t.includes("brute force") || t.includes("port scan")) return "Unauthorized Hacking";
  if (t.includes("extort")) return "Extortion";
  if (t.includes("launder") || t.includes("mule account") || t.includes("xmr")) return "Money Laundering";
  if (t.includes("impersonat") || t.includes("fake sim")) return "Impersonation";
  if (t.includes("stalk") || (t.includes("harass") && t.includes("online"))) return "Online Harassment";
  if (t.includes("corporate") || t.includes("intellectual property")) return "Corporate Espionage";
  if (t.includes("credential") || (t.includes("password") && t.includes("steal"))) return "Credential Theft";
  if (t.includes("otp") || t.includes("scam") || t.includes("fraud") || t.includes("fake")) return "Cyber Fraud";
  return "Cyber Fraud";
}

export async function analyzeEvidence(text: string, entities: Entity[], evidenceType: string) {
  const crimeHint = detectCrime(text);

  // Slim entity summary — only key types, max 15 entities
  const keyEntities = entities
    .filter(e => ["Name","Phone","Email","IP Address","URL","UPI ID","Amount","Device ID"].includes(e.type))
    .slice(0, 15)
    .map(e => `${e.type}: ${e.value}`)
    .join(", ");

  // Trim evidence text — 2000 chars is enough for most cases
  const evidenceSnippet = text.substring(0, 2000);

  const prompt = `You are AXIS, a forensic AI for Indian law enforcement. Analyze the evidence and return JSON only.

Crime type: "${crimeHint}" (use exactly this unless evidence clearly shows another from: ${CRIME_TYPES.join(", ")})
Key entities: ${keyEntities || "none extracted"}
Evidence (${evidenceType}): ${evidenceSnippet}

Rules: Be specific, cite actual entity values. No fabrication. Neutral tone. No guilt declaration.

Summary must use this exact structure separated by \\n\\n:
"OVERVIEW:\\n[what happened, who involved]\\n\\nEVIDENCE PROVIDED:\\n[what each evidence confirms]\\n\\nFINDINGS:\\n[patterns, relationships, contradictions]\\n\\nLEGAL RELEVANCE:\\n[which Indian law sections apply and why]"

Return ONLY this JSON:
{"risk_level":"High","risk_score":85,"crime_type":"${crimeHint}","summary":"OVERVIEW:\\n...\\n\\nEVIDENCE PROVIDED:\\n...\\n\\nFINDINGS:\\n...\\n\\nLEGAL RELEVANCE:\\n...","key_findings":["finding with entity","finding with timestamp"],"recommended_actions":["specific action","specific action"],"applicable_laws":["IT Act Section X — reason","IPC Section Y — reason"]}`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        format: "json",
        options: {
          num_predict: 800,
          temperature: 0.2,
          top_p: 0.9,
        },
      }),
    });
    const data = await response.json();
    if (!data?.message?.content) throw new Error("Empty Ollama response");
    const parsed = JSON.parse(data.message.content.replace(/```json|```/g, "").trim());

    const result = {
      risk_level: toStr(parsed.risk_level) || "High",
      risk_score: Number(parsed.risk_score) || 75,
      crime_type: crimeHint || toStr(parsed.crime_type).split(/[,\/&+]/)[0].trim() || "Cyber Fraud",
      summary: toStr(parsed.summary) || "Analysis complete.",
      key_findings: toStrArr(parsed.key_findings).map(cap),
      recommended_actions: toStrArr(parsed.recommended_actions).map(cap),
      applicable_laws: toStrArr(parsed.applicable_laws).map(cap),
    };

    if (!result.key_findings.length) result.key_findings = ["Evidence analyzed — see summary for details."];
    if (!result.recommended_actions.length) result.recommended_actions = ["Refer case to cyber cell for further investigation."];
    if (!result.applicable_laws.length) result.applicable_laws = ["IT Act Section 66D"];

    return result;
  } catch (error) {
    console.error("Ollama analyzeEvidence error:", error);
    return {
      risk_level: "High",
      risk_score: 75,
      crime_type: crimeHint,
      summary: "Could not reach Ollama. Ensure it is running and llama3.1:8b is pulled.",
      key_findings: ["Ollama unreachable or returned invalid JSON."],
      recommended_actions: ["Start Ollama.", "Run: ollama pull llama3.1:8b"],
      applicable_laws: ["IT Act Section 66D"],
    };
  }
}

export async function analyzeImage(base64Image: string, mimeType: string): Promise<string> {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: "user",
          content: `Forensic image analysis. Extract and list everything visible:
1. NAMES — all names on chat bubbles, profiles, labels
2. MESSAGES — transcribe every message exactly
3. PHONES — every number visible
4. URLS — copy exactly character by character
5. AMOUNTS — any money or transaction values
6. SUSPICIOUS CONTENT — threats, fake links, fraud
7. CHAT NAME — name at top of screen
8. TIMESTAMPS — all dates and times
9. ANY OTHER TEXT — signs, watermarks, captions

Transcribe everything. Do not summarize.`,
          images: [base64Image],
        }],
        stream: false,
        options: { num_predict: 600, temperature: 0.1 },
      }),
    });
    const data = await response.json();
    return data?.message?.content || "Image could not be analyzed — Ollama may be offline.";
  } catch (error) {
    console.error("LLaVA error:", error);
    return "Could not analyze image. Ensure Ollama is running and llava:7b is pulled.";
  }
}

export async function chatWithEvidence(message: string, entities: Entity[], text: string, chatHistory: any[]) {
  // Slim entity list for chat context
  const entitySummary = entities
    .filter(e => ["Name","Phone","Email","IP Address","URL","UPI ID","Amount"].includes(e.type))
    .slice(0, 20)
    .map(e => `${e.type}: ${e.value}`)
    .join("\n");

  const systemPrompt = `You are AXIS, a forensic analyst for Indian law enforcement.
Answer only from the evidence below. Never invent facts. Plain prose only — no asterisks, no bullets, no markdown.
Cite IT Act / IPC sections where relevant. Reference specific entity values in answers.
If unanswerable from evidence, say so explicitly.

Entities: ${entitySummary}
Evidence: ${text.substring(0, 2000)}`;

  const messages = [
    { role: "user", content: systemPrompt },
    { role: "assistant", content: "Understood. I will answer only from the provided evidence using plain prose and cite Indian law where applicable." },
    ...chatHistory.slice(-6),
    { role: "user", content: message },
  ];

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        options: { num_predict: 400, temperature: 0.3 },
      }),
    });
    const data = await response.json();
    return data?.message?.content || "Could not reach Ollama.";
  } catch (error) {
    console.error("Ollama chat error:", error);
    return "Could not reach Ollama. Make sure it is running at http://localhost:11434.";
  }
}