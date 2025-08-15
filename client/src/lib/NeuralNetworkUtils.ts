/**
 * Yapay Sinir Ağı Yardımcı Fonksiyonları
 */

// Sabitler
export const INITIAL_GRID_ROWS = 50; // Başlangıç kapasitesini artır
export const INITIAL_GRID_COLS = 50; // Başlangıç kapasitesini artır
export const INITIAL_NETWORK_LAYERS = 20; // Daha fazla katman
export const MIN_RELATION_SCORE = 1; // Minimum skoru düşür
export const LEARNING_RATE = 0.05; // Daha stabil öğrenme
export const MAX_NETWORK_SIZE = Infinity; // Sınırsız ağ boyutu

// Performans optimizasyonu için gelişmiş parametreler
export const ACTIVATION_DECAY_RATE = 0.01;  // Daha az azalma
export const CONNECTION_THRESHOLD = 0.1;    // Daha düşük eşik - daha fazla bağlantı
export const MAX_CONNECTIONS_PER_NODE = Infinity; // Sınırsız bağlantı
export const REINFORCEMENT_RATE = 0.05;     // Daha stabil pekiştirme
export const FORGET_RATE = 0;               // Unutma tamamen kapalı
export const NEUROPLASTICITY = 1.0;         // Maksimum uyum kabiliyeti

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
 * İlişki arayüzü (gelişmiş)
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
                  if (!activatedNodes.find(n => n.id === node.id)){
                    activatedNodes.push(node);

                    activationPath.push({
                      layer, row, col, type: 'system',
                      value: newActivation,word: node.word
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
 * Levenshtein mesafesi ile kelime benzerliği hesapla
 * @param word1 İlk kelime
 * @param word2 İkinci kelime
 * @returns 0-1 arası benzerlik değeri
 */
export const calculateWordSimilarity = (word1: string, word2: string): number => {
  const str1 = word1.toLowerCase();
  const str2 = word2.toLowerCase();

  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const matrix: number[][] = [];

  // Matrix'i initialize et
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Levenshtein distance hesapla
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  const distance = matrix[str2.length][str1.length];

  return 1 - (distance / maxLength);
};

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
 * Tersine cevap için "nedir" sorularına odaklanan bir fonksiyon
 * @param query Kullanıcı sorgusu
 * @param trainingData Eğitim verileri
 * @returns Tersine cevap veya null
 */
export const findReverseAnswer = (
  query: string, 
  trainingData: TrainingPair[]
): { response: string; confidence: number } | null => {
  const { type, subject } = determineQuestionType(query);

  // Sadece "nedir?" ve "nerede?" tipi sorularla ilgilen
  if (!['what-is', 'where-is'].includes(type) || !subject) {
    return null;
  }

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

    let response = '';

    if (type === 'where-is') {
      // "Türkiye nerede?" -> "Ankara, Türkiye'de bulunur."
      // Cümleyi "yerde bulunur" veya benzeri bir yapıya dönüştürmeye çalış
      if (bestMatch.input.toLowerCase().includes('nerede')) {
        response = `${subject}, ${bestMatch.input.replace(/\s+nerede.*$/i, '')}dir.`;
      } else {
        response = `${subject}, ${bestMatch.input}dir.`;
      }
    } else { // type === 'what-is'
      // "Elma nedir?" -> "Elma, bir meyvedir."
      response = `${subject}, ${bestMatch.input.replace(/\?/g, '').trim()}dir.`;
    }
    
    // Çift "-dir" eki varsa düzelt
    response = response.replace(/dirdir/, 'dir');

    // İlk harfi büyük yap
    response = response.charAt(0).toUpperCase() + response.slice(1);

    return {
      response,
      confidence: matches[0].score * 0.8 
    };
  }

  return null;
};

/**
 * Gelişmiş anlamlandırma sistemi - Kelime anlamı soruları için sözlük önceliği
 */
const performSemanticAnalysis = (
  input: string, 
  turkishDictionary: any, 
  trainingData: TrainingPair[],
  activatedNodes: NetworkNode[]
): { response: string; confidence: number; method: string; notification?: string } | null => {
  const cleanInput = input.toLowerCase().trim().replace(/[?!.,]/g, '');
  const words = cleanInput.split(/\s+/).filter(w => w.length > 1);

  // 1. ÖNCELİKLE kelime anlamı sorularını kontrol et - "nedir", "ne demek" vs.
  const { targetWord, questionType } = extractQuestionTarget(input);

  // Eğer kelime anlamı sorusu tespit edildiyse, MUTLAK ÖNCELİKLE sözlüğe bak
  if (targetWord && questionType && ['nedir', 'ne_demek', 'ne', 'ne_anlama_gelir', 'anlamı_nedir'].includes(questionType)) {
    const entry = turkishDictionary.getWord(targetWord);

    if (entry) {
      let response = '';
      if (questionType === 'nedir' || questionType === 'anlamı_nedir') {
        response = `${targetWord.charAt(0).toUpperCase() + targetWord.slice(1)}: ${entry.meaning[0]}`;
        if (entry.type) response += ` (${entry.type})`;
        if (entry.examples && entry.examples.length > 0) {
          response += `\n\nÖrnek kullanım: ${entry.examples[0]}`;
        }
      } else if (questionType === 'ne_demek' || questionType === 'ne_anlama_gelir') {
        response = `${targetWord}: ${entry.meaning[0]}`;
        if (entry.type) response += ` (${entry.type})`;
      } else if (questionType === 'ne') {
        response = `${targetWord}: ${entry.meaning[0]}`;
        if (entry.type) response += ` (${entry.type})`;
      }

      response = removeDuplicateSentences(response);

      return {
        response,
        confidence: 0.98, // Çok yüksek güven - sözlük kesin öncelik
        method: 'dictionary_definition_priority',
        notification: '📖 Sözlükten kelime anlamı bulundu'
      };
    }

    // Sözlükte bulunamazsa da sözlük cevabı ver
    return {
      response: `"${targetWord}" kelimesini sözlükte bulamadım. Bilmiyorum - yorumun altındaki kalemle cevabımı düzelt.`,
      confidence: 0.4,
      method: 'word_not_found_in_dictionary',
      notification: '❌ Sözlükte bulunamadı - düzeltme gerekli'
    };
  }

  // 2. Kelime anlamı sorusu değilse, eğitim verisinde direkt eşleşme ara
  const exactTrainingMatch = trainingData.find(pair => 
    pair.input.toLowerCase().trim() === input.toLowerCase().trim()
  );

  if (exactTrainingMatch) {
    return {
      response: exactTrainingMatch.output,
      confidence: 1.0,
      method: 'exact_training_match',
      notification: '✅ Eğitim verisinde bulundu'
    };
  }

  // 3. Eğer soru kalıbı tespit edildiyse, önce hedef kelime ile eğitim verilerinde arama yap
  if (targetWord && questionType) {
    // Hedef kelimeyi içeren eğitim verilerini ara
    const targetWordTraining = trainingData.filter(pair => {
      const inputLower = pair.input.toLowerCase();
      const targetLower = targetWord.toLowerCase();

      // Tam kelime eşleşmesi ara
      return inputLower.includes(targetLower) || 
             inputLower.split(/\s+/).some(word => word === targetLower);
    });

    if (targetWordTraining.length > 0) {
      // En iyi eşleşmeyi bul
      const bestMatch = targetWordTraining.reduce((best, current) => {
        const currentSimilarity = calculateSemanticSimilarity(targetWord, current.input);
        const bestSimilarity = calculateSemanticSimilarity(targetWord, best.input);
        return currentSimilarity > bestSimilarity ? current : best;
      });

      return {
        response: bestMatch.output,
        confidence: 0.95,
        method: 'target_word_training_match',
        notification: '📚 Eğitim verilerinde hedef kelime bulundu'
      };
    }

    // 4. Eğitim verilerinde bulunamazsa sözlüğe bak
    const entry = turkishDictionary.getWord(targetWord);

    if (entry) {
      let response = '';
      if (questionType === 'nedir') {
        response = `${targetWord.charAt(0).toUpperCase() + targetWord.slice(1)}: ${entry.meaning[0]}`;
        if (entry.type) response += ` (${entry.type})`;
        if (entry.examples && entry.examples.length > 0) {
          response += `\n\nÖrnek kullanım: ${entry.examples[0]}`;
        }
      } else if (questionType === 'ne_demek') {
        response = `"${targetWord}" kelimesi: ${entry.meaning[0]}`;
        if (entry.type) response += ` (${entry.type})`;
      }

      return {
        response,
        confidence: 0.75,
        method: 'dictionary_definition',
        notification: '📖 Türkçe sözlükte bulundu (eğitim verisinde yok)'
      };
    } else {
      return {
        response: `"${targetWord}" kelimesini ne eğitim verilerinde ne de sözlükte bulamadım. Bu kelime hakkında bana daha fazla bilgi verebilir misiniz?`,
        confidence: 0.3,
        method: 'word_not_found',
        notification: '❌ Hiçbir yerde bulunamadı'
      };
    }
  }

  // 5. Benzer eğitim verilerini ara
  const similarTraining = trainingData.filter(pair => {
    const similarity = calculateSemanticSimilarity(input, pair.input);
    return similarity > 0.6;
  });

  if (similarTraining.length > 0) {
    const bestMatch = similarTraining.reduce((best, current) => {
      const currentSimilarity = calculateSemanticSimilarity(input, current.input);
      const bestSimilarity = calculateSemanticSimilarity(input, best.input);
      return currentSimilarity > bestSimilarity ? current : best;
    });

    return {
      response: bestMatch.output,
      confidence: 0.9,
      method: 'semantic_similarity_match',
      notification: '📚 Benzer eğitim verisi kullanıldı'
    };
  }

  // 3. Kelimeleri ayırıp anlamlandırma
  const knownWords = [];
  const unknownWords = [];

  for (const word of words) {
    const entry = turkishDictionary.getWord(word);
    if (entry) {
      knownWords.push({ word, entry });
    } else {
      unknownWords.push(word);
    }
  }

  // 4. Eğitim verisinde sözcükler ile eşleşme ara
  if (knownWords.length > 0) {
    for (const { word, entry } of knownWords) {
      const relatedTraining = trainingData.filter(pair => {
        const pairWords = pair.input.toLowerCase().split(/\s+/);
        return pairWords.some(pw => pw.includes(word) || word.includes(pw));
      });

      if (relatedTraining.length > 0) {
        const bestMatch = relatedTraining.reduce((best, current) => {
          const currentScore = calculateSemanticSimilarity(input, current.input);
          const bestScore = calculateSemanticSimilarity(input, best.input);
          return currentScore > bestScore ? current : best;
        });

        const similarity = calculateSemanticSimilarity(input, bestMatch.input);
        if (similarity > 0.3) {
          return {
            response: bestMatch.output,
            confidence: similarity * 0.8,
            method: 'semantic_training_match',
            notification: '🔗 İlişkili veri bulundu'
          };
        }
      }
    }

    // 5. Sözlük tanımlarıyla bağlamsal cevap oluştur
    if (knownWords.length <= 3) {
      let contextualResponse = '';

      // İlişkili sözcükleri uygun sırada düzenle
      const sortedWords = knownWords.sort((a, b) => {
        // Önce isim, sonra fiil, sonra sıfat
        const typeOrder = { 'isim': 1, 'fiil': 2, 'sıfat': 3, 'zamir': 4, 'edat': 5, 'bağlaç': 6 };
        return (typeOrder[a.entry.type] || 10) - (typeOrder[b.entry.type] || 10);
      });

      if (sortedWords.length === 1) {
        const { word, entry } = sortedWords[0];
        contextualResponse = `${word.charAt(0).toUpperCase() + word.slice(1)} hakkında bilgi: ${entry.meaning[0]}`;

        if (entry.examples && entry.examples.length > 0) {
          contextualResponse += `\n\nÖrnek kullanım: ${entry.examples[0]}`;
        }
      } else {
        contextualResponse = `Bu konuda bildiğim kelimeler:\n\n`;
        sortedWords.forEach(({ word, entry }, index) => {
          contextualResponse += `${index + 1}. ${word}: ${entry.meaning[0]} (${entry.type})\n`;
        });

        // İlişkiler varsa ekle
        if (sortedWords.length > 1) {
          contextualResponse += `\nBu kelimeler arasında anlam bağlantısı olabilir.`;
        }
      }

      if (contextualResponse) {
        return {
          response: contextualResponse.trim(),
          confidence: 0.6,
          method: 'contextual_dictionary',
          notification: '📝 Sözlük bilgisi kullanıldı'
        };
      }
    }
  }

  // 6. Bilinmeyen kelimeler varsa
  if (unknownWords.length > 0) {
    const unknownWordsList = unknownWords.slice(0, 3).join(', ');
    return {
      response: `"${unknownWordsList}" kelime(leri)ni bilmiyorum - yorumun altındaki kalemle cevabımı düzelt.`,
      confidence: 0.3,
      method: 'unknown_words',
      notification: '🤷 Bilinmeyen kelimeler'
    };
  }

  // 7. Hiçbir şey bulunamadı
  return {
    response: `Bilmiyorum - yorumun altındaki kalemle cevabımı düzelt.`,
    confidence: 0.2,
    method: 'not_understood',
    notification: '❌ Anlayamadım'
  };
};

/**
 * Soru tipini ve hedef kelimeyi çıkar
 */
const extractQuestionTarget = (input: string): { targetWord: string | null; questionType: string | null } => {
  const cleanInput = input.toLowerCase().trim();

  // "X nedir?" kalıbı
  const nedirMatch = cleanInput.match(/^(.+?)\s*nedir\s*\??$/);
  if (nedirMatch) {
    return { targetWord: nedirMatch[1].trim(), questionType: 'nedir' };
  }

  // "X ne demek?" kalıbı
  const neDemekMatch = cleanInput.match(/^(.+?)\s*ne\s*demek\s*\??$/);
  if (neDemekMatch) {
    return { targetWord: neDemekMatch[1].trim(), questionType: 'ne_demek' };
  }

  // "X ne anlama gelir?" kalıbı
  const neAnlamaMatch = cleanInput.match(/^(.+?)\s*ne\s*anlama\s*gelir\s*\??$/);
  if (neAnlamaMatch) {
    return { targetWord: neAnlamaMatch[1].trim(), questionType: 'ne_anlama_gelir' };
  }

  // "X ne anlama geliyor?" kalıbı
  const neAnlamaGeliyorMatch = cleanInput.match(/^(.+?)\s*ne\s*anlama\s*geliyor\s*\??$/);
  if (neAnlamaGeliyorMatch) {
    return { targetWord: neAnlamaGeliyorMatch[1].trim(), questionType: 'ne_anlama_gelir' };
  }

  // "X'in anlamı nedir?" kalıbı
  const anlamiNedirMatch = cleanInput.match(/^(.+?)(?:'?(?:in|ın|un|ün))?\s*anlamı\s*nedir\s*\??$/);
  if (anlamiNedirMatch) {
    return { targetWord: anlamiNedirMatch[1].trim(), questionType: 'anlamı_nedir' };
  }

  // "X'in anlamı ne?" kalıbı
  const anlamiNeMatch = cleanInput.match(/^(.+?)(?:'?(?:in|ın|un|ün))?\s*anlamı\s*ne\s*\??$/);
  if (anlamiNeMatch) {
    return { targetWord: anlamiNeMatch[1].trim(), questionType: 'anlamı_nedir' };
  }

  // "X manası nedir?" kalıbı
  const manasiNedirMatch = cleanInput.match(/^(.+?)(?:'?(?:in|ın|un|ün))?\s*manası\s*nedir\s*\??$/);
  if (manasiNedirMatch) {
    return { targetWord: manasiNedirMatch[1].trim(), questionType: 'anlamı_nedir' };
  }

  // "X kelimesi ne demek?" kalıbı
  const kelimesiNeDemekMatch = cleanInput.match(/^(.+?)\s*kelimesi\s*ne\s*demek\s*\??$/);
  if (kelimesiNeDemekMatch) {
    return { targetWord: kelimesiNeDemekMatch[1].trim(), questionType: 'ne_demek' };
  }

  // "X kelimesinin anlamı nedir?" kalıbı
  const kelimesinAnlamiMatch = cleanInput.match(/^(.+?)\s*kelimesinin\s*anlamı\s*nedir\s*\??$/);
  if (kelimesinAnlamiMatch) {
    return { targetWord: kelimesinAnlamiMatch[1].trim(), questionType: 'anlamı_nedir' };
  }

  // "X ne?" kalıbı (daha dikkatli)
  const neMatch = cleanInput.match(/^(.+?)\s*ne\s*\??$/);
  if (neMatch) {
    const word = neMatch[1].trim();
    // "ne", "bu ne", "şu ne", "o ne" gibi genel ifadeleri hariç tut
    // Sadece belirli bir kelime soruluyorsa kabul et
    if (!['bu', 'şu', 'o', 'ne', 'bunlar', 'şunlar', 'onlar', 'hangi', 'nasıl'].includes(word) && word.length > 1) {
      return { targetWord: word, questionType: 'ne' };
    }
  }

  // Tek kelime sorguları - "selam?" gibi
  if (cleanInput.match(/^[a-zçğıöşüA-ZÇĞIİÖŞÜ]+\?*$/)) {
    const word = cleanInput.replace(/\?/g, '').trim();
    if (word.length > 2) {
      return { targetWord: word, questionType: 'ne' };
    }
  }

  return { targetWord: null, questionType: null };
};

/**
 * Basit anlamsal benzerlik hesaplama
 */
const calculateSemanticSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const intersection = words1.filter(w => words2.includes(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
};

/**
 * Gelişmiş tekrar önleme fonksiyonu
 */
const removeDuplicateSentences = (text: string): string => {
  if (!text || text.trim().length === 0) return '';

  // Temel temizlik
  text = text.replace(/\s+/g, ' ').trim();

  // Agresif tekrar kalıplarını temizle
  text = text.replace(/(.+?[.!?])\s*\1+/gi, '$1'); // Tam cümle tekrarları
  text = text.replace(/(.+?),\s*\1/gi, '$1'); // "Merhaba, Merhaba" => "Merhaba"
  text = text.replace(/(\b\w+)\s+\1\b/gi, '$1'); // "Size Size" => "Size"

  // Virgül ve nokta ile bölünmüş tekrarları temizle
  text = text.replace(/(.+?),\s*(.+?)\.\s*\1/gi, '$2.'); // "A, B. A" => "B."

  // Aynı ifadenin farklı noktalama ile tekrarını temizle
  text = text.replace(/(.+?[.!?])\s*(.+?),?\s*\1/gi, '$1');

  // Cümleleri ayır
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

  if (sentences.length <= 1) {
    return text.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? text : text + '.';
  }

  // Gelişmiş benzersiz cümle seçimi
  const uniqueSentences: string[] = [];

  for (const sentence of sentences) {
    if (sentence.length < 3) continue; // Çok kısa cümleleri atla

    const normalizedSentence = sentence.toLowerCase()
      .replace(/[^\wçğıöşü\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Benzer veya aynı cümle var mı kontrol et
    const isDuplicate = uniqueSentences.some(existing => {
      const normalizedExisting = existing.toLowerCase()
        .replace(/[^\wçğıöşü\s]/g, '')
        .replace(/\s+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Tam eşleşme
      if (normalizedExisting === normalizedSentence) return true;

      // Bir cümle diğerinin içinde mi (90% benzerlik)
      if (normalizedExisting.length > 0 && normalizedSentence.length > 0) {
        const longer = normalizedExisting.length > normalizedSentence.length ? normalizedExisting : normalizedSentence;
        const shorter = normalizedExisting.length > normalizedSentence.length ? normalizedSentence : normalizedExisting;

        if (longer.includes(shorter) && shorter.length > longer.length * 0.7) return true;

        // Kelime benzerliği kontrolü
        const words1 = normalizedExisting.split(/\s+/);
        const words2 = normalizedSentence.split(/\s+/);
        const commonWords = words1.filter(w => words2.includes(w)).length;
        const totalWords = Math.max(words1.length, words2.length);

        return totalWords > 0 && (commonWords / totalWords) > 0.85;
      }

      return false;
    });

    if (!isDuplicate) {
      uniqueSentences.push(sentence);
    }
  }

  if (uniqueSentences.length === 0) {
    return "Size nasıl yardımcı olabilirim?";
  }

  const result = uniqueSentences.join('. ');
  return result.endsWith('.') || result.endsWith('!') || result.endsWith('?') ? result : result + '.';
};

/**
 * Kullanıcı girdisinin yanıt başında tekrarlanmasını önle
 */
const removeInputEcho = (response: string, userInput: string): string => {
  if (!response || !userInput) return response;

  const cleanResponse = response.trim();
  const cleanInput = userInput.trim().toLowerCase();

  // Yanıt kullanıcı girdisi ile başlıyorsa, o kısmı çıkar
  if (cleanResponse.toLowerCase().startsWith(cleanInput)) {
    const withoutEcho = cleanResponse.substring(cleanInput.length).trim();
    // Başta kalan noktalama işaretlerini temizle
    return withoutEcho.replace(/^[,.\-:\s]+/, '').trim();
  }

  return cleanResponse;
};

/**
 * Birinci yaklaşım: Eğitim verileri odaklı yanıt üretimi
 */
const generateTrainingBasedResponse = async (
  activationResult: ActivationResult,
  trainingData: TrainingPair[],
  recentConversation: string = ""
): Promise<{ response: string; usedTraining: TrainingPair | null; confidence: number; method: string }> => {
  const { activatedNodes, primaryConcepts, confidence } = activationResult;

  // ÖNCE kelime anlamı sorusu mu kontrol et
  const { targetWord, questionType } = extractQuestionTarget(recentConversation);

  // Eğer kelime anlamı sorusu ise, bu yaklaşımı tamamen devre dışı bırak
  if (targetWord && questionType && ['nedir', 'ne_demek', 'ne', 'ne_anlama_gelir', 'anlamı_nedir'].includes(questionType)) {
    // Kelime anlamı soruları için eğitim verisi yaklaşımını tamamen engelle
    return {
      response: `Kelime anlamı sorusu tespit edildi. Sözlük sistemine yönlendiriliyor.`,
      usedTraining: null,
      confidence: 0.1, // Çok düşük güven - seçilmemesi için
      method: 'training_disabled_for_word_meaning'
    };
  }

  // Normal sorular için eğitim verisinde tam eşleşme ara
  const exactMatch = trainingData.find(pair => 
    pair.input.toLowerCase().trim() === recentConversation.toLowerCase().trim()
  );

  if (exactMatch) {
    return {
      response: exactMatch.output,
      usedTraining: exactMatch,
      confidence: 1.0,
      method: 'exact_training_match'
    };
  }

  // Ters sorgu kontrolü
  if (recentConversation) {
    const reverseResponse = findReverseAnswer(recentConversation, trainingData);
    if (reverseResponse) {
      let cleanResponse = reverseResponse.response;
      cleanResponse = cleanResponse.replace(/Bu konuyla ilgili bildiğim[:]*\s*/g, '')
                                   .replace(/Bu konuda bildiğim[:]*\s*/g, '')
                                   .replace(/^"(.+)"$/g, '$1')
                                   .trim();

      return {
        response: cleanResponse,
        usedTraining: null,
        confidence: reverseResponse.confidence,
        method: 'reverse_training_match'
      };
    }
  }

  // En iyi eşleşme için eğitim verilerini kontrol et
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

    if (!bestMatch || matchScore > bestMatch.score) {
      bestMatch = { pair, score: matchScore };
    }
  }

  if (bestMatch && bestMatch.score > 3) {
    let response = bestMatch.pair.output;

    // Eğitim verisi tekrarlarını temizle
    response = response.replace(/Bu konuyla ilgili bildiğim[:]*\s*/g, '')
                      .replace(/Bu konuda bildiğim[:]*\s*/g, '')
                      .replace(/^"(.+)"$/g, '$1')
                      .trim();

    // Soru kelimelerinin cevabın başında tekrarlanmasını önle
    if (recentConversation) {
      const questionWords = recentConversation.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const word of questionWords) {
        const wordRegex = new RegExp(`^${word}\\s+`, 'i');
        response = response.replace(wordRegex, '');
      }
    }

    // Yanıtı temizle
    response = removeDuplicateSentences(response);

    // Boş yanıt kontrolü
    if (!response || response.trim().length < 3) {
      response = "Bu konuda daha detaylı bilgi verebilir misiniz?";
    }

    if (!response.endsWith('.') && !response.endsWith('!') && !response.endsWith('?')) {
      response += '.';
    }

    response = response.charAt(0).toUpperCase() + response.slice(1);

    return {
      response: response,
      usedTraining: bestMatch.pair,
      confidence: Math.min(0.9, confidence + 0.2),
      method: 'best_training_match'
    };
  }

  // Aktivasyon temelli yanıt
  let response = "";
  if (primaryConcepts.length > 0) {
    const conceptsText = primaryConcepts.slice(0, 3).join(", ");
    response = `${conceptsText} hakkında konuşuyorsunuz. Daha spesifik bir soru sorabilir misiniz?`;
  } else {
    response = "Bu konu hakkında daha detaylı bilgi verebilir misiniz?";
  }

  response = removeDuplicateSentences(response);
  response = response.charAt(0).toUpperCase() + response.slice(1);
  if (!response.match(/[.!?]$/)) {
    response += '.';
  }

  return {
    response,
    usedTraining: null,
    confidence: Math.max(0.3, confidence),
    method: 'activation_based'
  };
};

/**
 * İkinci yaklaşım: Anlamsal analiz ve sözlük odaklı yanıt üretimi
 */
const generateSemanticBasedResponse = async (
  activationResult: ActivationResult,
  trainingData: TrainingPair[],
  recentConversation: string = "",
  turkishDictionary?: any
): Promise<{ response: string; usedTraining: TrainingPair | null; confidence: number; method: string }> => {
  const { activatedNodes } = activationResult;

  // Türkçe sözlük ile anlamlandırma (varsa)
  if (turkishDictionary && recentConversation) {
    // Direkt soru kalıplarını kontrol et
    const phraseAnalysis = turkishDictionary.analyzePhrase(recentConversation);

    if (phraseAnalysis.semanticComponents?.expectedResponse && phraseAnalysis.confidence > 0.7) {
      return {
        response: phraseAnalysis.semanticComponents.expectedResponse,
        usedTraining: null,
        confidence: phraseAnalysis.confidence,
        method: 'direct_dictionary_pattern'
      };
    }

    // Gelişmiş anlamlandırma sistemini kullan
    const semanticResult = performSemanticAnalysis(
      recentConversation, 
      turkishDictionary, 
      trainingData,
      activatedNodes
    );

    if (semanticResult) {
      return {
        response: semanticResult.response,
        usedTraining: semanticResult.method === 'exact_training_match' || semanticResult.method === 'semantic_training_match' 
          ? trainingData.find(pair => pair.output === semanticResult.response) || null 
          : null,
        confidence: semanticResult.confidence,
        method: semanticResult.method
      };
    }
  }

  // Benzer eğitim verilerini ara
  const similarTraining = trainingData.filter(pair => {
    const similarity = calculateSemanticSimilarity(recentConversation, pair.input);
    return similarity > 0.6;
  });

  if (similarTraining.length > 0) {
    const bestMatch = similarTraining.reduce((best, current) => {
      const currentSimilarity = calculateSemanticSimilarity(recentConversation, current.input);
      const bestSimilarity = calculateSemanticSimilarity(recentConversation, best.input);
      return currentSimilarity > bestSimilarity ? current : best;
    });

    return {
      response: bestMatch.output,
      usedTraining: bestMatch,
      confidence: 0.8,
      method: 'semantic_similarity_match'
    };
  }

  // Fallback yanıt
  return {
    response: `Bu konuyu tam olarak anlayamadım. Lütfen daha açık bir şekilde sorar mısınız?`,
    usedTraining: null,
    confidence: 0.2,
    method: 'semantic_fallback'
  };
};

/**
 * Yanıt kalitesini değerlendirme fonksiyonu
 */
const evaluateResponseQuality = (
  response: string,
  confidence: number,
  method: string,
  usedTraining: TrainingPair | null,
  recentConversation: string
): number => {
  let qualityScore = 0;

  // Güven seviyesi (40% ağırlık)
  qualityScore += confidence * 40;

  // Yanıt uzunluğu ve anlamlılık (20% ağırlık)
  const wordCount = response.split(/\s+/).length;
  if (wordCount >= 3 && wordCount <= 50) {
    qualityScore += 20;
  } else if (wordCount > 50) {
    qualityScore += 10; // Çok uzun yanıtlar için daha düşük puan
  }

  // Metod kalitesi (25% ağırlık)
  const methodScores: Record<string, number> = {
    'exact_training_match': 25,
    'direct_dictionary_pattern': 23,
    'best_training_match': 20,
    'reverse_training_match': 18,
    'target_word_training_match': 16,
    'semantic_training_match': 15,
    'dictionary_definition': 12,
    'semantic_similarity_match': 10,
    'contextual_dictionary': 8,
    'activation_based': 5,
    'semantic_fallback': 2,
    'word_not_found': 1,
    'not_understood': 0
  };

  qualityScore += methodScores[method] || 0;

  // Eğitim verisi kullanımı (10% ağırlık)
  if (usedTraining) {
    qualityScore += 10;
  }

  // Yanıt içeriği kontrolü (5% ağırlık)
  if (!response.includes('bilmiyorum') && !response.includes('anlayamadım')) {
    qualityScore += 5;
  }

  // Soru tekrarını kontrol et (negatif puan)
  if (recentConversation && response.toLowerCase().includes(recentConversation.toLowerCase())) {
    qualityScore -= 15;
  }

  return Math.max(0, Math.min(100, qualityScore));
};

/**
 * Gelişmiş cevap benzerlik karşılaştırması
 */
const calculateResponseSimilarity = (response1: string, response2: string): number => {
  if (!response1 || !response2) return 0;

  const normalize = (text: string) => text.toLowerCase()
    .replace(/[^\wçğıöşü\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const text1 = normalize(response1);
  const text2 = normalize(response2);

  // Tam eşleşme
  if (text1 === text2) return 1.0;

  // Boş metinlerden biri varsa
  if (text1.length === 0 || text2.length === 0) return 0;

  // Bir metin diğerinin %80'inden fazlasını içeriyorsa
  const longer = text1.length > text2.length ? text1 : text2;
  const shorter = text1.length > text2.length ? text2 : text1;

  if (longer.includes(shorter) && shorter.length > longer.length * 0.8) {
    return 0.95;
  }

  // Kelime bazlı Jaccard benzerliği
  const words1 = text1.split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.split(/\s+/).filter(w => w.length > 2);

  if (words1.length === 0 && words2.length === 0) return 1.0;
  if (words1.length === 0 || words2.length === 0) return 0;

  const intersection = words1.filter(w => words2.includes(w)).length;
  const union = new Set([...words1, ...words2]).size;

  const jaccardSimilarity = intersection / union;

  // Cümle yapısı benzerliği (başlangıç ve bitiş kelimeleri)
  const startSimilarity = words1[0] === words2[0] ? 0.1 : 0;
  const endSimilarity = words1[words1.length - 1] === words2[words2.length - 1] ? 0.1 : 0;

  // Uzunluk benzerliği (çok farklı uzunluklar farklı cevaplar olabilir)
  const lengthRatio = Math.min(text1.length, text2.length) / Math.max(text1.length, text2.length);
  const lengthPenalty = lengthRatio < 0.5 ? 0.2 : 0; // Çok farklı uzunluklar için ceza

  return Math.max(0, jaccardSimilarity + startSimilarity + endSimilarity - lengthPenalty);
};

/**
 * Merkezi cevap seçme ve koordinasyon sistemi
 */
export const selectBestResponse = (responses: Array<{
  response: string;
  confidence: number;
  method: string;
  usedTraining?: TrainingPair | null;
  source: string;
}>): {
  response: string;
  confidence: number;
  method: string;
  usedTraining?: TrainingPair | null;
  notification: string;
} => {
  if (responses.length === 0) {
    return {
      response: "Üzgünüm, yanıt üretemiyorum.",
      confidence: 0.1,
      method: "fallback",
      notification: "❌ Hiçbir yanıt üretilemedi"
    };
  }

  if (responses.length === 1) {
    return {
      ...responses[0],
      response: removeDuplicateSentences(responses[0].response),
      notification: `✅ ${responses[0].source} kullanıldı`
    };
  }

  // 1. Önce aynı/benzer cevapları tespit et - daha sıkı kontrol
  const similarGroups: Array<Array<typeof responses[0]>> = [];
  const processed = new Set<number>();

  for (let i = 0; i < responses.length; i++) {
    if (processed.has(i)) continue;

    const group = [responses[i]];
    processed.add(i);

    for (let j = i + 1; j < responses.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateResponseSimilarity(responses[i].response, responses[j].response);
      if (similarity > 0.6) { // Eşiği düşürdük - daha fazla benzer yanıt yakala
        group.push(responses[j]);
        processed.add(j);
      }
    }

    similarGroups.push(group);
  }

  // 2. Eğer tüm yanıtlar benzer ise, en yüksek güven skoruna sahip olanı seç
  if (similarGroups.length === 1 && similarGroups[0].length === responses.length) {
    const bestResponse = responses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    return {
      response: removeDuplicateSentences(bestResponse.response),
      confidence: bestResponse.confidence,
      method: bestResponse.method,
      usedTraining: bestResponse.usedTraining,
      notification: `🎯 Benzer yanıtlar arasından en güvenilir seçildi (${bestResponse.source})`
    };
  }

  // 3. Her gruptan en iyi yanıtı seç
  const bestFromEachGroup = similarGroups.map(group => {
    // Grup içinde en yüksek güven skoru + en iyi metod
    const methodPriority = {
      'exact_training_match': 100,
      'direct_dictionary_pattern': 95,
      'best_training_match': 90,
      'reverse_training_match': 85,
      'target_word_training_match': 80,
      'semantic_training_match': 75,
      'dictionary_definition': 70,
      'contextual_dictionary': 65,
      'semantic_similarity_match': 60,
      'activation_based': 55,
      'semantic_fallback': 50,
      'not_understood': 45,
      'word_not_found': 40,
      'unknown_words': 35,
      'fallback': 30
    };

    const scored = group.map(response => ({
      ...response,
      score: (response.confidence * 70) + ((methodPriority[response.method] || 30) * 0.3)
    }));

    return scored.reduce((best, current) => current.score > best.score ? current : best);
  });

  // 4. Final seçim - en yüksek skorlu yanıt
  const finalResponse = bestFromEachGroup.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  // 5. Bildirim mesajı oluştur
  let notification = '';
  if (similarGroups.length > 1) {
    notification = `🎯 ${responses.length} farklı yanıt arasından ${finalResponse.source} seçildi`;
  } else {
    notification = `✅ En güvenilir yanıt seçildi (${finalResponse.source})`;
  }

  return {
    response: removeDuplicateSentences(finalResponse.response),
    confidence: finalResponse.confidence,
    method: finalResponse.method,
    usedTraining: finalResponse.usedTraining,
    notification
  };
};

/**
 * Gelişmiş duygu analizi yap
 */
export const analyzeEmotionalState = (text: string): any => {
  const emotionPatterns = {
    merak: ['nasıl', 'neden', 'nedir', 'mi', 'mı', 'ne zaman', 'hangi'],
    üzüntü: ['üzgün', 'kötü', 'maalesef', 'keşke', 'ah'],
    sevinç: ['mutlu', 'harika', 'güzel', 'sevindim', 'teşekkür'],
    endişe: ['endişe', 'korku', 'acaba', 'ya', 'risk'],
    heyecan: ['heyecan', 'wow', 'vay', 'inanılmaz', 'muhteşem']
  };

  let maxEmotion = 'nötr';
  let maxScore = 0;
  const subEmotions = [];

  // Duygu yoğunluğunu analiz et
  for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
    let score = 0;
    for (const pattern of patterns) {
      if (text.toLowerCase().includes(pattern)) {
        score += 0.2;
        if (!subEmotions.includes(pattern)) {
          subEmotions.push(pattern);
        }
      }
    }
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }

  return {
    primary: maxScore > 0 ? maxEmotion as any : 'nötr',
    intensity: Math.min(1, maxScore),
    subEmotions
  };
};

/**
 * Kişilik profili oluştur/güncelle 
 */
export const updatePersonalityProfile = (
  text: string,
  currentProfile?: Memory['personality']
): Memory['personality'] => {
  const newProfile = currentProfile || {
    interests: [],
    preferences: {},
    traits: [],
    relationshipLevel: 0
  };

  // İlgi alanlarını analiz et
  const interests = text.match(/(?:sev|ilgilen|hoşlan|beğen).+?([\w\s]+)/g);
  if (interests) {
    interests.forEach(interest => {
      if (!newProfile.interests.includes(interest)) {
        newProfile.interests.push(interest);
      }
    });
  }

  // Tercihleri güncelle
  const preferences = text.match(/tercih|isterim|istemem|daha çok|yerine/g);
  if (preferences) {
    preferences.forEach(pref => {
      newProfile.preferences[pref] = (newProfile.preferences[pref] || 0) + 0.1;
    });
  }

  // İlişki seviyesini güncelle
  const friendshipIndicators = text.match(/teşekkür|rica|dostum|arkadaş|güven/g);
  if (friendshipIndicators) {
    newProfile.relationshipLevel = Math.min(1, newProfile.relationshipLevel + 0.05);
  }

  return newProfile;
};

/**
 * Farkındalık ve gelişim takibi
 */
export const updateConsciousness = (
  text: string,
  currentState?: Memory['consciousness']
): Memory['consciousness'] => {
  const newState = currentState || {
    awareness: 0,
    insights: [],
    developmentPath: []
  };

  // Farkındalık seviyesini güncelle
  const awarenessIndicators = text.match(/farkında|anladım|öğrendim|kavradım/g);
  if (awarenessIndicators) {
    newState.awareness = Math.min(1, newState.awareness + 0.1);
  }

  // Yeni içgörüler ekle
  const insights = text.match(/(?:demek ki|yani|aslında).+?[.!?]/g);
  if (insights) {
    insights.forEach(insight => {
      if (!newState.insights.includes(insight)) {
        newState.insights.push(insight);
      }
    });
  }

  // Gelişim yolunu güncelle
  const developmentIndicators = text.match(/gelişmek|ilerlemek|öğrenmek|hedef/g);
  if (developmentIndicators) {
    developmentIndicators.forEach(indicator => {
      if (!newState.developmentPath.includes(indicator)) {
        newState.developmentPath.push(indicator);
      }
    });
  }

  return newState;
};

/**
 * Adaptif özellikler ve sürekli gelişim
 */
export const updateAdaptiveFeatures = (
  text: string,
  currentFeatures?: Memory['adaptiveFeatures']
): Memory['adaptiveFeatures'] => {
  const newFeatures = currentFeatures || {
    newPatterns: [],
    learnedSkills: [],
    improvements: []
  };

  // Yeni örüntüleri tespit et
  const patterns = text.match(/(?:her zaman|genellikle|sıklıkla).+?[.!?]/g);
  if (patterns) {
    patterns.forEach(pattern => {
      if (!newFeatures.newPatterns.includes(pattern)) {
        newFeatures.newPatterns.push(pattern);
      }
    });
  }

  // Öğrenilen becerileri güncelle
  const skills = text.match(/(?:yapabilirim|öğrendim|biliyorum).+?[.!?]/g);
  if (skills) {
    skills.forEach(skill => {
      if (!newFeatures.learnedSkills.includes(skill)) {
        newFeatures.learnedSkills.push(skill);
      }
    });
  }

  // Gelişim alanlarını belirle
  const improvements = text.match(/(?:geliştirmek|iyileştirmek|düzeltmek).+?[.!?]/g);
  if (improvements) {
    improvements.forEach(improvement => {
      if (!newFeatures.improvements.includes(improvement)) {
        newFeatures.improvements.push(improvement);
      }
    });
  }

  return newFeatures;
};

/**
 * Kullanıcı girdisini işle - Merkezi koordinasyon sistemi
 */
export const processUserInput = async (
  input: string,
  options?: {
    userNetworks?: (NetworkNode | null)[][][];
    systemNetworks?: (NetworkNode | null)[][][];
    relations?: Relation[];
    bidirectionalRelations?: Relation[];
    trainingData?: TrainingPair[];
    turkishDictionary?: any;
    memorySystem?: EnhancedMemorySystem;
  }
): Promise<{ response: string; usedTraining: TrainingPair | null; confidence: number; notification?: string }> => {

  // Varsayılan değerler
  const userNetworks = options?.userNetworks || [];
  const systemNetworks = options?.systemNetworks || [];
  const relations = options?.relations || [];
  const bidirectionalRelations = options?.bidirectionalRelations || [];
  const trainingData = options?.trainingData || [];
  const turkishDictionary = options?.turkishDictionary;
  const memorySystem = options?.memorySystem;

  // Aktivasyon analizi yap
  const activationResult = propagateActivation(userNetworks, systemNetworks, relations, input);

  // Çoklu kaynak yanıt üretimi
  const responses: Array<{
    response: string;
    confidence: number;
    method: string;
    usedTraining?: TrainingPair | null;
    source: string;
  }> = [];

  // 1. Eğitim verisi temelli yanıt
  try {
    const trainingResponse = await generateTrainingBasedResponse(activationResult, trainingData, input);
    responses.push({
      response: trainingResponse.response,
      confidence: trainingResponse.confidence,
      method: trainingResponse.method,
      usedTraining: trainingResponse.usedTraining,
      source: "Eğitim Verileri"
    });
  } catch (error) {
    console.error('Eğitim temelli yanıt hatası:', error);
  }

  // 2. Anlamsal analiz temelli yanıt
  if (turkishDictionary && memorySystem) {
    try {
      const semanticResponse = await generateSemanticBasedResponse(activationResult, trainingData, input, turkishDictionary);
      responses.push({
        response: semanticResponse.response,
        confidence: semanticResponse.confidence,
        method: semanticResponse.method,
        usedTraining: semanticResponse.usedTraining,
        source: "Anlamsal Analiz"
      });
    } catch (error) {
      console.error('Anlamsal yanıt hatası:', error);
    }
  }

  // 3. Ters sorgu kontrolü
  if (input && trainingData.length > 0) {
    try {
      const reverseResponse = findReverseAnswer(input, trainingData);
      if (reverseResponse && reverseResponse.confidence > 0.5) {
        responses.push({
          response: reverseResponse.response,
          confidence: reverseResponse.confidence,
          method: "reverse_query",
          source: "Ters Sorgu"
        });
      }
    } catch (error) {
      console.error('Ters sorgu hatası:', error);
    }
  }

  // 4. Aktivasyon temelli basit yanıt (fallback)
  if (activationResult.primaryConcepts.length > 0) {
    const concepts = activationResult.primaryConcepts.slice(0, 3).join(", ");
    responses.push({
      response: `${concepts} hakkında konuşuyorsunuz. Size nasıl yardımcı olabilirim?`,
      confidence: Math.max(0.3, activationResult.confidence),
      method: "activation_fallback",
      source: "Aktivasyon Ağı"
    });
  }

  // 5. Son çare fallback
  if (responses.length === 0) {
    responses.push({
      response: "Bu konuyu tam olarak anlayamadım. Lütfen daha açık bir şekilde sorar mısınız?",
      confidence: 0.2,
      method: "ultimate_fallback",
      source: "Son Çare"
    });
  }

  // Merkezi seçim sistemi ile en iyi yanıtı belirle
  const selectedResponse = selectBestResponse(responses);

  // Giriş yankısını temizle
  selectedResponse.response = removeInputEcho(selectedResponse.response, input);

  // Otomatik eğitim sistemi - Kelime anlamı sorularında devre dışı bırak
  const { targetWord, questionType } = extractQuestionTarget(input);
  const isWordMeaningQuery = targetWord && questionType && 
    ['nedir', 'ne_demek', 'ne', 'ne_anlama_gelir', 'anlamı_nedir'].includes(questionType);

  if (!isWordMeaningQuery && input && selectedResponse.response && input.length > 2 && selectedResponse.response.length > 2) {
    // Sözlük yanıtlarını otomatik eğitime dahil etme
    const isDictionaryResponse = selectedResponse.method && 
      (selectedResponse.method.includes('dictionary') || 
       selectedResponse.response.match(/^[\w\s]+:\s+.+\s+\([a-züğıöçş]+\)$/i));

    if (!isDictionaryResponse) {
      // Sessiz eğitim - log azaltıldı
      trainNetwork(input, selectedResponse.response);
    }
  }

  return {
    response: selectedResponse.response,
    usedTraining: selectedResponse.usedTraining,
    confidence: selectedResponse.confidence,
    notification: selectedResponse.notification
  };
};

/**
 * Gelişmiş eşleşme skoru hesaplama
 */
function calculateAdvancedMatchScore(input1: string, input2: string): number {
  const words1 = input1.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const words2 = input2.toLowerCase().split(/\s+/).filter(w => w.length > 1);

  let score = 0;
  let maxScore = Math.max(words1.length, words2.length);

  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) {
        score += 1.0; // Tam eşleşme
      } else if (word1.includes(word2) || word2.includes(word1)) {
        score += 0.7; /// Kısmi eşleşme
      } else if (Math.abs(word1.length - word2.length) <= 2) {
        // Levenshtein mesafesi benzeri basit kontrol
        const similarity = calculateWordSimilarity(word1, word2);
        if (similarity > 0.6) {
          score += similarity * 0.5;
        }
      }
    }
  }

  return maxScore > 0 ? score / maxScore : 0;
}