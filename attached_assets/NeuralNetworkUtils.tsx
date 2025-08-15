// Sinir ağı ile ilgili temel parametreler
export const INITIAL_GRID_ROWS = 12;
export const INITIAL_GRID_COLS = 24;
export const INITIAL_NETWORK_LAYERS = 4;
export const MIN_RELATION_SCORE = 25;
export const LEARNING_RATE = 0.18;
export const MAX_NETWORK_SIZE = 60;

// Gelişmiş parametreler
export const ACTIVATION_DECAY_RATE = 0.05;  // Aktivasyon azalma hızı
export const CONNECTION_THRESHOLD = 0.25;   // Bağlantı oluşturma eşiği
export const MAX_CONNECTIONS_PER_NODE = 12; // Bir düğümün maksimum bağlantı sayısı
export const REINFORCEMENT_RATE = 0.12;     // Pekiştirme öğrenme hızı
export const FORGET_RATE = 0.08;            // Unutma hızı
export const NEUROPLASTICITY = 0.15;        // Ağın adapte olma yeteneği

/**
 * Ağ düğümü arayüzü (geliştilmiş)
 */
export interface NetworkNode {
  id: string;                // Benzersiz düğüm kimliği
  word: string;              // Düğümün temsil ettiği kelime
  activation: number;        // Aktivasyon seviyesi (0-1)
  count: number;             // Kullanım sayısı
  connections: string[];     // Bağlantılar (diğer düğüm kimlikleri)
  dependency: number;        // Bağımlılık değeri (0-100)
  association: number;       // İlişki değeri (0-100)
  frequency: number;         // Kullanım sıklığı
  order: number;             // Sıra değeri
  feedback: number;          // Kullanıcı geri bildirimi (-100 ile 100 arası)
  depth: number;             // Ağ derinliği
  parentWords: string[];     // Üst düğümler
  
  // Gelişmiş özellikler
  lastActivation: number;    // Son aktivasyon zamanı
  activationHistory: number[]; // Aktivasyon geçmişi
  semanticVector?: number[]; // Anlamsal vektör (embedding)
  category?: string;         // Kategori (ör: isim, fiil, sıfat)
  sentiment?: number;        // Duygu değeri (-1 ile 1 arası)
  importance?: number;       // Önem değeri (0-100)
  connectionStrengths?: { [nodeId: string]: number }; // Bağlantı güç değerleri
  createdAt: number;         // Oluşturulma zamanı
  modifiedAt: number;        // Son değiştirilme zamanı
}

/**
 * İlişki arayüzü (geliştilmiş)
 */
export interface Relation {
  id: string;                // Benzersiz ilişki kimliği
  userWord: string;          // Kullanıcı kelimesi
  systemWord: string;        // Sistem kelimesi
  dependency: number;        // Bağımlılık değeri (0-100)
  association: number;       // İlişki değeri (0-100) 
  frequency: number;         // Sıklık değeri
  order: number;             // Sıra değeri
  feedback: number;          // Kullanıcı geri bildirimi
  isReversed?: boolean;      // Ters ilişki mi?
  ai_generated?: boolean;    // Yapay zeka tarafından oluşturuldu mu?
  
  // Gelişmiş özellikler
  strength: number;          // İlişki gücü (0-100)
  context?: string[];        // İlişki bağlamı
  learningCount: number;     // Öğrenme sayısı
  lastUsed: number;          // Son kullanım zamanı
  creationTime: number;      // Oluşturulma zamanı
  relationType?: 'semantic' | 'temporal' | 'causal' | 'hierarchical'; // İlişki tipi
  bidirectional: boolean;    // İki yönlü mü?
  confidence: number;        // Güven değeri (0-1)
}

/**
 * Eğitim çifti arayüzü
 */
export interface TrainingPair {
  id: string;                // Benzersiz eğitim kimliği
  input: string;             // Girdi metni
  output: string;            // Çıktı metni
  timestamp: number;         // Tarih damgası
  score?: number;            // Kalite puanı (0-100)
  difficulty?: number;       // Zorluk derecesi (0-100)
  category?: string;         // Kategori
  tags?: string[];           // Etiketler
  usageCount: number;        // Kullanım sayısı
}

/**
 * Aktivasyon yayılımı sonucu
 */
export interface ActivationResult {
  activationPath: {
    layer: number;
    row: number;
    col: number;
    type: 'user' | 'system';
    value: number;
    word: string;
  }[];
  activatedNodes: NetworkNode[];
  activatedRelations: Relation[];
  primaryConcepts: string[];
  responseScore: number;
  confidence: number;
  processingTime: number;
}

/**
 * Boş bir ızgara oluştur
 */
export const createEmptyGrid = (rows: number, cols: number): (NetworkNode | null)[][] => {
  return Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));
};

/**
 * Kelime için pozisyon bul
 */
