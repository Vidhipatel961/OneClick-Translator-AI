import { apiUrl } from '../lib/api';

export interface TranslationMemory {
  id: string;
  source_language: string;
  target_language: string;
  source_text: string;
  target_text: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryCreate {
  source_language: string;
  target_language: string;
  source_text: string;
  target_text: string;
  project_id?: string;
}

export interface PaginatedMemoryResponse {
  items: TranslationMemory[];
  total: number;
  page: number;
  size: number;
}

export const memoryApi = {
  getMemories: async (
    token: string, 
    page: number = 1, 
    size: number = 20, 
    sourceLanguage?: string, 
    targetLanguage?: string, 
    search?: string
  ): Promise<PaginatedMemoryResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (sourceLanguage) params.append('source_language', sourceLanguage);
    if (targetLanguage) params.append('target_language', targetLanguage);
    if (search) params.append('search', search);

    const res = await fetch(apiUrl(`/api/memory/?${params.toString()}`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch translation memories');
    return res.json();
  },

  createMemory: async (token: string, data: MemoryCreate): Promise<TranslationMemory> => {
    const res = await fetch(apiUrl('/api/memory/'), {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create translation memory');
    return res.json();
  },

  deleteMemory: async (token: string, id: string): Promise<void> => {
    const res = await fetch(apiUrl(`/api/memory/${id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete translation memory');
  }
};
