import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  Loader2,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import api from '../../services/api';

const InteractiveAIDemo = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `👋 **Vanakkam! Welcome to ProTrack AI!**\n\nI am your intelligent copilot, trained with complete knowledge of the ProTrack project management platform.\n\nYou can ask me anything about:\n• 🚀 **What is ProTrack?**\n• 📌 **How do Kanban boards and sprints work?**\n• 👥 **Why can't members create tasks? (Role architecture)**\n• 📧 **Automated 48-hour deadline protection emails**\n• 🛡️ **Master Admin Console & user feedback**\n\nAsk me a question below in **English or Tanglish**!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    { label: '🚀 What is ProTrack?', query: 'Machi ProTrack website pathi sollu enna features irukku' },
    { label: '📌 How does Kanban work?', query: 'How does the Kanban sprint board work in ProTrack?' },
    { label: '👥 Member vs PM Roles', query: 'Why can members not create tasks? Explain ProTrack role permissions' },
    { label: '📧 48h Deadline Alerts', query: 'How does automated deadline protection work with email alerts?' },
    { label: '🛡️ Admin Console', query: 'Tell me about the Master Admin console for protrack24@gmail.com' }
  ];

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : input;
    if (!query || !query.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/public-chat', {
        message: query.trim()
      });

      if (res.data && res.data.success) {
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: res.data.reply,
          provider: res.data.provider,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      const errMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'I am currently processing your request. Please check your network connection and try again!',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: `Chat reset! 👋 Ask me anything about ProTrack's architecture, features, roles, or workflow in English or Tanglish!`,
        timestamp: new Date()
      }
    ]);
  };

  // Simple Markdown text renderer for bolding, bullet points, headers, and code
  const renderFormattedText = (text) => {
    if (!text) return '';
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mt-3 mb-1.5">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white mt-3.5 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
      }

      // Bullet points
      if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().replace(/^[-*•]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-xs sm:text-sm leading-relaxed">
            <span className="text-indigo-500 mt-1 shrink-0 font-bold">•</span>
            <span>{parseInlineFormatting(content)}</span>
          </div>
        );
      }

      // Numbered lists (e.g. "1. ")
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-xs sm:text-sm leading-relaxed">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">{numberedMatch[1]}.</span>
            <span>{parseInlineFormatting(numberedMatch[2])}</span>
          </div>
        );
      }

      // Empty line / paragraph break
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs sm:text-sm leading-relaxed my-1">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const parseInlineFormatting = (str) => {
    // Basic inline formatting: **bold** and `code`
    const parts = [];
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-gray-900 dark:text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts;
  };

  return (
    <section id="ai" className="py-20 relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] to-[#EFF6FF] dark:from-[#0B1120] dark:to-[#0F172A] border-t border-[#E4E7EC] dark:border-[#1F2937] transition-colors">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Trained AI Intelligence Engine</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-[#172033] dark:text-white">
            Meet <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">ProTrack AI</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
            Your 24/7 intelligent project copilot. Built right into ProTrack and powered by Google Gemini, it knows the entire platform, your sprint workflows, team roles, and deadlines. Try asking anything below!
          </p>
        </div>

        {/* Live Interactive Terminal Card */}
        <div className="mt-12 max-w-4xl mx-auto bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-3xl border border-indigo-100 dark:border-indigo-900/50 shadow-2xl shadow-indigo-500/5 overflow-hidden flex flex-col">
          {/* Terminal Header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/70 dark:bg-[#151E32]/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  ProTrack AI Live Copilot
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Gemini 3.8 Flash
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors px-2.5 py-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800"
              title="Reset Chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-5 pt-3 pb-2 bg-indigo-50/40 dark:bg-[#131B2E]/40 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 shrink-0">
              Quick Prompts:
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p.query)}
                className="shrink-0 text-xs font-medium px-3 py-1 rounded-full bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-700 transition-all hover:scale-102 shadow-2xs"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Container */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[440px] min-h-[300px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-gray-50 dark:bg-[#172136] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                  }`}
                >
                  <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none text-inherit">
                    {msg.sender === 'user' ? (
                      <p className="text-xs sm:text-sm font-medium">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] opacity-60">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.provider && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                        {msg.provider}
                      </span>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-50 dark:bg-[#172136] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    ProTrack AI is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827]">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1A2338] border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ProTrack AI anything (English or Tanglish)..."
                disabled={loading}
                className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden disabled:opacity-50 py-1.5"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-xs transition-colors shrink-0"
                title="Send Question"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-center text-gray-400 dark:text-gray-500">
              💡 Tip: Ask in Tanglish like <span className="font-mono text-indigo-500">"machi website pathi sollu"</span> or <span className="font-mono text-indigo-500">"Kanban board epdi run aagum"</span>.
            </p>
          </div>
        </div>

        {/* 4 Core Pillars of ProTrack AI */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-3">
              Deep Platform Knowledge
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1.5 leading-relaxed">
              Trained on every ProTrack module — Kanban boards, global tasks, milestone timelines, document repos, and Razorpay licensing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-3">
              Role & Scope Discipline
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1.5 leading-relaxed">
              Enforces architectural discipline. Knows why Project Managers plan while Members execute, preventing project scope creep.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-3">
              Automated Deadline Guard
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1.5 leading-relaxed">
              Proactively tracks approaching deadlines, alerting teams 48 hours in advance via Resend and Brevo email notifications.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-3">
              Bilingual Fluency
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1.5 leading-relaxed">
              Speaks English, Tamil, and natural Tanglish. Friendly, structured responses with markdown formatting and actionable advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveAIDemo;