export const findPositionForWord = (
  grid: (NetworkNode | null)[][],
  word: string,
  rows?: number,
  cols?: number
): { row: number; col: number } => {
  const gridRows = rows || grid.length;
  const gridCols = cols || (grid[0]?.length || 0);
  
  if (gridRows === 0 || gridCols === 0) {
    return { row: 0, col: 0 };
  }
  
  // Önce bu kelimenin zaten ağda olup olmadığını kontrol et
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (grid[r] && grid[r][c] && grid[r][c]!.word === word.toLowerCase()) {
        return { row: r, col: c };
      }
    }
  }

  // Kelime ağda yoksa, semantik yakınlığa göre pozisyon bul
  // Bu ileride bir vektör benzerliğine dönüştürülebilir
  const wordLength = word.length;
  const preferredRow = Math.min(gridRows - 1, Math.floor((wordLength % gridRows) / 2));
  
  // Tercih edilen satırda boş pozisyon ara
  for (let c = 0; c < gridCols; c++) {
    if (!grid[preferredRow][c]) {
      return { row: preferredRow, col: c };
    }
  }

  // Boş bir konum bul
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (!grid[r][c]) {
        return { row: r, col: c };
      }
    }
  }

  // Eğer boş yer kalmadıysa, en az önemli düğümü değiştir
  let minImportance = Infinity;
  let replacePosition = { row: 0, col: 0 };
  
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const node = grid[r][c];
      if (node) {
        const nodeImportance = node.importance || (node.frequency * node.activation);
        if (nodeImportance < minImportance) {
          minImportance = nodeImportance;
          replacePosition = { row: r, col: c };
        }
      }
    }
  }
  
  return replacePosition;
};

/**
 * Benzersiz kimlik oluştur
 */
export const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Kelimeyi ağa ekle (geliştirilmiş)
 */
export const addWordToNetwork = (
  network: (NetworkNode | null)[][][],
  word: string,
  layer: number,
  row: number,
  col: number,
  previousNetwork?: (NetworkNode | null)[][][],
  options?: {
    importance?: number;
    category?: string;
    sentiment?: number;
    semanticVector?: number[];
    initialActivation?: number;
  }
): (NetworkNode | null)[][][] => {
  if (!network[layer] || !network[layer][row]) {
    // Eğer gerekli katman veya satır yoksa, oluştur
    if (!network[layer]) {
      network[layer] = createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS);
    }
    if (!network[layer][row]) {
      network[layer][row] = Array(INITIAL_GRID_COLS).fill(null);
    }
  }

  const result = JSON.parse(JSON.stringify(network)) as (NetworkNode | null)[][][];
  const grid = result[layer];
  const now = Date.now();
  const normalizedWord = word.toLowerCase().trim();
  
  // Eğer bu konumda zaten bir düğüm varsa, onu güncelle
  if (grid[row][col]) {
    if (grid[row][col]!.word === normalizedWord) {
      const node = grid[row][col]!;
      // Düğüm özelliklerini güncelle
      node.count += 1;
      node.frequency += 1;
      node.activation = Math.min(1.0, node.activation + 0.1);
      node.modifiedAt = now;
      
      // Aktivasyon geçmişini güncelle
      if (!node.activationHistory) {
        node.activationHistory = [node.activation];
      } else {
        node.activationHistory.push(node.activation);
        // Geçmişi sadece son 10 aktivasyonu tut
        if (node.activationHistory.length > 10) {
          node.activationHistory = node.activationHistory.slice(-10);
        }
      }
      
      // Önem değerini güncelle
      if (node.importance !== undefined) {
        node.importance = Math.min(100, node.importance + 2);
      } else {
        node.importance = 50;
      }
      
      // Zaman değerlerini güncelle
      node.lastActivation = now;
      
      return result;
    } else {
      // Farklı bir kelime varsa, yeni bir konum bul
      const newPosition = findPositionForWord(grid, normalizedWord);
      return addWordToNetwork(result, normalizedWord, layer, newPosition.row, newPosition.col, previousNetwork, options);
    }
  }
  
  // Ebeveyn kelimeleri bul (önceki katmanlar)
  let parentWords: string[] = [];
  if (previousNetwork && layer > 0) {
    // Önceki katmanlardan en aktif düğümleri bul
    for (let prevLayer = Math.max(0, layer - 2); prevLayer < layer; prevLayer++) {
      if (previousNetwork[prevLayer]) {
        const previousLayerNodes: NetworkNode[] = [];
        
        // Tüm aktif düğümleri topla
        for (let r = 0; r < previousNetwork[prevLayer].length; r++) {
          for (let c = 0; c < previousNetwork[prevLayer][r].length; c++) {
            const node = previousNetwork[prevLayer][r][c];
            if (node && node.activation > 0.3) {
              previousLayerNodes.push(node);
            }
          }
        }
        
        // Aktivasyona göre sırala ve en aktif olanları al
        previousLayerNodes.sort((a, b) => b.activation - a.activation);
        const topNodes = previousLayerNodes.slice(0, 3);
        parentWords = [...parentWords, ...topNodes.map(n => n.word)];
      }
    }
    
    // En çok 5 ebeveyn kelime seç
    parentWords = [...new Set(parentWords)].slice(0, 5);
  }
  
  // Kelime kategorisini tespit et (isim, fiil, sıfat vb.)
  const category = options?.category || categorizeWord(normalizedWord);

  // Duygu değerini tespit et
  const sentiment = options?.sentiment || calculateSentiment(normalizedWord);
  
  // Anlamsal vektör oluştur (mevcut değilse)
  const semanticVector = options?.semanticVector || generateSimpleSemanticVector(normalizedWord);
  
  // Yeni düğüm benzersiz kimliği
  const nodeId = uuid();
  
  // Yeni düğümü oluştur
  const newNode: NetworkNode = {
    id: nodeId,
    word: normalizedWord,
    activation: options?.initialActivation || 0.8,
    count: 1,
    connections: [],
    dependency: 50,
    association: 50,
    frequency: 1,
    order: layer,
    feedback: 0,
    depth: layer,
    parentWords,
    
    // Gelişmiş özellikler
    lastActivation: now,
    activationHistory: [options?.initialActivation || 0.8],
    semanticVector,
    category,
    sentiment,
    importance: options?.importance || 50,
    connectionStrengths: {},
    createdAt: now,
    modifiedAt: now
  };
  
  grid[row][col] = newNode;
  
  // Bağlantıları oluştur (aynı katmandaki ve bir önceki katmandaki düğümlerle)
  const connectionTargets: NetworkNode[] = [];
  
  // Aynı katmandaki düğümleri topla
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] && (r !== row || c !== col)) {
        connectionTargets.push(grid[r][c]!);
      }
    }
  }
  
  // Önceki katmandaki düğümleri topla
  if (result[layer - 1]) {
    const prevLayer = result[layer - 1];
    for (let r = 0; r < prevLayer.length; r++) {
      for (let c = 0; c < prevLayer[r].length; c++) {
        if (prevLayer[r][c]) {
          connectionTargets.push(prevLayer[r][c]!);
        }
      }
    }
  }
  
  // Bağlantı oluştur (semantik benzerlik ve rastgelelik kullanarak)
  const maxConnectionCount = Math.min(MAX_CONNECTIONS_PER_NODE, connectionTargets.length);
  const potentialConnections = connectionTargets
    .map(target => {
      // Semantik benzerlik hesapla
      let similarity = 0;
      if (semanticVector && target.semanticVector) {
        similarity = calculateCosineSimilarity(semanticVector, target.semanticVector);
      }
      
      // Yakın kategorideki düğümlere ek puan
      if (category && target.category && category === target.category) {
        similarity += 0.2;
      }
      
      // Ebeveyn kelimelere ek puan
      if (parentWords.includes(target.word)) {
        similarity += 0.3;
      }
      
      // Rastgele faktör ekle (keşif için)
      const randomFactor = Math.random() * 0.2;
      
      return {
        node: target,
        score: similarity + randomFactor
      };
    })
    .filter(conn => conn.score > CONNECTION_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxConnectionCount);
  
  // Bağlantıları ekle
  potentialConnections.forEach(conn => {
    const targetNode = conn.node;
    
    // Düğümler arası bağlantı kur
    if (!newNode.connections.includes(targetNode.id)) {
      newNode.connections.push(targetNode.id);
      newNode.connectionStrengths![targetNode.id] = conn.score;
    }
    
    // Karşılıklı bağlantı kur (düşük olasılıkla)
    if (Math.random() < 0.7) {
      if (!targetNode.connections.includes(nodeId)) {
        const targetNodeInGrid = findNodeInNetwork(result, targetNode.id);
        if (targetNodeInGrid) {
          targetNodeInGrid.connections.push(nodeId);
          if (!targetNodeInGrid.connectionStrengths) {
            targetNodeInGrid.connectionStrengths = {};
          }
          targetNodeInGrid.connectionStrengths[nodeId] = conn.score * 0.8; // Biraz daha zayıf geri bağlantı
        }
      }
    }
  });
  
  return result;
};

