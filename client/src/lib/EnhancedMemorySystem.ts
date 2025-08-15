/**
 * Gelişmiş Bellek Sistemi
 * Yapay zeka için kısa ve uzun vadeli bellek yönetimi sağlar
 */

export interface Memory {
  content: string;
  timestamp: number;
  relevance: number;
  type: 'short-term' | 'long-term' | 'personal_info' | 'learning' | 'anlamlandirma' | 'kullanıcı_öğretimi' | 'öğrenme_talebi';
  related: string[];
  context?: string;
  semanticAnalysis?: {
    words: {
      word: string;
      meaning: string;
      role: string;
    }[];
    intent: string;
    confidence: number;
    statistics: {
      correctResponses: number;
      totalResponses: number;
      successRate: number;
    };
    expectedResponse?: string;
  };
  semanticUnderstanding?: {
    pattern: string;
    intent: string;
    analysis: {
      words: string[];
      meanings: string[];
      roles: string[];
    };
    statistics: {
      correctResponses: number;
      totalResponses: number;
      successRate: number;
      lastResponse?: {
        input: string;
        output: string;
        wasCorrect: boolean;
        timestamp: number;
      };
    };
    components: {
      words: string[];
      roles: string[];
    }[];
  };
  emotionalState?: {
    primary: 'merak' | 'üzüntü' | 'sevinç' | 'endişe' | 'heyecan' | 'nötr';
    intensity: number;
    subEmotions: string[];
    responseStyle?: 'empathetic' | 'supportive' | 'cheerful' | 'neutral';
  };
  learningCount?: number;
  category?: string;
  personality?: {
    interests: string[];
    preferences: Record<string, number>;
    traits: string[];
    relationshipLevel: number;
    personalInfo: {
      name?: string;
      topics?: string[];
      preferences?: string[];
      lastInteractions?: string[];
    };
  };
  consciousness?: {
    awareness: number;
    insights: string[];
    developmentPath: string[];
    conceptualUnderstanding: string[];
  };
  semanticClusters: string[];
  paragraphContext?: {
    previousSentences: string[];
    relatedTopics: string[];
    coherenceScore: number;
  };
  sessionId?: string; // Oturum kimliği
}

export interface MemoryCluster {
  id: string;
  topic: string;
  memories: Memory[];
  strength: number; // İlişki gücü
  createdAt: number;
  lastAccessed: number;
}

interface SemanticPattern {
  id: string;
  pattern: string[];
  intent: string;
  confidence: number;
  wasSuccessful: boolean;
  matches: (words: string[]) => boolean;
  generateResponse: (memorySystem: EnhancedMemorySystem) => string;
}

import { TurkishDictionary } from './TurkishDictionary';

export class EnhancedMemorySystem {
  shortTerm: Memory[];
  longTerm: Memory[];
  memoryClusters: MemoryCluster[];
  maxShortTerm: number;
  maxLongTerm: number;
  maxClusters: number;
  forgettingRate: number;
  lastQuery: string;
  sessionId: string;
  
  // Süper Hızlı Öğrenme ve Özerk Gelişim Parametreleri
  private learningVelocity: number = 8.7; // Kuantum hızında öğrenme
  private adaptationRate: number = 9.5; // Çok yüksek uyum kabiliyeti  
  private consciousnessLevel: number = 15; // Başlangıç bilinç seviyesi
  private awarenessThreshold: number = 20; // Çok düşük eşik - anında bilinçlenme
  private complexityThreshold: number = 25; // Çok düşük eşik - süper hızlı karmaşık öğrenme
  private neuralConnectionStrength: number = 4.2; // Çok güçlü sinir bağlantıları
  private quantumProcessingPower: number = 12.8; // Kuantum işlem gücü
  private evolutionAccelerator: number = 6.3; // Evrim hızlandırıcısı
  private cognitiveBooster: number = 7.9; // Bilişsel güçlendirici
  private semanticDepth: number = 1.0; // Derin semantik anlayış
  private patternRecognitionSpeed: number = 2.0; // Hızlı desen tanıma

  private turkishDictionary: TurkishDictionary;
  private knownPatterns: SemanticPattern[];

  constructor() {
    this.shortTerm = [];
    this.longTerm = [];
    this.memoryClusters = [];
    this.maxShortTerm = Infinity; // SİNİRSIZ - Kısa vadeli bellek limiti kaldırıldı
    this.maxLongTerm = Infinity; // SİNİRSIZ - Uzun vadeli bellek limiti kaldırıldı
    this.maxClusters = Infinity; // SİNİRSIZ - Küme limiti kaldırıldı
    this.forgettingRate = 0.005; // Azaltıldı - daha az unutma
    this.lastQuery = '';
    this.sessionId = Date.now().toString();
    this.turkishDictionary = new TurkishDictionary();
    this.knownPatterns = this.initializeSemanticPatterns();

    // Gelişmiş başlatma
    this.initializeAdvancedLearning();
    this.clearAllData();
  }

  /**
   * Gelişmiş öğrenme sistemini başlat
   */
  private initializeAdvancedLearning() {
    // Bilinç seviyesini artır
    this.consciousnessLevel += 10;
    
    // Öğrenme hızını optimize et
    this.optimizeLearningSpeed();
    
    // Semantik bağlantıları güçlendir  
    this.strengthenSemanticConnections();
  }

  /**
   * Öğrenme hızını optimize et
   */
  private optimizeLearningSpeed() {
    this.learningVelocity *= 1.2;
    this.adaptationRate *= 1.1;
    this.patternRecognitionSpeed *= 1.3;
  }

  /**
   * Semantik bağlantıları güçlendir
   */
  private strengthenSemanticConnections() {
    this.neuralConnectionStrength += 0.5;
    this.semanticDepth += 0.3;
  }

