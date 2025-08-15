export interface Memory {
  content: string;
  timestamp: number;
  relevance: number;
  type: 'short-term' | 'long-term';
  related: string[];
  context?: string; // İlgili bağlam bilgisi
  emotionalScore?: number; // Duygusal ağırlık (pozitif veya negatif)
  connections?: string[]; // Diğer anılarla bağlantılar
  category?: string; // Anı kategorisi
  learningCount?: number; // Kaç kez öğrenildi
}

export interface MemoryCluster {
  id: string;
  topic: string;
  memories: Memory[];
  strength: number; // İlişki gücü
  createdAt: number;
  lastAccessed: number;
}

export class EnhancedMemorySystem {
  shortTerm: Memory[];
  longTerm: Memory[];
  memoryClusters: MemoryCluster[];
  maxShortTerm: number;
  maxLongTerm: number;
  maxClusters: number;
  forgettingRate: number; // Unutma hızı

  constructor() {
    this.shortTerm = [];
    this.longTerm = [];
    this.memoryClusters = [];
    this.maxShortTerm = 100;
    this.maxLongTerm = 1000;
    this.maxClusters = 50;
    this.forgettingRate = 0.05; // Her hatırlatmada azaltılır
  }

  /**
   * Yeni bellek ekle ve bağlamsal ilişkileri kur
   */
  addMemory(content: string, type: 'short-term' | 'long-term' = 'short-term', related: string[] = [], context?: string) {
    // Kelime vektörlerini oluştur
    const contentWords = content.toLowerCase().split(/\s+/);
    const existingMemoryIds: string[] = [];
    
    // Benzer anıları bul
    const similarMemories = this.findSimilarMemories(content, 3);
    similarMemories.forEach(memory => {
      existingMemoryIds.push(memory.content);
    });

    const memory: Memory = {
      content,
      timestamp: Date.now(),
      relevance: 100, // Başlangıçta en yüksek ilgi
      type,
      related,
      context: context || "",
      emotionalScore: this.calculateEmotionalScore(content),
      connections: existingMemoryIds,
      learningCount: 1,
      category: this.categorizeMemory(content)
    };

    if (type === 'short-term') {
      this.shortTerm.push(memory);
      
      // Kısa vadeli bellekte çok fazla öğe varsa, en eskisini kaldır veya uzun vadeli belleğe taşı
      if (this.shortTerm.length > this.maxShortTerm) {
        this.processShortTermMemories();
      }
    } else {
      this.longTerm.push(memory);
      
      // Uzun vadeli bellekte çok fazla öğe varsa, en eskisini kaldır
      if (this.longTerm.length > this.maxLongTerm) {
        this.consolidateMemories();
      }
    }
    
    // Grupları güncelle
    this.updateMemoryClusters(memory);
    
    return memory;
  }

