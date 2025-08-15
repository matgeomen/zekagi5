import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  NetworkNode, 
  Relation,
  TrainingPair,
  ActivationResult,
  createEmptyGrid,
  addWordToNetwork,
  createRelation,
  reinforceRelation,
  weakenRelations,
  propagateActivation,
  generateResponse,
  findReverseAnswer,
  determineQuestionType,
  INITIAL_GRID_ROWS,
  INITIAL_GRID_COLS,
  INITIAL_NETWORK_LAYERS,
  MIN_RELATION_SCORE
} from '../lib/NeuralNetworkUtils';
import { TurkishDictionary } from '../lib/TurkishDictionary';

interface NotificationRef {
  show: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface NetworkState {
  userNetworks: (NetworkNode | null)[][][];
  systemNetworks: (NetworkNode | null)[][][];
  relations: Relation[];
  bidirectionalRelations: Relation[];
  trainingHistory: TrainingPair[];
  activatedNodes: {
    layer: number;
    row: number;
    col: number;
    type: 'user' | 'system';
  }[];
  stats: {
    nodeCount: number;
    relationCount: number;
    trainingCount: number;
    lastTraining: number | null;
  };
}

interface NeuralNetworkHook {
  userNetworks: (NetworkNode | null)[][][];
  systemNetworks: (NetworkNode | null)[][][];
  relations: Relation[];
  bidirectionalRelations: Relation[];
  trainingHistory: TrainingPair[];
  trainHistory?: TrainingPair[]; // Added for backward compatibility
  networkState?: NetworkState; // Added for backward compatibility
  activatedNodes: {
    layer: number;
    row: number;
    col: number;
    type: 'user' | 'system';
  }[];
  trainNetwork: (userInput: string, systemOutput: string) => Promise<void>;
  batchTrainNetworkItems: (
    items: Array<{ input: string, output: string }>, 
    onProgress?: (progress: number, processed: number, total: number) => void
  ) => Promise<void>;
  processUserInput: (userInput: string) => Promise<{ response: string; confidence: number }>;
  refreshNetwork: () => void;
  getNetworkStats: () => { 
    nodeCount: number; 
    relationCount: number;
    trainingCount: number;
    lastTraining: number | null;
  };
  setNotificationRef: (ref: NotificationRef | null) => void;
}

export function useNeuralNetwork(): NeuralNetworkHook {
  // Türkçe sözlük instance'ı
  const turkishDictionary = useRef(new TurkishDictionary()).current;
  const notificationRef = useRef<NotificationRef | null>(null);

  // Ağ durumu
  const [networkState, setNetworkState] = useState<NetworkState>({
    userNetworks: Array(INITIAL_NETWORK_LAYERS).fill(null).map(() => 
      createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS)
    ),
    systemNetworks: Array(INITIAL_NETWORK_LAYERS).fill(null).map(() => 
      createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS)
    ),
    relations: [],
    bidirectionalRelations: [],
    trainingHistory: [],
    activatedNodes: [],
    stats: {
      nodeCount: 0,
      relationCount: 0,
      trainingCount: 0,
      lastTraining: null
    }
  });

  // Düğüm pozisyonları
  const [nodePositions] = useState(new Map<string, { 
    layer: number; 
    row: number; 
    col: number;
    type: 'user' | 'system';
  }>());

  // Ağları ve ilişkileri yerel depolamadan yükle
  useEffect(() => {
    loadNetworkState();
  }, []);

  // Yerel depolamaya kaydet (durum değiştiğinde)
  useEffect(() => {
    saveNetworkState();
  }, [networkState]);

  // Güvenli ağ durumu kaydetme
  const saveNetworkState = () => {
    try {
      // Eğitim verilerini koru - sınırsız
      const trainingHistory = networkState.trainingHistory;
      const relations = networkState.relations;
      const stats = networkState.stats;

      // JSON boyutunu kontrol et
      const trainingDataSize = JSON.stringify(trainingHistory).length;
      const relationsDataSize = JSON.stringify(relations).length;

      console.log(`💾 Kaydediliyor: ${trainingHistory.length} eğitim, ${relations.length} ilişki`);
      console.log(`📊 Veri boyutu: Eğitim ${Math.round(trainingDataSize/1024)}KB, İlişki ${Math.round(relationsDataSize/1024)}KB`);

      // Chunk-based kaydetme (5MB sınırı için)
      const maxChunkSize = 4 * 1024 * 1024; // 4MB chunks

      // Eğitim verilerini chunk'lara böl
      if (trainingDataSize > maxChunkSize) {
        const chunkSize = Math.floor(trainingHistory.length / Math.ceil(trainingDataSize / maxChunkSize));
        for (let i = 0; i < trainingHistory.length; i += chunkSize) {
          const chunk = trainingHistory.slice(i, i + chunkSize);
          const chunkIndex = Math.floor(i / chunkSize);
          localStorage.setItem(`neural_training_chunk_${chunkIndex}`, JSON.stringify(chunk));
        }
        localStorage.setItem('neural_training_chunks', Math.ceil(trainingHistory.length / chunkSize).toString());
      } else {
        localStorage.setItem('neural_training_history', JSON.stringify(trainingHistory));
        localStorage.removeItem('neural_training_chunks');
      }

      // İlişkileri kaydet
      localStorage.setItem('neural_relations', JSON.stringify(relations));
      localStorage.setItem('neural_bidirectional_relations', JSON.stringify(networkState.bidirectionalRelations));

      // İstatistikleri kaydet
      localStorage.setItem('neural_stats', JSON.stringify(stats));

      // Ağ verilerini minimal tut
      localStorage.setItem('neural_user_networks', JSON.stringify(networkState.userNetworks.slice(0, 5)));
      localStorage.setItem('neural_system_networks', JSON.stringify(networkState.systemNetworks.slice(0, 5)));

      console.log(`✅ Tüm veriler kaydedildi: ${trainingHistory.length} eğitim verisi korundu`);

    } catch (error) {
      console.error('❌ Kaydetme hatası:', error);

      // Hata durumunda en kritik verileri kaydet
      try {
        localStorage.setItem('neural_stats', JSON.stringify(networkState.stats));
        localStorage.setItem('neural_training_history', JSON.stringify(networkState.trainingHistory.slice(-100))); // Son 100
        console.log('⚠️ Sadece kritik veriler kaydedildi');
      } catch (criticalError) {
        console.error('💥 Kritik veri kaydetme hatası:', criticalError);
      }
    }
  };

  // Ağ durumunu yükle - chunk desteği ile
  const loadNetworkState = () => {
    try {
      // Kullanıcı ağları
      const userNetworksStr = localStorage.getItem('neural_user_networks');
      const userNetworks = userNetworksStr 
        ? JSON.parse(userNetworksStr) 
        : Array(INITIAL_NETWORK_LAYERS).fill(null).map(() => 
            createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS)
          );

      // Sistem ağları
      const systemNetworksStr = localStorage.getItem('neural_system_networks');
      const systemNetworks = systemNetworksStr 
        ? JSON.parse(systemNetworksStr) 
        : Array(INITIAL_NETWORK_LAYERS).fill(null).map(() => 
            createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS)
          );

      // İlişkiler
      const relationsStr = localStorage.getItem('neural_relations');
      const relations = relationsStr ? JSON.parse(relationsStr) : [];

      // Çift yönlü ilişkiler
      const bidirectionalRelationsStr = localStorage.getItem('neural_bidirectional_relations');
      const bidirectionalRelations = bidirectionalRelationsStr ? JSON.parse(bidirectionalRelationsStr) : [];

      // Eğitim geçmişini yükle - chunk desteği ile
      let trainingHistory = [];

      // Chunk'ların sayısını kontrol et
      const chunksCountStr = localStorage.getItem('neural_training_chunks');

      if (chunksCountStr) {
        // Chunk'lardan yükle
        const chunksCount = parseInt(chunksCountStr);
        console.log(`📦 ${chunksCount} chunk'tan eğitim verileri yükleniyor...`);

        for (let i = 0; i < chunksCount; i++) {
          const chunkStr = localStorage.getItem(`neural_training_chunk_${i}`);
          if (chunkStr) {
            const chunk = JSON.parse(chunkStr);
            trainingHistory = trainingHistory.concat(chunk);
          }
        }

        console.log(`✅ Chunk'lardan ${trainingHistory.length} eğitim verisi yüklendi`);
      } else {
        // Normal tek dosyadan yükle
        const trainingHistoryStr = localStorage.getItem('neural_training_history');
        trainingHistory = trainingHistoryStr ? JSON.parse(trainingHistoryStr) : [];

        if (trainingHistory.length > 0) {
          console.log(`✅ ${trainingHistory.length} eğitim verisi yüklendi`);
        }
      }

      // İstatistikler
      const statsStr = localStorage.getItem('neural_stats');
      const stats = statsStr ? JSON.parse(statsStr) : {
        nodeCount: 0,
        relationCount: relations.length,
        trainingCount: trainingHistory.length,
        lastTraining: null
      };

      // İstatistikleri güncelle
      stats.relationCount = relations.length;
      stats.trainingCount = trainingHistory.length;

      // Düğüm pozisyonlarını güncelle
      updateNodePositions(userNetworks, systemNetworks);

      // Ağ durumunu güncelle
      setNetworkState({
        userNetworks,
        systemNetworks,
        relations,
        bidirectionalRelations,
        trainingHistory,
        activatedNodes: [],
        stats
      });

      console.log(`🎉 Ağ durumu yüklendi: ${trainingHistory.length} eğitim, ${relations.length} ilişki`);

    } catch (error) {
      console.error('❌ Ağ durumu yüklenemedi:', error);

      // Hata durumunda boş durumla başla
      setNetworkState({
        userNetworks: Array(INITIAL_NETWORK_LAYERS).fill(null).map(() => 
          createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS)
        ),
        systemNetworks: Array(INITIAL_NETWORK_LAYERS).fill(null).map(() => 
          createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS)
        ),
        relations: [],
        bidirectionalRelations: [],
        trainingHistory: [],
        activatedNodes: [],
        stats: {
          nodeCount: 0,
          relationCount: 0,
          trainingCount: 0,
          lastTraining: null
        }
      });
    }
  };

  // Düğüm pozisyonlarını güncelle
  const updateNodePositions = (
    userNetworks: (NetworkNode | null)[][][], 
    systemNetworks: (NetworkNode | null)[][][]
  ) => {
    // Mevcut pozisyonları temizle
    nodePositions.clear();

    // Kullanıcı ağındaki düğümlerin pozisyonlarını kaydet
    for (let layer = 0; layer < userNetworks.length; layer++) {
      for (let row = 0; row < userNetworks[layer].length; row++) {
        for (let col = 0; col < userNetworks[layer][0].length; col++) {
          const node = userNetworks[layer][row][col];
          if (node) {
            nodePositions.set(node.id, { layer, row, col, type: 'user' });
          }
        }
      }
    }

    // Sistem ağındaki düğümlerin pozisyonlarını kaydet
    for (let layer = 0; layer < systemNetworks.length; layer++) {
      for (let row = 0; row < systemNetworks[layer].length; row++) {
        for (let col = 0; col < systemNetworks[layer][0].length; col++) {
          const node = systemNetworks[layer][row][col];
          if (node) {
            nodePositions.set(node.id, { layer, row, col, type: 'system' });
          }
        }
      }
    }
  };

  // Ağ eğitimi - her veriyi garantili kaydet
  const trainNetwork = useCallback(async (userInput: string, systemOutput: string) => {
    const cleanUserInput = userInput.trim();
    const cleanSystemOutput = systemOutput.trim();

    if (!cleanUserInput || !cleanSystemOutput) {
      console.log(`❌ Boş girdi atlandı: "${userInput}" => "${systemOutput}"`);
      return;
    }

    console.log(`🔄 EĞİTİM BAŞLIYOR: "${cleanUserInput}" => "${cleanSystemOutput}"`);

    try {
      // Eğitim çiftini oluştur
      const trainingPair: TrainingPair = {
        id: uuidv4(),
        input: cleanUserInput,
        output: cleanSystemOutput,
        timestamp: Date.now(),
        usageCount: 0,
        category: 'general'
      };

      // Durum güncellemesini direkt yap
      setNetworkState(prevState => {
        // YENİ: Aynı soruyu kontrol et ve güncelle
        const existingTrainingIndex = prevState.trainingHistory.findIndex(item => 
          item.input.toLowerCase().trim() === cleanUserInput.toLowerCase().trim()
        );

        let newTrainingHistory;
        if (existingTrainingIndex >= 0) {
          // Mevcut soruyu güncelle
          newTrainingHistory = [...prevState.trainingHistory];
          newTrainingHistory[existingTrainingIndex] = trainingPair;
          console.log(`🔄 Mevcut soru güncellendi: "${cleanUserInput}"`);
        } else {
          // Yeni soru ekle
          newTrainingHistory = [...prevState.trainingHistory, trainingPair];
          console.log(`➕ Yeni soru eklendi: "${cleanUserInput}"`);
        }

        // Kelimeleri ayır
        const userWords = cleanUserInput.split(/\s+/).filter(word => word.length > 0);
        const systemWords = cleanSystemOutput.split(/\s+/).filter(word => word.length > 0);

        // İlişkileri oluştur/güncelle
        const newRelations = [...prevState.relations];

        for (const userWord of userWords) {
          for (const systemWord of systemWords) {
            const existingRelation = newRelations.find(rel => 
              rel.userWord.toLowerCase() === userWord.toLowerCase() && 
              rel.systemWord.toLowerCase() === systemWord.toLowerCase()
            );

            if (existingRelation) {
              // Mevcut ilişkiyi güçlendir
              existingRelation.strength = Math.min(100, existingRelation.strength + 5);
              existingRelation.frequency += 1;
              existingRelation.lastUsed = Date.now();
            } else {
              // Yeni ilişki oluştur
              const newRelation = createRelation(
                userWord,
                systemWord,
                60, // Başlangıç dependency
                60, // Başlangıç association
                1,  // Frequency
                userWords.indexOf(userWord), // Order
                0,  // Feedback
                false, // Bidirectional
                [], // Context
                'semantic' // Type
              );
              newRelations.push(newRelation);
            }
          }
        }

        // Yeni durum
        const newState = {
          userNetworks: prevState.userNetworks,
          systemNetworks: prevState.systemNetworks,
          relations: newRelations,
          bidirectionalRelations: prevState.bidirectionalRelations,
          trainingHistory: newTrainingHistory,
          activatedNodes: [],
          stats: {
            nodeCount: prevState.stats.nodeCount,
            relationCount: newRelations.length,
            trainingCount: newTrainingHistory.length,
            lastTraining: Date.now()
          }
        };

        console.log(`✅ EĞİTİM KAYDEDILDI: Toplam ${newTrainingHistory.length} veri, ${newRelations.length} ilişki`);

        return newState;
      });

    } catch (error) {
      console.error('❌ Eğitim hatası:', error);
    }
  }, []);

  // Yanıt önbelleği
  const responseCache = new Map<string, {response: string; confidence: number; timestamp: number}>();
  const CACHE_DURATION = 1000 * 60 * 5; // 5 dakika

  // Sözlük sorgusu kontrolü
   const checkIfDictionaryQuery = (input: string): boolean => {
    const lowerInput = input.toLowerCase().trim();

    // Sözlük sorgusu kalıpları
    const dictionaryPatterns = [
      /(.+?)\s*nedir\s*\??$/,           // "X nedir?"
      /(.+?)\s*ne\s*demek\s*\??$/,     // "X ne demek?"
      /(.+?)\s*ne\s*anlama\s*geliyor\s*\??$/, // "X ne anlama geliyor?"
      /(.+?)\s*ne\s*anlama\s*gelir\s*\??$/, // "X ne anlama gelir?"
      /(.+?)\s*ne\s*\??$/,             // "X ne?"
      /(.+?)\s*anlamı\s*ne\s*\??$/,    // "X anlamı ne?"
      /(.+?)\s*anlamı\s*nedir\s*\??$/, // "X anlamı nedir?"
      /(.+?)\s*manası\s*ne\s*\??$/,    // "X manası ne?"
      /(.+?)\s*manası\s*nedir\s*\??$/, // "X manası nedir?"
      /ne\s*demek\s*(.+?)\s*\??$/,     // "ne demek X?"
      /anlamı\s*nedir\s*(.+?)\s*\??$/, // "anlamı nedir X?"
    ];

    // Herhangi bir sözlük kalıbı eşleşirse true döndür
    return dictionaryPatterns.some(pattern => pattern.test(lowerInput));
  };

  // Kelime anlamı sorusundan hedef kelimeyi çıkar
  const extractTargetWord = (input: string): string | null => {
    const lowerInput = input.toLowerCase().trim();

    const patterns = [
      /^(.+?)\s*nedir\s*\??$/,           // "X nedir?"
      /^(.+?)\s*ne\s*demek\s*\??$/,     // "X ne demek?"
      /^(.+?)\s*ne\s*anlama\s*geliyor\s*\??$/, // "X ne anlama geliyor?"
      /^(.+?)\s*ne\s*anlama\s*gelir\s*\??$/, // "X ne anlama gelir?"
      /^(.+?)\s*ne\s*\??$/,             // "X ne?"
      /^(.+?)\s*anlamı\s*ne\s*\??$/,    // "X anlamı ne?"
      /^(.+?)\s*anlamı\s*nedir\s*\??$/, // "X anlamı nedir?"
      /^(.+?)\s*manası\s*ne\s*\??$/,    // "X manası ne?"
      /^(.+?)\s*manası\s*nedir\s*\??$/, // "X manası nedir?"
      /^ne\s*demek\s*(.+?)\s*\??$/,     // "ne demek X?"
      /^anlamı\s*nedir\s*(.+?)\s*\??$/, // "anlamı nedir X?"
    ];

    for (const pattern of patterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  };

  const processUserInput = useCallback(async (userInput: string) => {
    try {
      console.log(`🔍 Kullanıcı girdisi işleniyor: "${userInput}"`);

      // En güncel eğitim verilerini al - hem state hem localStorage'dan
      let currentTrainingData = networkState.trainingHistory;

      // YENİ: localStorage'dan da kontrol et (daha güncel olabilir)
      try {
        const localStorageData = localStorage.getItem('neural_training_history');
        if (localStorageData) {
          const parsedLocalData = JSON.parse(localStorageData);
          if (Array.isArray(parsedLocalData) && parsedLocalData.length > currentTrainingData.length) {
            console.log(`🔄 localStorage'da daha güncel veri bulundu: ${parsedLocalData.length} > ${currentTrainingData.length}`);

            // localStorage formatını TrainingPair formatına dönüştür
            currentTrainingData = parsedLocalData.map(item => ({
              id: item.id || uuidv4(),
              input: item.input || item.userInput,
              output: item.output || item.systemOutput,
              timestamp: item.timestamp || Date.now(),
              usageCount: item.usageCount || 0,
              category: item.category || 'general'
            }));
          }
        }
      } catch (localStorageError) {
        console.error('localStorage okuma hatası:', localStorageError);
      }

      console.log(`📚 Mevcut eğitim verisi sayısı: ${currentTrainingData.length}`);

      if (currentTrainingData.length === 0) {
        console.log('❌ Hiç eğitim verisi yok, temel cevap sistemi devreye giriyor');
        
        // Basic responses for common greetings and questions
        const basicResponses = getBasicResponse(userInput);
        if (basicResponses) {
          return basicResponses;
        }
        
        // For dictionary queries, try to provide basic response
        const cleanInput = userInput.toLowerCase().trim();
        const isDictionaryQuery = checkIfDictionaryQuery(cleanInput);
        
        if (isDictionaryQuery) {
          const targetWord = extractTargetWord(cleanInput);
          if (targetWord) {
            const dictionaryEntry = turkishDictionary.getWord(targetWord);
            if (dictionaryEntry) {
              return {
                response: `${targetWord.charAt(0).toUpperCase() + targetWord.slice(1)}: ${dictionaryEntry.meaning[0]}`,
                confidence: 0.8
              };
            }
          }
        }
        
        // Only use modal trigger as last resort
        return {
          response: 'MODAL_TRIGGER_UNKNOWN',
          confidence: 0.1
        };
      }

      const cleanInput = userInput.toLowerCase().trim();
      const isDictionaryQuery = checkIfDictionaryQuery(cleanInput);
      const phraseAnalysis = turkishDictionary.analyzePhrase(userInput);
      let response = '';
      let confidence = 0;

      if (isDictionaryQuery) {
        // Kelime anlamı sorusu - Sözlük öncelikli sistem
        const targetWord = extractTargetWord(cleanInput);
        console.log('🔍 Kelime anlamı sorusu tespit edildi. Hedef kelime:', targetWord);

        if (targetWord) {
          // 1. ÖNCE SÖZLÜKTE ARA
          const dictionaryEntry = turkishDictionary.getWord(targetWord);
          if (dictionaryEntry) {
            console.log('📖 Sözlükte bulundu (öncelikli):', dictionaryEntry);
            response = `${targetWord.charAt(0).toUpperCase() + targetWord.slice(1)}: ${dictionaryEntry.meaning[0]}`;
            if (dictionaryEntry.type) {
              response += ` (${dictionaryEntry.type})`;
            }
            if (dictionaryEntry.examples && dictionaryEntry.examples.length > 0) {
              response += `\n\nÖrnek kullanım: ${dictionaryEntry.examples[0]}`;
            }
            confidence = 0.95;
          } else {
            // 2. SÖZLÜKTE YOKSA EĞİTİM VERİSİNDE ARA
            console.log('📚 Sözlükte bulunamadı, eğitim verilerinde aranıyor:', targetWord);
            const trainingMatch = currentTrainingData.find(item => {
              const inputLower = item.input.toLowerCase();
              const outputLower = item.output.toLowerCase();
              return inputLower.includes(targetWord) || outputLower.includes(targetWord);
            });

            if (trainingMatch) {
              console.log('🎯 Eğitim verisinde bulundu:', trainingMatch);
              response = trainingMatch.output;
              confidence = 0.85;
            } else {
              // 3. HİÇBİR YERDE YOKSA - Modal açılması gerekir
              console.log('❌ Ne sözlükte ne de eğitim verilerinde bulunamadı');
              return {
                response: 'MODAL_TRIGGER_UNKNOWN',
                confidence: 0.1,
                usedTraining: null,
                method: 'fallback',
                notification: '❌ Eğitim gerekli'
              };
            }
          }
        } else {
          // Hedef kelime çıkarılamazsa genel sözlük analizi
          if (phraseAnalysis.semanticComponents?.expectedResponse && phraseAnalysis.confidence > 0.5) {
            console.log('📖 Genel sözlük analizi:', phraseAnalysis.semanticComponents.expectedResponse);
            response = phraseAnalysis.semanticComponents.expectedResponse;
            confidence = phraseAnalysis.confidence;
          }
        }
      } else {
        // Normal sorular: önce eğitim verilerine bak
        console.log('🔍 Eğitim verilerinde arama yapılıyor:', cleanInput);
        console.log('📊 Mevcut eğitim verisi sayısı:', currentTrainingData.length);

        // Direkt eşleşme ara
        let directMatch = currentTrainingData.find(item => 
          item.input.toLowerCase().trim() === cleanInput ||
          item.input.toLowerCase().includes(cleanInput) ||
          cleanInput.includes(item.input.toLowerCase())
        );

        if (directMatch) {
          console.log('✅ Direkt eşleşme bulundu:', directMatch);
          response = directMatch.output;
          confidence = 0.95;
        } else {
          // Benzerlik ile ara (basit string matching)
          let bestMatch = null;
          let bestScore = 0;

          for (const item of currentTrainingData) {
            const inputLower = item.input.toLowerCase();
            const similarity = calculateSimilarity(cleanInput, inputLower);

            if (similarity > bestScore && similarity > 0.3) {
              bestScore = similarity;
              bestMatch = item;
            }
          }

          if (bestMatch && bestScore > 0.5) {
            console.log('✅ Benzerlik eşleşmesi bulundu:', bestMatch, 'Score:', bestScore);
            response = bestMatch.output;
            confidence = bestScore;
          } else {
            // Sözlük analizi
            if (phraseAnalysis.semanticComponents?.expectedResponse && phraseAnalysis.confidence > 0.5) {
              console.log('📖 Sözlük cevabı:', phraseAnalysis.semanticComponents.expectedResponse);
              response = phraseAnalysis.semanticComponents.expectedResponse;
              confidence = phraseAnalysis.confidence;
            }
          }
        }
      }

      // Sözlük analizi ile yanıt arayışı devam et
      if (phraseAnalysis.semanticComponents?.expectedResponse && phraseAnalysis.confidence > 0.4) {
        console.log('📖 Sözlük analizi cevabı:', phraseAnalysis.semanticComponents.expectedResponse);
        response = phraseAnalysis.semanticComponents.expectedResponse;
        confidence = phraseAnalysis.confidence;
      }

      // Basit greeting/farewell cevapları
      if (!response || response.trim() === '') {
        if (cleanInput.includes('merhaba') || cleanInput.includes('selam')) {
          response = 'Merhaba! Size nasıl yardımcı olabilirim?';
          confidence = 0.8;
        } else if (cleanInput.includes('teşekkür')) {
          response = 'Rica ederim!';
          confidence = 0.8;
        } else if (cleanInput.includes('güle güle') || cleanInput.includes('hoşça kal')) {
          response = 'Güle güle! Sonra görüşürüz!';
          confidence = 0.8;
        }
      }

      // Final kontrol - eğer herhangi bir cevap varsa döndür
      if (response && response.trim() !== '') {
        console.log('✅ Neural network final yanıt:', response.substring(0, 50) + '...', 'Güven:', confidence);
        return {
          response,
          confidence,
          usedTraining: null,
          method: confidence > 0.7 ? 'trained' : 'fallback',
          notification: confidence > 0.7 ? undefined : 'ℹ️ Daha iyi cevap için beni eğitebilirsin!'
        };
      }

      // Sadece hiçbir cevap bulunamadığında modal tetikle
      console.log('❌ Neural network: Hiçbir cevap bulunamadı');
      return {
        response: 'MODAL_TRIGGER_UNKNOWN',
        confidence: 0.1,
        usedTraining: null,
        notification: '❌ Eğitim gerekli'
      };

    } catch (error) {
      console.error('❌ İşleme hatası:', error);
      return {
        response: 'MODAL_TRIGGER_UNKNOWN',
        confidence: 0.1,
        usedTraining: null,
        method: 'error',
        notification: 'Bir hata oluştu, lütfen tekrar deneyin.'
      };
    }
  }, [networkState.trainingHistory, turkishDictionary]);

  // Basic response system for when no training data is available
  const getBasicResponse = (input: string) => {
    const cleanInput = input.toLowerCase().trim();
    
    // Common greetings
    if (cleanInput.match(/^(merhaba|selam|hey|hi|hello|günaydın|iyi akşamlar|iyi günler)$/)) {
      const responses = [
        'Merhaba! Size nasıl yardımcı olabilirim?',
        'Selam! Bugün ne öğrenmek istiyorsunuz?',
        'Hoş geldiniz! Benimle konuşarak beni eğitebilirsiniz.',
      ];
      return {
        response: responses[Math.floor(Math.random() * responses.length)],
        confidence: 0.9
      };
    }
    
    // How are you questions
    if (cleanInput.match(/(nasılsın|nasıl gidiyor|ne haber|keyifler nasıl)/)) {
      return {
        response: 'İyiyim, teşekkür ederim! Siz beni eğiterek daha da iyi hale getirebilirsiniz. Ne öğrenmek istiyorsunuz?',
        confidence: 0.8
      };
    }
    
    // Thank you
    if (cleanInput.match(/(teşekkür|sağol|tşk|thanks|merci)/)) {
      return {
        response: 'Rica ederim! Başka bir konuda yardımcı olabilir miyim?',
        confidence: 0.9
      };
    }
    
    // Goodbye
    if (cleanInput.match(/(güle güle|hoşça kal|görüşürüz|bye|hoşçakal)/)) {
      return {
        response: 'Hoşça kalın! Tekrar görüşmek üzere. Beni eğittiğiniz için teşekkürler!',
        confidence: 0.9
      };
    }
    
    // What can you do questions
    if (cleanInput.match(/(ne yapabilirsin|neler biliyorsun|yeteneklerin|nasıl çalışıyorsun)/)) {
      return {
        response: 'Ben öğrenen bir yapay zeka asistanıyım. Bana sorular sorarak ve doğru cevapları öğreterek beni geliştirebilirsiniz. Türkçe kelime anlamları, genel bilgiler ve daha fazlası hakkında konuşabiliriz!',
        confidence: 0.8
      };
    }
    
    return null;
  };

  // Benzerlik hesaplama yardımcı fonksiyonu
  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    let commonWords = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          commonWords++;
          break;
        }
      }
    }

    return commonWords / Math.max(words1.length, words2.length);
  };

  // İki yönlü ilişkileri güncelleme yardımcı fonksiyonu
  const updateBidirectionalRelations = useCallback((input: string, output: string, strength: number) => {
    // İlişkileri güçlendir
    setNetworkState(prev => {
      // İlgili ilişkileri bul
      const relationsToUpdate = prev.relations.filter(rel => 
        (rel.userWord === input && rel.systemWord === output) ||
        (rel.userWord === output && rel.systemWord === input)
      );

      // İlişkileri güçlendir
      const updatedRelations = prev.relations.map(rel => {
        if ((rel.userWord === input && rel.systemWord === output) ||
            (rel.userWord === output && rel.systemWord === input)) {
          return reinforceRelation(rel, strength);
        }
        return rel;
      });

      // İki yönlü ilişkileri güçlendir
      const updatedBiRelations = prev.bidirectionalRelations.map(rel => {
        if ((rel.userWord === input && rel.systemWord === output) ||
            (rel.userWord === output && rel.systemWord === input)) {
          return reinforceRelation(rel, strength);
        }
        return rel;
      });

      return {
        ...prev,
        relations: updatedRelations,
        bidirectionalRelations: updatedBiRelations
      };
    });
  }, []);

  // İlişkileri güncelleme yardımcı fonksiyonu
  const updateRelations = useCallback((input: string, output: string, strength: number) => {
    updateBidirectionalRelations(input, output, strength);
  }, [updateBidirectionalRelations]);

  // Ağı yenile
  const refreshNetwork = useCallback(() => {
    const { relations, bidirectionalRelations } = networkState;

    // İlişkileri unutma mekanizması ile güncelle
    const weakenedRelations = weakenRelations([...relations]);
    const weakenedBiRelations = weakenRelations([...bidirectionalRelations]);

    // Ağ durumunu güncelle
    setNetworkState(prev => ({
      ...prev,
      relations: weakenedRelations,
      bidirectionalRelations: weakenedBiRelations,
      activatedNodes: []
    }));
  }, [networkState]);

  // Ağ istatistiklerini al
  const getNetworkStats = useCallback(() => {
    return networkState.stats;
  }, [networkState.stats]);

  // Toplu eğitim - tüm verileri güvenli şekilde işle
  const batchTrainNetworkItems = useCallback(async (
    items: Array<{ input: string, output: string }>, 
    onProgress?: (progress: number, processed: number, total: number) => void
  ) => {
    if (!items || items.length === 0) {
      console.log('❌ Boş veri listesi');
      return;
    }

    console.log(`🚀 Toplu eğitim başlatılıyor: ${items.length} öğe`);

    // Verileri doğrula ve temizle
    const validItems = items.filter(item => {
      if (!item) return false;
      if (typeof item.input !== 'string' || typeof item.output !== 'string') return false;
      if (item.input.trim().length === 0 || item.output.trim().length === 0) return false;
      return true;
    }).map(item => ({
      input: item.input.trim(),
      output: item.output.trim()
    }));

    console.log(`✅ Geçerli öğe sayısı: ${validItems.length}/${items.length}`);

    if (validItems.length === 0) {
      console.log('❌ Geçerli öğe bulunamadı');
      return;
    }

    let processedCount = 0;
    let successCount = 0;

    // Başlangıç progress
    if (onProgress) {
      onProgress(0, 0, validItems.length);
    }

    // Batch boyutu - büyük veriler için
    const batchSize = 10;

    // Verilerí batch'ler halinde işle
    for (let batchStart = 0; batchStart < validItems.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, validItems.length);
      const batch = validItems.slice(batchStart, batchEnd);

      console.log(`📦 Batch ${Math.floor(batchStart/batchSize) + 1} işleniyor: ${batch.length} öğe`);

      // Batch içindeki öğeleri işle
      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];

        try {
          // Eğitimi yap
          await trainNetwork(item.input, item.output);
          successCount++;

          console.log(`✅ ${processedCount + 1}/${validItems.length}: "${item.input}" => "${item.output}"`);
        } catch (error) {
          console.error(`❌ Öğe ${processedCount + 1} işleme hatası:`, error);
        }

        processedCount++;

        // Progress güncelle (her öğede)
        const progress = Math.round((processedCount / validItems.length) * 100);
        if (onProgress) {
          onProgress(progress, processedCount, validItems.length);
        }
      }

      // Batch sonrası kısa bekleme
      if (batchEnd < validItems.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`🎉 Toplu eğitim tamamlandı: ${successCount}/${processedCount} başarılı`);
    console.log(`📊 Toplam eğitim verisi: ${networkState.trainingHistory.length + successCount}`);

  }, [trainNetwork, networkState.trainingHistory.length]);

  // Tek chunk'ı işleme fonksiyonu - tüm verileri kaydetmek için optimize edildi
  const processChunk = async (chunk: Array<{ input: string, output: string }>, currentState: NetworkState) => {
    console.log(`📊 Chunk işleniyor: ${chunk.length} öğe`);

    // Her öğeyi normal eğitim süreciyle işle
    for (let i = 0; i < chunk.length; i++) {
      const item = chunk[i];

      try {
        if (item.input && item.output && 
            item.input.trim().length > 0 && 
            item.output.trim().length > 0) {

          // Normal eğitim fonksiyonunu kullan - tüm işlemleri yapar
          await trainNetwork(item.input.trim(), item.output.trim());

          console.log(`✅ İşlendi: "${item.input}" => "${item.output}"`);
        } else {
          console.log(`❌ Geçersiz öğe atlandı: ${JSON.stringify(item)}`);
        }
      } catch (error) {
        console.error(`❌ Öğe işleme hatası:`, error, item);
      }
    }

    console.log(`✅ Chunk tamamlandı: ${chunk.length} öğe işlendi`);
  };

  // Toplu eğitim
  const processBatchTraining = useCallback(async (pairs: TrainingPair[]): Promise<void> => {
    if (!networkState) return;

    // Başlangıç istatistikleri
    const initialUserNodes = networkState.userNetworks.flat(2).filter(node => node !== null).length;
    const initialSystemNodes = networkState.systemNetworks.flat(2).filter(node => node !== null).length;
    const initialRelations = networkState.relations.length;
    const initialTotalNodes = initialUserNodes + initialSystemNodes;

    // Eğitim başlatıldı
    console.log(`Toplu eğitim başlatılıyor, ${pairs.length} öğe işlenecek...`);

    // İlerleme takibi
    let processedCount = 0;
    let successCount = 0;

    // Başlangıç bildirimi
    if (notificationRef.current) {
      notificationRef.current.show(
        `🚀 Toplu eğitim başlatıldı: ${pairs.length} veri işlenecek...`,
        'info'
      );
    }

    // Tüm eğitim öğelerini işle
    for (const pair of pairs) {
      try {
        // Her çifti işle
        await trainNetwork(pair.input, pair.output);

        // İlerleme güncelle
        processedCount++;
        successCount++;
        const progress = Math.round((processedCount / pairs.length) * 100);
        console.log(`İlerleme: %${progress} (${processedCount}/${pairs.length})`);

        // Ara bildirim
        if (processedCount % 10 === 0 && notificationRef.current) {
          notificationRef.current.show(
            `📊 ${processedCount}/${pairs.length} veri işlendi (${progress}%)`,
            'info'
          );
        }

        // Her 100 öğede bir UI güncelleme - performans optimizasyonu
        if ((processedCount % 100) === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      } catch (error) {
        console.error(`Eğitim sırasında hata:`, error);
        processedCount++;
      }
    }

    // Son istatistikleri al
    const finalUserNodes = networkState.userNetworks.flat(2).filter(node => node !== null).length;
    const finalSystemNodes = networkState.systemNetworks.flat(2).filter(node => node !== null).length;
    const finalRelations = networkState.relations.length;
    const finalTotalNodes = finalUserNodes + finalSystemNodes;

    const newNodesCount = finalTotalNodes - initialTotalNodes;
    const newRelationsCount = finalRelations - initialRelations;

    console.log(`Toplu eğitim tamamlandı, ${processedCount} öğe işlendi.`);
    console.log(`Yeni düğüm sayısı: ${newNodesCount}, Yeni ilişki sayısı: ${newRelationsCount}`);

    // Tamamlama bildirimi
    if (notificationRef.current) {
      notificationRef.current.show(
        `✅ Toplu eğitim tamamlandı!\n📊 ${successCount}/${pairs.length} başarılı\n🧠 +${newNodesCount} düğüm\n🔗 +${newRelationsCount} ilişki`,
        'success'
      );
    }
  }, [networkState, trainNetwork]);

  return {
    userNetworks: networkState.userNetworks,
    systemNetworks: networkState.systemNetworks,
    relations: networkState.relations,
    bidirectionalRelations: networkState.bidirectionalRelations,
    trainingHistory: networkState.trainingHistory,
    trainHistory: networkState.trainingHistory, // Backward compatibility
    networkState: networkState, // Export for App.tsx compatibility
    activatedNodes: networkState.activatedNodes,
    trainNetwork,
    batchTrainNetworkItems, // Yeni toplu eğitim fonksiyonu
    processUserInput,
    refreshNetwork,
    getNetworkStats,
    setNotificationRef: (ref: NotificationRef | null) => {
      notificationRef.current = ref;
    }
  };
}