/**
 * Ağda düğüm bul
 */
function findNodeInNetwork(network: (NetworkNode | null)[][][], nodeId: string): NetworkNode | null {
  for (let layer = 0; layer < network.length; layer++) {
    for (let row = 0; row < network[layer].length; row++) {
      for (let col = 0; col < network[layer][row].length; col++) {
        const node = network[layer][row][col];
        if (node && node.id === nodeId) {
          return node;
        }
      }
    }
  }
  return null;
}

/**
 * Kosinüs benzerliği hesapla
 */
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
}

/**
 * Basit anlamsal vektör oluştur
 */
function generateSimpleSemanticVector(word: string): number[] {
  // Bu basit bir temsil - gerçek bir uygulamada word embeddings kullanılabilir
  const vector = Array(16).fill(0);
  
  // Kelimenin her karakteri için hash değeri
  for (let i = 0; i < word.length; i++) {
    const charCode = word.charCodeAt(i);
    const position = charCode % 16;
    vector[position] += charCode / 50;
  }
  
  // Kelimenin uzunluğu
  const lengthIndex = word.length % 16;
  vector[lengthIndex] += word.length / 3;
  
  // Sesli/sessiz harf oranı
  const vowels = word.match(/[aeıioöuü]/gi)?.length || 0;
  const vowelIndex = (vowels * 5) % 16;
  vector[vowelIndex] += vowels;
  
  // Normalleştir
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }
  
  return vector;
}

/**
 * Kelimeyi kategorize et
 */
