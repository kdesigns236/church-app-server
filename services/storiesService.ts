export type StoryMedia = { url: string; type: 'image' | 'video' };
export type Story = {
  id: string;
  author: string;
  authorId?: string;
  content?: string;
  media: StoryMedia;
  createdAt: string;
  expiresAt: string;
};

const getApiUrl = (): string => {
  try {
    const w: any = (typeof window !== 'undefined') ? window : {};
    const fromWindow = w.__APP_RUNTIME_CONFIG__?.apiUrl;
    const fromStorage = (typeof localStorage !== 'undefined') ? localStorage.getItem('apiBaseUrl') : null;
    const fromEnv = (import.meta as any)?.env?.VITE_API_URL;
    const fallback = 'https://church-app-server.onrender.com/api';
    const url = (fromStorage || fromWindow || fromEnv || fallback) as string;
    return url.endsWith('/') ? url.replace(/\/$/, '') : url;
  } catch {
    return 'https://church-app-server.onrender.com/api';
  }
};

class StoriesService {
  async fetchStories(): Promise<Story[]> {
    const api = getApiUrl();
    const res = await fetch(`${api}/stories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async createStory(media: StoryMedia, text?: string): Promise<Story | null> {
    const api = getApiUrl();
    const token = (typeof localStorage !== 'undefined') ? (localStorage.getItem('authToken') || '') : '';
    const res = await fetch(`${api}/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ media, text: text || '' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.story ? data.story as Story : null;
  }

  async updateStory(id: string, updates: { text?: string; media?: StoryMedia; resetTtl?: boolean }): Promise<Story | null> {
    const api = getApiUrl();
    const token = (typeof localStorage !== 'undefined') ? (localStorage.getItem('authToken') || '') : '';
    const res = await fetch(`${api}/stories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...(typeof updates.text === 'string' ? { text: updates.text } : {}),
        ...(updates.media ? { media: updates.media } : {}),
        ...(updates.resetTtl ? { resetTtl: true } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.story ? data.story as Story : null;
  }

  async deleteStory(id: string): Promise<boolean> {
    const api = getApiUrl();
    const token = (typeof localStorage !== 'undefined') ? (localStorage.getItem('authToken') || '') : '';
    const res = await fetch(`${api}/stories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    return res.ok;
  }
}

export const storiesService = new StoriesService();
