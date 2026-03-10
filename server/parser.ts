import { Entity } from "@shared/schema";

// ── Constants ────────────────────────────────────────────────────────────────

const INDIAN_CITIES = new Set([
  "Mumbai","Delhi","Bangalore","Hyderabad","Ahmedabad","Chennai","Kolkata",
  "Surat","Pune","Jaipur","Lucknow","Kanpur","Nagpur","Indore","Thane",
  "Bhopal","Visakhapatnam","Patna","Vadodara","Coimbatore","Madurai","Nashik",
  "Faridabad","Meerut","Rajkot","Agra","Varanasi","Srinagar","Aurangabad",
  "Vadapalani","Noida","Gurgaon","Ghaziabad","Chandigarh","Mysore","Bhubaneswar",
]);

const CRIME_KEYWORDS = [
  "threat","kill","leak","blackmail","extort","hack","fake","fraud","illegal",
  "maal","supari","payment","transfer","account","password","otp","nude","photo",
  "video","money","cash","ransom","demand","rape","murder","kidnap","drugs",
  "weapon","bomb","explosive","terror","attack","scam","phishing","malware",
  "revenge","expose","threaten","bribe","corrupt","trafficking","stolen","steal",
  "exfiltrate","exfiltration","breach","intrusion","unauthorized","clone","cloned",
  "mule account","fake link","fake sim","bank account","login","credentials",
  "brute force","port scan","data theft","dark web","fake id","money laundering",
];

// Exact full phrases that are NEVER names (lowercase)
const PHRASE_BLACKLIST = new Set([
  "hacker forger","chat name","chat export","new investigation","case reference",
  "credentials submitted","cash transfer","chrome mobile","android device",
  "status success","action taken","protocol https","protocol http",
  "key findings","threat level","crime type","executive summary",
  "recommended actions","applicable laws","witness statement","witness details",
  "incident type","reported date","witness name","witness signature",
  "cyber fraud","online phishing","financial fraud","india state bank",
  "state bank","reserve bank","security team","sbi security","sbi update",
  "chrome mobile","firefox mobile","mobile browser","android device",
  "device id","source ip","destination url","timestamp utc",
  "case id","contact number","occupation student","reported by",
  "upload evidence","analysis complete","offline mode","local llm","air gapped",
  "forensic platform","evidence ingestion","start intelligence",
  "dear customer","bank account","verification link","login activity",
  "unusual login","account required","support representative",
  "alright share","let share","cash transfer","reserve bank",
]);

// Words that CANNOT appear in a person name
const INVALID_NAME_WORDS = new Set([
  "the","a","an","and","but","or","nor","for","yet","so","in","on","at","to",
  "by","of","as","is","it","be","do","go","my","his","her","our","its","your",
  "will","shall","can","may","must","have","has","had","was","were","are","been",
  "said","told","sent","gave","took","made","came","went","knew","saw","got",
  "very","just","also","even","only","same","some","still","here","now","new",
  "good","bad","high","low","old","big","small","fast","slow","sure","real",
  "action","status","source","device","protocol","timestamp","destination",
  "success","failure","error","warning","alert","approved","rejected","pending",
  "verified","submitted","transferred","detected","blocked","allowed","denied",
  "case","contact","occupation","location","incident","reported","date","type",
  "reference","details","statement","signature","report","summary","overview",
  "android","chrome","mobile","browser","server","client","network",
  "https","http","login","logout","session","request","response",
  "database","table","record","field","value","entry","log","file","path",
  "alright","dear","customer","verify","account","temporary","restricted",
  "unusual","activity","suspension","permanent","failure","verification",
  "immediately","approximately","submitting","investigators","responsible",
  "phishing","fraudulent","intended","capture","banking","official","similar",
  "provided","appeared","received","claimed","noticed","realized","transferred",
  "hey","bro","yes","no","ok","hi","bye","thanks","please","sorry","sure",
  "deal","share","open","send","use","get","put","let","try","ask","give",
  "about","after","before","above","below","with","from","into","upon","over",
  "under","since","until","among","around","behind","beside","through","during",
  "hacker","forger","scammer","fraudster","suspect","victim","attacker","agent",
  "cash","transfer","credentials","submitted","chrome","mobile","reserve","bank",
  "online","phishing","financial","cyber","india","state","security","team",
  "student","customer","representative","individual","person","people","user",
  "link","fake","sent","open","money","amount","approximately","shortly","later",
]);

