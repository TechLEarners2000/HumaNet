import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/mockAuth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role: 'admin' | 'volunteer', phone?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API functions
const API_BASE = 'https://humanet.onrender.com/api';

const apiLogin = async (email: string, password: string, location?: { lat: number; lng: number }): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, location }),
    });
    if (response.ok) {
      const user = await response.json();
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
  } catch (error) {
    console.error('Login error:', error);
  }
  return null;
};

const apiSignup = async (email: string, password: string, name: string, role: 'admin' | 'volunteer', phone?: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role, phone }),
    });
    if (response.ok) {
      const user = await response.json();
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
  } catch (error) {
    console.error('Signup error:', error);
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (email: string, password: string, location?: { lat: number; lng: number }): Promise<boolean> => {
    const user = await apiLogin(email, password, location);
    if (user) {
      setUser(user);
      return true;
    }
    return false;
  };

  const signup = async (email: string, password: string, name: string, role: 'admin' | 'volunteer', phone?: string): Promise<boolean> => {
    const user = await apiSignup(email, password, name, role, phone);
    if (user) {
      setUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