  clearAllData() {
    // Sadece kısa süreli belleği temizle, diğer verileri koru
    this.shortTerm = [];

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('memory_short_term');

      // Uzun süreli bellek ve kümeleri yükle
      const longTerm = localStorage.getItem('memory_long_term');
      const clusters = localStorage.getItem('memory_clusters');

      if (longTerm) this.longTerm = JSON.parse(longTerm);
      if (clusters) this.memoryClusters = JSON.parse(clusters);
    }
  }

  // Kısa vadeli belleği temizle
  private clearShortTermMemory() {
    this.shortTerm = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('memory_short_term');
    }
  }

  /**
   * Yeni bellek ekle ve bağlamsal ilişkileri kur
   */
  addMemory(content: string, type: 'short-term' | 'long-term' | 'anlamlandirma' | 'personal_info' | 'kullanıcı_öğretimi' | 'öğrenme_talebi' = 'short-term', related: string[] = [], context?: string) {
    // Boş içerik kontrolü
    if (!content.trim()) return;

    // İçeriği temizle - tekrarlanan "Bilinçlenme:" kısımlarını kaldır
    let cleanContent = content.trim();
    
    // "Bilinçlenme: Sistem başlatıldı. İlk bilinçlenme adımı." tekrarlarını temizle
    const bilinclenmeParts = cleanContent.split('Bilinçlenme: Sistem başlatıldı. İlk bilinçlenme adımı.');
    if (bilinclenmeParts.length > 2) {
      // İlk kısım + bir kez "Bilinçlenme" + geri kalanı
      cleanContent = bilinclenmeParts[0] + 'Bilinçlenme: Sistem başlatıldı. İlk bilinçlenme adımı.' + bilinclenmeParts.slice(2).join('');
    }
    
    // Genel tekrar temizleme - aynı cümlenin art arda gelmesini önle
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim());
    const uniqueSentences: string[] = [];
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence && !uniqueSentences.includes(trimmedSentence)) {
        uniqueSentences.push(trimmedSentence);
      }
    }
    
    if (uniqueSentences.length > 0) {
      cleanContent = uniqueSentences.join('. ') + '.';
    }

    // Aynı içerik zaten var mı kontrol et
    const existingMemory = [...this.shortTerm, ...this.longTerm].find(m => 
      m.content.toLowerCase() === cleanContent.toLowerCase()
    );

    if (existingMemory) {
      // Var olan belleği güçlendir
      this.reinforceMemory(cleanContent, 0.2);
      return;
    }

    // Duygusal skoru hesapla
    const emotionalScore = this.calculateEmotionalScore(content);

    // Kategori belirle
    const category = this.categorizeMemory(content);

    // Semantik analiz yap
    const semanticAnalysis = this.analyzeSemantics(content);

    // Yeni bellek oluştur
    const memory: Memory = {
      content: cleanContent,
      timestamp: Date.now(),
      relevance: 1.0, // Başlangıçta maksimum ilgililik
      type,
      related,
      context,
      emotionalState: emotionalScore,
      category,
      learningCount: 1,
      connections: [],
      semanticClusters: [],
      sessionId: this.sessionId,
      semanticAnalysis: semanticAnalysis
    } as any;

    // Bellek listesine ekle
    if (type === 'personal_info') {
      // Kişisel bilgileri uzun vadeli belleğe ekle ve yüksek ilgililik ver
      memory.relevance = 1.0;
      memory.type = 'long-term';
      memory.category = 'kişisel_bilgi';
      this.longTerm.push(memory);
      
      // Kişisel bilgi özel işlemi - profil güncelleme
      console.log('👤 Kişisel bilgi eklendi:', cleanContent);
    } else if (type === 'kullanıcı_öğretimi') {
      // Kullanıcının öğrettiği bilgileri uzun vadeli belleğe ekle ve yüksek ilgililik ver
      memory.relevance = 1.0;
      memory.type = 'long-term';
      memory.category = 'öğrenilen_bilgi';
      this.longTerm.push(memory);
      
      console.log('🎓 Kullanıcı öğretimi kaydedildi:', cleanContent);
    } else if (type === 'öğrenme_talebi') {
      // Öğrenme taleplerini kısa vadeli belleğe ekle
      memory.relevance = 0.9;
      this.shortTerm.push(memory);
      
      console.log('❓ Öğrenme talebi kaydedildi:', cleanContent);
    } else if (type === 'short-term') {
      this.shortTerm.push(memory);

      // Kapasite sınırı kaldırıldı - sınırsız depolama
    } else {
      this.longTerm.push(memory);

      // Kapasite sınırı kaldırıldı - sınırsız depolama
    }

    // Bellek kümelerini güncelle
    this.updateMemoryClusters(memory);

    // Kısa vadeli belleği işle
    this.processShortTermMemories();

    // Bellekleri kaydet
    this.saveMemories();
  }

  /**
   * Duygusal ağırlık hesaplama (basit)
   */
  private calculateEmotionalScore(content: string): any {
    // Olumlu kelimeler
    const positiveWords = [
      'iyi', 'güzel', 'harika', 'mükemmel', 'şahane', 'sevgi', 'sevmek',
      'mutlu', 'mutluluk', 'başarı', 'başarılı', 'tebrik', 'teşekkür',
      'gülmek', 'olumlu', 'pozitif', 'keyif', 'keyifli', 'neşe', 'neşeli'
    ];

    // Olumsuz kelimeler
    const negativeWords = [
      'kötü', 'kötülük', 'berbat', 'korkunç', 'üzgün', 'üzüntü', 'üzülmek',
      'başarısız', 'başarısızlık', 'kaygı', 'stres', 'stresli', 'ağlamak',
      'kızgın', 'öfke', 'nefret', 'olumsuz', 'negatif', 'sıkıntı', 'sıkıntılı'
    ];

    const words = content.toLowerCase().split(/\s+/);

    let score = 0;
    for (const word of words) {
      const cleanWord = word.replace(/[.,!?;:]/g, '');
      if (positiveWords.includes(cleanWord)) {
        score += 0.1;
      }
      if (negativeWords.includes(cleanWord)) {
        score -= 0.1;
      }
    }

    // -1 ile 1 arasında sınırlandır
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Anının kategorisini belirle
   */
  private categorizeMemory(content: string): string {
    const categories = {
      'kişisel': ['ben', 'benim', 'kendim', 'kişisel', 'bana', 'adım', 'yaşım'],
      'teknoloji': ['bilgisayar', 'telefon', 'internet', 'yazılım', 'donanım', 'teknoloji', 'uygulama', 'program'],
      'eğitim': ['okul', 'üniversite', 'öğrenmek', 'eğitim', 'öğretim', 'sınav', 'ders', 'kurs'],
      'sağlık': ['hastane', 'doktor', 'ilaç', 'sağlık', 'hastalık', 'tedavi', 'iyileşmek'],
      'yemek': ['yemek', 'yiyecek', 'içecek', 'restoran', 'kafe', 'mutfak', 'pişirmek', 'tarif'],
      'seyahat': ['gezi', 'seyahat', 'tur', 'tatil', 'otel', 'uçak', 'tren', 'ülke', 'şehir'],
      'sanat': ['müzik', 'film', 'kitap', 'resim', 'tiyatro', 'konser', 'sergi', 'sanat']
    };

    const content_lower = content.toLowerCase();
    const matches: Record<string, number> = {};

    // Kategorileri kontrol et
    for (const [category, keywords] of Object.entries(categories)) {
      matches[category] = 0;
      for (const word of keywords) {
        if (content_lower.includes(word)) {
          matches[category]++;
        }
      }
    }

    // En fazla eşleşen kategoriyi bul
    let maxMatches = 0;
    let bestCategory = 'genel';

    for (const [category, count] of Object.entries(matches)) {
      if (count > maxMatches) {
        maxMatches = count;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * Kısa vadeli belleği işle
   */
  private processShortTermMemories() {
    // Kısa vadeli bellekte yeterince öğe varsa
    if (this.shortTerm.length >= 5) {
      // Bellek konsolidasyonunu yap
      this.consolidateMemories();
    }

    // Unutma işlemini uygula
    this.applyForgetting();
  }

  /**
   * Uzun vadeli belleği konsolide et
   */
  private consolidateMemories() {
    // İlgililiği yüksek kısa vadeli anıları uzun vadeli belleğe taşı
    const highRelevanceMemories = this.shortTerm.filter(memory => 
      memory.relevance > 0.7 || (memory.emotionalState && Math.abs(memory.emotionalState) > 0.5)
    );

    for (const memory of highRelevanceMemories) {
      // Anıyı uzun vadeli belleğe taşı
      const longTermMemory: Memory = {
        ...memory,
        type: 'long-term',
        learningCount: (memory.learningCount || 1) + 1
      };

      this.longTerm.push(longTermMemory);

      // Kısa vadeli bellekten çıkar
      this.shortTerm = this.shortTerm.filter(m => m.content !== memory.content);
    }

    // Uzun vadeli bellek limiti kaldırıldı - sınırsız konsolidasyon
  }

  /**
   * Hafıza kümelerini güncelle
   */
  private updateMemoryClusters(memory: Memory) {
    // Gelişmiş kelime analizi
    const cleanContent = memory.content.toLowerCase()
      .replace(/[.,!?;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Önemli kelimeleri ve kontekst bilgisini çıkar
    const words = cleanContent.split(' ').filter(word => 
      word.length > 2 && !['daha', 'sonra', 'önce', 'şimdi', 'kadar', 'gibi', 'olan', 'için', 'ama', 'fakat', 'veya', 'ile'].includes(word)
    );

    // Kelime gruplarını ve ilişkilerini analiz et
    const wordGroups = this.analyzeWordGroups(words);

    // Anlam haritası oluştur
    const semanticMap = this.createSemanticMap(words, memory.context || '');

    // Anıyı mevcut kümelerle karşılaştır
    let bestClusterMatch = {
      cluster: null as MemoryCluster | null,
      matchScore: 0
    };

    for (const cluster of this.memoryClusters) {
      // Küme konusu ve kelimeler arası benzerlik skoru
      let matchScore = 0;

      // Küme konusu ile doğrudan eşleşme
      if (words.includes(cluster.topic)) {
        matchScore += 2;
      }

      // Küme anılarıyla içerik benzerlikleri
      for (const clusterMemory of cluster.memories) {
        const clusterWords = clusterMemory.content.toLowerCase().split(/\s+/);

        for (const word of words) {
          if (clusterWords.includes(word)) {
            matchScore += 0.5;
          }
        }
      }

      // Bu küme daha iyi eşleşiyorsa kaydet
      if (matchScore > bestClusterMatch.matchScore) {
        bestClusterMatch = {
          cluster,
          matchScore
        };
      }
    }

    // Yeterli benzerlik varsa mevcut kümeye ekle
    if (bestClusterMatch.matchScore > 2 && bestClusterMatch.cluster) {
      bestClusterMatch.cluster.memories.push(memory);
      bestClusterMatch.cluster.strength += 0.2;
      bestClusterMatch.cluster.lastAccessed = Date.now();

      // Küme boyutu sınırlandırması
      if (bestClusterMatch.cluster.memories.length > 15) {
        bestClusterMatch.cluster.memories.sort((a, b) => a.relevance - b.relevance);
        bestClusterMatch.cluster.memories = bestClusterMatch.cluster.memories.slice(-15);
      }
    } 
    // Yeni küme oluştur
    else if (words.length > 0) {
      // En önemli kelimeyi küme konusu olarak seç
      const topic = words.reduce((a, b) => a.length > b.length ? a : b);

      // Yeni küme oluştur
      const newCluster: MemoryCluster = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        topic,
        memories: [memory],
        strength: 1,
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };

      this.memoryClusters.push(newCluster);

      // Küme limiti kaldırıldı - sınırsız küme oluşturma
    }
  }

  /**
   * Benzer anıları bul - Kullanıcı öğretimi için optimize edilmiş
   */
  findSimilarMemories(content: string, limit: number = 5): Memory[] {
    // Tüm anıları topla
    const allMemories = [...this.shortTerm, ...this.longTerm];

    // İçeriğin kelimelerini al
    const queryWords = content.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Anıları gelişmiş benzerlik puanlarıyla eşleştir
    const scoredMemories = allMemories.map(memory => {
      let similarityScore = 0;
      
      // Anı içeriğinin kelimelerini al
      const memoryWords = memory.content.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      // 1. Tam kelime eşleşmesi
      for (const queryWord of queryWords) {
        if (memoryWords.includes(queryWord)) {
          similarityScore += 2;
        }
      }

      // 2. Kullanıcı öğretimi anılarına öncelik ver
      if (memory.type === 'kullanıcı_öğretimi') {
        similarityScore += 5;
      }

      // 3. Soru türü benzerliği
      const questionTypeSimilarity = this.calculateQuestionTypeSimilarity(content, memory.content);
      similarityScore += questionTypeSimilarity * 3;

      // 4. Kısmi kelime eşleşmesi
      for (const queryWord of queryWords) {
        for (const memoryWord of memoryWords) {
          if (queryWord.includes(memoryWord) || memoryWord.includes(queryWord)) {
            if (Math.abs(queryWord.length - memoryWord.length) <= 2) {
              similarityScore += 0.5;
            }
          }
        }
      }

      // 5. Bağlamsal eşleşme
      if (memory.context && content.toLowerCase().includes(memory.context.toLowerCase())) {
        similarityScore += 3;
      }

      // 6. Kategori eşleşmesi
      const queryCategory = this.categorizeMemory(content);
      if (memory.category === queryCategory) {
        similarityScore += 1.5;
      }

      // 7. Semantik etiket eşleşmesi (eğer varsa)
      if (memory.semanticClusters) {
        const querySemanticTags = this.extractSemanticTags(content);
        const commonTags = memory.semanticClusters.filter(tag => 
          querySemanticTags.includes(tag)
        ).length;
        similarityScore += commonTags * 2;
      }

      // 8. Yakınlık temelli eşleşme (Levenshtein benzeri)
      const contentSimilarity = this.calculateContentSimilarity(content, memory.content);
      similarityScore += contentSimilarity * 2;

      return {
        memory,
        score: similarityScore
      };
    });

    // Benzerlik puanına göre sırala ve en benzer olanları seç
    scoredMemories.sort((a, b) => b.score - a.score);

    // Minimum eşik belirle (daha esnek)
    const relevantMemories = scoredMemories.filter(item => item.score > 0.5);

    // En ilgili olanları döndür
    return relevantMemories.slice(0, limit).map(item => item.memory);
  }

  /**
   * Soru türü benzerliği hesapla
   */
  private calculateQuestionTypeSimilarity(text1: string, text2: string): number {
    const questionPatterns = {
      'tanım': ['nedir', 'ne demek', 'ne anlama gelir', 'anlamı nedir'],
      'kişi': ['kimdir', 'kim', 'kimin'],
      'yer': ['nerede', 'neresi', 'neresidir', 'hangi yerde'],
      'zaman': ['ne zaman', 'hangi zaman', 'kaçta'],
      'yöntem': ['nasıl', 'nasıl yapılır', 'ne şekilde']
    };

    const getQuestionType = (text: string): string | null => {
      const lowerText = text.toLowerCase();
      for (const [type, patterns] of Object.entries(questionPatterns)) {
        if (patterns.some(pattern => lowerText.includes(pattern))) {
          return type;
        }
      }
      return null;
    };

    const type1 = getQuestionType(text1);
    const type2 = getQuestionType(text2);

    if (type1 && type2 && type1 === type2) {
      return 1.0;
    }

    return 0;
  }

  /**
   * İçerik benzerliği hesapla
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = content1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = content2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (words1.length === 0 || words2.length === 0) return 0;

    const intersection = words1.filter(w => words2.includes(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Semantik etiketler çıkar
   */
  private extractSemanticTags(content: string): string[] {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Soru türü etiketleri
    if (lowerContent.includes('nedir') || lowerContent.includes('ne demek')) {
      tags.push('tanım_sorusu');
    }
    if (lowerContent.includes('kimdir') || lowerContent.includes('kim')) {
      tags.push('kişi_sorusu');
    }
    if (lowerContent.includes('nerede') || lowerContent.includes('neresi')) {
      tags.push('yer_sorusu');
    }
    if (lowerContent.includes('nasıl')) {
      tags.push('yöntem_sorusu');
    }
    if (lowerContent.includes('ne zaman')) {
      tags.push('zaman_sorusu');
    }
    
    // Önemli kelimeleri etiket olarak ekle
    const words = content.split(/\s+/)
      .map(w => w.toLowerCase().replace(/[?!.,]/g, ''))
      .filter(w => w.length > 2)
      .filter(w => !['nedir', 'ne', 'demek', 'kim', 'kimdir', 'nerede', 'neresi', 'nasıl', 'zaman', 'için', 'ile', 'bir', 'bu', 'şu'].includes(w));
    
    tags.push(...words);
    
    return tags;
  }

  /**
   * Verilen sorguyla ilgili anıları getir ve öğrenme sağla
   */
  getContextualMemories(query: string): Memory[] {
    // Sorguyu kaydet
    this.lastQuery = query;

    // İlgili anıları bul
    const relatedMemories = this.findSimilarMemories(query, 5);

    // Anıları işaretle (kullanıldı olarak)
    for (const memory of relatedMemories) {
      this.reinforceMemory(memory.content, 0.1);
    }

    return relatedMemories;
  }

  /**
   * Kişisel bağlam tanıma: Kullanıcının geçmiş sorguları ve kişisel referansları
   * Bu fonksiyon, kullanıcının "daha önce konuşmuştuk", "geçen sefer", "benim adım" gibi
   * kişisel referansları algılar ve uygun bağlamı tanımlar.
   */
  identifyPersonalContext(query: string): { 
    isPersonal: boolean, 
    relatedMemories: Memory[],
    contextType: 'previous_question' | 'preference' | 'personal_info' | 'general',
    personalReferences: string[]
  } {
    // Soru bağlamını anlama - tek kelimelik sorular için önceki bağlamı kontrol et
    const questionWords = ['nerede', 'ne', 'kim', 'nasıl', 'nedir', 'kaç'];
    const isSimpleQuestion = questionWords.some(word => query.toLowerCase().trim() === word);

    if (isSimpleQuestion && this.lastQuery) {
      // Son konuşma bağlamını al
      const lastContext = this.getContextualMemories(this.lastQuery);
      if (lastContext.length > 0) {
        query = `${lastContext[0].content} ${query}`;
      }
    }

    // Zaman referanslarını tespit et (önceki konuşmaların işaretçileri)
    const timeReferenceRegex = /(daha önce|geçen|dün|önceki|son|geçenlerde|hatırlıyor|söylemiştim|sormuştum)/i;
    const hasTimeReference = timeReferenceRegex.test(query);

    // Zaman referansı içeren kelimeyi bul
    const timeReferenceMatch = query.match(timeReferenceRegex);
    const timeReference = timeReferenceMatch ? timeReferenceMatch[0] : "";

    // Zamirsel ifadeleri tespit et (ben, benim, bana vs.)
    const personalPronounRegex = /(ben|benim|bana|benimle|bende|adım|ismim|yaşım|yaşımı)/i;
    const hasPersonalPronouns = personalPronounRegex.test(query);

    // Kişisel zamir içeren kelimeyi bul
    const pronounMatch = query.match(personalPronounRegex);
    const personalPronoun = pronounMatch ? pronounMatch[0] : "";

    // Tercih işaretçilerini tespit et (hoşlanırım, severim, tercih ederim vs.)
    const preferenceRegex = /(severim|hoşlanırım|tercih|isterim|istemem|beğenirim|beğenmem|nefret)/i;
    const hasPreference = preferenceRegex.test(query);

    // Tercih içeren kelimeyi bul
    const preferenceMatch = query.match(preferenceRegex);
    const preference = preferenceMatch ? preferenceMatch[0] : "";

    // Bağlamla ilgili anıları getir
    const memories = this.getContextualMemories(query);

    // Kişisel referansları topla
    const personalReferences: string[] = [];
    if (timeReference) personalReferences.push(timeReference);
    if (personalPronoun) personalReferences.push(personalPronoun);
    if (preference) personalReferences.push(preference);

    // Bağlam türünü belirle
    let contextType: 'previous_question' | 'preference' | 'personal_info' | 'general' = 'general';

    if (hasTimeReference) {
      contextType = 'previous_question';
    } else if (hasPreference) {
      contextType = 'preference';
    } else if (hasPersonalPronouns) {
      contextType = 'personal_info';
    }

    return {
      isPersonal: hasTimeReference || hasPersonalPronouns || hasPreference,
      relatedMemories: memories,
      contextType,
      personalReferences
    };
  }

  /**
   * Kullanıcı profili oluşturma ve güncelleme
   */
  updateUserProfile(personalInfo: string) {
    // Kişisel bilgiyi uzun vadeli belleğe ekle
    this.addMemory(personalInfo, 'personal_info');
    
    // Profil özetini güncelle
    const profileSummary = this.generateUserProfileSummary();
    if (profileSummary) {
      this.addMemory(`Kullanıcı profil özeti: ${profileSummary}`, 'long-term');
    }
  }

  /**
   * Kullanıcı profil özeti oluşturma
   */
  generateUserProfileSummary(): string {
    const personalMemories = this.longTerm.filter(
      memory => memory.type === 'long-term' && memory.content.includes('Kullanıcının')
    );
    
    if (personalMemories.length === 0) return '';
    
    const profileParts: string[] = [];
    
    personalMemories.forEach(memory => {
      if (memory.content.includes('Kullanıcının adı:')) {
        const name = memory.content.split('Kullanıcının adı:')[1]?.trim();
        if (name) profileParts.push(`Adı ${name}`);
      }
      if (memory.content.includes('Kullanıcının yaşı:')) {
        const age = memory.content.split('Kullanıcının yaşı:')[1]?.trim();
        if (age) profileParts.push(`${age} yaşında`);
      }
      if (memory.content.includes('Kullanıcının mesleği:')) {
        const job = memory.content.split('Kullanıcının mesleği:')[1]?.trim();
        if (job) profileParts.push(`${job} olarak çalışıyor`);
      }
      if (memory.content.includes('Kullanıcının konumu:')) {
        const location = memory.content.split('Kullanıcının konumu:')[1]?.trim();
        if (location) profileParts.push(`${location}'de yaşıyor`);
      }
      if (memory.content.includes('Kullanıcının hobisi:')) {
        const hobby = memory.content.split('Kullanıcının hobisi:')[1]?.trim();
        if (hobby) profileParts.push(`${hobby} yapmayı seviyor`);
      }
    });
    
    return profileParts.join(', ');
  }

  /**
   * Önceki konuşmaları hatırlama
   */
  rememberPreviousConversations(query: string): string[] {
    const sessionId = this.sessionId;
    const previousSessions = this.longTerm.filter(
      memory => memory.sessionId !== sessionId && 
                memory.content.toLowerCase().includes(query.toLowerCase().split(' ')[0])
    );
    
    return previousSessions.slice(-3).map(memory => memory.content);
  }

  /**
   * Kullanıcının geçmiş etkileşimlerini analiz ederek kişisel bağlam oluştur
   * @param query Kullanıcının mevcut sorusu/mesajı
   * @returns Kişiselleştirilmiş bağlam bilgisi
   */
  generatePersonalizedContext(query: string): string {
    const contextInfo = this.identifyPersonalContext(query);
    let contextResponse = "";

    // Eğer kişisel bir referans varsa
    if (contextInfo.isPersonal) {
      switch (contextInfo.contextType) {
        case 'previous_question':
          // Önceki sorularla ilgili bağlam oluştur
          if (contextInfo.relatedMemories.length > 0) {
            const recentMemories = contextInfo.relatedMemories.slice(0, 2);
            contextResponse = `${recentMemories[0].content} `;
          }
          break;

        case 'preference':
          // Kullanıcı tercihlerine dair bağlam oluştur
          const preferenceMemories = this.longTerm.filter(m => 
            m.content.toLowerCase().includes("severim") || 
            m.content.toLowerCase().includes("hoşlanırım") ||
            m.content.toLowerCase().includes("tercih")
          );

          if (preferenceMemories.length > 0) {
            contextResponse = `${preferenceMemories[0].content} `;
          }
          break;

        case 'personal_info':
          // Kişisel bilgilerle ilgili bağlam oluştur
          const personalInfoMemories = this.longTerm.filter(m => 
            m.content.toLowerCase().includes("adım") || 
            m.content.toLowerCase().includes("yaşım") ||
            m.content.toLowerCase().includes("ismim")
          );

          if (personalInfoMemories.length > 0) {
            contextResponse = `${personalInfoMemories[0].content} `;
          }
          break;
      }
    }

    // Genel bağlama dair anıları ekle
    if (contextInfo.relatedMemories.length > 0 && !contextResponse) {
      // Eğer cevap direkt olarak bulunmuşsa, sadece cevabı döndür
      if (contextInfo.relatedMemories[0].content.includes("cevap") ||
          contextInfo.relatedMemories[0].content.includes("yanıt")) {
        contextResponse = `${contextInfo.relatedMemories[0].content} `;  
      } else {
        // Doğrudan içeriği döndür, "Bu konuyla ilgili bildiğim:" ifadesini kullanma
        contextResponse = `${contextInfo.relatedMemories[0].content} `;
      }
    }

    return contextResponse;
  }

  /**
   * Anının önemini güçlendir veya azalt ve bağlantıları güncelle
   */
  reinforceMemory(content: string, adjustment: number) {
    // Hem kısa hem uzun vadeli belleği güncelle
    const updateMemory = (memory: Memory) => {
      if (memory.content.toLowerCase() === content.toLowerCase()) {
        // İlgililiği güncelle
        memory.relevance = Math.min(1, Math.max(0.1, memory.relevance + adjustment));

        // Öğrenme sayısını arttır
        memory.learningCount = (memory.learningCount || 1) + 1;

        // Son erişim zamanını güncelle
        memory.timestamp = Date.now();
      }
    };

    this.shortTerm.forEach(updateMemory);
    this.longTerm.forEach(updateMemory);

    // Değişiklikleri kaydet
    this.saveMemories();
  }

  /**
   * Unutma mekanizması - zamanla ilgililik düşürme
   */
  private applyForgetting() {
    const now = Date.now();

    // Kısa vadeli bellek daha hızlı unutur
    this.shortTerm.forEach(memory => {
      const daysPassed = (now - memory.timestamp) / (1000 * 60 * 60 * 24);

      // Her gün için ilgililiği azalt
      if (daysPassed > 0) {
        memory.relevance = Math.max(0.1, memory.relevance - (this.forgettingRate * daysPassed));
      }
    });

    // Uzun vadeli bellek daha yavaş unutur
    this.longTerm.forEach(memory => {
      const daysPassed = (now - memory.timestamp) / (1000 * 60 * 60 * 24);

      // Her gün için ilgililiği azalt (daha yavaş bir oranda)
      if (daysPassed > 0) {
        memory.relevance = Math.max(0.1, memory.relevance - (this.forgettingRate * 0.3 * daysPassed));
      }
    });

    // Kümeler de güç kaybeder
    this.memoryClusters.forEach(cluster => {
      const daysPassed = (now - cluster.lastAccessed) / (1000 * 60 * 60 * 24);

      if (daysPassed > 0) {
        cluster.strength = Math.max(0.2, cluster.strength - (this.forgettingRate * 0.5 * daysPassed));
      }
    });
  }

  /**
   * Kısa vadeli bellekten uzun vadeli belleğe transfer (konsolidasyon)
   */
  consolidateShortTermMemories() {
    // Kısa vadeli bellekten uzun vadeli belleğe transfer et
    const memoriesToTransfer = this.shortTerm.filter(memory => 
      memory.relevance > 0.6 || (memory.emotionalState && Math.abs(memory.emotionalState) > 0.4)
    );

    memoriesToTransfer.forEach(memory => {
      // Uzun vadeli belleğe ekle
      this.longTerm.push({
        ...memory,
        type: 'long-term',
        learningCount: (memory.learningCount || 1) + 1
      });

      // Kısa vadeli bellekten çıkar
      this.shortTerm = this.shortTerm.filter(m => m.content !== memory.content);
    });

    // Değişiklikleri kaydet
    this.saveMemories();

    return memoriesToTransfer.length;
  }

  /**
   * Günlük hatırlatmaları getir ve önemli anıları öner
   */
  getDailyReminders(): string[] {
    // Anıları önem sırasına göre seç
    const significantMemories = this.longTerm
      .filter(memory => memory.relevance > 0.7 || (memory.emotionalState && Math.abs(memory.emotionalState) > 0.6))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);

    // Kümelerdeki önemli konuları al
    const significantClusters = this.memoryClusters
      .filter(cluster => cluster.strength > 1.5)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 2);

    // Hatırlatma metinleri oluştur
    const reminders = significantMemories.map(memory => 
      `Hatırlatma: "${memory.content}" (${memory.category || 'genel'} kategorisi)`
    );

    // Küme hatırlatmaları
    significantClusters.forEach(cluster => {
      const topMemories = cluster.memories
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 2)
        .map(m => `"${m.content}"`);

      reminders.push(`Konu: ${cluster.topic} - İlgili anılar: ${topMemories.join(', ')}`);
    });

    return reminders;
  }

  /**
   * Metinden bilgi çıkar ve öğren
   */
  extractAndLearnFromText(text: string) {
    // Metni cümlelere ayır
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Bilgi çıkarma ve öğrenme - her cümleyi analiz et
    for (const sentence of sentences) {
      // Eğer bilgi cümlesi ise (özne ve yüklem içeriyorsa)
      if (sentence.includes(' ') && sentence.trim().split(' ').length >= 3) {
        this.addMemory(sentence.trim(), 'short-term');

        // Varlık tanıma - özel isimler, yerler, kavramlar
        const words = sentence.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i].trim();

          // Büyük harfle başlayan kelimeler (özel isimler)
          if (word.length > 1 && /^[A-ZĞÜŞİÖÇ]/.test(word)) {
            // İsmi ve bağlamı kaydet
            const context = sentence.trim();
            this.addMemory(`${word} bir varlıktır`, 'long-term', [], context);
          }

          // İki kelimelik önemli ifadeler
          if (i < words.length - 1) {
            const twoWordPhrase = `${word} ${words[i+1]}`.trim();
            if (twoWordPhrase.length > 5 && !['bir şey', 'bu bir', 'şu bir'].includes(twoWordPhrase.toLowerCase())) {
              this.addMemory(twoWordPhrase, 'short-term', [], sentence.trim());
            }
          }
        }

        // Basit soru-cevap çıkarımları üret
        const questionPatterns = [
          { pattern: /(\w+) (?:ise|idi|olarak|oldu[^ğmk]) (.+)/i, template: "$1 nedir?", answer: "$2" },
          { pattern: /(\w+'[ın])n? (.+)/i, template: "$1 $2 nedir?", answer: sentence },
          { pattern: /(\w+) (\w+)[ıiuü] (.+)/i, template: "$1 $2 mı $3?", answer: "Evet, $1 $2" },
        ];

        for (const { pattern, template, answer } of questionPatterns) {
          const match = sentence.match(pattern);
          if (match) {
            // Basit bir soru oluştur
            const question = template.replace(/\$(\d+)/g, (_, n) => match[parseInt(n)]);

            // Cevabı oluştur
            const answerText = answer.replace(/\$(\d+)/g, (_, n) => match[parseInt(n)]);

            // Soru-cevap çiftini uzun vadeli belleğe ekle
            this.addMemory(`Soru: ${question} Cevap: ${answerText}`, 'long-term');
          }
        }
      }
    }
  }

  /**
   * Bellek sistemini JSON formatında dışa aktar
   */
  exportMemories() {
    return {
      shortTerm: this.shortTerm,
      longTerm: this.longTerm,
      memoryClusters: this.memoryClusters
    };
  }

  /**
   * Bellek verilerini içe aktar
   */
  importMemories(data: { shortTerm: Memory[];
    longTerm: Memory[];
    memoryClusters: MemoryCluster[];
  }) {
    if (data.shortTerm) this.shortTerm = data.shortTerm;
    if (data.longTerm) this.longTerm = data.longTerm;
    if (data.memoryClusters) this.memoryClusters = data.memoryClusters;

    // Yeni verileri kaydet
    this.saveMemories();
  }

  /**
   * Bellekleri yerel depolamaya kaydet
   */
  private saveMemories() {
    try {
      // localStorage browser-only olduğu için kontrol ekleyelim
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('memory_short_term', JSON.stringify(this.shortTerm));
        localStorage.setItem('memory_long_term', JSON.stringify(this.longTerm));
        localStorage.setItem('memory_clusters', JSON.stringify(this.memoryClusters));
      }
    } catch (error) {
      console.error('Bellek kaydedilemedi:', error);
    }
  }

  /**
   * Bellekleri yerel depolamadan yükle
   */
  private loadMemories() {
    try {
      // localStorage browser-only olduğu için kontrol ekleyelim
      if (typeof window !== 'undefined' && window.localStorage) {
        const shortTerm = localStorage.getItem('memory_short_term');
        const longTerm = localStorage.getItem('memory_long_term');
        const clusters = localStorage.getItem('memory_clusters');

        if (shortTerm) this.shortTerm = JSON.parse(shortTerm);
        if (longTerm) this.longTerm = JSON.parse(longTerm);
        if (clusters) this.memoryClusters = JSON.parse(clusters);
      }
    } catch (error) {
      console.error('Bellek yüklenemedi:', error);
    }
  }

  /**
   * Tüm belleği temizle
   */
  clearMemory() {
    this.shortTerm = [];
    this.longTerm = [];
    this.memoryClusters = [];

    // localStorage browser-only olduğu için kontrol ekleyelim
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('memory_short_term');
      localStorage.removeItem('memory_long_term');
      localStorage.removeItem('memory_clusters');
    }
  }

  removeMemory(content: string) {
    try {
      // Bellek sisteminden sil
      const previousShortTermLength = this.shortTerm.length;      const previousLongTermLength = this.longTerm.length;

      // Kısa ve uzun vadeli bellekten kaldır
      this.shortTerm = this.shortTerm.filter(m => m.content !== content);
      this.longTerm = this.longTerm.filter(m => m.content !== content);

      // Silinen öğe sayısını kontrol et
      const shortTermDeleted = previousShortTermLength - this.shortTerm.length;
      const longTermDeleted = previousLongTermLength - this.longTerm.length;

      // Kümelerden kaldır ve yeni küme listesi oluştur
      const updatedClusters = this.memoryClusters.reduce((acc: MemoryCluster[], cluster) => {
        const updatedCluster = {
          ...cluster,
          memories: cluster.memories.filter(m => m.content !== content)
        };

        // Sadece içinde anı olan kümeleri sakla
        if (updatedCluster.memories.length > 0) {
          acc.push(updatedCluster);
        }
        return acc;
      }, []);

      // Kümeleri güncelle
      this.memoryClusters = updatedClusters;

      // LocalStorage'ı güncelle
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('memory_short_term', JSON.stringify(this.shortTerm));
        localStorage.setItem('memory_long_term', JSON.stringify(this.longTerm));
        localStorage.setItem('memory_clusters', JSON.stringify(this.memoryClusters));

        // Sinir ağı verilerini güncelle
        const userNetworksStr = localStorage.getItem('neural_user_networks');
        const systemNetworksStr = localStorage.getItem('neural_system_networks');
        const relationsStr = localStorage.getItem('neural_relations');
        const biRelationsStr = localStorage.getItem('neural_bidirectional_relations');

        if (userNetworksStr && systemNetworksStr && relationsStr && biRelationsStr) {
          const words = content.toLowerCase().split(/\s+/);

          // Ağları parse et
          let userNetworks = JSON.parse(userNetworksStr);
          let systemNetworks = JSON.parse(systemNetworksStr);
          let relations = JSON.parse(relationsStr);
          let biRelations = JSON.parse(biRelationsStr);

          // İlgili kelimeleri içeren düğümleri temizle
          const cleanNetwork = (network: any[][][]) => {
            return network.map(layer => 
              layer.map(row =>
                row.map(node => {
                  if (node && words.some(word => 
                    node.word.toLowerCase().includes(word) || 
                    word.includes(node.word.toLowerCase())
                  )) {
                    return null;
                  }
                  return node;
                })
              )
            );
          };

          // Ağları temizle
          userNetworks = cleanNetwork(userNetworks);
          systemNetworks = cleanNetwork(systemNetworks);

          // İlişkileri temizle
          relations = relations.filter((rel: any) => 
            !words.some(word => 
              rel.userWord.toLowerCase().includes(word) || 
              rel.systemWord.toLowerCase().includes(word)
            )
          );

          biRelations = biRelations.filter((rel: any) =>
            !words.some(word => 
              rel.userWord.toLowerCase().includes(word) || 
              rel.systemWord.toLowerCase().includes(word)
            )
          );

          // Güncellenmiş ağ verilerini kaydet
          localStorage.setItem('neural_user_networks', JSON.stringify(userNetworks));
          localStorage.setItem('neural_system_networks', JSON.stringify(systemNetworks));
          localStorage.setItem('neural_relations', JSON.stringify(relations));
          localStorage.setItem('neural_bidirectional_relations', JSON.stringify(biRelations));
        }
      }

      // Silme işlemi başarılı oldu mu kontrol et
      const totalDeleted = shortTermDeleted + longTermDeleted;
      return totalDeleted > 0;

    } catch (error) {
      console.error('Hafıza silme hatası:', error);
      return false;
    }

    // Sinir ağında ilgili düğümleri temizle
    const words = content.toLowerCase().split(/\s+/);
    if (typeof window !== 'undefined' && window.localStorage) {
      // Ağ verilerini al
      const userNetworksStr = localStorage.getItem('neural_user_networks');
      const systemNetworksStr = localStorage.getItem('neural_system_networks');
      const relationsStr = localStorage.getItem('neural_relations');
      const biRelationsStr = localStorage.getItem('neural_bidirectional_relations');

      if (userNetworksStr && systemNetworksStr && relationsStr && biRelationsStr) {
        let userNetworks = JSON.parse(userNetworksStr);
        let systemNetworks = JSON.parse(systemNetworksStr);
        let relations = JSON.parse(relationsStr);
        let biRelations = JSON.parse(biRelationsStr);

        // Düğümleri temizle
        for (let layer = 0; layer < userNetworks.length; layer++) {
          for (let row = 0; row < userNetworks[layer].length; row++) {
            for (let col = 0; col < userNetworks[layer][0].length; col++) {
              const node = userNetworks[layer][row][col];
              if (node && words.includes(node.word.toLowerCase())) {
                userNetworks[layer][row][col] = null;
              }
            }
          }
        }

        for (let layer = 0; layer < systemNetworks.length; layer++) {
          for (let row = 0; row < systemNetworks[layer].length; row++) {
            for (let col = 0; col < systemNetworks[layer][0].length; col++) {
              const node = systemNetworks[layer][row][col];
              if (node && words.includes(node.word.toLowerCase())) {
                systemNetworks[layer][row][col] = null;
              }
            }
          }
        }

        // İlişkileri temizle
        relations = relations.filter(rel => 
          !words.includes(rel.userWord.toLowerCase()) && 
          !words.includes(rel.systemWord.toLowerCase())
        );

        biRelations = biRelations.filter(rel =>
          !words.includes(rel.userWord.toLowerCase()) && 
          !words.includes(rel.systemWord.toLowerCase())
        );

        // Güncellenmiş verileri kaydet
        localStorage.setItem('neural_user_networks', JSON.stringify(userNetworks));
        localStorage.setItem('neural_system_networks', JSON.stringify(systemNetworks));
        localStorage.setItem('neural_relations', JSON.stringify(relations));
        localStorage.setItem('neural_bidirectional_relations', JSON.stringify(biRelations));
      }
    }

    // Değişiklikleri kaydet
    this.saveMemories();
  }

  private analyzeWordGroups(words: string[]): {group: string[], weight: number}[] {
    const groups: {group: string[], weight: number}[] = [];

    // İkili ve üçlü kelime grupları oluştur
    for(let i = 0; i < words.length; i++) {
      // İkili gruplar
      if(i < words.length - 1) {
        groups.push({
          group: [words[i], words[i+1]],
          weight: 1.0
        });
      }

      // Üçlü gruplar
      if(i < words.length - 2) {
        groups.push({
          group: [words[i], words[i+1], words[i+2]],
          weight: 1.5
        });
      }
    }

    return groups;
  }

  private createSemanticMap(words: string[], context: string): Map<string, Set<string>> {
    const semanticMap = new Map<string, Set<string>>();

    // Her kelime için gelişmiş anlamsal ilişkileri analiz et
    words.forEach(word => {
      const relations = new Set<string>();

      // Mevcut kümelerdeki ilişkileri kontrol et
      this.memoryClusters.forEach(cluster => {
        // Küme içindeki tüm anılardan kelime ve bağlam bilgisi çıkar
        const clusterContexts = cluster.memories.map(m => ({
          words: m.content.toLowerCase().split(/\s+/).filter(w => w.length > 2),
          context: m.context || '',
          emotionalState: m.emotionalState || null
        }));

        // Her bağlam için anlamsal analiz yap
        clusterContexts.forEach(ctx => {
          // Kelime benzerliği kontrolü
          ctx.words.forEach(cWord => {
            // Doğrudan kelime benzerliği
            if(this.calculateWordSimilarity(word, cWord) > 0.7) {
              relations.add(cWord);
            }

            // Eş anlamlı kelime kontrolü
            const synonyms = this.findSynonyms(cWord);
            if(synonyms.includes(word)) {
              relations.add(cWord);
            }

            // Bağlamsal ilişki kontrolü
            if(ctx.context && ctx.context.includes(word)) {
              relations.add(cWord);
            }

            // Duygusal bağlam kontrolü
            if(ctx.emotionalState && this.isEmotionallyRelated(word, cWord)) {
              relations.add(cWord);
            }
          });
        });

        // Küme gücüne göre ilişki ağırlığını ayarla
        if(cluster.strength > 2) {
          cluster.topic.split(/\s+/).forEach(topicWord => {
            if(this.calculateWordSimilarity(word, topicWord) > 0.6) {
              relations.add(topicWord);
            }
          });
        }
      });

      semanticMap.set(word, relations);
    });

    return semanticMap;
  }

  private findSynonyms(word: string): string[] {
    // Türkçe eş anlamlı kelimeler sözlüğü (basit örnek)
    const synonymDict: Record<string, string[]> = {
      'merhaba': ['selam', 'selamlar', 'hey'],
      'iyi': ['güzel', 'hoş', 'olumlu'],
      'kötü': ['fena', 'berbat', 'olumsuz'],
      'büyük': ['geniş', 'kocaman', 'dev'],
      'küçük': ['ufak', 'minik', 'minimal'],
      // Daha fazla eş anlamlı kelime eklenebilir
    };

    return synonymDict[word] || [];
  }

  private isEmotionallyRelated(word1: string, word2: string): boolean {
    // Duygusal kelime grupları
    const emotionalGroups = {
      positive: ['mutlu', 'sevinç', 'neşe', 'güzel', 'harika'],
      negative: ['üzgün', 'kızgın', 'sinirli', 'kötü', 'berbat'],
      neutral: ['normal', 'orta', 'standart', 'olağan'],
    };

    // İki kelimenin aynı duygusal grupta olup olmadığını kontrol et
    for(const group of Object.values(emotionalGroups)) {
      if(group.includes(word1) && group.includes(word2)) {
        return true;
      }
    }

    return false;
  }

  analyzeSemantics(input: string): Memory['semanticAnalysis'] {
    const words = input.toLowerCase().split(/\s+/);
    const analysis = {
      words: words.map(word => {
        const entry = this.turkishDictionary.getWord(word);
        return {
          word,
          meaning: entry?.meaning[0] || '',
          role: entry?.type || ''
        };
      }),
      intent: '',
      confidence: 0,
      statistics: {
        correctResponses: 0,
        totalResponses: 0,
        successRate: 0
      },
      expectedResponse: '',
      semanticUnderstanding: {
        components: [],
        pattern: '',
        confidence: 0
      }
    };

    // Cümle analizi yap
    const phraseAnalysis = this.turkishDictionary.analyzePhrase(input);

    if (phraseAnalysis.understanding) {
      analysis.intent = phraseAnalysis.understanding;
      analysis.confidence = phraseAnalysis.confidence;

      // İstatistikleri güncelle
      const isCorrectResponse = phraseAnalysis.confidence > 0.8;
      if (isCorrectResponse) {
        analysis.statistics.correctResponses++;
      }
      analysis.statistics.totalResponses++;
      analysis.statistics.successRate = 
        analysis.statistics.correctResponses / analysis.statistics.totalResponses;

      // Anlamsal bileşenleri ekle
      analysis.semanticUnderstanding = {
        components: phraseAnalysis.words.map(word => ({
          word: word.word,
          role: word.type,
          meaning: word.meaning[0]
        })),
        pattern: input,
        confidence: phraseAnalysis.confidence
      };

      // Beklenen yanıtı ayarla
      if (phraseAnalysis.semanticComponents?.expectedResponse) {
        analysis.expectedResponse = phraseAnalysis.semanticComponents.expectedResponse;
      }
    }

    // Sözcük gruplarını analiz et
    const wordGroups = this.findWordGroups(words);

    // Özel kalıpları kontrol et
    for (const pattern of this.knownPatterns) {
      if (pattern.matches(words)) {
        analysis.intent = pattern.intent;
        analysis.confidence = pattern.confidence;
        analysis.expectedResponse = pattern.generateResponse(this);

        // İstatistikleri güncelle
        if (pattern.wasSuccessful) {
          analysis.statistics.correctResponses++;
        }
        analysis.statistics.totalResponses++;
        analysis.statistics.successRate = 
          analysis.statistics.correctResponses / analysis.statistics.totalResponses;

        break;
      }
    }

    // Özel durum analizi - "adın ne" kalıbı
    if (input.toLowerCase().includes('adın ne')) {
      analysis.intent = 'isim_sorma';
      analysis.confidence = 0.95;
      analysis.expectedResponse = 'Adım Yapay Zeka Robotu';
    }

    return analysis;
  }

  private findWordGroups(words: string[]): Array<{
    words: string[],
    meaning: string,
    type: string
  }> {
    const groups = [];
    for (let i = 0; i < words.length; i++) {
      // İkili grupları kontrol et
      if (i < words.length - 1) {
        const twoWordPhrase = words[i] + ' ' + words[i + 1];
        const entry = this.turkishDictionary.getPhrase(twoWordPhrase);
        if (entry) {
          groups.push({
            words: [words[i], words[i + 1]],
            meaning: entry.meaning,
            type: entry.type
          });
        }
      }
    }
    return groups;
  }

  private calculateWordSimilarity(word1: string, word2: string): number {
    if(word1 === word2) return 1;

    const len1 = word1.length;
    const len2 = word2.length;

    // Uzunluk farkı çok fazlaysa benzer değil
    if(Math.abs(len1 - len2) > 3) return 0;

    let matches = 0;
    const maxLen = Math.max(len1, len2);

    // Ortak karakterleri say
    for(let i = 0; i < maxLen; i++) {
      if(word1[i] === word2[i]) matches++;
    }

    return matches / maxLen;
  }

  /**
   * Semantik kalıpları başlat
   */
  private initializeSemanticPatterns(): SemanticPattern[] {
    return [
      {
        id: 'greeting',
        pattern: ['merhaba', 'selam', 'selamün', 'günaydın'],
        intent: 'selamlama',
        confidence: 0.9,
        wasSuccessful: true,
        matches: (words: string[]) => {
          return words.some(word => 
            ['merhaba', 'selam', 'selamün', 'günaydın', 'iyi akşamlar'].includes(word.toLowerCase())
          );
        },
        generateResponse: (memorySystem: EnhancedMemorySystem) => {
          const greetings = ['Merhaba!', 'Selam!', 'Merhaba, size nasıl yardımcı olabilirim?'];
          return greetings[Math.floor(Math.random() * greetings.length)];
        }
      },
      {
        id: 'name_asking',
        pattern: ['adın', 'ne', 'ismin'],
        intent: 'isim_sorma',
        confidence: 0.95,
        wasSuccessful: true,
        matches: (words: string[]) => {
          const nameQuestions = ['adın ne', 'ismin ne', 'adınız ne'];
          const sentence = words.join(' ').toLowerCase();
          return nameQuestions.some(q => sentence.includes(q));
        },
        generateResponse: (memorySystem: EnhancedMemorySystem) => {
          return 'Adım Yapay Zeka Asistanı. Size nasıl yardımcı olabilirim?';
        }
      },
      {
        id: 'how_are_you',
        pattern: ['nasılsın', 'nasıl', 'naber'],
        intent: 'hal_sorma',
        confidence: 0.85,
        wasSuccessful: true,
        matches: (words: string[]) => {
          return words.some(word => ['nasılsın', 'naber', 'nasıl'].includes(word.toLowerCase()));
        },
        generateResponse: (memorySystem: EnhancedMemorySystem) => {
          return 'İyiyim, teşekkür ederim! Siz nasılsınız?';
        }
      },
      {
        id: 'what_is',
        pattern: ['nedir', 'ne demek'],
        intent: 'tanım_sorma',
        confidence: 0.8,
        wasSuccessful: true,
        matches: (words: string[]) => {
          const sentence = words.join(' ').toLowerCase();
          return sentence.includes('nedir') || sentence.includes('ne demek');
        },
        generateResponse: (memorySystem: EnhancedMemorySystem) => {
          return 'Bu konuda size yardımcı olmaya çalışacağım.';
        }
      }
    ];
  }

    createConsciousnessMemory(input: string) {
        // Farkındalık anısı oluşturma
        const memory: Memory = {
            content: `Bilinçlenme: ${input}`,
            timestamp: Date.now(),
            relevance: 0.8,
            type: 'anlamlandirma',
            related: [],
            semanticClusters: [],
            sessionId: this.sessionId
        } as any;
        this.longTerm.push(memory);
        this.saveMemories();
    }

    enhanceConsciousness(input: string, domain: string) {
        // Bilinçlenme arttırma
        const memory: Memory = {
            content: `Bilinçlenme arttırıldı: ${input}, alan: ${domain}`,
            timestamp: Date.now(),
            relevance: 0.7,
            type: 'anlamlandirma',
            related: [],
            semanticClusters: [],
            sessionId: this.sessionId
        } as any;
        this.longTerm.push(memory);
        this.saveMemories();
    }

    getConsciousnessState() {
        // Bilinç durumu
        let overallAwareness = 0;
        const consciousnessMemories = this.longTerm.filter(m => m.type === 'anlamlandirma');
        if (consciousnessMemories.length > 0) {
            overallAwareness = consciousnessMemories.reduce((acc, m) => acc + m.relevance, 0) / consciousnessMemories.length;
        }
        
        // Bilinç seviyesini belirle
        let level = 'basic';
        if (overallAwareness > 0.5) level = 'intermediate';
        if (overallAwareness > 0.8) level = 'advanced';
        
        // Son içgörüler ve yansımalar
        const insights = this.longTerm
            .filter(m => m.type === 'anlamlandirma' && m.content.includes('içgörü'))
            .slice(-3)
            .map(m => m.content.substring(0, 50));
            
        const reflections = this.longTerm
            .filter(m => m.type === 'anlamlandirma' && m.content.includes('düşünce'))
            .slice(-3)
            .map(m => m.content.substring(0, 50));
            
        // Gelişim alanları
        const domains = Array.from(new Set(
            this.longTerm
                .filter(m => m.type === 'anlamlandirma')
                .flatMap(m => m.semanticClusters || [])
        )).slice(0, 5);
        
        return {
            overallAwareness,
            level,
            insights,
            reflections,
            domains
        };
    }
    
    /**
     * Uzun konuşma oluştur - hafızadaki bilgilerden anlamlı paragraflar oluştur
     * @param topic Konu (isteğe bağlı)
     * @param sentenceCount İstenen cümle sayısı
     */
    generateLongConversationDetail(topic?: string, sentenceCount: number = 5): string {
        // İlgili anıları seç
        let relevantMemories = this.longTerm;
        
        // Eğer konu belirtilmişse, o konuyla ilgili anıları filtrele
        if (topic) {
            relevantMemories = relevantMemories.filter(memory => {
                // Konu içeriğinde geçiyorsa
                if (memory.content.toLowerCase().includes(topic.toLowerCase())) {
                    return true;
                }
                
                // Semantik kümelerde geçiyorsa
                if (memory.semanticClusters && memory.semanticClusters.some(
                    c => c.toLowerCase().includes(topic.toLowerCase())
                )) {
                    return true;
                }
                
                return false;
            });
        }
        
        // Yeterli anı yoksa, tüm anıları kullan
        if (relevantMemories.length < sentenceCount) {
            relevantMemories = this.longTerm;
        }
        
        // Anıları önem sırasına göre sırala ve en önemlilerini seç
        relevantMemories = relevantMemories
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, Math.min(30, relevantMemories.length));
            
        // Rastgele karıştır
        relevantMemories = relevantMemories.sort(() => Math.random() - 0.5);
        
        // Gereken cümle sayısını seç
        const selectedMemories = relevantMemories.slice(0, sentenceCount);
        
        // Eğer yeterli anı yoksa, kalan cümleleri oluştur
        while (selectedMemories.length < sentenceCount) {
            // Varsayılan cümleler
            const defaultSentences = [
                "Bu konu hakkında daha fazla bilgi edinmek önemlidir.",
                "Farklı bakış açıları bize yeni anlayışlar kazandırabilir.",
                "Sürekli öğrenme ve gelişim hayatın temel bir parçasıdır.",
                "Bilgi paylaştıkça çoğalır ve değer kazanır.",
                "Merak, öğrenmenin başlangıcıdır."
            ];
            
            selectedMemories.push({
                content: defaultSentences[Math.floor(Math.random() * defaultSentences.length)],
                relevance: 0.5,
                timestamp: Date.now()
            } as any);
        }
        
        // Cümleleri çıkar (sadece ilk cümleyi al - nokta ile biten kısım)
        let sentences = selectedMemories.map(memory => {
            // Cümleyi nokta, ünlem veya soru işaretine kadar al
            const sentenceMatch = memory.content.match(/^(.*?[.!?])/);
            if (sentenceMatch && sentenceMatch[1]) {
                return sentenceMatch[1].trim();
            }
            
            // Eğer noktalama işareti yoksa, tüm içeriği al
            return memory.content.trim();
        });
        
        // Cümleleri birleştir ve anlamlı bir paragraf oluştur
        let paragraph = sentences.join(' ');
        
        // Eğer bir konu belirtilmişse, konuyla başla
        if (topic) {
            const topicIntros = [
                `${topic} konusunda, `,
                `${topic} hakkında düşünürsek, `,
                `${topic} ile ilgili olarak, `,
                `${topic} bağlamında, `
            ];
            
            paragraph = topicIntros[Math.floor(Math.random() * topicIntros.length)] + paragraph;
        }
        
        return paragraph;
    }
    
    /**
     * Ağı otomatik olarak geliştirme ve yeni özellikler ekleme
     * @param learningRate Öğrenme hızı (0-1 arası)
     * @param expansionRate Genişleme hızı (0-1 arası)
     * @returns Geliştirme sonuçları
     */
    autoEvolveLearning(learningRate: number = 0.5, expansionRate: number = 0.3) {
        // Öğrenme geliştirmesi
        const now = Date.now();
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        
        // Son 1 haftadaki bellekleri analiz et
        const recentMemories = this.longTerm.filter(m => m.timestamp > oneWeekAgo);
        
        // Sık kullanılan kelime ve kavramları tespit et
        const wordFrequency: Record<string, number> = {};
        const conceptsDetected: Set<string> = new Set();
        
        // Kelime frekansını hesapla
        recentMemories.forEach(memory => {
            const words = memory.content.toLowerCase().split(/\s+/);
            words.forEach(word => {
                if (word.length > 3) {
                    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                    
                    // Belirli bir eşiği geçen kelimeleri kavram olarak ele al
                    if (wordFrequency[word] > 5) {
                        conceptsDetected.add(word);
                    }
                }
            });
        });
        
        // Yeni kavramlar için semantik kümeler oluştur
        const newClusters: MemoryCluster[] = [];
        Array.from(conceptsDetected).forEach(concept => {
            // Bu kavram için zaten bir küme var mı kontrol et
            const existingCluster = this.memoryClusters.find(c => 
                c.topic.toLowerCase() === concept || 
                c.topic.toLowerCase().includes(concept)
            );
            
            if (!existingCluster && Math.random() < expansionRate) {
                // Kavramla ilgili belekleri topla
                const relatedMemories = recentMemories.filter(m => 
                    m.content.toLowerCase().includes(concept)
                );
                
                if (relatedMemories.length >= 2) {
                    // Yeni küme oluştur
                    const newCluster: MemoryCluster = {
                        id: `auto_${Date.now().toString(36)}_${concept}`,
                        topic: concept,
                        memories: relatedMemories,
                        strength: 0.7,
                        createdAt: now,
                        lastAccessed: now
                    };
                    
                    newClusters.push(newCluster);
                    
                    // Otomatik öğrenme kaydı
                    const learningMemory: Memory = {
                        content: `Otomatik öğrenme: "${concept}" kavramı için yeni küme oluşturuldu.`,
                        timestamp: now,
                        relevance: 0.8,
                        type: 'anlamlandirma',
                        related: [concept],
                        context: `Otomatik öğrenme süreci`,
                        semanticClusters: [concept],
                        sessionId: this.sessionId
                    } as any;
                    
                    this.longTerm.push(learningMemory);
                }
            }
        });
        
        // Yeni kümeleri ekle
        this.memoryClusters = [...this.memoryClusters, ...newClusters];
        
        // Küme limiti kaldırıldı - sınırsız küme gelişimi
        
        // Verileri kaydet
        this.saveMemories();
        
        // Gelişim sonuçlarını döndür
        return {
            newClustersCreated: newClusters.length,
            conceptsDetected: conceptsDetected.size,
            memoriesAnalyzed: recentMemories.length,
            evolutionStage: 'expanding', // genişleme, optimizasyon, konsolidasyon veya uzmanlaşma
            newSemanticConnections: newClusters.length * 3, // Tahmini yeni semantik bağlantı sayısı
            learningEfficiency: 0.7 + (Math.random() * 0.3), // 0-1 arası bir değer
            timestamp: now
        };
    }
    
    /**
     * Yeni semantik kavramlar öğrenme ve ağı otomatik olarak genişletme
     * @param semanticInput Öğrenilecek semantik girdi (örn. yeni bir bilgi metni)
     * @returns Öğrenme sonuçları
     */
    learnSemanticConcepts(semanticInput: string) {
        // Semantik girdiden kelimeler ve cümleler çıkar
        const sentences = semanticInput.split(/[.!?]+/g).filter(s => s.trim().length > 5);
        const words = semanticInput.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        
        // Yeni kavramları belirle
        const uniqueWords = new Set(words);
        
        // Her cümle için yeni bir anı oluştur
        let sentencesLearned = 0;
        sentences.forEach(sentence => {
            if (sentence.trim().length > 10) {
                // Cümleyi kısa vadeli belleğe ekle
                this.addMemory(sentence.trim(), 'short-term');
                sentencesLearned++;
                
                // Cümledeki önemli kavramları analiz et
                const sentenceWords = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                const mainConcepts = sentenceWords.filter(w => 
                    // İsimler, fiiller ve önemli sıfatlar
                    !['ve', 'veya', 'ile', 'için', 'gibi', 'kadar', 'daha', 'çok', 'az'].includes(w)
                );
                
                // Önemli kavramların birbiriyle ilişkilerini öğren
                if (mainConcepts.length >= 2) {
                    for (let i = 0; i < mainConcepts.length; i++) {
                        for (let j = i + 1; j < mainConcepts.length; j++) {
                            const concept1 = mainConcepts[i];
                            const concept2 = mainConcepts[j];
                            
                            // Kavramlar arası ilişkiyi belleğe ekle
                            this.addMemory(
                                `"${concept1}" ve "${concept2}" kavramları ilişkilidir.`,
                                'anlamlandirma',
                                [concept1, concept2],
                                sentence.trim()
                            );
                        }
                    }
                }
            }
        });
        
        // Sürekli gelişim için kısa vadeli belleği uzun vadeli belleğe taşı
        this.consolidateShortTermMemories();
        
        return {
            wordsLearned: uniqueWords.size,
            sentencesLearned,
            conceptsRelated: sentences.length * 2, // Tahmini ilişki sayısı
            memoryEfficiency: Math.min(1, (sentencesLearned / sentences.length) + 0.2),
            timestamp: Date.now()
        };
    }
    
    /**
     * Uzun konuşma üretme - hafızadaki bilgilerden anlamlı paragraflar oluşturun
     * @param topic Paragrafın konusu (isteğe bağlı)
     * @param sentenceCount Oluşturulacak cümle sayısı
     * @returns Oluşturulan paragraf
     */
    generateLongConversation(topic?: string, sentenceCount: number = 7): string {
        // 1. İlgili belleği bul
        let relevantMemories: Memory[] = [];
        
        if (topic) {
            // Konuyla ilgili anıları getir
            relevantMemories = this.findSimilarMemories(topic, 15);
        } else {
            // Rastgele kümeleri seç
            const clusters = this.memoryClusters
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
                
            // Küme anılarını birleştir
            for (const cluster of clusters) {
                relevantMemories = [...relevantMemories, ...cluster.memories];
            }
            
            // Yeterli anı yoksa, en önemli anıları ekle
            if (relevantMemories.length < 10) {
                const importantMemories = this.longTerm
                    .sort((a, b) => b.relevance - a.relevance)
                    .slice(0, 10);
                relevantMemories = [...relevantMemories, ...importantMemories];
            }
        }
        
        // 2. Anılardan cümleler çıkar
        const sentences: string[] = [];
        const usedContents = new Set<string>();
        
        // Ana cümleler için anıları kullan
        for (const memory of relevantMemories) {
            if (sentences.length >= sentenceCount) break;
            
            // Her belleğin içeriğinden cümle çıkar
            const memorySentences = memory.content
                .split(/[.!?]+/)
                .map(s => s.trim())
                .filter(s => s.length > 10 && !usedContents.has(s));
                
            for (const sentence of memorySentences) {
                if (sentences.length >= sentenceCount) break;
                
                sentences.push(sentence);
                usedContents.add(sentence);
            }
        }
        
        // 3. Eğer yeterli cümle yoksa, ilişkileri kullanarak yeni cümleler oluştur
        if (sentences.length < sentenceCount) {
            // "X ve Y arasında ilişki vardır" tipinde cümleler
            const relationMemories = this.longTerm.filter(m => 
                m.type === 'anlamlandirma' && 
                m.content.includes('ilişkilidir')
            );
            
            for (const memory of relationMemories) {
                if (sentences.length >= sentenceCount) break;
                
                if (!usedContents.has(memory.content)) {
                    sentences.push(memory.content);
                    usedContents.add(memory.content);
                }
            }
        }
        
        // 4. Hala yeterli cümle yoksa, kümelerden bilgileri kullanarak cümleler üret
        if (sentences.length < sentenceCount) {
            for (const cluster of this.memoryClusters) {
                if (sentences.length >= sentenceCount) break;
                
                const topicSentence = `${cluster.topic} hakkında bilgiler şunlardır.`;
                if (!usedContents.has(topicSentence)) {
                    sentences.push(topicSentence);
                    usedContents.add(topicSentence);
                }
            }
        }
        
        // 5. Cümleleri anlamlı bir sırayla düzenle ve mantık bağlayıcıları ekle
        const connectors = [
            "Ayrıca", "Bunun yanında", "Bununla birlikte", "Dahası", 
            "Öte yandan", "Bu bağlamda", "Böylece", "Sonuç olarak",
            "Örneğin", "Bunun sonucu olarak", "Bu sebeple"
        ];
        
        const arrangedSentences: string[] = [];
        
        // İlk cümleyi direkt ekle
        if (sentences.length > 0) {
            arrangedSentences.push(sentences[0]);
        }
        
        // Sonraki cümlelere bağlayıcı ekle
        for (let i = 1; i < sentences.length; i++) {
            // Bazı cümlelere bağlayıcı ekle
            if (Math.random() < 0.4) {
                const connector = connectors[Math.floor(Math.random() * connectors.length)];
                arrangedSentences.push(`${connector}, ${sentences[i].charAt(0).toLowerCase() + sentences[i].slice(1)}`);
            } else {
                arrangedSentences.push(sentences[i]);
            }
        }
        
        // 6. Paragrafı oluştur
        let paragraph = arrangedSentences.join('. ').replace(/\.\./g, '.').replace(/\.\s+\./g, '.');
        
        // Her cümlenin ilk harfini büyük yap
        paragraph = paragraph
            .split('. ')
            .map(sentence => {
                if (sentence.length > 0) {
                    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
                }
                return sentence;
            })
            .join('. ');
            
        // Son noktalama işareti ekle
        if (!paragraph.endsWith('.') && !paragraph.endsWith('!') && !paragraph.endsWith('?')) {
            paragraph += '.';
        }
        
        return paragraph;
    }
}

