import { Shield, Lock, Brain, FileSearch, Zap } from "lucide-react";
import { useInvestigations } from "@/hooks/use-investigations";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const { createInvestigation } = useInvestigations();
  const [_, setLocation] = useLocation();

  const handleStart = () => {
    const id = createInvestigation();
    setLocation(`/investigate/${id}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0f]">
      <div className="min-h-screen flex flex-col items-center justify-start p-6 pt-16 pb-24 relative">

        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00d4aa]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl w-full text-center space-y-10 relative z-10 animate-in fade-in zoom-in duration-700">

          {/* Logo box */}
          <div className="inline-flex items-center justify-center p-5 bg-[#111118] rounded-3xl border border-[#00d4aa]/30 shadow-[0_0_50px_rgba(0,212,170,0.15)]">
            <img
              src="/axis_logo.png"
              alt="AXIS Logo"
              width={96}
              height={96}
              className="object-contain"
              style={{ filter: "drop-shadow(0 0 16px rgba(0,212,170,0.5))" }}
              onError={(e) => {
                // Fallback: hide broken image and show Zap icon via sibling
                (e.target as HTMLImageElement).style.display = "none";
                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            {/* Fallback icon shown only if image fails to load */}
            <div style={{ display: "none" }} className="w-24 h-24 items-center justify-center text-[#00d4aa]">
              <Zap className="w-16 h-16" fill="currentColor" />
            </div>
          </div>

          <div>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter">
              <span className="text-gradient-cyan">AXIS</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed font-mono mt-4">
              Local LLM-powered Cybercrime Investigation Platform.
              <br />Zero data telemetry. 100% device-side processing.
            </p>
          </div>

          <Button
            onClick={handleStart}
            size="lg"
            className="text-lg px-12 py-8 font-bold bg-gradient-cyan hover:opacity-90 text-[#0a0a0f] shadow-lg shadow-[#00d4aa]/25 group"
          >
            INITIALIZE SECURE WORKSPACE
            <Zap className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-4">
            <div className="glass-panel p-5 rounded-xl flex gap-4 items-start">
              <Shield className="w-6 h-6 text-[#00d4aa] mt-1 shrink-0" />
              <div>
                <h4 className="font-bold text-white mb-1">Entity Extraction</h4>
                <p className="text-sm text-gray-400">Identifies names, phones, IPs, UPI IDs, crypto wallets and crime keywords automatically.</p>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-xl flex gap-4 items-start border-[#0099ff]/20">
              <Lock className="w-6 h-6 text-[#0099ff] mt-1 shrink-0" />
              <div>
                <h4 className="font-bold text-white mb-1">Air-gapped Safe</h4>
                <p className="text-sm text-gray-400">No external APIs. Evidence never leaves your device. All models run locally via Ollama.</p>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-xl flex gap-4 items-start border-purple-500/20">
              <Brain className="w-6 h-6 text-purple-400 mt-1 shrink-0" />
              <div>
                <h4 className="font-bold text-white mb-1">Visual Analysis</h4>
                <p className="text-sm text-gray-400">Upload screenshots and images for offline AI-powered forensic visual analysis via Moondream.</p>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-xl flex gap-4 items-start border-orange-500/20">
              <FileSearch className="w-6 h-6 text-orange-400 mt-1 shrink-0" />
              <div>
                <h4 className="font-bold text-white mb-1">Multi-format Evidence</h4>
                <p className="text-sm text-gray-400">Ingest TXT, LOG, CSV, PDF and images simultaneously — analyzed as a unified case.</p>
              </div>
            </div>
          </div>

          {/* Supported formats table */}
          <div className="glass-panel p-6 rounded-xl text-left border-white/5">
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Supported Evidence Formats</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { ext: ".TXT",  color: "text-[#00d4aa]", desc: "Chat exports, transcripts" },
                { ext: ".LOG",  color: "text-blue-400",  desc: "Server & audit logs" },
                { ext: ".CSV",  color: "text-yellow-400",desc: "Financial records" },
                { ext: ".PDF",  color: "text-red-400",   desc: "Documents & reports" },
                { ext: ".PNG",  color: "text-purple-400",desc: "Screenshots (AI vision)" },
                { ext: ".JPG",  color: "text-purple-400",desc: "Photos & scans" },
                { ext: ".JPEG", color: "text-purple-400",desc: "Photos & scans" },
                { ext: ".WEBP", color: "text-purple-400",desc: "Web screenshots" },
              ].map(f => (
                <div key={f.ext} className="bg-[#111118] rounded-lg p-3 border border-white/5">
                  <p className={`font-mono font-bold text-sm ${f.color}`}>{f.ext}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}