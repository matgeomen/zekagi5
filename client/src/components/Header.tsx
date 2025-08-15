
import React from 'react';
import { Moon, Sun, Brain, Menu, X, Cpu, CircuitBoard, Bot, Globe, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCallback } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import { useEffect } from 'react';

interface HeaderProps {
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
  isInternetEnabled?: boolean;
  onToggleInternet?: () => void;
  isInternetSearching?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onToggleMenu, 
  isMenuOpen, 
  isInternetEnabled = false, 
  onToggleInternet,
  isInternetSearching = false 
}) => {
  // Tema değiştirme - güçlendirilmiş
  const { isDarkMode, toggleTheme } = useTheme();

  // Tema değişikliğini konsola kaydet (hata ayıklama)
  useEffect(() => {
    console.log(`Header bileşeni tema durumu: ${isDarkMode ? 'Koyu' : 'Açık'}`);
  }, [isDarkMode]);
  
  const isMobile = useIsMobile();

  return (
    <header className="glass-card border-b-0 shadow-xl sticky top-0 z-50 h-16 sm:h-18">
      <div className="max-w-7xl mx-auto responsive-padding py-2 sm:py-3 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo ve Başlık - Modern */}
          <div className="flex items-center space-x-3 sm:space-x-4 animate-fade-in">
            <div className="relative">
              <div className="relative transform hover:scale-110 transition-all duration-500 hover:rotate-12">
                <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-bounce-subtle" />
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-full blur-md animate-pulse-slow"></div>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gradient tracking-tight">
                NöroBot
              </h1>
              <p className="text-xs sm:text-xs text-muted-foreground truncate animate-fade-in">
                {isMobile ? '🤖 AI Asistan' : '🧠 Akıllı Türkçe Asistan'}
              </p>
            </div>
          </div>

          {/* Sağ taraf kontrolleri - Modern */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* İnternet Öğrenme Butonu */}
            {onToggleInternet && (
              <button
                onClick={onToggleInternet}
                className={`modern-card p-2.5 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-105 group relative ${
                  isInternetEnabled 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
                aria-label={isInternetEnabled ? 'İnternet öğrenmeyi kapat' : 'İnternet öğrenmeyi aç'}
                disabled={isInternetSearching}
              >
                {isInternetSearching ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : isInternetEnabled ? (
                  <Wifi className="w-4 h-4 transition-transform group-hover:scale-110" />
                ) : (
                  <Globe className="w-4 h-4 transition-transform group-hover:scale-110" />
                )}
                
                {/* Status indicator */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 transition-all duration-300 ${
                  isInternetEnabled ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </button>
            )}


            {/* Mobil menü toggle - Modern */}
            {isMobile && onToggleMenu && (
              <button
                onClick={onToggleMenu}
                className="modern-card p-3 rounded-xl transition-all duration-300 transform hover:scale-105 group"
                aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              >
                {isMenuOpen ? (
                  <X className="w-4 h-4 text-destructive transition-transform group-hover:rotate-90" />
                ) : (
                  <Menu className="w-4 h-4 text-primary transition-transform group-hover:scale-110" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modern gradient underline */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
    </header>
  );
};

export default Header;
