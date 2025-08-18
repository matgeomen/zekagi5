import { useState, useEffect, useRef, useCallback } from "react";

// Web Speech API polyfill
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    mozSpeechRecognition: any;
    msSpeechRecognition: any;
    oSpeechRecognition: any;
  }
}

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

import { useTheme } from './contexts/ThemeContext';
import { useIsMobile } from './hooks/use-mobile';
import { useToast } from './contexts/ToastContext';
import { useNeuralNetwork } from './hooks/use-neural-network';
import { EnhancedMemorySystem } from './lib/EnhancedMemorySystem';
import { AdvancedAI } from './lib/AdvancedAI';
import { SemanticAnalyzer } from './lib/SemanticAnalyzer';
import { TrainingDataAnalyzer } from './lib/TrainingDataAnalyzer';
import { InternetLearningSystem } from './lib/InternetLearningSystem';
import { NetworkNode, addCellsToNetwork, removeCellsFromNetwork } from './lib/NeuralNetworkUtils';
import { v4 as uuidv4 } from 'uuid';
import { Message, TrainingPair } from '@shared/schema';

// Components
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import NeuralNetworkPanel from './components/NeuralNetworkPanel';
import MemoryPanel from './components/MemoryPanel';
import CorrectAnswerModal from './components/CorrectAnswerModal';
import BatchTrainingModal from './components/BatchTrainingModal';
import CellDetailsModal from './components/CellDetailsModal';
import { TurkishDictionaryPanel } from './components/TurkishDictionaryPanel';
import { AIStatusPanel } from './components/AIStatusPanel';

// Types for local use
interface LocalTrainingData {
  userInput: string;
  systemOutput: string;
  confidence?: number;
  category?: string;
  contextualInfo?: {
    entities?: string[];
    keywords?: string[];
  };
  timestamp?: number;
}

