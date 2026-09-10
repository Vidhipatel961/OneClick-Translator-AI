import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, Bot, User, Sparkles, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Assistant() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchJobs = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // Fetch up to 50 recent jobs to select from
      const res = await fetch('http://localhost:8000/api/jobs/?page=1&size=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only consider completed jobs for AI interaction
        const completedJobs = data.items.filter((j: any) => j.status === 'COMPLETED');
        setJobs(completedJobs);
        if (completedJobs.length > 0) {
          setSelectedJobId(completedJobs[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedJobId(e.target.value);
    setConversationId(null);
    setMessages([]);
    setError('');
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          job_id: selectedJobId || null,
          query: text
        })
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation_id);
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Failed to get response from AI.');
      }
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend(query);
    }
  };

  const suggestedActions = ['Summarize', 'Key Points', 'Explain', 'Extract Actions', 'Generate FAQ'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Assistant</h1>
            <p className="text-xs text-slate-400">Chat with your translated files</p>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 gap-6 h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Sidebar / Context Selector */}
        <div className="w-full md:w-64 flex flex-col shrink-0 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              File Context
            </h2>
            <select
              value={selectedJobId}
              onChange={handleJobChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">General Chat (No File)</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.filename}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Select a previously completed translation job to chat about its contents.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 hidden md:flex flex-col">
            <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Suggested Actions</h2>
            <div className="flex flex-col gap-2">
              {suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action)}
                  className="text-left px-3 py-2 rounded-lg text-sm bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 transition"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
          
          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-xl">
                  <Bot className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">How can I help you?</h3>
                <p className="text-slate-400 mb-8 text-sm">
                  I can summarize your documents, extract key points, or answer specific questions about your translations.
                </p>
                
                {/* Mobile Suggested Actions */}
                <div className="flex md:hidden flex-wrap justify-center gap-2">
                  {suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action)}
                      className="px-4 py-2 rounded-full text-sm bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 transition"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 shrink-0 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 shrink-0 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 shrink-0 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span className="text-sm text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
              <div className="flex-1 bg-slate-950 border border-slate-700 focus-within:border-indigo-500 rounded-xl overflow-hidden transition-colors shadow-inner">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedJobId ? "Ask a question about the selected document..." : "Type your message..."}
                  className="w-full bg-transparent text-white px-4 py-3 text-sm focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={() => handleSend(query)}
                disabled={!query.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3 rounded-xl transition shadow-lg shadow-indigo-500/20 shrink-0 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
