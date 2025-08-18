
/**
 * Gelişmiş İnternet Öğrenme Sistemi
 * Kullanıcı isteğini anlayıp, alakalı bilgileri bulup analiz eden akıllı sistem
 */

export interface SearchResult {
  title: string;
  content: string;
  url: string;
  relevance: number;
  timestamp: number;
  domain?: string;
  snippet?: string;
}

export interface QueryAnalysis {
  intent: 'factual' | 'definition' | 'comparison' | 'current_events' | 'howto' | 'opinion';
  keywords: string[];
  entities: string[];
  questionType: 'what' | 'where' | 'when' | 'who' | 'why' | 'how' | 'which' | 'general';
  specificity: number; // 0-1 arası, ne kadar spesifik
  context: string[];
}

export interface SynthesizedResponse {
  mainAnswer: string;
  supportingDetails: string[];
  sources: string[];
  confidence: number;
  completeness: number; // Cevabın ne kadar eksiksiz olduğu
}

export interface LearningData {
  query: string;
  analysis: QueryAnalysis;
  results: SearchResult[];
  synthesis: string;
  detailedResponse: SynthesizedResponse;
  concepts: string[];
  timestamp: number;
}

export class InternetLearningSystem {
  private isConnected: boolean = false;
  private learningHistory: LearningData[] = [];
  private maxHistorySize: number = 100;

  constructor() {
    this.loadLearningHistory();
  }

  /**
   * İnternet bağlantısını aktifleştir
   */
  enableInternetConnection(): boolean {
    this.isConnected = true;
    console.log('🌐 Gelişmiş İnternet öğrenme sistemi aktifleştirildi');
    return true;
  }

  /**
   * İnternet bağlantısını kapat
   */
  disableInternetConnection(): boolean {
    this.isConnected = false;
    console.log('🔌 İnternet öğrenme sistemi devre dışı');
    return true;
  }

  /**
   * İnternet bağlantı durumu
   */
  isInternetEnabled(): boolean {
    return this.isConnected;
  }

  /**
   * Gelişmiş internet araması ve analiz sistemi
   */
  async searchAndLearn(query: string): Promise<LearningData | null> {
    if (!this.isConnected) {
      console.log('❌ İnternet bağlantısı kapalı');
      return null;
    }

    try {
      console.log(`🧠 Gelişmiş analiz başlatılıyor: "${query}"`);
      
      // 1. Kullanıcı sorgusunu derinlemesine analiz et
      const queryAnalysis = this.analyzeUserQuery(query);
      console.log(`🔍 Gelişmiş sorgu analizi:`, queryAnalysis);

      // 2. Analiz sonucuna göre en uygun arama stratejisi belirle
      const searchStrategy = this.determineSearchStrategy(queryAnalysis);
      console.log(`📋 Optimize edilmiş arama stratejisi: ${searchStrategy}`);

      // 3. Çoklu strateji ile arama yap
      const searchResults = await this.performMultiStrategySearch(query, queryAnalysis, searchStrategy);
      
      if (searchResults.length === 0) {
        console.log('❌ İnternet aramasında yeterli sonuç bulunamadı');
        return null;
      }

      // 4. Sonuçları kalite ve alakalılık açısından filtrele
      const filteredResults = this.qualityFilterResults(searchResults, queryAnalysis);
      console.log(`🔍 ${filteredResults.length} yüksek kaliteli sonuç filtrelendi`);

      // 5. Alakalı bilgileri çıkar ve sentezle
      const synthesizedResponse = this.createPreciseSynthesis(query, queryAnalysis, filteredResults);
      console.log(`🎯 Hassas sentez oluşturuldu: %${(synthesizedResponse.confidence * 100).toFixed(1)} güven`);

      // 6. Sadece alakalı kavramları çıkar
      const concepts = this.extractRelevantConcepts(filteredResults, queryAnalysis);

      // 7. Kalite kontrolü - saçma cevapları engelle
      if (!this.isResponseValid(synthesizedResponse.mainAnswer, query, queryAnalysis)) {
        console.log('❌ Üretilen cevap kalite kontrolünden geçemedi');
        return null;
      }

      const learningData: LearningData = {
        query,
        analysis: queryAnalysis,
        results: filteredResults,
        synthesis: synthesizedResponse.mainAnswer,
        detailedResponse: synthesizedResponse,
        concepts,
        timestamp: Date.now()
      };

      // Öğrenme geçmişine ekle
      this.addToLearningHistory(learningData);

      console.log(`✅ Gelişmiş öğrenme tamamlandı: ${concepts.length} kavram, %${(synthesizedResponse.completeness * 100).toFixed(1)} tamlık`);
      return learningData;

    } catch (error) {
      console.error('❌ Gelişmiş öğrenme hatası:', error);
      return null;
    }
  }

  /**
   * Kullanıcı sorgusunu derinlemesine analiz et
   */
  private analyzeUserQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase().trim();
    
