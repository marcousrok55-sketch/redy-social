import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { User, Workspace } from '../types';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      setUser(response.data.user);
      setWorkspaces(response.data.workspaces);
      // Set first workspace as current
      if (response.data.workspaces?.length > 0) {
        setWorkspace(response.data.workspaces[0]);
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user: userData, workspace: workspaceData, accessToken } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
    setWorkspace(workspaceData);
    // Fetch workspaces
    await refreshUser();
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register({ email, password, name });
    const { user: userData, workspace: workspaceData, accessToken } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
    setWorkspace(workspaceData);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setWorkspace(null);
    setWorkspaces([]);
  };

  const switchWorkspace = async (workspaceId: string) => {
    const response = await authApi.switchWorkspace(workspaceId);
    const { workspace: newWorkspace, accessToken } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    setWorkspace(newWorkspace);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        workspaces,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchWorkspace,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
