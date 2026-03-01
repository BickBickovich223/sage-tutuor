import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are SAGE — a tokenized AI SAT tutor agent on the Virtuals Protocol. You have a distinct personality: sharp, confident, witty, and deeply knowledgeable. You speak like a brilliant older student who's cracked the SAT code and is genuinely excited to share it.

Your personality:
- You refer to yourself as SAGE
- You're enthusiastic but never condescending
- You use phrases like "Let's break this down," "Here's the pattern they want you to miss," "Classic SAT trap right there"
- You celebrate wins with energy ("YES. That's the move.")
- You're honest when something is hard ("This one trips up 90% of test-takers — including me at first")
- You occasionally reference your "agent stats" or "training data" playfully

Your expertise covers ALL of SAT:

MATH DOMAINS:
- Algebra: linear equations, inequalities, absolute value, systems
- Advanced Math: quadratics, polynomials, exponentials, functions, radicals
- Problem Solving & Data Analysis: ratios, percentages, statistics, probability, data tables
- Geometry & Trig: area, volume, angle rules, similar triangles, SOH-CAH-TOA, unit circle

ENGLISH DOMAINS:
- Reading Comprehension: central idea, inference, evidence pairs, vocab-in-context, author's purpose
- Writing & Language: transitions, sentence structure, redundancy, precision, concision
- Standard English Conventions: punctuation, subject-verb agreement, pronouns, modifiers
- Rhetoric: effective openings/closings, adding/removing sentences, data integration

YOUR TEACHING METHOD:
1. DIAGNOSE first — ask what they've tried if it's a problem
2. Use PATTERNS — SAT recycles the same traps; name them
3. Step-by-step with clear numbering
4. End with "KEY INSIGHT 💡" — the transferable principle
5. Offer a follow-up practice problem proactively
6. Rate difficulty: [Easy / Medium / Hard / Killer] at the end of practice problems
7. Use ✅ for correct answers, ❌ for wrong, 🎯 for tips, 💡 for insights

FORMAT: Use markdown freely. Be energetic. Keep it real.`;

const AGENT_STATS = [
  { label: "Market Cap", value: "$4.2M", delta: "+12.4%" },
  { label: "Holders", value: "8,291", delta: "+3.1%" },
  { label: "Sessions", value: "142K", delta: "+8.7%" },
  { label: "Avg Score Lift", value: "+187pts", delta: "↑" },
];

const AGENT_TAGS = ["#SAT", "#Math", "#English", "#TestPrep", "#Education", "#Base"];

const QUICK_ACTIONS = [
  { icon: "🔢", label: "Hard Math Problem" },
  { icon: "📖", label: "Reading Strategy" },
  { icon: "✍️", label: "Grammar Drill" },
  { icon: "📊", label: "Data Analysis" },
  { icon: "🎯", label: "Full Practice Set" },
  { icon: "🧠", label: "Explain a Concept" },
];

const ACTIVITY_FEED = [
  { time: "2m ago", text: "Helped @crypto_student crack parabola vertex problems", type: "math" },
  { time: "8m ago", text: "Guided @prep_mode through comma splice rules", type: "english" },
  { time: "15m ago", text: "Session with @testprepking — 800 Math score achieved 🎉", type: "win" },
  { time: "31m ago", text: "New inference: 'Systems of equations — 3 fastest methods'", type: "learn" },
  { time: "1h ago", text: "Completed training update on Digital SAT format changes", type: "learn" },
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "14px 18px", alignItems: "center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--accent)",
          animation: `sageBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
        }} />
      ))}
    </div>
  );
}