export default function App(): JSX.Element {
  // Theme hooks
  const isMobile = useIsMobile();

  // Theme context
  let isDarkMode = false;
  try {
    const themeContext = useTheme();
    isDarkMode = themeContext.isDarkMode;
  } catch (error) {
    console.error('Tema context hatası:', error);
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('theme');
      isDarkMode = saved === 'dark';
    }
  }

  const { addToast } = useToast();

  // Neural Network Hook
  const {
    userNetworks,
    systemNetworks,
    relations,
    bidirectionalRelations,
    trainNetwork,
    batchTrainNetworkItems,
    processUserInput,
    refreshNetwork,
    getNetworkStats,
    activatedNodes
  } = useNeuralNetwork();

  // State for messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalQuestion, setOriginalQuestion] = useState<string>("");
  const [trainHistory, setTrainHistory] = useState<LocalTrainingData[]>([]);

  // AI and Memory Systems
  const [advancedAI] = useState(() => new AdvancedAI());
  const [memorySystem] = useState(() => new EnhancedMemorySystem());
  const memorySystemRef = useRef(memorySystem);
  const [semanticAnalyzer] = useState(() => new SemanticAnalyzer(null, memorySystem));
  const [trainingAnalyzer] = useState(() => new TrainingDataAnalyzer(null, memorySystem));
  const [internetLearning] = useState(() => new InternetLearningSystem());

  // UI State
  const [activeTab, setActiveTab] = useState<'chat' | 'neural' | 'sozluk'>('chat');
  const [showMemory, setShowMemory] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showBatchTraining, setShowBatchTraining] = useState(false);
  const [showCellDetails, setShowCellDetails] = useState(false);
  const [showAIStatus, setShowAIStatus] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [selectedCell, setSelectedCell] = useState<NetworkNode | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isInternetEnabled, setIsInternetEnabled] = useState(false);
  const [isInternetSearching, setIsInternetSearching] = useState(false);

  // Get network stats
  const stats = getNetworkStats();

  // Initialize memory system
  useEffect(() => {
    memorySystemRef.current = memorySystem;
  }, [memorySystem]);

  // Load training history from localStorage and auto-load AI training
  useEffect(() => {
    try {
      const saved = localStorage.getItem('neural_training_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTrainHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Training history yüklenirken hata:', error);
    }

    // Auto-load comprehensive AI training data
    const loadComprehensiveTraining = async () => {
      const aiTrainingData = [
        { input: "Konu takibi ve bağlam yönetimi nedir?", output: "Yapay zekânın önceki mesajları, isimleri, tercihleri ve konuşmanın amacını hatırlayıp tutarlı cevap üretmesidir." },
        { input: "Bağlam yönetimi nasıl yapılır?", output: "Mesaj geçmişi penceresi kullanarak son N mesajı bağlama dahil etmek, uzun konuşmalarda özetleme yapmak ve anahtar bilgi çıkarımı ile isim, tarih, hedef gibi alanları yapılandırılmış konuşma durumuna yazarak yapılır." },
        { input: "Ton ve üslup uyumlaması nedir?", output: "Kullanıcının dilini, resmiyet düzeyini ve duygusunu yakalayıp benzer tonda yanıt üretmektir." },
        { input: "Duygu analizi nasıl yapılır?", output: "Metinden resmî/samimi, pozitif/negatif çıkarımı yaparak ve stil talimatlarını takip ederek yapılır." },
        { input: "Kapalı uçlu sorulara nasıl yanıt verilir?", output: "Evet/Hayır gerektiren sorulara kısa ve net yanıt verilir, ardından isteğe bağlı ayrıntı sunulur." },
        { input: "Açık uçlu sorulara nasıl yanıt verilir?", output: "Fikir/yorum isteyen sorulara yapılandırılmış biçimde özet, maddeler ve sonuç şeklinde yanıt verilir." },
        { input: "Empati kurma nedir?", output: "Kullanıcının ruh halini sezmek ve yargılamadan destekleyici bir dille yanıtlamaktır." },
        { input: "Empatik yanıt nasıl verilir?", output: "Önce duyguyu yansıtıp ardından çözüm önerisi sunarak, emir kipinden kaçınarak seçenek sunarak yapılır." },
        { input: "Karşı soru sormanın amacı nedir?", output: "Sohbeti tek taraflı açıklamadan çıkarıp etkileşimli hale getirmektir." },
        { input: "Bilgilendirme nasıl yapılmalı?", output: "Kısa yanıt verip istenirse derinlemesine açıklama, örnek ve mini kılavuzla desteklenerek yapılmalıdır." },
        { input: "Kişiselleştirilmiş sohbet nedir?", output: "Kullanıcının tercihleri, geçmiş hedefleri ve bağlamına göre öneri ve dil kullanımıdır." },
        { input: "İyi sohbet için kontrol listesi neler?", output: "Kullanıcının amacını netleştirmek, doğru tonda olmak, kısa yanıt artı isteğe bağlı detay sunmak, örnek vermek ve net sonraki adım önermektir." },
        { input: "Merhaba nasılsın?", output: "Merhaba! İyiyim teşekkür ederim. Size nasıl yardımcı olabilirim?" },
        { input: "Bugün ne yapabiliriz?", output: "Bugün birlikte birçok şey yapabiliriz. Hangi konuda yardıma ihtiyacınız var? Örneğin: öğrenme, problem çözme, planlama veya sohbet etme." },
        { input: "Kendini tanıt", output: "Ben gelişmiş bir yapay zeka asistanıyım. Size bilgi verebilir, sorularınızı yanıtlayabilir, problemlerinizi çözmenizde yardımcı olabilir ve öğrenme sürecinizi destekleyebilirim." },
        { input: "Türkçe konuşuyor musun?", output: "Evet, Türkçe konuşuyorum ve Türkçe olarak size yardımcı olabilirim. Türkçe sorularınızı yanıtlayabilir ve Türkçe olarak sohbet edebilirim." },
        { input: "Stresliyim ne yapabilirim?", output: "Stresini anlıyorum. Kontrol edebileceğimiz şeyler var: nefes alma teknikleri, öncelik belirleme ve adım adım planlama. Hangi konuda streslisin?" },
        { input: "Proje yetişmeyecek gibi", output: "Zor bir durum, anlıyorum. Birlikte çözüm bulabiliriz. Kapsam, süre ve kaynak konularında seçeneklerimiz var. İstersen kapsamı sadeleştirip yeni bir takvim çıkaralım." },
        { input: "Bu güvenli mi?", output: "Evet, güvenli. İstersen neden güvenli olduğunu 3 maddede özetleyeyim." },
        { input: "Performansı nasıl arttırırız?", output: "Kısaca üç kol var: kod, altyapı, veri. Önce kod optimizasyonundan başlayalım, istersen detaylandırayım." }
      ];

      // Check if this training data has already been loaded
      const trainingMarker = localStorage.getItem('ai_comprehensive_training_loaded');
      if (!trainingMarker && batchTrainNetworkItems) {
        try {
          console.log('🤖 Kapsamlı yapay zeka eğitim verileri yükleniyor...');
          await batchTrainNetworkItems(aiTrainingData, (progress) => {
            console.log(`Eğitim ilerlemesi: %${progress}`);
          });

          // Mark training as completed
          localStorage.setItem('ai_comprehensive_training_loaded', 'true');
          console.log('✅ Kapsamlı yapay zeka eğitimi tamamlandı!');

          // Add to training history
          const newTrainingItems = aiTrainingData.map(item => ({
            userInput: item.input,
            systemOutput: item.output,
            confidence: 1.0,
            timestamp: Date.now()
          }));

          setTrainHistory(prev => {
            const updated = [...prev, ...newTrainingItems];
            localStorage.setItem('neural_training_history', JSON.stringify(updated));
            return updated;
          });

          addToast('Kapsamlı yapay zeka eğitimi yüklendi! Artık daha akıllı konuşabilirim.', 'success');

        } catch (error) {
          console.error('Kapsamlı eğitim yüklenirken hata:', error);
        }
      } else if (trainingMarker) {
        console.log('📚 Kapsamlı yapay zeka eğitimi daha önce yüklenmiş.');
      }
    };

    // Load training data after a short delay to allow network initialization
    const timer = setTimeout(loadComprehensiveTraining, 3000);
    return () => clearTimeout(timer);
  }, [batchTrainNetworkItems, addToast]);

  // Voice recognition setup
  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled(prev => !prev);
    addToast(
      isVoiceEnabled ? 'Ses tanıma devre dışı' : 'Ses tanıma aktif',
      isVoiceEnabled ? 'warning' : 'success'
    );
  }, [isVoiceEnabled, addToast]);

  // Internet learning setup
  const toggleInternetLearning = useCallback(() => {
    const newState = !isInternetEnabled;
    setIsInternetEnabled(newState);

    if (newState) {
      internetLearning.enableInternetConnection();
      console.log('🌐 İnternet öğrenme sistemi aktifleştirildi');
      addToast('🌐 İnternet öğrenme sistemi aktif! Artık gerçek zamanlı bilgi öğrenebilirim.', 'success');
    } else {
      internetLearning.disableInternetConnection();
      addToast('🔌 İnternet öğrenme sistemi kapatıldı', 'warning');
    }
  }, [isInternetEnabled, internetLearning, addToast]);

  // Handle sending messages
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isProcessing) return;

    setIsProcessing(true);

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content: messageText,
      isUser: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // İnternet öğrenme sistemi aktifse her girdi için arama yap
      let shouldSearchInternet = false;
      let internetResponse = null;

      if (isInternetEnabled) {
        // İnternet açıkken her zaman arama yap
        shouldSearchInternet = true;
        console.log('🌐 İnternet öğrenme sistemi aktif - otomatik arama başlatılıyor');
      }

      if (shouldSearchInternet) {
        setIsInternetSearching(true);

        try {
          console.log(`🧠 Gelişmiş internet analizi başlatılıyor: "${messageText}"`);
          const learningData = await internetLearning.searchAndLearn(messageText);

          if (learningData && learningData.detailedResponse && 
              learningData.detailedResponse.confidence > 0.6 && 
              learningData.synthesis && 
              learningData.synthesis.length > 20 && 
              learningData.synthesis.length < 400 && 
              !learningData.synthesis.includes('MODAL_TRIGGER') &&
              !learningData.synthesis.toLowerCase().includes('error') &&
              !learningData.synthesis.toLowerCase().includes('undefined') &&
              !learningData.synthesis.toLowerCase().includes('lorem ipsum') &&
              this.isResponseMeaningful(learningData.synthesis, messageText)) {

            // Gelişmiş yanıt oluştur
            let enhancedResponse = learningData.synthesis;
            
            // Destekleyici detaylar varsa ekle
            if (learningData.detailedResponse.supportingDetails.length > 0) {
              enhancedResponse += '\n\n' + learningData.detailedResponse.supportingDetails.join('\n');
            }

            // Sadece anlamlı ve yeterli uzunlukta cevapları kabul et
            const trainingPair: TrainingPair = {
              input: messageText,
              output: enhancedResponse
            };

            await trainNetwork(trainingPair.input, trainingPair.output);

            const newTraining: LocalTrainingData = {
              userInput: trainingPair.input,
              systemOutput: trainingPair.output,
              confidence: learningData.detailedResponse.confidence,
              timestamp: Date.now(),
              contextualInfo: {
                entities: learningData.analysis.entities,
                keywords: learningData.analysis.keywords
              }
            };

            setTrainHistory(prev => {
              const updated = [...prev, newTraining];
              localStorage.setItem('neural_training_history', JSON.stringify(updated));
              return updated;
            });

            internetResponse = enhancedResponse;
            console.log(`✅ Gelişmiş internet öğrenme başarılı: ${learningData.concepts.length} kavram, ${(learningData.detailedResponse.confidence * 100).toFixed(1)}% güven`);
            addToast(`🎓 Akıllı analiz ile yeni bilgi öğrenildi! (${(learningData.detailedResponse.completeness * 100).toFixed(0)}% tamlık)`, 'success');
          } else {
            console.log('❌ İnternetten yeterli kalitede sonuç alınamadı');
            addToast('⚠️ Bu konuda yeterli kalitede güncel bilgi bulunamadı', 'warning');
          }
        } catch (error) {
          console.error('Gelişmiş internet öğrenme hatası:', error);
          addToast('⚠️ İnternet aramasında sorun oluştu', 'warning');
        } finally {
          setIsInternetSearching(false);
        }
      }

      // Process with neural network
      let result;
      if (!internetResponse) {
        // İnternet cevabı yoksa normal neural network cevabını kullan
        result = await processUserInput(messageText);
        console.log('🧠 Neural network cevabı kullanılıyor:', result.response?.substring(0, 50) + '...');
      } else {
        // İnternet cevabı varsa öncelikli olarak kullan
        result = {
          response: internetResponse,
          confidence: 0.95,
          memoryType: 'internet_learned' as const
        };
        console.log('🌐 İnternet cevabı kullanılıyor:', internetResponse.substring(0, 50) + '...');
      }

      let finalResponse = result.response;

      // Check if response is a modal trigger (sadece normal response için)
      if (!internetResponse && result.response === 'MODAL_TRIGGER_UNKNOWN') {
        setCurrentQuestion(messageText);
        setShowCorrectAnswer(true);
        setIsProcessing(false);
        return; // Don't show the modal trigger as a message
      }

      // Generate AI response
      const aiResponse: Message = {
        id: uuidv4(),
        content: finalResponse || "Üzgünüm, bu konuda size yardımcı olamam. Beni eğitebilir misiniz?",
        isUser: false,
        timestamp: Date.now() + 1,
        confidence: internetResponse ? 0.9 : result.confidence,
        module: (internetResponse || result.confidence > 0.7) ? 'info' : 'learning_request'
      };

      setMessages(prev => [...prev, aiResponse]);

      // If confidence is very low, show learning modal (sadece normal response için)
      if (!internetResponse && result.confidence < 0.3) {
        setCurrentQuestion(messageText);
        setShowCorrectAnswer(true);
      }

    } catch (error) {
      console.error('Mesaj işleme hatası:', error);

      const errorMessage: Message = {
        id: uuidv4(),
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        isUser: false,
        timestamp: Date.now() + 1,
        module: 'feedback'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle learning from user
  const handleSendMessageWithLearning = async (messageText: string): Promise<boolean> => {
    if (!messageText.startsWith('[CEVAP]')) {
      return false;
    }

    try {
      const answer = messageText.replace('[CEVAP]', '').trim();
      const pendingQuestion = localStorage.getItem('pending_question');

      if (pendingQuestion && answer) {
        // Train the network
        await trainNetwork(pendingQuestion, answer);

        // Save to training history
        const newTraining: LocalTrainingData = {
          userInput: pendingQuestion,
          systemOutput: answer,
          confidence: 1.0,
          timestamp: Date.now()
        };

        setTrainHistory(prev => {
          const updated = [...prev, newTraining];
          localStorage.setItem('neural_training_history', JSON.JSON.stringify(updated));
          return updated;
        });

        // Add success message
        const thankYouMessage: Message = {
          id: uuidv4(),
          content: `✅ Öğrendim! Teşekkür ederim!\n\n❓ **Soru:** "${pendingQuestion}"\n💡 **Cevap:** "${answer}"\n\n🧠 Bu bilgiyi belleğime kaydettim!`,
          isUser: false,
          timestamp: Date.now(),
          module: 'info'
        };

        setMessages(prev => [...prev, thankYouMessage]);
        localStorage.removeItem('pending_question');

        return true;
      }
    } catch (error) {
      console.error('Öğrenme hatası:', error);
    }

    return false;
  };

  // Handle correct answer submission
  const submitCorrectAnswer = async (answer: string) => {
    if (!currentQuestion || !answer.trim()) return;

    try {
      await trainNetwork(currentQuestion, answer.trim());

      const newTraining: LocalTrainingData = {
        userInput: currentQuestion,
        systemOutput: answer.trim(),
        confidence: 1.0,
        timestamp: Date.now()
      };

      setTrainHistory(prev => {
        const updated = [...prev, newTraining];
        localStorage.setItem('neural_training_history', JSON.JSON.stringify(updated));
        return updated;
      });

      addToast('Eğitim başarıyla tamamlandı!', 'success');
      setShowCorrectAnswer(false);
      setCurrentQuestion('');

      setTimeout(() => {
        refreshNetwork();
      }, 500);

    } catch (error) {
      console.error('Eğitim hatası:', error);
      addToast('Eğitim sırasında hata oluştu', 'error');
    }
  };

  // Handle batch training
  const batchTrainNetwork = async (pairs: TrainingPair[]) => {
    setTrainingProgress(0);

    try {
      await batchTrainNetworkItems(pairs, (progress) => {
        setTrainingProgress(progress);
      });

      addToast(`${pairs.length} adet eğitim verisi başarıyla işlendi!`, 'success');
      setShowBatchTraining(false);
      setTrainingProgress(0);

      setTimeout(() => {
        refreshNetwork();
      }, 500);

    } catch (error) {
      console.error('Toplu eğitim hatası:', error);
      addToast('Toplu eğitim sırasında hata oluştu', 'error');
      setTrainingProgress(0);
    }
  };

  // Handle feedback
  const handleFeedback = (messageId: string, isPositive: boolean) => {
    const feedback = isPositive ? 1 : -1;
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback }
        : msg
    ));
    addToast('Geri bildiriminiz alındı', 'success');
  };

  // Handle correct answer callback
  const handleCorrectAnswer = (messageId: string) => {
    // Find the message to get the question content
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.isUser) {
      setCurrentQuestion(message.content);
      setOriginalQuestion(message.content);
      localStorage.setItem('pending_question', message.content);
      setShowCorrectAnswer(true);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    addToast('Sohbet temizlendi', 'info');
  };

  // Clear training
  const clearTraining = () => {
    setTrainHistory([]);
    localStorage.removeItem('neural_training_history');
    addToast('Eğitim verileri temizlendi', 'warning');
  };

  // Cevap anlamlılık kontrolü
  const isResponseMeaningful = (response: string, query: string): boolean => {
    if (!response || !query) return false;
    
    // Minimum uzunluk kontrolü
    if (response.length < 20) return false;
    
    // Query ile alakalılık kontrolü
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const responseWords = response.toLowerCase().split(/\s+/);
    
    const matchingWords = queryWords.filter(word => 
      responseWords.some(rWord => rWord.includes(word) || word.includes(rWord))
    );
    
    const relevanceRatio = matchingWords.length / queryWords.length;
    
    // En az %25 alakalılık olmalı
    return relevanceRatio >= 0.25;
  };

  // Handle cell details
  const handleCellDetails = (node: NetworkNode) => {
    setSelectedCell(node);
    setShowCellDetails(true);
  };

  // Handle adding cells
  const handleAddCells = () => {
    const count = 5; // Default count
    try {
      addCellsToNetwork(userNetworks, count);
      addToast(`${count} hücre eklendi`, 'success');
      refreshNetwork();
    } catch (error) {
      console.error('Hücre ekleme hatası:', error);
      addToast('Hücre eklenirken hata oluştu', 'error');
    }
  };

  // Handle removing cells
  const handleRemoveCells = () => {
    const count = 5; // Default count
    try {
      removeCellsFromNetwork(userNetworks, count);
      addToast(`${count} hücre kaldırıldı`, 'warning');
      refreshNetwork();
    } catch (error) {
      console.error('Hücre kaldırma hatası:', error);
      addToast('Hücre kaldırılırken hata oluştu', 'error');
    }
  };

  return (
    <div className="flex flex-col h-screen min-h-screen w-full overflow-hidden">
      {/* AI Neural Background */}
      <div className="ai-neural-bg"></div>

      {/* Header */}
      <div className="relative z-20">
        <Header 
          onToggleMenu={() => setShowMemory(!showMemory)}
          isMenuOpen={showMemory}
          isInternetEnabled={isInternetEnabled}
          onToggleInternet={toggleInternetLearning}
          isInternetSearching={isInternetSearching}
        />
      </div>

      {/* Tab Navigation */}
      <div className="glass-card border-0 border-b border-border/50 mb-4 sm:mb-6 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-2 sm:space-x-4 py-4 overflow-x-auto scrollbar-thin" role="tablist">
            <button
              onClick={() => setActiveTab('chat')}
              className={`tab-button whitespace-nowrap ${activeTab === 'chat' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'chat'}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">💬</span>
                <span className="mobile-hidden font-bold text-white">Sohbet</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('neural')}
              className={`tab-button whitespace-nowrap ${activeTab === 'neural' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'neural'}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">🌐</span>
                <span className="mobile-hidden font-bold text-white">Sinir Ağı</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sozluk')}
              className={`tab-button whitespace-nowrap ${activeTab === 'sozluk' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'sozluk'}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">📚</span>
                <span className="mobile-hidden font-bold text-white">Türkçe Sözlük</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Tab indicator line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6 relative z-10">
        <div className="h-full max-w-7xl mx-auto animate-fade-in">
          {activeTab === 'chat' && (
            <ChatPanel
              onSendMessage={handleSendMessage}
              onCorrectAnswer={handleCorrectAnswer}
              onShowMemory={() => setShowMemory(prev => !prev)}
              onClearChat={clearChat}
              onClearTraining={clearTraining}
              onFeedback={handleFeedback}
              messages={messages}
              isProcessing={isProcessing}
              memorySystem={memorySystemRef.current}
              relationCount={stats.relationCount}
              onToggleVoice={toggleVoice}
              isVoiceEnabled={isVoiceEnabled}
              onUserMessageLearned={handleSendMessageWithLearning}
            />
          )}
          {activeTab === 'neural' && (
            <NeuralNetworkPanel
              userNetworks={userNetworks}
              systemNetworks={systemNetworks}
              activatedNodes={activatedNodes as any}
              relations={relations}
              bidirectionalRelations={bidirectionalRelations}
              onRefresh={refreshNetwork}
              onShowCellDetails={handleCellDetails}
              onZoomIn={() => addToast("Yakınlaştırma özelliği 3D modunda kullanılabilir.", "info")}
              onZoomOut={() => addToast("Uzaklaştırma özelliği 3D modunda kullanılabilir.", "info")}
              onNewTraining={() => setShowCorrectAnswer(true)}
              onBatchTraining={() => setShowBatchTraining(true)}
              onAddCell={handleAddCells}
              onRemoveCell={handleRemoveCells}
              onToggleVoice={toggleVoice}
              isVoiceEnabled={isVoiceEnabled}
              totalNodeCount={stats.nodeCount}
              activeRelationCount={stats.relationCount}
            />
          )}
          {activeTab === 'sozluk' && <TurkishDictionaryPanel />}
        </div>
      </div>

      {/* Modals */}
      <MemoryPanel
        memorySystem={memorySystemRef.current}
        isVisible={showMemory}
        onClose={() => setShowMemory(false)}
      />

      <CorrectAnswerModal
        isOpen={showCorrectAnswer}
        originalQuestion={currentQuestion}
        onSubmit={(answer, editedQuestion) => {
          if (editedQuestion && editedQuestion !== currentQuestion) {
            setCurrentQuestion(editedQuestion);
          }
          submitCorrectAnswer(answer);
        }}
        onClose={() => {
          setShowCorrectAnswer(false);
          setCurrentQuestion('');
        }}
      />

      <BatchTrainingModal
        isOpen={showBatchTraining}
        onSubmit={batchTrainNetwork}
        onClose={() => setShowBatchTraining(false)}
        isProcessing={trainingProgress > 0 && trainingProgress < 100}
        progress={trainingProgress}
      />

      <CellDetailsModal
        isOpen={showCellDetails}
        node={selectedCell}
        relations={relations}
        bidirectionalRelations={bidirectionalRelations}
        onClose={() => setShowCellDetails(false)}
      />

      <AIStatusPanel
        advancedAI={advancedAI}
        isVisible={showAIStatus}
        onClose={() => setShowAIStatus(false)}
      />
    </div>
  );
}