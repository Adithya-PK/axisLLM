# AXIS — Automated Examination & Investigation System

> A fully offline, local AI-powered cybercrime investigation platform for law enforcement and forensic analysts.

---

## What is AXIS?

AXIS is a forensic investigation tool that lets you upload raw digital evidence — chat transcripts, emails, images, PDFs, network logs, CSVs — and automatically:

- Extracts entities (names, phones, IPs, URLs, amounts, UPI IDs, crypto wallets, and more)
- Identifies the crime type and assesses threat level
- Generates a structured executive summary with key findings
- Recommends investigative actions and applicable Indian law sections
- Exports a professional multi-page forensic PDF report

**Everything runs locally. Zero data leaves the device. No internet required.**

---

## Features

- Multi-file evidence upload (drag & drop)
- Supports `.txt`, `.csv`, `.log`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`
- Image OCR via LLaVA 7B (reads text from WhatsApp screenshots, CCTV stills, scanned documents)
- PDF parsing via `pdf-parse`
- Custom regex + confidence-scored NLP entity parser
- AI analysis via Llama 3.1 8B (runs fully offline via Ollama)
- Multi-page PDF export with full entity table
- Chat with evidence — ask questions about the case
- Persistent investigation history with rename and delete
- Air-gapped safe — no API keys, no cloud, no telemetry

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| LLM Runtime | Ollama (local) |
| Text Model | Llama 3.1 8B |
| Vision Model | LLaVA 7B |
| PDF Parsing | pdf-parse |
| PDF Export | jsPDF |
| Schema Validation | Zod |
| State / Storage | React Context + localStorage |

---

## Prerequisites

1. **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
2. **Ollama** — [ollama.ai](https://ollama.ai)

---

## Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/divakar834/axis.git
cd axis
```

**2. Install dependencies**
```bash
npm install
```

**3. Pull the required AI models**
```bash
ollama pull llama3.1:8b
ollama pull llava:7b
```
> Note: `llama3.1:8b` is ~4.9GB and `llava:7b` is ~4.7GB. Requires ~10GB free disk space.

**4. Start Ollama** (keep this running in the background)
```bash
ollama serve
```
> If you see `bind: Only one usage of each socket address` — Ollama is already running. Skip this step.

**5. Run AXIS**
```bash
npm run dev
```

**6. Open in browser**
```
http://localhost:3000
```

---

## Usage

1. Click **NEW INVESTIGATION** in the sidebar
2. Go to the **Evidence** tab and upload your files
3. Click **START INTELLIGENCE ANALYSIS**
4. View results in the **Analysis** tab — entities, threat level, crime type, executive summary
5. Ask questions in the **Investigate** tab
6. Export the full forensic report from the **Report** tab

---

## Supported Evidence Types

| Type | Formats |
|---|---|
| Chat Transcripts | `.txt` |
| Email Archives | `.txt` |
| Network & System Logs | `.log`, `.txt` |
| Financial Records | `.csv` |
| Witness Statements | `.pdf` |
| Forensic Reports | `.pdf` |
| Image Evidence | `.jpg`, `.jpeg`, `.png`, `.webp` |
| Social Media Exports | `.txt`, `.csv`, `.log` |

---

## Supported Entity Extraction

- Names (suspects, victims, witnesses)
- Phone numbers (Indian mobile + +91 format)
- Email addresses
- IP addresses (flagged)
- MAC addresses (flagged)
- URLs (flagged unless safe banking domain)
- UPI IDs (flagged)
- Crypto wallet addresses (Bitcoin, Ethereum)
- Amounts (INR, USD, XMR, lakh, crore)
- Dates
- Locations (Indian cities and localities)
- Device IDs
- File paths
- Crime keywords with occurrence count

---

## Crime Types Detected

Cyber Fraud · Phishing · Identity Theft · Unauthorized Hacking · Data Exfiltration · Credential Theft · Money Laundering · Blackmail · Ransomware Attack · Extortion · Impersonation · Online Harassment · Financial Fraud · Corporate Espionage · Stalking · Forgery · Trafficking · and more

---

## System Requirements

| Component | Minimum |
|---|---|
| RAM | 8GB (16GB recommended) |
| Disk | 15GB free |
| OS | Windows 10+, macOS 12+, Ubuntu 20.04+ |
| GPU | Not required (CPU inference) |

> First model load takes 1–2 minutes. Subsequent calls are faster as Ollama keeps models cached in memory.

---

## Dataset

The evidence samples used for development and testing were created as a custom synthetic dataset simulating real Indian cybercrime cases — including UPI fraud, SBI phishing, QR code swap attacks, credential theft, and data exfiltration. All data was manually crafted to reflect Indian-specific patterns (UPI IDs, Indian phone numbers, rupee amounts, Indian cities and localities, IT Act and IPC references).

---

## Legal

This tool is intended for use by law enforcement, forensic analysts, and cybersecurity researchers. All analysis runs locally on the user's device. No data is transmitted externally.

---

## Acknowledgements

- [Ollama](https://ollama.ai) — local LLM runtime
- [Meta Llama 3.1](https://llama.meta.com) — text analysis model
- [LLaVA](https://llava-vl.github.io) — vision language model
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation
- [shadcn/ui](https://ui.shadcn.com) — UI components

---

*Built for CBCID-style cybercrime forensic workflows. Offline. Private. Fast.*
