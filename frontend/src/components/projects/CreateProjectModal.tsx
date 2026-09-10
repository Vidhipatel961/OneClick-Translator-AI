import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { projectsApi } from '../../api/projects';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      
      await projectsApi.createProject(token, { 
        name: name.trim(), 
        description: description.trim() || undefined 
      });
      
      setName('');
      setDescription('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Create New Project</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="e.g. Q4 Marketing Video"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                Description <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
                placeholder="Briefly describe this project..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