function categorizeWord(word: string): string {
  // Basit bir kategorilendirme (gerçekte NLP kullanılabilir)
  const noun = ['ev', 'bilgisayar', 'kitap', 'masa', 'araba', 'insan', 'gün', 'su', 'zaman'];
  const verb = ['git', 'gel', 'yap', 'ol', 'başla', 'bitir', 'düşün', 'söyle', 'anla'];
  const adjective = ['güzel', 'büyük', 'hızlı', 'iyi', 'kötü', 'yavaş', 'yeni', 'eski', 'mutlu'];
  const adverb = ['hızlıca', 'yavaşça', 'iyi', 'kötü', 'çok', 'az', 'şimdi', 'sonra', 'önce'];
  
  if (noun.some(n => word.includes(n))) return 'noun';
  if (verb.some(v => word.includes(v))) return 'verb';
  if (adjective.some(a => word.includes(a))) return 'adjective';
  if (adverb.some(a => word.includes(a))) return 'adverb';
  
  // Türkçe fiil sonekleri
  if (word.endsWith('mak') || word.endsWith('mek')) return 'verb';
  
  // Türkçe sıfat sonekleri
  if (word.endsWith('lı') || word.endsWith('li') || 
      word.endsWith('lu') || word.endsWith('lü') ||
      word.endsWith('sız') || word.endsWith('siz') ||
      word.endsWith('suz') || word.endsWith('süz')) {
    return 'adjective';
  }
  
  // Varsayılan
  return 'unknown';
}

/**
 * Duygu değeri hesapla (basit)
 */
function calculateSentiment(word: string): number {
  const positiveWords = ['iyi', 'güzel', 'harika', 'mükemmel', 'sevgi', 'mutlu', 'başarı', 'doğru'];
  const negativeWords = ['kötü', 'çirkin', 'berbat', 'korkunç', 'nefret', 'üzgün', 'başarısız', 'yanlış'];
  
  let sentiment = 0;
  
  positiveWords.forEach(pw => {
    if (word.includes(pw)) sentiment += 0.2;
  });
  
  negativeWords.forEach(nw => {
    if (word.includes(nw)) sentiment -= 0.2;
  });
  
  return Math.max(-1, Math.min(1, sentiment));
}

/**
 * Yeni ilişki oluştur
 */
export const createRelation = (
  userWord: string,
  systemWord: string,
  initialStrength: number = 50,
  options?: {
    dependency?: number;
    association?: number;
    order?: number;
    context?: string[];
    bidirectional?: boolean;
    relationType?: 'semantic' | 'temporal' | 'causal' | 'hierarchical';
  }
): Relation => {
  const now = Date.now();
  
  return {
    id: uuid(),
    userWord,
    systemWord,
    dependency: options?.dependency || initialStrength,
    association: options?.association || initialStrength,
    frequency: 1,
    order: options?.order || 0,
    feedback: 0,
    isReversed: false,
    ai_generated: false,
    
    // Gelişmiş özellikler
    strength: initialStrength,
    context: options?.context || [],
    learningCount: 1,
    lastUsed: now,
    creationTime: now,
    relationType: options?.relationType || 'semantic',
    bidirectional: options?.bidirectional || false,
    confidence: 0.7
  };
};

/**
 * İlişki güçlendirme
 */
export const reinforceRelation = (relation: Relation, amount: number, feedback?: number): Relation => {
  const now = Date.now();
  const updatedRelation = { ...relation };
  
  // Temel değerleri güncelle
  updatedRelation.strength = Math.min(100, updatedRelation.strength + amount);
  updatedRelation.dependency = Math.min(100, updatedRelation.dependency + amount * 0.8);
  updatedRelation.association = Math.min(100, updatedRelation.association + amount * 0.5);
  updatedRelation.frequency += 1;
  updatedRelation.lastUsed = now;
  updatedRelation.learningCount += 1;
  
  // Geri bildirim varsa ekle
  if (feedback !== undefined) {
    updatedRelation.feedback = Math.max(-100, Math.min(100, updatedRelation.feedback + feedback));
  }
  
  // Güven değerini güncelle
  updatedRelation.confidence = Math.min(1, updatedRelation.confidence + 0.05);
  
  return updatedRelation;
};

/**
 * İlişkileri zayıflatma (unutma)
 */
export const weakenRelations = (relations: Relation[], factor: number = FORGET_RATE): Relation[] => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  return relations.map(relation => {
    // Son kullanım zamanına göre hesapla
    const daysSinceLastUse = (now - relation.lastUsed) / oneDay;
    if (daysSinceLastUse < 1) {
      return relation; // Son 24 saat içinde kullanıldı
    }
    
    // Unutma miktarını hesapla
    const decayAmount = factor * Math.min(10, daysSinceLastUse);
    
    // Zayıflatılmış ilişki döndür
    return {
      ...relation,
      strength: Math.max(1, relation.strength - decayAmount),
      dependency: Math.max(1, relation.dependency - decayAmount * 0.8),
      association: Math.max(1, relation.association - decayAmount * 0.5),
      confidence: Math.max(0.1, relation.confidence - decayAmount * 0.01)
    };
  });
};

/**
 * Sinir ağı aktivasyonu
 */
