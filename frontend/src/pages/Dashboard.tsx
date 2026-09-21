import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, LayoutDashboard, FileText, FileAudio, Video, Database, Globe, Mic, Plus, ArrowRight, Clock, Clock3, HardDrive, CheckCircle2, Folder, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';

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
    { title: 'Total Translations', value: stats.total_translations, suffix: '', icon: <Globe className="w-5 h-5 text-primary" />, color: 'primary' },
    { title: 'Audio Processed', value: stats.audio_minutes, suffix: ' mins', icon: <FileAudio className="w-5 h-5 text-secondary" />, color: 'secondary' },
    { title: 'Video Processed', value: stats.video_minutes, suffix: ' mins', icon: <Video className="w-5 h-5 text-accent" />, color: 'accent' },
    { title: 'Documents Translated', value: stats.documents_processed, suffix: '', icon: <FileText className="w-5 h-5 text-primary" />, color: 'primary' },
    { title: 'Characters Translated', value: stats.characters_translated, suffix: '', icon: <Activity className="w-5 h-5 text-secondary" />, color: 'secondary' },
    { title: 'Storage Used', value: stats.storage_used_mb, suffix: ' MB', icon: <HardDrive className="w-5 h-5 text-accent" />, color: 'accent' }
  ];

  const quickActions = [
    { title: 'New Translation', desc: 'Start a blank workspace', icon: <Plus className="w-5 h-5 text-primary" />, link: '/translator' },
    { title: 'My Projects', desc: 'Organize your workflows', icon: <Folder className="w-5 h-5 text-secondary" />, link: '/projects' },
    { title: 'Translate Audio', desc: 'Upload MP3/WAV files', icon: <Mic className="w-5 h-5 text-accent" />, link: '/translator' },
    { title: 'Translate Video', desc: 'Upload MP4/MOV files', icon: <Video className="w-5 h-5 text-primary" />, link: '/translator' },
    { title: 'Translation Memory', desc: 'Manage saved phrases', icon: <Database className="w-5 h-5 text-secondary" />, link: '/memory' },
    { title: 'Translate Document', desc: 'PDF, DOCX, PPTX', icon: <FileText className="w-5 h-5 text-accent" />, link: '/translator' },
    { title: 'AI Assistant', desc: 'Chat with your files', icon: <Database className="w-5 h-5 text-primary" />, link: '/assistant' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-8 w-48 bg-surface rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-surface rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-7xl mx-auto">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight mb-1">Here's what's happening today.</h1>
          <p className="text-text-muted">Your localization workspace at a glance.</p>
        </div>
        {usageData && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass border border-primary/30">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-sm font-bold text-primary uppercase tracking-wider">{usageData.tier} PLAN</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, i) => (
            <Card key={i} glass className="flex items-center gap-5 hover:-translate-y-1 transition-all duration-300 group hover:border-primary/40">
              <div className={`p-3.5 rounded-xl bg-background border border-border shadow-inner group-hover:shadow-[0_0_15px_rgba(var(--primary),0.15)] transition-shadow`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold tracking-tight text-text-main"><AnimatedCounter value={stat.value} suffix={stat.suffix} /></h3>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions */}
        <section className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 text-text-main flex items-center gap-2">
            <Plus className="w-5 h-5 text-secondary" /> Quick Actions
          </h2>
          <div className="flex flex-col gap-3">
            {quickActions.map((action, i) => (
              <Link 
                key={i} 
                to={action.link}
                className="flex items-center justify-between p-4 rounded-xl glass hover:bg-surface-hover border border-border hover:border-border transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-background border border-border">
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-main text-sm">{action.title}</h4>
                    <p className="text-xs text-text-muted mt-0.5">{action.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-disabled group-hover:text-primary group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Translations */}
        <section className="lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-semibold text-text-main flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-primary" /> Recent Activity
            </h2>
            <Link to="/history" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">View all →</Link>
          </div>
          <Card glass className="flex-1 flex flex-col overflow-hidden p-0">
            {recentJobs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-text-disabled">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p>No recent activity. Start a new project!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentJobs.map(job => (
                  <Link 
                    key={job.id} 
                    to={`/translator?jobId=${job.id}`}
                    className="flex items-center justify-between p-5 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-background rounded-lg border border-border shadow-inner">
                        {job.mime_type.startsWith('video/') ? <Video className="w-5 h-5 text-accent" /> : 
                         job.mime_type.startsWith('audio/') ? <FileAudio className="w-5 h-5 text-secondary" /> : 
                         <FileText className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-main text-sm line-clamp-1">{job.filename}</h4>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                          <span className="uppercase font-semibold">{job.source_language}</span>
                          <ArrowRight className="w-3 h-3 text-text-disabled" />
                          <span className="uppercase font-semibold">{job.target_language}</span>
                          <span className="text-text-disabled">•</span>
                          <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {job.status === 'COMPLETED' ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20"><CheckCircle2 className="w-3.5 h-3.5"/> Done</span>
                      ) : job.status === 'FAILED' ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20"><AlertCircle className="w-3.5 h-3.5"/> Failed</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-md border border-accent/20">Processing...</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </section>
        
      </div>
      
      {/* Usage Limits */}
      {usageData && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-text-main flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" /> Plan Limits
          </h2>
          <Card glass className="p-6 sm:p-8">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Characters</span>
                    <span className="text-text-main font-medium">{usageData.usage.characters_translated.toLocaleString()} / {usageData.limits.characters_translated.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(207,255,74,0.5)]" style={{ width: `${Math.min(100, (usageData.usage.characters_translated / usageData.limits.characters_translated) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Audio (mins)</span>
                    <span className="text-text-main font-medium">{Math.floor(usageData.usage.audio_seconds/60)} / {Math.floor(usageData.limits.audio_seconds/60)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-secondary rounded-full shadow-[0_0_10px_rgba(33,214,178,0.5)]" style={{ width: `${Math.min(100, (usageData.usage.audio_seconds / usageData.limits.audio_seconds) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Video (mins)</span>
                    <span className="text-text-main font-medium">{Math.floor(usageData.usage.video_seconds/60)} / {Math.floor(usageData.limits.video_seconds/60)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(242,230,109,0.5)]" style={{ width: `${Math.min(100, (usageData.usage.video_seconds / usageData.limits.video_seconds) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Documents</span>
                    <span className="text-text-main font-medium">{usageData.usage.documents_processed} / {usageData.limits.documents_processed}</span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(207,255,74,0.5)]" style={{ width: `${Math.min(100, (usageData.usage.documents_processed / usageData.limits.documents_processed) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">AI Requests</span>
                    <span className="text-text-main font-medium">{usageData.usage.ai_requests} / {usageData.limits.ai_requests}</span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-secondary rounded-full shadow-[0_0_10px_rgba(33,214,178,0.5)]" style={{ width: `${Math.min(100, (usageData.usage.ai_requests / usageData.limits.ai_requests) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Storage (MB)</span>
                    <span className="text-text-main font-medium">{(usageData.usage.storage_bytes / 1024 / 1024).toFixed(1)} / {(usageData.limits.storage_bytes / 1024 / 1024).toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(242,230,109,0.5)]" style={{ width: `${Math.min(100, (usageData.usage.storage_bytes / usageData.limits.storage_bytes) * 100)}%` }}></div>
                  </div>
                </div>
                
             </div>
          </Card>
        </section>
      )}

    </div>
  );
}

