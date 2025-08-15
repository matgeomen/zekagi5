
/**
 * Gelişmiş Anlamlandırma Sistemi
 * Kullanıcının ne demek istediğini derin analiz ederek anlayan sistem
 */

import { TurkishDictionary } from './TurkishDictionary';
import { EnhancedMemorySystem } from './EnhancedMemorySystem';

export interface SemanticContext {
  intent: string;
  entities: Entity[];
  relationships: Relationship[];
  confidence: number;
  contextualClues: string[];
  inferredMeaning: string;
  possibleResponses: string[];
}

export interface Entity {
  text: string;
  type: 'person' | 'place' | 'thing' | 'concept' | 'action' | 'quality' | 'time' | 'emotion';
  role: 'subject' | 'object' | 'predicate' | 'modifier' | 'context';
  confidence: number;
}

export interface Relationship {
  source: string;
  target: string;
  type: 'causes' | 'requires' | 'is_type_of' | 'located_in' | 'belongs_to' | 'describes' | 'temporal';
  strength: number;
}

export interface TrainingPair {
  id: string;
  input: string;
  output: string;
  category: string;
  timestamp: number;
  usageCount: number;
}

export class SemanticAnalyzer {
  private dictionary: TurkishDictionary | null;
  private memorySystem: EnhancedMemorySystem;
  private contextPatterns: Map<string, RegExp>;
  private intentClassifiers: Map<string, (text: string) => number>;
  private semanticCache: Map<string, SemanticContext>;

  constructor(dictionary: TurkishDictionary | null, memorySystem: EnhancedMemorySystem) {
    this.dictionary = dictionary || null as any;
    this.memorySystem = memorySystem;
    this.contextPatterns = new Map();
    this.intentClassifiers = new Map();
    this.semanticCache = new Map();
    
    this.initializePatterns();
    this.initializeIntentClassifiers();
  }

  /**
   * Ana anlamlandırma fonksiyonu
   */
  public async analyzeUserIntent(
    userInput: string, 
    trainingData: TrainingPair[] = [], 
    conversationHistory: string[] = []
  ): Promise<SemanticContext> {
    
    // Cache kontrolü
    const cacheKey = this.generateCacheKey(userInput, conversationHistory);
    if (this.semanticCache.has(cacheKey)) {
      return this.semanticCache.get(cacheKey)!;
    }

    const normalizedInput = this.normalizeInput(userInput);
    
    // 1. Temel linguistic analiz
    const linguisticAnalysis = this.performLinguisticAnalysis(normalizedInput);
    
    // 2. Bağlamsal ipuçlarını topla
    const contextualClues = this.extractContextualClues(normalizedInput, conversationHistory);
    
    // 3. Varlık tanıma ve ilişki çıkarımı
    const entities = this.extractEntities(normalizedInput, linguisticAnalysis);
    const relationships = this.inferRelationships(entities, contextualClues);
    
    // 4. Niyet sınıflandırması
    const intent = this.classifyIntent(normalizedInput, entities, relationships);
    
    // 5. Bilgi kaynakları arama
    const knowledgeResults = await this.searchKnowledgeSources(
      normalizedInput, entities, intent, trainingData
    );
    
    // 6. Anlamsal çıkarım
    const inferredMeaning = this.inferMeaning(
      intent, entities, relationships, knowledgeResults, contextualClues
    );
    
    // 7. Olası yanıtları oluştur
    const possibleResponses = this.generatePossibleResponses(
      inferredMeaning, knowledgeResults, intent
    );
    
    // 8. Güven skoru hesapla
    const confidence = this.calculateConfidence(
      intent, entities, knowledgeResults, contextualClues
    );

    const semanticContext: SemanticContext = {
      intent,
      entities,
      relationships,
      confidence,
      contextualClues,
      inferredMeaning,
      possibleResponses
    };

    // Cache'e kaydet
    this.semanticCache.set(cacheKey, semanticContext);
    
    return semanticContext;
  }

