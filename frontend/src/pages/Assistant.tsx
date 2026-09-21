import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, Bot, User, Sparkles, FileText, UploadCloud, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecureMediaRenderer = ({ url, type, token }: { url: string, type: string, token: string }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000${url}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => setBlobUrl(URL.createObjectURL(blob)))
      .catch(err => console.error('Failed to load media blob:', err));
  }, [url, token]);

  if (!blobUrl) return <div className="animate-pulse bg-black/20 w-full h-32 rounded-xl flex items-center justify-center text-xs text-text-muted">Loading media securely...</div>;

  if (type === 'video') {
    return (
      <div className="flex flex-col gap-2 mt-3 w-full max-w-sm">
        <video controls src={blobUrl} crossOrigin="anonymous" className="w-full aspect-video bg-black rounded-xl shadow-lg" controlsList="nodownload" />
        <a href={blobUrl} download="translated_video.mp4" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-main rounded-lg shadow text-sm transition">
          <Download className="w-4 h-4" /> Download Video
        </a>
      </div>
    );
  }
  if (type === 'audio') {
    return (
      <div className="flex flex-col gap-2 mt-3 w-full max-w-sm">
        <video id="tts-audio" controls src={blobUrl} crossOrigin="anonymous" className="w-full h-24 bg-black rounded-xl shadow-lg" controlsList="nodownload" />
        <a href={blobUrl} download="translated_audio.mp3" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-main rounded-lg shadow text-sm transition">
          <Download className="w-4 h-4" /> Download Audio
        </a>
      </div>
    );
  }
  return (
    <a href={blobUrl} download className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-main rounded-lg shadow mt-3 text-sm transition">
      <Download className="w-4 h-4" /> Download Translated Document
    </a>
  );
};