export const propagateActivation = (
  userNetworks: (NetworkNode | null)[][][],
  systemNetworks: (NetworkNode | null)[][][],
  relations: Relation[],
  startWord: string,
  maxDepth: number = 3
): ActivationResult => {
  const startTime = Date.now();
  const activationPath: { layer: number; row: number; col: number; type: 'user' | 'system'; value: number; word: string }[] = [];
  const activatedNodes: NetworkNode[] = [];
  const activatedRelations: Relation[] = [];
  const activationValues: { [nodeId: string]: number } = {};
  
  // İlk düğümü bul
  let startNode: NetworkNode | null = null;
  let startNodePosition = { layer: 0, row: 0, col: 0 };
  
  // Kullanıcı ağında başla
  outerLoop: for (let layer = 0; layer < userNetworks.length; layer++) {
    for (let row = 0; row < userNetworks[layer].length; row++) {
      for (let col = 0; col < userNetworks[layer][row].length; col++) {
        const node = userNetworks[layer][row][col];
        if (node && node.word === startWord.toLowerCase()) {
          startNode = node;
          startNodePosition = { layer, row, col };
          break outerLoop;
        }
      }
    }
  }
  
  // Başlangıç düğümü bulunamadıysa, en yakın düğümü bul
  if (!startNode) {
    let bestSimilarity = -1;
    let bestNode: NetworkNode | null = null;
    let bestPosition = { layer: 0, row: 0, col: 0 };
    
    // Tüm kullanıcı ağını tara
    for (let layer = 0; layer < userNetworks.length; layer++) {
      for (let row = 0; row < userNetworks[layer].length; row++) {
        for (let col = 0; col < userNetworks[layer][row].length; col++) {
          const node = userNetworks[layer][row][col];
          if (node) {
            // Kelime benzerliği hesapla
            const similarity = calculateWordSimilarity(startWord, node.word);
            if (similarity > bestSimilarity) {
              bestSimilarity = similarity;
              bestNode = node;
              bestPosition = { layer, row, col };
            }
          }
        }
      }
    }
    
    startNode = bestNode;
    startNodePosition = bestPosition;
  }
  
  // Hala başlangıç düğümü yoksa, boş sonuç döndür
  if (!startNode) {
    return {
      activationPath: [],
      activatedNodes: [],
      activatedRelations: [],
      primaryConcepts: [],
      responseScore: 0,
      confidence: 0,
      processingTime: Date.now() - startTime
    };
  }
  
  // Başlangıç düğümünü ekle
  activationPath.push({
    ...startNodePosition,
    type: 'user',
    value: 1.0,
    word: startNode.word
  });
  activatedNodes.push(startNode);
  activationValues[startNode.id] = 1.0;
  
  // Aktivasyon yayılımı kuyruğu
  type ActivationQueueItem = {
    node: NetworkNode;
    position: { layer: number; row: number; col: number; type: 'user' | 'system' };
    activationValue: number;
    depth: number;
  };
  
  const queue: ActivationQueueItem[] = [{
    node: startNode,
    position: { ...startNodePosition, type: 'user' },
    activationValue: 1.0,
    depth: 0
  }];
  
  // BFS aktivasyon yayılımı
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Maksimum derinliği aştı mı?
    if (current.depth >= maxDepth) continue;
    
    // İlişkiler aracılığıyla yayılım
    relations.forEach(relation => {
      // Kullanıcı düğümünden sistem düğümüne
      if (current.position.type === 'user' && relation.userWord === current.node.word) {
        // Sistem düğümünü bul
        let targetNode: NetworkNode | null = null;
        let targetPosition = { layer: 0, row: 0, col: 0 };
        
        // Sistem ağında ara
        outerLoop: for (let layer = 0; layer < systemNetworks.length; layer++) {
          for (let row = 0; row < systemNetworks[layer].length; row++) {
            for (let col = 0; col < systemNetworks[layer][row].length; col++) {
              const node = systemNetworks[layer][row][col];
              if (node && node.word === relation.systemWord) {
                targetNode = node;
                targetPosition = { layer, row, col };
                break outerLoop;
              }
            }
          }
        }
        
        if (targetNode) {
          // İlişki gücü faktörü
          const strengthFactor = (relation.strength / 100) * 0.8 + 0.2;
          
          // Aktivasyon değerini hesapla (azaltarak yayılım)
          const newActivation = current.activationValue * strengthFactor;
          
          // Düğümün mevcut değerini al veya 0 varsay
          const existingActivation = activationValues[targetNode.id] || 0;
          
          // En yüksek aktivasyon değerini tut
          const finalActivation = Math.max(existingActivation, newActivation);
          
          // Eşiği geçerse ekle
          if (finalActivation > 0.1 && (!activationValues[targetNode.id] || finalActivation > existingActivation)) {
            activationValues[targetNode.id] = finalActivation;
            
            // Yolu ekle
            activationPath.push({
              ...targetPosition,
              type: 'system',
              value: finalActivation,
              word: targetNode.word
            });
            
            // Aktif düğümlere ekle
            if (!activatedNodes.some(n => n.id === targetNode!.id)) {
              activatedNodes.push(targetNode);
            }
            
            // Aktif ilişkilere ekle
            if (!activatedRelations.some(r => r.id === relation.id)) {
              activatedRelations.push(relation);
            }
            
            // Kuyruğa ekle
            queue.push({
              node: targetNode,
              position: { ...targetPosition, type: 'system' },
              activationValue: finalActivation,
              depth: current.depth + 1
            });
          }
        }
      }
      
      // Sistem düğümünden kullanıcı düğümüne (ters)
      if (current.position.type === 'system' && relation.systemWord === current.node.word) {
        // Kullanıcı düğümünü bul
        let targetNode: NetworkNode | null = null;
        let targetPosition = { layer: 0, row: 0, col: 0 };
        
        // Kullanıcı ağında ara
        outerLoop: for (let layer = 0; layer < userNetworks.length; layer++) {
          for (let row = 0; row < userNetworks[layer].length; row++) {
            for (let col = 0; col < userNetworks[layer][row].length; col++) {
              const node = userNetworks[layer][row][col];
              if (node && node.word === relation.userWord) {
                targetNode = node;
                targetPosition = { layer, row, col };
                break outerLoop;
              }
            }
          }
        }
        
        if (targetNode) {
          // İlişki gücü faktörü (ters ilişki biraz daha zayıf)
          const strengthFactor = (relation.strength / 100) * 0.6 + 0.1;
          
          // Aktivasyon değerini hesapla
          const newActivation = current.activationValue * strengthFactor;
          
          // Düğümün mevcut değerini al veya 0 varsay
          const existingActivation = activationValues[targetNode.id] || 0;
          
          // En yüksek aktivasyon değerini tut
          const finalActivation = Math.max(existingActivation, newActivation);
          
          // Eşiği geçerse ekle
          if (finalActivation > 0.1 && (!activationValues[targetNode.id] || finalActivation > existingActivation)) {
            activationValues[targetNode.id] = finalActivation;
            
            // Yolu ekle
            activationPath.push({
              ...targetPosition,
              type: 'user',
              value: finalActivation,
              word: targetNode.word
            });
            
            // Aktif düğümlere ekle
            if (!activatedNodes.some(n => n.id === targetNode!.id)) {
              activatedNodes.push(targetNode);
            }
            
            // Aktif ilişkilere ekle
            if (!activatedRelations.some(r => r.id === relation.id)) {
              activatedRelations.push(relation);
            }
            
            // Kuyruğa ekle
            queue.push({
              node: targetNode,
              position: { ...targetPosition, type: 'user' },
              activationValue: finalActivation,
              depth: current.depth + 1
            });
          }
        }
      }
    });
  }
  
  // Ana kavramları belirle (en yüksek aktivasyona sahip sistem düğümleri)
  const systemNodes = activatedNodes.filter(node => 
    activationPath.some(ap => ap.word === node.word && ap.type === 'system')
  );
  
  const primaryConcepts = systemNodes
    .map(node => ({
      word: node.word,
      activation: activationValues[node.id] || 0
    }))
    .sort((a, b) => b.activation - a.activation)
    .slice(0, 5)
    .map(item => item.word);
  
  // Yanıt puanı ve güven hesapla
  const responseScore = activatedRelations.reduce((sum, rel) => sum + rel.strength, 0) / 
                       (activatedRelations.length || 1);
  
  const confidence = Math.min(1, activatedRelations.length / 8) * 
                    (responseScore / 100);
  
  return {
    activationPath,
    activatedNodes,
    activatedRelations,
    primaryConcepts,
    responseScore,
    confidence,
    processingTime: Date.now() - startTime
  };
};

