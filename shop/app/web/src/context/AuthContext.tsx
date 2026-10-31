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
    // 1. First check if logged in via SSO Master Cookie (.huytutor.edu.vn)
    if (typeof window !== 'undefined' && window.location.hostname.includes('huytutor.edu.vn')) {
      try {
        const ssoRes = await fetch('https://sso.huytutor.edu.vn/api/auth/me', {
          credentials: 'include',
        });
        if (ssoRes.ok) {
          const ssoData = await ssoRes.json();
          if (ssoData.success && ssoData.user) {
            setUser({
              id: ssoData.user.id,
              email: ssoData.user.email,
              fullName: ssoData.user.full_name || '',
              phone: ssoData.user.phone || '',
              role: ssoData.user.role === 'ADMIN' ? 'admin' : 'user',
              customerGroup: ssoData.user.customer_group || 'Học sinh',
              schoolOrOrg: ssoData.user.school_or_org || '',
              defaultTaxCccd: ssoData.user.default_tax_cccd || '',
              defaultInvoiceAddress: ssoData.user.default_invoice_address || '',
              isActive: ssoData.user.is_active,
              lastLoginAt: ssoData.user.last_login_at,
              createdAt: ssoData.user.created_at,
            });
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to local storage if SSO check fails
      }
    }

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
    // On production domain, smoothly redirect to SSO Portal
    if (typeof window !== 'undefined' && window.location.hostname.includes('huytutor.edu.vn')) {
      const ssoUrl = `https://sso.huytutor.edu.vn/login?app=shop&redirect=${encodeURIComponent(window.location.href)}`;
      window.location.href = ssoUrl;
      return;
    }
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
      if (typeof window !== 'undefined' && window.location.hostname.includes('huytutor.edu.vn')) {
        await fetch('https://sso.huytutor.edu.vn/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      }
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
      if (typeof window !== 'undefined' && window.location.hostname.includes('huytutor.edu.vn')) {
        await fetch('https://sso.huytutor.edu.vn/api/auth/sessions', {
          method: 'DELETE',
          credentials: 'include',
        });
      }
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