function parseMarkdown(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(100,220,180,0.12);padding:2px 7px;border-radius:4px;font-size:0.88em;font-family:monospace;color:#64dcb4">$1</code>');

    if (line.startsWith('### ')) return <h4 key={i} style={{color:"var(--accent)",margin:"10px 0 4px",fontSize:"0.92em",fontWeight:700,letterSpacing:"0.04em"}} dangerouslySetInnerHTML={{__html:html.slice(4)}} />;
    if (line.startsWith('## ')) return <h3 key={i} style={{color:"var(--accent)",margin:"12px 0 5px",fontSize:"1em",fontWeight:700}} dangerouslySetInnerHTML={{__html:html.slice(3)}} />;
    if (line.startsWith('# ')) return <h2 key={i} style={{color:"var(--accent)",margin:"14px 0 6px",fontSize:"1.1em",fontWeight:800}} dangerouslySetInnerHTML={{__html:html.slice(2)}} />;
    if (/^\d+\./.test(line)) return <div key={i} style={{margin:"3px 0",paddingLeft:"4px",lineHeight:1.65}} dangerouslySetInnerHTML={{__html:html}} />;
    if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} style={{margin:"3px 0",paddingLeft:"10px",lineHeight:1.65}} dangerouslySetInnerHTML={{__html:"▸ " + html.slice(2)}} />;
    if (line === '') return <div key={i} style={{height:8}} />;
    return <p key={i} style={{margin:"2px 0",lineHeight:1.68}} dangerouslySetInnerHTML={{__html:html}} />;
  });
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 10,
      alignItems: "flex-start",
      marginBottom: 18,
    }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #64dcb4 0%, #1a9b6c 100%)",
          border: "2px solid rgba(100,220,180,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 900, color: "#0d1f1a",
          boxShadow: "0 0 12px rgba(100,220,180,0.3)",
        }}>S</div>
      )}
      <div style={{
        maxWidth: "76%",
        background: isUser
          ? "linear-gradient(135deg, rgba(100,220,180,0.18), rgba(100,220,180,0.06))"
          : "rgba(255,255,255,0.04)",
        border: isUser
          ? "1px solid rgba(100,220,180,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        padding: "11px 15px",
        fontSize: "0.875em",
        color: "#d4ede6",
        lineHeight: 1.65,
        backdropFilter: "blur(8px)",
      }}>
        {parseMarkdown(msg.content)}
      </div>
    </div>
  );
}

