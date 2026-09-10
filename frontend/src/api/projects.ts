const API_BASE_URL = 'http://localhost:8000/api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
}

export const projectsApi = {
  getProjects: async (token: string): Promise<Project[]> => {
    const res = await fetch(`${API_BASE_URL}/projects/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  getProject: async (token: string, projectId: string): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  createProject: async (token: string, data: ProjectCreate): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  deleteProject: async (token: string, projectId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete project');
  }
};
