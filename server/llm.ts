import { Entity } from "@shared/schema";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.1:8b";
const VISION_MODEL = "llava:7b";

const CRIME_TYPES = [
  "Cyber Fraud", "Online Harassment", "Identity Theft", "Extortion",
  "Drug Trafficking", "Human Trafficking", "Financial Fraud", "Unauthorized Hacking",
  "Child Exploitation", "Terrorism", "Murder", "Theft", "Forgery",
  "Blackmail", "Ransomware Attack", "Phishing", "Stalking",
  "Sexual Harassment", "Money Laundering", "Impersonation", "Corporate Espionage",
  "Data Exfiltration", "Credential Theft",
];

// Coerce any value to a string
function toStr(val: any): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.map(v => String(v ?? "")).join("\n\n");
  return String(val ?? "");
}

// Coerce any value to a string array
function toStrArr(val: any): string[] {
  if (Array.isArray(val)) return val.map(v => String(v ?? "")).filter(Boolean);
  if (typeof val === "string" && val.trim()) return [val];
  return [];
}

const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export async function analyzeEvidence(text: string, entities: Entity[], evidenceType: string) {
  const nameEntities = entities.filter(e => e.type === "Name" || e.type === "Username").map(e => e.value);
  const amounts = entities.filter(e => e.type === "Amount").map(e => e.value);

  // Keyword-based crime type detection from evidence text
  const textLower = text.toLowerCase();
  let crimeHint = "";
  if (textLower.includes("exfiltrat") || textLower.includes("data theft") || textLower.includes("stolen data")) crimeHint = "Data Exfiltration";
  else if (textLower.includes("phishing") || textLower.includes("fake link") || textLower.includes("otp") || textLower.includes("fake sbi")) crimeHint = "Phishing";
  else if (textLower.includes("ransom")) crimeHint = "Ransomware Attack";
  else if (textLower.includes("blackmail") || textLower.includes("nude") || textLower.includes("expose")) crimeHint = "Blackmail";
  else if (textLower.includes("hack") || textLower.includes("brute force") || textLower.includes("port scan")) crimeHint = "Unauthorized Hacking";
  else if (textLower.includes("extort")) crimeHint = "Extortion";
  else if (textLower.includes("launder") || textLower.includes("mule account") || textLower.includes("xmr") || textLower.includes("monero")) crimeHint = "Money Laundering";
  else if (textLower.includes("impersonat") || textLower.includes("fake sim") || textLower.includes("fake id")) crimeHint = "Impersonation";
  else if (textLower.includes("stalk") || (textLower.includes("harass") && textLower.includes("online"))) crimeHint = "Online Harassment";
  else if (textLower.includes("corporate") || textLower.includes("intellectual property")) crimeHint = "Corporate Espionage";
  else if (textLower.includes("credential") || (textLower.includes("password") && textLower.includes("steal"))) crimeHint = "Credential Theft";
  else if (textLower.includes("scam") || textLower.includes("fraud") || textLower.includes("fake")) crimeHint = "Cyber Fraud";

  const prompt = `You are AXIS, a forensic analyst AI for Indian law enforcement.
Analyze the evidence and return a JSON object.

CRITICAL RULES:
1. "crime_type" MUST be exactly one of: [${CRIME_TYPES.join(", ")}]
   Best match for this evidence: "${crimeHint || "Cyber Fraud"}"
   NO commas, NO slash, NO "and" — exactly ONE value.
2. "summary" MUST be a single STRING with 3 paragraphs separated by \\n\\n. NOT an array.
3. "key_findings", "recommended_actions", "applicable_laws" MUST be arrays of strings.
4. All strings must start with a capital letter.
5. Be SPECIFIC — mention actual names (${nameEntities.slice(0, 3).join(", ") || "unknown"}), amounts (${amounts.slice(0, 3).join(", ") || "none found"}).
6. Return ONLY raw JSON. No markdown, no backticks, no text before or after.

Evidence type: ${evidenceType}
Entities: ${JSON.stringify(entities.slice(0, 20))}
Evidence text: ${text.substring(0, 3500)}

JSON format (copy this structure exactly):
{"risk_level":"High","risk_score":85,"crime_type":"${crimeHint || "Cyber Fraud"}","summary":"Paragraph one here.\\n\\nParagraph two here.\\n\\nParagraph three here.","key_findings":["Finding one","Finding two"],"recommended_actions":["Action one","Action two"],"applicable_laws":["IT Act Section 66C"]}`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        format: "json",
      }),
    });
    const data = await response.json();
    let raw = data.message.content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    // ── Sanitize all fields robustly ────────────────────────────────────────
    const result = {
      risk_level: toStr(parsed.risk_level) || "High",
      risk_score: Number(parsed.risk_score) || 75,
      crime_type: crimeHint || toStr(parsed.crime_type).split(/[,\/&+]/)[0].trim() || "Cyber Fraud",
      summary: toStr(parsed.summary) || "Analysis complete.",
      key_findings: toStrArr(parsed.key_findings).map(cap),
      recommended_actions: toStrArr(parsed.recommended_actions).map(cap),
      applicable_laws: toStrArr(parsed.applicable_laws).map(cap),
    };

    // Ensure arrays are never empty
    if (!result.key_findings.length) result.key_findings = ["Evidence analyzed — see summary for details."];
    if (!result.recommended_actions.length) result.recommended_actions = ["Refer case to cyber cell for further investigation."];
    if (!result.applicable_laws.length) result.applicable_laws = ["IT Act Section 66D"];

    return result;
  } catch (error) {
    console.error("Ollama analyzeEvidence error:", error);
    return {
      risk_level: "High",
      risk_score: 75,
      crime_type: crimeHint || "Cyber Fraud",
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
          content: `You are a forensic analyst. Read ALL text visible in this image carefully.

Extract and list EVERYTHING you can see:
1. SENDER/PARTICIPANT NAMES — list every name shown (chat bubble names, profile names, usernames)
2. ALL MESSAGE TEXT — transcribe every message word for word
3. PHONE NUMBERS — any number visible
4. URLs AND LINKS — copy exactly
5. AMOUNTS OF MONEY — any currency or amount
6. CRIMINAL CONTENT — threats, fraud, scam, fake links, suspicious requests
7. GROUP/CHAT NAME — name shown at top of chat
8. TIMESTAMPS — any dates or times visible
9. ANY OTHER TEXT — signs, watermarks, captions, labels

Be exhaustive. If you see a name label on a chat bubble, list it. Do not summarize — transcribe everything.`,
          images: [base64Image],
        }],
        stream: false,
      }),
    });
    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error("LLaVA error:", error);
    return "Could not analyze image. Ensure Ollama is running and llava:7b is pulled (ollama pull llava:7b).";
  }
}

export async function chatWithEvidence(message: string, entities: Entity[], text: string, chatHistory: any[]) {
  const systemPrompt = `You are AXIS, a forensic analyst AI for Indian law enforcement.
Answer ONLY based on the evidence below. Cite IT Act and IPC sections where applicable. Never invent facts.
Entities extracted from evidence: ${JSON.stringify(entities)}
Full evidence text: ${text.substring(0, 3000)}`;

  const messages = [
    { role: "user", content: systemPrompt },
    { role: "assistant", content: "Understood. I will only reference the provided evidence and cite Indian law sections where applicable." },
    ...chatHistory,
    { role: "user", content: message },
  ];

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, stream: false }),
    });
    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error("Ollama chat error:", error);
    return "Could not reach Ollama. Make sure it is running at http://localhost:11434.";
  }
}