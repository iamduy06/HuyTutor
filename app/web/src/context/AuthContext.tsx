import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, SESSION_STORAGE_KEY } from '../api/client';
import { UserProfile } from '../types';

export type AuthModalTab = 'login' | 'register' | 'forgot';

interface AuthContextValue {
  user: UserProfile | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalTab: AuthModalTab;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    customerGroup?: 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác';
    schoolOrOrg?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserState: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');

  const refreshUser = async () => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) {
      setUser(null);
      setSessionToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.getCurrentUser();
      setUser(res.user);
      setSessionToken(saved);
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setUser(null);
      setSessionToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const openAuthModal = (tab: AuthModalTab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await apiClient.login(email, password);
    localStorage.setItem(SESSION_STORAGE_KEY, res.token);
    setSessionToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    return res.user;
  };

  const register = async (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    customerGroup?: 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác';
    schoolOrOrg?: string;
  }): Promise<UserProfile> => {
    const res = await apiClient.register(payload);
    localStorage.setItem(SESSION_STORAGE_KEY, res.token);
    setSessionToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    return res.user;
  };

  const logout = async () => {
    try {
      if (localStorage.getItem(SESSION_STORAGE_KEY)) {
        await apiClient.logout();
      }
    } catch {
      // ignore network error on logout
    } finally {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSessionToken(null);
      setUser(null);
    }
  };

  const logoutAllDevices = async () => {
    try {
      if (localStorage.getItem(SESSION_STORAGE_KEY)) {
        await apiClient.logoutAll();
      }
    } catch {
      // ignore network error
    } finally {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSessionToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isLoading,
        isAdmin: user?.role === 'admin',
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        logoutAllDevices,
        refreshUser,
        setUserState: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
