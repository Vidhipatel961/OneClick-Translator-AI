import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Folder, FolderOpen, Plus, Trash2, Calendar, Search, Loader2 } from 'lucide-react';
import { projectsApi, type Project } from '../api/projects';
import CreateProjectModal from '../components/projects/CreateProjectModal';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      const data = await projectsApi.getProjects(token);
      setProjects(data);
    } catch (err: any) {
      setError('Failed to load projects. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    setIsDeleting(id);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      await projectsApi.deleteProject(token, id);
      setProjects(projects.filter(p => p.id !== id));
      showSuccess('Project deleted successfully');
    } catch (err: any) {
      setError('Failed to delete project');
    } finally {
      setIsDeleting(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleProjectCreated = () => {
    setIsModalOpen(false);
    showSuccess('Project created successfully!');
    fetchProjects();
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-lg text-slate-100">Projects</span>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Notifications */}
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Your Projects</h1>
            <p className="text-slate-400 text-sm">Organize your translation jobs and files</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* Project Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <div className="p-4 bg-slate-900 rounded-full mb-4">
              <FolderOpen className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-200 mb-2">No projects found</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              {search ? "No projects match your search criteria." : "Create your first project to start organizing your translation workflows."}
            </p>
            {!search && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition"
              >
                Create a Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
                className="group relative flex flex-col p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer"
                onClick={() => {
                  navigate(`/projects/${project.id}`);
                }}
              >
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={(e) => handleDelete(e, project.id)}
                    disabled={isDeleting === project.id}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    title="Delete Project"
                  >
                    {isDeleting === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-indigo-500/10 w-fit rounded-xl border border-indigo-500/20">
                  <Folder className="w-6 h-6 text-indigo-400" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-100 mb-2 truncate pr-8">{project.name}</h3>
                
                <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1">
                  {project.description || "No description provided."}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-auto pt-4 border-t border-slate-800/50">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