    // Soru tipini belirle
    let questionType: QueryAnalysis['questionType'] = 'general';
    if (lowerQuery.includes('nedir') || lowerQuery.includes('ne demek')) questionType = 'what';
    else if (lowerQuery.includes('nerede') || lowerQuery.includes('hangi')) questionType = 'where';
    else if (lowerQuery.includes('ne zaman') || lowerQuery.includes('kaç')) questionType = 'when';
    else if (lowerQuery.includes('kim') || lowerQuery.includes('kimdir')) questionType = 'who';
    else if (lowerQuery.includes('neden') || lowerQuery.includes('niçin')) questionType = 'why';
    else if (lowerQuery.includes('nasıl') || lowerQuery.includes('ne şekilde')) questionType = 'how';

    // Intent belirleme
    let intent: QueryAnalysis['intent'] = 'factual';
    if (questionType === 'what' && (lowerQuery.includes('nedir') || lowerQuery.includes('tanım'))) {
      intent = 'definition';
    } else if (lowerQuery.includes('haber') || lowerQuery.includes('güncel') || lowerQuery.includes('son')) {
      intent = 'current_events';
    } else if (questionType === 'how' || lowerQuery.includes('nasıl yapılır')) {
      intent = 'howto';
    } else if (lowerQuery.includes('karşılaştır') || lowerQuery.includes('fark')) {
      intent = 'comparison';
    }

