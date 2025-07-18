import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState('light');

  // Function to get system theme preference
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Update effective theme when theme changes or system preference changes
  useEffect(() => {
    let newEffectiveTheme;
    
    if (theme === 'system') {
      newEffectiveTheme = getSystemTheme();
    } else {
      newEffectiveTheme = theme;
    }

    setEffectiveTheme(newEffectiveTheme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newEffectiveTheme);
    
    // Also add class for CSS compatibility
    if (newEffectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system theme changes when using system preference
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        const newEffectiveTheme = e.matches ? 'dark' : 'light';
        setEffectiveTheme(newEffectiveTheme);
        document.documentElement.setAttribute('data-theme', newEffectiveTheme);
        
        if (newEffectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [theme]);

  const changeTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  };

  const toggleTheme = () => {
    if (effectiveTheme === 'light') {
      changeTheme('dark');
    } else {
      changeTheme('light');
    }
  };

  const value = {
    theme,           // Current theme setting ('light', 'dark', or 'system')
    effectiveTheme,  // Actual theme being used ('light' or 'dark')
    changeTheme,     // Function to change theme
    toggleTheme,     // Function to toggle between light and dark
    isSystemTheme: theme === 'system'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;