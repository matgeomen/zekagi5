/**
 * Yapay Sinir Ağı Yardımcı Fonksiyonları
 */

// Sabitler
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
 * Boş bir ızgara oluştur
 */
export const createEmptyGrid = (rows: number, cols: number): (NetworkNode | null)[][] => {
  const grid: (NetworkNode | null)[][] = [];
  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < cols; j++) {
      grid[i][j] = null;
    }
  }
  return grid;
};

/**
 * Ağa yeni hücre ekle
 * @param networks Mevcut ağ katmanları
 * @param increaseAmount Eklenecek hücre sayısı
 * @returns Güncellenmiş ağ katmanları
 */
export const addCellsToNetwork = (
  networks: (NetworkNode | null)[][][],
  increaseAmount: number = 2
): (NetworkNode | null)[][][] => {
  // Ağın mevcut yapısını koru
  const updatedNetworks = JSON.parse(JSON.stringify(networks)) as (NetworkNode | null)[][][];
  
  // Her katmana hücre ekle
  for (let layer = 0; layer < updatedNetworks.length; layer++) {
    // Mevcut satır sayısı
    const currentRows = updatedNetworks[layer].length;
    
    // Yeni satırlar ekle
    for (let i = 0; i < increaseAmount; i++) {
      const newRow: (NetworkNode | null)[] = [];
      
      // Her sütun için null değer ekle
      for (let col = 0; col < updatedNetworks[layer][0].length; col++) {
        newRow.push(null);
      }
      
      // Yeni satırı ekle
      updatedNetworks[layer].push(newRow);
    }
  }
  
  return updatedNetworks;
};

/**
 * Ağdan hücre sil
 * @param networks Mevcut ağ katmanları
 * @param decreaseAmount Silinecek hücre sayısı
 * @returns Güncellenmiş ağ katmanları
 */
export const removeCellsFromNetwork = (
  networks: (NetworkNode | null)[][][],
  decreaseAmount: number = 2
): (NetworkNode | null)[][][] => {
  // Ağın mevcut yapısını koru
  const updatedNetworks = JSON.parse(JSON.stringify(networks)) as (NetworkNode | null)[][][];
  
  // Her katmandan hücre sil (en az 4 satır kalacak şekilde)
  for (let layer = 0; layer < updatedNetworks.length; layer++) {
    // Mevcut satır sayısı
    const currentRows = updatedNetworks[layer].length;
    
    // Minimum 4 satır kalacak şekilde hesapla
    const rowsToRemove = Math.min(decreaseAmount, currentRows - 4);
    
    if (rowsToRemove > 0) {
      // Son satırdan başlayarak sil (içinde düğüm olmayan satırları tercih et)
      const rowsToKeep = currentRows - rowsToRemove;
      const newRows: (NetworkNode | null)[][] = [];
      
      // Önce düğüm içeren satırları koru
      let nonEmptyRows = 0;
      for (let row = 0; row < currentRows; row++) {
        const hasNodes = updatedNetworks[layer][row].some(node => node !== null);
        if (hasNodes && nonEmptyRows < rowsToKeep) {
          newRows.push(updatedNetworks[layer][row]);
          nonEmptyRows++;
        }
      }
      
      // Boş satırları ekleyerek row sayısını tamamla
      let remainingRows = rowsToKeep - nonEmptyRows;
      if (remainingRows > 0) {
        for (let row = 0; row < currentRows && remainingRows > 0; row++) {
          const hasNodes = updatedNetworks[layer][row].some(node => node !== null);
          if (!hasNodes && !newRows.includes(updatedNetworks[layer][row])) {
            newRows.push(updatedNetworks[layer][row]);
            remainingRows--;
          }
        }
      }
      
      // Yeni ızgarayı güncelle
      updatedNetworks[layer] = newRows;
    }
  }
  
  return updatedNetworks;
};

/**
 * Ağ düğümü arayüzü
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

// Bu fonksiyon yukarıda tanımlandı

/**
 * Kelime için pozisyon bul
 */
export const findPositionForWord = (
  grid: (NetworkNode | null)[][],
  centerX = Math.floor(grid[0].length / 2),
  centerY = Math.floor(grid.length / 2),
  maxDistance = 5
): { row: number; col: number } | null => {
  // Spiral arama algoritması ile boş pozisyonu bul
  for (let distance = 0; distance <= maxDistance; distance++) {
    // Üst kenar
    for (let i = -distance; i <= distance; i++) {
      const row = centerY - distance;
      const col = centerX + i;
      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length && !grid[row][col]) {
        return { row, col };
      }
    }
    
    // Sağ kenar
    for (let i = -distance + 1; i <= distance; i++) {
      const row = centerY + i;
      const col = centerX + distance;
      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length && !grid[row][col]) {
        return { row, col };
      }
    }
    
    // Alt kenar
    for (let i = distance - 1; i >= -distance; i--) {
      const row = centerY + distance;
      const col = centerX + i;
      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length && !grid[row][col]) {
        return { row, col };
      }
    }
    
    // Sol kenar
    for (let i = distance - 1; i >= -distance + 1; i--) {
      const row = centerY + i;
      const col = centerX - distance;
      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length && !grid[row][col]) {
        return { row, col };
      }
    }
  }
  
  return null;
};

/**
 * Benzersiz kimlik oluştur
 */
export const uuid = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Kelimeyi ağa ekle (geliştirilmiş)
 */
