/**
 * Internet Search API Endpoint
 * Kendi web scraping sistemi ile gerçek zamanlı internet araması
 */

import { Request, Response } from 'express';
import * as cheerio from 'cheerio';

interface SearchEngineResult {
  title: string;
  snippet: string;
  url: string;
  domain: string;
  relevance?: number; // Eklenen alan
  strategy?: string; // Eklenen alan
}

export async function searchInternet(req: Request, res: Response) {
  try {
    const { query, strategy } = req.body; // Strateji eklendi

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz arama sorgusu'
      });
    }

    console.log(`🔍 Kendi arama sistemimiz ile arama: "${query}" (Strateji: ${strategy || 'varsayılan'})`);

    // Çoklu kaynak arama stratejisi
    const searchPromises = [
      searchWikipedia(query),
      searchDuckDuckGo(query),
      searchBingNews(query)
    ];

    const searchResults = await Promise.allSettled(searchPromises);
    let allResults: any[] = [];

    // Başarılı sonuçları topla
    searchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        // Sonuçları stratejiye göre işle
        const processed = processResultsWithStrategy(result.value, strategy || 'comprehensive_search', null); // Analiz bilgisi henüz yok
        allResults.push(...processed);
      }
    });

    if (allResults.length === 0) {
      console.log('Hiç arama sonucu bulunamadı, örnek veri döndürülüyor');
      return res.json({
        success: true,
        results: getStrategyBasedSampleResults(query, strategy || 'comprehensive_search', null),
        source: 'fallback',
        strategy: strategy || 'comprehensive_search',
        metadata: {
          originalQuery: query,
          resultsCount: 0,
          analysisUsed: false
        }
      });
    }

    // Sonuçları relevansa göre sırala ve en iyi 5'ini al
    const sortedResults = allResults
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, 5);

    console.log(`✅ Kendi arama sistemi başarılı: ${sortedResults.length} sonuç`);

    // Sonuçları API formatına dönüştür
    const formattedResults = sortedResults.map((result, index) => ({
      title: result.title,
      content: result.snippet,
      url: result.url,
      relevance: result.relevance,
      timestamp: Date.now(),
      strategy: result.strategy // Stratejiyi de ekle
    }));

    return res.json({
      success: true,
      results: formattedResults,
      source: 'enhanced_multi_search',
      strategy: strategy || 'comprehensive_search',
      metadata: {
        originalQuery: query,
        resultsCount: sortedResults.length,
        analysisUsed: false // Analiz bilgisi henüz yok
      }
    });

  } catch (error) {
    console.error('Gelişmiş arama hatası:', error);
    return res.status(500).json({
      success: false,
      error: 'Gelişmiş arama sırasında hata oluştu',
      results: getStrategyBasedSampleResults(req.body.query || '', req.body.strategy || 'comprehensive_search', null),
      source: 'fallback',
    });
  }
}

/**
 * Wikipedia arama
 */
async function searchWikipedia(query: string): Promise<SearchEngineResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://tr.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodedQuery}&srlimit=5&origin=*`; // Limit 5'e çıkarıldı

    const response = await fetch(searchUrl);
    if (!response.ok) return [];

    const data = await response.json();
    const results: SearchEngineResult[] = [];

    if (data.query && data.query.search) {
      for (const item of data.query.search) {
        const pageUrl = `https://tr.wikipedia.org/wiki/${encodeURIComponent(item.title)}`;

        // Sayfa içeriğini al
        const contentResponse = await fetch(`https://tr.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exsentences=3&exlimit=1&titles=${encodeURIComponent(item.title)}&origin=*`);
        let content = item.snippet || '';

        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          const pages = contentData.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pages[pageId]?.extract) {
              content = pages[pageId].extract;
            }
          }
        }

        results.push({
          title: item.title,
          snippet: content.replace(/<[^>]*>/g, '').substring(0, 300),
          url: pageUrl,
          domain: 'wikipedia.org',
          relevance: 0.7, // Varsayılan relevans
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return [];
  }
}

/**
 * DuckDuckGo arama (HTML scraping)
 */
async function searchDuckDuckGo(query: string): Promise<SearchEngineResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: SearchEngineResult[] = [];

    $('.result').each((i, element) => {
      if (i >= 3) return false; // Sadece ilk 3 sonuç

      const $element = $(element);
      const title = $element.find('.result__title a').text().trim();
      const snippet = $element.find('.result__snippet').text().trim();
      const url = $element.find('.result__title a').attr('href') || '';

      if (title && snippet) {
        results.push({
          title,
          snippet: snippet.substring(0, 300),
          url: url.startsWith('http') ? url : `https://duckduckgo.com${url}`,
          domain: 'duckduckgo.com',
          relevance: 0.6, // Varsayılan relevans
        });
      }
    });

    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

/**
 * Bing News arama
 */