  /**
   * Duygusal ağırlık hesaplama (basit)
   */
  private calculateEmotionalScore(content: string): number {
    const positiveWords = ['harika', 'güzel', 'mükemmel', 'iyi', 'sevindim', 'teşekkür', 'mutlu'];
    const negativeWords = ['kötü', 'üzgün', 'zor', 'problem', 'hata', 'kızgın', 'üzüldüm'];
    
    const words = content.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) {
        score += 10;
      }
      if (negativeWords.some(nw => word.includes(nw))) {
        score -= 10;
      }
    });
    
    return Math.max(-100, Math.min(100, score));
  }

  /**
   * Anının kategorisini belirle
   */
  private categorizeMemory(content: string): string {
    const categories = [
      { name: 'teknoloji', keywords: ['bilgisayar', 'yazılım', 'uygulama', 'telefon', 'internet'] },
      { name: 'sağlık', keywords: ['sağlık', 'hastane', 'doktor', 'ilaç', 'tedavi'] },
      { name: 'eğitim', keywords: ['okul', 'öğrenci', 'öğretmen', 'ders', 'öğrenmek'] },
      { name: 'günlük', keywords: ['bugün', 'dün', 'yarın', 'şimdi', 'sonra'] },
      { name: 'duygusal', keywords: ['sevmek', 'üzülmek', 'mutlu', 'kızgın', 'hissetmek'] }
    ];
    
    const contentLower = content.toLowerCase();
    
    for (const category of categories) {
      for (const keyword of category.keywords) {
        if (contentLower.includes(keyword)) {
          return category.name;
        }
      }
    }
    
    return 'genel';
  }

  /**
   * Kısa vadeli belleği işle
   */
  private processShortTermMemories() {
    // İlgi seviyesi düşük ve 24 saatten eski olanları filtrele ve sırala
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 saat
    
    const candidatesForRemoval = this.shortTerm
      .filter(memory => memory.timestamp < cutoffTime)
      .sort((a, b) => a.relevance - b.relevance);
    
    if (candidatesForRemoval.length > 0) {
      const memoryToProcess = candidatesForRemoval[0];
      
      // Anı önemli ise, uzun vadeli belleğe aktar
      if (memoryToProcess.relevance > 50 || memoryToProcess.learningCount! > 2) {
        const updatedMemory = {...memoryToProcess, type: 'long-term'};
        this.longTerm.push(updatedMemory);
      }
      
      // Kısa vadeli bellekten kaldır
      const index = this.shortTerm.findIndex(m => m.content === memoryToProcess.content);
      if (index !== -1) {
        this.shortTerm.splice(index, 1);
      }
    } else {
      // Eski anı yoksa, en düşük ilgi puanlı anıyı kaldır
      const leastRelevantIndex = this.shortTerm
        .map((m, index) => ({ index, relevance: m.relevance }))
        .sort((a, b) => a.relevance - b.relevance)[0].index;
      
      this.shortTerm.splice(leastRelevantIndex, 1);
    }
  }

  /**
   * Uzun vadeli belleği konsolide et
   */
  private consolidateMemories() {
    // İlgisi ve zamanı düşük olanları filtrele ve sırala
    const oldMemories = this.longTerm
      .map((memory, index) => ({ memory, index, score: memory.relevance * (1 / (1 + Date.now() - memory.timestamp)) }))
      .sort((a, b) => a.score - b.score);
    
    if (oldMemories.length > 0) {
      // En düşük puanlı anıyı çıkar
      this.longTerm.splice(oldMemories[0].index, 1);
    }
  }

  /**
   * Hafıza kümelerini güncelle
   */
  private updateMemoryClusters(memory: Memory) {
    // Kelimelerden bağlamsal kümeyi tahmin et
    const contentWords = memory.content.toLowerCase().split(/\s+/);
    
    // Tüm kümeleri al ve benzerlik skoru hesapla
    const clusterScores = this.memoryClusters.map(cluster => {
      const topicWords = cluster.topic.toLowerCase().split(/\s+/);
      let matchScore = 0;
      
      contentWords.forEach(word => {
        if (topicWords.includes(word)) {
          matchScore += 10;
        }
      });
      
      return {
        cluster,
        score: matchScore
      };
    });
    
    // En yakın kümeyi bul
    const bestMatch = clusterScores.sort((a, b) => b.score - a.score)[0];
    
    if (bestMatch && bestMatch.score > 20) {
      // Mevcut bir kümeye ekle
      bestMatch.cluster.memories.push(memory);
      bestMatch.cluster.strength += 5;
      bestMatch.cluster.lastAccessed = Date.now();
      
      // Küme çok büyürse, eski ve önemsiz anıları çıkar
      if (bestMatch.cluster.memories.length > 20) {
        bestMatch.cluster.memories.sort((a, b) => a.relevance - b.relevance);
        bestMatch.cluster.memories = bestMatch.cluster.memories.slice(1);
      }
    } else {
      // Yeni bir küme oluştur
      if (contentWords.length >= 3) {
        const newClusterId = `cluster_${Date.now()}`;
        const mainWords = contentWords
          .filter(word => word.length > 3)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .join(' ');
        
        const newCluster: MemoryCluster = {
          id: newClusterId,
          topic: mainWords,
          memories: [memory],
          strength: 50,
          createdAt: Date.now(),
          lastAccessed: Date.now()
        };
        
        this.memoryClusters.push(newCluster);
        
        // Küme limitini aşarsa, en zayıf kümeyi kaldır
        if (this.memoryClusters.length > this.maxClusters) {
          this.memoryClusters.sort((a, b) => a.strength - b.strength);
          this.memoryClusters.shift();
        }
      }
    }
  }

  /**
   * Benzer anıları bul
   */
  findSimilarMemories(content: string, limit: number = 5): Memory[] {
    const contentWords = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const allMemories = [...this.shortTerm, ...this.longTerm];
    
    const scoredMemories = allMemories.map(memory => {
      const memoryWords = memory.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      let matchScore = 0;
      contentWords.forEach(cWord => {
        memoryWords.forEach(mWord => {
          if (mWord.includes(cWord) || cWord.includes(mWord)) {
            matchScore += 5;
          }
          if (mWord === cWord) {
            matchScore += 10;
          }
        });
      });
      
      // Bağlantılı anıları kontrol et
      if (memory.connections && memory.connections.some(conn => content.includes(conn))) {
        matchScore += 30;
      }
      
      // Kategori eşleşmesi
      const category = this.categorizeMemory(content);
      if (memory.category === category) {
        matchScore += 15;
      }
      
      // Son erişim zamanına göre recency bonus
      const recencyScore = Math.max(0, 100 - (Date.now() - memory.timestamp) / (24 * 60 * 60 * 1000));
      
      const totalScore = (matchScore * 0.6) + (recencyScore * 0.2) + (memory.relevance * 0.2);
      
      return { memory, score: totalScore };
    });
    
    return scoredMemories
      .filter(item => item.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);
  }

  /**
   * Verilen sorguyla ilgili anıları getir ve öğrenme sağla
   */
  getContextualMemories(query: string): Memory[] {
    const relevanceThreshold = 20; // Minimum ilgi eşiği
    
    // İlgili kümeleri bul
    const queryWords = query.toLowerCase().split(/\s+/);
    const relatedClusters: MemoryCluster[] = [];
    
    this.memoryClusters.forEach(cluster => {
      const topicWords = cluster.topic.toLowerCase().split(/\s+/);
      let matchCount = 0;
      
      queryWords.forEach(word => {
        if (topicWords.some(tw => tw.includes(word) || word.includes(tw))) {
          matchCount++;
        }
      });
      
      if (matchCount > 0) {
        relatedClusters.push(cluster);
        // Erişimi güncelle
        cluster.lastAccessed = Date.now();
        cluster.strength += 1;
      }
    });
    
    // İlgili kümelerden anıları getir
    const clusterMemories = relatedClusters.flatMap(cluster => cluster.memories);
    
    // Tüm belleklerden ilgililik skorlarını hesapla
    const allMemories = [...new Set([...clusterMemories, ...this.shortTerm, ...this.longTerm])];
    const scoredMemories = allMemories.map(memory => {
      // Gelişmiş benzerlik hesaplama
      const memoryWords = memory.content.toLowerCase().split(/\s+/);
      
      let matchScore = 0;
      for (const qWord of queryWords) {
        for (const mWord of memoryWords) {
          if (mWord.includes(qWord) || qWord.includes(mWord)) {
            matchScore += 10;
          }
          if (mWord === qWord) {
            matchScore += 15;
          }
        }
      }
      
      // Kategori eşleşmesi
      const queryCategory = this.categorizeMemory(query);
      if (memory.category === queryCategory) {
        matchScore += 20;
      }
      
      // Bağlantılı anılarda eşleşme
      if (memory.connections && memory.connections.some(c => queryWords.some(qw => c.includes(qw)))) {
        matchScore += 25;
      }
      
      // İlgililik hesaplaması
      const matchFactor = matchScore;
      const recencyFactor = Math.max(0, 100 - (Date.now() - memory.timestamp) / (24 * 60 * 60 * 1000));
      const relevanceFactor = memory.relevance;
      const emotionalFactor = memory.emotionalScore ? Math.abs(memory.emotionalScore) : 0;
      const learningFactor = memory.learningCount ? memory.learningCount * 5 : 0;
      
      const totalScore = (matchFactor * 0.4) + (recencyFactor * 0.1) + 
                         (relevanceFactor * 0.2) + (emotionalFactor * 0.1) + 
                         (learningFactor * 0.2);
      
      return {
        memory,
        score: totalScore
      };
    });
    
    // Skoru yüksek olanları seç
    const selectedMemories = scoredMemories
      .filter(item => item.score >= relevanceThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.memory);
    
    // Seçilen anıların önemini artır ve öğrenme sayısını artır
    selectedMemories.forEach(memory => {
      this.reinforceMemory(memory.content, 5);
      if (memory.learningCount !== undefined) {
        memory.learningCount += 1;
      } else {
        memory.learningCount = 1;
      }
    });
    
    return selectedMemories;
  }

  /**
   * Anının önemini güçlendir veya azalt ve bağlantıları güncelle
   */
  reinforceMemory(content: string, adjustment: number) {
    // Kısa ve uzun vadeli bellekte anıları bul ve güncelle
    const updateMemory = (memory: Memory) => {
      if (memory.content.includes(content) || content.includes(memory.content)) {
        memory.relevance = Math.max(0, Math.min(100, memory.relevance + adjustment));
        
        // Bağlantıları güncelle
        if (!memory.connections) memory.connections = [];
        if (!memory.connections.includes(content) && memory.content !== content) {
          memory.connections.push(content);
        }
        
        return true;
      }
      return false;
    };
    
    let found = false;
    
    // Kısa vadeli bellekte ara
    for (const memory of this.shortTerm) {
      if (updateMemory(memory)) {
        found = true;
      }
    }
    
    // Uzun vadeli bellekte ara
    for (const memory of this.longTerm) {
      if (updateMemory(memory)) {
        found = true;
      }
    }
    
    // Kümeler içinde de güncelle
    this.memoryClusters.forEach(cluster => {
      let clusterUpdated = false;
      
      cluster.memories.forEach(memory => {
        if (updateMemory(memory)) {
          found = true;
          clusterUpdated = true;
        }
      });
      
      if (clusterUpdated) {
        cluster.strength += 2;
        cluster.lastAccessed = Date.now();
      }
    });
    
    // Zaman geçtikçe anıların ilgililik puanını azalt (unutma mekanizması)
    this.applyForgetting();
    
    return found;
  }

  /**
   * Unutma mekanizması - zamanla ilgililik düşürme
   */
  private applyForgetting() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Kısa vadeli bellek hızlı unutma
    this.shortTerm.forEach(memory => {
      const daysPassed = (now - memory.timestamp) / oneDay;
      if (daysPassed > 1) {
        memory.relevance = Math.max(0, memory.relevance - (this.forgettingRate * 2 * daysPassed));
      }
    });
    
    // Uzun vadeli bellek yavaş unutma
    this.longTerm.forEach(memory => {
      const daysPassed = (now - memory.timestamp) / oneDay;
      if (daysPassed > 7) { // Bir haftadan daha eski
        // Öğrenme sayısı yüksek olanlar daha yavaş unutulur
        const forgettingFactor = memory.learningCount ? 
          this.forgettingRate / Math.max(1, memory.learningCount) : 
          this.forgettingRate;
        
        memory.relevance = Math.max(0, memory.relevance - (forgettingFactor * daysPassed / 7));
      }
    });
  }

  /**
   * Kısa vadeli bellekten uzun vadeli belleğe transfer (konsolidasyon)
   */
  consolidateShortTermMemories() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // En az bir gün önce kaydedilen ve ilgisi yüksek olan anıları seç
    const memories = this.shortTerm.filter(memory => 
      memory.timestamp < oneDayAgo && 
      memory.relevance > 60
    );
    
    for (const memory of memories) {
      // Uzun vadeli belleğe kopyala
      const updatedMemory = {
        ...memory,
        type: 'long-term' as 'short-term' | 'long-term',
        relevance: Math.min(100, memory.relevance + 10) // İlgililik artar
      };
      
      this.longTerm.push(updatedMemory);
      
      // Kısa vadeli bellekten kaldır
      const index = this.shortTerm.findIndex(m => m.content === memory.content);
      if (index !== -1) {
        this.shortTerm.splice(index, 1);
      }
    }
    
    return memories.length;
  }

  /**
   * Günlük hatırlatmaları getir ve önemli anıları öner
   */
  getDailyReminders(): string[] {
    const reminders: string[] = [];
    
    // Son 7 gün içinde erişilmeyen uzun vadeli bellekten önemli anıları seç
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // 1. Yüksek ilgili ve 1 haftadır görülmeyen anılar
    const importantMemories = this.longTerm
      .filter(memory => 
        memory.relevance > 70 && 
        memory.timestamp > oneMonthAgo && 
        memory.timestamp < oneWeekAgo
      )
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
    
    // 2. Önceden çok öğrenilmiş ama uzun süredir tekrarlanmayan anılar
    const wellLearnedMemories = this.longTerm
      .filter(memory => 
        memory.learningCount && memory.learningCount > 3 && 
        memory.timestamp < oneWeekAgo
      )
      .sort((a, b) => (b.learningCount || 0) - (a.learningCount || 0))
      .slice(0, 2);
    
    // 3. Duygusal ağırlığı yüksek anılar
    const emotionalMemories = this.longTerm
      .filter(memory => 
        memory.emotionalScore && Math.abs(memory.emotionalScore) > 50 && 
        memory.timestamp < oneWeekAgo
      )
      .sort((a, b) => (Math.abs(b.emotionalScore || 0) - Math.abs(a.emotionalScore || 0)))
      .slice(0, 2);
    
    // Tüm anıları birleştir ve karıştır
    const allReminders = [...importantMemories, ...wellLearnedMemories, ...emotionalMemories];
    const uniqueReminders = Array.from(new Set(allReminders.map(m => m.content)))
      .map(content => allReminders.find(m => m.content === content)!)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    
    // Hatırlatma mesajları oluştur
    uniqueReminders.forEach(memory => {
      // Tarih formatını oluştur
      const date = new Date(memory.timestamp);
      const formattedDate = date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      let reminderText = `${formattedDate} tarihinde bahsettiğiniz "${memory.content.substring(0, 50)}${memory.content.length > 50 ? '...' : ''}" konusunu hatırlatmak istedim.`;
      
      // Eğer bağlam bilgisi varsa ekle
      if (memory.context) {
        reminderText += ` Konu hakkında "${memory.context}" bağlamını konuşmuştuk.`;
      }
      
      // Eğer duygusal puanı yüksekse ekle
      if (memory.emotionalScore && Math.abs(memory.emotionalScore) > 50) {
        const emotion = memory.emotionalScore > 0 ? 'pozitif' : 'negatif';
        reminderText += ` Bu konu sizin için ${emotion} duygular içeriyordu.`;
      }
      
      reminders.push(reminderText);
    });
    
    return reminders;
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
  importMemories(data: {
    shortTerm: Memory[],
    longTerm: Memory[],
    memoryClusters: MemoryCluster[]
  }) {
    if (data.shortTerm) this.shortTerm = data.shortTerm;
    if (data.longTerm) this.longTerm = data.longTerm;
    if (data.memoryClusters) this.memoryClusters = data.memoryClusters;
  }
}

