import { useState, useRef, useEffect } from "react";
import {
  UploadCloud, AlertCircle, Loader2, Zap, X,
  Image, FileText, FileSpreadsheet, ScrollText, FileType, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParseEvidence, useAnalyzeEvidence } from "@/hooks/use-analysis";
import { useInvestigations, type StoredFileMeta } from "@/hooks/use-investigations";
import { useToast } from "@/hooks/use-toast";

const EVIDENCE_INPUT_TYPES = [
  { icon: "💬", label: "Chat Transcripts", desc: "WhatsApp, Telegram, Signal, SMS exports. Extracts sender names, messages, links, phone numbers and criminal keywords.", formats: ".txt .log" },
  { icon: "📧", label: "Email Archives", desc: "Exported email threads, inbox dumps, phishing emails. Identifies senders, recipients, suspicious links and attachments.", formats: ".txt .pdf" },
  { icon: "📝", label: "Witness Statements", desc: "Typed or scanned victim/witness accounts. Extracts named individuals, dates, locations and reported events.", formats: ".txt .pdf" },
  { icon: "🖥️", label: "System & Server Logs", desc: "Firewall logs, access logs, IDS alerts, DHCP records. Extracts IPs, MAC addresses, usernames and anomalous activity.", formats: ".log .txt" },
  { icon: "💰", label: "Financial Records", desc: "Bank statements, UPI transaction history, crypto receipts. Extracts amounts, account numbers and suspicious transfers.", formats: ".csv .txt .pdf" },
  { icon: "📱", label: "Social Media Exports", desc: "Downloaded posts, DMs, activity logs. Identifies usernames, flagged posts, location check-ins and suspicious behaviour.", formats: ".txt .csv .log" },
  { icon: "🖼️", label: "Image Evidence", desc: "Screenshots, photos, scanned documents. Analyzed by LLaVA AI to extract visible text, names, URLs and criminal content.", formats: ".png .jpg .jpeg .webp" },
  { icon: "📊", label: "Forensic Reports", desc: "Analyst reports, investigation summaries, court documents. Extracts entities, findings and legal references.", formats: ".pdf .txt" },
];

const ALL_ACCEPTS = ".txt,.log,.csv,.pdf,.png,.jpg,.jpeg,.webp";

interface LiveFile {
  file: File;
  id: string;
  isImage: boolean;
  isPDF: boolean;
}

function getFileIcon(name: string, isImage: boolean, isPDF: boolean) {
  if (isImage) return <Image className="w-4 h-4 text-purple-400" />;
  if (isPDF) return <FileType className="w-4 h-4 text-red-400" />;
  if (name.endsWith(".csv")) return <FileSpreadsheet className="w-4 h-4 text-yellow-400" />;
  if (name.endsWith(".log")) return <ScrollText className="w-4 h-4 text-blue-400" />;
  return <FileText className="w-4 h-4 text-[#00d4aa]" />;
}

function detectEvidenceType(files: StoredFileMeta[]): string {
  if (files.some(f => f.isImage)) return "Image Evidence";
  if (files.some(f => f.name.endsWith(".csv"))) return "Financial Records";
  if (files.some(f => f.name.endsWith(".log"))) return "System Logs";
  if (files.some(f => f.isPDF)) return "Witness Statement";
  return "Chat Logs";
}

