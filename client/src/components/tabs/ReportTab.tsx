import { useRef, useState } from "react";
import { useInvestigations } from "@/hooks/use-investigations";
import { Download, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { format } from "date-fns";

export function ReportTab() {
  const { currentInvestigation } = useInvestigations();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!currentInvestigation?.analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <FileText className="w-16 h-16 text-muted-foreground opacity-50" />
        <div>
          <h2 className="text-2xl font-display font-bold">Report Not Ready</h2>
          <p className="text-muted-foreground mt-2">Analysis must be completed to generate a report.</p>
        </div>
      </div>
    );
  }

  const { analysis, entities, title, date, id } = currentInvestigation;

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = margin;

      const checkPage = (needed: number) => {
        if (y + needed > pageH - margin - 10) { pdf.addPage(); y = margin; }
      };

      const writeWrapped = (text: string, fontSize: number, style: "normal" | "bold" = "normal", color: [number, number, number] = [40, 40, 40], indent = 0) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", style);
        pdf.setTextColor(...color);
        const lines = pdf.splitTextToSize(text, contentW - indent);
        lines.forEach((line: string) => {
          checkPage(fontSize * 0.45 + 2);
          pdf.text(line, margin + indent, y);
          y += fontSize * 0.45 + 1.5;
        });
      };

      const sectionHeader = (num: number, title: string) => {
        checkPage(12);
        pdf.setFillColor(20, 20, 20);
        pdf.rect(margin, y, contentW, 8, "F");
        pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
        pdf.text(`${num}. ${title.toUpperCase()}`, margin + 3, y + 5.5);
        y += 12;
      };

      // ── Header ────────────────────────────────────────────────────────────
      pdf.setFillColor(0, 0, 0);
      pdf.rect(margin, y, contentW, 14, "F");
      pdf.setFontSize(14); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
      pdf.text("AXIS — FORENSIC INTELLIGENCE REPORT", margin + 4, y + 9);
      y += 14;

      // Sub-header row: ID left, date right, confidential center
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 100, 100);
      pdf.text(`ID: ${id}`, margin, y + 5);
      pdf.text("CONFIDENTIAL / LAW ENFORCEMENT USE ONLY", margin + contentW / 2 - 28, y + 5);
      pdf.text(`DATE: ${format(new Date(date), "yyyy-MM-dd HH:mm")}`, pageW - margin - 38, y + 5);
      y += 10;

      // Case title
      pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
      pdf.text(`Case: ${title}`, margin, y);
      y += 4;
      pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.4);
      pdf.line(margin, y, pageW - margin, y);
      y += 7;

      // ── Threat + Crime boxes ──────────────────────────────────────────────
      const boxH = 18;
      pdf.setFillColor(245, 245, 245); pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, y, contentW / 2 - 3, boxH, "FD");
      pdf.rect(margin + contentW / 2 + 3, y, contentW / 2 - 3, boxH, "FD");

      pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); pdf.setTextColor(120, 120, 120);
      pdf.text("ASSESSED THREAT LEVEL", margin + 3, y + 5);
      pdf.setFontSize(13); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
      pdf.text(analysis.risk_level, margin + 3, y + 12);
      pdf.setFontSize(7.5); pdf.setFont("helvetica", "normal"); pdf.setTextColor(100, 100, 100);
      pdf.text(`Score: ${analysis.risk_score}/100`, margin + 3, y + 16.5);

      pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); pdf.setTextColor(120, 120, 120);
      pdf.text("PRIMARY CRIME TYPE", margin + contentW / 2 + 6, y + 5);
      pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
      pdf.text(analysis.crime_type, margin + contentW / 2 + 6, y + 13);
      y += boxH + 8;

      // ── 1. Executive Summary ──────────────────────────────────────────────
      sectionHeader(1, "Executive Overview");
      analysis.summary.split(/\n+/).filter(p => p.trim()).forEach(para => {
        writeWrapped(para.trim(), 9, "normal", [40, 40, 40]);
        y += 3;
      });
      y += 2;

      // ── 2. Key Findings ───────────────────────────────────────────────────
      sectionHeader(2, "Key Findings");
      analysis.key_findings.forEach((f, i) => {
        checkPage(10);
        pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
        pdf.text(`${i + 1}.`, margin + 2, y);
        writeWrapped(f, 9, "normal", [40, 40, 40], 7);
        y += 1;
      });
      y += 3;

      // ── 3. Recommended Actions ────────────────────────────────────────────
      sectionHeader(3, "Recommended Actions");
      analysis.recommended_actions.forEach((a, i) => {
        checkPage(10);
        pdf.setFontSize(9); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 0, 0);
        pdf.text(`${i + 1}.`, margin + 2, y);
        writeWrapped(a, 9, "normal", [40, 40, 40], 7);
        y += 1;
      });
      y += 3;

      // ── 4. Applicable Laws ────────────────────────────────────────────────
      if (analysis.applicable_laws.length > 0) {
        sectionHeader(4, "Applicable Legal Frameworks");
        analysis.applicable_laws.forEach(law => {
          checkPage(8);
          pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(40, 40, 40);
          pdf.text(`• ${law}`, margin + 4, y); y += 6;
        });
        y += 3;
      }

      // ── 5. Extracted Entities ─────────────────────────────────────────────
      sectionHeader(5, "Extracted Entities");
      const col1 = margin, col2 = margin + 36, col3 = margin + contentW - 16;
      const rowH = 7;

      // Table header
      checkPage(rowH);
      pdf.setFillColor(40, 40, 40);
      pdf.rect(col1, y, contentW, rowH, "F");
      pdf.setFontSize(8); pdf.setFont("helvetica", "bold"); pdf.setTextColor(255, 255, 255);
      pdf.text("TYPE", col1 + 2, y + 5);
      pdf.text("VALUE", col2 + 2, y + 5);
      pdf.text("FLAG", col3 + 1, y + 5);
      y += rowH;

      entities.forEach((ent, i) => {
        checkPage(rowH);
        const bg: [number, number, number] = ent.flagged ? [255, 245, 245] : i % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
        pdf.setFillColor(...bg);
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(col1, y, contentW, rowH, "FD");
        pdf.setFontSize(7.5); pdf.setFont("helvetica", "bold"); pdf.setTextColor(60, 60, 60);
        pdf.text(ent.type, col1 + 2, y + 5);
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(20, 20, 20);
        const val = pdf.splitTextToSize(ent.value, col3 - col2 - 4);
        pdf.text(val[0], col2 + 2, y + 5);
        if (ent.flagged) { pdf.setFont("helvetica", "bold"); pdf.setTextColor(200, 0, 0); pdf.text("YES", col3 + 1, y + 5); }
        y += rowH;
      });
      y += 6;

      // ── Footer on every page ──────────────────────────────────────────────
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(150, 150, 150);
        pdf.text("CONFIDENTIAL / LAW ENFORCEMENT USE ONLY — Generated by AXIS Local LLM • Offline Engine", margin, pageH - 8);
        pdf.text(`Page ${p} of ${totalPages}`, pageW - margin - 18, pageH - 8);
      }

      pdf.save(`AXIS_Report_${id.substring(0, 8)}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-[#111118] p-4 rounded-xl border border-white/5 shadow-lg sticky top-0 z-20">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00d4aa]" />
            Final Intelligence Report
          </h3>
          <p className="text-xs text-muted-foreground font-mono">Multi-page PDF — all entities included</p>
        </div>
        <Button onClick={handleDownloadPDF} disabled={isGenerating} className="bg-white text-black hover:bg-gray-200 font-bold gap-2">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export to PDF
        </Button>
      </div>

      <div className="glass-panel p-0 rounded-xl overflow-hidden">
        <div className="bg-white text-black mx-auto shadow-2xl"
          style={{ width: "210mm", minHeight: "297mm", padding: "18mm", boxSizing: "border-box", fontFamily: "Georgia, serif" }}>

          {/* Header */}
          <div className="bg-black text-white px-4 py-3 -mx-[18mm] -mt-[18mm] mb-6" style={{ marginLeft: "-18mm", marginRight: "-18mm", marginTop: "-18mm" }}>
            <h1 className="text-xl font-black tracking-tight">AXIS — FORENSIC INTELLIGENCE REPORT</h1>
          </div>
          <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
            <span>ID: {id}</span>
            <span className="font-bold text-gray-600">CONFIDENTIAL / LAW ENFORCEMENT USE ONLY</span>
            <span>DATE: {format(new Date(date), "yyyy-MM-dd HH:mm")}</span>
          </div>
          <div className="border-b-2 border-black pb-2 mb-6">
            <h2 className="text-lg font-bold">Case: {title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Assessed Threat Level</p>
              <p className="text-3xl font-black">{analysis.risk_level}</p>
              <p className="text-xs text-gray-500 mt-1">Score: {analysis.risk_score}/100</p>
            </div>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Primary Crime Type</p>
              <p className="text-2xl font-bold">{analysis.crime_type}</p>
            </div>
          </div>

          {[
            { num: 1, title: "Executive Overview", content: (
              analysis.summary.split(/\n+/).filter(p => p.trim()).map((p, i) => (
                <p key={i} className="text-gray-800 leading-relaxed text-justify mb-3 text-sm">{p}</p>
              ))
            )},
            { num: 2, title: "Key Findings", content: (
              <ol className="list-decimal pl-5 space-y-1.5 text-gray-800 text-sm">
                {analysis.key_findings.map((f, i) => <li key={i}>{f}</li>)}
              </ol>
            )},
            { num: 3, title: "Recommended Actions", content: (
              <ol className="list-decimal pl-5 space-y-1.5 text-gray-800 text-sm">
                {analysis.recommended_actions.map((a, i) => <li key={i}>{a}</li>)}
              </ol>
            )},
          ].map(s => (
            <div key={s.num} className="mb-7">
              <div className="bg-black text-white px-3 py-1.5 mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wide">{s.num}. {s.title}</h3>
              </div>
              {s.content}
            </div>
          ))}

          {analysis.applicable_laws.length > 0 && (
            <div className="mb-7">
              <div className="bg-black text-white px-3 py-1.5 mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wide">4. Applicable Legal Frameworks</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.applicable_laws.map((l, i) => (
                  <span key={i} className="bg-gray-100 border border-gray-300 px-2 py-1 text-xs font-bold rounded">{l}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-7">
            <div className="bg-black text-white px-3 py-1.5 mb-3">
              <h3 className="font-bold text-sm uppercase tracking-wide">5. Extracted Entities</h3>
            </div>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left w-1/4">Type</th>
                  <th className="border border-gray-300 p-2 text-left">Value</th>
                  <th className="border border-gray-300 p-2 text-center w-16">Flagged</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((e, i) => (
                  <tr key={i} className={e.flagged ? "bg-red-50" : i % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="border border-gray-300 p-1.5 font-mono font-bold text-xs">{e.type}</td>
                    <td className="border border-gray-300 p-1.5">{e.value}</td>
                    <td className="border border-gray-300 p-1.5 text-center font-bold text-red-600 text-xs">{e.flagged ? "YES" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 pt-4 border-t border-gray-300 text-center text-gray-400 text-xs">
            <p>CONFIDENTIAL / LAW ENFORCEMENT USE ONLY — Generated by AXIS Local LLM • Offline Engine</p>
          </div>
        </div>
      </div>
    </div>
  );
}