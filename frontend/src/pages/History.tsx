import React, { useState, useEffect } from 'react';
import { ArrowLeft, History as HistoryIcon, Search, Filter, Download, Trash2, Eye, RefreshCw, Loader2, FileText, FileAudio, Video, File, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function History() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter, typeFilter]);
  
  const fetchHistory = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    let url = `http://localhost:8000/api/jobs/?page=${page}&size=10`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (typeFilter) url += `&mime_type=${typeFilter}`;
    
    try {
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.items);
        setTotalPages(Math.ceil(data.total / 10));
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };
  
  const deleteJob = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/api/jobs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchHistory();
  };
  
  const retryJob = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/api/jobs/${id}/retry`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchHistory();
  };
  
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-indigo-400" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-purple-400" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-rose-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-medium">Completed</span>;
      case 'FAILED': return <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-xs font-medium">Failed</span>;
      case 'PENDING': return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-md text-xs font-medium">Pending</span>;
      default: return <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md text-xs font-medium flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Processing</span>;
    }
  };
  
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <HistoryIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Translation History</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-4">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
              <option value="TRANSLATING">Processing</option>
            </select>
            
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All File Types</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
              <option value="application/pdf">PDF</option>
              <option value="image">Image</option>
              <option value="officedocument">Office Document</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Language Pair</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                      <p className="text-slate-400">Loading history...</p>
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      No translation history found.
                    </td>
                  </tr>
                ) : (
                  jobs.map(job => (
                    <tr key={job.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(job.mime_type)}
                          <div>
                            <p className="font-medium text-slate-200 line-clamp-1">{job.filename}</p>
                            <p className="text-xs text-slate-500">{(job.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="uppercase font-medium text-slate-300">{job.source_language}</span>
                          <ArrowLeft className="w-3 h-3 text-slate-500 rotate-180" />
                          <span className="uppercase font-medium text-slate-300">{job.target_language}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {formatTime(job.processing_time_seconds)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {job.status === 'FAILED' && (
                            <button onClick={() => retryJob(job.id)} className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition" title="Retry">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          {job.status === 'COMPLETED' && (
                            <Link to={`/translator?jobId=${job.id}`} className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition" title="View Result">
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          <button onClick={() => deleteJob(job.id)} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-slate-800 disabled:opacity-50 text-white rounded hover:bg-slate-700"
                >
                  Previous
                </button>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-slate-800 disabled:opacity-50 text-white rounded hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