export const addWordToNetwork = (
  word: string,
  network: (NetworkNode | null)[][][],
  layer: number,
  existingNodes: Map<string, { node: NetworkNode, layer: number, row: number, col: number }>,
  parentWord?: string
): NetworkNode | null => {
  // Kelimenin kimliğini oluştur
  const wordId = word.toLowerCase() + "-" + uuid();
  
  // Eğer kelime zaten varsa, mevcut düğümü güçlendir ve döndür
  for (const [_, info] of existingNodes.entries()) {
    if (info.node.word.toLowerCase() === word.toLowerCase()) {
      // Mevcut düğümü güncelle (kullanım sayısını arttır)
      info.node.count += 1;
      info.node.frequency += 1;
      info.node.modifiedAt = Date.now();
      
      // Aktivasyon değerini arttır
      info.node.activation = Math.min(1, info.node.activation + 0.2);
      info.node.activationHistory.push(info.node.activation);
      
      // Ebeveyn kelime varsa bağlantı ekle
      if (parentWord) {
        const parentInfo = Array.from(existingNodes.values()).find(n => 
          n.node.word.toLowerCase() === parentWord.toLowerCase()
        );
        
        if (parentInfo) {
          // Ebeveyn bağlantısı ekle
          if (!info.node.parentWords.includes(parentWord)) {
            info.node.parentWords.push(parentWord);
          }
          
          // Çift yönlü bağlantı
          if (!info.node.connections.includes(parentInfo.node.id)) {
            info.node.connections.push(parentInfo.node.id);
          }
          
          if (!parentInfo.node.connections.includes(info.node.id)) {
            parentInfo.node.connections.push(info.node.id);
          }
          
          // Bağlantı güçlerini güncelle
          info.node.connectionStrengths = info.node.connectionStrengths || {};
          parentInfo.node.connectionStrengths = parentInfo.node.connectionStrengths || {};
          
          info.node.connectionStrengths[parentInfo.node.id] = 
            (info.node.connectionStrengths[parentInfo.node.id] || 0) + 0.1;
          
          parentInfo.node.connectionStrengths[info.node.id] = 
            (parentInfo.node.connectionStrengths[info.node.id] || 0) + 0.1;
        }
      }
      
      return info.node;
    }
  }
  
  // Kelime ağda yoksa, bu katmanda yeni pozisyon bul
  const grid = network[layer];
  const position = findPositionForWord(grid);
  
  if (!position) {
    console.error(`Kelime '${word}' için pozisyon bulunamadı (katman ${layer})`);
    return null;
  }
  
  // Anlamsal vektör oluştur
  const semanticVector = generateSimpleSemanticVector(word);
  
  // Kategoriyi belirle
  const category = categorizeWord(word);
  
  // Duygu değerini hesapla
  const sentiment = calculateSentiment(word);
  
  // Yeni düğüm oluştur
  const newNode: NetworkNode = {
    id: wordId,
    word: word,
    activation: 0.8, // Başlangıçta yüksek aktivasyon
    count: 1,
    connections: [],
    dependency: Math.floor(Math.random() * 40) + 20, // 20-60 arası
    association: Math.floor(Math.random() * 40) + 20, // 20-60 arası
    frequency: 1,
    order: 1,
    feedback: 0,
    depth: layer,
    parentWords: parentWord ? [parentWord] : [],
    
    // Gelişmiş özellikler
    lastActivation: Date.now(),
    activationHistory: [0.8], // Başlangıç aktivasyonu
    semanticVector: semanticVector,
    category: category,
    sentiment: sentiment,
    importance: Math.floor(Math.random() * 30) + 10, // 10-40 arası
    connectionStrengths: {},
    createdAt: Date.now(),
    modifiedAt: Date.now()
  };
  
  // Düğümü ağa yerleştir
  grid[position.row][position.col] = newNode;
  
  // Düğüm bilgilerini kaydet
  existingNodes.set(newNode.id, {
    node: newNode,
    layer,
    row: position.row,
    col: position.col
  });
  
  // Ebeveyn kelime varsa bağlantı ekle
  if (parentWord) {
    const parentInfo = Array.from(existingNodes.values()).find(n => 
      n.node.word.toLowerCase() === parentWord.toLowerCase()
    );
    
    if (parentInfo) {
      // Çift yönlü bağlantı
      newNode.connections.push(parentInfo.node.id);
      parentInfo.node.connections.push(newNode.id);
      
      // Bağlantı güçlerini ayarla
      newNode.connectionStrengths = newNode.connectionStrengths || {};
      parentInfo.node.connectionStrengths = parentInfo.node.connectionStrengths || {};
      
      newNode.connectionStrengths[parentInfo.node.id] = 0.5; // Başlangıç gücü
      parentInfo.node.connectionStrengths[newNode.id] = 0.5; // Başlangıç gücü
    }
  }
  
  return newNode;
};

/**
 * Ağda düğüm bul
 */