    // Anahtar kelimeleri çıkar
    const stopWords = ['ve', 'ile', 'bir', 'bu', 'şu', 'o', 'da', 'de', 'ta', 'te', 'nedir', 'nasıl', 'nerede', 'kim', 'ne', 'hangi'];
    const keywords = lowerQuery
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 8);

    // Varlıkları belirle (büyük harfle başlayan kelimeler ve özel terimler)
    const entities = query.split(/\s+/)
      .filter(word => /^[A-ZÇĞIİÖŞÜ]/.test(word) || word.length > 6)
      .slice(0, 5);

    // Spesifiklik hesapla
    const specificity = Math.min(1, (keywords.length + entities.length) / 10);

    // Bağlam çıkar
    const context = [];
    if (lowerQuery.includes('türkiye') || lowerQuery.includes('türk')) context.push('turkey');
    if (lowerQuery.includes('tarih') || lowerQuery.includes('geçmiş')) context.push('historical');
    if (lowerQuery.includes('son') || lowerQuery.includes('güncel')) context.push('recent');

    return {
      intent,
      keywords,
      entities,
      questionType,
      specificity,
      context
    };
  }

  /**
   * Analiz sonucuna göre arama stratejisi belirle
   */
  private determineSearchStrategy(analysis: QueryAnalysis): string {
    if (analysis.intent === 'current_events') {
      return 'news_focused';
    } else if (analysis.intent === 'definition') {
      return 'authoritative_sources';
    } else if (analysis.intent === 'howto') {
      return 'instructional_content';
    } else if (analysis.questionType === 'where' || analysis.entities.length > 0) {
      return 'factual_precise';
    } else if (analysis.specificity > 0.7) {
      return 'specialized_search';
    }
    return 'comprehensive_search';
  }

  /**
   * Çoklu strateji ile gelişmiş internet araması
   */
  private async performMultiStrategySearch(
    query: string, 
    analysis: QueryAnalysis, 
    primaryStrategy: string
  ): Promise<SearchResult[]> {
    try {
      // Ana stratejiyle arama yap
      const primaryResults = await this.performSingleStrategySearch(query, analysis, primaryStrategy);
      
      // Yedek stratejiler belirle
      const backupStrategies = this.getBackupStrategies(primaryStrategy, analysis);
      
      let allResults = [...primaryResults];
      
      // Yetersiz sonuç varsa yedek stratejileri dene
      if (primaryResults.length < 3) {
        console.log('🔄 Yetersiz sonuç, yedek stratejiler deneniyor...');
        
        for (const strategy of backupStrategies) {
          const backupResults = await this.performSingleStrategySearch(query, analysis, strategy);
          allResults.push(...backupResults);
          
          if (allResults.length >= 5) break;
        }
      }
      
      // Sonuçları benzersizleştir ve sırala
      return this.deduplicateAndSort(allResults, analysis);
      
    } catch (error) {
      console.error('Çoklu strateji arama hatası:', error);
      return this.getEnhancedFallbackData(query, analysis);
    }
  }

  /**
   * Tek strateji ile arama
   */
  private async performSingleStrategySearch(
    query: string, 
    analysis: QueryAnalysis, 
    strategy: string
  ): Promise<SearchResult[]> {
    try {
      const optimizedQuery = this.optimizeQuery(query, analysis, strategy);
      console.log(`🎯 ${strategy} stratejisi: "${optimizedQuery}"`);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: optimizedQuery,
          strategy,
          analysis 
        })
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (data.success && data.results && Array.isArray(data.results)) {
        return data.results.map((result: any) => ({
          title: result.title || '',
          content: result.content || result.snippet || '',
          url: result.url || '',
          relevance: result.relevance || 0.5,
          timestamp: Date.now(),
          domain: result.domain || 'unknown',
          snippet: result.snippet || '',
          strategy: strategy
        }));
      }
      
      return [];
      
    } catch (error) {
      console.error(`${strategy} strateji hatası:`, error);
      return [];
    }
  }

  /**
   * Yedek stratejileri belirle
   */
  private getBackupStrategies(primaryStrategy: string, analysis: QueryAnalysis): string[] {
    const strategies = ['comprehensive_search', 'factual_precise', 'authoritative_sources', 'news_focused'];
    return strategies.filter(s => s !== primaryStrategy).slice(0, 2);
  }

  /**
   * Sonuçları benzersizleştir ve sırala
   */
  private deduplicateAndSort(results: SearchResult[], analysis: QueryAnalysis): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];
    
    for (const result of results) {
      const key = result.title.toLowerCase() + result.content.substring(0, 100).toLowerCase();
      if (!seen.has(key) && result.title && result.content) {
        seen.add(key);
        unique.push(result);
      }
    }
    
    return unique
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, 8);
  }

  /**
   * Sorguyu optimize et
   */
  private optimizeQuery(query: string, analysis: QueryAnalysis, strategy: string): string {
    let optimized = query;

    // Strategy'ye göre optimize et
    if (strategy === 'news_focused') {
      optimized += ' son haberler güncel';
    } else if (strategy === 'authoritative_sources') {
      optimized += ' vikipedia resmi kaynak';
    } else if (strategy === 'factual_precise') {
      optimized = analysis.keywords.join(' ') + ' ' + analysis.entities.join(' ');
    }

    return optimized;
  }

  /**
   * Gelişmiş fallback veriler
   */
  private getEnhancedFallbackData(query: string, analysis: QueryAnalysis): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    
    // Intent'e göre farklı veri setleri
    if (analysis.intent === 'definition') {
      return this.getDefinitionFallbacks(lowerQuery);
    } else if (analysis.intent === 'current_events') {
      return this.getNewsFallbacks(lowerQuery);
    } else if (analysis.questionType === 'where') {
      return this.getLocationFallbacks(lowerQuery);
    }

    // Genel fallback
    return this.getGeneralFallbacks(lowerQuery);
  }

  private getDefinitionFallbacks(query: string): SearchResult[] {
    const definitions = {
      'yapay zeka': {
        title: 'Yapay Zeka Tanımı',
        content: 'Yapay zeka (AI), makinelerin insan benzeri düşünme, öğrenme ve problem çözme yeteneklerini simüle ettiği teknoloji dalıdır. Makine öğrenmesi, derin öğrenme, doğal dil işleme ve computer vision gibi alt alanları içerir.',
        relevance: 0.95
      },
      'blockchain': {
        title: 'Blockchain Teknolojisi',
        content: 'Blockchain, dağıtık bir veritabanı teknolojisidir. Veriler bloklar halinde saklanır ve kriptografik bağlarla birbirine bağlanır. Bitcoin ve diğer kripto paraların temelini oluşturur.',
        relevance: 0.92
      }
    };

    for (const [key, data] of Object.entries(definitions)) {
      if (query.includes(key)) {
        return [{
          title: data.title,
          content: data.content,
          url: `https://example.com/${key}`,
          relevance: data.relevance,
          timestamp: Date.now(),
          domain: 'definition'
        }];
      }
    }

    return [];
  }

  private getNewsFallbacks(query: string): SearchResult[] {
    return [
      {
        title: 'Güncel Teknoloji Haberleri',
        content: 'Teknoloji dünyasında son gelişmeler: Yapay zeka alanındaki yenilikler, yeni ürün lansmanları ve teknolojik trendler.',
        url: 'https://example.com/tech-news',
        relevance: 0.85,
        timestamp: Date.now(),
        domain: 'news'
      }
    ];
  }

  private getLocationFallbacks(query: string): SearchResult[] {
    const locations = {
      'istanbul': {
        title: 'İstanbul - Türkiye\'nin En Büyük Şehri',
        content: 'İstanbul, Türkiye\'nin en kalabalık şehri ve ekonomik merkezidir. Boğaziçi\'nin iki yakasında kurulmuş olan şehir, hem Avrupa hem de Asya kıtalarında yer alır. Nüfusu yaklaşık 16 milyon kişidir.',
        relevance: 0.95
      },
      'ankara': {
        title: 'Ankara - Türkiye\'nin Başkenti',
        content: 'Ankara, Türkiye Cumhuriyeti\'nin başkenti ve İç Anadolu Bölgesi\'nde yer alan il merkezidir. Ülkenin ikinci en kalabalık şehri olup, siyasi ve idari merkezdir.',
        relevance: 0.94
      }
    };

    for (const [key, data] of Object.entries(locations)) {
      if (query.includes(key)) {
        return [{
          title: data.title,
          content: data.content,
          url: `https://example.com/${key}`,
          relevance: data.relevance,
          timestamp: Date.now(),
          domain: 'geography'
        }];
      }
    }

    return [];
  }

  private getGeneralFallbacks(query: string): SearchResult[] {
    return [
      {
        title: `${query} Hakkında Detaylı Bilgi`,
        content: `${query} konusunda kapsamlı bilgiler ve güncel veriler. Bu konu hakkında detaylı araştırmalar yapılmış ve güvenilir kaynaklardan derlenmiştir.`,
        url: `https://example.com/${encodeURIComponent(query)}`,
        relevance: 0.75,
        timestamp: Date.now(),
        domain: 'general'
      }
    ];
  }

  /**
   * Sonuçları kalite ve alakalılık açısından filtrele
   */
  private qualityFilterResults(results: SearchResult[], analysis: QueryAnalysis): SearchResult[] {
    return results
      .map(result => {
        // Gelişmiş kalite analizi
        const relevanceScore = this.calculatePreciseRelevance(result, analysis);
        const qualityScore = this.assessAdvancedContentQuality(result.content, analysis);
        const credibilityScore = this.assessSourceCredibility(result.domain || '');
        const completenessScore = this.assessResponseCompleteness(result.content, analysis);
        
        const finalScore = (relevanceScore * 0.4) + (qualityScore * 0.3) + (credibilityScore * 0.2) + (completenessScore * 0.1);
        
        return {
          ...result,
          relevance: finalScore,
          qualityMetrics: {
            relevanceScore,
            qualityScore,
            credibilityScore,
            completenessScore
          }
        };
      })
      .filter(result => {
        // Sıkı kalite filtreleri
        return result.relevance > 0.4 && 
               result.content.length > 20 && 
               result.content.length < 2000 &&
               !this.containsJunkContent(result.content) &&
               this.isContentRelevant(result.content, analysis);
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
  }

  /**
   * Hassas alakalılık hesaplama
   */
  private calculatePreciseRelevance(result: SearchResult, analysis: QueryAnalysis): number {
    const content = (result.title + ' ' + result.content).toLowerCase();
    let score = 0;
    
    // Anahtar kelime tam eşleşmesi (ağırlıklı)
    const totalKeywords = analysis.keywords.length;
    if (totalKeywords > 0) {
      const exactMatches = analysis.keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      ).length;
      score += (exactMatches / totalKeywords) * 0.5;
    }
    
    // Varlık eşleşmesi (daha hassas)
    const totalEntities = analysis.entities.length;
    if (totalEntities > 0) {
      const entityMatches = analysis.entities.filter(entity => {
        const variations = [entity.toLowerCase(), entity.toLowerCase().replace('ı', 'i')];
        return variations.some(variation => content.includes(variation));
      }).length;
      score += (entityMatches / totalEntities) * 0.3;
    }
    
    // Soru tipine özel puanlama
    const questionBonus = this.getQuestionTypeBonus(content, analysis.questionType);
    score += questionBonus * 0.2;
    
    return Math.min(1, score);
  }

  /**
   * Gelişmiş içerik kalitesi değerlendirmesi
   */
  private assessAdvancedContentQuality(content: string, analysis: QueryAnalysis): number {
    let quality = 0.3; // Başlangıç puanı
    
    // Uzunluk optimizasyonu
    if (content.length >= 50 && content.length <= 800) {
      quality += 0.2;
    }
    
    // Cümle yapısı ve tutarlılık
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
    if (sentences.length >= 2 && sentences.length <= 10) {
      quality += 0.15;
    }
    
    // Anlamlılık kontrolü
    if (!this.containsJunkContent(content)) {
      quality += 0.15;
    }
    
    // Intent'e uygun içerik
    if (this.matchesIntent(content, analysis.intent)) {
      quality += 0.2;
    }
    
    return Math.min(1, quality);
  }

  /**
   * Cevap tamlığı değerlendirmesi
   */
  private assessResponseCompleteness(content: string, analysis: QueryAnalysis): number {
    let completeness = 0.4;
    
    // Soru tipine göre gerekli bilgi varlığı
    if (analysis.questionType === 'what' && (content.includes('dir') || content.includes('dır'))) {
      completeness += 0.3;
    } else if (analysis.questionType === 'where' && (content.includes('yer alır') || content.includes('bulunur'))) {
      completeness += 0.3;
    } else if (analysis.questionType === 'when' && /\d{4}|\d{1,2}\s+(yıl|ay|gün)/.test(content)) {
      completeness += 0.3;
    } else if (analysis.questionType === 'who' && (content.includes('kim') || content.includes('kişi'))) {
      completeness += 0.3;
    }
    
    return Math.min(1, completeness);
  }

  /**
   * Saçma içerik kontrolü
   */
  private containsJunkContent(content: string): boolean {
    const junkPatterns = [
      /MODAL_TRIGGER/i,
      /error|undefined|null/i,
      /lorem ipsum/i,
      /test.*test/i,
      /click here|tıkla/i,
      /^(.)\1{10,}/, // Tekrarlanan karakterler
      /^\s*$/ // Boş içerik
    ];
    
    return junkPatterns.some(pattern => pattern.test(content));
  }

  /**
   * İçerik alakalılığı kontrolü
   */
  private isContentRelevant(content: String, analysis: QueryAnalysis): boolean {
    const lowerContent = content.toLowerCase();
    
    // En az bir anahtar kelime veya varlık içermeli
    const hasKeyword = analysis.keywords.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
    const hasEntity = analysis.entities.some(entity => 
      lowerContent.includes(entity.toLowerCase())
    );
    
    return hasKeyword || hasEntity;
  }

  /**
   * Soru tipi bonusu hesaplama
   */
  private getQuestionTypeBonus(content: string, questionType: QueryAnalysis['questionType']): number {
    const indicators = {
      'what': ['nedir', 'dir', 'dır', 'tanım', 'olan'],
      'where': ['nerede', 'yer alır', 'bulunur', 'kıta', 'bölge'],
      'when': ['zaman', 'tarih', 'yıl', 'ay', 'gün'],
      'who': ['kim', 'kişi', 'kurucu', 'başkan'],
      'why': ['neden', 'çünkü', 'sebebi', 'nedeni'],
      'how': ['nasıl', 'şekilde', 'yöntem', 'biçim']
    };
    
    const typeIndicators = indicators[questionType] || [];
    const matches = typeIndicators.filter(indicator => content.includes(indicator)).length;
    
    return Math.min(1, matches / typeIndicators.length);
  }

  /**
   * Intent eşleşmesi kontrolü
   */
  private matchesIntent(content: string, intent: QueryAnalysis['intent']): boolean {
    const intentPatterns = {
      'definition': /tanım|nedir|dir|dır|olan|olarak/i,
      'factual': /bilgi|veri|gerçek|doğru/i,
      'current_events': /güncel|son|haber|yeni/i,
      'howto': /nasıl|yöntem|adım|şekilde/i,
      'comparison': /fark|karşı|benzer|göre/i
    };
    
    const pattern = intentPatterns[intent];
    return pattern ? pattern.test(content) : true;
  }

  /**
   * Gelişmiş alakalılık hesaplama
   */
  private calculateEnhancedRelevance(result: SearchResult, analysis: QueryAnalysis): number {
    let score = 0;
    const content = (result.title + ' ' + result.content).toLowerCase();
    
    // Anahtar kelime eşleşmesi
    const keywordMatches = analysis.keywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    ).length;
    score += (keywordMatches / analysis.keywords.length) * 0.4;
    
    // Varlık eşleşmesi
    const entityMatches = analysis.entities.filter(entity => 
      content.includes(entity.toLowerCase())
    ).length;
    score += (entityMatches / Math.max(1, analysis.entities.length)) * 0.3;
    
    // Intent uyumu
    if (analysis.intent === 'definition' && (content.includes('tanım') || content.includes('nedir'))) {
      score += 0.2;
    } else if (analysis.intent === 'current_events' && content.includes('güncel')) {
      score += 0.2;
    }
    
    // Soru tipi uyumu
    if (analysis.questionType === 'where' && (content.includes('yer') || content.includes('bulun'))) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }

  /**
   * İçerik kalitesini değerlendir
   */
  private assessContentQuality(content: string): number {
    let quality = 0.5;
    
    // Uzunluk kontrolü
    if (content.length > 50 && content.length < 500) {
      quality += 0.2;
    }
    
    // Cümle yapısı
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length >= 2) {
      quality += 0.2;
    }
    
    // Anlamlılık
    if (!content.includes('MODAL_TRIGGER') && 
        !content.toLowerCase().includes('error') &&
        !content.toLowerCase().includes('undefined')) {
      quality += 0.1;
    }
    
    return Math.min(1, quality);
  }

  /**
   * Kaynak güvenilirliği değerlendirme
   */
  private assessSourceCredibility(domain: string): number {
    const trustworthy = ['wikipedia', 'edu', 'gov', 'org'];
    const reliable = ['news', 'official', 'encyclopedia'];
    
    if (trustworthy.some(t => domain.includes(t))) {
      return 0.9;
    } else if (reliable.some(r => domain.includes(r))) {
      return 0.7;
    }
    
    return 0.5;
  }

  /**
   * Hassas sentez oluşturma
   */
  private createPreciseSynthesis(
    query: string, 
    analysis: QueryAnalysis, 
    results: SearchResult[]
  ): SynthesizedResponse {
    if (results.length === 0) {
      return {
        mainAnswer: '',
        supportingDetails: [],
        sources: [],
        confidence: 0,
        completeness: 0
      };
    }

    // En kaliteli sonuçları seç
    const bestResults = results.slice(0, 2);
    
    // Sorguya özel cevap üret
    const mainAnswer = this.generateTargetedAnswer(query, analysis, bestResults);
    
    // Destekleyici kanıtları çıkar
    const supportingDetails = this.extractSupportingEvidence(bestResults, analysis);
    
    // Güvenilir kaynakları listele
    const sources = bestResults
      .map(r => r.url)
      .filter(url => url && url !== 'https://example.com' && this.isValidUrl(url));
    
    // Hassas güven skoru hesapla
    const confidence = this.calculatePreciseConfidence(mainAnswer, bestResults, analysis, query);
    
    // Cevap tamlığını değerlendir
    const completeness = this.calculateAnswerCompleteness(mainAnswer, analysis, supportingDetails, query);

    return {
      mainAnswer,
      supportingDetails,
      sources,
      confidence,
      completeness
    };
  }

  /**
   * Hedeflenmiş cevap üretme
   */
  private generateTargetedAnswer(query: string, analysis: QueryAnalysis, results: SearchResult[]): string {
    if (results.length === 0) return '';

    const primaryResult = results[0];
    let content = this.cleanContent(primaryResult.content);
    
    if (content.length < 15) {
      content = results.length > 1 ? this.cleanContent(results[1].content) : '';
      if (content.length < 15) return '';
    }
    
    // Soru tipine göre özel cevap üretme
    let targetedAnswer = '';
    
    switch (analysis.questionType) {
      case 'what':
        targetedAnswer = this.extractDefinitiveAnswer(content, analysis);
        break;
      case 'where':
        targetedAnswer = this.extractLocationAnswer(content, analysis);
        break;
      case 'when':
        targetedAnswer = this.extractTimeAnswer(content, analysis);
        break;
      case 'who':
        targetedAnswer = this.extractPersonAnswer(content, analysis);
        break;
      case 'why':
        targetedAnswer = this.extractReasonAnswer(content, analysis);
        break;
      case 'how':
        targetedAnswer = this.extractMethodAnswer(content, analysis);
        break;
      default:
        targetedAnswer = this.extractBestMatch(content, analysis);
    }
    
    // Son kalite kontrolü
    if (this.isAnswerValid(targetedAnswer, query, analysis)) {
      return this.optimizeAnswer(targetedAnswer, analysis);
    }
    
    return '';
  }

  /**
   * İçerik temizleme
   */
  private cleanContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, '') // HTML etiketlerini kaldır
      .replace(/&[^;]+;/g, ' ') // HTML entity'lerini kaldır
      .replace(/\s+/g, ' ') // Fazla boşlukları kaldır
      .replace(/\n+/g, ' ') // Satır sonlarını kaldır
      .trim();
  }

  /**
   * Tanım cevabı çıkarma
   */
  private extractDefinitiveAnswer(content: string, analysis: QueryAnalysis): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Tanım bildiren cümleleri bul
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if ((trimmed.includes('dir') || trimmed.includes('dır') || 
           trimmed.includes('olan') || trimmed.includes('olarak')) &&
           analysis.keywords.some(keyword => trimmed.toLowerCase().includes(keyword.toLowerCase()))) {
        return trimmed;
      }
    }
    
    // İlk anlamlı cümleyi döndür
    return sentences[0]?.trim() || '';
  }

  /**
   * Konum cevabı çıkarma
   */
  private extractLocationAnswer(content: string, analysis: QueryAnalysis): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Konum bildiren cümleleri bul
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if ((trimmed.includes('yer alır') || trimmed.includes('bulunur') || 
           trimmed.includes('kıta') || trimmed.includes('bölge')) &&
           analysis.entities.some(entity => trimmed.toLowerCase().includes(entity.toLowerCase()))) {
        return trimmed;
      }
    }
    
    return sentences[0]?.trim() || '';
  }

  /**
   * Cevap geçerliliği kontrolü
   */
  private isAnswerValid(answer: string, query: string, analysis: QueryAnalysis): boolean {
    if (!answer || answer.length < 10 || answer.length > 300) return false;
    
    // Saçma içerik kontrolü
    if (this.containsJunkContent(answer)) return false;
    
    // Alakalılık kontrolü
    const hasRelevantKeyword = analysis.keywords.some(keyword => 
      answer.toLowerCase().includes(keyword.toLowerCase())
    );
    const hasRelevantEntity = analysis.entities.some(entity => 
      answer.toLowerCase().includes(entity.toLowerCase())
    );
    
    return hasRelevantKeyword || hasRelevantEntity;
  }

  /**
   * Cevabı optimize et
   */
  private optimizeAnswer(answer: string, analysis: QueryAnalysis): string {
    let optimized = answer.trim();
    
    // Uzunluk kontrolü
    if (optimized.length > 200) {
      const sentences = optimized.split(/[.!?]+/);
      optimized = sentences[0]?.trim() + (sentences.length > 1 ? '.' : '');
    }
    
    // Başlangıç ve bitiş temizleme
    optimized = optimized.replace(/^[.,;:]+|[.,;:]+$/g, '');
    
    return optimized;
  }

  /**
   * Hassas güven skoru hesaplama
   */
  private calculatePreciseConfidence(
    mainAnswer: string, 
    results: SearchResult[], 
    analysis: QueryAnalysis,
    originalQuery: string
  ): number {
    if (!mainAnswer) return 0;
    
    let confidence = 0.3;
    
    // Sonuç kalitesi
    const avgRelevance = results.reduce((sum, r) => sum + (r.relevance || 0), 0) / results.length;
    confidence += avgRelevance * 0.4;
    
    // Cevap içerik kalitesi
    if (mainAnswer.length >= 30 && mainAnswer.length <= 200) {
      confidence += 0.1;
    }
    
    // Anahtar kelime varlığı
    const keywordPresence = analysis.keywords.filter(keyword => 
      mainAnswer.toLowerCase().includes(keyword.toLowerCase())
    ).length / Math.max(1, analysis.keywords.length);
    confidence += keywordPresence * 0.15;
    
    // Soru tipine uygunluk
    if (this.answersQuestionType(mainAnswer, analysis.questionType)) {
      confidence += 0.05;
    }
    
    return Math.min(1, confidence);
  }

  /**
   * Soru tipine cevap uygunluğu
   */
  private answersQuestionType(answer: string, questionType: QueryAnalysis['questionType']): boolean {
    const typePatterns = {
      'what': /dir|dır|olan|olarak|tanım/i,
      'where': /yer alır|bulunur|kıta|bölge|nerede/i,
      'when': /\d{4}|yıl|tarih|zaman/i,
      'who': /kim|kişi|kurucu/i,
      'why': /çünkü|sebebi|nedeni/i,
      'how': /nasıl|yöntem|şekilde/i
    };
    
    const pattern = typePatterns[questionType];
    return pattern ? pattern.test(answer) : true;
  }

  /**
   * Yanıt geçerliliği kontrolü (son kalite kontrolü)
   */
  private isResponseValid(response: string, query: string, analysis: QueryAnalysis): boolean {
    // Temel kontrolller
    if (!response || response.length < 15 || response.length > 500) {
      return false;
    }
    
    // Saçma içerik kontrolü
    if (this.containsJunkContent(response)) {
      return false;
    }
    
    // Alakalılık kontrolü - sorguyla ilgili olmalı
    const queryWords = query.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    
    const commonWords = queryWords.filter(word => 
      word.length > 2 && responseWords.includes(word)
    );
    
    const relevanceRatio = commonWords.length / queryWords.length;
    
    return relevanceRatio >= 0.3; // En az %30 kelime benzerliği
  }

  /**
   * URL geçerliliği kontrolü
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return !url.includes('example.com') && url.startsWith('http');
    } catch {
      return false;
    }
  }

  /**
   * Ana cevabı oluştur
   */
  private generateMainAnswer(query: string, analysis: QueryAnalysis, results: SearchResult[]): string {
    if (results.length === 0) return '';

    const primaryResult = results[0];
    let content = primaryResult.content;
    
    // İçeriği temizle
    content = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    if (content.length < 20) return '';
    
    // Analiz tipine göre en iyi cevabı bul
    let bestAnswer = '';
    
    if (analysis.intent === 'definition') {
      bestAnswer = this.extractDefinition(content, analysis.keywords);
    } else if (analysis.questionType === 'where') {
      bestAnswer = this.extractLocationInfo(content, analysis.entities);
    } else {
      bestAnswer = this.extractBestSentence(content, analysis);
    }
    
    // Kalite kontrolü
    if (bestAnswer.length < 15 || 
        bestAnswer.includes('MODAL_TRIGGER') ||
        bestAnswer.toLowerCase().includes('error')) {
      return '';
    }
    
    // Maksimum uzunluk kontrolü
    if (bestAnswer.length > 150) {
      const sentences = bestAnswer.split(/[.!?]+/);
      bestAnswer = sentences[0] + (sentences.length > 1 ? '.' : '');
    }
    
    return bestAnswer;
  }

  /**
   * Tanım çıkarma
   */
  private extractDefinition(content: string, keywords: string[]): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Tanım içeren cümleyi bul
    for (const sentence of sentences) {
      if (sentence.includes('dir') || sentence.includes('dır') || 
          sentence.includes('olan') || sentence.includes('olarak')) {
        return sentence.trim();
      }
    }
    
    return sentences[0]?.trim() || '';
  }

  /**
   * Konum bilgisi çıkarma
   */
  private extractLocationInfo(content: string, entities: string[]): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Konum bilgisi içeren cümleyi bul
    for (const sentence of sentences) {
      if (sentence.includes('yer alır') || sentence.includes('bulunur') || 
          sentence.includes('konumlanır') || sentence.includes('kıtasında')) {
        return sentence.trim();
      }
    }
    
    return sentences[0]?.trim() || '';
  }

  /**
   * En iyi cümleyi çıkar
   */
  private extractBestSentence(content: string, analysis: QueryAnalysis): string {
    const sentences = content.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);
    
    if (sentences.length === 0) return content.substring(0, 100);

    let bestSentence = sentences[0];
    let maxScore = 0;
    
    for (const sentence of sentences.slice(0, 5)) {
      const score = this.calculateSentenceRelevance(sentence, analysis);
      
      if (score > maxScore) {
        maxScore = score;
        bestSentence = sentence;
      }
    }
    
    return bestSentence;
  }

  /**
   * Cümle alakalılığı hesaplama
   */
  private calculateSentenceRelevance(sentence: string, analysis: QueryAnalysis): number {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    
    // Anahtar kelime eşleşmesi
    analysis.keywords.forEach(keyword => {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        score += keyword.length > 4 ? 2 : 1;
      }
    });
    
    // Varlık eşleşmesi
    analysis.entities.forEach(entity => {
      if (lowerSentence.includes(entity.toLowerCase())) {
        score += 2;
      }
    });
    
    // Soru tipi uyumu
    const questionIndicators = {
      'what': ['nedir', 'tanım', 'olan'],
      'where': ['nerede', 'yer', 'bulun', 'kıta'],
      'when': ['zaman', 'tarih', 'dönem'],
      'who': ['kim', 'kişi', 'kurucu'],
      'why': ['neden', 'çünkü', 'sebebi'],
      'how': ['nasıl', 'şekilde', 'yöntem']
    };
    
    const indicators = questionIndicators[analysis.questionType] || [];
    indicators.forEach(indicator => {
      if (lowerSentence.includes(indicator)) {
        score += 1;
      }
    });
    
    return score;
  }

  /**
   * Destekleyici detayları çıkar
   */
  private extractSupportingDetails(results: SearchResult[], analysis: QueryAnalysis): string[] {
    const details: string[] = [];
    
    results.slice(1, 3).forEach(result => {
      const content = result.content.replace(/<[^>]*>/g, '').trim();
      const sentences = content.split(/[.!?]+/)
        .filter(s => s.trim().length > 30 && s.trim().length < 150);
      
      if (sentences.length > 0) {
        details.push(sentences[0].trim());
      }
    });
    
    return details.slice(0, 2);
  }

  /**
   * Sentez güven skoru hesaplama
   */
  private calculateSynthesisConfidence(
    mainAnswer: string, 
    results: SearchResult[], 
    analysis: QueryAnalysis
  ): number {
    if (!mainAnswer) return 0;
    
    let confidence = 0.5;
    
    // Sonuç kalitesi
    const avgRelevance = results.reduce((sum, r) => sum + r.relevance, 0) / results.length;
    confidence += avgRelevance * 0.3;
    
    // Cevap uzunluğu
    if (mainAnswer.length > 30 && mainAnswer.length < 200) {
      confidence += 0.1;
    }
    
    // Anahtar kelime varlığı
    const keywordPresence = analysis.keywords.filter(keyword => 
      mainAnswer.toLowerCase().includes(keyword.toLowerCase())
    ).length / analysis.keywords.length;
    confidence += keywordPresence * 0.1;
    
    return Math.min(1, confidence);
  }

  /**
   * Tamlık skoru hesaplama
   */
  private calculateCompleteness(
    mainAnswer: string, 
    analysis: QueryAnalysis, 
    supportingDetails: string[]
  ): number {
    let completeness = 0.3;
    
    // Ana cevap varlığı
    if (mainAnswer && mainAnswer.length > 20) {
      completeness += 0.4;
    }
    
    // Destekleyici detay sayısı
    completeness += (supportingDetails.length / 3) * 0.2;
    
    // Intent'e uygun cevap
    if (analysis.intent === 'definition' && mainAnswer.includes('dır')) {
      completeness += 0.1;
    } else if (analysis.questionType === 'where' && mainAnswer.includes('yer')) {
      completeness += 0.1;
    }
    
    return Math.min(1, completeness);
  }

  /**
   * Gelişmiş kavram çıkarma
   */
  private extractAdvancedConcepts(results: SearchResult[], analysis: QueryAnalysis): string[] {
    const concepts = new Set<string>();
    
    // Analiz edilen anahtar kelimeler
    analysis.keywords.forEach(keyword => concepts.add(keyword));
    analysis.entities.forEach(entity => concepts.add(entity.toLowerCase()));
    
    results.forEach(result => {
      // Başlıktan kavramları çıkar
      const titleWords = result.title.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !['olan', 'için', 'daha'].includes(word));
      titleWords.slice(0, 3).forEach(word => concepts.add(word));

      // İçerikten önemli kelimeleri çıkar
      const contentWords = result.content.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4 && 
          !['olan', 'için', 'daha', 'çok', 'kadar', 'gibi', 'şekilde'].includes(word));
      
      contentWords.slice(0, 5).forEach(word => concepts.add(word));
    });

    return Array.from(concepts).slice(0, 15);
  }

  // Diğer metodlar aynı kalacak (öğrenme geçmişi metodları)
  private addToLearningHistory(learningData: LearningData): void {
    this.learningHistory.push(learningData);
    
    if (this.learningHistory.length > this.maxHistorySize) {
      this.learningHistory = this.learningHistory.slice(-this.maxHistorySize);
    }

    this.saveLearningHistory();
  }

  private saveLearningHistory(): void {
    try {
      localStorage.setItem('internet_learning_history', JSON.stringify(this.learningHistory));
    } catch (error) {
      console.error('Öğrenme geçmişi kaydedilemedi:', error);
    }
  }

  private loadLearningHistory(): void {
    try {
      const saved = localStorage.getItem('internet_learning_history');
      if (saved) {
        this.learningHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Öğrenme geçmişi yüklenemedi:', error);
      this.learningHistory = [];
    }
  }

  getLearningHistory(): LearningData[] {
    return [...this.learningHistory];
  }

  clearLearningHistory(): void {
    this.learningHistory = [];
    localStorage.removeItem('internet_learning_history');
  }

  hasLearnedAbout(topic: string): LearningData | null {
    const learned = this.learningHistory.find(data => 
      data.query.toLowerCase().includes(topic.toLowerCase()) ||
      data.concepts.some(concept => concept.includes(topic.toLowerCase()))
    );

    return learned || null;
  }
}
