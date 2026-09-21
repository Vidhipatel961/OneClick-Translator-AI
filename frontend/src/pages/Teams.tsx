import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Mail, Shield, ShieldCheck } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  owner_id: string;
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/teams', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTeams(data);
      if (data.length > 0 && !selectedTeamId) {
        setSelectedTeamId(data[0].id);
      }
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/teams', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newTeamName })
    });
    
    if (res.ok) {
      setNewTeamName('');
      fetchTeams();
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !inviteEmail) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:8000/api/teams/${selectedTeamId}/invite`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole })
    });
    
    if (res.ok) {
      setInviteEmail('');
      alert("Invitation sent!");
    } else {
      const err = await res.json();
      alert(err.detail || "Failed to invite member");
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-main p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Teams & Collaboration</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Teams List */}
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">Your Workspaces</h2>
            
            <form onSubmit={handleCreateTeam} className="mb-6 flex gap-2">
              <input 
                type="text" 
                placeholder="New Team Name" 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <button type="submit" className="bg-primary hover:bg-primary-dark px-3 py-2 rounded-lg text-sm font-medium transition">
                Create
              </button>
            </form>

            <div className="space-y-2">
              {teams.length === 0 ? (
                <p className="text-text-disabled text-sm">No teams found.</p>
              ) : (
                teams.map(team => (
                  <div 
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3 rounded-lg cursor-pointer border transition ${selectedTeamId === team.id ? 'bg-primary/20 border-primary' : 'bg-surface border-border hover:border-border'}`}
                  >
                    {team.name}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Team Details & Invites */}
          <div className="md:col-span-2">
            {selectedTeamId ? (
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" /> 
                  Invite Members
                </h2>
                
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-background rounded-xl border border-border">
                  <div className="flex-1 relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                      required
                    />
                  </div>
                  
                  <div className="relative w-full sm:w-48">
                    <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 appearance-none focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="EDITOR">Editor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <button type="submit" className="bg-primary hover:bg-primary-dark px-6 py-2 rounded-lg font-medium transition whitespace-nowrap">
                    Send Invite
                  </button>
                </form>

                <div>
                  <h3 className="font-medium text-text-muted mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Member Management coming soon...
                  </h3>
                  <div className="h-32 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-text-disabled text-sm">
                    Existing members will be listed here.
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-text-disabled">
                Select or create a team to manage it
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