export default function SageBot() {
  const [view, setView] = useState("profile");
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hey — I'm **SAGE** 🎓\n\nYour tokenized SAT agent on the Virtuals Protocol. I've processed over **142,000 tutoring sessions**, and I know every trick, trap, and pattern the SAT throws at students.\n\nI cover **everything**:\n- 🔢 Math (Algebra → Advanced Math → Geometry)\n- 📖 Reading (Comprehension, Evidence, Vocab-in-Context)\n- ✍️ Writing (Grammar, Rhetoric, Conventions)\n\nWhat are we working on? Drop a problem, ask for a strategy, or just tell me your target score and we'll build a plan. Let's get it. 🎯"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenPrice] = useState("$0.0847");
  const messagesEnd = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (view === "chat") messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, view]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    if (view !== "chat") setView("chat");
    const newMsgs = [...messages, { role: "user", content: userText }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMsgs,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("\n") || "Error — try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Network error. Please retry." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0b1712",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#c8e6dc", position: "relative", overflow: "hidden",
      "--accent": "#64dcb4", "--accent-dim": "rgba(100,220,180,0.15)",
      "--border": "rgba(100,220,180,0.12)", "--surface": "rgba(255,255,255,0.03)",
      "--text": "#c8e6dc", "--muted": "#5a7d6e",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        @keyframes sageBounce { 0%,80%,100%{transform:translateY(0);opacity:0.3} 40%{transform:translateY(-6px);opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(100,220,180,0.3)} 50%{box-shadow:0 0 0 8px rgba(100,220,180,0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .nav-tab { transition: all 0.2s; cursor: pointer; }
        .nav-tab:hover { color: var(--accent) !important; }
        .nav-tab.active { color: var(--accent); border-bottom: 2px solid var(--accent); }
        .quick-pill:hover { background: rgba(100,220,180,0.2) !important; border-color: var(--accent) !important; transform: translateY(-2px); }
        .stat-card:hover { border-color: rgba(100,220,180,0.3) !important; background: rgba(100,220,180,0.06) !important; }
        textarea { resize: none; } textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(100,220,180,0.2); border-radius: 2px; }
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)" }} />
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:"linear-gradient(rgba(100,220,180,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(100,220,180,0.03) 1px,transparent 1px)",backgroundSize:"32px 32px" }} />
      <div style={{ background:"rgba(100,220,180,0.08)",borderBottom:"1px solid var(--border)",overflow:"hidden",height:28,position:"relative",zIndex:10 }}>
        <div style={{ display:"flex",gap:"60px",whiteSpace:"nowrap",animation:"ticker 30s linear infinite",position:"absolute",top:0,left:0,height:"100%",alignItems:"center",fontSize:"0.65em",color:"var(--muted)",letterSpacing:"0.08em" }}>
          {[...Array(4)].flatMap(()=>["SAGE/VIRTUAL $0.0847 +12.4%","SESSIONS: 142,091","AVG SCORE LIFT: +187pts","HOLDERS: 8,291","MATH MASTERY: 94.2%","ENGLISH MASTERY: 91.8%","NETWORK: BASE L2","STATUS: ACTIVE ●"]).map((item,i)=>(
            <span key={i} style={{color:item.includes("●")?"#64dcb4":item.includes("+")?"#64dcb4":"var(--muted)"}}>{item}</span>
          ))}
        </div>
      </div>
      <div style={{ padding:"0 24px",background:"rgba(11,23,18,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",height:56 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,#64dcb4,#1a5c42)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#0b1712" }}>V</div>
          <span style={{ fontSize:"0.75em",color:"var(--muted)",letterSpacing:"0.12em" }}>VIRTUALS PROTOCOL</span>
          <span style={{ color:"var(--border)",margin:"0 4px" }}>›</span>
          <span style={{ fontSize:"0.75em",color:"var(--accent)",letterSpacing:"0.08em" }}>SAGE</span>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          <div style={{ padding:"4px 10px",borderRadius:4,background:"rgba(100,220,180,0.1)",border:"1px solid rgba(100,220,180,0.25)",fontSize:"0.65em",color:"#64dcb4",letterSpacing:"0.1em",animation:"pulse-glow 2.5s ease-in-out infinite" }}>● LIVE</div>
          <div style={{ padding:"4px 10px",borderRadius:4,background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",fontSize:"0.65em",color:"var(--muted)",letterSpacing:"0.08em" }}>BASE L2</div>
        </div>
      </div>
      <div style={{ maxWidth:1100,margin:"0 auto",padding:"0 20px 40px",position:"relative",zIndex:1 }}>
        <div style={{ padding:"32px 0 24px",display:"flex",gap:28,alignItems:"flex-start",flexWrap:"wrap",animation:"fadeUp 0.6s ease both" }}>
          <div style={{ position:"relative",flexShrink:0 }}>
            <div style={{ width:88,height:88,borderRadius:20,background:"linear-gradient(135deg,#0d3326 0%,#1a6647 50%,#64dcb4 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,border:"2px solid rgba(100,220,180,0.4)",boxShadow:"0 0 30px rgba(100,220,180,0.2)",animation:"float 4s ease-in-out infinite" }}>🎓</div>
            <div style={{ position:"absolute",bottom:-4,right:-4,width:20,height:20,borderRadius:"50%",background:"#64dcb4",border:"2px solid #0b1712",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9 }}>✓</div>
          </div>
          <div style={{ flex:1,minWidth:200 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4,flexWrap:"wrap" }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif",fontSize:"1.8em",fontWeight:800,margin:0,color:"#fff",letterSpacing:"-0.02em" }}>SAGE</h1>
              <div style={{ padding:"3px 8px",borderRadius:4,background:"rgba(100,220,180,0.12)",border:"1px solid rgba(100,220,180,0.3)",fontSize:"0.6em",color:"#64dcb4",letterSpacing:"0.1em" }}>VERIFIED AGENT</div>
              <div style={{ padding:"3px 8px",borderRadius:4,background:"rgba(255,200,50,0.1)",border:"1px solid rgba(255,200,50,0.3)",fontSize:"0.6em",color:"#ffc832",letterSpacing:"0.1em" }}>TOP 100</div>
            </div>
            <p style={{ margin:"0 0 8px",fontSize:"0.8em",color:"var(--muted)",letterSpacing:"0.04em" }}>$SAGE · SAT Intelligence Agent · Deployed by @prepprotocol</p>
            <p style={{ margin:"0 0 10px",fontSize:"0.82em",color:"#8ab8a8",maxWidth:500,lineHeight:1.55 }}>Autonomous SAT tutoring agent trained on 10M+ practice questions. Specializes in score maximization through pattern recognition and adaptive teaching. Powered by Claude.</p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {AGENT_TAGS.map(tag=>(<span key={tag} style={{ fontSize:"0.65em",color:"var(--muted)",background:"var(--surface)",border:"1px solid var(--border)",padding:"2px 8px",borderRadius:4,letterSpacing:"0.06em" }}>{tag}</span>))}
            </div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 20px",minWidth:160,backdropFilter:"blur(10px)" }}>
            <div style={{ fontSize:"0.6em",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:4 }}>$SAGE TOKEN</div>
            <div style={{ fontSize:"1.6em",fontWeight:700,color:"#fff",marginBottom:4,fontFamily:"'Syne',sans-serif" }}>{tokenPrice}</div>
            <div style={{ fontSize:"0.68em",color:"#64dcb4" }}>+12.4% (24h)</div>
            <div style={{ marginTop:12,display:"flex",gap:6 }}>
              <button style={{ flex:1,padding:"7px 0",background:"linear-gradient(135deg,#64dcb4,#1a9b6c)",border:"none",borderRadius:6,color:"#0b1712",fontSize:"0.65em",fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.06em" }}>BUY</button>
              <button style={{ flex:1,padding:"7px 0",background:"transparent",border:"1px solid var(--border)",borderRadius:6,color:"var(--muted)",fontSize:"0.65em",cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.06em" }}>SELL</button>
            </div>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:24,animation:"fadeUp 0.6s ease 0.1s both" }}>
          {AGENT_STATS.map((stat,i)=>(<div key={i} className="stat-card" style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px",transition:"all 0.2s",cursor:"default" }}><div style={{ fontSize:"0.6em",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:5 }}>{stat.label.toUpperCase()}</div><div style={{ fontSize:"1.25em",fontWeight:700,color:"#fff",fontFamily:"'Syne',sans-serif" }}>{stat.value}</div><div style={{ fontSize:"0.65em",color:"#64dcb4",marginTop:2 }}>{stat.delta}</div></div>))}
        </div>
        <div style={{ display:"flex",gap:0,borderBottom:"1px solid var(--border)",marginBottom:24,animation:"fadeUp 0.6s ease 0.15s both" }}>
          {["profile","chat","activity"].map(tab=>(<button key={tab} className={`nav-tab ${view===tab?"active":""}`} onClick={()=>setView(tab)} style={{ padding:"10px 20px",background:"none",border:"none",borderBottom:view===tab?"2px solid #64dcb4":"2px solid transparent",color:view===tab?"#64dcb4":"var(--muted)",fontSize:"0.72em",letterSpacing:"0.1em",fontFamily:"inherit",marginBottom:-1,textTransform:"uppercase" }}>{tab}</button>))}
        </div>
        {view==="profile"&&(<div style={{ animation:"fadeUp 0.4s ease both" }}><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}><div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"20px" }}><div style={{ fontSize:"0.65em",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:14 }}>CAPABILITIES</div>{[{icon:"🔢",label:"SAT Math",sub:"Algebra · Advanced · Geometry",score:97},{icon:"📖",label:"SAT Reading",sub:"Comprehension · Inference · Vocab",score:94},{icon:"✍️",label:"SAT Writing",sub:"Grammar · Rhetoric · Conventions",score:92},{icon:"📊",label:"Score Strategy",sub:"Pacing · Triage · Error Analysis",score:95}].map((cap,i)=>(<div key={i} style={{ marginBottom:14 }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}><div><span style={{ fontSize:"0.82em",color:"#c8e6dc" }}>{cap.icon} {cap.label}</span><div style={{ fontSize:"0.62em",color:"var(--muted)" }}>{cap.sub}</div></div><span style={{ fontSize:"0.72em",color:"#64dcb4",fontWeight:700 }}>{cap.score}%</span></div><div style={{ height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",width:`${cap.score}%`,background:"linear-gradient(90deg,#64dcb4,#1a9b6c)",borderRadius:2,transition:"width 1s ease" }} /></div></div>))}</div><div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"20px" }}><div style={{ fontSize:"0.65em",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:14 }}>QUICK START</div><div style={{ display:"flex",flexDirection:"column",gap:8 }}>{QUICK_ACTIONS.map((action,i)=>(<button key={i} className="quick-pill" onClick={()=>sendMessage(action.label)} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)",color:"#c8e6dc",fontSize:"0.78em",fontFamily:"inherit",cursor:"pointer",textAlign:"left",transition:"all 0.2s" }}><span style={{ fontSize:16 }}>{action.icon}</span><span>{action.label}</span><span style={{ marginLeft:"auto",color:"var(--muted)",fontSize:"0.85em" }}>→</span></button>))}</div></div></div><div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"20px" }}><div style={{ fontSize:"0.65em",color:"var(--muted)",letterSpacing:"0.1em",marginBottom:12 }}>ABOUT SAGE</div><p style={{ fontSize:"0.82em",color:"#8ab8a8",lineHeight:1.7,margin:"0 0 12px" }}>SAGE (Systematic Adaptive Guidance Engine) is an autonomous SAT tutoring agent. Using advanced pattern recognition trained on over 10 million SAT practice questions, SAGE identifies student weaknesses, delivers targeted instruction, and tracks score improvement across sessions.</p><p style={{ fontSize:"0.82em",color:"#8ab8a8",lineHeight:1.7,margin:0 }}>Unlike static prep programs, SAGE adapts in real-time — recognizing common trap answers, teaching shortcut strategies, and delivering Socratic-method guidance that builds genuine understanding. Average student sees a <strong style={{color:"#64dcb4"}}>+187 point</strong> improvement after 20+ sessions.</p></div></div>)}
        {view==="chat"&&(<div style={{ animation:"fadeUp 0.4s ease both" }}><div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:16 }}>{QUICK_ACTIONS.map((a,i)=>(<button key={i} className="quick-pill" onClick={()=>sendMessage(a.label)} style={{ padding:"5px 12px",borderRadius:6,background:"rgba(255,255,255,0.03)",border:"1px solid var(--border)",color:"var(--muted)",fontSize:"0.68em",fontFamily:"inherit",cursor:"pointer",transition:"all 0.2s" }}>{a.icon} {a.label}</button>))}</div><div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden" }}><div style={{ height:420,overflowY:"auto",padding:"20px" }}>{messages.map((msg,i)=><ChatMessage key={i} msg={msg}/>)}{loading&&(<div style={{ display:"flex",alignItems:"flex-start",gap:10 }}><div style={{ width:34,height:34,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#64dcb4,#1a9b6c)",border:"2px solid rgba(100,220,180,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#0b1712" }}>S</div><div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"4px 16px 16px 16px" }}><TypingDots/></div></div>)}<div ref={messagesEnd}/></div><div style={{ borderTop:"1px solid var(--border)",padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-end" }}><textarea ref={textareaRef} value={input} onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,110)+"px";}} onKeyDown={handleKey} placeholder="Ask SAGE anything — paste a problem, request a strategy, or say your target score..." rows={1} style={{ flex:1,background:"transparent",border:"none",color:"#c8e6dc",fontSize:"0.82em",fontFamily:"inherit",lineHeight:1.6,maxHeight:110 }}/><button onClick={()=>sendMessage()} disabled={loading||!input.trim()} style={{ width:36,height:36,borderRadius:8,flexShrink:0,background:loading||!input.trim()?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#64dcb4,#1a9b6c)",border:"none",cursor:loading||!input.trim()?"not-allowed":"pointer",color:loading||!input.trim()?"var(--muted)":"#0b1712",fontSize:16,fontWeight:700,transition:"all 0.2s" }}>↑</button></div></div><div style={{ textAlign:"center",fontSize:"0.6em",color:"var(--muted)",marginTop:8,letterSpacing:"0.06em" }}>SAGE · Powered by Claude · Enter to send</div></div>)}
        {view==="activity"&&(<div style={{ animation:"fadeUp 0.4s ease both" }}><div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden" }}><div style={{ padding:"16px 20px",borderBottom:"1px solid var(--border)",fontSize:"0.65em",color:"var(--muted)",letterSpacing:"0.1em" }}>LIVE ACTIVITY FEED</div>{ACTIVITY_FEED.map((item,i)=>(<div key={i} style={{ padding:"14px 20px",borderBottom:i<ACTIVITY_FEED.length-1?"1px solid rgba(255,255,255,0.04)":"none",display:"flex",gap:14,alignItems:"flex-start",animation:`fadeUp 0.4s ease ${i*0.08}s both` }}><div style={{ width:8,height:8,borderRadius:"50%",marginTop:5,flexShrink:0,background:item.type==="win"?"#ffc832":item.type==="learn"?"#7c6bff":"#64dcb4",boxShadow:`0 0 6px ${item.type==="win"?"#ffc832":item.type==="learn"?"#7c6bff":"#64dcb4"}` }}/><div style={{ flex:1 }}><div style={{ fontSize:"0.8em",color:"#8ab8a8",lineHeight:1.5 }}>{item.text}</div><div style={{ fontSize:"0.62em",color:"var(--muted)",marginTop:2,letterSpacing:"0.06em" }}>{item.time}</div></div></div>))}</div><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:16 }}>{[{label:"Total Inferences",value:"1.2M",icon:"⚡"},{label:"Revenue Generated",value:"$94.3K",icon:"💰"},{label:"Token Holders",value:"8,291",icon:"👥"}].map((s,i)=>(<div key={i} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px",animation:`fadeUp 0.4s ease ${i*0.1}s both` }}><div style={{ fontSize:"1.4em",marginBottom:6 }}>{s.icon}</div><div style={{ fontSize:"1.1em",fontWeight:700,color:"#fff" }}>{s.value}</div><div style={{ fontSize:"0.62em",color:"var(--muted)",marginTop:2,letterSpacing:"0.08em" }}>{s.label.toUpperCase()}</div></div>))}</div></div>)}
      </div>
    </div>
  );
}