  /**
   * Dilbilimsel analiz
   */
  private performLinguisticAnalysis(input: string): any {
    const words = input.toLowerCase().split(/\s+/);
    const analysis = {
      words: [],
      syntax: {
        subject: null,
        predicate: null,
        object: null,
        modifiers: []
      },
      morphology: [],
      semanticFields: []
    };

    words.forEach((word, index) => {
      const dictionaryEntry = this.dictionary ? this.dictionary.getWord(word) : null;
      const wordAnalysis = {
        text: word,
        position: index,
        type: dictionaryEntry?.type || 'unknown',
        meanings: dictionaryEntry?.meaning || [],
        root: this.extractRoot(word),
        suffixes: this.extractSuffixes(word),
        semanticWeight: this.calculateSemanticWeight(word, dictionaryEntry)
      };

      analysis.words.push(wordAnalysis);

      // Sözcüksel rolleri belirle
      if (dictionaryEntry) {
        switch (dictionaryEntry.type) {
          case 'isim':
            if (!analysis.syntax.subject && index < words.length / 2) {
              analysis.syntax.subject = word;
            } else if (!analysis.syntax.object) {
              analysis.syntax.object = word;
            }
            break;
          case 'fiil':
            analysis.syntax.predicate = word;
            break;
          case 'sıfat':
            analysis.syntax.modifiers.push(word);
            break;
        }
      }
    });

    return analysis;
  }

  /**
   * Bağlamsal ipuçları çıkarımı
   */
  private extractContextualClues(input: string, history: string[]): string[] {
    const clues: string[] = [];
    
    // Zaman ifadeleri
    const timePatterns = [
      /dün|bugün|yarın|geçen|önce|sonra|şimdi|henüz|hâlâ/g,
      /sabah|öğle|akşam|gece|sabahleyin/g,
      /hafta|ay|yıl|gün|saat|dakika/g
    ];
    
    timePatterns.forEach(pattern => {
      const matches = input.match(pattern);
      if (matches) {
        clues.push(...matches.map(m => `time:${m}`));
      }
    });

    // Duygusal ifadeler
    const emotionPatterns = [
      /mutlu|üzgün|kızgın|sevinçli|endişeli|heyecanlı/g,
      /seviyorum|nefret|beğeniyorum|hoşlanıyorum/g
    ];
    
    emotionPatterns.forEach(pattern => {
      const matches = input.match(pattern);
      if (matches) {
        clues.push(...matches.map(m => `emotion:${m}`));
      }
    });

    // Referanslar (bu, şu, o)
    if (/\b(bu|şu|o)\b/.test(input)) {
      clues.push('reference:demonstrative');
      
      // Son konuşmalardan referans bul
      if (history.length > 0) {
        const lastTopic = this.extractMainTopic(history[history.length - 1]);
        if (lastTopic) {
          clues.push(`reference:${lastTopic}`);
        }
      }
    }

    // Soru kalıpları
    const questionWords = ['ne', 'kim', 'nerede', 'nasıl', 'neden', 'hangi', 'kaç'];
    questionWords.forEach(qword => {
      if (input.includes(qword)) {
        clues.push(`question:${qword}`);
      }
    });

    return clues;
  }

  /**
   * Varlık çıkarımı (Named Entity Recognition)
   */
  private extractEntities(input: string, linguisticAnalysis: any): Entity[] {
    const entities: Entity[] = [];
    const words = input.split(/\s+/);

    linguisticAnalysis.words.forEach((wordInfo: any, index: number) => {
      const { text, type, meanings, semanticWeight } = wordInfo;
      
      // Varlık tipini belirle
      let entityType: Entity['type'] = 'concept';
      let role: Entity['role'] = 'context';
      
      // Büyük harfle başlayan kelimeler (özel isimler)
      if (/^[A-ZÇĞIİÖŞÜ]/.test(words[index])) {
        entityType = this.classifyProperNoun(text);
      } else {
        // Sözlük tipine göre varlık tipi
        switch (type) {
          case 'isim':
            entityType = 'thing';
            role = index < words.length / 2 ? 'subject' : 'object';
            break;
          case 'fiil':
            entityType = 'action';
            role = 'predicate';
            break;
          case 'sıfat':
            entityType = 'quality';
            role = 'modifier';
            break;
          case 'zamir':
            entityType = 'person';
            role = 'subject';
            break;
        }
      }

      // Duygusal kelimeler
      if (this.isEmotionalWord(text)) {
        entityType = 'emotion';
      }

      // Zaman ifadeleri
      if (this.isTimeExpression(text)) {
        entityType = 'time';
      }

      entities.push({
        text,
        type: entityType,
        role,
        confidence: Math.min(1, semanticWeight + (meanings.length * 0.1))
      });
    });

    return entities.filter(e => e.confidence > 0.3);
  }

