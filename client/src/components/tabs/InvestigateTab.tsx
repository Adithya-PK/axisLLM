import { useState, useRef, useEffect } from "react";
import { useInvestigations } from "@/hooks/use-investigations";
import { useChat } from "@/hooks/use-analysis";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "Summarize communication timeline",
  "Identify financial anomalies",
  "Detail potential legal violations",
  "List key suspects and their roles"
];

export function InvestigateTab() {
  const { currentInvestigation, updateInvestigation } = useInvestigations();
  const [input, setInput] = useState("");
  const chatMutation = useChat();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentInvestigation?.chatHistory]);

  if (!currentInvestigation?.analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <Bot className="w-16 h-16 text-muted-foreground opacity-50" />
        <div>
          <h2 className="text-2xl font-display font-bold">AI Investigator Offline</h2>
          <p className="text-muted-foreground mt-2">Upload and analyze evidence before querying the LLM.</p>
        </div>
      </div>
    );
  }

  const handleSend = async (message: string) => {
    if (!message.trim() || !currentInvestigation) return;

    const newHistory = [
      ...currentInvestigation.chatHistory,
      { role: "user" as const, content: message }
    ];

    updateInvestigation(currentInvestigation.id, { chatHistory: newHistory });
    setInput("");

    try {
      const response = await chatMutation.mutateAsync({
        message,
        entities: currentInvestigation.entities,
        raw_text: currentInvestigation.rawText || "",
        chat_history: newHistory
      });

      updateInvestigation(currentInvestigation.id, {
        chatHistory: [
          ...newHistory,
          { role: "assistant", content: response.reply }
        ]
      });
    } catch (error) {
      updateInvestigation(currentInvestigation.id, {
        chatHistory: [
          ...newHistory,
          { role: "assistant", content: "Error: Failed to communicate with local LLM. Check system logs." }
        ]
      });
    }
  };

  const history = currentInvestigation.chatHistory;

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col rounded-2xl glass-panel overflow-hidden border-[#0099ff]/20 shadow-[0_0_40px_rgba(0,153,255,0.05)] animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="bg-[#111118] p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0099ff]/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#0099ff]" />
          </div>
          <div>
            <h3 className="font-bold text-white">AXIS Investigator Assistant</h3>
            <p className="text-xs text-[#00d4aa] font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
              Llama3:8b-instruct Local
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-black/20">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00d4aa]/20 to-[#0099ff]/20 flex items-center justify-center rotate-3">
               <Sparkles className="w-10 h-10 text-[#00d4aa]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">How can I assist with this case?</h2>
              <p className="text-muted-foreground">The AI has full context of the uploaded evidence and generated analysis. Ask specific questions or select a prompt below.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="p-3 text-sm text-left rounded-lg glass-panel hover:bg-white/10 transition-colors border-white/10 text-gray-300 flex items-center justify-between group"
                >
                  {s}
                  <Send className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#00d4aa] transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {history.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-[#00d4aa]/20 text-[#00d4aa]' : 'bg-[#0099ff]/20 text-[#0099ff]'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gradient-cyan text-[#0a0a0f] font-medium rounded-tr-sm' 
                    : 'glass-panel text-gray-200 rounded-tl-sm border-white/5'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-[#0099ff]/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-[#0099ff]" />
                 </div>
                 <div className="glass-panel rounded-2xl rounded-tl-sm p-4 text-gray-400 flex items-center gap-3">
                   <Loader2 className="w-4 h-4 animate-spin text-[#0099ff]" />
                   Synthesizing response...
                 </div>
              </div>
            )}
          </>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#111118] border-t border-white/5">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query the case files..."
            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-4 pr-16 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0099ff] focus:ring-1 focus:ring-[#0099ff] transition-all"
            disabled={chatMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="absolute right-2 p-2.5 bg-[#0099ff] hover:bg-[#007acc] text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