export function UploadTab({ onComplete }: { onComplete: () => void }) {
  const [liveFiles, setLiveFiles] = useState<LiveFile[]>([]);
  const [evidenceType, setEvidenceType] = useState<string>("Chat Logs");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { currentInvestigation, updateInvestigation } = useInvestigations();
  const parseMutation = useParseEvidence();
  const analyzeMutation = useAnalyzeEvidence();

  const analysisComplete = !!currentInvestigation?.analysis;
  // Persistent file list from investigation (survives tab switches)
  const storedFiles: StoredFileMeta[] = currentInvestigation?.uploadedFiles ?? [];

  // Sync evidenceType from stored investigation on mount
  useEffect(() => {
    if (currentInvestigation?.evidenceType) setEvidenceType(currentInvestigation.evidenceType);
  }, [currentInvestigation?.id]);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const newLive: LiveFile[] = arr.map(f => ({
      file: f, id: Math.random().toString(36).slice(2),
      isImage: f.type.startsWith("image/"),
      isPDF: f.name.toLowerCase().endsWith(".pdf"),
    }));
    setLiveFiles(prev => [...prev, ...newLive]);
    // Merge with stored to detect type
    const allMeta: StoredFileMeta[] = [
      ...storedFiles,
      ...newLive.map(l => ({ id: l.id, name: l.file.name, size: l.file.size, isImage: l.isImage, isPDF: l.isPDF })),
    ];
    setEvidenceType(detectEvidenceType(allMeta));
  };

  const removeFile = (id: string) => {
    setLiveFiles(prev => prev.filter(f => f.id !== id));
    if (currentInvestigation) {
      const updated = storedFiles.filter(f => f.id !== id);
      updateInvestigation(currentInvestigation.id, { uploadedFiles: updated });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const readAsText = (file: File): Promise<string> =>
    new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.onerror = rej; r.readAsText(file); });

  const readAsBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res((e.target?.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });

  const handleUpload = async () => {
    if (liveFiles.length === 0 || !currentInvestigation) return;
    try {
      let combinedText = "";

      for (const uf of liveFiles) {
        if (uf.isImage) {
          toast({ title: `Analyzing image: ${uf.file.name}`, description: "Running LLaVA visual forensics..." });
          const base64 = await readAsBase64(uf.file);
          const res = await fetch("/api/analysis/image", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64Image: base64, mimeType: uf.file.type })
          });
          const data = await res.json();
          combinedText += `\n\n=== IMAGE ANALYSIS: ${uf.file.name} ===\n${data.description || "No description returned."}`;
        } else if (uf.isPDF) {
          toast({ title: `Extracting PDF: ${uf.file.name}`, description: "Parsing document text..." });
          const base64 = await readAsBase64(uf.file);
          const res = await fetch("/api/analysis/pdf", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ base64PDF: base64 })
          });
          const data = await res.json();
          combinedText += data.text
            ? `\n\n=== PDF: ${uf.file.name} (${data.pages} pages) ===\n${data.text}`
            : `\n\n=== PDF: ${uf.file.name} ===\n[Failed to extract text]`;
        } else {
          const text = await readAsText(uf.file);
          combinedText += `\n\n=== FILE: ${uf.file.name} ===\n${text}`;
        }
      }

      const primaryName = liveFiles[0].file.name;
      // Save file metadata persistently into the investigation
      const newMeta: StoredFileMeta[] = liveFiles.map(l => ({
        id: l.id, name: l.file.name, size: l.file.size, isImage: l.isImage, isPDF: l.isPDF,
      }));
      const allMeta = [...storedFiles, ...newMeta];

      updateInvestigation(currentInvestigation.id, {
        title: primaryName, fileName: primaryName,
        rawText: combinedText, evidenceType,
        uploadedFiles: allMeta,
      });

      toast({ title: "Parsing Evidence...", description: "Extracting entities..." });
      const parseResult = await parseMutation.mutateAsync({ text: combinedText, filename: primaryName, evidenceType });
      updateInvestigation(currentInvestigation.id, { entities: parseResult.entities });

      toast({ title: "Analyzing Data...", description: "Running intelligence models..." });
      const analysisResult = await analyzeMutation.mutateAsync({ text: combinedText, entities: parseResult.entities, evidenceType });

      const autoTitle = `${analysisResult.crime_type} — ${primaryName}`;
      updateInvestigation(currentInvestigation.id, { analysis: analysisResult, title: autoTitle });

      setLiveFiles([]);
      toast({ title: "Analysis Complete", description: "Navigate to Analysis tab to view results." });
      onComplete();
    } catch (error) {
      toast({ title: "Analysis Failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  const isProcessing = parseMutation.isPending || analyzeMutation.isPending;
  const allDisplayFiles = storedFiles; // always show from investigation store

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold">Secure Evidence Ingestion</h2>
        <p className="text-muted-foreground font-mono text-sm">
          Upload evidence files for local, offline LLM processing. No data leaves your device.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full min-h-[180px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all duration-300
          ${isDragging ? 'border-[#00d4aa] bg-[#00d4aa]/10 scale-[1.01]' : 'border-[#00d4aa]/30 bg-[#111118]/50 hover:bg-[#111118] hover:border-[#00d4aa]/60'}`}
      >
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept={ALL_ACCEPTS} multiple />
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#00d4aa]/10 rounded-full flex items-center justify-center mx-auto text-[#00d4aa]">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Drop Evidence Files Here</h3>
            <p className="text-muted-foreground text-sm mt-1 font-mono">.txt · .log · .csv · .pdf · .png · .jpg · .jpeg · .webp</p>
            <p className="text-[#00d4aa]/70 text-xs mt-1">Multiple files supported</p>
          </div>
        </div>
      </div>

      {/* Persistent file list — survives tab switches */}
      {allDisplayFiles.length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              {analysisComplete && <CheckCircle2 className="w-3.5 h-3.5 text-[#00d4aa]" />}
              {allDisplayFiles.length} file{allDisplayFiles.length > 1 ? "s" : ""} {analysisComplete ? "analysed" : "queued"} · <span className="text-[#00d4aa]">{evidenceType}</span>
            </span>
            {!analysisComplete && (
              <button
                onClick={() => currentInvestigation && updateInvestigation(currentInvestigation.id, { uploadedFiles: [] })}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >Clear all</button>
            )}
          </div>
          <ul className="divide-y divide-white/5 max-h-[200px] overflow-y-auto">
            {allDisplayFiles.map(f => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                {getFileIcon(f.name, f.isImage, f.isPDF)}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm text-white font-medium truncate">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {(f.size / 1024).toFixed(1)} KB · {f.isImage ? "Visual AI (LLaVA)" : f.isPDF ? "PDF extraction" : "Text parsing"}
                  </p>
                </div>
                {!analysisComplete && (
                  <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-red-400 p-1 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* New files queued (not yet analysed) */}
      {liveFiles.length > 0 && !isProcessing && (
        <div className="glass-panel rounded-xl overflow-hidden border border-[#00d4aa]/20">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-xs font-bold text-[#00d4aa] uppercase tracking-wider">
              {liveFiles.length} new file{liveFiles.length > 1 ? "s" : ""} ready to analyse
            </span>
          </div>
          <ul className="divide-y divide-white/5 max-h-[160px] overflow-y-auto">
            {liveFiles.map(uf => (
              <li key={uf.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                {getFileIcon(uf.file.name, uf.isImage, uf.isPDF)}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm text-white font-medium truncate">{uf.file.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {(uf.file.size / 1024).toFixed(1)} KB · {uf.isImage ? "Visual AI (LLaVA)" : uf.isPDF ? "PDF extraction" : "Text parsing"}
                  </p>
                </div>
                <button onClick={() => setLiveFiles(prev => prev.filter(f => f.id !== uf.id))} className="text-muted-foreground hover:text-red-400 p-1 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence input types grid */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <p className="text-xs font-bold text-[#00d4aa] uppercase tracking-wider">Accepted Evidence Input Types</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EVIDENCE_INPUT_TYPES.map(t => (
            <div key={t.label} className="flex items-start gap-3 bg-[#111118] rounded-lg p-3 border border-white/5">
              <span className="text-xl shrink-0 mt-0.5">{t.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{t.label}</span>
                  <span className="text-[10px] font-mono text-[#00d4aa]/60">{t.formats}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidentiality + Button */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="glass-panel p-4 rounded-xl border-orange-500/20 bg-orange-500/5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <div className="text-sm text-orange-200/80">
            <span className="font-bold text-orange-400 block mb-1">Confidentiality Notice</span>
            All files are processed strictly on your local device. No data is transmitted to any external server.
          </div>
        </div>
        <Button
          onClick={handleUpload}
          disabled={liveFiles.length === 0 || isProcessing}
          size="lg"
          className="w-full h-full min-h-[72px] text-base font-bold bg-gradient-cyan hover:opacity-90 text-[#0a0a0f] shadow-lg shadow-[#00d4aa]/25 disabled:opacity-50 transition-all"
        >
          {isProcessing
            ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />PROCESSING...</>
            : <><Zap className="w-5 h-5 mr-2" />START INTELLIGENCE ANALYSIS</>}
        </Button>
      </div>
    </div>
  );
}