/**
 * Akıllı prompt oluşturma
 */
export const generateSmartPrompt = ({ 
  userGoal,
  conversationHistory,
  relevantMemories,
  currentQuery
}: { 
  userGoal?: string,
  conversationHistory?: { content: string, isUser: boolean }[],
  relevantMemories: Memory[],
  currentQuery: string
}) => {
  let prompt = `Kullanıcının Sorusu: ${currentQuery}\n\n`;
  
  // Kullanıcı amacı varsa ekle
  if (userGoal) {
    prompt += `Kullanıcının Amacı: ${userGoal}\n\n`;
  }
  
  // Konuşma geçmişi varsa son birkaç mesajı ekle
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += "Son Konuşma:\n";
    
    const recentMessages = conversationHistory.slice(-3);
    recentMessages.forEach((msg, index) => {
      prompt += `${msg.isUser ? 'Kullanıcı' : 'Asistan'}: ${msg.content}\n`;
    });
    
    prompt += "\n";
  }
  
  // İlgili anılar varsa ekle
  if (relevantMemories.length > 0) {
    prompt += "İlgili Bilgiler:\n";
    
    relevantMemories.slice(0, 5).forEach((memory, index) => {
      prompt += `${index + 1}. ${memory.content}\n`;
      
      // Eğer bağlam varsa ekle
      if (memory.context) {
        prompt += `   Bağlam: ${memory.context}\n`;
      }
      
      // Eğer kategorisi varsa ekle
      if (memory.category && memory.category !== 'genel') {
        prompt += `   Kategori: ${memory.category}\n`;
      }
    });
    
    // İlgili kümeleri ekle
    const categories = Array.from(new Set(relevantMemories.map(m => m.category).filter(Boolean)));
    if (categories.length > 0) {
      prompt += "\nİlgili Kategoriler: " + categories.join(', ') + "\n";
    }
    
    prompt += "\nYukarıdaki bilgileri ve bağlamı dikkate alarak Türkçe dilinde yanıt ver. Eğer yanıtın bağlamla ilgili olduğunu düşünüyorsan, önceki bilgileri kullan ama direkt olarak kullanıcıya 'Daha önce X hakkında konuşmuştuk' gibi ifadeler kullanma. Bilgiyi doğal bir şekilde cevabına dahil et:\n";
  } else {
    prompt += "Yanıtını Türkçe olarak ver ve kullanıcıyla saygılı, dostça ve yardımcı bir şekilde iletişim kur:\n";
  }
  
  return prompt;
};
