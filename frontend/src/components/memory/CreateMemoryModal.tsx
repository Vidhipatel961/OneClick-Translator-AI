import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { memoryApi } from '../../api/memory';

interface CreateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateMemoryModal({ isOpen, onClose, onSuccess }: CreateMemoryModalProps) {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSourceText('');
      setTargetText('');
      setError(null);
      fetch('http://localhost:8000/api/languages')
        .then(res => res.json())
        .then(data => setLanguages(data))
        .catch(err => console.error("Failed to load languages:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim() || !targetText.trim()) {
      setError('Source text and Target text are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      await memoryApi.createMemory(token, {
        source_language: sourceLang,
        target_language: targetLang,
        source_text: sourceText,
        target_text: targetText
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create memory');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-main">Add Translation Memory</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition rounded-lg p-1 hover:bg-surface-hover">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">Source Language</label>
              <select
                value={sourceLang}
                onChange={e => setSourceLang(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {languages.map(l => (
                  <option key={`src-${l.code}`} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">Target Language</label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {languages.map(l => (
                  <option key={`tgt-${l.code}`} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-main mb-2">Source Text</label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
              placeholder="Enter original text"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-main mb-2">Target Text (Translation)</label>
            <textarea
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
              placeholder="Enter translated text"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-text-main hover:text-text-main transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary disabled:bg-primary/50 rounded-xl text-sm font-medium transition shadow-lg shadow-primary/20"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? 'Saving...' : 'Save Translation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

