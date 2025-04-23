import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { useThemeStore } from '../store/themeStore';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const { mode } = useThemeStore();
  
  // Apply the theme
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    
    if (mode === 'system') {
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemPreference);
    } else {
      document.documentElement.classList.add(mode);
    }
  }, [mode]);
  
  return (
    <ThemeProvider attribute="class" defaultTheme={mode} enableSystem={mode === 'system'}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
} 