  /**
   * İlişki çıkarımı
   */
  private inferRelationships(entities: Entity[], contextualClues: string[]): Relationship[] {
    const relationships: Relationship[] = [];
    
    // Subject-Predicate-Object ilişkileri
    const subject = entities.find(e => e.role === 'subject');
    const predicate = entities.find(e => e.role === 'predicate');
    const object = entities.find(e => e.role === 'object');
    
    if (subject && predicate) {
      relationships.push({
        source: subject.text,
        target: predicate.text,
        type: 'requires',
        strength: 0.8
      });
    }
    
    if (predicate && object) {
      relationships.push({
        source: predicate.text,
        target: object.text,
        type: 'requires',
        strength: 0.7
      });
    }

    // Modifiers ile ana varlıklar arası ilişki
    const modifiers = entities.filter(e => e.role === 'modifier');
    const mainEntities = entities.filter(e => e.role !== 'modifier');
    
    modifiers.forEach(modifier => {
      mainEntities.forEach(entity => {
        relationships.push({
          source: modifier.text,
          target: entity.text,
          type: 'describes',
          strength: 0.6
        });
      });
    });

    // Bağlamsal ipuçlarına dayalı ilişkiler
    contextualClues.forEach(clue => {
      if (clue.startsWith('time:')) {
        const timeEntity = clue.split(':')[1];
        entities.forEach(entity => {
          if (entity.type !== 'time') {
            relationships.push({
              source: timeEntity,
              target: entity.text,
              type: 'temporal',
              strength: 0.5
            });
          }
        });
      }
    });

    return relationships;
  }

  /**
   * Niyet sınıflandırması
   */
  private classifyIntent(
    input: string, 
    entities: Entity[], 
    relationships: Relationship[]
  ): string {
    let maxScore = 0;
    let bestIntent = 'unknown';

    this.intentClassifiers.forEach((classifier, intent) => {
      const score = classifier(input);
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    });

    // Varlık tipelerine göre niyet düzeltmesi
    const hasQuestion = entities.some(e => 
      ['ne', 'kim', 'nerede', 'nasıl', 'neden'].includes(e.text)
    );
    
    if (hasQuestion && bestIntent === 'unknown') {
      bestIntent = 'information_request';
    }

    // Duygusal varlıklar varsa
    const hasEmotion = entities.some(e => e.type === 'emotion');
    if (hasEmotion) {
      bestIntent = bestIntent === 'unknown' ? 'emotional_expression' : bestIntent;
    }

    return bestIntent;
  }

  /**
   * Bilgi kaynaklarında arama
   */
  private async searchKnowledgeSources(
    input: string,
    entities: Entity[],
    intent: string,
    trainingData: TrainingPair[]
  ): Promise<{
    trainingMatches: TrainingPair[];
    dictionaryMatches: any[];
    memoryMatches: any[];
    directAnswer: string | null;
  }> {
    
    // Eğitim verilerinde arama
    const trainingMatches = this.searchTrainingData(input, entities, trainingData);
    
    // Sözlük araması
    const dictionaryMatches = this.searchDictionary(entities);
    
    // Bellek araması
    const memoryMatches = this.memorySystem.findSimilarMemories(input, 5);
    
    // Direkt cevap arama
    const directAnswer = this.findDirectAnswer(input, trainingMatches, entities);

    return {
      trainingMatches,
      dictionaryMatches,
      memoryMatches,
      directAnswer
    };
  }

