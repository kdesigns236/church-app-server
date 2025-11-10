

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

  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Initialize the full user list
        const storedUserList = localStorage.getItem('churchUserList');
        if (storedUserList) {
          setUsers(JSON.parse(storedUserList));
        } else {
          localStorage.setItem('churchUserList', JSON.stringify([defaultAdminUser]));
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

  const login = async (email: string, pass: string): Promise<void> => {
    try {
      console.log('[AuthContext] Starting login process...');
      // Use environment variable or fallback to production URL
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';
      console.log('[AuthContext] Login API URL:', apiUrl);
      const response = await apiClient.fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password: pass })
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

      console.log('[AuthContext] Login response:', data);
      console.log('[AuthContext] User role:', data.user?.role);

      // Map backend field names to frontend (profilePicture -> profilePictureUrl)
      const mappedUser = {
        ...data.user,
        profilePictureUrl: data.user.profilePicture || data.user.profilePictureUrl
      };

      // Save token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(mappedUser));
      setUser(mappedUser);
      
      console.log('[AuthContext] User set in state:', mappedUser);

    } catch (error) {
      throw error;
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
        // Upload profile picture to Cloudinary first
        const formData = new FormData();
        formData.append('file', profilePictureFile);
        formData.append('upload_preset', 'church_profiles'); // You'll need to create this in Cloudinary
        formData.append('folder', 'church-profiles');

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${(import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'de0zuglgd'}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!cloudinaryResponse.ok) {
          throw new Error('Failed to upload profile picture');
        }

        const cloudinaryData = await cloudinaryResponse.json();
        const profilePictureUrl = cloudinaryData.secure_url;

        // Register user with backend
        const apiUrl = (import.meta as any).env.VITE_API_URL || 'https://church-app-server.onrender.com/api';
        const response = await apiClient.fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password: pass,
            profilePicture: profilePictureUrl
          })
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

      } catch (error: any) {
        throw new Error(error.message || 'Registration failed');
      }
  };

  const logout = () => {
    localStorage.removeItem('authUser');
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