const NON_NAME_SUFFIX_RE = /(?:tion|ment|ness|ance|ence|ity|ism|ist|ware|file|mode|base|line|rate|form|port|page|code|list|view|corp|tech|\.com|\.net|\.org|\.gov|\.edu|\.in|srv|sys|api|sql|xml|json|csv|pdf|txt|exe|dll|arc|vlan|smb|ssh|ftp|mobile|browser|device|server|client|network|protocol|transfer|submitted|success|failure|warning|alert|update|alert|phish|fraud|scam)$/i;

// Known Indian/common name parts — used to boost confidence
const KNOWN_NAME_PARTS = new Set([
  "rahul","vikram","rohan","adithya","aditya","hari","krishna","raj","ravi",
  "amit","ajay","arjun","suresh","ramesh","mahesh","ganesh","dinesh","rajesh",
  "priya","pooja","neha","anita","sunita","kavita","divya","shreya","sneha",
  "rohit","mohit","sumit","ankit","vikas","deepak","manish","rakesh","naresh",
  "vijay","sanjay","ajit","anand","prasad","kumar","singh","sharma","verma",
  "gupta","mishra","joshi","patel","shah","mehta","nair","pillai","menon",
  "iyer","rao","reddy","naidu","choudhary","pandey","shukla","tiwari","yadav",
  "james","michael","david","john","peter","paul","thomas","george","joseph",
  "murugan","selvam","senthil","karthik","balaji","venkat","prakash","rajan",
  "mohan","lakshmi","meena","chandra","nikhil","vishal","tarun","arun","karun",
  "marcus","patricia","kowalski","okafor","price","vance","shadow","broker",
  "rohit","kumar","adithya","hari","krishna",
]);

// ── Helper: strip phone numbers and junk from a name candidate ───────────────
function cleanName(raw: string): string {
  return raw
    .replace(/\s*\(\+?[\d\s\-]+\)/g, "")   // remove (+91 1234567890)
    .replace(/\s*\[\+?[\d\s\-]+\]/g, "")   // remove [+91 ...]
    .replace(/[^\w\s]/g, " ")              // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

// ── Helper: validate a cleaned name string ───────────────────────────────────
function isValidName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 45) return false;
  if (/^\d/.test(name)) return false;

  const lower = name.toLowerCase();
  if (PHRASE_BLACKLIST.has(lower)) return false;

  const words = name.trim().split(/\s+/);
  if (words.length < 1 || words.length > 4) return false;

  // All words must start uppercase
  if (!words.every(w => /^[A-Z][a-z]/.test(w))) return false;

  for (const word of words) {
    const wl = word.toLowerCase();
    if (INVALID_NAME_WORDS.has(wl)) return false;
    if (NON_NAME_SUFFIX_RE.test(word)) return false;
    if (INDIAN_CITIES.has(word)) return false;
    if (word.length < 2) return false;
  }

  return true;
}

