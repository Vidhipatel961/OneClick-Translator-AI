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

  if (isLoading) return <div className="h-full bg-background flex items-center justify-center text-text-main"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="h-full bg-background text-text-main font-sans flex flex-col">
      <header className="border-b border-border bg-surface p-4 flex items-center gap-4 z-10 backdrop-blur-md">
        <Link to="/" className="text-text-muted hover:text-text-main transition p-2 rounded-full hover:bg-surface-hover">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Book className="w-4 h-4 text-text-main" />
        </div>
        <span className="font-semibold text-lg">Translation Memory & Glossaries</span>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-main">Your Glossaries</h2>
              <button onClick={() => setIsCreating(!isCreating)} className="p-1 rounded bg-primary/20 text-primary hover:bg-primary/30">
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
                  className="flex-1 bg-background border border-border rounded p-2 text-sm text-text-main"
                />
                <button onClick={createGlossary} className="bg-primary p-2 rounded text-text-main"><Save className="w-4 h-4" /></button>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {glossaries.map(g => (
                <div 
                  key={g.id} 
                  onClick={() => setActiveGlossary(g)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border ${activeGlossary?.id === g.id ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-hover border-border text-text-main hover:bg-surface-hover'}`}
                >
                  <span className="font-medium">{g.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteGlossary(g.id); }} className="text-text-disabled hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {glossaries.length === 0 && !isCreating && <p className="text-text-disabled text-sm italic">No glossaries created.</p>}
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-4">
          {activeGlossary ? (
            <div className="bg-surface border border-border rounded-xl flex-1 flex flex-col shadow-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="font-semibold text-lg">{activeGlossary.name} - Terms</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-disabled" />
                  <input 
                    type="text" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search terms..." 
                    className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-main focus:border-primary outline-none"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-surface-hover border-b border-border flex flex-col sm:flex-row gap-2 sm:items-center">
                <input type="text" placeholder="Source Term" value={newTerm.source_term} onChange={e => setNewTerm({...newTerm, source_term: e.target.value})} className="flex-1 bg-background border border-border rounded p-2 text-sm text-text-main" />
                <input type="text" placeholder="Target Term" value={newTerm.target_term} onChange={e => setNewTerm({...newTerm, target_term: e.target.value})} className="flex-1 bg-background border border-border rounded p-2 text-sm text-text-main" />
                <button onClick={addTerm} disabled={!newTerm.source_term || !newTerm.target_term} className="bg-primary disabled:opacity-50 text-[#04110F] px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Term</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full text-left text-sm text-text-main">
                  <thead className="text-xs text-text-disabled uppercase bg-background">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Source Term</th>
                      <th className="px-4 py-3">Target Term</th>
                      <th className="px-4 py-3 rounded-tr-lg w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {terms.map(t => (
                      <tr key={t.id} className="border-b border-border hover:bg-surface-hover">
                        <td className="px-4 py-3 font-medium text-text-main">{t.source_term}</td>
                        <td className="px-4 py-3 text-primary font-medium">{t.target_term}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteTerm(t.id)} className="text-text-disabled hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                    {terms.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-text-disabled italic">No terms found in this glossary.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl flex-1 flex flex-col shadow-xl items-center justify-center text-text-disabled">
              <Book className="w-16 h-16 mb-4 opacity-20" />
              <p>Select or create a glossary to manage terms.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