function findNodeInNetwork(network: (NetworkNode | null)[][][], nodeId: string): NetworkNode | null {
  for (let layer = 0; layer < network.length; layer++) {
    for (let row = 0; row < network[layer].length; row++) {
      for (let col = 0; col < network[layer][0].length; col++) {
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
  if (vec1.length !== vec2.length) {
    return 0;
  }
  
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
  
  const mag = mag1 * mag2;
  return mag === 0 ? 0 : dotProduct / mag;
}

/**
 * Basit anlamsal vektör oluştur
 */
function generateSimpleSemanticVector(word: string): number[] {
  // Gerçek bir uygulamada, bu bir word embedding API'si olabilir
  // Burada basit bir yaklaşım kullanıyoruz
  const vector = [];
  const seed = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const random = (n: number) => {
    const x = Math.sin(n) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = 0; i < 5; i++) {
    vector.push((random(seed + i) * 2) - 1); // -1 ile 1 arasında değerler
  }
  
  return vector;
}

/**
 * Kelimeyi kategorize et
 */
function categorizeWord(word: string): string {
  const categories: Record<string, string[]> = {
    'isim': ['insan', 'araba', 'ev', 'kitap', 'bilgisayar', 'telefon', 'masa', 'sandalye'],
    'fiil': ['gitmek', 'gelmek', 'yapmak', 'etmek', 'söylemek', 'görmek', 'duymak', 'hissetmek'],
    'sıfat': ['güzel', 'iyi', 'kötü', 'büyük', 'küçük', 'hızlı', 'yavaş', 'uzun', 'kısa', 'yüksek'],
    'zamir': ['ben', 'sen', 'o', 'biz', 'siz', 'onlar', 'bu', 'şu', 'kim', 'ne', 'kendi'],
    'bağlaç': ['ve', 'veya', 'ama', 'fakat', 'çünkü', 'eğer', 'ile', 'ancak', 'ya da'],
    'edat': ['için', 'gibi', 'kadar', 'göre', 'dolayı', 'beri', 'önce', 'sonra', 'rağmen'],
    'nicelik': ['bir', 'iki', 'üç', 'az', 'çok', 'biraz', 'fazla', 'tüm', 'hepsi', 'her']
  };
  
  const wordLower = word.toLowerCase();
  
  for (const [category, examples] of Object.entries(categories)) {
    for (const example of examples) {
      if (wordLower.includes(example)) {
        return category;
      }
    }
  }
  
  // Basit morfem analizi
  if (wordLower.endsWith('lik') || wordLower.endsWith('lık') || 
      wordLower.endsWith('luk') || wordLower.endsWith('lük')) {
    return 'isim';
  }
  
  if (wordLower.endsWith('mek') || wordLower.endsWith('mak')) {
    return 'fiil';
  }
  
  if (wordLower.length > 3 && (
      wordLower.endsWith('ci') || wordLower.endsWith('cı') || 
      wordLower.endsWith('cu') || wordLower.endsWith('cü'))) {
    return 'isim';
  }
  
  // Varsayılan kategori
  return wordLower.length <= 3 ? 'bağlaç' : 'isim';
}

/**
 * Duygu değeri hesapla (basit)
 */
function calculateSentiment(word: string): number {
  const positiveWords = [
    'iyi', 'güzel', 'harika', 'muhteşem', 'sevmek', 'başarı', 'mutlu', 'sevinç',
    'keyif', 'huzur', 'dostluk', 'eğlence', 'destek', 'coşku', 'heyecan'
  ];
  
  const negativeWords = [
    'kötü', 'çirkin', 'berbat', 'korkunç', 'nefret', 'başarısız', 'mutsuz', 'üzüntü',
    'acı', 'kaygı', 'endişe', 'korku', 'öfke', 'sıkıntı', 'stres', 'tehlike'
  ];
  
  const wordLower = word.toLowerCase();
  
  for (const positive of positiveWords) {
    if (wordLower.includes(positive)) {
      return 0.5; // Pozitif duygu
    }
  }
  
  for (const negative of negativeWords) {
    if (wordLower.includes(negative)) {
      return -0.5; // Negatif duygu
    }
  }
  
  return 0; // Nötr
}

/**
 * Yeni ilişki oluştur
 */
export const createRelation = (
  userWord: string,
  systemWord: string,
  dependency: number = 50,
  association: number = 50,
  frequency: number = 1,
  order: number = 1,
  feedback: number = 0,
  bidirectional: boolean = false,
  context: string[] = [],
  relationType: 'semantic' | 'temporal' | 'causal' | 'hierarchical' = 'semantic'
): Relation => {
  const strength = (dependency + association) / 2; // İlişki gücü
  
  return {
    id: uuid(),
    userWord,
    systemWord,
    dependency,
    association,
    frequency,
    order,
    feedback,
    strength,
    context,
    learningCount: 1,
    lastUsed: Date.now(),
    creationTime: Date.now(),
    relationType,
    bidirectional,
    confidence: 0.5 // Başlangıç güven değeri
  };
};

/**
 * İlişki güçlendirme
 */
export const reinforceRelation = (relation: Relation, amount: number, feedback?: number): Relation => {
  // İlişkiyi güçlendir
  const updatedRelation = { ...relation };
  
  updatedRelation.dependency = Math.min(100, Math.max(1, relation.dependency + amount));
  updatedRelation.association = Math.min(100, Math.max(1, relation.association + amount));
  updatedRelation.learningCount += 1;
  updatedRelation.lastUsed = Date.now();
  updatedRelation.strength = (updatedRelation.dependency + updatedRelation.association) / 2;
  
  // Eğer geri bildirim varsa güncelle
  if (feedback !== undefined) {
    updatedRelation.feedback = Math.min(100, Math.max(-100, relation.feedback + feedback));
  }
  
  // Güven değerini güncelle (öğrenme sayısına bağlı)
  updatedRelation.confidence = Math.min(1, Math.max(0, 0.5 + (updatedRelation.learningCount / 20)));
  
  return updatedRelation;
};

/**
 * İlişkileri zayıflatma (unutma)
 */
export const weakenRelations = (relations: Relation[], factor: number = FORGET_RATE): Relation[] => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // Bir günlük milisaniye
  
  return relations.map(relation => {
    const daysSinceLastUse = (now - relation.lastUsed) / oneDay;
    
    // Son kullanımdan bu yana geçen gün sayısına göre zayıflat
    if (daysSinceLastUse > 1) {
      const weakenAmount = Math.min(15, factor * daysSinceLastUse); // En fazla 15 puan zayıflat
      
      return {
        ...relation,
        dependency: Math.max(1, relation.dependency - weakenAmount),
        association: Math.max(1, relation.association - weakenAmount),
        strength: Math.max(1, relation.strength - weakenAmount),
        confidence: Math.max(0.1, relation.confidence - (weakenAmount / 100))
      };
    }
    
    return relation;
  });
};

/**
 * Sinir ağı aktivasyonu
 */
export const propagateActivation = (
  userNetworks: (NetworkNode | null)[][][],
  systemNetworks: (NetworkNode | null)[][][],
  relations: Relation[],
  inputText: string,
  maxDepth: number = 3
): ActivationResult => {
  const startTime = Date.now();
  
  // İnput metnini kelimelere ayır
  const inputWords = inputText.toLowerCase().split(/\s+/);
  
  // Aktivasyon sonuçları
  const activatedNodes: NetworkNode[] = [];
  const activatedRelations: Relation[] = [];
  const activationPath: { layer: number; row: number; col: number; type: 'user' | 'system'; value: number; word: string }[] = [];
  const activationLevels = new Map<string, number>(); // Düğüm kimliği -> aktivasyon seviyesi
  
  // Düğüm pozisyonlarını tut
  const nodePositions = new Map<string, { layer: number; row: number; col: number; type: 'user' | 'system' }>();
  
  // Tüm ağdaki düğümlerin pozisyonlarını kaydet
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
  
  // Aktivasyon kuyruğu
  type ActivationQueueItem = {
    node: NetworkNode;
    position: { layer: number; row: number; col: number; type: 'user' | 'system' };
    activationValue: number;
    depth: number;
  };
  
  const activationQueue: ActivationQueueItem[] = [];
  
  // Başlangıç aktivasyonu (kullanıcı ağı)
  for (let layer = 0; layer < userNetworks.length; layer++) {
    for (let row = 0; row < userNetworks[layer].length; row++) {
      for (let col = 0; col < userNetworks[layer][0].length; col++) {
        const node = userNetworks[layer][row][col];
        if (node) {
          // Kelime eşleşmesi kontrolü
          let matched = false;
          for (const inputWord of inputWords) {
            if (calculateWordSimilarity(node.word.toLowerCase(), inputWord) > 0.7) {
              matched = true;
              break;
            }
          }
          
          if (matched) {
            // Aktivasyon seviyesi: 1.0 (tam aktivasyon)
            node.activation = 1.0;
            node.lastActivation = Date.now();
            node.activationHistory.push(1.0);
            
            activationQueue.push({
              node,
              position: { layer, row, col, type: 'user' },
              activationValue: 1.0,
              depth: 0
            });
            
            activatedNodes.push(node);
            activationLevels.set(node.id, 1.0);
            
            activationPath.push({
              layer, row, col, type: 'user', value: 1.0, word: node.word
            });
          }
        }
      }
    }
  }
  
  // Aktivasyonu yay
  while (activationQueue.length > 0) {
    const current = activationQueue.shift()!;
    
    // Maksimum derinliği aştıysak durdur
    if (current.depth >= maxDepth) {
      continue;
    }
    
    const currentNodeId = current.node.id;
    const currentNodeValue = current.activationValue;
    
    // Bağlantıları takip et
    for (const connectionId of current.node.connections) {
      // Kullanıcı ağında düğümü bul
      let connectedNode = findNodeInNetwork(userNetworks, connectionId);
      let nodeType: 'user' | 'system' = 'user';
      
      // Eğer kullanıcı ağında yoksa, sistem ağında ara
      if (!connectedNode) {
        connectedNode = findNodeInNetwork(systemNetworks, connectionId);
        nodeType = 'system';
      }
      
      if (connectedNode) {
        // Bağlantının gücünü al
        const connectionStrength = current.node.connectionStrengths?.[connectionId] || 0.5;
        
        // Yeni aktivasyon değeri
        const newActivationValue = currentNodeValue * connectionStrength * (1 - ACTIVATION_DECAY_RATE);
        
        // Mevcut aktivasyonla karşılaştır
        const currentActivation = activationLevels.get(connectionId) || 0;
        const activationValue = Math.max(currentActivation, newActivationValue);
        
        // Düğümün pozisyonunu bul
        const position = nodePositions.get(connectionId);
        
        if (activationValue > CONNECTION_THRESHOLD && position) {
          // Aktivasyon seviyesini güncelle
          connectedNode.activation = activationValue;
          connectedNode.lastActivation = Date.now();
          connectedNode.activationHistory.push(activationValue);
          
          activationLevels.set(connectionId, activationValue);
          
          // Bu düğüm daha önce aktive edilmemişse, aktivasyona ekle
          if (!activatedNodes.find(n => n.id === connectionId)) {
            activatedNodes.push(connectedNode);
            
            activationPath.push({
              ...position,
              value: activationValue,
              word: connectedNode.word
            });
            
            // Sıradaki aktivasyon
            activationQueue.push({
              node: connectedNode,
              position,
              activationValue,
              depth: current.depth + 1
            });
          }
        }
      }
    }
    
    // İlişkileri kontrol et
    for (const relation of relations) {
      // Mevcut düğüm kullanıcı kelimesi mi?
      if (current.node.word.toLowerCase() === relation.userWord.toLowerCase()) {
        // İlişkideki sistem kelimesine aktive et
        for (let layer = 0; layer < systemNetworks.length; layer++) {
          for (let row = 0; row < systemNetworks[layer].length; row++) {
            for (let col = 0; col < systemNetworks[layer][0].length; col++) {
              const node = systemNetworks[layer][row][col];
              
              if (node && node.word.toLowerCase() === relation.systemWord.toLowerCase()) {
                // İlişki gücüne bağlı aktivasyon
                const activationValue = currentNodeValue * (relation.strength / 100) * (1 - ACTIVATION_DECAY_RATE);
                
                // Mevcut aktivasyonla karşılaştır
                const currentActivation = activationLevels.get(node.id) || 0;
                const newActivation = Math.max(currentActivation, activationValue);
                
                if (newActivation > CONNECTION_THRESHOLD) {
                  // Aktivasyon seviyesini güncelle
                  node.activation = newActivation;
                  node.lastActivation = Date.now();
                  node.activationHistory.push(newActivation);
                  
                  activationLevels.set(node.id, newActivation);
                  activatedRelations.push(relation);
                  
                  // Bu düğüm daha önce aktive edilmemişse, aktivasyona ekle
                  if (!activatedNodes.find(n => n.id === node.id)) {
                    activatedNodes.push(node);
                    
                    activationPath.push({
                      layer, row, col, type: 'system',
                      value: newActivation,
                      word: node.word
                    });
                    
                    // Sıradaki aktivasyon
                    activationQueue.push({
                      node,
                      position: { layer, row, col, type: 'system' },
                      activationValue: newActivation,
                      depth: current.depth + 1
                    });
                  }
                }
              }
            }
          }
        }
      }
      // Mevcut düğüm sistem kelimesi mi? (ve ilişki çift yönlüyse)
      else if (relation.bidirectional && current.node.word.toLowerCase() === relation.systemWord.toLowerCase()) {
        // İlişkideki kullanıcı kelimesine aktive et
        for (let layer = 0; layer < userNetworks.length; layer++) {
          for (let row = 0; row < userNetworks[layer].length; row++) {
            for (let col = 0; col < userNetworks[layer][0].length; col++) {
              const node = userNetworks[layer][row][col];
              
              if (node && node.word.toLowerCase() === relation.userWord.toLowerCase()) {
                // İlişki gücüne bağlı aktivasyon
                const activationValue = currentNodeValue * (relation.strength / 100) * (1 - ACTIVATION_DECAY_RATE);
                
                // Mevcut aktivasyonla karşılaştır
                const currentActivation = activationLevels.get(node.id) || 0;
                const newActivation = Math.max(currentActivation, activationValue);
                
                if (newActivation > CONNECTION_THRESHOLD) {
                  // Aktivasyon seviyesini güncelle
                  node.activation = newActivation;
                  node.lastActivation = Date.now();
                  node.activationHistory.push(newActivation);
                  
                  activationLevels.set(node.id, newActivation);
                  activatedRelations.push({ ...relation, isReversed: true });
                  
                  // Bu düğüm daha önce aktive edilmemişse, aktivasyona ekle
                  if (!activatedNodes.find(n => n.id === node.id)) {
                    activatedNodes.push(node);
                    
                    activationPath.push({
                      layer, row, col, type: 'user',
                      value: newActivation,
                      word: node.word
                    });
                    
                    // Sıradaki aktivasyon
                    activationQueue.push({
                      node,
                      position: { layer, row, col, type: 'user' },
                      activationValue: newActivation,
                      depth: current.depth + 1
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Aktive edilen kavramları önem sırasına göre sırala
  const primaryConcepts = activatedNodes
    .filter(node => node.activation > 0.5)
    .sort((a, b) => b.activation - a.activation || b.importance! - a.importance!)
    .map(node => node.word)
    .slice(0, 5);
  
  // Yanıt puanı hesapla (1-100 arası)
  const responseScore = Math.min(100, Math.max(1, Math.round(
    (activatedNodes.length * 5) + 
    (activatedRelations.length * 10) + 
    (activatedNodes.reduce((sum, node) => sum + node.activation, 0) * 20)
  )));
  
  // Güven değeri hesapla (0-1 arası)
  const confidence = Math.min(1, Math.max(0, 
    (activatedRelations.length > 0) 
      ? activatedRelations.reduce((sum, rel) => sum + rel.confidence, 0) / activatedRelations.length
      : 0.3
  ));
  
  // İşlem süresi
  const processingTime = Date.now() - startTime;
  
  return {
    activationPath,
    activatedNodes,
    activatedRelations,
    primaryConcepts,
    responseScore,
    confidence,
    processingTime
  };
};

/**
 * Kelime benzerliği hesapla (Levenshtein mesafesi)
 */
function calculateWordSimilarity(word1: string, word2: string): number {
  if (word1 === word2) return 1;
  if (word1.length === 0) return 0;
  if (word2.length === 0) return 0;
  
  // Levenshtein mesafesi
  const matrix: number[][] = [];
  
  // Matris ilklendirme
  for (let i = 0; i <= word1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= word2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Mesafe hesaplama
  for (let i = 1; i <= word1.length; i++) {
    for (let j = 1; j <= word2.length; j++) {
      const cost = word1[i - 1] === word2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // silme
        matrix[i][j - 1] + 1,      // ekleme
        matrix[i - 1][j - 1] + cost // değiştirme
      );
    }
  }
  
  // Normalleştirilmiş benzerlik (0-1 arası)
  const maxLength = Math.max(word1.length, word2.length);
  const distance = matrix[word1.length][word2.length];
  
  return 1 - (distance / maxLength);
}

/**
 * Tersine düşünme için soru tipini belirle
 * @param question Kullanıcı sorusu
 * @returns Soru tipi
 */
export const determineQuestionType = (question: string): {
  type: 'what-is' | 'where-is' | 'who-is' | 'how-to' | 'when-is' | 'other';
  subject: string;
} => {
  const lowerQuestion = question.toLowerCase().trim();
  const words = lowerQuestion.split(/\s+/);
  let type: 'what-is' | 'where-is' | 'who-is' | 'how-to' | 'when-is' | 'other' = 'other';
  let subject = '';
  
  // "Nedir" tipindeki sorular
  if (
    lowerQuestion.includes('nedir') || 
    lowerQuestion.includes('ne demek') || 
    lowerQuestion.includes('nedir?') || 
    lowerQuestion.includes('ne demektir') ||
    lowerQuestion.endsWith('ne') ||
    lowerQuestion.endsWith('ne?')
  ) {
    type = 'what-is';
    
    // Son cümle öğesini konu olarak al (genellikle "... nedir?" kalıbında)
    if (lowerQuestion.includes('nedir') || lowerQuestion.includes('nedir?')) {
      subject = words.slice(0, words.indexOf('nedir')).join(' ');
    } else if (lowerQuestion.includes('ne demek')) {
      subject = words.slice(0, words.indexOf('ne')).join(' ');
    } else if (lowerQuestion.endsWith('ne') || lowerQuestion.endsWith('ne?')) {
      subject = words.slice(0, words.length - 1).join(' ');
    }
  }
  // "Nerede" tipindeki sorular
  else if (
    lowerQuestion.includes('nerede') || 
    lowerQuestion.includes('neresi') ||
    lowerQuestion.includes('nerededir')
  ) {
    type = 'where-is';
    
    // "X nerede?" veya "X neresi?" formatında
    if (lowerQuestion.includes('nerede')) {
      subject = words.slice(0, words.indexOf('nerede')).join(' ');
    } else if (lowerQuestion.includes('neresi')) {
      subject = words.slice(0, words.indexOf('neresi')).join(' ');
    }
  }
  // "Kim" tipindeki sorular
  else if (lowerQuestion.includes('kim')) {
    type = 'who-is';
    subject = words.slice(0, words.indexOf('kim')).join(' ');
  }
  // "Nasıl" tipindeki sorular
  else if (lowerQuestion.includes('nasıl')) {
    type = 'how-to';
  }
  // "Ne zaman" tipindeki sorular
  else if (lowerQuestion.includes('ne zaman')) {
    type = 'when-is';
  }
  
  // Konu yoksa, belirli kelimeleri çıkararak tahmin et
  if (!subject && words.length > 1) {
    const stopwords = ['mi', 'midir', 'mudur', 'mıdır', 'müdür', 'bir', 'bu', 'şu', 'şey'];
    subject = words.filter(w => !stopwords.includes(w)).join(' ');
  }
  
  return { type, subject: subject.trim() };
};

/**
 * Tersine soruları işle - "Ankara nedir?" -> "Türkiye'nin başkentidir"
 * @param query Kullanıcı sorgusu
 * @param trainingData Eğitim verileri
 * @returns Tersine cevap ya da null
 */
export const findReverseAnswer = (
  query: string, 
  trainingData: TrainingPair[]
): { response: string; confidence: number } | null => {
  const { type, subject } = determineQuestionType(query);
  
  // Sadece "nedir?" tipi sorularla ilgilen
  if ((type !== 'what-is' && type !== 'where-is') || !subject) {
    return null;
  }
  
  // Eğitim verisini tara, burada subject bir cevap olarak görünüyor mu diye bak
  const matches: { pair: TrainingPair; score: number }[] = [];
  
  for (const pair of trainingData) {
    const outputLower = pair.output.toLowerCase();
    const subjectLower = subject.toLowerCase();
    
    // Tam eşleşme
    if (outputLower === subjectLower) {
      matches.push({ pair, score: 1.0 });
      continue;
    }
    
    // İlk kelime eşleşiyor mu?
    if (outputLower.startsWith(subjectLower + ' ') || outputLower.startsWith(subjectLower + ',')) {
      matches.push({ pair, score: 0.9 });
      continue;
    }
    
    // İfade çıktının herhangi bir yerinde tam olarak geçiyor mu?
    if (outputLower.includes(' ' + subjectLower + ' ') || 
        outputLower.includes(', ' + subjectLower + ' ')) {
      matches.push({ pair, score: 0.8 });
      continue;
    }
    
    // Benzerlik kontrolü
    const similarity = calculateWordSimilarity(outputLower, subjectLower);
    if (similarity > 0.8) {
      matches.push({ pair, score: similarity });
    }
  }
  
  // En iyi eşleşmeyi bul
  matches.sort((a, b) => b.score - a.score);
  
  if (matches.length > 0 && matches[0].score >= 0.7) {
    const bestMatch = matches[0].pair;
    
    // Cevap oluştur
    let response = '';
    
    // Önce direkt cevap olup olmadığını kontrol et
    if (bestMatch.input.includes('cevap') || bestMatch.input.includes('yanıt')) {
      // Direkt cevabı döndür, ön ekler olmadan
      response = subject;
    }
    else if (bestMatch.input.includes('neresi')) {
      // "Türkiye'nin başkenti neresidir" -> "Ankara, Türkiye'nin başkentidir." (nokta eklendi)
      response = `${subject}, ${bestMatch.input.replace(/\s+neresi.*$/i, '')}dir.`;
    } 
    else if (bestMatch.input.includes('nerede')) {
      // "X nerede bulunur" -> "Y, X'de bulunur." (nokta eklendi)
      response = `${subject}, ${bestMatch.input.replace(/\s+nerede.*$/i, '')}dir.`;
    }
    else {
      // Genel format (nokta eklendi)
      response = `${subject}, ${bestMatch.input.replace(/\?/g, '').trim()}dir.`;
    }
    
    // Çift "-dir" eki varsa düzelt
    response = response.replace(/dirdir/, 'dir');
    
    // İlk harfi büyük yap
    response = response.charAt(0).toUpperCase() + response.slice(1);
    
    return {
      response,
      confidence: matches[0].score * 0.8 // Güven biraz düşük olsun
    };
  }
  
  return null;
};

/**
 * Yanıt oluştur (geliştirilmiş)
 */
export const generateResponse = async (
  activationResult: ActivationResult,
  trainingData: TrainingPair[],
  recentConversation: string = ""
): Promise<{ response: string; usedTraining: TrainingPair | null; confidence: number }> => {
  const { activatedNodes, primaryConcepts, confidence } = activationResult;
  
  // Önce ters sorgu kontrolü yap
  if (recentConversation) {
    const reverseResponse = findReverseAnswer(recentConversation, trainingData);
    if (reverseResponse) {
      // Bu konuyla ilgili bildiğim ifadesini temizleme
      let cleanResponse = reverseResponse.response;
      cleanResponse = cleanResponse.replace(/Bu konuyla ilgili bildiğim[:]*\s*/g, '')
                                 .replace(/Bu konuda bildiğim[:]*\s*/g, '')
                                 .replace(/^"(.+)"$/g, '$1')
                                 .trim();
      
      return {
        response: cleanResponse,
        usedTraining: null,
        confidence: reverseResponse.confidence,
      };
    }
  }
  
  // Yanıt için tüm kelimeleri yüksek aktivasyona göre sırala
  const sortedWords = activatedNodes
    .sort((a, b) => b.activation - a.activation)
    .map(node => node.word);
  
  // Önce en iyi eşleşme için eğitim verilerini kontrol et
  let bestMatch: { pair: TrainingPair; score: number } | null = null;
  
  for (const pair of trainingData) {
    const inputWords = pair.input.toLowerCase().split(/\s+/);
    let matchScore = 0;
    
    // Ana kavramlar için puan ver
    for (const concept of primaryConcepts) {
      if (pair.input.toLowerCase().includes(concept.toLowerCase())) {
        matchScore += 3;
      }
    }
    
    // İnput kelimelerinin eşleşme puanı
    for (const word of inputWords) {
      for (const concept of primaryConcepts) {
        if (calculateWordSimilarity(word, concept.toLowerCase()) > 0.7) {
          matchScore += 2;
        }
      }
    }
    
    // Önceki konuşma bağlamını kullan
    if (recentConversation && pair.input.toLowerCase().includes(recentConversation.toLowerCase())) {
      matchScore += 2;
    }
    
    // Daha iyi bir eşleşme bulunduysa güncelle
    if (!bestMatch || matchScore > bestMatch.score) {
      bestMatch = { pair, score: matchScore };
    }
  }
  
  // İyi bir eşleşme varsa, eğitim çıktısını kullan
  if (bestMatch && bestMatch.score > 3) {
    // Eğitim çiftinin kullanım sayısını arttır
    const updatedPair = { ...bestMatch.pair, usageCount: (bestMatch.pair.usageCount || 0) + 1 };
    
    // Eğer çıktı "Bu konuyla ilgili bildiğim" ifadesini içeriyorsa, temizle
    let response = bestMatch.pair.output;
    
    // Tekrarlamalı olarak tüm "Bu konuyla ilgili bildiğim" ifadelerini temizle
    let hasChanged = true;
    while (hasChanged) {
      const originalResponse = response;
      response = response.replace(/Bu konuyla ilgili bildiğim[:]*\s*/g, '')
                        .replace(/Bu konuda bildiğim[:]*\s*/g, '')
                        .replace(/^"(.+)"$/g, '$1') // Sadece başta ve sonda tırnak varsa kaldır
                        .trim();
      
      // Değişiklik olmazsa döngüden çık
      hasChanged = originalResponse !== response;
    }
    
    // Eğitim verilerinde metin tekrarlarını temizle
    // Örneğin "nasılsın İyiyim" -> "İyiyim" dönüştürülecek
    const wordPairs = bestMatch.pair.input.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    for (const word of wordPairs) {
      // Eğer girdi kelimesi cevabın başında yer alıyorsa kaldır
      const wordRegex = new RegExp(`^${word}\\s+`, 'i');
      response = response.replace(wordRegex, '');
    }
    
    // Eğer yanıt aynı cümleyi birden fazla kez içeriyorsa sadece bir kez göster
    const sentences = response.split(/[.!?]+/).filter(s => s.trim()).map(s => s.trim());
    if (sentences.length > 1) {
      const uniqueSentences = [];
      for (const sentence of sentences) {
        if (!uniqueSentences.some(s => s.toLowerCase().includes(sentence.toLowerCase()) || 
                                     sentence.toLowerCase().includes(s.toLowerCase()))) {
          uniqueSentences.push(sentence);
        }
      }
      response = uniqueSentences.join('. ');
    }
    
    // Noktalama işaretlerini düzenle
    if (!response.endsWith('.') && !response.endsWith('!') && !response.endsWith('?')) {
      response += '.';
    }
    
    // İlk harfi büyük yap
    response = response.charAt(0).toUpperCase() + response.slice(1);
    
    // Çift loglama sorununu çözmek için log kaldırıldı
    
    return {
      response: response,
      usedTraining: updatedPair,
      confidence: Math.min(0.9, confidence + 0.2) // Eğitim çifti kullanıldığında güven artar
    };
  }
  
  // Eğitim verisinde iyi bir eşleşme yoksa, aktivasyon sonuçlarını kullan
  
  // Basit cevap oluştur (gerçek bir uygulamada burada bir dil modeli olacak)
  let response = "Anladığım kadarıyla ";
  
  if (primaryConcepts.length > 0) {
    response += primaryConcepts.slice(0, 3).join(", ") + " hakkında konuşuyorsunuz. ";
    
    // Aktivasyon seviyesi yüksek kelimeleri ekle
    const highActivationWords = activatedNodes
      .filter(node => node.activation > 0.7)
      .map(node => node.word)
      .slice(0, 5);
    
    if (highActivationWords.length > 0) {
      response += "Ayrıca " + highActivationWords.join(", ") + " konuları da önemli görünüyor.";
    } else {
      response += "Daha fazla bilgi verebilir misiniz?";
    }
  } else {
    // Eğitim verisinde ve bağlantılarda bir bilgi bulunamadığında standart yanıt
    response = "Üzgünüm, bu konuda bilgi bulamadım. Daha açık bir şekilde ifade edebilir misiniz?";
  }
  
  // Sorgu tekrarını önleme
  const cleanUserInput = recentConversation;
  // Cevabın başında kullanıcı sorusunun tekrarlanmasını önle
  // Başta "abaküs nedir?" gibi bir tekrar varsa temizle
  if (cleanUserInput.length > 0) {
    const questionPattern = new RegExp(`^${cleanUserInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
    response = response.replace(questionPattern, '');
  }
  
  // Cümleleri ayır ve tekrarları temizle - Tamamen yeniden yazıldı
  const sentences = response.split(/[.!?]+\s*/).filter(s => s.trim());
  if (sentences.length > 0) {
    // Benzer cümleleri tespit etmek için daha katı bir algoritma
    const uniqueSentences: Array<string> = [];
    const similarityThreshold = 0.75; // %75 benzerlik eşiği (daha sıkı)
    
    // İlk geçiş: Tam düplicatları kaldır
    for (const sentence of sentences) {
      if (!uniqueSentences.includes(sentence)) {
        uniqueSentences.push(sentence);
      }
    }
    
    // İkinci geçiş: Benzer cümleleri kaldır
    const filteredSentences: Array<string> = [];
    
    for (const sentence of uniqueSentences) {
      // Çok kısa cümleleri doğrudan ekle (3 kelimeden az)
      if (sentence.split(/\s+/).length < 3) {
        filteredSentences.push(sentence);
        continue;
      }
      
      // Benzerlik kontrolü
      let isDuplicate = false;
      
      for (const existingSentence of filteredSentences) {
        // Çok kısa cümleleri karşılaştırma
        if (existingSentence.split(/\s+/).length < 3) continue;
        
        // Temel kelime kontrolü
        const words1 = sentence.toLowerCase().split(/\s+/);
        const words2 = existingSentence.toLowerCase().split(/\s+/);
        
        // Jaccard benzerlik indeksi hesapla - daha kesin bir metrik
        const intersection = words1.filter(word => words2.includes(word)).length;
        const union = new Set([...words1, ...words2]).size;
        const similarity = intersection / union;
        
        // Eğer bir cümle diğerinin tamamen alt kümesiyse
        const isSubset = words1.every(word => words2.includes(word)) || 
                        words2.every(word => words1.includes(word));
                        
        // Benzerlik OR alt küme ise duplike olarak işaretle
        if (similarity > similarityThreshold || isSubset) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        filteredSentences.push(sentence);
      }
    }
    
    // Emoji kategorileri - yanıt tipine göre
    const knowledgeEmojis = ['💡', '📚', '🧠', '✨', '🔍'];
    const humorEmojis = ['😄', '😊', '😁', '🙂', '😉'];
    const adviceEmojis = ['👍', '✅', '⭐️', '🌟', '💯'];
    const feedbackEmojis = ['🙌', '👏', '🎯', '🏆', '🔑'];
    
    // Yanıt içeriğini analiz ederek uygun emoji kategorisini seç
    let emojiPool = knowledgeEmojis; // Varsayılan olarak bilgi emojileri
    
    // Yanıtın içeriğine göre emoji havuzunu belirle
    const responseText = filteredSentences.join('. ').toLowerCase();
    
    if (responseText.includes('öneririm') || responseText.includes('tavsiye') || 
        responseText.includes('yapmanız gereken') || responseText.includes('daha iyi olur')) {
      emojiPool = adviceEmojis;
    } else if (responseText.includes('komik') || responseText.includes('eğlenceli') || 
              responseText.includes('güldüren') || responseText.includes('espri')) {
      emojiPool = humorEmojis;
    } else if (responseText.includes('tebrikler') || responseText.includes('harika') || 
              responseText.includes('aferin') || responseText.includes('iyi iş')) {
      emojiPool = feedbackEmojis;
    }
    
    // Rastgele emoji ekle (yaklaşık %40 ihtimalle - biraz artırıldı)
    const shouldAddEmoji = Math.random() < 0.4;
    
    // Filtre sonrası cümleleri birleştir
    response = filteredSentences.join('. ');
    
    // Cümlenin sonuna nokta ekle
    if (!response.endsWith('.') && !response.endsWith('!') && !response.endsWith('?')) {
      response += '.';
    }
    
    // Emoji ekle
    if (shouldAddEmoji && filteredSentences.length > 0) {
      const randomEmoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
      response = response + ' ' + randomEmoji;
    }
  }
  
  return {
    response,
    usedTraining: null,
    confidence: Math.max(0.3, confidence) // En az 0.3 güven seviyesi
  };
};
