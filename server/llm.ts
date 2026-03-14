import { Entity } from "@shared/schema";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "phi3:mini";
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

  const keyEntities = entities
    .filter(e => ["Name","Phone","Email","IP Address","URL","UPI ID","Amount","Device ID"].includes(e.type))
    .slice(0, 12)
    .map(e => `${e.type}: ${e.value}`)
    .join(", ");

  const evidenceSnippet = text.substring(0, 1200);

  const prompt = `You are a forensic AI for Indian law enforcement. Return a single JSON object only. No explanation, no markdown, no extra text.

Evidence type: ${evidenceType}
Crime: ${crimeHint}
Entities: ${keyEntities || "none"}
Text: ${evidenceSnippet}

INVESTIGATION RULES:
1. Base all analysis strictly on the provided evidence. Do not fabricate facts, entities, events, or relationships.
2. Maintain a neutral investigative tone. Do not declare guilt. Distinguish confirmed facts from observations.
3. Extract key intelligence: names, phones, emails, IPs, locations, timestamps, accounts, transactions, patterns.

Fill every [...] with real content from the evidence. Be specific — use actual names, values, and entity references.

{
  "risk_level": "High",
  "risk_score": 80,
  "crime_type": "${crimeHint}",
  "summary": "OVERVIEW:\\n[1-2 sentences: what incident occurred, when, and who is involved — use actual names and entities]\\n\\nEVIDENCE PROVIDED:\\n[1-2 sentences: what each submitted file or log confirms — reference specific evidence types]\\n\\nSUSPECT ACTIVITY:\\n[1-2 sentences: what each named suspect specifically did, their role, and any coordination between them]\\n\\nFINDINGS:\\n[1-2 sentences: suspicious patterns, contradictions, or relationships between entities found in evidence]\\n\\nINVESTIGATIVE LEADS:\\n[1-2 sentences: specific accounts to freeze, devices to seize, IPs to trace, or witnesses to contact — from evidence only]\\n\\nLEGAL RELEVANCE:\\n[1-2 sentences: which Indian IT Act or IPC sections apply and exactly why based on the evidence]",
  "key_findings": [
    "[specific finding naming an entity, amount, or account from evidence]",
    "[specific finding naming a device, IP, or URL from evidence]",
    "[specific finding about a suspicious action or coordinated pattern]",
    "[specific finding about timeline or relationship between suspects]"
  ],
  "applicable_laws": [
    "[IT Act or IPC section — one sentence why it applies based on evidence]",
    "[IT Act or IPC section — one sentence why it applies based on evidence]"
  ]
}`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        format: "json",
        options: { num_predict: 1100, temperature: 0.15, top_p: 0.9 },
      }),
    });
    const data = await response.json();
    if (!data?.message?.content) throw new Error("Empty Ollama response");
    const parsed = JSON.parse(data.message.content.replace(/```json|```/g, "").trim());

    // Strip leaked JSON keys phi3 sometimes appends to the summary
    const cleanSummary = toStr(parsed.summary)
      .replace(/key_findings:[\s\S]*$/i, "")
      .replace(/applicable_laws:[\s\S]*$/i, "")
      .replace(/recommended_actions:[\s\S]*$/i, "")
      .trim();

    const result = {
      risk_level: toStr(parsed.risk_level) || "High",
      risk_score: Number(parsed.risk_score) || 75,
      crime_type: crimeHint || toStr(parsed.crime_type).split(/[,\/&+]/)[0].trim() || "Cyber Fraud",
      summary: cleanSummary || "Analysis complete.",
      key_findings: toStrArr(parsed.key_findings).map(cap),
      recommended_actions: ["Refer case to cyber cell for further investigation."],
      applicable_laws: toStrArr(parsed.applicable_laws).map(cap),
    };

    // Smart fallback — extract findings from summary sections if phi3 returned empty array
    if (!result.key_findings.length || result.key_findings[0].toLowerCase().includes("evidence analyzed")) {
      const findings: string[] = [];
      const blocks = cleanSummary.split("\n\n");
      for (const block of blocks) {
        const colonIdx = block.indexOf(":\n");
        if (colonIdx === -1) continue;
        const heading = block.substring(0, colonIdx).trim().toUpperCase();
        const body = block.substring(colonIdx + 2).trim();
        if (!body) continue;
        if (heading === "SUSPECT ACTIVITY") findings.push(body);
        if (heading === "INVESTIGATIVE LEADS") findings.push(body);
        if (heading === "OVERVIEW" && findings.length === 0) findings.push(body);
      }
      // Also pull entity-based findings
      const names = keyEntities.split(", ").filter(e => e.startsWith("Name:")).map(e => e.replace("Name:", "").trim());
      const phones = keyEntities.split(", ").filter(e => e.startsWith("Phone:")).map(e => e.replace("Phone:", "").trim());
      const urls = keyEntities.split(", ").filter(e => e.startsWith("URL:")).map(e => e.replace("URL:", "").trim());
      const ips = keyEntities.split(", ").filter(e => e.startsWith("IP Address:")).map(e => e.replace("IP Address:", "").trim());
      if (phones.length) findings.push(`Suspect phone number${phones.length > 1 ? "s" : ""} identified: ${phones.join(", ")}`);
      if (urls.length) findings.push(`Suspicious URL detected: ${urls[0]}`);
      if (ips.length) findings.push(`IP address traced: ${ips[0]}`);
      if (findings.length) result.key_findings = findings.map(cap);
    }

    if (!result.key_findings.length) result.key_findings = ["Evidence analyzed — see summary for details."];
    if (!result.applicable_laws.length) result.applicable_laws = ["IT Act Section 66D — cybercrimes and digital offences"];

    return result;
  } catch (error) {
    console.error("Ollama analyzeEvidence error:", error);
    return {
      risk_level: "High",
      risk_score: 75,
      crime_type: crimeHint,
      summary: "Could not reach Ollama. Ensure it is running and phi3:mini is pulled.",
      key_findings: ["Ollama unreachable or returned invalid JSON."],
      recommended_actions: ["Start Ollama.", "Run: ollama pull phi3:mini"],
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
          content: `You are a forensic image analyst. Carefully examine this image and extract everything visible.

Report the following sections:

NAMES — every name on chat bubbles, profile headers, labels, or captions
MESSAGES — transcribe every message word for word exactly as shown
PHONE NUMBERS — every number visible including partial ones
URLS AND LINKS — copy character by character exactly as shown
MONETARY AMOUNTS — any currency values or transaction figures
SUSPICIOUS CONTENT — threats, fake links, fraud indicators, impersonation
CHAT OR GROUP NAME — name shown at top of screen
TIMESTAMPS — all dates and times visible
ENVIRONMENT AND LOCATION — identify any place names, landmark names, street signs, shop names, area names, or environmental clues visible in background or context of the image
DEVICE OR PLATFORM — app name, OS indicators, status bar details
OTHER TEXT — watermarks, system messages, notifications, any remaining text

Transcribe everything exactly. Do not summarize or interpret. Label each section clearly.`,
          images: [base64Image],
        }],
        stream: false,
        options: { num_predict: 700, temperature: 0.1 },
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
  const entitySummary = entities
    .filter(e => ["Name","Phone","Email","IP Address","URL","UPI ID","Amount"].includes(e.type))
    .slice(0, 20)
    .map(e => `${e.type}: ${e.value}`)
    .join("\n");

  const systemPrompt = `You are AXIS, a forensic analyst for Indian law enforcement.
Answer only from the evidence below. Never invent facts. Plain prose only — no asterisks, no bullets, no markdown symbols.
Cite IT Act or IPC sections where relevant. Reference specific entity values in your answers.
If the question cannot be answered from the evidence, say so explicitly.

Entities:
${entitySummary}

Evidence:
${text.substring(0, 2000)}`;

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