/**
 * Kelime benzerliği hesapla (Levenshtein mesafesi)
 */
function calculateWordSimilarity(word1: string, word2: string): number {
  const a = word1.toLowerCase();
  const b = word2.toLowerCase();
  
  // Tamamen aynı ise
  if (a === b) return 1;
  
  // Biri diğerini içeriyorsa
  if (a.includes(b) || b.includes(a)) {
    const longerLength = Math.max(a.length, b.length);
    const shorterLength = Math.min(a.length, b.length);
    return shorterLength / longerLength * 0.8;
  }
  
  // Levenshtein mesafesi
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // değiştirme
          Math.min(
            matrix[i][j - 1] + 1,   // ekleme
            matrix[i - 1][j] + 1    // silme
          )
        );
      }
    }
  }
  
  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);
  
  // Normalize (0 = tamamen farklı, 1 = aynı)
  return 1 - (distance / maxLength);
}

/**
 * Yanıt oluştur (geliştirilmiş)
 */
export const generateResponse = async (
  prompt: string,
  options?: {
    useActivation?: boolean;
    userNetworks?: (NetworkNode | null)[][][];
    systemNetworks?: (NetworkNode | null)[][][];
    relations?: Relation[];
    activeMemories?: string[];
    mood?: 'formal' | 'friendly' | 'professional' | 'casual';
    maxLength?: number;
    trainingHistory?: Array<{userInput: string, systemOutput: string, timestamp: number}>;
  }
): Promise<{
  text: string;
  confidence: number;
  concepts: string[];
  processingTime: number;
}> => {
  const startTime = Date.now();
  
  // Girdi işleme
  const normalizedPrompt = prompt.toLowerCase().trim();
  
  // DOĞRUDAN EĞİTİM EŞLEŞMESİ - Tam eşleşme kontrolü (en yüksek öncelik)
  // Eğer soru daha önce eğitilmişse, tam eşleşen cevabı döndür
  if (options?.trainingHistory && options.trainingHistory.length > 0) {
    // Tam eşleşme arama - kelime düzenine bile duyarlı
    const exactMatch = options.trainingHistory.find(item => 
      item.userInput.toLowerCase().trim() === normalizedPrompt
    );
    
    if (exactMatch) {
      return {
        text: exactMatch.systemOutput,
        confidence: 0.95,
        concepts: exactMatch.systemOutput.split(/\s+/).slice(0, 3),
        processingTime: Date.now() - startTime
      };
    }
  }
  
  // EĞİTİM BENZERLİĞİ - Yüksek benzerlik kontrolü
  if (options?.trainingHistory && options.trainingHistory.length > 0) {
    // Girdi kelimelerini ayır
    const promptWords = normalizedPrompt.split(/\s+/);
    
    // En iyi benzerlik eşleşmesini arama
    let bestMatch = null;
    let bestScore = 0.6; // Eşik değer - bu değerin altındaki benzerlikler kabul edilmeyecek
    
    for (const item of options.trainingHistory) {
      const trainedInput = item.userInput.toLowerCase().trim();
      const trainedWords = trainedInput.split(/\s+/);
      
      // Benzerlik puanı hesaplama
      let wordMatches = 0;
      for (const word of promptWords) {
        if (trainedWords.includes(word)) {
          wordMatches++;
        }
      }
      
      // Jaccard benzerlik katsayısı
      const commonWords = wordMatches;
      const totalUniqueWords = new Set([...promptWords, ...trainedWords]).size;
      const similarityScore = commonWords / totalUniqueWords;
      
      // Eğer daha iyi bir eşleşme bulunduysa, güncelle
      if (similarityScore > bestScore) {
        bestMatch = item;
        bestScore = similarityScore;
      }
    }
    
    // Yeterince iyi bir benzerlik varsa, eğitilmiş cevabı döndür
    if (bestMatch) {
      return {
        text: bestMatch.systemOutput,
        confidence: bestScore,
        concepts: bestMatch.systemOutput.split(/\s+/).slice(0, 3),
        processingTime: Date.now() - startTime
      };
    }
  }
  
  // İLİŞKİ TABANLI YANIT - Aktivasyon modeli için geliştirilmiş versiyon
  if (options?.useActivation && options.userNetworks && options.systemNetworks && options.relations) {
    // Durdurma kelimeleri (stopwords) ve kısa kelimeleri filtrele
    const keywordExtractor = (text: string): string[] => {
      // Türkçe durdurma kelimeleri
      const stopwords = ['ve', 'veya', 'bir', 'bu', 'şu', 'o', 'da', 'de', 'için', 'ile', 'mi', 'ne', 'ama', 'fakat'];
      return text.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopwords.includes(word));
    };
    
    const keywords = keywordExtractor(normalizedPrompt);
    
    if (keywords.length > 0) {
      // Aktivasyon sonuçlarını tüm anahtar kelimeler için topla
      let combinedActivation: ActivationResult | null = null;
      let activatedConcepts: Set<string> = new Set();
      let totalConfidence = 0;
      
      // Her anahtar kelime için aktivasyon yap
      for (const keyword of keywords) {
        const activation = propagateActivation(
          options.userNetworks,
          options.systemNetworks,
          options.relations,
          keyword,
          4 // Derinliği artırdık (3'ten 4'e)
        );
        
        // Konseptleri birleştir
        activation.primaryConcepts.forEach(concept => activatedConcepts.add(concept));
        
        // Güven değerini topla
        totalConfidence += activation.confidence;
        
        // İlk aktivasyon veya daha iyi bir aktivasyon ise kaydet
        if (!combinedActivation || activation.responseScore > combinedActivation.responseScore) {
          combinedActivation = activation;
        }
      }
      
      // Ortalama güven değeri
      const avgConfidence = totalConfidence / keywords.length;
      
      // Konsept dizisini oluştur
      const concepts = Array.from(activatedConcepts);
      
      if (combinedActivation && concepts.length > 0 && avgConfidence > 0.2) {
        // Hafıza bilgilerini dahil et
        let contextInfo = '';
        if (options.activeMemories && options.activeMemories.length > 0) {
          const randomMemory = options.activeMemories[Math.floor(Math.random() * options.activeMemories.length)];
          if (Math.random() > 0.7) { // %30 olasılıkla hafıza bilgisi ekle
            contextInfo = `Hatırlıyorum ki ${randomMemory}. `;
          }
        }
        
        // Yanıt şablonları
        const responseTemplates = [
          // Bilgi verme şablonları
          `${contextInfo}${concepts[0]} hakkında bilgi vermem gerekirse, ${
            concepts.length > 1 ? `${concepts[1]} ile ilişkili olarak ` : ''
          }şunları söyleyebilirim: Bu konu ${
            combinedActivation.activatedRelations.length > 2 ? 'birçok farklı kavramla' : 'bazı önemli kavramlarla'
          } bağlantılıdır.`,
          
          // Soru yanıtlama şablonları
          `${contextInfo}${concepts[0]} sorunuza yanıt olarak: ${
            concepts.length > 1 ? `${concepts[1]} ve ${concepts[0]} arasında önemli bir ilişki vardır.` : 
            `Bu konu hakkında bildiklerim sınırlı olsa da yardımcı olmaya çalışacağım.`
          }`,
          
          // Doğrudan yanıt şablonları
          `${concepts[0]} ${concepts.length > 1 ? `ve ${concepts[1]}` : ''} konusunda yardımcı olabilirim. ${
            options.activeMemories && options.activeMemories.length > 0 ? 
            `Daha önce ${options.activeMemories[0].split(' ').slice(0, 3).join(' ')} hakkında konuşmuştuk.` : 
            `Bu konuda daha fazla bilgi ister misiniz?`
          }`,
          
          // Detaylı yanıt
          `${contextInfo}Sorduğunuz ${concepts[0]} konusu hakkında şunları söyleyebilirim: ${
            concepts.length > 1 ? `${concepts.slice(1, 3).join(' ve ')} ile yakından ilişkilidir.` : 
            'Bu önemli bir konudur ve size detaylı bilgi verebilirim.'
          } ${combinedActivation.activatedRelations.length > 3 ? 
            `Bu alanda ${combinedActivation.activatedRelations.length} farklı bağlantı tespit ettim.` : 
            ''
          }`,
          
          // Kısa yanıt
          `${concepts[0]} konusunda size yardımcı olabilirim. Ne öğrenmek istersiniz?`
        ];
        
        // Daha karmaşık yanıtları seçme olasılığını artır
        const extendedTemplates = [...responseTemplates];
        // İlk iki (daha detaylı) şablonu 2 kez ekleyerek seçilme şansını artır
        extendedTemplates.push(responseTemplates[0], responseTemplates[1]); 
        
        const template = extendedTemplates[Math.floor(Math.random() * extendedTemplates.length)];
        
        return {
          text: template,
          confidence: Math.min(0.9, avgConfidence * 1.2), // Güven değerini biraz artır
          concepts: concepts,
          processingTime: Date.now() - startTime
        };
      }
    }
  }
  
  // ANAHTAR KELİME TABLI YANIT - Eğitilmemiş durum için yedek
  const keywords = [
    { word: "merhaba", responses: ["Merhaba! Nasıl yardımcı olabilirim?", "Merhaba! Size nasıl yardımcı olabilirim?"] },
    { word: "nasılsın", responses: ["İyiyim, teşekkür ederim! Siz nasılsınız?", "Harikayım, size nasıl yardımcı olabilirim?"] },
    { word: "teşekkür", responses: ["Rica ederim!", "Ne demek, her zaman yardımcı olmaktan mutluluk duyarım."] },
    { word: "yapay zeka", responses: ["Yapay zeka alanı son yıllarda hızla gelişiyor.", "Yapay zeka sistemleri her geçen gün daha akıllı hale geliyor."] },
    { word: "sinir ağı", responses: ["Sinir ağları, yapay zekanın temel bileşenlerinden biridir.", "Sinir ağları, insan beynindeki nöronların çalışma prensibini taklit eder."] },
    { word: "hafıza", responses: ["Hafıza sistemleri, yapay zeka asistanlarının en önemli özelliklerinden biridir.", "Modern yapay zeka sistemleri, kısa ve uzun vadeli hafıza mekanizmaları kullanır."] },
    { word: "türkçe", responses: ["Türkçe doğal dil işleme alanında çalışmalar giderek artıyor.", "Türkçe, yapay zeka sistemleri için zengin ve ilginç bir dildir."] },
    { word: "eğitim", responses: ["Yapay zeka sistemlerini eğitmek için büyük miktarda veri gereklidir.", "Eğitim süreci, yapay zeka sistemlerinin kalitesini belirleyen en önemli faktördür."] },
    { word: "bilgi", responses: ["Bilgi işleme ve öğrenme, yapay zeka sistemlerinin temel özellikleridir.", "Bilgi, yapay zeka sistemlerinin daha iyi yanıtlar üretmesini sağlar."] },
    { word: "yardım", responses: ["Size nasıl yardımcı olabilirim?", "Sorularınızı yanıtlamak için buradayım."] },
    { word: "mobil", responses: ["Mobil uyumlu arayüzler günümüzde çok önemli hale geldi.", "Mobil deneyim, kullanıcıların uygulamaları daha çok tercih etmelerini sağlar."] },
    { word: "tasarım", responses: ["İyi bir tasarım, kullanıcı deneyimini önemli ölçüde geliştirir.", "Modern tasarım ilkeleri, kullanıcı dostu arayüzler oluşturmaya yardımcı olur."] }
  ];
  
  // Anahtar kelimeleri kontrol et
  for (const keyword of keywords) {
    if (normalizedPrompt.includes(keyword.word)) {
      const response = keyword.responses[Math.floor(Math.random() * keyword.responses.length)];
      return {
        text: response,
        confidence: 0.7,
        concepts: [keyword.word],
        processingTime: Date.now() - startTime
      };
    }
  }
  
  // VARSAYILAN YANIT - Hiçbir eşleşme bulunamazsa
  const defaultResponses = [
    "Merhaba! Size nasıl yardımcı olabilirim?",
    "Bu konu hakkında biraz daha bilgi verebilir misiniz?",
    "Anladım, bu konuyu araştırmak için elimden geleni yapacağım.",
    "Bu soruya net bir yanıt vermek zor, çünkü birçok faktöre bağlı.",
    "İlginç bir bakış açısı! Farklı perspektiflerden düşünmek önemli.",
    "Bu konuda birkaç kaynak önerebilirim size.",
    "Türkçe doğal dil işleme konusundaki gelişmeler çok heyecan verici.",
    "Yapay zeka sistemlerinin Türkçe dil desteği giderek gelişiyor.",
    "Sinir ağları, insan beyninin çalışma prensiplerinden ilham alır.",
    "Sizin için bu problemi çözmek için bir strateji düşünelim.",
    "Bu konuda daha fazla bilgi edinmek isterseniz, size yardımcı olabilirim.",
    "Bence bu yaklaşım doğru yönde bir adım olabilir."
  ];
  
  return {
    text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    confidence: 0.5,
    concepts: [],
    processingTime: Date.now() - startTime
  };
};
