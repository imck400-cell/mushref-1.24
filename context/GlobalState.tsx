
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppData } from '../types';

interface GlobalContextType {
  data: AppData;
  updateData: (newData: Partial<AppData>) => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  isAuthenticated: boolean;
  login: (pass: string) => boolean;
  logout: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const defaultMaxGrades = {}; 

const initialData: AppData = {
  profile: { schoolName: '', supervisorName: '', year: '' },
  substitutions: [],
  dailyReports: [],
  violations: [],
  parentVisits: [],
  teacherFollowUps: [],
  maxGrades: defaultMaxGrades,
  studentReports: [],
  absenceRecords: []
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => {
    try {
        const saved = localStorage.getItem('rafiquk_data');
        return saved ? JSON.parse(saved) : initialData;
    } catch {
        return initialData;
    }
  });

  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('rafiquk_auth'));
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    localStorage.setItem('rafiquk_data', JSON.stringify(data));
  }, [data]);

  const updateData = (newData: Partial<AppData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const login = (pass: string) => {
    // Simple authentication
    if (pass === '1234' || pass === 'admin') { 
      localStorage.setItem('rafiquk_auth', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('rafiquk_auth');
    setIsAuthenticated(false);
  };

  return (
    <GlobalContext.Provider value={{ data, updateData, lang, setLang, isAuthenticated, login, logout, currentView, setCurrentView }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal must be used within GlobalProvider');
  return context;
};