// ── Helper: score a name candidate ───────────────────────────────────────────
function scoreCandidate(name: string, text: string, fromSignal: boolean): number {
  let score = 0;
  const lower = name.toLowerCase();
  const words = lower.split(/\s+/);

  if (fromSignal) score += 5;
  if (words.some(w => KNOWN_NAME_PARTS.has(w))) score += 4;
  if (words.length >= 2) score += 2;
  if (words.length === 3) score += 1;

  // Count occurrences in full text
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = (text.match(new RegExp(esc, 'gi')) || []).length;
  score += Math.min(hits, 3);

  return score;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function parseEvidence(text: string): Entity[] {
  const entities: Entity[] = [];
  const seenKeys = new Set<string>();

  const add = (type: string, value: string, flagged: boolean) => {
    const key = `${type}::${value.toLowerCase().trim()}`;
    if (!seenKeys.has(key) && value.trim().length > 0) {
      seenKeys.add(key);
      entities.push({ type, value: value.trim(), flagged });
    }
  };

  // name candidate map: lowercase key → { displayName, score, fromSignal }
  const candidates = new Map<string, { display: string; score: number; fromSignal: boolean }>();

  const addCandidate = (raw: string, fromSignal: boolean) => {
    const cleaned = cleanName(raw);
    if (!isValidName(cleaned)) return;
    const key = cleaned.toLowerCase();
    const score = scoreCandidate(cleaned, text, fromSignal);
    const existing = candidates.get(key);
    if (!existing || score > existing.score) {
      candidates.set(key, { display: cleaned, score, fromSignal });
    }
  };

  // ── 1. SIGNAL EXTRACTION (trusted sources) ────────────────────────────────

  // Participants: line  →  "Participants: Adithya Raj (+91 ...), Hari Krishna (+91 ...)"
  const participantsLine = text.match(/^Participants:\s*(.+)$/im);
  if (participantsLine) {
    participantsLine[1].split(",").forEach(p => addCandidate(p.trim(), true));
  }

  // Witness Name / Victim signals — handles PDF table layouts
  // PDFs often extract as: "Witness Name:Contact:Occupation:...Rohit Kumar +91..."
  // So we look for the value AFTER all the labels are done
  const nameLabelInline = /(?:Witness\s*Name|Victim|Subject|Complainant|Accused|Suspect)\s*[:|]\s*([A-Za-z][A-Za-z\s\.]{2,35}?)(?:\s*[\n\r+91|$])/gim;
  let nl;
  while ((nl = nameLabelInline.exec(text)) !== null) {
    const candidate = nl[1].trim();
    if (!/^(Name|Witness|Victim|Subject|Contact|Occupation|Case|Date|Location|Incident|Type|Signature)$/i.test(candidate)) {
      addCandidate(candidate, true);
    }
  }

  // PDF-specific: labels bunched then values — extract first TitleCase Name before phone pattern
  // e.g. "...Date:Rohit Kumar +91 9545677812Student..."
  const pdfValueRe = /(?:Date:|Signature:|Reported Date:)\s*([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:\+91|[6-9]\d{9})/g;
  let pv;
  while ((pv = pdfValueRe.exec(text)) !== null) {
    addCandidate(pv[1].trim(), true);
  }

  // Also catch: any TitleCase name immediately followed by +91 phone (victim/witness pattern)
  const nameBeforePhone = /([A-Z][a-z]{1,19}\s+[A-Z][a-z]{1,19})\s+(?:\+91\s*)?[6-9]\d{9}/g;
  let nbp;
  while ((nbp = nameBeforePhone.exec(text)) !== null) {
    addCandidate(nbp[1].trim(), true);
  }

  // From: field (email sender name, not address)
  const fromLine = text.match(/^From:\s*([A-Za-z][A-Za-z\s]{2,35}?)(?:\s*<|\n|$)/im);
  if (fromLine) addCandidate(fromLine[1].trim(), true);

  // WhatsApp chat sender: "[date, time] Sender Name: message"
  const chatRe = /^\[[\d\/\:\s,APMapm]+\]\s+([A-Za-z][A-Za-z\s\.]{1,35}):/gm;
  let cs;
  while ((cs = chatRe.exec(text)) !== null) {
    addCandidate(cs[1].trim(), true);
  }

  // LLaVA image output structured name extraction
  const imageNameRe = /(?:^|\n)(?:sender|participant|name)[s]?\s*(?:names?)?[:\-]\s*([^\n]{3,80})/gi;
  let imn;
  while ((imn = imageNameRe.exec(text)) !== null) {
    imn[1].split(/,|\band\b/i).forEach(part => {
      addCandidate(part.replace(/^["'\-\*•\d\.\s]+/, "").trim(), true);
    });
  }

  // ── 2. PATTERN EXTRACTION (lower confidence) ──────────────────────────────

  // Two-word TitleCase
  const twoRe = /\b([A-Z][a-z]{1,19})\s([A-Z][a-z]{1,19})\b/g;
  let tw;
  while ((tw = twoRe.exec(text)) !== null) addCandidate(tw[0], false);

  // Three-word TitleCase
  const threeRe = /\b([A-Z][a-z]{1,19})\s([A-Z][a-z]{1,19})\s([A-Z][a-z]{1,19})\b/g;
  let th;
  while ((th = threeRe.exec(text)) !== null) addCandidate(th[0], false);

  // ── 3. APPLY THRESHOLD & DEDUP ────────────────────────────────────────────
  // Sort by score descending so longer/higher-scored names are added first
  type CandidateEntry = [string, { display: string; score: number; fromSignal: boolean }];
  const sorted: CandidateEntry[] = ([...candidates.entries()] as CandidateEntry[]).sort((a, b) => b[1].score - a[1].score);

  const addedNameKeys: string[] = [];

  for (const [key, meta] of sorted) {
    // Threshold: signal-based needs score >= 1, pattern-based needs score >= 5
    const threshold = meta.fromSignal ? 1 : 5;
    if (meta.score < threshold) continue;

    // Skip if this is a substring of an already-added longer name
    // e.g. skip "Adithya" if "Adithya Raj" is already added
    const isSubOfAdded = addedNameKeys.some(added =>
      added !== key && added.includes(key)
    );
    if (isSubOfAdded) continue;

    addedNameKeys.push(key);
    add("Name", meta.display, false);
  }

  // ── @usernames ────────────────────────────────────────────────────────────
  const atRe = /@([A-Za-z][A-Za-z0-9_]{2,30})\b/g;
  let ar;
  while ((ar = atRe.exec(text)) !== null) add("Username", `@${ar[1]}`, false);

  // System usernames from auth logs only
  const sysRe = /\bUser:\s*([a-z][a-z0-9_\.]{2,20})\b/g;
  let sr;
  while ((sr = sysRe.exec(text)) !== null) {
    const u = sr[1].trim();
    if (!INVALID_NAME_WORDS.has(u)) add("Username", u, false);
  }

  // ── Phone ─────────────────────────────────────────────────────────────────
  const phoneRe = /(?:\+91[\s\-]?)?[6-9]\d{9}\b/g;
  let pr;
  while ((pr = phoneRe.exec(text)) !== null) add("Phone", pr[0].replace(/\s/g, ""), true);

  // ── Email ─────────────────────────────────────────────────────────────────
  (text.match(/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g) || [])
    .forEach(e => add("Email", e, false));

  // ── IP Address ────────────────────────────────────────────────────────────
  (text.match(/\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g) || [])
    .forEach(ip => add("IP Address", ip, true));

  // ── MAC Address ───────────────────────────────────────────────────────────
  (text.match(/\b([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}\b/g) || [])
    .forEach(mac => add("MAC Address", mac, true));

  // ── URLs ──────────────────────────────────────────────────────────────────
  const safeDomains = ["sbi.co.in","hdfcbank.com","icicibank.com","gov.in","nic.in"];
  (text.match(/https?:\/\/[^\s<>"{}|\\^`[\]\n]+/g) || [])
    .forEach(url => add("URL", url, !safeDomains.some(d => url.includes(d))));

  // ── Crypto wallets ────────────────────────────────────────────────────────
  (text.match(/\b(bc1[a-z0-9]{25,39}|[13][a-zA-HJ-NP-Z0-9]{25,34}|0x[a-fA-F0-9]{40})\b/g) || [])
    .forEach(w => add("Crypto Wallet", w, true));

  // ── UPI ───────────────────────────────────────────────────────────────────
  (text.match(/\b[\w.\-]{3,}@(?:paytm|gpay|phonepe|okaxis|okicici|oksbi|okhdfcbank|ybl|ibl|axl|upi|apl|waaxis|rapl|fbl|cnrb|sbi|hdfc|icici|axis|kotak|bob|pnb|yes|indus)\b/gi) || [])
    .forEach(u => add("UPI ID", u, true));

  // ── Dates ─────────────────────────────────────────────────────────────────
  (text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g) || [])
    .forEach(d => add("Date", d, false));

  // ── Amounts ───────────────────────────────────────────────────────────────
  (text.match(/(?:Rs\.?|INR|₹|\$|USD|XMR)\s?\d[\d,]*(?:\.\d{1,2})?|\b\d[\d,]*(?:\.\d{1,2})?\s?(?:lakh|crore|lakhs|crores)\b|\b\d+\s?dollars?\b/gi) || [])
    .forEach(a => add("Amount", a.trim(), true));

  // ── File paths ────────────────────────────────────────────────────────────
  (text.match(/\\\\[\w\-\.]+\\[\w\\\-\. ]+/g) || [])
    .forEach(p => add("File Path", p, true));

  // ── Device IDs ────────────────────────────────────────────────────────────
  const devRe = /Device_ID:\s*([a-zA-Z0-9\-_]+)/g;
  let dv;
  while ((dv = devRe.exec(text)) !== null) add("Device ID", dv[1], true);

  // ── Locations ─────────────────────────────────────────────────────────────
  INDIAN_CITIES.forEach(city => {
    if (text.includes(city)) add("Location", city, false);
  });

  // ── Crime keywords ────────────────────────────────────────────────────────
  CRIME_KEYWORDS.forEach(keyword => {
    const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = text.match(new RegExp(`\\b${esc}\\b`, 'gi'));
    if (matches?.length) add("Keyword", `${keyword} (x${matches.length})`, true);
  });

  return entities;
}