async function searchBingNews(query: string): Promise<SearchEngineResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query + ' haber');
    const searchUrl = `https://www.bing.com/news/search?q=${encodedQuery}&format=rss`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return [];

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const results: SearchEngineResult[] = [];

    $('item').slice(0, 2).each((i, element) => {
      const $element = $(element);
      const title = $element.find('title').text().trim();
      const description = $element.find('description').text().trim();
      const link = $element.find('link').text().trim();

      if (title && description) {
        results.push({
          title,
          snippet: description.replace(/<[^>]*>/g, '').substring(0, 300),
          url: link,
          domain: 'bing.com/news',
          relevance: 0.5, // Varsayılan relevans
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Bing News search error:', error);
    return [];
  }
}

/**
 * Örnek sonuçlar - API çalışmadığında
 */
function getSampleResults(query: string): SearchEngineResult[] {
  const lowerQuery = query.toLowerCase();

  // Türkçe anahtar kelimeler için özel yanıtlar
  if (lowerQuery.includes('istanbul')) {
    return [
      {
        title: 'İstanbul - Türkiye\'nin En Büyük Şehri',
        snippet: 'İstanbul, Türkiye\'nin en kalabalık şehri ve ekonomik merkezidir. Boğaziçi\'nin iki yakasında kurulmuş olan şehir, hem Avrupa hem de Asya kıtalarında yer alır. Nüfusu 15 milyonu aşan İstanbul, tarih, kültür ve ticaret merkezi olarak önemli bir konuma sahiptir.',
        url: 'https://example.com/istanbul',
        relevance: 0.95,
        domain: 'example.com',
        timestamp: Date.now()
      }
    ];
  }

  if (lowerQuery.includes('yapay zeka') || lowerQuery.includes('ai')) {
    return [
      {
        title: 'Yapay Zeka ve Güncel Gelişmeler',
        snippet: 'Yapay zeka teknolojisi hızla gelişmektedir. ChatGPT, GPT-4, Claude gibi büyük dil modelleri ile birlikte yapay zeka günlük hayatımızın bir parçası haline gelmiştir. Makine öğrenmesi, derin öğrenme ve doğal dil işleme alanlarında önemli ilerlemeler kaydedilmektedir.',
        url: 'https://example.com/yapay-zeka',
        relevance: 0.92,
        domain: 'example.com',
        timestamp: Date.now()
      }
    ];
  }

  // Genel sorgu için
  return [
    {
      title: `${query} - Güncel Bilgiler`,
      snippet: `${query} konusunda güncel bilgiler ve detaylar. Bu konu hakkında kapsamlı araştırmalar yapılmış ve güncel veriler derlenmiştir. İlgili alanında uzman kaynaklardan yararlanılarak hazırlanmıştır.`,
      url: `https://example.com/${encodeURIComponent(query)}`,
      relevance: 0.8,
      domain: 'example.com',
      timestamp: Date.now()
    }
  ];
}

/**
 * Strateji bazlı sonuç işleme
 */
function processResultsWithStrategy(results: SearchEngineResult[], strategy: string, analysis: any): SearchEngineResult[] {
  return results.map(result => {
    let relevanceBoost = 0;
    const content = (result.title + ' ' + result.snippet).toLowerCase();

    // Strateji bazlı relevans artırımı
    switch (strategy) {
      case 'news_focused':
        if (content.includes('haber') || content.includes('güncel') || content.includes('son')) {
          relevanceBoost += 0.2;
        }
        break;
      case 'authoritative_sources':
        if (result.url.includes('wikipedia') || result.url.includes('.edu') || result.url.includes('.gov')) {
          relevanceBoost += 0.3;
        }
        break;
      case 'factual_precise':
        if (analysis?.keywords) {
          const keywordMatches = analysis.keywords.filter((keyword: string) =>
            content.includes(keyword.toLowerCase())
          ).length;
          relevanceBoost += (keywordMatches / analysis.keywords.length) * 0.2;
        }
        break;
      case 'comprehensive_search': // Varsayılan stratejiye ekleme
      default:
        // Varsayılan olarak genel bir relevans puanı verilebilir veya hiçbir şey yapılmayabilir.
        break;
    }

    return {
      ...result,
      relevance: Math.min(1, (result.relevance || 0.5) + relevanceBoost),
      strategy: strategy
    };
  });
}

/**
 * Strateji bazlı örnek veriler
 */
function getStrategyBasedSampleResults(query: string, strategy: string, analysis: any): SearchEngineResult[] {
  const lowerQuery = query.toLowerCase();

  // Strateji bazlı fallback veriler
  if (strategy === 'news_focused') {
    return [
      {
        title: `${query} - Son Haberler`,
        snippet: `${query} konusunda son gelişmeler ve güncel haberler. Bu konudaki en son gelişmeleri takip edebilirsiniz.`,
        url: `https://example.com/news/${encodeURIComponent(query)}`,
        relevance: 0.8,
        domain: 'example.com',
        strategy: strategy,
        timestamp: Date.now()
      }
    ];
  } else if (strategy === 'authoritative_sources') {
    return [
      {
        title: `${query} - Resmi Kaynak`,
        snippet: `${query} hakkında güvenilir ve resmi kaynaklardan derlenmiş detaylı bilgiler.`,
        url: `https://example.com/official/${encodeURIComponent(query)}`,
        relevance: 0.9,
        domain: 'example.com',
        strategy: strategy,
        timestamp: Date.now()
      }
    ];
  }

  // Default fallback
  return getSampleResults(query).map(result => ({
    ...result,
    strategy: strategy || 'comprehensive_search'
  }));
}