  /**
   * Eğitim verilerinde akıllı arama
   */
  private searchTrainingData(
    input: string, 
    entities: Entity[], 
    trainingData: TrainingPair[]
  ): TrainingPair[] {
    const inputWords = input.toLowerCase().split(/\s+/);
    const entityTexts = entities.map(e => e.text.toLowerCase());
    
    return trainingData
      .map(pair => {
        const pairWords = pair.input.toLowerCase().split(/\s+/);
        
        // Direkt eşleşme
        if (pair.input.toLowerCase() === input.toLowerCase()) {
          return { pair, score: 1.0 };
        }
        
        // Kelime bazlı benzerlik
        const wordMatches = inputWords.filter(word => pairWords.includes(word)).length;
        const wordScore = wordMatches / Math.max(inputWords.length, pairWords.length);
        
        // Varlık bazlı benzerlik
        const entityMatches = entityTexts.filter(entity => 
          pair.input.toLowerCase().includes(entity)
        ).length;
        const entityScore = entityTexts.length > 0 ? entityMatches / entityTexts.length : 0;
        
        // Semantic benzerlik
        const semanticScore = this.calculateSemanticSimilarity(input, pair.input);
        
        const totalScore = (wordScore * 0.4) + (entityScore * 0.3) + (semanticScore * 0.3);
        
        return { pair, score: totalScore };
      })
      .filter(item => item.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.pair);
  }

