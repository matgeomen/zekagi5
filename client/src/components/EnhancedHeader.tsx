import React from 'react';
import { Moon, Sun, Brain, Activity, Zap, Eye, Settings, Cpu, CircuitBoard, Bot } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';

interface EnhancedHeaderProps {
  showAIStatus: boolean;
  setShowAIStatus: (show: boolean) => void;
  showMemory: boolean;
  setShowMemory: (show: boolean) => void;
  showNetwork: boolean;
  setShowNetwork: (show: boolean) => void;
  isVoiceEnabled: boolean;
  toggleVoice: () => void;
}

const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({ 
  showAIStatus, 
  setShowAIStatus,
  showMemory,
  setShowMemory,
  showNetwork,
  setShowNetwork,
  isVoiceEnabled,
  toggleVoice
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg sticky top-0 z-40 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo ve Başlık - Modern Gradient Design */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300 hover:rotate-6">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-20 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Gelişmiş AI Asistanı
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🧠 Kendini Geliştiren Yapay Zeka
              </p>
            </div>
          </div>

          {/* Kontrol Paneli - Modern Button Group */}
          <div className="flex items-center space-x-2">
            {/* AI Durumu Butonu - Yeni Özellik */}
            <button
              onClick={() => setShowAIStatus(!showAIStatus)}
              className={`
                relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 
                ${showAIStatus 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              `}
              title="AI Durumu ve Yetenekleri"
            >
              <Activity className="w-4 h-4" />
              {!isMobile && <span className="text-sm font-medium">AI Durumu</span>}
              {/* Aktiflik göstergesi */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
            </button>

            {/* Bellek Butonu */}
            <button
              onClick={() => setShowMemory(!showMemory)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 
                ${showMemory 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                transform hover:scale-105
              `}
              title="Bellek Sistemi"
            >
              <Eye className="w-4 h-4" />
              {!isMobile && <span className="text-sm">Bellek</span>}
            </button>

            {/* Ağ Görselleştirme Butonu */}
            <button
              onClick={() => setShowNetwork(!showNetwork)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 
                ${showNetwork 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                transform hover:scale-105
              `}
              title="Sinir Ağı Görselleştirmesi"
            >
              <Settings className="w-4 h-4" />
              {!isMobile && <span className="text-sm">Ağ</span>}
            </button>

            {/* Ses Kontrolü */}
            <button
              onClick={toggleVoice}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 
                ${isVoiceEnabled 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                transform hover:scale-105
              `}
              title={isVoiceEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
            >
              <Zap className={`w-4 h-4 ${isVoiceEnabled ? 'animate-pulse' : ''}`} />
              {!isMobile && <span className="text-sm">Ses</span>}
            </button>

            {/* Tema Değiştirme */}
            <button 
              onClick={toggleTheme}
              className="
                p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              "
              title={isDarkMode ? "Açık Tema'ya Geç" : "Koyu Tema'ya Geç"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* İlerleme Çubuğu - AI Gelişim Göstergesi */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30"></div>
    </header>
  );
};

export default EnhancedHeader;