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
    <div className="h-full bg-background text-text-main font-sans flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">×</button>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="opacity-70 hover:opacity-100">×</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main mb-1">Your Projects</h1>
            <p className="text-text-muted text-sm">Organize your translation jobs and files</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm text-text-main placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary rounded-xl text-sm font-medium transition shadow-lg shadow-primary/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </div>

        {/* Project Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-2xl bg-surface">
            <div className="p-4 bg-surface rounded-full mb-4">
              <FolderOpen className="w-8 h-8 text-text-disabled" />
            </div>
            <h3 className="text-lg font-medium text-text-main mb-2">No projects found</h3>
            <p className="text-text-disabled max-w-sm mb-6">
              {search ? "No projects match your search criteria." : "Create your first project to start organizing your translation workflows."}
            </p>
            {!search && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-surface-hover hover:bg-surface-hover rounded-xl text-sm font-medium transition"
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
                className="group relative flex flex-col p-6 rounded-2xl bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover transition-all cursor-pointer"
                onClick={() => {
                  navigate(`/projects/${project.id}`);
                }}
              >
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={(e) => handleDelete(e, project.id)}
                    disabled={isDeleting === project.id}
                    className="p-2 text-text-disabled hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    title="Delete Project"
                  >
                    {isDeleting === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-primary/10 w-fit rounded-xl border border-primary/20">
                  <Folder className="w-6 h-6 text-primary" />
                </div>
                
                <h3 className="text-lg font-bold text-text-main mb-2 truncate pr-8">{project.name}</h3>
                
                <p className="text-sm text-text-muted line-clamp-2 mb-6 flex-1">
                  {project.description || "No description provided."}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-text-disabled mt-auto pt-4 border-t border-border">
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