  /**
   * Sözlük araması
   */
  private searchDictionary(entities: Entity[]): any[] {
    const matches: any[] = [];
    
    entities.forEach(entity => {
      const entry = this.dictionary.getWord(entity.text);
      if (entry) {
        matches.push({
          word: entity.text,
          entry,
          relevance: entity.confidence
        });
      }
    });
    
    return matches.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Direkt cevap bulma
   */
  private findDirectAnswer(
    input: string, 
    trainingMatches: TrainingPair[], 
    entities: Entity[]
  ): string | null {
    
    // En iyi eşleşme varsa
    if (trainingMatches.length > 0) {
      const bestMatch = trainingMatches[0];
      const similarity = this.calculateSemanticSimilarity(input, bestMatch.input);
      
      if (similarity > 0.8) {
        return bestMatch.output;
      }
    }

    // Sözlük tanımları için
    const questionEntity = entities.find(e => 
      ['ne', 'nedir', 'kim', 'kimdir'].includes(e.text)
    );
    
    if (questionEntity) {
      const targetWord = entities.find(e => 
        e.type === 'thing' || e.type === 'concept' || e.type === 'person'
      );
      
      if (targetWord) {
        const entry = this.dictionary.getWord(targetWord.text);
        if (entry) {
          return `${targetWord.text}: ${entry.meaning[0]}`;
        }
      }
    }

    return null;
  }

  /**
   * Anlam çıkarımı
   */
  private inferMeaning(
    intent: string,
    entities: Entity[],
    relationships: Relationship[],
    knowledgeResults: any,
    contextualClues: string[]
  ): string {
    
    // Direkt cevap varsa
    if (knowledgeResults.directAnswer) {
      return knowledgeResults.directAnswer;
    }

    // Intent bazlı çıkarım
    switch (intent) {
      case 'information_request':
        return this.generateInformationResponse(entities, knowledgeResults);
      
      case 'greeting':
        return this.generateGreetingResponse(contextualClues);
      
      case 'emotional_expression':
        return this.generateEmotionalResponse(entities);
      
      case 'definition_request':
        return this.generateDefinitionResponse(entities, knowledgeResults);
      
      default:
        return this.generateGenericResponse(entities, relationships, knowledgeResults);
    }
  }

  /**
   * Bilgi isteği yanıtı
   */
  private generateInformationResponse(entities: Entity[], knowledgeResults: any): string {
    if (knowledgeResults.trainingMatches.length > 0) {
      return knowledgeResults.trainingMatches[0].output;
    }
    
    if (knowledgeResults.memoryMatches.length > 0) {
      return knowledgeResults.memoryMatches[0].content;
    }
    
    const mainEntity = entities.find(e => e.type === 'thing' || e.type === 'concept');
    if (mainEntity) {
      return `${mainEntity.text} hakkında daha fazla bilgi verebilir misiniz?`;
    }
    
    return "Bu konu hakkında daha detaylı bilgi verebilir misiniz?";
  }

  /**
   * Selamlama yanıtı
   */
  private generateGreetingResponse(contextualClues: string[]): string {
    const timeClue = contextualClues.find(c => c.startsWith('time:'));
    
    if (timeClue?.includes('sabah')) {
      return "Günaydın! Size nasıl yardımcı olabilirim?";
    } else if (timeClue?.includes('akşam')) {
      return "İyi akşamlar! Ne yapabilirim sizin için?";
    }
    
    return "Merhaba! Size nasıl yardımcı olabilirim?";
  }

  /**
   * Duygusal ifade yanıtı
   */
  private generateEmotionalResponse(entities: Entity[]): string {
    const emotion = entities.find(e => e.type === 'emotion');
    
    if (emotion) {
      const positiveEmotions = ['mutlu', 'sevinçli', 'heyecanlı'];
      const negativeEmotions = ['üzgün', 'kızgın', 'endişeli'];
      
      if (positiveEmotions.includes(emotion.text)) {
        return "Bu harika! Mutluluğunuza ortak olmak güzel. 😊";
      } else if (negativeEmotions.includes(emotion.text)) {
        return "Üzgünüm, böyle hissediyorsunuz. Size nasıl yardımcı olabilirim? 🤗";
      }
    }
    
    return "Duygularınızı anlıyorum. Daha fazlasını anlatmak ister misiniz?";
  }

  /**
   * Tanım isteği yanıtı
   */
  private generateDefinitionResponse(entities: Entity[], knowledgeResults: any): string {
    if (knowledgeResults.dictionaryMatches.length > 0) {
      const match = knowledgeResults.dictionaryMatches[0];
      return `${match.word}: ${match.entry.meaning[0]}`;
    }
    
    const targetEntity = entities.find(e => e.type === 'thing' || e.type === 'concept');
    if (targetEntity) {
      return `"${targetEntity.text}" kelimesinin tanımını sözlükte bulamadım. Bana öğretebilir misiniz?`;
    }
    
    return "Hangi kelimenin tanımını istiyorsunuz?";
  }

  /**
   * Genel yanıt
   */
  private generateGenericResponse(
    entities: Entity[], 
    relationships: Relationship[], 
    knowledgeResults: any
  ): string {
    
    if (knowledgeResults.trainingMatches.length > 0) {
      return knowledgeResults.trainingMatches[0].output;
    }
    
    if (knowledgeResults.memoryMatches.length > 0) {
      return knowledgeResults.memoryMatches[0].content;
    }
    
    const mainEntities = entities.filter(e => e.confidence > 0.6);
    if (mainEntities.length > 0) {
      const entityNames = mainEntities.map(e => e.text).join(', ');
      return `${entityNames} hakkında konuşuyorsunuz. Bu konuda daha spesifik bir soru sorabilir misiniz?`;
    }
    
    return "Size nasıl yardımcı olabilirim?";
  }

  /**
   * Olası yanıtları oluştur
   */
  private generatePossibleResponses(
    inferredMeaning: string,
    knowledgeResults: any,
    intent: string
  ): string[] {
    const responses = [inferredMeaning];
    
    // Alternatif yanıtlar
    if (knowledgeResults.trainingMatches.length > 1) {
      responses.push(knowledgeResults.trainingMatches[1].output);
    }
    
    if (knowledgeResults.memoryMatches.length > 0) {
      responses.push(knowledgeResults.memoryMatches[0].content);
    }
    
    // Intent bazlı alternatifler
    switch (intent) {
      case 'greeting':
        responses.push("Selam!", "Merhaba! Nasıl gidiyor?");
        break;
      case 'information_request':
        responses.push("Bu konuda daha fazla bilgiye ihtiyacım var.", "Daha detayına inelim mi?");
        break;
    }
    
    return [...new Set(responses)].slice(0, 3);
  }

  /**
   * Güven skoru hesaplama
   */
  private calculateConfidence(
    intent: string,
    entities: Entity[],
    knowledgeResults: any,
    contextualClues: string[]
  ): number {
    let confidence = 0.5; // Temel güven
    
    // Direkt cevap varsa
    if (knowledgeResults.directAnswer) {
      confidence += 0.4;
    }
    
    // Eğitim eşleşmeleri
    if (knowledgeResults.trainingMatches.length > 0) {
      confidence += 0.2 * knowledgeResults.trainingMatches.length;
    }
    
    // Varlık güveni
    const avgEntityConfidence = entities.length > 0 
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length 
      : 0;
    confidence += avgEntityConfidence * 0.2;
    
    // Bağlamsal ipuçları
    confidence += contextualClues.length * 0.05;
    
    // Intent kesinliği
    if (intent !== 'unknown') {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }

  // Yardımcı metodlar
  private initializePatterns(): void {
    this.contextPatterns.set('question', /\b(ne|kim|nerede|nasıl|neden|hangi|kaç)\b/i);
    this.contextPatterns.set('time', /\b(dün|bugün|yarın|şimdi|sonra|önce)\b/i);
    this.contextPatterns.set('emotion', /\b(mutlu|üzgün|kızgın|sevinçli|endişeli)\b/i);
  }

  private initializeIntentClassifiers(): void {
    this.intentClassifiers.set('greeting', (text: string) => {
      const greetings = ['merhaba', 'selam', 'selamün', 'günaydın', 'iyi akşamlar'];
      return greetings.some(g => text.toLowerCase().includes(g)) ? 0.9 : 0;
    });

    this.intentClassifiers.set('information_request', (text: string) => {
      const questionWords = ['ne', 'kim', 'nerede', 'nasıl', 'neden', 'hangi'];
      return questionWords.some(q => text.toLowerCase().includes(q)) ? 0.8 : 0;
    });

    this.intentClassifiers.set('definition_request', (text: string) => {
      return /\b\w+\s+(nedir|ne demek|anlamı ne)\b/i.test(text) ? 0.85 : 0;
    });
  }

  private normalizeInput(input: string): string {
    return input.trim().replace(/[^\w\sçğıöşüÇĞIİÖŞÜ]/g, '').toLowerCase();
  }

  private generateCacheKey(input: string, history: string[]): string {
    return `${input.toLowerCase()}_${history.slice(-2).join('_')}`;
  }

  private extractRoot(word: string): string {
    // Basit kök çıkarımı - geliştirilmeli
    const suffixes = ['ler', 'lar', 'den', 'dan', 'de', 'da', 'yi', 'yı', 'yu', 'yü'];
    for (const suffix of suffixes) {
      if (word.endsWith(suffix)) {
        return word.slice(0, -suffix.length);
      }
    }
    return word;
  }

  private extractSuffixes(word: string): string[] {
    const root = this.extractRoot(word);
    return word.length > root.length ? [word.slice(root.length)] : [];
  }

  private calculateSemanticWeight(word: string, entry: any): number {
    let weight = 0.5;
    if (entry) {
      weight += entry.meaning.length * 0.1;
      if (entry.examples) weight += entry.examples.length * 0.05;
    }
    return Math.min(1, weight);
  }

  private classifyProperNoun(word: string): Entity['type'] {
    // Basit özel isim sınıflandırması
    const places = ['ankara', 'istanbul', 'izmir', 'türkiye'];
    if (places.includes(word.toLowerCase())) return 'place';
    return 'person';
  }

  private isEmotionalWord(word: string): boolean {
    const emotions = ['mutlu', 'üzgün', 'kızgın', 'sevinçli', 'endişeli', 'heyecanlı'];
    return emotions.includes(word.toLowerCase());
  }

  private isTimeExpression(word: string): boolean {
    const timeWords = ['dün', 'bugün', 'yarın', 'şimdi', 'sonra', 'önce', 'sabah', 'akşam'];
    return timeWords.includes(word.toLowerCase());
  }

  private extractMainTopic(text: string): string | null {
    const words = text.split(/\s+/);
    // En uzun kelimeyi ana konu olarak al (basit yaklaşım)
    return words.reduce((longest, word) => 
      word.length > longest.length ? word : longest, ''
    );
  }

  private calculateSemanticSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }
}
