import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useInvestigations } from "@/hooks/use-investigations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadTab } from "@/components/tabs/UploadTab";
import { AnalysisTab } from "@/components/tabs/AnalysisTab";
import { InvestigateTab } from "@/components/tabs/InvestigateTab";
import { ReportTab } from "@/components/tabs/ReportTab";
import { FileText, Activity, MessageSquare, Download } from "lucide-react";

export default function InvestigationDashboard() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { currentInvestigation, setCurrentId, investigations } = useInvestigations();
  const [activeTab, setActiveTab] = useState("upload");

  // Sync route param with context state
  useEffect(() => {
    if (id) {
      const exists = investigations.find(i => i.id === id);
      if (exists) {
        setCurrentId(id);
      } else if (investigations.length > 0) {
        // If ID invalid, go to home
        setLocation("/");
      }
    }
  }, [id, investigations, setCurrentId, setLocation]);

  // Auto-switch tabs if analysis exists upon load
  useEffect(() => {
    if (currentInvestigation?.analysis && activeTab === "upload") {
      setActiveTab("analysis");
    }
  }, [currentInvestigation?.id]);

  if (!currentInvestigation) return null;

  return (
    <div className="flex-1 overflow-auto bg-[#0a0a0f]">
      <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8">
        
        {/* Header Title */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="text-[#00d4aa] font-mono text-xs mb-2 tracking-widest uppercase">
              Case Reference: {currentInvestigation.id.split('-')[0]}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
              {currentInvestigation.title}
            </h1>
          </div>
          {currentInvestigation.analysis && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              ANALYSIS COMPLETE
            </div>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#111118] border border-white/5 p-1 h-auto grid grid-cols-4 lg:w-[600px] rounded-xl mb-8">
            <TabsTrigger 
              value="upload" 
              className="data-[state=active]:bg-[#00d4aa]/20 data-[state=active]:text-[#00d4aa] text-muted-foreground py-3 rounded-lg flex gap-2 font-medium"
            >
              <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Evidence</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              disabled={!currentInvestigation.analysis}
              className="data-[state=active]:bg-[#0099ff]/20 data-[state=active]:text-[#0099ff] text-muted-foreground py-3 rounded-lg flex gap-2 font-medium disabled:opacity-30"
            >
              <Activity className="w-4 h-4" /> <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="investigate" 
              disabled={!currentInvestigation.analysis}
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-muted-foreground py-3 rounded-lg flex gap-2 font-medium disabled:opacity-30"
            >
              <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Investigate</span>
            </TabsTrigger>
            <TabsTrigger 
              value="report" 
              disabled={!currentInvestigation.analysis}
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-muted-foreground py-3 rounded-lg flex gap-2 font-medium disabled:opacity-30"
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="upload" className="m-0">
              <UploadTab onComplete={() => setActiveTab("analysis")} />
            </TabsContent>
            <TabsContent value="analysis" className="m-0">
              <AnalysisTab />
            </TabsContent>
            <TabsContent value="investigate" className="m-0">
              <InvestigateTab />
            </TabsContent>
            <TabsContent value="report" className="m-0">
              <ReportTab />
            </TabsContent>
          </div>
        </Tabs>

      </div>
    </div>
  );
}
