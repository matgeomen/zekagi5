/**
 * Gelişmiş Fuzzy Matching ve Benzer Sözcük Algılama Sistemi
 * Türkçe yazım hatalarını ve benzer kelimeleri algılar
 */

// Türkçe karakter dönüşüm haritası
const TURKISH_CHAR_MAP: Record<string, string[]> = {
  'ç': ['c', 'ch'],
  'ğ': ['g'],
  'ı': ['i'],
  'ö': ['o'],
  'ş': ['s', 'sh'],
  'ü': ['u'],
  'c': ['ç'],
  'g': ['ğ'],
  'i': ['ı'],
  'o': ['ö'],
  's': ['ş'],
  'u': ['ü']
};

// Yaygın yazım hataları
const COMMON_TYPOS: Record<string, string[]> = {
  'merhaba': ['meraba', 'merhba', 'merhaa', 'mehaba'],
  'nasılsın': ['nasilsin', 'nasılsınız', 'nasilsiniz', 'nasılsz'],
  'teşekkür': ['tesekkur', 'tesekur', 'teşekür'],
  'günaydın': ['gunaydin', 'günaydın', 'gunayden'],
  'mutlu': ['mutulu', 'multu', 'muttlu'],
  'üzgün': ['uzgun', 'üzgun', 'uzgün'],
  'bugün': ['bugun', 'bugun', 'bügun'],
  'yarın': ['yarin', 'yarın', 'yarun'],
  'selam': ['selaam', 'selm', 'slam']
};

/**
 * Levenshtein Distance algoritması
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // Deletion
        matrix[j - 1][i] + 1, // Insertion
        matrix[j - 1][i - 1] + indicator // Substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Benzerlik oranı hesapla (0-1 arası)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLength);
}

/**
 * Türkçe karakter normalleştirme
 */
export function normalizeTurkish(text: string): string {
  return text
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .trim();
}

/**
 * Kelime benzerliği hesapla (gelişmiş)
 */
export function calculateWordSimilarity(word1: string, word2: string): number {
  // Exact match
  if (word1.toLowerCase() === word2.toLowerCase()) return 1.0;
  
  // Normalized Turkish character match
  const norm1 = normalizeTurkish(word1);
  const norm2 = normalizeTurkish(word2);
  if (norm1 === norm2) return 0.95;
  
  // Check common typos
  for (const [correct, typos] of Object.entries(COMMON_TYPOS)) {
    if ((correct === word1.toLowerCase() && typos.includes(word2.toLowerCase())) ||
        (correct === word2.toLowerCase() && typos.includes(word1.toLowerCase()))) {
      return 0.9;
    }
  }
  
  // Levenshtein similarity
  const similarity = calculateSimilarity(word1, word2);
  
  // Bonus for Turkish character variations
  if (similarity > 0.7) {
    for (const [char, variants] of Object.entries(TURKISH_CHAR_MAP)) {
      if (word1.includes(char) && variants.some(v => word2.includes(v))) {
        return Math.min(similarity + 0.1, 1.0);
      }
    }
  }
  
  return similarity;
}

/**
 * Cümle benzerliği hesapla
 */
export function calculateSentenceSimilarity(sentence1: string, sentence2: string): number {
  const words1 = sentence1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const words2 = sentence2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let totalSimilarity = 0;
  let matchedWords = 0;
  
  for (const word1 of words1) {
    let bestMatch = 0;
    for (const word2 of words2) {
      const similarity = calculateWordSimilarity(word1, word2);
      bestMatch = Math.max(bestMatch, similarity);
    }
    if (bestMatch > 0.6) { // Threshold for word match
      totalSimilarity += bestMatch;
      matchedWords++;
    }
  }
  
  if (matchedWords === 0) return 0;
  
  // Penalize for length difference
  const lengthPenalty = Math.min(words1.length, words2.length) / Math.max(words1.length, words2.length);
  
  return (totalSimilarity / matchedWords) * lengthPenalty;
}

/**
 * En iyi eşleşmeyi bul
 */
export function findBestMatch(
  input: string, 
  candidates: string[], 
  threshold: number = 0.6
): { match: string; similarity: number } | null {
  let bestMatch = '';
  let bestSimilarity = 0;
  
  for (const candidate of candidates) {
    const similarity = calculateSentenceSimilarity(input, candidate);
    if (similarity > bestSimilarity && similarity >= threshold) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }
  
  return bestSimilarity > 0 ? { match: bestMatch, similarity: bestSimilarity } : null;
}

/**
 * Soru varyasyonları oluştur
 */
export function generateQuestionVariations(question: string): string[] {
  const variations = [question];
  const lowerQ = question.toLowerCase();
  
  // Yazım hatası varyasyonları
  for (const [correct, typos] of Object.entries(COMMON_TYPOS)) {
    if (lowerQ.includes(correct)) {
      for (const typo of typos) {
        variations.push(lowerQ.replace(correct, typo));
      }
    }
  }
  
  // Noktalama işareti varyasyonları
  variations.push(question.replace(/[?!.]/g, ''));
  variations.push(question + '?');
  variations.push(question + '.');
  
  // Büyük/küçük harf varyasyonları
  variations.push(question.toLowerCase());
  variations.push(question.toUpperCase());
  
  return [...new Set(variations)]; // Tekrarları kaldır
}

/**
 * Akıllı soru eşleştirme
 */
export function smartQuestionMatch(
  userInput: string,
  trainingData: Array<{ input: string; output: string }>
): { match: { input: string; output: string }; similarity: number } | null {
  console.log(`🔍 Akıllı eşleştirme başlatılıyor: "${userInput}"`);
  
  let bestMatch: { input: string; output: string } | null = null;
  let bestSimilarity = 0;
  
  for (const item of trainingData) {
    // Direkt eşleşme kontrolü
    if (item.input.toLowerCase() === userInput.toLowerCase()) {
      console.log(`✅ Direkt eşleşme bulundu: "${item.input}"`);
      return { match: item, similarity: 1.0 };
    }
    
    // Benzerlik hesapla
    const similarity = calculateSentenceSimilarity(userInput, item.input);
    
    if (similarity > bestSimilarity && similarity >= 0.6) {
      bestSimilarity = similarity;
      bestMatch = item;
    }
    
    // Soru varyasyonlarını kontrol et
    const variations = generateQuestionVariations(item.input);
    for (const variation of variations) {
      const varSimilarity = calculateSentenceSimilarity(userInput, variation);
      if (varSimilarity > bestSimilarity && varSimilarity >= 0.65) {
        bestSimilarity = varSimilarity;
        bestMatch = item;
      }
    }
  }
  
  if (bestMatch && bestSimilarity >= 0.6) {
    console.log(`🎯 En iyi eşleşme: "${bestMatch.input}" (${Math.round(bestSimilarity * 100)}% benzerlik)`);
    return { match: bestMatch, similarity: bestSimilarity };
  }
  
  console.log(`❌ Uygun eşleşme bulunamadı (en yüksek benzerlik: ${Math.round(bestSimilarity * 100)}%)`);
  return null;
}