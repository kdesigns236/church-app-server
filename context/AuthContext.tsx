

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiClient } from '../utils/apiClient';
import { websocketService } from '../services/websocketService';

export interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, profilePictureFile?: File | null) => Promise<void>;
  logout: () => void;
  updateUserRole: (userId: string, role: 'admin' | 'member') => void;
  updateUser: (userId: string, data: { name: string; email: string; }, profilePictureFile?: File | null) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdminUser: User = { id: 'admin-user-001', name: 'Admin', email: 'admin@church.com', role: 'admin', profilePictureUrl: 'https://res.cloudinary.com/de0zuglgd/image/upload/v1761829850/church-profiles/x3thqajc5samerpfacyq.png' };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([defaultAdminUser]);
  const [isLoading, setIsLoading] = useState(true);

  const getApiUrl = () => ((import.meta as any).env.VITE_API_URL || 'https://church-app-server.onrender.com/api') as string;
  const warmServer = async () => {
    try {
      const base = getApiUrl().replace(/\/api$/, '');
      await apiClient.fetch(`${base}/api/health`, { method: 'GET', timeoutMs: 10000 });
    } catch {}
  };
  const isTimeoutError = (err: any) => !!err && typeof err.message === 'string' && /timeout/i.test(err.message);

  const dedupeUsers = (list: User[]): User[] => {
    try {
      if (!Array.isArray(list)) return [];
      const byEmail = new Map<string, User>();
      const byId = new Map<string, User>();
      for (const u of list) {
        if (!u) continue;
        const emailKey = (u.email || '').toLowerCase();
        const isPlaceholder = u.id === 'admin-user-001';
        if (emailKey) {
          if (!byEmail.has(emailKey)) {
            byEmail.set(emailKey, u);
          } else {
            const existing = byEmail.get(emailKey)!;
            const existingIsPlaceholder = existing.id === 'admin-user-001';
            const winner = existingIsPlaceholder && !isPlaceholder ? u : existing;
            byEmail.set(emailKey, { ...winner, profilePictureUrl: winner.profilePictureUrl || existing.profilePictureUrl });
          }
        } else {
          // Fallback to id when email missing
          if (!byId.has(u.id)) byId.set(u.id, u);
        }
      }
      // Combine email-keyed and id-keyed unique users
      const result: User[] = [...byEmail.values()];
      for (const [id, u] of byId.entries()) {
        if (!u.email || !byEmail.has((u.email || '').toLowerCase())) {
          result.push(u);
        }
      }
      return result;
    } catch {
      return list;
    }
  };

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // One-time cleanup: remove any legacy users from churchUserList, keeping only admin
        const storedUserList = localStorage.getItem('churchUserList');
        const cleanupFlag = localStorage.getItem('churchUserListCleaned_v1');

        if (!cleanupFlag) {
          let initialList: User[] = [defaultAdminUser];

          if (storedUserList) {
            try {
              const parsed = JSON.parse(storedUserList);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const filtered = parsed.filter((u: any) =>
                  u && (u.id === 'admin-user-001' || u.email === 'admin@church.com' || u.role === 'admin'),
                );
                initialList = filtered.length > 0 ? filtered : [defaultAdminUser];
              }
            } catch {
              initialList = [defaultAdminUser];
            }
          }

          const cleaned = dedupeUsers(initialList);
          localStorage.setItem('churchUserList', JSON.stringify(cleaned));
          localStorage.setItem('churchUserListCleaned_v1', 'true');
          setUsers(cleaned);
        } else {
          // Normal initialization path after cleanup has already run once
          if (storedUserList) {
            try {
              const parsed = JSON.parse(storedUserList);
              const cleaned = dedupeUsers(Array.isArray(parsed) ? parsed : []);
              setUsers(cleaned);
              localStorage.setItem('churchUserList', JSON.stringify(cleaned));
            } catch {
              setUsers([defaultAdminUser]);
            }
          } else {
            localStorage.setItem('churchUserList', JSON.stringify([defaultAdminUser]));
          }
        }

        // Check for a currently logged-in user
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Map backend field to frontend if needed
          const mappedUser = {
            ...parsedUser,
            profilePictureUrl: parsedUser.profilePicture || parsedUser.profilePictureUrl
          };
          setUser(mappedUser);
        }
      } catch (error) {
        console.error("Failed to parse data from localStorage", error);
        localStorage.removeItem('authUser');
        localStorage.removeItem('churchUserList');
      } finally {
        // Remove artificial delay
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Reflect socket connection as self presence immediately and re-announce on reconnect
  useEffect(() => {
    const setSelfOnline = (online: boolean) => {
      if (!user) return;
      setUsers(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        const next = arr.map(u => u.id === user.id ? { ...u, isOnline: online } : u);
        try { localStorage.setItem('churchUserList', JSON.stringify(next)); } catch {}
        return next;
      });
    };

    const handleConnected = () => {
      setSelfOnline(true);
      try {
        const token = localStorage.getItem('authToken');
        if (token) websocketService.getSocket().emit('user-online', { token });
      } catch {}
    };
    const handleDisconnected = () => setSelfOnline(false);

    websocketService.addListener('connected', handleConnected);
    websocketService.addListener('disconnected', handleDisconnected);
    return () => {
      websocketService.removeListener('connected', handleConnected);
      websocketService.removeListener('disconnected', handleDisconnected);
    };
  }, [user]);

  // Presence heartbeat every 25s while authenticated
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const sock = websocketService.getSocket();
    const emitPing = () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token && sock && sock.connected) sock.emit('presence:ping', { token });
      } catch {}
    };
    emitPing();
    const id = window.setInterval(emitPing, 25000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [user]);



  // Bootstrap full users list from server once (ensures we see everyone even before they come online)
  useEffect(() => {
    const bootstrapUsers = async () => {
      try {
        const data = await websocketService.pullFromServer();
        if (data && Array.isArray(data.users) && data.users.length > 0) {
          setUsers(prev => {
            const current = Array.isArray(prev) ? prev : [];
            const map = new Map<string, User>();
            current.forEach(u => map.set(u.id, u));
            (data.users as User[]).forEach(u => {
              // Merge existing fields with server fields
              const existing = map.get(u.id) || ({} as User);
              map.set(u.id, { ...existing, ...u });
            });
            const next = Array.from(map.values());
            const deduped = dedupeUsers(next);
            try { localStorage.setItem('churchUserList', JSON.stringify(deduped)); } catch {}
            return deduped;
          });
        }
      } catch (err) {
        // ignore bootstrap failure; app will rely on local cache and realtime updates
      }
    };
    bootstrapUsers();
  }, []);

  // Keep users list in sync with real-time updates (including online status)
  useEffect(() => {
    const handleSyncUpdate = (syncData: any) => {
      if (!syncData || syncData.type !== 'users' || !syncData.action || !syncData.data) return;

      setUsers(prevUsers => {
        const current = Array.isArray(prevUsers) ? prevUsers : [];
        let next = current;
        switch (syncData.action) {
          case 'add': {
            if (!current.find(u => u.id === syncData.data.id)) {
              next = [...current, syncData.data];
            }
            break;
          }
          case 'update': {
            const exists = current.some(u => u.id === syncData.data.id);
            next = exists
              ? current.map(u => (u.id === syncData.data.id ? { ...u, ...syncData.data } : u))
              : [...current, syncData.data];
            break;
          }
          case 'delete': {
            next = current.filter(u => u.id !== syncData.data.id);
            break;
          }
          case 'clear': {
            next = [];
            break;
          }
          default: {
            next = current;
          }
        }
        next = dedupeUsers(next);
        try {
          localStorage.setItem('churchUserList', JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    websocketService.addListener('sync_update', handleSyncUpdate);

    return () => {
      websocketService.removeListener('sync_update', handleSyncUpdate);
    };
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    console.log('[AuthContext] Starting login process...');
    const apiUrl = getApiUrl();
    await warmServer();
    const attempt = async () => {
      const response = await apiClient.fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
        timeoutMs: 60000,
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('[AuthContext] Login failed:', data);
        throw new Error(data.error || 'Login failed');
      }
      if (!data.token || !data.user) {
        console.error('[AuthContext] Invalid login response:', data);
        throw new Error('Invalid server response');
      }
      const mappedUser = {
        ...data.user,
        profilePictureUrl: data.user.profilePicture || data.user.profilePictureUrl
      };
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(mappedUser));
      setUser(mappedUser);
    };
    try {
      await attempt();
    } catch (err: any) {
      if (isTimeoutError(err)) {
        await warmServer();
        await attempt();
        return;
      }
      throw err;
    }
  };
  
  const register = async (name: string, email: string, pass: string, profilePictureFile?: File | null): Promise<void> => {
      if (!name || !email || !pass) {
          throw new Error("All fields are required for registration.");
      }
      if (!profilePictureFile) {
          throw new Error("Profile picture is required.");
      }
      if (pass.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      try {
        // Upload profile picture to Cloudinary first (with timeout)
        const formData = new FormData();
        formData.append('file', profilePictureFile);
        formData.append('upload_preset', 'church_profiles'); // You'll need to create this in Cloudinary
        formData.append('folder', 'church-profiles');

        const cloudController = new AbortController();
        const cloudTimeout = setTimeout(() => cloudController.abort(), 90000);
        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${(import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'de0zuglgd'}/image/upload`,
          {
            method: 'POST',
            body: formData,
            signal: cloudController.signal,
          }
        );
        clearTimeout(cloudTimeout);

        if (!cloudinaryResponse.ok) {
          throw new Error('Failed to upload profile picture');
        }

        const cloudinaryData = await cloudinaryResponse.json();
        const profilePictureUrl = cloudinaryData.secure_url;

        // Register user with backend
        const apiUrl = getApiUrl();
        await warmServer();
        const attempt = async () => {
          const response = await apiClient.fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({
              name,
              email,
              password: pass,
              profilePicture: profilePictureUrl
            }),
            timeoutMs: 90000,
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
          }
          // Auto-login with returned token
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('authUser', JSON.stringify(data.user));
          setUser(data.user);
          return data;
        };

        try {
          return await attempt();
        } catch (err: any) {
          if (isTimeoutError(err)) {
            await warmServer();
            return await attempt();
          }
          throw err;
        }

      } catch (error: any) {
        throw new Error(error.message || 'Registration failed');
      }
  };

  const logout = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const socket = websocketService.getSocket();
        socket.emit('user-offline', { token });
      }
    } catch (err) {
      console.error('[AuthContext] Error emitting user-offline on logout:', err);
    }

    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    setUser(null);
  };
  
  const updateUser = async (userId: string, data: { name: string; email: string; }, profilePictureFile?: File | null): Promise<void> => {
    return new Promise((resolve, reject) => {
      const processUpdate = (profilePictureUrl?: string) => {
        const updatedUsers = users.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              ...data,
              ...(profilePictureUrl && { profilePictureUrl }),
            };
          }
          return u;
        });

        setUsers(updatedUsers);
        localStorage.setItem('churchUserList', JSON.stringify(updatedUsers));

        const updatedUser = updatedUsers.find(u => u.id === userId);
        if (updatedUser) {
          // Push to server for syncing
          websocketService.pushUpdate({
              type: 'users',
              action: 'update',
              data: updatedUser
          });
        }

        if (user && user.id === userId) {
          const updatedCurrentUser = updatedUsers.find(u => u.id === userId);
          if (updatedCurrentUser) {
            setUser(updatedCurrentUser);
            localStorage.setItem('authUser', JSON.stringify(updatedCurrentUser));
          }
        }
        resolve();
      };

      if (profilePictureFile) {
        const reader = new FileReader();
        reader.onload = () => {
          processUpdate(reader.result as string);
        };
        reader.onerror = (error) => {
          console.error("File reading error:", error);
          reject(new Error("Could not process profile picture."));
        };
        reader.readAsDataURL(profilePictureFile);
      } else {
        processUpdate();
      }
    });
  };

  const updateUserRole = (userId: string, role: 'admin' | 'member') => {
      const updatedUser = users.find(u => u.id === userId);
      if (!updatedUser) return;
      
      const userWithNewRole = { ...updatedUser, role };
      const updatedUsers = users.map(u => u.id === userId ? userWithNewRole : u);
      setUsers(updatedUsers);
      localStorage.setItem('churchUserList', JSON.stringify(updatedUsers));

      // Push to server for syncing
      websocketService.pushUpdate({
          type: 'users',
          action: 'update',
          data: userWithNewRole
      });

      // Also update the currently logged-in user if their role changed
      if (user && user.id === userId) {
          setUser(userWithNewRole);
          localStorage.setItem('authUser', JSON.stringify(userWithNewRole));
      }
  };


  const value = {
    user,
    users,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUserRole,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};