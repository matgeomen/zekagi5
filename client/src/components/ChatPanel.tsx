import React, { useState, useRef, useEffect } from 'react';
import { EnhancedMemorySystem } from '@/lib/EnhancedMemorySystem';
import { Send, RefreshCw, Database, Trash2, Edit, ThumbsUp, ThumbsDown, Mic, MicOff, Smile, Volume2, Volume, RotateCcw, Bot, User } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TurkishDictionary } from '@/lib/TurkishDictionary'; // TurkishDictionary import edildi
import { Message } from '@shared/schema';

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  onCorrectAnswer: (messageId: string) => void;
  onShowMemory: () => void;
  onClearChat: () => void;
  onClearTraining: () => void;
  onFeedback: (messageId: string, isPositive: boolean) => void;
  messages: Message[];
  isProcessing: boolean;
  memorySystem: EnhancedMemorySystem;
  relationCount: number;
  onToggleVoice: () => void;
  isVoiceEnabled: boolean;
  onUserMessageLearned?: (message: string) => Promise<boolean>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  onSendMessage,
  onCorrectAnswer,
  onShowMemory,
  onClearChat,
  onClearTraining,
  onFeedback,
  messages,
  isProcessing,
  memorySystem,
  relationCount,
  onToggleVoice,
  isVoiceEnabled,
  onUserMessageLearned
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const dictionary = useRef(new TurkishDictionary()).current; // Türkçe sözlük örneği oluşturuldu
  const [teachingMode, setTeachingMode] = useState({ isActive: false, questionId: null as string | null, question: '', incorrectAnswer: '' });

  // Toast bildirimleri için basit bir state yönetimi
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'warning' }[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].isUser === false) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;

    const text = message.trim();
    setMessage('');

    // Kullanıcıdan öğrenme formatını kontrol et [CEVAP] ile başlıyorsa
    if (text.startsWith('[CEVAP]')) {
      // Öğrenme işlemini ChatPanel içinde değil, App.tsx'te handle et
      if (onUserMessageLearned) {
        const learned = await onUserMessageLearned(text);
        if (learned) {
          console.log('✅ Öğrenme işlemi başarıyla tamamlandı');
          // Teşekkür mesajı genellikle bot tarafından gönderilir, burada sadece logluyoruz.
          // Eğer bot kendi teşekkür mesajını göndermiyorsa, burada bir toast eklenebilir.
          // addToast("✅ Cevap sisteme eklendi. Teşekkürler!", "success");
          return; // Öğrenme işlemi başarılıysa normal mesaj gönderimi yapma
        } else {
          console.log('❌ Öğrenme işlemi başarısız oldu');
          addToast("❌ Öğrenme sırasında bir hata oluştu veya girdi geçersiz.", "error");
        }
      }
    }

    onSendMessage(text);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Gelişmiş emoji kategorileri
  const emojiCategories = {
    olumlu: ['😊', '👍', '🎉', '❤️', '😄', '🥰', '😁', '🙏', '💪', '🤩', '😍', '🔥', '👏', '💯'],
    ifadeler: ['🤔', '😅', '😌', '😎', '🧐', '🤓', '😇', '😉', '🙃', '😬', '😴', '🥳'],
    jestler: ['👋', '🙌', '👌', '✌️', '👊', '🤝', '🤲', '👍', '👎', '👆', ' 👉', '👈'],
    nesneler: ['✅', '⭐', '📝', '📌', '📢', '💡', '🎯', '🔍', '📊', '📈', '🛠️', '🎵', '🎮', '💻'],
    semboller: ['❓', '❗', '⚠️', '⏰', '💬', '🔄', '✨', '💭', '🌟', '🔎', '➡️', '⬅️', '🔺', '🔻']
  };

  // Aktif kategori ve tüm emojileri birleştir
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<keyof typeof emojiCategories>('olumlu');
  const commonEmojis = emojiCategories[activeEmojiCategory];

  // Sesli yanıt çalma/durdurma fonksiyonu
  const playAudio = (text: string) => {
    // Ses zaten çalınıyorsa durdur
    if (audioPlaying) {
      window.speechSynthesis.cancel();
      setAudioPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.onend = () => setAudioPlaying(false);
    setAudioPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const [longConversationTopic, setLongConversationTopic] = useState('');

  // Uzun konuşma oluşturma
  const generateLongConversation = () => {
    // Hafızadan uzun bir paragraf oluştur
    const paragraphText = memorySystem.generateLongConversation(
      longConversationTopic || undefined,
      7 // İstenen cümle sayısı
    );

    // Sistem mesajı olarak ekle
    onSendMessage(`Uzun konuşma (${longConversationTopic || 'genel konu'}): ${paragraphText}`);

    // Popover'ı kapatmak için konuyu temizle
    setLongConversationTopic('');
  };

  // Öğretme modunu yönetmek için yeni fonksiyonlar
  const handleTeachAnswer = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.isUser) return;

    // Önceki kullanıcı mesajını bul
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) return;

    const userMessage = messages[messageIndex - 1];
    if (!userMessage.isUser) return;

    // Soruyu localStorage'a kaydet (App.tsx'daki sistem ile uyumlu)
    localStorage.setItem('pending_question', JSON.stringify({
      id: messageId,
      question: userMessage.content.trim(),
      timestamp: Date.now()
    }));

    // Öğretme modunu aç
    setTeachingMode({
      isActive: true,
      questionId: messageId,
      question: userMessage.content,
      incorrectAnswer: message.content
    });

    // Kullanıcıya bilgilendirme toast'ı göster
    addToast("✏️ Öğretme modu açıldı! Doğru cevabı yazıp 'Öğret' butonuna basın.", "success");
  };

  const handleSubmitTeaching = async (answer: string) => {
    if (!teachingMode.isActive || !answer.trim()) return;

    try {
      // [CEVAP] formatında cevabı gönder
      const formattedAnswer = `[CEVAP] ${answer.trim()}`;

      // Öğretilen cevabı sisteme gönder
      const wasLearned = await onUserMessageLearned(formattedAnswer);

      if (wasLearned) {
        // Öğretme modunu kapat
        setTeachingMode({
          isActive: false,
          questionId: null,
          question: '',
          incorrectAnswer: ''
        });

        // Başarı mesajı - sistem tarafından zaten "✅ Öğrendim! Teşekkür ederim!" mesajı gönderildi
        addToast("✅ Yeni bilgi başarıyla öğretildi!", "success");
      } else {
        addToast("❌ Öğretilecek soru bulunamadı. Önce bilinmeyen bir soru sorun.", "warning");
      }

    } catch (error) {
      console.error('Öğretme hatası:', error);
      addToast("❌ Öğretme sırasında bir hata oluştu.", "error");
    }
  };

  // Öğretme modu aktif olduğunda kullanılacak modal veya input
  const TeachingInput = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">✏️</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Beni Eğit!</h3>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">📋 Soru:</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">{teachingMode.question}</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">❌ Hatalı cevabım:</p>
          <p className="text-sm text-red-700 dark:text-red-300">{teachingMode.incorrectAnswer}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ✅ Doğru cevabı yazın:
          </label>
          <textarea
            id="teaching-textarea"
            rows={4}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="Bu sorunun doğru cevabını buraya yazın..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitTeaching(e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setTeachingMode({ isActive: false, questionId: null, question: '', incorrectAnswer: '' });
              }
            }}
            autoFocus
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setTeachingMode({ isActive: false, questionId: null, question: '', incorrectAnswer: '' })}
          >
            ❌ İptal
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              const textarea = document.getElementById('teaching-textarea') as HTMLTextAreaElement;
              if (textarea && textarea.value.trim()) {
                handleSubmitTeaching(textarea.value.trim());
              } else {
                addToast("❌ Lütfen doğru cevabı yazın!", "error");
              }
            }}
          >
            ✅ Öğret
          </Button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="glass-card h-full flex flex-col max-h-[calc(100vh-180px)] min-h-[500px]">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/50 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Sohbet
        </h2>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              console.log('Hafıza butonu tıklandı');
              onShowMemory();
            }}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Hafıza Sistemi"
            title="Hafıza Sistemi"
          >
            <Database className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearChat}
              className="text-gray-600 dark:text-gray-400"
              title="Sohbeti Temizle"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm('Tüm eğitim verilerini, hafızayı ve sinir ağını silmek istediğinize emin misiniz?')) {
                  // Hafızayı temizle
                  memorySystem.clearMemory();

                  // Eğitim verilerini temizle
                  onClearTraining();

                  // localStorage'dan sinir ağı verilerini temizle
                  localStorage.removeItem('neural_user_networks');
                  localStorage.removeItem('neural_system_networks');
                  localStorage.removeItem('neural_relations');
                  localStorage.removeItem('neural_bidirectional_relations');
                  localStorage.removeItem('neural_training_history');
                  localStorage.removeItem('neural_stats');

                  // Sayfayı yenile
                  window.location.reload();
                }
              }}
              className="text-red-600 dark:text-red-400"
              title="Eğitim Verilerini Sıfırla"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div ref={messagesContainerRef} className="overflow-y-auto flex-1 scrollbar-thin px-4 sm:px-6" style={{ display: 'flex', flexDirection: 'column-reverse', minHeight: '300px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(!messages || messages.length === 0) ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="modern-card max-w-md mx-auto p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">NöroBot'a Hoş Geldiniz!</h3>
                <p className="text-sm text-muted-foreground mb-4">Yapay zeka destekli Türkçe asistanınızla sohbete başlamak için bir mesaj gönderin.</p>
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>Aktif İlişki: {relationCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div className="flex items-start space-x-3 max-w-[85%]">
                    {/* Avatar */}
                    {!msg.isUser && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                        <span className="text-sm">🤖</span>
                      </div>
                    )}

                    <div
                      className={`${msg.isUser ? 'chat-message-user' : 'chat-message-bot'} animate-fade-in`}
                    >
                    {/* Modül bilgisi gösterme */}
                    {msg.module && !msg.isUser && (
                      <div className="mb-1">
                        <Badge variant={
                          msg.module === 'info' ? 'default' :
                            msg.module === 'humor' ? 'secondary' :
                              msg.module === 'advice' ? 'outline' : msg.module === 'feedback' ? 'destructive' : 'default'
                        } className="text-[10px] py-0 px-2">
                          {msg.module === 'info' ? 'Bilgi' :
                            msg.module === 'humor' ? 'Mizah' :
                              msg.module === 'advice' ? 'Tavsiye' : msg.module === 'feedback' ? 'Geri Bildirim' : 'Öğrenme Talebi'}
                        </Badge>
                      </div>
                    )}

                      <div className="prose prose-sm max-w-none text-foreground">{msg.content}</div>

                      <div className="text-xs mt-3 flex justify-between items-center opacity-80">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {formatTime(msg.timestamp)}
                          {msg.isSpoken && <Volume2 className="h-3 w-3 text-primary" />}
                        </span>

                        {!msg.isUser && (
                          <div className="flex items-center space-x-1">
                            {/* Sesli okuma butonu */}
                            <button
                              onClick={() => playAudio(msg.content)}
                              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                audioPlaying
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                              aria-label="Sesli Oku"
                              title="Sesli Oku"
                            >
                              {audioPlaying ? <Volume2 className="h-3 w-3" /> : <Volume className="h-3 w-3" />}
                            </button>

                            {/* Geri bildirim düğmeleri */}
                            <div className="flex space-x-1">
                              <button
                                onClick={() => onFeedback(msg.id, true)}
                                className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                  msg.feedback === 1
                                    ? 'bg-green-500 text-white shadow-md'
                                    : 'hover:bg-green-100 dark:hover:bg-green-900 text-muted-foreground hover:text-green-600'
                                }`}
                                aria-label="Beğen"
                                title="Beğen"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => onFeedback(msg.id, false)}
                                className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                  msg.feedback === -1
                                    ? 'bg-red-500 text-white shadow-md'
                                    : 'hover:bg-red-100 dark:hover:bg-red-900 text-muted-foreground hover:text-red-600'
                                }`}
                                aria-label="Beğenme"
                                title="Beğenme"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleTeachAnswer(msg.id)}
                              className="p-2 rounded-lg transition-all hover:scale-110 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                              aria-label="Beni Eğit - Doğru Cevabı Öğret"
                              title="✏️ Beni Eğit - Doğru Cevabı Öğret"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {msg.isUser && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center ml-3">
                        <span className="text-sm">👤</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Toast bildirimleri */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`p-3 rounded-md shadow-lg ${
            toast.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' :
            toast.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' :
            'bg-yellow-100 text-yellow-700 border border-yellow-300'
          }`}>
            {toast.message}
          </div>
        ))}
      </div>


      {/* Emoji seçici */}
      {showEmojiPicker && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          {/* Emoji kategorileri */}
          <div className="mb-2 flex justify-center overflow-x-auto whitespace-nowrap">
            {Object.keys(emojiCategories).map((category) => (
              <button
                key={category}
                onClick={() => setActiveEmojiCategory(category as keyof typeof emojiCategories)}
                className={`px-3 py-1 mx-1 text-xs rounded-md ${
                  activeEmojiCategory === category
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category === 'olumlu' ? '😊 Olumlu' :
                  category === 'ifadeler' ? '🤔 İfadeler' :
                    category === 'jestler' ? '👋 Jestler' :
                      category === 'nesneler' ? '✅ Nesneler' : '❓ Semboller'}
              </button>
            ))}
          </div>

          {/* Emojiler */}
          <div className="flex flex-wrap justify-center gap-2 max-h-[180px] overflow-y-auto">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setMessage(prev => prev + emoji);
                }}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-xl transition-transform hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Anlık emoji ifadeleri */}
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => {
                setMessage(prev => prev + " 👍");
                setShowEmojiPicker(false);
              }}
              className="mx-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md text-xs flex items-center"
            >
              <span className="mr-1">👍</span> Evet
            </button>
            <button
              onClick={() => {
                setMessage(prev => prev + " 👎");
                setShowEmojiPicker(false);
              }}
              className="mx-1 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md text-xs flex items-center"
            >
              <span className="mr-1">👎</span> Hayır
            </button>
            <button
              onClick={() => {
                setMessage(prev => prev + " 🤔");
                setShowEmojiPicker(false);
              }}
              className="mx-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 rounded-md text-xs flex items-center"
            >
              <span className="mr-1">🤔</span> Hmmm
            </button>
            <button
              onClick={() => {
                setMessage(prev => prev + " 😂");
                setShowEmojiPicker(false);
              }}
              className="mx-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-md text-xs flex items-center"
            >
              <span className="mr-1">😂</span> Komik
            </button>
          </div>
        </div>
      )}

      {/* Öğretme modu aktifse input modal'ı göster */}
      {teachingMode.isActive && <TeachingInput />}

      <div className="bg-background/90 border-t border-border/50 p-3 flex-shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="w-full">
          <div className="flex items-center gap-2 w-full max-w-full">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="modern-input flex-1 min-w-0 h-10 rounded-l-lg border-r-0"
              disabled={isProcessing}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-none border-l-0 border-r-0">
                  <span className="text-lg">📝</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <h4 className="font-medium leading-none">Uzun Konuşma</h4>
                  <p className="text-sm text-muted-foreground">
                    Hafızadaki bilgilerden anlamlı bir paragraf oluştur.
                  </p>
                  <div className="flex gap-2">
                    <input
                      placeholder="Konu (isteğe bağlı)"
                      id="topic"
                      className="modern-input flex-1 h-10"
                      onChange={(e) => setLongConversationTopic(e.target.value)}
                      value={longConversationTopic}
                    />
                    <Button size="sm" variant="gradient" onClick={generateLongConversation}>Oluştur</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Ses Butonu */}
            {onToggleVoice && (
              <button
                type="button"
                onClick={() => {
                  console.log("🎙️ Mikrofon butonuna tıklandı!");
                  if (onToggleVoice) onToggleVoice();
                }}
                className={`h-10 px-3 border border-l-0 border-r-0 border-border rounded-none transition-all duration-300 ${
                  isVoiceEnabled
                    ? 'btn-gradient shadow-md'
                    : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
                aria-label={isVoiceEnabled ? "Sesi kapat" : "Sesi aç"}
                title={isVoiceEnabled ? "Sesi kapat" : "Sesi aç"}
              >
                {isVoiceEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
            )}

            {/* Emoji Butonu */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-10 px-3 border border-l-0 border-r-0 border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Emoji Ekle"
              title="Emoji Ekle"
            >
              <Smile className="h-5 w-5" />
            </button>

            {/* Gönder Butonu */}
            <button
              type="submit"
              disabled={isProcessing || !message.trim()}
              className={`h-10 px-4 border border-l-0 border-border rounded-r-lg transition-all duration-300 ${
                isProcessing || !message.trim()
                  ? 'bg-muted cursor-not-allowed text-muted-foreground'
                  : 'btn-gradient hover:shadow-lg'
              } focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;