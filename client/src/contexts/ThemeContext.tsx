import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const defaultTheme: ThemeContextType = {
  isDarkMode: false,
  toggleTheme: () => {}
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
      }
      return false;
    } catch (error) {
      console.error('Tema yükleme hatası:', error);
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('theme', newValue ? 'dark' : 'light');
      } catch (error) {
        console.error('Tema kaydetme hatası:', error);
      }
      return newValue;
    });
  };

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    console.log(`Tema başarıyla uygulandı: ${isDarkMode ? 'Koyu' : 'Açık'}`);
  }, [isDarkMode]);

  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};