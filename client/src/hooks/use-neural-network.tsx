import { useState, useEffect, useCallback } from 'react';
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
} from '@/lib/NeuralNetworkUtils';

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
  activatedNodes: {
    layer: number;
    row: number;
    col: number;
    type: 'user' | 'system';
  }[];
  trainNetwork: (userInput: string, systemOutput: string) => Promise<void>;
  batchTrainNetworkItems: (items: Array<{ input: string, output: string }>) => Promise<void>;
  processUserInput: (userInput: string) => Promise<{ response: string; confidence: number }>;
  refreshNetwork: () => void;
  getNetworkStats: () => { 
    nodeCount: number; 
    relationCount: number; 
    trainingCount: number;
    lastTraining: number | null;
  };
}

export function useNeuralNetwork(): NeuralNetworkHook {
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
  
  // Ağ durumunu kaydet
  const saveNetworkState = () => {
    try {
      localStorage.setItem('neural_user_networks', JSON.stringify(networkState.userNetworks));
      localStorage.setItem('neural_system_networks', JSON.stringify(networkState.systemNetworks));
      localStorage.setItem('neural_relations', JSON.stringify(networkState.relations));
      localStorage.setItem('neural_bidirectional_relations', JSON.stringify(networkState.bidirectionalRelations));
      localStorage.setItem('neural_training_history', JSON.stringify(networkState.trainingHistory));
      localStorage.setItem('neural_stats', JSON.stringify(networkState.stats));
    } catch (error) {
      console.error('Ağ durumu kaydedilemedi:', error);
    }
  };
  
  // Ağ durumunu yükle
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
      
      // Eğitim geçmişi
      const trainingHistoryStr = localStorage.getItem('neural_training_history');
      const trainingHistory = trainingHistoryStr ? JSON.parse(trainingHistoryStr) : [];
      
      // İstatistikler
      const statsStr = localStorage.getItem('neural_stats');
      const stats = statsStr ? JSON.parse(statsStr) : {
        nodeCount: 0,
        relationCount: 0,
        trainingCount: 0,
        lastTraining: null
      };
      
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
    } catch (error) {
      console.error('Ağ durumu yüklenemedi:', error);
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
  
  // Ağ eğitimi
  const trainNetwork = useCallback(async (userInput: string, systemOutput: string) => {
    // Girdileri temizle
    const cleanUserInput = userInput.trim();
    const cleanSystemOutput = systemOutput.trim();
    
    if (!cleanUserInput || !cleanSystemOutput) return;
    
    // Mevcut ağları al
    const { userNetworks, systemNetworks, relations, bidirectionalRelations, trainingHistory, stats } = networkState;
    
    // Yeni ağları ve ilişkileri oluştur
    const newUserNetworks = [...userNetworks];
    const newSystemNetworks = [...systemNetworks];
    const newRelations = [...relations];
    const newBidirectionalRelations = [...bidirectionalRelations];
    
    // Kelime pozisyonlarını takip et
    const existingUserNodes = new Map<string, { node: NetworkNode, layer: number, row: number, col: number }>();
    const existingSystemNodes = new Map<string, { node: NetworkNode, layer: number, row: number, col: number }>();
    
    // Mevcut düğüm pozisyonlarını kopyala
    for (let layer = 0; layer < newUserNetworks.length; layer++) {
      for (let row = 0; row < newUserNetworks[layer].length; row++) {
        for (let col = 0; col < newUserNetworks[layer][0].length; col++) {
          const node = newUserNetworks[layer][row][col];
          if (node) {
            existingUserNodes.set(node.id, { node, layer, row, col });
          }
        }
      }
    }
    
    for (let layer = 0; layer < newSystemNetworks.length; layer++) {
      for (let row = 0; row < newSystemNetworks[layer].length; row++) {
        for (let col = 0; col < newSystemNetworks[layer][0].length; col++) {
          const node = newSystemNetworks[layer][row][col];
          if (node) {
            existingSystemNodes.set(node.id, { node, layer, row, col });
          }
        }
      }
    }
    
    // Kullanıcı girdisini kelimelere ayır
    const userWords = cleanUserInput.split(/\s+/).filter(word => word.length > 1);
    
    // Sistem çıktısını kelimelere ayır
    const systemWords = cleanSystemOutput.split(/\s+/).filter(word => word.length > 1);
    
    // Kullanıcı kelimelerini ağa ekle
    let previousUserWord: string | undefined = undefined;
    for (let i = 0; i < userWords.length; i++) {
      const word = userWords[i];
      const layer = Math.min(newUserNetworks.length - 1, Math.floor(i / 6));
      
      const addedNode = addWordToNetwork(
        word,
        newUserNetworks,
        layer,
        existingUserNodes,
        previousUserWord
      );
      
      if (addedNode) {
        previousUserWord = word;
      }
    }
    
    // Sistem kelimelerini ağa ekle
    let previousSystemWord: string | undefined = undefined;
    for (let i = 0; i < systemWords.length; i++) {
      const word = systemWords[i];
      const layer = Math.min(newSystemNetworks.length - 1, Math.floor(i / 6));
      
      const addedNode = addWordToNetwork(
        word,
        newSystemNetworks,
        layer,
        existingSystemNodes,
        previousSystemWord
      );
      
      if (addedNode) {
        previousSystemWord = word;
      }
    }
    
    // Kelimeler arası ilişkileri oluştur
    for (const userWord of userWords) {
      for (const systemWord of systemWords) {
        // Mevcut ilişkiyi kontrol et
        const existingRelation = relations.find(rel => 
          rel.userWord.toLowerCase() === userWord.toLowerCase() && 
          rel.systemWord.toLowerCase() === systemWord.toLowerCase()
        );
        
        // İlişki güçlendirme katsayısı
        const strengthFactor = 10;
        
        if (existingRelation) {
          // Mevcut ilişkiyi güçlendir
          const updatedRelation = reinforceRelation(existingRelation, strengthFactor);
          
          // İlişkiyi güncelle
          const relationIndex = newRelations.findIndex(rel => rel.id === existingRelation.id);
          if (relationIndex !== -1) {
            newRelations[relationIndex] = updatedRelation;
          }
        } else {
          // Yeni ilişki oluştur
          const newRelation = createRelation(
            userWord,
            systemWord,
            MIN_RELATION_SCORE, // Başlangıç bağımlılık değeri
            MIN_RELATION_SCORE, // Başlangıç ilişki değeri
            1,             // Başlangıç sıklık değeri
            userWords.indexOf(userWord), // Kullanıcı kelimesinin sırası
            0,             // Başlangıç geri bildirim değeri
            false,         // Varsayılan olarak tek yönlü
            [],            // Boş bağlam
            'semantic'     // Varsayılan olarak anlamsal ilişki
          );
          
          newRelations.push(newRelation);
        }
        
        // Çift yönlü ilişki oluştur (belirli bir olasılıkla)
        if (Math.random() > 0.7) {
          const existingBiRelation = bidirectionalRelations.find(rel => 
            (rel.userWord.toLowerCase() === userWord.toLowerCase() && 
             rel.systemWord.toLowerCase() === systemWord.toLowerCase()) ||
            (rel.userWord.toLowerCase() === systemWord.toLowerCase() && 
             rel.systemWord.toLowerCase() === userWord.toLowerCase())
          );
          
          if (existingBiRelation) {
            // Mevcut ilişkiyi güçlendir
            const updatedRelation = reinforceRelation(existingBiRelation, strengthFactor / 2);
            
            // İlişkiyi güncelle
            const relationIndex = newBidirectionalRelations.findIndex(rel => rel.id === existingBiRelation.id);
            if (relationIndex !== -1) {
              newBidirectionalRelations[relationIndex] = updatedRelation;
            }
          } else {
            // Yeni çift yönlü ilişki oluştur
            const newBiRelation = createRelation(
              userWord,
              systemWord,
              MIN_RELATION_SCORE - 10, // Daha düşük bağımlılık değeri
              MIN_RELATION_SCORE - 5,  // Daha düşük ilişki değeri
              1,                  // Başlangıç sıklık değeri
              userWords.indexOf(userWord), // Kullanıcı kelimesinin sırası
              0,                  // Başlangıç geri bildirim değeri
              true,               // Çift yönlü
              [],                 // Boş bağlam
              'semantic'          // Varsayılan olarak anlamsal ilişki
            );
            
            newBidirectionalRelations.push(newBiRelation);
          }
        }
      }
    }
    
    // Eğitim geçmişine ekle
    const trainingPair: TrainingPair = {
      id: uuidv4(),
      input: cleanUserInput,
      output: cleanSystemOutput,
      timestamp: Date.now(),
      usageCount: 0,
      category: 'general'
    };
    
    const newTrainingHistory = [...trainingHistory, trainingPair];
    
    // İstatistikleri güncelle
    const newStats = {
      nodeCount: (
        Array.from(existingUserNodes.values()).length + 
        Array.from(existingSystemNodes.values()).length
      ),
      relationCount: newRelations.length + newBidirectionalRelations.length,
      trainingCount: newTrainingHistory.length,
      lastTraining: Date.now()
    };
    
    // Düğüm pozisyonlarını güncelle
    updateNodePositions(newUserNetworks, newSystemNetworks);
    
    // Ağ durumunu güncelle
    setNetworkState({
      userNetworks: newUserNetworks,
      systemNetworks: newSystemNetworks,
      relations: newRelations,
      bidirectionalRelations: newBidirectionalRelations,
      trainingHistory: newTrainingHistory,
      activatedNodes: [],
      stats: newStats
    });
    
  }, [networkState, nodePositions]);
  
  // Kullanıcı girdisini işle ve yanıt oluştur
  const processUserInput = useCallback(async (userInput: string): Promise<{ response: string; confidence: number }> => {
    const { userNetworks, systemNetworks, relations, trainingHistory } = networkState;
    
    // Önce tersine düşünme modelini kontrol et
    // "Ankara nedir?" gibi sorular için özel işlem
    const reverseAnswer = findReverseAnswer(userInput, trainingHistory);
    if (reverseAnswer) {
      console.log("Tersine düşünme sonucu bulundu:", reverseAnswer.response);
      
      // İlişkileri güçlendir (öğrenmeyi teşvik et)
      const questionType = determineQuestionType(userInput);
      if (questionType.type === 'what-is' || questionType.type === 'where-is') {
        // Gelecekteki öğrenmeler için tersine ilişkiyi pekiştir
        try {
          // İlgili trainingPair'i bul
          const relatedPair = trainingHistory.find(
            pair => pair.output.toLowerCase().includes(questionType.subject.toLowerCase())
          );
          
          if (relatedPair) {
            console.log(`Otomatik tersine eğitim: "${reverseAnswer.response}" -> "${questionType.subject}"`);
            // Güçlü ilişkiyi kaydet
            updateBidirectionalRelations(relatedPair.input, relatedPair.output, 0.8);
          }
        } catch (e) {
          console.error("Tersine ilişki pekiştirme hatası:", e);
        }
      }
      
      return {
        response: reverseAnswer.response,
        confidence: reverseAnswer.confidence
      };
    }
    
    // Normal yanıt oluşturma işlemi
    // Aktivasyon sonucunu al
    const activationResult = propagateActivation(
      userNetworks, 
      systemNetworks, 
      [...relations], 
      userInput
    );
    
    // Aktivasyon yolunu kaydet
    const activatedNodePositions = activationResult.activationPath.map(path => ({
      layer: path.layer,
      row: path.row,
      col: path.col,
      type: path.type
    }));
    
    // Yanıt oluştur
    // Aktivasyon sonucu kullanarak yanıt üretme
    const responseResult = await generateResponse(
      activationResult,
      trainingHistory,
      userInput // Recentconversation parametresi olarak kullanıcı girdisi
    );
    
    // Aktif düğümleri güncelle
    setNetworkState(prev => ({
      ...prev,
      activatedNodes: activatedNodePositions
    }));
    
    // Yanıtı kullanıldıysa ilişkileri güçlendir
    if (responseResult.usedTraining) {
      const pair = responseResult.usedTraining;
      // console.log satırını kaldırdık - çift loglama sorununu çözmek için
      
      // İlişkileri güçlendir
      updateRelations(pair.input, pair.output, 0.2);
    }
    
    return {
      response: responseResult.response,
      confidence: responseResult.confidence
    };
  }, [networkState]);
  
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
  
  // Toplu eğitim için özel fonksiyon - tüm öğeleri tek seferde işler
  const batchTrainNetworkItems = useCallback(async (items: Array<{ input: string, output: string }>) => {
    if (!items || items.length === 0) return;
    
    // Mevcut ağları al
    const { userNetworks, systemNetworks, relations, bidirectionalRelations, trainingHistory, stats } = networkState;
    
    // Yeni ağları ve ilişkileri oluştur
    const newUserNetworks = [...userNetworks];
    const newSystemNetworks = [...systemNetworks];
    const newRelations = [...relations];
    const newBidirectionalRelations = [...bidirectionalRelations];
    const newTrainingHistory = [...trainingHistory];
    
    // Kelime pozisyonlarını takip et
    const existingUserNodes = new Map<string, { node: NetworkNode, layer: number, row: number, col: number }>();
    const existingSystemNodes = new Map<string, { node: NetworkNode, layer: number, row: number, col: number }>();
    
    // Mevcut düğüm pozisyonlarını kopyala
    for (let layer = 0; layer < newUserNetworks.length; layer++) {
      for (let row = 0; row < newUserNetworks[layer].length; row++) {
        for (let col = 0; col < newUserNetworks[layer][0].length; col++) {
          const node = newUserNetworks[layer][row][col];
          if (node) {
            existingUserNodes.set(node.id, { node, layer, row, col });
          }
        }
      }
    }
    
    for (let layer = 0; layer < newSystemNetworks.length; layer++) {
      for (let row = 0; row < newSystemNetworks[layer].length; row++) {
        for (let col = 0; col < newSystemNetworks[layer][0].length; col++) {
          const node = newSystemNetworks[layer][row][col];
          if (node) {
            existingSystemNodes.set(node.id, { node, layer, row, col });
          }
        }
      }
    }
    
    console.log(`Toplu eğitim başlatılıyor, ${items.length} öğe işlenecek...`);
    
    // Tüm eğitim öğelerini işle
    for (const item of items) {
      // Girdileri temizle
      const cleanUserInput = item.input.trim();
      
      // Çıktıdaki "Bu konuyla ilgili bildiğim" ifadelerini tekrarlı olarak temizle
      let cleanSystemOutput = item.output.trim();
      let hasChanged = true;
      while (hasChanged) {
        const originalOutput = cleanSystemOutput;
        cleanSystemOutput = cleanSystemOutput.replace(/Bu konuyla ilgili bildiğim[:]*\s*/g, '')
                                          .replace(/Bu konuda bildiğim[:]*\s*/g, '')
                                          .replace(/^"(.+)"$/g, '$1')
                                          .trim();
        
        // Değişim olmazsa döngüden çık
        hasChanged = originalOutput !== cleanSystemOutput;
      }
      
      if (!cleanUserInput || !cleanSystemOutput) {
        console.log(`Boş öğe atlanıyor: "${item.input}" => "${item.output}"`);
        continue;
      }
      
      console.log(`İşleniyor: "${cleanUserInput}" => "${cleanSystemOutput}"`);
      
      // Kullanıcı girdisini kelimelere ayır
      const userWords = cleanUserInput.split(/\s+/).filter(word => word.length > 1);
      
      // Sistem çıktısını kelimelere ayır
      const systemWords = cleanSystemOutput.split(/\s+/).filter(word => word.length > 1);
      
      // Kullanıcı kelimelerini ağa ekle
      let previousUserWord: string | undefined = undefined;
      for (let i = 0; i < userWords.length; i++) {
        const word = userWords[i];
        const layer = Math.min(newUserNetworks.length - 1, Math.floor(i / 6));
        
        const addedNode = addWordToNetwork(
          word,
          newUserNetworks,
          layer,
          existingUserNodes,
          previousUserWord
        );
        
        if (addedNode) {
          previousUserWord = word;
        }
      }
      
      // Sistem kelimelerini ağa ekle
      let previousSystemWord: string | undefined = undefined;
      for (let i = 0; i < systemWords.length; i++) {
        const word = systemWords[i];
        const layer = Math.min(newSystemNetworks.length - 1, Math.floor(i / 6));
        
        const addedNode = addWordToNetwork(
          word,
          newSystemNetworks,
          layer,
          existingSystemNodes,
          previousSystemWord
        );
        
        if (addedNode) {
          previousSystemWord = word;
        }
      }
      
      // Kullanıcı-sistem ilişkisi oluştur
      if (userWords.length > 0 && systemWords.length > 0) {
        for (const userWord of userWords) {
          for (const systemWord of systemWords) {
            // Önemli kelimeler arasında ilişki oluştur
            if (
              userWord.length > 2 &&
              systemWord.length > 2 &&
              !userWord.match(/^[0-9]+$/) &&
              !systemWord.match(/^[0-9]+$/)
            ) {
              // Yeni ilişki oluştur
              const relation = createRelation(userWord, systemWord);
              
              // İlişki zaten var mı kontrol et
              const existingRelationIndex = newRelations.findIndex(
                r => r.userWord === userWord && r.systemWord === systemWord
              );
              
              if (existingRelationIndex >= 0) {
                // İlişkiyi güçlendir
                newRelations[existingRelationIndex] = reinforceRelation(
                  newRelations[existingRelationIndex],
                  0.2
                );
              } else {
                // Yeni ilişki ekle
                newRelations.push(relation);
              }
              
              // İki yönlü ilişkiler için benzer işlem
              if (Math.random() < 0.3) { // Bazı durumlar için iki yönlü ilişki oluştur
                // Parametreler doğru sırada olmalı: userWord, systemWord, dependency, association, frequency, order, feedback, bidirectional
                const biRelation = createRelation(systemWord, userWord, 50, 50, 1, 1, 0, true);
                
                const existingBiRelationIndex = newBidirectionalRelations.findIndex(
                  r => r.userWord === systemWord && r.systemWord === userWord
                );
                
                if (existingBiRelationIndex >= 0) {
                  newBidirectionalRelations[existingBiRelationIndex] = reinforceRelation(
                    newBidirectionalRelations[existingBiRelationIndex],
                    0.1
                  );
                } else {
                  newBidirectionalRelations.push(biRelation);
                }
              }
            }
          }
        }
      }
      
      // Eğitim geçmişine ekle
      const trainingPair: TrainingPair = {
        id: uuidv4(),
        input: cleanUserInput,
        output: cleanSystemOutput,
        timestamp: Date.now(),
        usageCount: 0,
        category: 'general'
      };
      
      newTrainingHistory.push(trainingPair);
    }
    
    console.log(`Toplu eğitim tamamlandı, ağ güncelleniyor...`);
    
    // İstatistikleri güncelle
    const newStats = {
      nodeCount: (
        Array.from(existingUserNodes.values()).length + 
        Array.from(existingSystemNodes.values()).length
      ),
      relationCount: newRelations.length + newBidirectionalRelations.length,
      trainingCount: newTrainingHistory.length,
      lastTraining: Date.now()
    };
    
    // Düğüm pozisyonlarını güncelle
    updateNodePositions(newUserNetworks, newSystemNetworks);
    
    // Ağ durumunu TEK SEFERDE güncelle
    setNetworkState({
      userNetworks: newUserNetworks,
      systemNetworks: newSystemNetworks,
      relations: newRelations,
      bidirectionalRelations: newBidirectionalRelations,
      trainingHistory: newTrainingHistory,
      activatedNodes: [],
      stats: newStats
    });
    
    console.log(`Toplu eğitim tamamlandı, ${items.length} öğe işlendi.`);
    console.log(`Yeni düğüm sayısı: ${newStats.nodeCount}, Yeni ilişki sayısı: ${newStats.relationCount}`);
    
  }, [networkState]);

  return {
    userNetworks: networkState.userNetworks,
    systemNetworks: networkState.systemNetworks,
    relations: networkState.relations,
    bidirectionalRelations: networkState.bidirectionalRelations,
    trainingHistory: networkState.trainingHistory,
    activatedNodes: networkState.activatedNodes,
    trainNetwork,
    batchTrainNetworkItems, // Yeni toplu eğitim fonksiyonu
    processUserInput,
    refreshNetwork,
    getNetworkStats
  };
}
