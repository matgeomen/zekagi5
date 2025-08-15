import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal, RotateCcw, ThumbsUp, ThumbsDown, Brain, Moon, Sun, Image, Paperclip, Smile, HelpCircle, Settings, Sparkles } from 'lucide-react';
import { EnhancedMemorySystem } from '../lib/EnhancedMemorySystem';
import ChatMessage from './ChatMessage';
import InputBox from './InputBox';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { Skeleton } from './ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp?: number;
  feedback?: number; // -1: negatif, 0: nötr, 1: pozitif
  thinking?: boolean;
  error?: boolean;
  attachments?: string[];
}

export interface ChatInterfaceProps {
  memorySystem: EnhancedMemorySystem;
  onSendMessage: (message: string) => Promise<void>;
  messages: Message[];
  onFeedback: (messageId: string, isPositive: boolean) => void;
  onTrainBot?: () => void;
  onShowMemories?: () => void;
  onShowNetwork?: () => void;
  title?: string;
  subtitle?: string;
  isTrainingMode?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  memorySystem,
  onSendMessage,
  messages,
  onFeedback,
  onTrainBot,
  onShowMemories,
  onShowNetwork,
  title = "Türkçe Yapay Zeka Chatbot",
  subtitle = "Sinir ağı tabanlı, gelişmiş hafıza sistemine sahip chatbot",
  isTrainingMode = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  
  // Kısa ve uzun vadeli bellek sayıları
  const shortTermCount = memorySystem.shortTerm?.length || 0;
  const longTermCount = memorySystem.longTerm?.length || 0;
  const totalClusters = memorySystem.memoryClusters?.length || 0;

  // Mesajlar değiştiğinde otomatik kaydırma
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Düşünme animasyonu efekti
  useEffect(() => {
    if (isLoading) {
      const typingInterval = setInterval(() => {
        setIsTyping(prev => !prev);
      }, 500);
      
      return () => clearInterval(typingInterval);
    }
  }, [isLoading]);

