import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Edit2, Search, ArrowLeft, Loader2, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Glossaries() {
  const [glossaries, setGlossaries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGlossary, setActiveGlossary] = useState<any | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newGlossaryName, setNewGlossaryName] = useState('');
  
  const [terms, setTerms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  
  const [newTerm, setNewTerm] = useState({ source_term: '', target_term: '', source_language: 'en', target_language: 'es' });

  useEffect(() => {
    fetchGlossaries();
  }, []);

  const fetchGlossaries = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/glossaries/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setGlossaries(data);
      if (data.length > 0 && !activeGlossary) {
        setActiveGlossary(data[0]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeGlossary) {
      fetchTerms(activeGlossary.id);
    }
  }, [activeGlossary, search]);

  const fetchTerms = async (glossaryId: string) => {
    const token = localStorage.getItem('token');
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`http://localhost:8000/api/glossaries/${glossaryId}/terms${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setTerms(await res.json());
    }
  };

  const createGlossary = async () => {
    if (!newGlossaryName) return;
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/glossaries/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: newGlossaryName })
    });
    if (res.ok) {
      setNewGlossaryName('');
      setIsCreating(false);
      fetchGlossaries();
    }
  };

  const deleteGlossary = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/api/glossaries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (activeGlossary?.id === id) setActiveGlossary(null);
    fetchGlossaries();
  };

  const addTerm = async () => {
    if (!activeGlossary || !newTerm.source_term || !newTerm.target_term) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/api/glossaries/${activeGlossary.id}/terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newTerm)
    });
    if (res.ok) {
      setNewTerm({ source_term: '', target_term: '', source_language: 'en', target_language: 'es' });
      fetchTerms(activeGlossary.id);
    }
  };

  const deleteTerm = async (termId: string) => {
    if (!activeGlossary) return;
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:8000/api/glossaries/${activeGlossary.id}/terms/${termId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchTerms(activeGlossary.id);
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-md">
        <Link to="/" className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Book className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-lg">Translation Memory & Glossaries</span>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6">
        <div className="w-1/3 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Your Glossaries</h2>
              <button onClick={() => setIsCreating(!isCreating)} className="p-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {isCreating && (
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newGlossaryName} 
                  onChange={e => setNewGlossaryName(e.target.value)} 
                  placeholder="Glossary Name" 
                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white"
                />
                <button onClick={createGlossary} className="bg-indigo-600 p-2 rounded text-white"><Save className="w-4 h-4" /></button>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {glossaries.map(g => (
                <div 
                  key={g.id} 
                  onClick={() => setActiveGlossary(g)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border ${activeGlossary?.id === g.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                >
                  <span className="font-medium">{g.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteGlossary(g.id); }} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {glossaries.length === 0 && !isCreating && <p className="text-slate-500 text-sm italic">No glossaries created.</p>}
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-4">
          {activeGlossary ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <h2 className="font-semibold text-lg">{activeGlossary.name} - Terms</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input 
                    type="text" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search terms..." 
                    className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex gap-2 items-center">
                <input type="text" placeholder="Source Term" value={newTerm.source_term} onChange={e => setNewTerm({...newTerm, source_term: e.target.value})} className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white" />
                <input type="text" placeholder="Target Term" value={newTerm.target_term} onChange={e => setNewTerm({...newTerm, target_term: e.target.value})} className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white" />
                <button onClick={addTerm} disabled={!newTerm.source_term || !newTerm.target_term} className="bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Term</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Source Term</th>
                      <th className="px-4 py-3">Target Term</th>
                      <th className="px-4 py-3 rounded-tr-lg w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {terms.map(t => (
                      <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-medium text-white">{t.source_term}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">{t.target_term}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteTerm(t.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                    {terms.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-500 italic">No terms found in this glossary.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col shadow-xl items-center justify-center text-slate-500">
              <Book className="w-16 h-16 mb-4 opacity-20" />
              <p>Select or create a glossary to manage terms.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
