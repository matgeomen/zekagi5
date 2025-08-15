
/**
 * Eğitim Verisi Analiz Sistemi
 * Eğitim verilerini derinlemesine analiz ederek ilişkileri ve bağlamları çıkarır
 */

import { TurkishDictionary } from './TurkishDictionary';
import { EnhancedMemorySystem } from './EnhancedMemorySystem';

export interface TrainingPair {
  id: string;
  input: string;
  output: string;
  timestamp: number;
  category?: string;
  confidence?: number;
  relatedPairs?: string[];
  semanticTags?: string[];
  contextualInfo?: {
    entities: string[];
    sentiment: number;
    complexity: number;
    questionType?: string;
    answerType?: string;
  };
}

export interface DataPattern {
  id: string;
  pattern: string;
  frequency: number;
  examples: TrainingPair[];
  contextualRules: string[];
  semanticWeight: number;
}

export interface ContextualRelation {
  sourceId: string;
  targetId: string;
  relationType: 'semantic' | 'sequential' | 'causal' | 'categorical' | 'linguistic';
  strength: number;
  confidence: number;
  context: string[];
}

export class TrainingDataAnalyzer {
  private dictionary: TurkishDictionary;
  private memorySystem: EnhancedMemorySystem;
  private patterns: Map<string, DataPattern>;
  private relations: Map<string, ContextualRelation[]>;
  private semanticClusters: Map<string, TrainingPair[]>;

  constructor(dictionary: TurkishDictionary | null, memorySystem: EnhancedMemorySystem) {
    this.dictionary = dictionary || null as any;
    this.memorySystem = memorySystem;
    this.patterns = new Map();
    this.relations = new Map();
    this.semanticClusters = new Map();
  }

  /**
   * Eğitim verilerini kapsamlı analiz et
   */
  public analyzeTrainingData(trainingPairs: TrainingPair[]): {
    analyzedPairs: TrainingPair[];
    discoveredPatterns: DataPattern[];
    contextualRelations: ContextualRelation[];
    semanticClusters: Map<string, TrainingPair[]>;
    insights: {
      totalPairs: number;
      patternCount: number;
      relationCount: number;
      clusterCount: number;
      averageConfidence: number;
      topCategories: string[];
    };
  } {
    console.log('🔍 Eğitim verisi analizi başlatılıyor...', trainingPairs.length, 'veri');

    // 1. Her veriyi ayrıntılı analiz et
    const analyzedPairs = trainingPairs.map(pair => this.analyzeTrainingPair(pair));

    // 2. Kalıpları keşfet
    this.discoverPatterns(analyzedPairs);

    // 3. Bağlamsal ilişkileri bul
    this.findContextualRelations(analyzedPairs);

    // 4. Semantik kümeleme yap
    this.performSemanticClustering(analyzedPairs);

    // 5. İstatistikler ve içgörüler
    const insights = this.generateInsights(analyzedPairs);

    return {
      analyzedPairs,
      discoveredPatterns: Array.from(this.patterns.values()),
      contextualRelations: Array.from(this.relations.values()).flat(),
      semanticClusters: this.semanticClusters,
      insights
    };
  }

  /**
   * Tek bir eğitim verisini detaylı analiz et
   */
  private analyzeTrainingPair(pair: TrainingPair): TrainingPair {
    const analyzedPair = { ...pair };

    // Girdi analizi
    const inputAnalysis = this.analyzeText(pair.input);
    
    // Çıktı analizi
    const outputAnalysis = this.analyzeText(pair.output);

    // Bağlamsal bilgileri çıkar
    analyzedPair.contextualInfo = {
      entities: [...inputAnalysis.entities, ...outputAnalysis.entities],
      sentiment: (inputAnalysis.sentiment + outputAnalysis.sentiment) / 2,
      complexity: Math.max(inputAnalysis.complexity, outputAnalysis.complexity),
      questionType: this.detectQuestionType(pair.input),
      answerType: this.detectAnswerType(pair.output)
    };

    // Kategori belirle
    analyzedPair.category = this.categorizeTrainingPair(pair);

    // Semantik etiketler
    analyzedPair.semanticTags = this.extractSemanticTags(pair);

    // Güven skoru hesapla
    analyzedPair.confidence = this.calculatePairConfidence(pair, analyzedPair.contextualInfo);

    return analyzedPair;
  }