export default function Assistant() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('en');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const printAsPdf = (content: string) => {
    if (!content) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument!.write(`
      <html><head><style>
        body { font-family: sans-serif; padding: 2rem; line-height: 1.6; }
      </style></head><body>
        <div dir="auto">${content.replace(/\n/g, '<br/>')}</div>
      </body></html>
    `);
    iframe.contentDocument!.close();
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 1000);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
    if (!text.trim() && !attachedFile) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    let userContent = text;
    if (attachedFile) {
      userContent = `[Attached File: ${attachedFile.name}]\n${text}`;
    }

    const userMsg = { role: 'user', content: userContent };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);
    setError('');

    try {
      if (attachedFile) {
        // Upload and spawn job
        setMessages(prev => [...prev, { role: 'assistant', content: 'Uploading and processing your file... This may take a moment.' }]);
        
        const formData = new FormData();
        formData.append('file', attachedFile);
        const uploadRes = await fetch('http://localhost:8000/api/files/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload file');
        const uploadData = await uploadRes.json();
        
        const fileType = attachedFile.type;
        const endpointType = fileType.startsWith('audio/') ? 'audio' : fileType.startsWith('video/') ? 'video' : 'document';
        
        const jobRes = await fetch(`http://localhost:8000/api/jobs/${endpointType}-translation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            file_id: uploadData.file_id,
            source_language: sourceLang,
            target_language: targetLang,
            project_id: null,
            team_id: null
          })
        });
        
        if (!jobRes.ok) throw new Error('Failed to start translation job');
        const jobData = await jobRes.json();
        
        // Start polling
        let isCompleted = false;
        while (!isCompleted) {
          await new Promise(r => setTimeout(r, 2000));
          const statusRes = await fetch(`http://localhost:8000/api/jobs/${jobData.id || jobData.job_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const statusData = await statusRes.json();
          if (statusData.status === 'COMPLETED') {
            isCompleted = true;
            let resultUrl = statusData.result_video_url || statusData.result_audio_url || statusData.result_document_url || statusData.result_pdf_url;
            
            const newJobId = jobData.id || jobData.job_id;
            setSelectedJobId(newJobId);
            
            setMessages(prev => [...prev.slice(0, -1), { 
              role: 'assistant', 
              content: `Here is your translated file:`,
              jobId: newJobId,
              mediaUrl: resultUrl,
              mediaType: endpointType,
              token: token,
              transcriptText: statusData.result_text
            }]);
          } else if (statusData.status === 'FAILED') {
             isCompleted = true;
             setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `Translation failed: ${statusData.error_message}` }]);
          }
        }
        
        setAttachedFile(null);
      } else {
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
      }
    } catch (e: any) {
      setError(e.message || 'Network error. Please try again.');
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
    <div className="max-w-7xl w-full mx-auto flex flex-col flex-1 pb-4">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">AI Assistant</h1>
            <p className="text-xs sm:text-sm text-text-muted">Chat with your translated files</p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[560px] md:h-[calc(100vh-14rem)]">
        
        {/* Sidebar / Context Selector */}
        <div className="w-full md:w-72 flex flex-col shrink-0 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 shrink-0 shadow-lg">
            <h2 className="text-sm font-semibold text-text-main mb-3 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              File Context
            </h2>
            <select
              value={selectedJobId}
              onChange={handleJobChange}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary placeholder-text-muted"
            >
              <option value="">General Chat (No File)</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.filename}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-disabled mt-2">
              Select a previously completed translation job to chat about its contents.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 flex-1 hidden md:flex flex-col shadow-lg overflow-hidden min-h-0">
            <h2 className="text-sm font-semibold text-text-main mb-3 uppercase tracking-wider shrink-0">Suggested Actions</h2>
            <div className="flex flex-col gap-2 overflow-y-auto show-scrollbar pr-1">
              {suggestedActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action)}
                  className="text-left px-3 py-2 rounded-lg text-sm bg-background border border-border hover:border-primary hover:text-primary transition"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-surface border border-border rounded-xl flex flex-col overflow-hidden relative shadow-lg min-h-[460px]">
          
          {/* Chat Messages Container */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto show-scrollbar p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
                <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-6 border border-border shadow-xl">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-2">How can I help you?</h3>
                <p className="text-text-muted mb-8 text-sm">
                  I can summarize your documents, extract key points, or answer specific questions about your translations.
                </p>
                
                {/* Mobile Suggested Actions */}
                <div className="flex md:hidden flex-wrap justify-center gap-2">
                  {suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action)}
                      className="px-4 py-2 rounded-full text-sm bg-background border border-border hover:border-primary hover:text-primary transition"
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
                    <div className="w-8 h-8 shrink-0 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-[#04110F] font-semibold rounded-br-none shadow-lg shadow-primary/20' 
                      : 'bg-surface-hover text-text-main rounded-tl-none border border-border whitespace-pre-wrap'
                  }`}>
                    {msg.content}
                    {msg.mediaUrl && (
                      <SecureMediaRenderer url={msg.mediaUrl} type={msg.mediaType} token={msg.token} />
                    )}
                    {msg.transcriptText && msg.mediaType !== 'document' && (
                      <div className="mt-3">
                        <button 
                          onClick={() => printAsPdf(msg.transcriptText)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text-main rounded-lg shadow text-sm transition w-full max-w-sm justify-center"
                        >
                          <FileText className="w-4 h-4" /> Download PDF Transcript
                        </button>
                      </div>
                    )}
                    {msg.jobId && (
                      <div className="mt-3">
                        <Link 
                          to={`/translator?jobId=${msg.jobId}`} 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-[#04110F] font-semibold rounded-lg shadow-lg font-medium transition"
                        >
                          <Sparkles className="w-4 h-4" />
                          View Full Result
                        </Link>
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 shrink-0 bg-surface-hover rounded-full flex items-center justify-center border border-border">
                      <User className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 shrink-0 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-surface-hover border border-border rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-text-muted">Thinking...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-surface border-t border-border shrink-0">
            <div className="flex items-end gap-2 max-w-4xl mx-auto flex-wrap">
              <div className="w-full flex items-center gap-4 mb-2 flex-wrap sm:flex-nowrap">
                <input
                  type="file"
                  id="assistant-file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAttachedFile(file);
                      setError('');
                    }
                  }}
                />
                <label 
                  htmlFor="assistant-file" 
                  className="cursor-pointer flex items-center gap-2 text-sm text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/30 transition-colors max-w-xs truncate shrink-0"
                  title={attachedFile ? attachedFile.name : 'Attach Media'}
                >
                  <UploadCloud className="w-4 h-4 shrink-0" />
                  <span className="truncate">{attachedFile ? attachedFile.name : 'Attach Media'}</span>
                </label>

                <select 
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="bg-surface-hover border border-border rounded-lg text-sm px-3 py-1.5 text-text-main focus:outline-none"
                >
                  <option value="en">From: English</option>
                  <option value="es">From: Spanish</option>
                  <option value="fr">From: French</option>
                  <option value="de">From: German</option>
                  <option value="ja">From: Japanese</option>
                </select>
                
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="bg-surface-hover border border-border rounded-lg text-sm px-3 py-1.5 text-text-main focus:outline-none"
                >
                  <option value="en">Translate to: English</option>
                  <option value="es">Translate to: Spanish</option>
                  <option value="fr">Translate to: French</option>
                  <option value="de">Translate to: German</option>
                  <option value="ja">Translate to: Japanese</option>
                </select>
              </div>

              <div className="flex-1 bg-background border border-border focus-within:border-primary rounded-xl overflow-hidden transition-colors shadow-inner flex min-w-[200px]">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedJobId ? "Ask a question about the selected document..." : "Type your message or instructions for the attached file..."}
                  className="w-full bg-transparent text-text-main px-4 py-3 text-sm focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={() => handleSend(query)}
                disabled={!query.trim() || isLoading}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-[#04110F] font-semibold p-3 rounded-xl transition shadow-lg shadow-primary/20 shrink-0 flex items-center justify-center"
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

