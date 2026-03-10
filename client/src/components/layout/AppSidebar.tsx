import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Plus, FileText, Trash2, WifiOff, History, Pencil, Check, X } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";
import { useInvestigations } from "@/hooks/use-investigations";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function AppSidebar() {
  const [, setLocation] = useLocation();
  const { investigations, createInvestigation, deleteInvestigation, renameInvestigation, currentId } = useInvestigations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleNewInvestigation = () => {
    const id = createInvestigation();
    setLocation(`/investigate/${id}`);
  };

  const startEdit = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const confirmEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editValue.trim()) renameInvestigation(id, editValue.trim());
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(null);
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") { if (editValue.trim()) renameInvestigation(id, editValue.trim()); setEditingId(null); }
    if (e.key === "Escape") setEditingId(null);
  };

  return (
    <Sidebar className="border-r border-[#00d4aa]/20 bg-[#0a0a0f]">
      <SidebarHeader className="p-6 border-b border-[#00d4aa]/10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
          <img
            src="/axis_logo.png"
            alt="AXIS Logo"
            className="w-10 h-10 rounded-lg object-contain"
            style={{ filter: "drop-shadow(0 0 8px rgba(0,212,170,0.6))" }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gradient-cyan tracking-wider font-display m-0 leading-tight">AXIS</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#00d4aa]/70 font-mono font-semibold">
              Automated Examination &amp; Investigation System
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <Button
          onClick={handleNewInvestigation}
          className="w-full justify-start gap-2 bg-gradient-cyan hover:opacity-90 text-[#0a0a0f] font-bold shadow-lg shadow-[#00d4aa]/20 mb-6"
        >
          <Plus className="w-5 h-5" />
          NEW INVESTIGATION
        </Button>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase font-mono text-muted-foreground tracking-widest mb-2 flex items-center gap-2">
            <History className="w-3 h-3" />
            Previous Cases
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {investigations.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 font-mono opacity-50">No cases found.</div>
              ) : (
                investigations.map((inv) => (
                  <SidebarMenuItem key={inv.id}>
                    <div className="flex items-center group relative w-full">
                      {editingId === inv.id ? (
                        // ── Inline rename input ──────────────────────────────
                        <div className="flex items-center gap-1 flex-1 px-2 py-1" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => handleKeyDown(inv.id, e)}
                            className="flex-1 bg-[#1a1a24] text-white text-sm px-2 py-1.5 rounded border border-[#00d4aa]/50 outline-none font-medium min-w-0"
                          />
                          <button onClick={e => confirmEdit(inv.id, e)} className="text-[#00d4aa] hover:text-white p-1 rounded transition-colors shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEdit} className="text-muted-foreground hover:text-red-400 p-1 rounded transition-colors shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        // ── Normal item ──────────────────────────────────────
                        <>
                          <SidebarMenuButton
                            asChild
                            isActive={currentId === inv.id}
                            className={`flex-1 ${currentId === inv.id ? 'bg-[#00d4aa]/10 text-[#00d4aa] border-l-2 border-[#00d4aa]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}
                          >
                            <Link href={`/investigate/${inv.id}`} className="flex items-center gap-3 py-6 pr-20">
                              <FileText className="w-4 h-4 opacity-70 shrink-0" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="font-medium truncate">{inv.title}</span>
                                <span className="text-[10px] opacity-60 font-mono">
                                  {format(new Date(inv.date), "MMM dd, yyyy HH:mm")}
                                </span>
                              </div>
                            </Link>
                          </SidebarMenuButton>
                          {/* Rename + Delete buttons on hover */}
                          <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={e => startEdit(inv.id, inv.title, e)}
                              className="p-1.5 text-muted-foreground hover:text-[#00d4aa] hover:bg-[#00d4aa]/10 rounded transition-all"
                              title="Rename"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                deleteInvestigation(inv.id);
                                if (currentId === inv.id) setLocation('/');
                              }}
                              className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[#00d4aa]/10">
        <div className="glass-panel p-3 rounded-lg flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-400">
            <WifiOff className="w-4 h-4" />
            <div className="absolute inset-0 rounded-full border border-green-400/30 animate-ping" />
          </div>
          <div>
            <p className="text-xs font-bold text-green-400">OFFLINE MODE ACTIVE</p>
            <p className="text-[10px] text-muted-foreground font-mono">Zero data leaves device</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}