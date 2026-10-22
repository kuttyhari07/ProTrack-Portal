import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

const AIChatBot = () => {
  const { user } = useAuth();
  const { currentWorkspace, currentRole } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello ${user?.name || 'there'}! 👋 I am **ProTrack AI**, your intelligent project copilot trained on this platform.\n\nAsk me anything in **English or Tanglish** about:\n• 📋 Your assigned tasks & approaching deadlines\n• 📌 How Kanban boards and sprints work\n• ⚠️ How to report blockers and issues\n• 📁 Uploading project documents & deliverables`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const quickPrompts = [
    { label: '📋 My assigned tasks', query: 'What tasks are assigned to me?' },
    { label: '⏰ Tasks due soon', query: 'What are my upcoming due dates and deadlines?' },
    { label: '🌐 About ProTrack', query: 'Machi ProTrack website pathi sollu enna features irukku' },
    { label: '⚠️ How to report an issue?', query: 'How do I report a blocker or issue?' },
    { label: '🚀 Project overview', query: 'Summarize the active projects and their progress' }
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
      const res = await api.post('/ai/chat', {
        message: query.trim(),
        history: messages.slice(-6).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text
        }))
      });

      if (res.data.success) {
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: res.data.reply,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      const errMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I encountered an error connecting to the ProTrack AI engine. Please ensure you are logged into your workspace and try again.",
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

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: `Chat cleared! How can I help you today in **${currentWorkspace?.name || 'ProTrack'}**?`,
        timestamp: new Date()
      }
    ]);
  };

  // Simple Markdown renderer for bolding, bullet points, code tags, and links
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Check for bullet line
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      let cleanLine = line;
      if (isBullet) {
        cleanLine = line.replace(/^[\s•\-*]+\s*/, '');
      }

      // Replace bold **text**
      const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`|\*(?:⚠️|🔴|🟢|✓).*?\*)/g);

      const formattedContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-gray-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={pIdx}
              className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <span key={pIdx} className="font-medium text-amber-600 dark:text-amber-400">
              {part.slice(1, -1)}
            </span>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5">
            <span className="text-indigo-500 font-bold select-none">•</span>
            <div className="flex-1">{formattedContent}</div>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="my-0.5">
          {formattedContent}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white rounded-full shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:scale-105 group active:scale-95"
          title="Open ProTrack AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-gray-900" />
          </div>
          <span className="font-semibold text-xs tracking-wide pr-1">ProTrack AI</span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[410px] bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized ? 'h-14' : 'h-[580px] max-h-[85vh]'
          }`}
          style={{
            backdropFilter: 'blur(16px)'
          }}
        >
          {/* Header */}
          <div className="h-14 px-4 bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 backdrop-blur-sm border border-white/15">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs tracking-tight">ProTrack AI Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-[10px] text-indigo-200 font-medium">
                  {currentWorkspace?.name || 'Workspace'} • {currentRole}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-indigo-200">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMinimized ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#F9FAFB]/50 dark:bg-[#0B1120]/50">
                {messages.map((m) => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${
                          isUser
                            ? 'bg-indigo-600'
                            : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                        }`}
                      >
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl leading-relaxed text-xs shadow-xs ${
                          isUser
                            ? 'bg-[#4F46E5] text-white rounded-br-xs'
                            : 'bg-white dark:bg-[#1F2937] border border-gray-200/80 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-xs'
                        }`}
                      >
                        {renderFormattedText(m.text)}
                        <span
                          className={`block text-[9px] mt-1 text-right select-none ${
                            isUser ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-white dark:bg-[#1F2937] border border-gray-200/80 dark:border-gray-800 text-gray-500 dark:text-gray-400 flex items-center gap-1.5 shadow-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                      <span className="text-[11px] font-medium">ProTrack AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestion chips */}
              <div className="px-3 py-2 bg-white dark:bg-[#111827] border-t border-gray-100 dark:border-gray-800/80 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSend(p.query)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-gray-100 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-950/60 text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    placeholder="Ask AI about tasks, due dates, projects..."
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-gray-100 dark:bg-[#1F2937] text-gray-900 dark:text-gray-100 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-[#111827] outline-none transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="text-[10px] text-center text-gray-400 mt-1.5">
                  ProTrack AI responds using real-time workspace context.
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatBot;
