import { useInvestigations } from "@/hooks/use-investigations";
import { ShieldAlert, Users, Key, Scale, Target, Activity, FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AnalysisTab() {
  const { currentInvestigation } = useInvestigations();

  if (!currentInvestigation?.analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-[#00d4aa]/30 flex items-center justify-center">
          <Activity className="w-10 h-10 text-[#00d4aa]/50" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">No Analysis Available</h2>
          <p className="text-muted-foreground mt-2">Upload evidence to generate an intelligence report.</p>
        </div>
      </div>
    );
  }

  const { analysis, entities } = currentInvestigation;

  const riskColors = {
    Low: "text-green-400 bg-green-500/10 border-green-500/30",
    Medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    High: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    Critical: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  const riskColor = riskColors[analysis.risk_level as keyof typeof riskColors] || riskColors.Medium;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`glass-panel p-6 rounded-xl border-l-4 ${riskColor.split(' ')[2].replace('border', 'border-l')} flex flex-col justify-between`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold uppercase tracking-wider opacity-80">Threat Level</span>
            <ShieldAlert className="w-5 h-5 opacity-80" />
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-4xl font-black ${riskColor.split(' ')[0]}`}>
              {analysis.risk_level}
            </span>
            <span className="font-mono text-xl opacity-50">{analysis.risk_score}/100</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between border-[#00d4aa]/20">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-[#00d4aa] uppercase tracking-wider">Identities Found</span>
            <Users className="w-5 h-5 text-[#00d4aa]" />
          </div>
          <div className="text-4xl font-black text-white">
            {entities.filter(e => e.type === 'Name').length}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between border-[#0099ff]/20">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-[#0099ff] uppercase tracking-wider">Crime Type</span>
            <Target className="w-5 h-5 text-[#0099ff]" />
          </div>
          <div className="text-xl font-bold text-white leading-tight">
            {analysis.crime_type}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between border-purple-500/20">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">Flagged Keywords</span>
            <Key className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-4xl font-black text-white">
            {entities.filter(e => e.flagged).length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col - Entities Table */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-display font-bold flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-[#00d4aa]" />
            Extracted Entities
          </h3>
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111118] sticky top-0 z-10 shadow-md">
                  <tr>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-white/5">Type</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-white/5">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entities.length === 0 ? (
                    <tr><td colSpan={2} className="p-4 text-center text-muted-foreground font-mono text-sm">No entities found</td></tr>
                  ) : (
                    entities.map((ent, i) => (
                      <tr key={i} className={`hover:bg-white/5 transition-colors ${ent.flagged ? 'bg-red-500/5' : ''}`}>
                        <td className="p-4 text-sm font-mono whitespace-nowrap">
                          <Badge variant="outline" className={ent.flagged ? 'border-red-500/50 text-red-400' : 'border-[#00d4aa]/30 text-[#00d4aa]'}>
                            {ent.type}
                          </Badge>
                        </td>
                        <td className={`p-4 text-sm ${ent.flagged ? 'text-red-200 font-medium' : 'text-gray-300'}`}>
                          {ent.value}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col - AI Intelligence */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-8 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4aa]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <h3 className="text-xl font-display font-bold mb-4 text-[#00d4aa]">Executive Summary</h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              {analysis.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-xl">
               <h3 className="text-md font-bold mb-4 text-white flex items-center gap-2">
                 <Target className="w-4 h-4 text-orange-400" /> Key Findings
               </h3>
               <ul className="space-y-3">
                 {analysis.key_findings.map((finding, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                     {finding}
                   </li>
                 ))}
               </ul>
            </div>

            <div className="glass-panel p-6 rounded-xl">
               <h3 className="text-md font-bold mb-4 text-white flex items-center gap-2">
                 <ShieldAlert className="w-4 h-4 text-[#0099ff]" /> Recommended Actions
               </h3>
               <ul className="space-y-3">
                 {analysis.recommended_actions.map((action, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#0099ff] mt-1.5 shrink-0" />
                     {action}
                   </li>
                 ))}
               </ul>
            </div>
          </div>

          {analysis.applicable_laws.length > 0 && (
            <div className="glass-panel p-6 rounded-xl border-purple-500/20">
               <h3 className="text-md font-bold mb-4 text-purple-400 flex items-center gap-2">
                 <Scale className="w-4 h-4" /> Applicable Legal Frameworks
               </h3>
               <div className="flex flex-wrap gap-2">
                 {analysis.applicable_laws.map((law, i) => (
                   <Badge key={i} variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 py-1.5 px-3">
                     {law}
                   </Badge>
                 ))}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}