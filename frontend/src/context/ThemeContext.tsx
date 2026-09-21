import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to cyan, but try to load from localStorage
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('themeColor') || '#00F0FF';
  });
  
  // Default to dark, but try to load from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Apply data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('isDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  // Apply primary color
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', themeColor);
    root.style.setProperty('--primary-dark', themeColor);
    root.style.setProperty('--color-primary', themeColor);
    localStorage.setItem('themeColor', themeColor);
  }, [themeColor]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