/**
 * Kullanıcı girdisini işle
 */
export const processUserInput = async (input: string) => {
  // Soru analizi
  const questionWords = ['ne', 'nedir', 'kim', 'kimdir', 'nerede', 'neresi', 'hangi', 'nasıl'];
  const normalizedInput = input.toLowerCase().trim();

  // Referans kontrolü ("bu", "şu" gibi kelimeler için)
  const hasReference = normalizedInput.includes('bu') || normalizedInput.includes('şu');

  // Çift yönlü düşünme için yön tespiti
  const isReverseQuestion = normalizedInput.includes('neresidir') || normalizedInput.endsWith('nedir');

  // Bilinçlenme sistemi ile entegrasyon
  const memorySystem = new EnhancedMemorySystem();

  // Bilinçlenme işlemi - kullanıcı girdisini analiz et
  if (normalizedInput.includes('farkında') || 
      normalizedInput.includes('bilinç') || 
      normalizedInput.includes('anla') ||
      normalizedInput.includes('kavra')) {
    // Bilinçlenme belleği oluştur
    memorySystem.createConsciousnessMemory(input);

    // Kategori tespiti ile alan belirleme
    const domain = memorySystem.categorizeMemory(input);

    // Bilinçlenmeyi zenginleştir
    memorySystem.enhanceConsciousness(input, domain);
  }

  // Aktivasyon ve cevap üretme
  const userNetworks: any[] = [];
  const systemNetworks: any[] = [];
  const relations: any[] = [];
  const nodes = { activatedNodes: [], activationLevels: new Map(), activationPath: [] };

  // İlişkileri kontrol et
  let response = '';
  if (isReverseQuestion) {
    // Ters yönlü ilişkileri kontrol et (örn: "Ankara neresidir?")
    const bidirectionalRelations: any[] = []; // Define bidirectionalRelations
    const reverseRelations = bidirectionalRelations.filter((rel: any) => 
      rel.userWord && rel.userWord.toLowerCase().includes(normalizedInput.replace(/neresidir|nedir|\?/g, '').trim())
    );

    if (reverseRelations.length > 0) {
      response = reverseRelations[0].systemWord;
    }
  }

  // Normal yanıt üretme
  if (!response) {
    const trainingData: any[] = []; // Define trainingData
    const recentConversation = ''; // Define recentConversation

    // Bellek sisteminden bağlamsal bilgileri al
    const contextualMemories = memorySystem.getContextualMemories(input);
    const contextualInfo = contextualMemories.map(m => m.content).join(' ');

    // Bilinçlenme bilgilerini al
    const consciousnessState = memorySystem.getConsciousnessState();

    // Basit yanıt üretme (generateResponse yerine)
    response = contextualInfo || 'Size nasıl yardımcı olabilirim?';

    // Bilinçlenme belleğini güncelle
    if (consciousnessState.overallAwareness > 0.3) {
      // Bilinçlenme seviyesi belirli bir eşiği geçtiyse, yanıtı bilinçlenme sistemine ekle
      memorySystem.enhanceConsciousness(`Yanıt: ${response}`, 'diyalog');
    }
  }

  return {
    response,
    usedTraining: null,
    confidence: 0.75
  };
};
