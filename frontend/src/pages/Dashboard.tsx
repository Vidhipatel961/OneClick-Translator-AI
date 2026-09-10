import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, LayoutDashboard, FileText, FileAudio, Video, Database, Globe, Mic, Plus, ArrowRight, Clock, Clock3, HardDrive, CheckCircle2, Folder } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_translations: 0,
    audio_minutes: 0,
    video_minutes: 0,
    documents_processed: 0,
    characters_translated: 0,
    storage_used_mb: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [statsRes, jobsRes, usageRes] = await Promise.all([
        fetch('http://localhost:8000/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8000/api/jobs/?page=1&size=5', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8000/api/usage', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setRecentJobs(data.items);
      }
      if (usageRes.ok) setUsageData(await usageRes.json());
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const statCards = [
    { title: 'Total Translations', value: stats.total_translations, icon: <Globe className="w-6 h-6 text-indigo-400" />, bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { title: 'Audio Processed', value: `${stats.audio_minutes} mins`, icon: <FileAudio className="w-6 h-6 text-purple-400" />, bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { title: 'Video Processed', value: `${stats.video_minutes} mins`, icon: <Video className="w-6 h-6 text-rose-400" />, bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { title: 'Documents Translated', value: stats.documents_processed, icon: <FileText className="w-6 h-6 text-amber-400" />, bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { title: 'Characters Translated', value: stats.characters_translated.toLocaleString(), icon: <Activity className="w-6 h-6 text-emerald-400" />, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { title: 'Storage Used', value: `${stats.storage_used_mb} MB`, icon: <HardDrive className="w-6 h-6 text-blue-400" />, bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
  ];

  const quickActions = [
    { title: 'New Translation', desc: 'Start a blank workspace', icon: <Plus className="w-5 h-5 text-indigo-400" />, link: '/translator', color: 'indigo' },
    { title: 'My Projects', desc: 'Organize your workflows', icon: <Folder className="w-5 h-5 text-blue-400" />, link: '/projects', color: 'blue' },
    { title: 'Translate Audio', desc: 'Upload MP3/WAV files', icon: <Mic className="w-5 h-5 text-purple-400" />, link: '/translator', color: 'purple' },
    { title: 'Translate Video', desc: 'Upload MP4/MOV files', icon: <Video className="w-5 h-5 text-rose-400" />, link: '/translator', color: 'rose' },
    { title: 'Translation Memory', desc: 'Manage saved phrases', icon: <Database className="w-5 h-5 text-teal-400" />, link: '/memory', color: 'teal' },
    { title: 'Translate Document', desc: 'PDF, DOCX, PPTX', icon: <FileText className="w-5 h-5 text-amber-400" />, link: '/translator', color: 'amber' },
    { title: 'AI Assistant', desc: 'Chat with your files', icon: <Database className="w-5 h-5 text-emerald-400" />, link: '/assistant', color: 'emerald' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800">
            <LayoutDashboard className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Lingora Overview</span>
        </div>
        <div className="flex items-center gap-2">
          {usageData && (
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold tracking-wider">
              {usageData.tier} PLAN
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-8">
          
          {/* Stats Grid */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /> Platform Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statCards.map((stat, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm flex items-center gap-4 transition hover:-translate-y-1 hover:shadow-lg`}>
                  <div className="p-3 bg-slate-900/50 rounded-xl shadow-inner">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-100">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions & Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Quick Actions */}
            <section className="lg:col-span-1">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-purple-400" /> Quick Actions</h2>
              <div className="flex flex-col gap-3">
                {quickActions.map((action, i) => (
                  <Link 
                    key={i} 
                    to={action.link}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${action.color}-500/10`}>
                        {action.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200 group-hover:text-white transition">{action.title}</h4>
                        <p className="text-xs text-slate-500">{action.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Recent Translations */}
            <section className="lg:col-span-2">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><Clock3 className="w-5 h-5 text-emerald-400" /> Recent Translations</h2>
                <Link to="/history" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View all history →</Link>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                {recentJobs.length === 0 && !isLoading ? (
                  <div className="p-12 text-center text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No translations yet. Start your first project!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {recentJobs.map(job => (
                      <Link 
                        key={job.id} 
                        to={`/translator?jobId=${job.id}`}
                        className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 shadow-inner">
                            {job.mime_type.startsWith('video/') ? <Video className="w-5 h-5 text-indigo-400" /> : 
                             job.mime_type.startsWith('audio/') ? <FileAudio className="w-5 h-5 text-purple-400" /> : 
                             <FileText className="w-5 h-5 text-emerald-400" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-200 line-clamp-1">{job.filename}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="uppercase">{job.source_language}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="uppercase">{job.target_language}</span>
                              <span>•</span>
                              <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {job.status === 'COMPLETED' ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20"><CheckCircle2 className="w-3 h-3"/> Done</span>
                          ) : job.status === 'FAILED' ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">Failed</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">Processing...</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
            
          </div>
          
          {/* Usage Limits */}
          {usageData && (
            <section className="mt-4">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /> Plan Limits</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Characters Translated</span>
                    <span className="text-slate-200">{usageData.usage.characters_translated.toLocaleString()} / {usageData.limits.characters_translated.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (usageData.usage.characters_translated / usageData.limits.characters_translated) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Audio Minutes</span>
                    <span className="text-slate-200">{Math.floor(usageData.usage.audio_seconds/60)} / {Math.floor(usageData.limits.audio_seconds/60)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (usageData.usage.audio_seconds / usageData.limits.audio_seconds) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Video Minutes</span>
                    <span className="text-slate-200">{Math.floor(usageData.usage.video_seconds/60)} / {Math.floor(usageData.limits.video_seconds/60)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (usageData.usage.video_seconds / usageData.limits.video_seconds) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Documents Processed</span>
                    <span className="text-slate-200">{usageData.usage.documents_processed} / {usageData.limits.documents_processed}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (usageData.usage.documents_processed / usageData.limits.documents_processed) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">AI Requests</span>
                    <span className="text-slate-200">{usageData.usage.ai_requests} / {usageData.limits.ai_requests}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (usageData.usage.ai_requests / usageData.limits.ai_requests) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Storage Used</span>
                    <span className="text-slate-200">{(usageData.usage.storage_bytes / 1024 / 1024).toFixed(1)} MB / {(usageData.limits.storage_bytes / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (usageData.usage.storage_bytes / usageData.limits.storage_bytes) * 100)}%` }}></div>
                  </div>
                </div>
                
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
