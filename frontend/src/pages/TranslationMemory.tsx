import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Database, Plus, Search, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { memoryApi, type TranslationMemory as TMemory } from '../api/memory';
import CreateMemoryModal from '../components/memory/CreateMemoryModal';

export default function TranslationMemory() {
  const [memories, setMemories] = useState<TMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sourceLangFilter, setSourceLangFilter] = useState('');
  const [targetLangFilter, setTargetLangFilter] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };
  
  const [languages, setLanguages] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/languages')
      .then(res => res.json())
      .then(data => setLanguages(data))
      .catch(err => console.error("Failed to load languages", err));
  }, []);

  const fetchMemories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      const data = await memoryApi.getMemories(token, page, 10, sourceLangFilter, targetLangFilter, search);
      setMemories(data.items);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (err: any) {
      setError('Failed to load translation memories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [page, sourceLangFilter, targetLangFilter]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchMemories();
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this translation memory entry?')) return;
    
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      await memoryApi.deleteMemory(token, id);
      setMemories(memories.filter(m => m.id !== id));
      showSuccess('Memory deleted successfully');
    } catch (err: any) {
      setError('Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-lg text-slate-100">Translation Memory</span>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Add Translation
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">×</button>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="opacity-70 hover:opacity-100">×</button>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search source text..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={sourceLangFilter}
              onChange={(e) => { setSourceLangFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Source Language</option>
              {languages.map(l => (
                <option key={`src-${l.code}`} value={l.code}>{l.name}</option>
              ))}
            </select>
            <select 
              value={targetLangFilter}
              onChange={(e) => { setTargetLangFilter(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Target Language</option>
              {languages.map(l => (
                <option key={`tgt-${l.code}`} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 min-w-[800px]">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 w-1/4">Source</th>
                  <th className="px-6 py-4 w-1/4">Target</th>
                  <th className="px-6 py-4 w-1/6">Language Pair</th>
                  <th className="px-6 py-4 w-1/6">Project</th>
                  <th className="px-6 py-4 w-1/6">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                      <p className="text-slate-400">Loading memory entries...</p>
                    </td>
                  </tr>
                ) : memories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                      <Database className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                      <p className="text-lg text-slate-400 mb-2">No translation memory entries found.</p>
                      <p className="text-sm">Entries matching your filters will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  memories.map(memory => (
                    <tr key={memory.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <p className="text-slate-200 line-clamp-3">{memory.source_text}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300 line-clamp-3">{memory.target_text}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="uppercase font-medium text-slate-400 text-xs">{memory.source_language}</span>
                          <ArrowLeft className="w-3 h-3 text-slate-600 rotate-180" />
                          <span className="uppercase font-medium text-slate-400 text-xs">{memory.target_language}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {memory.project_id ? (
                          <span className="bg-slate-800/50 px-2 py-1 rounded-md text-slate-400 border border-slate-700">Has Project</span>
                        ) : (
                          <span className="text-slate-600 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(memory.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(memory.id)}
                          disabled={deletingId === memory.id}
                          className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50 inline-flex"
                          title="Delete"
                        >
                          {deletingId === memory.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!isLoading && totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50 mt-auto">
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 bg-slate-800 disabled:opacity-50 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-700 transition"
                >
                  Previous
                </button>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-slate-800 disabled:opacity-50 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-700 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateMemoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          setPage(1);
          fetchMemories();
        }}
      />
    </div>
  );
}