  // Mesaj gönderme fonksiyonu
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    await onSendMessage(inputValue);
    setInputValue('');
    setIsLoading(false);
  };

  // Enter tuşuna basıldığında mesaj gönderme
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Başlık ve Araç Çubuğu */}
      <div className="rounded-t-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg">
        <div className="flex justify-between items-center p-3 md:p-4">
          <div className="flex items-center">
            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/20 mr-3">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold leading-tight">{title}</h1>
              <p className="text-xs md:text-sm opacity-90 hidden md:block">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex space-x-1 md:space-x-2">
            <TooltipProvider>
              {!isMobile && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={onShowMemories}
                        className="h-8 w-8 md:h-9 md:w-9 text-white hover:bg-white/20 rounded-full"
                      >
                        <Sparkles size={isMobile ? 16 : 18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hafıza Sistemi</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={onShowNetwork}
                        className="h-8 w-8 md:h-9 md:w-9 text-white hover:bg-white/20 rounded-full"
                      >
                        <Brain size={isMobile ? 16 : 18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sinir Ağı</TooltipContent>
                  </Tooltip>
                </>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={onTrainBot}
                    className="h-8 w-8 md:h-9 md:w-9 text-white hover:bg-white/20 rounded-full"
                  >
                    <Settings size={isMobile ? 16 : 18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eğitim Modu</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 md:h-9 md:w-9 text-white hover:bg-white/20 rounded-full"
                  >
                    {isDarkMode ? (
                      <Sun size={isMobile ? 16 : 18} />
                    ) : (
                      <Moon size={isMobile ? 16 : 18} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Durum Bilgisi */}
        <div className="px-3 pb-2 md:px-4 md:pb-3 flex justify-between text-xs">
          <div className="flex items-center opacity-80">
            <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
            <span>{isTrainingMode ? 'Eğitim Modu' : 'Çevrimiçi'}</span>
          </div>
          
          <div className="flex items-center space-x-3 opacity-80">
            <span>{shortTermCount} kısa vadeli hafıza</span>
            <span>{longTermCount} uzun vadeli hafıza</span>
            <span>{totalClusters} bellek kümesi</span>
          </div>
        </div>
      </div>
      
      {/* Mesajlar */}
      <div className="chat-messages bg-gray-50 dark:bg-gray-900 border-x border-gray-200 dark:border-gray-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4 md:p-8">
            <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Brain size={32} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg md:text-xl font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
              Yapay Zeka Sohbet Asistanı
            </h2>
            <p className="text-center max-w-md mb-6 text-sm md:text-base">
              Merhaba! Benimle Türkçe konuşabilirsiniz. Size nasıl yardımcı olabilirim?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
              <Button 
                variant="outline" 
                className="text-sm justify-start py-6 px-4"
                onClick={() => setInputValue("Yapay zeka konusunda bana bilgi verebilir misin?")}
              >
                <HelpCircle size={16} className="mr-2 text-indigo-500" />
                Yapay zeka hakkında bilgi
              </Button>
              <Button 
                variant="outline" 
                className="text-sm justify-start py-6 px-4"
                onClick={() => setInputValue("Sinir ağları nasıl çalışır?")}
              >
                <Brain size={16} className="mr-2 text-indigo-500" />
                Sinir ağları nasıl çalışır?
              </Button>
              <Button 
                variant="outline" 
                className="text-sm justify-start py-6 px-4"
                onClick={() => setInputValue("Hafıza sistemleri nedir?")}
              >
                <Sparkles size={16} className="mr-2 text-indigo-500" />
                Hafıza sistemleri nedir?
              </Button>
              <Button 
                variant="outline" 
                className="text-sm justify-start py-6 px-4"
                onClick={() => setInputValue("Ne tür konularda yardımcı olabilirsin?")}
              >
                <HelpCircle size={16} className="mr-2 text-indigo-500" />
                Ne konularda yardımcı olabilirsin?
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-2 md:px-4 py-4">
            {messages.map((message, index) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onFeedback={onFeedback} 
              />
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3 mb-4 max-w-3xl mx-auto animate-pulse">
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-700/30 flex items-center justify-center">
                  <Brain size={20} className="text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-24 bg-indigo-100 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-11/12" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Mesaj giriş alanı */}
      <div className="chat-input-container">
        <div className="flex items-end">
          <div className="flex-1 relative">
            <InputBox
              value={inputValue}
              onChange={setInputValue}
              onKeyPress={handleKeyPress}
              placeholder="Bir mesaj yazın..."
              onSubmit={handleSendMessage}
            />
            
            {/* Emoji ve eklenti butonları */}
            <div className="absolute bottom-0 left-3 h-10 flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={16} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full"
              >
                <Paperclip size={16} />
              </Button>
            </div>
          </div>
          
          {/* Mesaj gönderme butonu */}
          <div className="ml-2">
            <Button
              size="default"
              disabled={isLoading || !inputValue.trim()}
              onClick={handleSendMessage}
              className={`mobile-friendly-buttons ${
                isLoading || !inputValue.trim()
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 hover:text-gray-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white transition-colors'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <span className="mr-2">
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                  </span>
                  <span className="hidden md:inline">Düşünüyor</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="md:mr-1">{isMobile ? '' : 'Gönder'}</span>
                  <SendHorizonal size={16} className={isMobile ? '' : 'ml-1'} />
                </div>
              )}
            </Button>
          </div>
        </div>
        
        {/* Bellek durumu */}
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400 px-2">
          <div className="flex items-center gap-1">
            <Sparkles size={12} />
            <span className="hidden md:inline">
              Sistem zeka düzeyi: {Math.min(100, (shortTermCount + longTermCount * 2) / 10)}%
            </span>
            <span className="md:hidden">
              Zeka: {Math.min(100, (shortTermCount + longTermCount * 2) / 10)}%
            </span>
          </div>
          
          <div className="hidden md:block text-right">
            <span className="text-xs">
              Bu sohbet geçmişiniz özel olarak yerel cihazınızda saklanır
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