  /**
   * Metni detaylı analiz et
   */
  private analyzeText(text: string): {
    entities: string[];
    sentiment: number;
    complexity: number;
    keywords: string[];
    structure: string;
  } {
    const words = text.toLowerCase().split(/\s+/);
    
    // Varlık tanıma
    const entities = this.extractEntities(text);
    
    // Duygu analizi
    const sentiment = this.analyzeSentiment(text);
    
    // Karmaşıklık skoru
    const complexity = this.calculateComplexity(text);
    
    // Anahtar kelimeler
    const keywords = this.extractKeywords(text);
    
    // Cümle yapısı
    const structure = this.analyzeStructure(text);

    return { entities, sentiment, complexity, keywords, structure };
  }

  /**
   * Varlık tanıma
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    const words = text.split(/\s+/);

    // Özel isimler (büyük harfle başlayanlar)
    words.forEach(word => {
      if (/^[A-ZÇĞIİÖŞÜ]/.test(word) && word.length > 2) {
        entities.push(word);
      }
    });

    // Sözlükteki önemli kelimeler
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\wçğıöşü]/g, '');
      const entry = this.dictionary.getWord(cleanWord);
      if (entry && ['isim', 'fiil'].includes(entry.type)) {
        entities.push(cleanWord);
      }
    });

    return [...new Set(entities)];
  }

  /**
   * Duygu analizi
   */
  private analyzeSentiment(text: string): number {
    const positiveWords = [
      'iyi', 'güzel', 'harika', 'mükemmel', 'sevgi', 'mutlu', 'başarı',
      'teşekkür', 'memnun', 'keyif', 'hoş', 'olumlu', 'yararlı'
    ];

    const negativeWords = [
      'kötü', 'berbat', 'üzgün', 'problem', 'sorun', 'hata', 'yanlış',
      'eksik', 'olumsuz', 'başarısız', 'zorlu', 'sıkıntı'
    ];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      const cleanWord = word.replace(/[^\wçğıöşü]/g, '');
      if (positiveWords.includes(cleanWord)) score += 1;
      if (negativeWords.includes(cleanWord)) score -= 1;
    });

    return Math.max(-1, Math.min(1, score / words.length));
  }

  /**
   * Karmaşıklık hesaplama
   */
  private calculateComplexity(text: string): number {
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentenceCount = text.split(/[.!?]+/).length;
    
    // Normalize edilmiş karmaşıklık skoru
    return Math.min(1, (uniqueWords * 0.1 + avgWordLength * 0.05 + sentenceCount * 0.1) / 3);
  }

  /**
   * Anahtar kelime çıkarımı
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['ve', 'veya', 'ama', 'fakat', 'için', 'ile', 'bu', 'şu', 'o', 'bir', 'de', 'da'];
    
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .map(word => word.replace(/[^\wçğıöşü]/g, ''))
      .filter(word => word.length > 2);
  }

  /**
   * Cümle yapısı analizi
   */
  private analyzeStructure(text: string): string {
    if (text.includes('?')) return 'question';
    if (text.includes('!')) return 'exclamation';
    if (text.includes(',')) return 'complex';
    return 'simple';
  }

  /**
   * Soru tipi tespit et
   */
  private detectQuestionType(text: string): string | undefined {
    const questionPatterns = {
      'what': /\b(ne|nedir|hangi)\b/i,
      'who': /\b(kim|kimdir)\b/i,
      'where': /\b(nerede|neresi)\b/i,
      'when': /\b(ne zaman|kaç)\b/i,
      'how': /\b(nasıl|ne şekilde)\b/i,
      'why': /\b(neden|niçin)\b/i
    };

    for (const [type, pattern] of Object.entries(questionPatterns)) {
      if (pattern.test(text)) return type;
    }

    return text.includes('?') ? 'general' : undefined;
  }

  /**
   * Cevap tipi tespit et
   */
  private detectAnswerType(text: string): string | undefined {
    if (text.includes('çünkü') || text.includes('nedeni')) return 'explanation';
    if (text.match(/\d+/)) return 'numerical';
    if (text.toLowerCase().includes('evet') || text.toLowerCase().includes('hayır')) return 'confirmation';
    if (text.includes('!')) return 'enthusiastic';
    return 'descriptive';
  }

  /**
   * Eğitim çiftini kategorize et
   */
  private categorizeTrainingPair(pair: TrainingPair): string {
    const text = (pair.input + ' ' + pair.output).toLowerCase();
    
    const categories = {
      'greeting': ['merhaba', 'selam', 'günaydın', 'iyi akşamlar'],
      'personal': ['adım', 'yaş', 'nereli', 'kim'],
      'emotion': ['nasıl', 'iyi', 'kötü', 'mutlu', 'üzgün'],
      'information': ['nedir', 'ne demek', 'bilgi', 'öğren'],
      'action': ['yap', 'git', 'gel', 'ver', 'al'],
      'time': ['zaman', 'saat', 'gün', 'ay', 'yıl'],
      'location': ['nerede', 'yer', 'konum', 'adres']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Semantik etiketler çıkar
   */
  private extractSemanticTags(pair: TrainingPair): string[] {
    const tags: string[] = [];
    const allText = (pair.input + ' ' + pair.output).toLowerCase();

    // Duygusal etiketler
    if (/mutlu|sevinç|güzel|harika/.test(allText)) tags.push('positive');
    if (/üzgün|kötü|problem|sıkıntı/.test(allText)) tags.push('negative');

    // Konu etiketleri
    if (/öğren|bil|anla|kavra/.test(allText)) tags.push('learning');
    if (/yardım|destek|çöz/.test(allText)) tags.push('help');
    if (/oyun|eğlen|şaka/.test(allText)) tags.push('entertainment');

    // Yapısal etiketler
    if (pair.input.includes('?')) tags.push('interrogative');
    if (pair.output.includes('!')) tags.push('emphatic');

    return tags;
  }

  /**
   * Çift güven skoru hesapla
   */
  private calculatePairConfidence(pair: TrainingPair, contextInfo: any): number {
    let confidence = 0.5;

    // Uzunluk uyumluluğu
    const inputWords = pair.input.split(/\s+/).length;
    const outputWords = pair.output.split(/\s+/).length;
    const lengthRatio = Math.min(inputWords, outputWords) / Math.max(inputWords, outputWords);
    confidence += lengthRatio * 0.2;

    // Varlık uyumluluğu
    if (contextInfo.entities.length > 0) confidence += 0.1;

    // Duygu uyumluluğu
    if (Math.abs(contextInfo.sentiment) < 0.5) confidence += 0.1;
    else confidence += 0.2;

    // Karmaşıklık uyumluluğu
    confidence += (1 - contextInfo.complexity) * 0.1;

    // Soru-cevap uyumluluğu
    if (contextInfo.questionType && contextInfo.answerType) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Kalıpları keşfet
   */
  private discoverPatterns(pairs: TrainingPair[]): void {
    // Girdi kalıpları
    const inputPatterns = new Map<string, TrainingPair[]>();
    
    pairs.forEach(pair => {
      // Basit kelime kalıpları
      const words = pair.input.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          if (!inputPatterns.has(word)) {
            inputPatterns.set(word, []);
          }
          inputPatterns.get(word)!.push(pair);
        }
      });

      // Yapısal kalıplar
      const structure = this.getStructuralPattern(pair.input);
      if (!inputPatterns.has(structure)) {
        inputPatterns.set(structure, []);
      }
      inputPatterns.get(structure)!.push(pair);
    });

    // Kalıpları değerlendir ve kaydet
    inputPatterns.forEach((examples, pattern) => {
      if (examples.length >= 2) { // En az 2 örnek olmalı
        this.patterns.set(pattern, {
          id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pattern,
          frequency: examples.length,
          examples: examples.slice(0, 10), // En fazla 10 örnek sakla
          contextualRules: this.extractContextualRules(examples),
          semanticWeight: this.calculateSemanticWeight(examples)
        });
      }
    });
  }

  /**
   * Yapısal kalıp çıkar
   */
  private getStructuralPattern(text: string): string {
    let pattern = text.toLowerCase();
    
    // Sayıları [NUM] ile değiştir
    pattern = pattern.replace(/\d+/g, '[NUM]');
    
    // Özel isimleri [NAME] ile değiştir
    pattern = pattern.replace(/\b[A-ZÇĞIİÖŞÜ][a-zçğıöşü]+\b/g, '[NAME]');
    
    // Çok spesifik kelimeleri [WORD] ile değiştir
    const commonWords = ['merhaba', 'selam', 'nedir', 'nasıl', 'kim'];
    pattern = pattern.split(' ').map(word => {
      if (commonWords.includes(word)) return word;
      if (word.length > 6) return '[WORD]';
      return word;
    }).join(' ');

    return pattern;
  }

  /**
   * Bağlamsal kurallar çıkar
   */
  private extractContextualRules(examples: TrainingPair[]): string[] {
    const rules: string[] = [];

    // Ortak kategoriler
    const categories = examples.map(ex => ex.category).filter(Boolean);
    const mostCommonCategory = this.getMostFrequent(categories);
    if (mostCommonCategory) {
      rules.push(`category:${mostCommonCategory}`);
    }

    // Ortak semantik etiketler
    const allTags = examples.flatMap(ex => ex.semanticTags || []);
    const commonTags = this.getMostFrequentItems(allTags, 2);
    commonTags.forEach(tag => rules.push(`tag:${tag}`));

    // Güven aralığı
    const confidences = examples.map(ex => ex.confidence || 0.5);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    rules.push(`confidence:${avgConfidence.toFixed(2)}`);

    return rules;
  }

  /**
   * Semantik ağırlık hesapla
   */
  private calculateSemanticWeight(examples: TrainingPair[]): number {
    const factors = {
      frequency: Math.min(1, examples.length / 10),
      avgConfidence: examples.reduce((sum, ex) => sum + (ex.confidence || 0.5), 0) / examples.length,
      complexity: examples.reduce((sum, ex) => sum + (ex.contextualInfo?.complexity || 0.5), 0) / examples.length,
      entityDensity: examples.reduce((sum, ex) => sum + (ex.contextualInfo?.entities.length || 0), 0) / examples.length / 5
    };

    return Object.values(factors).reduce((sum, val) => sum + val, 0) / Object.keys(factors).length;
  }

  /**
   * Bağlamsal ilişkileri bul
   */
  private findContextualRelations(pairs: TrainingPair[]): void {
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const pair1 = pairs[i];
        const pair2 = pairs[j];

        const relations = this.analyzeRelationship(pair1, pair2);
        
        relations.forEach(relation => {
          const key = `${pair1.id}_${pair2.id}`;
          if (!this.relations.has(key)) {
            this.relations.set(key, []);
          }
          this.relations.get(key)!.push(relation);
        });
      }
    }
  }

  /**
   * İki çift arasındaki ilişkiyi analiz et
   */
  private analyzeRelationship(pair1: TrainingPair, pair2: TrainingPair): ContextualRelation[] {
    const relations: ContextualRelation[] = [];

    // Semantik benzerlik
    const semanticSimilarity = this.calculateSemanticSimilarity(pair1, pair2);
    if (semanticSimilarity > 0.7) {
      relations.push({
        sourceId: pair1.id,
        targetId: pair2.id,
        relationType: 'semantic',
        strength: semanticSimilarity,
        confidence: 0.8,
        context: ['similar_meaning', 'related_concepts']
      });
    }

    // Kategori ilişkisi
    if (pair1.category === pair2.category && pair1.category !== 'general') {
      relations.push({
        sourceId: pair1.id,
        targetId: pair2.id,
        relationType: 'categorical',
        strength: 0.9,
        confidence: 0.9,
        context: [`same_category:${pair1.category}`]
      });
    }

    // Dil yapısı ilişkisi
    const structuralSimilarity = this.calculateStructuralSimilarity(pair1, pair2);
    if (structuralSimilarity > 0.8) {
      relations.push({
        sourceId: pair1.id,
        targetId: pair2.id,
        relationType: 'linguistic',
        strength: structuralSimilarity,
        confidence: 0.7,
        context: ['similar_structure', 'linguistic_pattern']
      });
    }

    return relations;
  }

  /**
   * Semantik benzerlik hesapla
   */
  private calculateSemanticSimilarity(pair1: TrainingPair, pair2: TrainingPair): number {
    const entities1 = new Set(pair1.contextualInfo?.entities || []);
    const entities2 = new Set(pair2.contextualInfo?.entities || []);
    
    const commonEntities = [...entities1].filter(e => entities2.has(e)).length;
    const totalEntities = entities1.size + entities2.size - commonEntities;
    
    const entitySimilarity = totalEntities > 0 ? commonEntities / totalEntities : 0;

    // Etiket benzerliği
    const tags1 = new Set(pair1.semanticTags || []);
    const tags2 = new Set(pair2.semanticTags || []);
    
    const commonTags = [...tags1].filter(t => tags2.has(t)).length;
    const totalTags = tags1.size + tags2.size - commonTags;
    
    const tagSimilarity = totalTags > 0 ? commonTags / totalTags : 0;

    return (entitySimilarity + tagSimilarity) / 2;
  }

  /**
   * Yapısal benzerlik hesapla
   */
  private calculateStructuralSimilarity(pair1: TrainingPair, pair2: TrainingPair): number {
    const pattern1 = this.getStructuralPattern(pair1.input);
    const pattern2 = this.getStructuralPattern(pair2.input);
    
    return pattern1 === pattern2 ? 1.0 : 0.0;
  }

  /**
   * Semantik kümeleme yap
   */
  private performSemanticClustering(pairs: TrainingPair[]): void {
    // Kategori bazlı kümeleme
    pairs.forEach(pair => {
      const category = pair.category || 'general';
      if (!this.semanticClusters.has(category)) {
        this.semanticClusters.set(category, []);
      }
      this.semanticClusters.get(category)!.push(pair);
    });

    // Etiket bazlı kümeleme
    pairs.forEach(pair => {
      (pair.semanticTags || []).forEach(tag => {
        const clusterKey = `tag:${tag}`;
        if (!this.semanticClusters.has(clusterKey)) {
          this.semanticClusters.set(clusterKey, []);
        }
        this.semanticClusters.get(clusterKey)!.push(pair);
      });
    });
  }

  /**
   * İçgörüler ve istatistikler üret
   */
  private generateInsights(pairs: TrainingPair[]): any {
    const totalPairs = pairs.length;
    const patternCount = this.patterns.size;
    const relationCount = Array.from(this.relations.values()).flat().length;
    const clusterCount = this.semanticClusters.size;
    
    const averageConfidence = pairs.reduce((sum, pair) => sum + (pair.confidence || 0.5), 0) / totalPairs;
    
    const categoryCount = new Map<string, number>();
    pairs.forEach(pair => {
      const category = pair.category || 'general';
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    return {
      totalPairs,
      patternCount,
      relationCount,
      clusterCount,
      averageConfidence,
      topCategories
    };
  }

  /**
   * En sık görülen öğeyi bul
   */
  private getMostFrequent<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    
    const counts = new Map<T, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * En sık görülen N öğeyi bul
   */
  private getMostFrequentItems<T>(items: T[], limit: number): T[] {
    const counts = new Map<T, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  /**
   * Analiz sonuçlarını dışa aktar
   */
  public exportAnalysis(): {
    patterns: DataPattern[];
    relations: ContextualRelation[];
    clusters: { [key: string]: TrainingPair[] };
    statistics: any;
  } {
    return {
      patterns: Array.from(this.patterns.values()),
      relations: Array.from(this.relations.values()).flat(),
      clusters: Object.fromEntries(this.semanticClusters),
      statistics: {
        totalPatterns: this.patterns.size,
        totalRelations: Array.from(this.relations.values()).flat().length,
        totalClusters: this.semanticClusters.size
      }
    };
  }
}
