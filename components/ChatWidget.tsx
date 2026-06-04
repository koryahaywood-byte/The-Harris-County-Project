"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED: Record<string, string[]> = {
  "/tools/heat-check":          ["Who won the most precincts?", "What was the closest race?", "How does voter turnout vary by precinct?"],
  "/tools/bill-tracker":        ["Which rep passed the most bills?", "What is the pass rate for Harris County reps?", "How does a bill become law in Texas?"],
  "/tools/congressional-bills": ["Who has the most bills signed into law?", "How does Congress compare to the Texas legislature?", "What is a co-sponsorship?"],
  "/tools/county-budget":       ["What takes the biggest share of the county budget?", "Who are the top county contractors?", "How does the county budget process work?"],
  "/tools/city-budget":         ["How much does Houston spend on police?", "What are discretionary funds?", "How is the city budget adopted?"],
  "/tools/tirz":                ["What is a TIRZ?", "Which TIRZ has the most revenue?", "Can TIRZs hurt school funding?"],
  "/tools/infrastructure-funding": ["What does IIJA stand for?", "What is the biggest project on the map?", "How does federal infrastructure money reach local projects?"],
  "/tools/civic-calendar":      ["When is the next voter registration deadline?", "When does Commissioners Court meet?", "What is the 2026 primary date?"],
  "/tools/endorsement-flowchart": ["Who has the most endorsements?", "What organizations endorse Harris County candidates?", "What is EMILY's List?"],
  "/tools/consultant-flowchart":  ["What does a general consultant do?", "Who works for the most clients?", "What is a media consultant?"],
  default:                       ["What tools does this site have?", "Who runs Harris County?", "When is the next election in Harris County?"],
};

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const suggestions = SUGGESTED[pathname] ?? SUGGESTED.default;

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, path: pathname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat unavailable");
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open civic assistant"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white shadow-[0_4px_24px_rgba(26,58,92,0.35)] flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 active:scale-95"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5L5 15M5 5l10 10"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {/* Unread dot */}
        {!open && messages.length === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-sky-400 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="rounded-[1.75rem] bg-white/95 ring-1 ring-black/10 shadow-[0_8px_48px_rgba(26,58,92,0.2)] backdrop-blur-xl flex flex-col overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100dvh - 120px))" }}>

          {/* Header */}
          <div className="flex-shrink-0 bg-[var(--accent)] px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-300/20 ring-1 ring-sky-300/30 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "var(--font-playfair), serif" }}>
                Civic Assistant
              </p>
              <p className="text-sky-300/80 text-[10px] font-medium">Ask anything about the data</p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setError(""); }}
                className="ml-auto text-white/50 hover:text-white/80 text-[10px] font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[var(--muted)] text-center">
                  Ask me anything about Harris County civic data.
                </p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs rounded-xl bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 text-[var(--accent)] font-semibold px-3.5 py-2.5 transition-all duration-300 leading-snug"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--accent)] text-white rounded-br-sm"
                      : "bg-[var(--accent)]/6 text-[var(--foreground)] rounded-bl-sm ring-1 ring-[var(--accent)]/10"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--accent)]/6 ring-1 ring-[var(--accent)]/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]/40 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-[var(--border)] p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex gap-2 items-center"
            >
              <div className="flex-1 rounded-2xl ring-1 ring-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 focus-within:ring-[var(--accent-light)] transition-all duration-500">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question…"
                  className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/50"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center transition-all duration-500 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
            <p className="text-[9px] text-[var(--muted)]/60 text-center mt-1.5">
              Powered by Claude · The Harris County Project
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
