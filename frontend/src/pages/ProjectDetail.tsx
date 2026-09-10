import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, History as HistoryIcon, Loader2, FileText, FileAudio, Video, File, Image as ImageIcon, Trash2, Eye, RefreshCw } from 'lucide-react';
import { projectsApi, type Project } from '../api/projects';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };
  
  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, page]);
  
  const fetchProjectData = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    if (!token) {
        setError('Unauthorized');
        setIsLoading(false);
        return;
    }
    
    try {
      // Fetch project details
      if (!project) {
        const projData = await projectsApi.getProject(projectId!, token);
        setProject(projData);
      }
      
      // Fetch associated jobs
      const url = `http://localhost:8000/api/jobs/?page=${page}&size=10&project_id=${projectId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      
      if (res.ok) {
        const data = await res.json();
        setJobs(data.items);
        setTotalPages(Math.ceil(data.total / 10));
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An error occurred');
    }
    setIsLoading(false);
  };
  
  const deleteJob = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:8000/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showSuccess('Job deleted successfully');
      fetchProjectData();
    } catch (e: any) {
      setError('Failed to delete job');
    }
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

  if (error && !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-8">
         <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Project</h2>
         <p className="text-slate-400 mb-6">{error}</p>
         <Link to="/projects" className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <HistoryIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Project Details</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Notifications */}
        {error && !project && (
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

        {isLoading && !project ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
             <p>Loading project details...</p>
          </div>
        ) : project ? (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8 shadow-xl shadow-black/20">
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-slate-400 mb-6 max-w-3xl">{project.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="font-medium text-slate-300">Created:</span>
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-indigo-400" />
              Translation Jobs
            </h2>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">File Name</th>
                      <th className="px-6 py-4">Language Pair</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && jobs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                          <p className="text-slate-400">Loading jobs...</p>
                        </td>
                      </tr>
                    ) : jobs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                          No translation jobs found in this project.
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
                          <td className="px-6 py-4">
                            {getStatusBadge(job.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
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
              
              {!isLoading && totalPages > 1 && (
                <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
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
          </>
        ) : null}
      </main>
    </div>
  );
}
