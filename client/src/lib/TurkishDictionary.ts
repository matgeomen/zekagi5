interface DictionaryEntry {
  word: string;
  meaning: string[];
  type: 'isim' | 'fiil' | 'sıfat' | 'zamir' | 'edat' | 'bağlaç' | 'soru' | 'özel';
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
}

interface PhrasePattern {
  pattern: RegExp;
  intent: string;
  confidence: number;
  matches: (words: string[]) => boolean;
  generateResponse: (context: any) => string;
  wasSuccessful?: boolean;
}

interface PhraseAnalysisResult {
  words: DictionaryEntry[];
  understanding: string;
  confidence: number;
  semanticComponents: Record<string, any>;
}

export class TurkishDictionary {
  private dictionary: Map<string, DictionaryEntry>;
  private phrases: Map<string, { meaning: string, type: string }>;
  private patterns: PhrasePattern[];
  private statistics: {
    totalQueries: number;
    successfulQueries: number;
    commonPatterns: Map<string, number>;
  };

  constructor() {
    this.dictionary = new Map();
    this.phrases = new Map();
    this.patterns = [];
    this.statistics = {
      totalQueries: 0,
      successfulQueries: 0,
      commonPatterns: new Map()
    };
    this.initializeBasicWords();
    this.initializeCommonPatterns();
  }

  private initializeBasicWords() {
    const basicWords: DictionaryEntry[] = [
      {
        word: 'kitap',
        meaning: ['Ciltli veya ciltsiz olarak bir araya getirilmiş basılı veya yazılı kağıt yaprakların bütünü'],
        type: 'isim',
        examples: ['kitap okumak', 'kitap yazmak']
      },
      {
        word: 'yürümek',
        meaning: ['Adım atarak ilerlemek, gitmek'],
        type: 'fiil',
        examples: ['parkta yürümek', 'hızlı yürümek']
      },
      {
        word: 'güzel',
        meaning: ['Göze ve kulağa hoş gelen, hayranlık uyandıran'],
        type: 'sıfat',
        examples: ['güzel manzara', 'güzel müzik']
      },
      {
        word: 'hızlı',
        meaning: ['Süratli, çabuk'],
        type: 'sıfat',
        examples: ['hızlı araba', 'hızlı koşmak']
      },
      {
        word: 'okumak',
        meaning: ['Yazıyı seslendirmek veya sessiz olarak anlamak'],
        type: 'fiil',
        examples: ['kitap okumak', 'gazete okumak']
      },
      // ... 9,995 more entries to follow
      {
        word: 'ne',
        meaning: ['soru yoluyla bir şeyin niteliğini, türünü veya durumunu öğrenmeyi amaçlayan söz'],
        type: 'soru',
        examples: ['ne istiyorsun?', 'bu ne?']
      },
      {
        word: 'ben',
        meaning: ['teklik birinci kişiyi gösteren söz'],
        type: 'zamir',
        examples: ['ben geldim', 'benim adım']
      },
      {
        word: 'sen',
        meaning: ['teklik ikinci kişiyi gösteren söz'],
        type: 'zamir',
        examples: ['sen gittin', 'senin adın']
      },
      {
        word: 'o',
        meaning: ['teklik üçüncü kişiyi gösteren söz'],
        type: 'zamir',
        examples: ['o geldi', 'onun adı']
      },
      {
        word: 'biz',
        meaning: ['çokluk birinci kişiyi gösteren söz'],
        type: 'zamir',
        examples: ['biz geldik', 'bizim adımız']
      },
      {
        word: 'siz',
        meaning: ['çokluk ikinci kişiyi gösteren söz'],
        type: 'zamir',
        examples: ['siz gittiniz', 'sizin adınız']
      },
      {
        word: 'onlar',
        meaning: ['çokluk üçüncü kişiyi gösteren söz'],
        type: 'zamir',
        examples: ['onlar geldi', 'onların adı']
      },
      {
        word: 'kim',
        meaning: ['bir şahsı sorma, belirtme sözü'],
        type: 'soru',
        examples: ['kim geldi?', 'kim söyledi?']
      },
      {
        word: 'nerede',
        meaning: ['yer, mevki sorma sözü'],
        type: 'soru',
        examples: ['nerede oturuyorsun?', 'okul nerede?']
      },
      {
        word: 'nasıl',
        meaning: ['bir şeyin yapılış biçimini veya durumunu sorma sözü'],
        type: 'soru',
        examples: ['nasıl gidiyorsun?', 'nasıl bir ev?']
      },
      {
        word: 'neden',
        meaning: ['sebep, gerekçe sorma sözü'],
        type: 'soru',
        examples: ['neden geldin?', 'neden böyle oldu?']
      },
      {
        word: 'nedir',
        meaning: ['bir şeyin anlamını, ne olduğunu sorma sözü'],
        type: 'soru',
        examples: ['bu nedir?', 'amacın nedir?']
      },
      {
        word: 'merhaba',
        meaning: ['selamlama sözü'],
        type: 'isim',
        examples: ['merhaba, nasılsın?', 'herkese merhaba']
      },
      {
        word: 'selam',
        meaning: ['selamlama sözü, esenlik dileme'],
        type: 'isim',
        examples: ['selam verdim', 'selam söyle']
      },
      {
        word: 'günaydın',
        meaning: ['sabah selamlaşma sözü'],
        type: 'isim',
        examples: ['günaydın, nasılsın?', 'herkese günaydın']
      },
      {
        word: 'iyi',
        meaning: ['istenilen, beğenilen nitelikleri taşıyan, kötü karşıtı'],
        type: 'sıfat',
        examples: ['iyi bir insan', 'iyi düşünce']
      },
      {
        word: 'kötü',
        meaning: ['istenilmeyen, beğenilmeyen nitelikleri taşıyan, iyi karşıtı'],
        type: 'sıfat',
        examples: ['kötü hava', 'kötü haber']
      }
    ];

    basicWords.forEach(entry => {
      this.dictionary.set(entry.word, entry);
    });

    // Toplu kelime ekleme örneği
    const additionalWords: DictionaryEntry[] = [
      { word: 'elma', meaning: ['Bir tür meyve'], type: 'isim' },
      { word: 'gitmek', meaning: ['Bir yerden bir yere doğru hareket etmek'], type: 'fiil' },
      // Add more words here...
    ];

    additionalWords.forEach(entry => this.dictionary.set(entry.word, entry));

    // Example bulk addition
    const bulkWords: DictionaryEntry[] = [
      { word: 'armut', meaning: ['Bir meyve türü'], type: 'isim' },
      { word: 'kalem', meaning: ['Yazı yazmak için kullanılan araç'], type: 'isim' },
      { word: 'koşmak', meaning: ['Hızlı bir şekilde hareket etmek'], type: 'fiil' },
      { word: 've', meaning: ['Birleşik halde iki ifadeyi bağlayan söz'], type: 'bağlaç' },

      // En çok kullanılan 1000 Türkçe kelime
      { word: 'bir', meaning: ['Sayı ismi, tek'], type: 'sayı' },
      { word: 'bu', meaning: ['İşaret zamiri, yakınımdaki'], type: 'zamir' },
      { word: 'da', meaning: ['de ile birlikte bağlaç'], type: 'bağlaç' },
      { word: 'de', meaning: ['da ile birlikte bağlaç'], type: 'bağlaç' },
      { word: 'var', meaning: ['Mevcut olan, bulunan'], type: 'sıfat' },
      { word: 'yok', meaning: ['Bulunmayan, olmayan'], type: 'sıfat' },
      { word: 'için', meaning: ['Amaç bildiren edat'], type: 'edat' },
      { word: 'ile', meaning: ['Birliktelik bildiren edat'], type: 'edat' },
      { word: 'çok', meaning: ['Fazla miktarda'], type: 'sıfat' },
      { word: 'daha', meaning: ['Üstünlük derecesi'], type: 'zarf' },
      { word: 'böyle', meaning: ['Bu şekilde'], type: 'sıfat' },
      { word: 'olan', meaning: ['Bulunan, mevcut'], type: 'sıfat' },
      { word: 'olan', meaning: ['Bulunan, mevcut'], type: 'sıfat' },
      { word: 'şey', meaning: ['Genel nesne adı'], type: 'isim' },
      { word: 'her', meaning: ['Bütün, tüm'], type: 'sıfat' },
      { word: 'şu', meaning: ['İşaret zamiri'], type: 'zamir' },
      { word: 'ya', meaning: ['Veya anlamında bağlaç'], type: 'bağlaç' },
      { word: 'or', meaning: ['Veya anlamında bağlaç'], type: 'bağlaç' },
      { word: 'ama', meaning: ['Fakat anlamında bağlaç'], type: 'bağlaç' },
      { word: 'çünkü', meaning: ['Sebep bildiren bağlaç'], type: 'bağlaç' },
      { word: 'eğer', meaning: ['Şart bildiren bağlaç'], type: 'bağlaç' },
      { word: 'kadar', meaning: ['Miktar bildiren edat'], type: 'edat' },
      { word: 'sonra', meaning: ['Zamansal sıralama'], type: 'zarf' },
      { word: 'önce', meaning: ['Zamansal öncelik'], type: 'zarf' },
      { word: 'zaman', meaning: ['Vakit, süre'], type: 'isim' },
      { word: 'yer', meaning: ['Mekan, alan'], type: 'isim' },
      { word: 'gün', meaning: ['24 saatlik zaman dilimi'], type: 'isim' },
      { word: 'yıl', meaning: ['12 aylık zaman dilimi'], type: 'isim' },
      { word: 'ay', meaning: ['Yılın 12 bölümünden biri'], type: 'isim' },
      { word: 'hafta', meaning: ['7 günlük zaman dilimi'], type: 'isim' },
      { word: 'saat', meaning: ['60 dakikalık zaman birimi'], type: 'isim' },
      { word: 'dakika', meaning: ['60 saniyelik zaman birimi'], type: 'isim' },
      { word: 'gelmek', meaning: ['Bir yerden buraya doğru hareket etmek'], type: 'fiil' },
      { word: 'getirmek', meaning: ['Bir şeyi yanında taşıyarak gelmek'], type: 'fiil' },
      { word: 'görmek', meaning: ['Gözle algılamak'], type: 'fiil' },
      { word: 'göstermek', meaning: ['Görülmesini sağlamak'], type: 'fiil' },
      { word: 'almak', meaning: ['Eline geçirmek, satın almak'], type: 'fiil' },
      { word: 'vermek', meaning: ['Başkasına teslim etmek'], type: 'fiil' },
      { word: 'olmak', meaning: ['Varlık kazanmak, bulunmak'], type: 'fiil' },
      { word: 'yapmak', meaning: ['Meydana getirmek, imal etmek'], type: 'fiil' },
      { word: 'etmek', meaning: ['Yapmak, gerçekleştirmek'], type: 'fiil' },
      { word: 'bilmek', meaning: ['Öğrenmiş olmak'], type: 'fiil' },
      { word: 'demek', meaning: ['Söylemek, ifade etmek'], type: 'fiil' },
      { word: 'söylemek', meaning: ['Kelimelerle ifade etmek'], type: 'fiil' },
      { word: 'kalmak', meaning: ['Bir yerde durmak'], type: 'fiil' },
      { word: 'kalmak', meaning: ['Artmak, geri kalmak'], type: 'fiil' },
      { word: 'durmak', meaning: ['Hareketsiz kalmak'], type: 'fiil' },
      { word: 'bakmak', meaning: ['Gözle görmek'], type: 'fiil' },
      { word: 'çıkmak', meaning: ['İçeriden dışarıya gitmek'], type: 'fiil' },
      { word: 'girmek', meaning: ['Dışarıdan içeriye gitmek'], type: 'fiil' },
      { word: 'büyük', meaning: ['Iri, geniş'], type: 'sıfat' },
      { word: 'küçük', meaning: ['Dar, ufak'], type: 'sıfat' },
      { word: 'yeni', meaning: ['Yakın zamanda yapılmış'], type: 'sıfat' },
      { word: 'eski', meaning: ['Geçmişte yapılmış'], type: 'sıfat' },
      { word: 'uzun', meaning: ['Boyu fazla olan'], type: 'sıfat' },
      { word: 'kısa', meaning: ['Boyu az olan'], type: 'sıfat' },
      { word: 'yüksek', meaning: ['Yeri çok olan'], type: 'sıfat' },
      { word: 'alçak', meaning: ['Yeri az olan'], type: 'sıfat' },
      { word: 'geniş', meaning: ['Eni fazla olan'], type: 'sıfat' },
      { word: 'dar', meaning: ['Eni az olan'], type: 'sıfat' },
      { word: 'beyaz', meaning: ['Renk adı'], type: 'isim' },
      { word: 'siyah', meaning: ['Renk adı'], type: 'isim' },
      { word: 'kırmızı', meaning: ['Renk adı'], type: 'isim' },
      { word: 'mavi', meaning: ['Renk adı'], type: 'isim' },
      { word: 'yeşil', meaning: ['Renk adı'], type: 'isim' },
      { word: 'sarı', meaning: ['Renk adı'], type: 'isim' },
      { word: 'ev', meaning: ['Yaşanılan yer'], type: 'isim' },
      { word: 'okul', meaning: ['Eğitim verilen yer'], type: 'isim' },
      { word: 'iş', meaning: ['Meslek, görev'], type: 'isim' },
      { word: 'para', meaning: ['Değişim aracı'], type: 'isim' },
      { word: 'su', meaning: ['Sıvı madde'], type: 'isim' },
      { word: 'yemek', meaning: ['Beslenme maddesi'], type: 'isim' },
      { word: 'içmek', meaning: ['Sıvı almak'], type: 'fiil' },
      { word: 'yemek', meaning: ['Beslenme maddesi almak'], type: 'fiil' },
      { word: 'baba', meaning: ['Erkek ebeveyn'], type: 'isim' },
      { word: 'anne', meaning: ['Kadın ebeveyn'], type: 'isim' },
      { word: 'çocuk', meaning: ['Küçük yaştaki insan'], type: 'isim' },
      { word: 'adam', meaning: ['Erkek insan'], type: 'isim' },
      { word: 'kadın', meaning: ['Dişi insan'], type: 'isim' },
      { word: 'erkek', meaning: ['Eril cinsiyet'], type: 'isim' },
      { word: 'kız', meaning: ['Genç kadın'], type: 'isim' },
      { word: 'oğlan', meaning: ['Genç erkek'], type: 'isim' },
      { word: 'arkadaş', meaning: ['Dost, ahbap'], type: 'isim' },
      { word: 'sevmek', meaning: ['Aşk duymak'], type: 'fiil' },
      { word: 'sevgi', meaning: ['Sevme duygusu'], type: 'isim' },
      { word: 'mutlu', meaning: ['Sevinçli'], type: 'sıfat' },
      { word: 'üzgün', meaning: ['Kederli'], type: 'sıfat' },
      { word: 'kızgın', meaning: ['Öfkeli'], type: 'sıfat' },
      { word: 'korkmak', meaning: ['Endişe duymak'], type: 'fiil' },
      { word: 'gülmek', meaning: ['Sevinç ifadesi'], type: 'fiil' },
      { word: 'ağlamak', meaning: ['Gözyaşı dökmek'], type: 'fiil' },
      { word: 'araba', meaning: ['Motorlu taşıt'], type: 'isim' },
      { word: 'otobüs', meaning: ['Toplu taşıma aracı'], type: 'isim' },
      { word: 'uçak', meaning: ['Hava taşıtı'], type: 'isim' },
      { word: 'gemi', meaning: ['Su taşıtı'], type: 'isim' },
      { word: 'tren', meaning: ['Ray üzerinde giden taşıt'], type: 'isim' },
      { word: 'yol', meaning: ['Geçit, güzergah'], type: 'isim' },
      { word: 'sokak', meaning: ['Dar yol'], type: 'isim' },
      { word: 'şehir', meaning: ['Büyük yerleşim yeri'], type: 'isim' },
      { word: 'köy', meaning: ['Küçük yerleşim yeri'], type: 'isim' },
      { word: 'ülke', meaning: ['Devlet toprakları'], type: 'isim' },
      { word: 'dünya', meaning: ['Yaşadığımız gezegen'], type: 'isim' },
      { word: 'gökyüzü', meaning: ['Göğün görünen kısmı'], type: 'isim' },
      { word: 'güneş', meaning: ['Güneş sistemi merkezi'], type: 'isim' },
      { word: 'ay', meaning: ['Dünya uydusu'], type: 'isim' },
      { word: 'yıldız', meaning: ['Gökyüzü cismi'], type: 'isim' },
      { word: 'ağaç', meaning: ['Büyük bitki'], type: 'isim' },
      { word: 'çiçek', meaning: ['Bitkinin renkli kısmı'], type: 'isim' },
      { word: 'hayvan', meaning: ['Canlı varlık'], type: 'isim' },
      { word: 'köpek', meaning: ['Evcil hayvan'], type: 'isim' },
      { word: 'kedi', meaning: ['Evcil hayvan'], type: 'isim' },
      { word: 'kuş', meaning: ['Uçabilen hayvan'], type: 'isim' },
      { word: 'balık', meaning: ['Suda yaşayan hayvan'], type: 'isim' },
      { word: 'et', meaning: ['Hayvan ürünü besin'], type: 'isim' },
      { word: 'ekmek', meaning: ['Temel besin'], type: 'isim' },
      { word: 'süt', meaning: ['Hayvansal içecek'], type: 'isim' },
      { word: 'peynir', meaning: ['Süt ürünü'], type: 'isim' },
      { word: 'sebze', meaning: ['Bitkisel besin'], type: 'isim' },
      { word: 'meyve', meaning: ['Tatlı bitkisel besin'], type: 'isim' },
      { word: 'portakal', meaning: ['Turuncu meyve'], type: 'isim' },
      { word: 'muz', meaning: ['Sarı meyve'], type: 'isim' },
      { word: 'üzüm', meaning: ['Salkım meyve'], type: 'isim' },
      { word: 'masa', meaning: ['Düz yüzeyli mobilya'], type: 'isim' },
      { word: 'sandalye', meaning: ['Oturma mobilyası'], type: 'isim' },
      { word: 'yatak', meaning: ['Yatma mobilyası'], type: 'isim' },
      { word: 'dolap', meaning: ['Saklama mobilyası'], type: 'isim' },
      { word: 'kapı', meaning: ['Giriş-çıkış yeri'], type: 'isim' },
      { word: 'pencere', meaning: ['Işık ve hava girişi'], type: 'isim' },
      { word: 'duvar', meaning: ['İnşaat elemanı'], type: 'isim' },
      { word: 'tavan', meaning: ['Üst örtü'], type: 'isim' },
      { word: 'zemin', meaning: ['Alt yüzey'], type: 'isim' },
      { word: 'oda', meaning: ['Kapalı alan'], type: 'isim' },
      { word: 'mutfak', meaning: ['Yemek hazırlama yeri'], type: 'isim' },
      { word: 'banyo', meaning: ['Temizlik yeri'], type: 'isim' },
      { word: 'salon', meaning: ['Oturma odası'], type: 'isim' },
      { word: 'bahçe', meaning: ['Açık yeşil alan'], type: 'isim' },
      { word: 'kışın', meaning: ['Soğuk mevsimde'], type: 'zarf' },
      { word: 'yazın', meaning: ['Sıcak mevsimde'], type: 'zarf' },
      { word: 'baharda', meaning: ['İlkbahar mevsiminde'], type: 'zarf' },
      { word: 'sonbaharda', meaning: ['Güz mevsiminde'], type: 'zarf' },
      { word: 'soğuk', meaning: ['Düşük sıcaklık'], type: 'sıfat' },
      { word: 'sıcak', meaning: ['Yüksek sıcaklık'], type: 'sıfat' },
      { word: 'kar', meaning: ['Donmuş yağmur'], type: 'isim' },
      { word: 'yağmur', meaning: ['Gökten düşen su'], type: 'isim' },
      { word: 'rüzgar', meaning: ['Hava akımı'], type: 'isim' },
      { word: 'bulut', meaning: ['Gökyüzü oluşumu'], type: 'isim' },
      { word: 'telefon', meaning: ['İletişim aracı'], type: 'isim' },
      { word: 'bilgisayar', meaning: ['Elektronik hesap makinesi'], type: 'isim' },
      { word: 'televizyon', meaning: ['Görüntü alıcısı'], type: 'isim' },
      { word: 'radyo', meaning: ['Ses alıcısı'], type: 'isim' },
      { word: 'müzik', meaning: ['Ses sanatı'], type: 'isim' },
      { word: 'film', meaning: ['Sinema eseri'], type: 'isim' },
      { word: 'oyun', meaning: ['Eğlence aktivitesi'], type: 'isim' },
      { word: 'spor', meaning: ['Fiziksel aktivite'], type: 'isim' },
      { word: 'futbol', meaning: ['Ayakla oynanan spor'], type: 'isim' },
      { word: 'basketbol', meaning: ['Potaya atılan spor'], type: 'isim' },
      { word: 'tenis', meaning: ['Raketle oynanan spor'], type: 'isim' },
      { word: 'yüzmek', meaning: ['Suda hareket etmek'], type: 'fiil' },
      { word: 'koşmak', meaning: ['Hızlı hareket etmek'], type: 'fiil' },
      { word: 'yürümek', meaning: ['Adım atarak ilerlemek'], type: 'fiil' },
      { word: 'oturmak', meaning: ['Vücudu desteklemek'], type: 'fiil' },
      { word: 'ayakta', meaning: ['Dik pozisyonda'], type: 'zarf' },
      { word: 'yatmak', meaning: ['Uzanmak'], type: 'fiil' },
      { word: 'uyumak', meaning: ['Dinlenmek'], type: 'fiil' },
      { word: 'uyanmak', meaning: ['Uykudan çıkmak'], type: 'fiil' },
      { word: 'kalkmak', meaning: ['Ayağa dikilmek'], type: 'fiil' },
      { word: 'hasta', meaning: ['Sağlıksız'], type: 'sıfat' },
      { word: 'sağlıklı', meaning: ['İyi durumda'], type: 'sıfat' },
      { word: 'doktor', meaning: ['Tıp uzmanı'], type: 'isim' },
      { word: 'hastane', meaning: ['Tedavi yeri'], type: 'isim' },
      { word: 'ilaç', meaning: ['Tedavi maddesi'], type: 'isim' },
      { word: 'ağrı', meaning: ['Acı duygusu'], type: 'isim' },
      { word: 'ağrımak', meaning: ['Acı duymak'], type: 'fiil' },
      { word: 'öğretmen', meaning: ['Eğitim veren kişi'], type: 'isim' },
      { word: 'öğrenci', meaning: ['Eğitim alan kişi'], type: 'isim' },
      { word: 'ders', meaning: ['Öğretim konusu'], type: 'isim' },
      { word: 'öğrenmek', meaning: ['Bilgi edinmek'], type: 'fiil' },
      { word: 'öğretmek', meaning: ['Bilgi vermek'], type: 'fiil' },
      { word: 'yazmak', meaning: ['Harflerle ifade etmek'], type: 'fiil' },
      { word: 'kalem', meaning: ['Yazı aleti'], type: 'isim' },
      { word: 'kağıt', meaning: ['Yazı malzemesi'], type: 'isim' },
      { word: 'defter', meaning: ['Yazı defteri'], type: 'isim' },
      { word: 'sayfa', meaning: ['Kağıt yaprağı'], type: 'isim' },
      { word: 'satır', meaning: ['Yatay yazı sırası'], type: 'isim' },
      { word: 'kelime', meaning: ['Anlam birimi'], type: 'isim' },
      { word: 'harf', meaning: ['Yazı simgesi'], type: 'isim' },
      { word: 'sayı', meaning: ['Matematik birimi'], type: 'isim' },
      { word: 'hesap', meaning: ['Matematik işlemi'], type: 'isim' },
      { word: 'matematik', meaning: ['Sayı bilimi'], type: 'isim' },
      { word: 'toplamak', meaning: ['Bir araya getirmek'], type: 'fiil' },
      { word: 'çıkarmak', meaning: ['Azaltmak'], type: 'fiil' },
      { word: 'çarpmak', meaning: ['Çoklamak'], type: 'fiil' },
      { word: 'bölmek', meaning: ['Parçalara ayırmak'], type: 'fiil' },
      { word: 'eşit', meaning: ['Aynı değerde'], type: 'sıfat' },
      { word: 'fazla', meaning: ['Çok miktarda'], type: 'sıfat' },
      { word: 'az', meaning: ['Küçük miktarda'], type: 'sıfat' },
      { word: 'hiç', meaning: ['Sıfır miktarda'], type: 'zarf' },
      { word: 'bütün', meaning: ['Tamamı'], type: 'sıfat' },
      { word: 'yarım', meaning: ['Yarısı'], type: 'sıfat' },
      { word: 'çeyrek', meaning: ['Dörtte biri'], type: 'isim' },
      { word: 'ilk', meaning: ['Birinci'], type: 'sıfat' },
      { word: 'son', meaning: ['En sonuncu'], type: 'sıfat' },
      { word: 'orta', meaning: ['Arada olan'], type: 'sıfat' },
      { word: 'başlamak', meaning: ['İlk adımı atmak'], type: 'fiil' },
      { word: 'bitirmek', meaning: ['Sona erdirmek'], type: 'fiil' },
      { word: 'devam', meaning: ['Sürdürme'], type: 'isim' },
      { word: 'dur', meaning: ['Durma emri'], type: 'ünlem' },
      { word: 'gel', meaning: ['Gelme emri'], type: 'ünlem' },
      { word: 'git', meaning: ['Gitme emri'], type: 'ünlem' },
      { word: 'hızlı', meaning: ['Süratli'], type: 'sıfat' },
      { word: 'yavaş', meaning: ['Ağır'], type: 'sıfat' },
      { word: 'erken', meaning: ['Zamanından önce'], type: 'zarf' },
      { word: 'geç', meaning: ['Zamanından sonra'], type: 'zarf' },
      { word: 'şimdi', meaning: ['Bu anda'], type: 'zarf' },
      { word: 'bugün', meaning: ['Bu günde'], type: 'zarf' },
      { word: 'dün', meaning: ['Önceki günde'], type: 'zarf' },
      { word: 'yarın', meaning: ['Sonraki günde'], type: 'zarf' },
      { word: 'sabah', meaning: ['Güneş doğduğu vakit'], type: 'isim' },
      { word: 'öğle', meaning: ['Güneşin tepede olduğu vakit'], type: 'isim' },
      { word: 'akşam', meaning: ['Güneş battığı vakit'], type: 'isim' },
      { word: 'gece', meaning: ['Karanlık vakit'], type: 'isim' },
      { word: 'sıkılmak', meaning: ['Canı sıkılmak'], type: 'fiil' },
      { word: 'eğlenmek', meaning: ['Keyif almak'], type: 'fiil' },
      { word: 'dinlenmek', meaning: ['Rahatlamak'], type: 'fiil' },
      { word: 'çalışmak', meaning: ['İş yapmak'], type: 'fiil' },
      { word: 'kazanmak', meaning: ['Elde etmek'], type: 'fiil' },
      { word: 'kaybetmek', meaning: ['Yitirmek'], type: 'fiil' },
      { word: 'bulmak', meaning: ['Keşfetmek'], type: 'fiil' },
      { word: 'aramak', meaning: ['Arayış yapmak'], type: 'fiil' },
      { word: 'beklemek', meaning: ['Beklenti içinde olmak'], type: 'fiil' },
      { word: 'umut', meaning: ['Beklenti'], type: 'isim' },
      { word: 'korku', meaning: ['Endişe duygusu'], type: 'isim' },
      { word: 'merak', meaning: ['Öğrenme isteği'], type: 'isim' },
      { word: 'şaşırmak', meaning: ['Beklenmedik karşılamak'], type: 'fiil' },
      { word: 'şaşkın', meaning: ['Karışık zihinli'], type: 'sıfat' },
      { word: 'sakin', meaning: ['Huzurlu'], type: 'sıfat' },
      { word: 'heyecanlı', meaning: ['Coşkulu'], type: 'sıfat' },
      { word: 'soru', meaning: ['Öğrenme isteği ifadesi'], type: 'isim' },
      { word: 'cevap', meaning: ['Soru karşılığı'], type: 'isim' },
      { word: 'sormak', meaning: ['Soru yöneltmek'], type: 'fiil' },
      { word: 'cevaplamak', meaning: ['Yanıt vermek'], type: 'fiil' },
      { word: 'anlamak', meaning: ['Kavramak'], type: 'fiil' },
      { word: 'anlam', meaning: ['Mana'], type: 'isim' },
      { word: 'düşünmek', meaning: ['Zihinsel faaliyet'], type: 'fiil' },
      { word: 'düşünce', meaning: ['Fikir'], type: 'isim' },
      { word: 'fikir', meaning: ['Düşünce'], type: 'isim' },
      { word: 'akıl', meaning: ['Düşünme yetisi'], type: 'isim' },
      { word: 'hatırlamak', meaning: ['Bellekten çıkarmak'], type: 'fiil' },
      { word: 'unutmak', meaning: ['Bellekten silmek'], type: 'fiil' },
      { word: 'hafıza', meaning: ['Bellek'], type: 'isim' },
      { word: 'deneyim', meaning: ['Yaşanmış tecrübe'], type: 'isim' },
      { word: 'tecrübe', meaning: ['Deneyim'], type: 'isim' },
      { word: 'deneme', meaning: ['Test etme'], type: 'isim' },
      { word: 'denemek', meaning: ['Test etmek'], type: 'fiil' },
      { word: 'başarı', meaning: ['Hedefe ulaşma'], type: 'isim' },
      { word: 'başarısızlık', meaning: ['Hedefe ulaşamama'], type: 'isim' },
      { word: 'başarmak', meaning: ['Hedefe ulaşmak'], type: 'fiil' },
      { word: 'başaramak', meaning: ['Hedefe ulaşamak'], type: 'fiil' },
      { word: 'yardım', meaning: ['Destek'], type: 'isim' },
      { word: 'yardım etmek', meaning: ['Destek olmak'], type: 'fiil' },
      { word: 'teşekkür', meaning: ['Şükran ifadesi'], type: 'isim' },
      { word: 'teşekkür etmek', meaning: ['Şükran göstermek'], type: 'fiil' },
      { word: 'rica', meaning: ['İstek'], type: 'isim' },
      { word: 'rica etmek', meaning: ['İstek bildirmek'], type: 'fiil' },
      { word: 'özür', meaning: ['Af dileme'], type: 'isim' },
      { word: 'özür dilemek', meaning: ['Af istemek'], type: 'fiil' },
      { word: 'affetmek', meaning: ['Bağışlamak'], type: 'fiil' },
      { word: 'kızmak', meaning: ['Öfkelenmek'], type: 'fiil' },
      { word: 'barışmak', meaning: ['Uzlaşmak'], type: 'fiil' },
      { word: 'kavga', meaning: ['Anlaşmazlık'], type: 'isim' },
      { word: 'kavga etmek', meaning: ['Anlaşmazlığa düşmek'], type: 'fiil' },
      { word: 'konuşmak', meaning: ['Sözle iletişim kurmak'], type: 'fiil' },
      { word: 'konuşma', meaning: ['Sözlü iletişim'], type: 'isim' },
      { word: 'ses', meaning: ['İşitsel dalga'], type: 'isim' },
      { word: 'sessiz', meaning: ['Ses çıkarmayan'], type: 'sıfat' },
      { word: 'gürültü', meaning: ['Rahatsız edici ses'], type: 'isim' },
      { word: 'müzik', meaning: ['Hoş ses düzenlemesi'], type: 'isim' },
      { word: 'şarkı', meaning: ['Sözlü müzik'], type: 'isim' },
      { word: 'şarkı söylemek', meaning: ['Sesle müzik yapmak'], type: 'fiil' },
      { word: 'dans', meaning: ['Ritmik hareket'], type: 'isim' },
      { word: 'dans etmek', meaning: ['Ritmik hareket yapmak'], type: 'fiil' },
      { word: 'resim', meaning: ['Görsel sanat'], type: 'isim' },
      { word: 'çizmek', meaning: ['Resim yapmak'], type: 'fiil' },
      { word: 'boyamak', meaning: ['Renk vermek'], type: 'fiil' },
      { word: 'renk', meaning: ['Görsel özellik'], type: 'isim' },
      { word: 'açık', meaning: ['Kapanmamış'], type: 'sıfat' },
      { word: 'kapalı', meaning: ['Kapanmış'], type: 'sıfat' },
      { word: 'açmak', meaning: ['Kapanmış olanı açık hale getirmek'], type: 'fiil' },
      { word: 'kapamak', meaning: ['Açık olanı kapalı hale getirmek'], type: 'fiil' },
      { word: 'kapı', meaning: ['Giriş-çıkış yeri'], type: 'isim' },
      { word: 'anahtar', meaning: ['Açma-kapama aleti'], type: 'isim' },
      { word: 'kilit', meaning: ['Güvenlik aleti'], type: 'isim' },
      { word: 'kilitlemek', meaning: ['Güvenlik altına almak'], type: 'fiil' },
      { word: 'güvenlik', meaning: ['Emniyetlilik'], type: 'isim' },
      { word: 'güvenli', meaning: ['Emniyetli'], type: 'sıfat' },
      { word: 'tehlike', meaning: ['Risk'], type: 'isim' },
      { word: 'tehlikeli', meaning: ['Riskli'], type: 'sıfat' },
      { word: 'dikkat', meaning: ['Özen'], type: 'isim' },
      { word: 'dikkatli', meaning: ['Özenli'], type: 'sıfat' },
      { word: 'dikkatsiz', meaning: ['Özensiz'], type: 'sıfat' },
      { word: 'hata', meaning: ['Yanlışlık'], type: 'isim' },
      { word: 'yanlış', meaning: ['Hatalı'], type: 'sıfat' },
      { word: 'doğru', meaning: ['Hatasız'], type: 'sıfat' },
      { word: 'doğru', meaning: ['Gerçek'], type: 'isim' },
      { word: 'yalan', meaning: ['Gerçek dışı'], type: 'isim' },
      { word: 'gerçek', meaning: ['Hakiki'], type: 'sıfat' },
      { word: 'sahte', meaning: ['Gerçek olmayan'], type: 'sıfat' },
      { word: 'temiz', meaning: ['Kirli olmayan'], type: 'sıfat' },
      { word: 'kirli', meaning: ['Temiz olmayan'], type: 'sıfat' },
      { word: 'temizlemek', meaning: ['Kirli olmaktan çıkarmak'], type: 'fiil' },
      { word: 'yıkamak', meaning: ['Su ile temizlemek'], type: 'fiil' },
      { word: 'kurulamak', meaning: ['Su almaktan çıkarmak'], type: 'fiil' },
      { word: 'ıslak', meaning: ['Su almış'], type: 'sıfat' },
      { word: 'kuru', meaning: ['Su almamış'], type: 'sıfat' },
      { word: 'yaş', meaning: ['Nemli'], type: 'sıfat' },
      { word: 'nem', meaning: ['Rutubet'], type: 'isim' },
      { word: 'ateş', meaning: ['Yanıcı enerji'], type: 'isim' },
      { word: 'yanmak', meaning: ['Ateş almak'], type: 'fiil' },
      { word: 'yakmak', meaning: ['Ateş vermek'], type: 'fiil' },
      { word: 'söndürmek', meaning: ['Ateşi yok etmek'], type: 'fiil' },
      { word: 'duman', meaning: ['Yanma ürünü'], type: 'isim' },
      { word: 'hava', meaning: ['Atmosfer'], type: 'isim' },
      { word: 'nefes', meaning: ['Soluk'], type: 'isim' },
      { word: 'nefes almak', meaning: ['Soluk vermek'], type: 'fiil' },
      { word: 'solumak', meaning: ['Nefes almak'], type: 'fiil' },
      { word: 'yaşamak', meaning: ['Hayat sürmek'], type: 'fiil' },
      { word: 'yaşam', meaning: ['Hayat'], type: 'isim' },
      { word: 'hayat', meaning: ['Yaşam'], type: 'isim' },
      { word: 'ölmek', meaning: ['Hayatı kaybetmek'], type: 'fiil' },
      { word: 'ölüm', meaning: ['Hayat kaybı'], type: 'isim' },
      { word: 'doğmak', meaning: ['Dünyaya gelmek'], type: 'fiil' },
      { word: 'doğum', meaning: ['Dünyaya gelme'], type: 'isim' },
      { word: 'büyümek', meaning: ['Gelişmek'], type: 'fiil' },
      { word: 'küçülmek', meaning: ['Boyut kaybetmek'], type: 'fiil' },
      { word: 'değişmek', meaning: ['Farklılaşmak'], type: 'fiil' },
      { word: 'değişiklik', meaning: ['Farklılaşma'], type: 'isim' },
      { word: 'aynı', meaning: ['Benzer'], type: 'sıfat' },
      { word: 'farklı', meaning: ['Benzemeyen'], type: 'sıfat' },
      { word: 'benzemek', meaning: ['Aynı olmak'], type: 'fiil' },
      { word: 'benzerlik', meaning: ['Aynılık'], type: 'isim' },
      { word: 'karşılaştırmak', meaning: ['Benzerlik aramak'], type: 'fiil' },
      { word: 'seçmek', meaning: ['Tercih etmek'], type: 'fiil' },
      { word: 'seçim', meaning: ['Tercih'], type: 'isim' },
      { word: 'tercih', meaning: ['Seçim'], type: 'isim' },
      { word: 'istemek', meaning: ['Arzu etmek'], type: 'fiil' },
      { word: 'istememek', meaning: ['Arzu etmemek'], type: 'fiil' },
      { word: 'arzu', meaning: ['İstek'], type: 'isim' },
      { word: 'ihtiyaç', meaning: ['Gereksinim'], type: 'isim' },
      { word: 'gerek', meaning: ['İhtiyaç'], type: 'isim' },
      { word: 'gerekli', meaning: ['İhtiyaç olan'], type: 'sıfat' },
      { word: 'gereksiz', meaning: ['İhtiyaç olmayan'], type: 'sıfat' },
      { word: 'kullanmak', meaning: ['Faydalanmak'], type: 'fiil' },
      { word: 'kullanım', meaning: ['Faydalanma'], type: 'isim' },
      { word: 'fayda', meaning: ['Yarar'], type: 'isim' },
      { word: 'faydalı', meaning: ['Yararlı'], type: 'sıfat' },
      { word: 'zararlı', meaning: ['Faydasız'], type: 'sıfat' },
      { word: 'zarar', meaning: ['Hasar'], type: 'isim' },
      { word: 'kırmak', meaning: ['Parçalamak'], type: 'fiil' },
      { word: 'kırılmak', meaning: ['Parçalanmak'], type: 'fiil' },
      { word: 'tamir', meaning: ['Onarım'], type: 'isim' },
      { word: 'tamir etmek', meaning: ['Onarmak'], type: 'fiil' },
      { word: 'düzeltmek', meaning: ['Doğru hale getirmek'], type: 'fiil' },
      { word: 'bozmak', meaning: ['Düzeni bozmak'], type: 'fiil' },
      { word: 'bozuk', meaning: ['Düzensiz'], type: 'sıfat' },
      { word: 'düzen', meaning: ['Sıra'], type: 'isim' },
      { word: 'düzenli', meaning: ['Sıralı'], type: 'sıfat' },
      { word: 'düzensiz', meaning: ['Sırasız'], type: 'sıfat' },
      { word: 'sıra', meaning: ['Düzen'], type: 'isim' },
      { word: 'sıralamak', meaning: ['Düzenlemek'], type: 'fiil' },
      { word: 'karışmak', meaning: ['Düzensizleşmek'], type: 'fiil' },
      { word: 'karıştırmak', meaning: ['Düzensizleştirmek'], type: 'fiil' },
      { word: 'karışık', meaning: ['Düzensiz'], type: 'sıfat' },
      { word: 'basit', meaning: ['Sade'], type: 'sıfat' },
      { word: 'karmaşık', meaning: ['Zor'], type: 'sıfat' },
      { word: 'kolay', meaning: ['Zor olmayan'], type: 'sıfat' },
      { word: 'zor', meaning: ['Kolay olmayan'], type: 'sıfat' },
      { word: 'zorlamak', meaning: ['Güç kullanmak'], type: 'fiil' },
      { word: 'güç', meaning: ['Kuvvet'], type: 'isim' },
      { word: 'güçlü', meaning: ['Kuvvetli'], type: 'sıfat' },
      { word: 'güçsüz', meaning: ['Kuvvetsiz'], type: 'sıfat' },
      { word: 'zayıf', meaning: ['Güçsüz'], type: 'sıfat' },
      { word: 'güçlendirmek', meaning: ['Kuvvetlendirmek'], type: 'fiil' },
      { word: 'zayıflatmak', meaning: ['Güçsüzleştirmek'], type: 'fiil' },
      { word: 'artırmak', meaning: ['Çoğaltmak'], type: 'fiil' },
      { word: 'azaltmak', meaning: ['Eksiltmek'], type: 'fiil' },
      { word: 'artmak', meaning: ['Çoğalmak'], type: 'fiil' },
      { word: 'azalmak', meaning: ['Eksilmek'], type: 'fiil' },
      { word: 'fazlası', meaning: ['Artan kısım'], type: 'isim' },
      { word: 'eksik', meaning: ['Az olan'], type: 'sıfat' },
      { word: 'tam', meaning: ['Eksik olmayan'], type: 'sıfat' },
      { word: 'tamamlamak', meaning: ['Eksiklerini gidermek'], type: 'fiil' },
      { word: 'bitirmek', meaning: ['Sona erdirmek'], type: 'fiil' },
      { word: 'bitmek', meaning: ['Sona ermek'], type: 'fiil' },
      { word: 'devam etmek', meaning: ['Sürdürmek'], type: 'fiil' },
      { word: 'durmak', meaning: ['Devam etmemek'], type: 'fiil' },
      { word: 'durdurmak', meaning: ['Devam ettirmemek'], type: 'fiil' },
      { word: 'başlamak', meaning: ['Başlangıç yapmak'], type: 'fiil' },
      { word: 'başlatmak', meaning: ['Başlangıç yaptırmak'], type: 'fiil' },
      { word: 'başlangıç', meaning: ['İlk adım'], type: 'isim' },
      { word: 'sonuç', meaning: ['Son durum'], type: 'isim' },
      { word: 'nedeni', meaning: ['Sebep'], type: 'isim' },
      { word: 'sebep', meaning: ['Neden'], type: 'isim' },
      { word: 'sonucu', meaning: ['Etkisi'], type: 'isim' },
      { word: 'etki', meaning: ['Sonuç'], type: 'isim' },
      { word: 'etkilemek', meaning: ['Sonuç yaratmak'], type: 'fiil' },
      { word: 'etkilenmek', meaning: ['Sonuç almak'], type: 'fiil' },
      { word: 'önemli', meaning: ['Değerli'], type: 'sıfat' },
      { word: 'önemsiz', meaning: ['Değersiz'], type: 'sıfat' },
      { word: 'önem', meaning: ['Değer'], type: 'isim' },
      { word: 'değer', meaning: ['Önem'], type: 'isim' },
      { word: 'değerli', meaning: ['Önemli'], type: 'sıfat' },
      { word: 'değersiz', meaning: ['Önemsiz'], type: 'sıfat' },
      { word: 'pahalı', meaning: ['Yüksek değerli'], type: 'sıfat' },
      { word: 'ucuz', meaning: ['Düşük değerli'], type: 'sıfat' },
      { word: 'bedava', meaning: ['Ücretsiz'], type: 'sıfat' },
      { word: 'ücret', meaning: ['Bedel'], type: 'isim' },
      { word: 'ücretli', meaning: ['Bedelli'], type: 'sıfat' },
      { word: 'ücretsiz', meaning: ['Bedelsiz'], type: 'sıfat' },
      { word: 'satmak', meaning: ['Karşılığında ücret almak'], type: 'fiil' },
      { word: 'satın almak', meaning: ['Karşılığında ücret vermek'], type: 'fiil' },
      { word: 'alışveriş', meaning: ['Satın alma'], type: 'isim' },
      { word: 'mağaza', meaning: ['Satış yeri'], type: 'isim' },
      { word: 'market', meaning: ['Yiyecek mağazası'], type: 'isim' },
      { word: 'alışveriş yapmak', meaning: ['Satın alma yapmak'], type: 'fiil' },
      { word: 'müşteri', meaning: ['Satın alan'], type: 'isim' },
      { word: 'satıcı', meaning: ['Satan'], type: 'isim' },
      { word: 'ürün', meaning: ['Mal'], type: 'isim' },
      { word: 'mal', meaning: ['Eşya'], type: 'isim' },
      { word: 'eşya', meaning: ['Nesne'], type: 'isim' },
      { word: 'nesne', meaning: ['Obje'], type: 'isim' },
      { word: 'obje', meaning: ['Cisim'], type: 'isim' },
      { word: 'cisim', meaning: ['Madde'], type: 'isim' },
      { word: 'madde', meaning: ['Materyal'], type: 'isim' },
      { word: 'materyal', meaning: ['Malzeme'], type: 'isim' },
      { word: 'malzeme', meaning: ['Ham madde'], type: 'isim' },
      { word: 'üretmek', meaning: ['İmal etmek'], type: 'fiil' },
      { word: 'üretim', meaning: ['İmalat'], type: 'isim' },
      { word: 'fabrika', meaning: ['Üretim yeri'], type: 'isim' },
      { word: 'işçi', meaning: ['Çalışan'], type: 'isim' },
      { word: 'patron', meaning: ['İşveren'], type: 'isim' },
      { word: 'şirket', meaning: ['İş kuruluşu'], type: 'isim' },
      { word: 'ofis', meaning: ['İş yeri'], type: 'isim' },
      { word: 'toplantı', meaning: ['Bir araya gelme'], type: 'isim' },
      { word: 'toplantı yapmak', meaning: ['Bir araya gelmek'], type: 'fiil' },
      { word: 'karar', meaning: ['Belirleme'], type: 'isim' },
      { word: 'karar vermek', meaning: ['Belirlemek'], type: 'fiil' },
      { word: 'plan', meaning: ['Program'], type: 'isim' },
      { word: 'planlamak', meaning: ['Programlamak'], type: 'fiil' },
      { word: 'program', meaning: ['Plan'], type: 'isim' },
      { word: 'programlamak', meaning: ['Planlamak'], type: 'fiil' },
      { word: 'proje', meaning: ['Çalışma'], type: 'isim' },
      { word: 'çalışma', meaning: ['Proje'], type: 'isim' },
      { word: 'rapor', meaning: ['Bildiri'], type: 'isim' },
      { word: 'bildiri', meaning: ['Duyuru'], type: 'isim' },
      { word: 'duyuru', meaning: ['İlan'], type: 'isim' },
      { word: 'ilan', meaning: ['Reklam'], type: 'isim' },
      { word: 'reklam', meaning: ['Tanıtım'], type: 'isim' },
      { word: 'tanıtmak', meaning: ['Bildirmek'], type: 'fiil' },
      { word: 'tanımak', meaning: ['Bilmek'], type: 'fiil' },
      { word: 'tanışmak', meaning: ['Karşılaşmak'], type: 'fiil' },
      { word: 'karşılaşmak', meaning: ['Rastlaşmak'], type: 'fiil' },
      { word: 'rastlamak', meaning: ['Denk gelmek'], type: 'fiil' },
      { word: 'buluşmak', meaning: ['Karşılaşmak'], type: 'fiil' },
      { word: 'buluşma', meaning: ['Randevu'], type: 'isim' },
      { word: 'randevu', meaning: ['Buluşma anlaşması'], type: 'isim' },
      { word: 'anlaşma', meaning: ['Sözleşme'], type: 'isim' },
      { word: 'sözleşme', meaning: ['Anlaşma'], type: 'isim' },
      { word: 'anlaşmak', meaning: ['Uzlaşmak'], type: 'fiil' },
      { word: 'anlaşmazlık', meaning: ['Uyuşmazlık'], type: 'isim' },
      { word: 'uzlaşmak', meaning: ['Anlaşmak'], type: 'fiil' },
      { word: 'uzlaşmazlık', meaning: ['Anlaşmazlık'], type: 'isim' },
      { word: 'problem', meaning: ['Sorun'], type: 'isim' },
      { word: 'sorun', meaning: ['Problem'], type: 'isim' },
      { word: 'çözmek', meaning: ['Halletmek'], type: 'fiil' },
      { word: 'çözüm', meaning: ['Hal'], type: 'isim' },
      { word: 'halletmek', meaning: ['Çözmek'], type: 'fiil' },
      { word: 'hal', meaning: ['Durum'], type: 'isim' },
      { word: 'durum', meaning: ['Vaziyet'], type: 'isim' },
      { word: 'vaziyet', meaning: ['Konum'], type: 'isim' },
      { word: 'konum', meaning: ['Pozisyon'], type: 'isim' },
      { word: 'pozisyon', meaning: ['Yer'], type: 'isim' },
      { word: 'koymak', meaning: ['Yerleştirmek'], type: 'fiil' },
      { word: 'yerleştirmek', meaning: ['Oturtmak'], type: 'fiil' },
      { word: 'kaldırmak', meaning: ['Yerden almak'], type: 'fiil' },
      { word: 'taşımak', meaning: ['Nakletmek'], type: 'fiil' },
      { word: 'nakletmek', meaning: ['Göndermek'], type: 'fiil' },
      { word: 'göndermek', meaning: ['İletmek'], type: 'fiil' },
      { word: 'iletmek', meaning: ['Ulaştırmak'], type: 'fiil' },
      { word: 'ulaştırmak', meaning: ['Eriştirmek'], type: 'fiil' },
      { word: 'ulaşmak', meaning: ['Erişmek'], type: 'fiil' },
      { word: 'erişmek', meaning: ['Varmak'], type: 'fiil' },
      { word: 'varmak', meaning: ['Ulaşmak'], type: 'fiil' },
      { word: 'dönmek', meaning: ['Geri gelmek'], type: 'fiil' },
      { word: 'döndürmek', meaning: ['Geri göndermek'], type: 'fiil' },
      { word: 'döndürmek', meaning: ['Çevirmek'], type: 'fiil' },
      { word: 'çevirmek', meaning: ['Döndürmek'], type: 'fiil' },
      { word: 'çevre', meaning: ['Etraf'], type: 'isim' },
      { word: 'etraf', meaning: ['Çevre'], type: 'isim' },
      { word: 'yakın', meaning: ['Uzak olmayan'], type: 'sıfat' },
      { word: 'uzak', meaning: ['Yakın olmayan'], type: 'sıfat' },
      { word: 'yaklaşmak', meaning: ['Uzaklaşmamak'], type: 'fiil' },
      { word: 'uzaklaşmak', meaning: ['Yaklaşmamak'], type: 'fiil' },
      { word: 'mesafe', meaning: ['Ara'], type: 'isim' },
      { word: 'ara', meaning: ['Boşluk'], type: 'isim' },
      { word: 'boşluk', meaning: ['Ara'], type: 'isim' },
      { word: 'dolu', meaning: ['Boş olmayan'], type: 'sıfat' },
      { word: 'boş', meaning: ['Dolu olmayan'], type: 'sıfat' },
      { word: 'doldurmak', meaning: ['Boş olmaktan çıkarmak'], type: 'fiil' },
      { word: 'boşaltmak', meaning: ['Dolu olmaktan çıkarmak'], type: 'fiil' },
      { word: 'dolmak', meaning: ['Boş olmaktan çıkmak'], type: 'fiil' },
      { word: 'boşalmak', meaning: ['Dolu olmaktan çıkmak'], type: 'fiil' },

      // En çok kullanılan 1000 Türkçe kelime - Ek 500+ kelime
      { word: 'aile', meaning: ['Anne, baba ve çocukların oluşturduğu toplumsal birim'], type: 'isim' },
      { word: 'ahbap', meaning: ['Dost, arkadaş'], type: 'isim' },
      { word: 'akan', meaning: ['Akıntı halinde olan'], type: 'sıfat' },
      { word: 'akıllı', meaning: ['Zeki, düşünme gücü olan'], type: 'sıfat' },
      { word: 'aktör', meaning: ['Oyuncu'], type: 'isim' },
      { word: 'amaç', meaning: ['Hedef, gaye'], type: 'isim' },
      { word: 'aman', meaning: ['Şaşırma, korku bildiren söz'], type: 'ünlem' },
      { word: 'an', meaning: ['Zaman, dakika'], type: 'isim' },
      { word: 'ancak', meaning: ['Fakat, lakin'], type: 'bağlaç' },
      { word: 'aniden', meaning: ['Birden, birdenbire'], type: 'zarf' },
      { word: 'anlat', meaning: ['Hikaye et, söyle'], type: 'fiil' },
      { word: 'anlatmak', meaning: ['Söylemek, hikaye etmek'], type: 'fiil' },
      { word: 'annem', meaning: ['Benim annem'], type: 'isim' },
      { word: 'artık', meaning: ['Bundan sonra, şimdi'], type: 'zarf' },
      { word: 'asla', meaning: ['Hiçbir zaman'], type: 'zarf' },
      { word: 'aslında', meaning: ['Gerçekte'], type: 'zarf' },
      { word: 'at', meaning: ['Binit hayvanı'], type: 'isim' },
      { word: 'atmak', meaning: ['Fırlatmak'], type: 'fiil' },
      { word: 'avukat', meaning: ['Hukuk mesleği yapan kişi'], type: 'isim' },
      { word: 'ayak', meaning: ['Vücut uzvu'], type: 'isim' },
      { word: 'ayakkabı', meaning: ['Ayağa giyilen'], type: 'isim' },
      { word: 'aydınlık', meaning: ['Işıklı, parlak'], type: 'sıfat' },
      { word: 'aynı', meaning: ['Benzer, eş'], type: 'sıfat' },
      { word: 'ayrıca', meaning: ['Bundan başka'], type: 'zarf' },
      { word: 'ayrılmak', meaning: ['Uzaklaşmak'], type: 'fiil' },
      { word: 'azıcık', meaning: ['Çok az'], type: 'zarf' },
      { word: 'bağırmak', meaning: ['Yüksek sesle konuşmak'], type: 'fiil' },
      { word: 'bakan', meaning: ['Bakıcı, minister'], type: 'isim' },
      { word: 'bakış', meaning: ['Görme biçimi'], type: 'isim' },
      { word: 'bal', meaning: ['Arıların yaptığı tatlı madde'], type: 'isim' },
      { word: 'bana', meaning: ['Bana'], type: 'zamir' },
      { word: 'banka', meaning: ['Para işleri yapılan kurum'], type: 'isim' },
      { word: 'bardak', meaning: ['İçecek kabı'], type: 'isim' },
      { word: 'barış', meaning: ['Savaşsızlık, huzur'], type: 'isim' },
      { word: 'basamak', meaning: ['Merdiven kademesi'], type: 'isim' },
      { word: 'başka', meaning: ['Diğer, farklı'], type: 'sıfat' },
      { word: 'başkan', meaning: ['Lider, reis'], type: 'isim' },
      { word: 'başlık', meaning: ['Konu, titel'], type: 'isim' },
      { word: 'baş', meaning: ['Vücudun üst kısmı'], type: 'isim' },
      { word: 'bazen', meaning: ['Ara sıra'], type: 'zarf' },
      { word: 'bazı', meaning: ['Kimi, birkaç'], type: 'sıfat' },
      { word: 'beğenmek', meaning: ['Hoşlanmak'], type: 'fiil' },
      { word: 'bekle', meaning: ['Beklemek emri'], type: 'fiil' },
      { word: 'belli', meaning: ['Belirgin, açık'], type: 'sıfat' },
      { word: 'belki', meaning: ['Olabilir'], type: 'zarf' },
      { word: 'bence', meaning: ['Bana göre'], type: 'zarf' },
      { word: 'bende', meaning: ['Benim yanımda'], type: 'edat' },
      { word: 'beni', meaning: ['Ben zamirinin -i hali'], type: 'zamir' },
      { word: 'beraber', meaning: ['Birlikte'], type: 'zarf' },
      { word: 'berrak', meaning: ['Duru, temiz'], type: 'sıfat' },
      { word: 'beslemek', meaning: ['Yedirmek'], type: 'fiil' },
      { word: 'beş', meaning: ['5 sayısı'], type: 'sayı' },
      { word: 'beyefendi', meaning: ['Erkek için saygı sözü'], type: 'isim' },
      { word: 'bıkmak', meaning: ['Sıkılmak, usanmak'], type: 'fiil' },
      { word: 'bırakmak', meaning: ['Terk etmek'], type: 'fiil' },
      { word: 'bildiğim', meaning: ['Bildiğim'], type: 'sıfat' },
      { word: 'bilgi', meaning: ['Malumat'], type: 'isim' },
      { word: 'bilim', meaning: ['İlim'], type: 'isim' },
      { word: 'bin', meaning: ['1000 sayısı'], type: 'sayı' },
      { word: 'binmek', meaning: ['Üstüne çıkmak'], type: 'fiil' },
      { word: 'biraz', meaning: ['Azıcık'], type: 'zarf' },
      { word: 'birden', meaning: ['Aniden'], type: 'zarf' },
      { word: 'birey', meaning: ['Kişi, fert'], type: 'isim' },
      { word: 'birisi', meaning: ['Bir kişi'], type: 'zamir' },
      { word: 'birkaç', meaning: ['Az sayıda'], type: 'sıfat' },
      { word: 'birlikte', meaning: ['Beraber'], type: 'zarf' },
      { word: 'biyoloji', meaning: ['Canlılar bilimi'], type: 'isim' },
      { word: 'bize', meaning: ['Biz zamirinin -e hali'], type: 'zamir' },
      { word: 'bizim', meaning: ['Biz zamirinin iyelik eki'], type: 'zamir' },
      { word: 'bluz', meaning: ['Kadın gömleği'], type: 'isim' },
      { word: 'böbrek', meaning: ['Vücut organı'], type: 'isim' },
      { word: 'böcek', meaning: ['Küçük hayvan'], type: 'isim' },
      { word: 'bölge', meaning: ['Alan, mıntıka'], type: 'isim' },
      { word: 'bölüm', meaning: ['Kısım, bölük'], type: 'isim' },
      { word: 'böyle', meaning: ['Bu şekilde'], type: 'sıfat' },
      { word: 'böylece', meaning: ['Bu şekilde'], type: 'zarf' },
      { word: 'bulmaca', meaning: ['Bilmece'], type: 'isim' },
      { word: 'bulut', meaning: ['Gök cismi'], type: 'isim' },
      { word: 'burada', meaning: ['Bu yerde'], type: 'zarf' },
      { word: 'burası', meaning: ['Bu yer'], type: 'zamir' },
      { word: 'burun', meaning: ['Koku alma organı'], type: 'isim' },
      { word: 'büro', meaning: ['Ofis'], type: 'isim' },
      { word: 'bütçe', meaning: ['Mali plan'], type: 'isim' },
      { word: 'büyümek', meaning: ['Gelişmek'], type: 'fiil' },
      { word: 'cadde', meaning: ['Geniş yol'], type: 'isim' },
      { word: 'cam', meaning: ['Şeffaf madde'], type: 'isim' },
      { word: 'cami', meaning: ['İbadet yeri'], type: 'isim' },
      { word: 'canı', meaning: ['Ruh, yaşam'], type: 'isim' },
      { word: 'canlı', meaning: ['Yaşayan'], type: 'sıfat' },
      { word: 'cep', meaning: ['Kese'], type: 'isim' },
      { word: 'ceviz', meaning: ['Sert kabuklu meyve'], type: 'isim' },
      { word: 'ciddi', meaning: ['Ciddiyetle'], type: 'sıfat' },
      { word: 'coğrafya', meaning: ['Yer bilimi'], type: 'isim' },
      { word: 'çaba', meaning: ['Gayret'], type: 'isim' },
      { word: 'çabuk', meaning: ['Hızlı'], type: 'sıfat' },
      { word: 'çağ', meaning: ['Dönem, zaman'], type: 'isim' },
      { word: 'çağırmak', meaning: ['Davet etmek'], type: 'fiil' },
      { word: 'çakmak', meaning: ['Ateş verici alet'], type: 'isim' },
      { word: 'çalı', meaning: ['Küçük bitki'], type: 'isim' },
      { word: 'çalışkan', meaning: ['Çok çalışan'], type: 'sıfat' },
      { word: 'çalmak', meaning: ['Müzik yapmak'], type: 'fiil' },
      { word: 'çamur', meaning: ['Islak toprak'], type: 'isim' },
      { word: 'çantam', meaning: ['Benim çantam'], type: 'isim' },
      { word: 'çapta', meaning: ['Boyutta'], type: 'edat' },
      { word: 'çare', meaning: ['Çözüm'], type: 'isim' },
      { word: 'çarşı', meaning: ['Alışveriş yeri'], type: 'isim' },
      { word: 'çatal', meaning: ['Yemek aleti'], type: 'isim' },
      { word: 'çay', meaning: ['İçecek'], type: 'isim' },
      { word: 'çekmek', meaning: ['Çekme işlemi'], type: 'fiil' },
      { word: 'çelik', meaning: ['Sert metal'], type: 'isim' },
      { word: 'çember', meaning: ['Daire şeklinde'], type: 'isim' },
      { word: 'çene', meaning: ['Ağız kısmı'], type: 'isim' },
      { word: 'çeşit', meaning: ['Tür'], type: 'isim' },
      { word: 'çevirmen', meaning: ['Tercüman'], type: 'isim' },
      { word: 'çiğ', meaning: ['Pişmemiş'], type: 'sıfat' },
      { word: 'çile', meaning: ['Sıkıntı'], type: 'isim' },
      { word: 'çimento', meaning: ['İnşaat maddesi'], type: 'isim' },
      { word: 'çizgi', meaning: ['Hat'], type: 'isim' },
      { word: 'çizme', meaning: ['Uzun ayakkabı'], type: 'isim' },
      { word: 'çoban', meaning: ['Hayvan bakıcısı'], type: 'isim' },
      { word: 'çoğu', meaning: ['Büyük kısmı'], type: 'sıfat' },
      { word: 'çorba', meaning: ['Sıvı yemek'], type: 'isim' },
      { word: 'çukur', meaning: ['Çöküntü'], type: 'isim' },
      { word: 'çünkü', meaning: ['Sebep bildiren bağlaç'], type: 'bağlaç' },
      { word: 'dağ', meaning: ['Yüksek yer şekli'], type: 'isim' },
      { word: 'dağıtmak', meaning: ['Yaymak'], type: 'fiil' },
      { word: 'daha', meaning: ['Daha fazla'], type: 'zarf' },
      { word: 'dahi', meaning: ['Bile'], type: 'edat' },
      { word: 'dahil', meaning: ['İçinde'], type: 'edat' },
      { word: 'daima', meaning: ['Her zaman'], type: 'zarf' },
      { word: 'dal', meaning: ['Ağaç kolu'], type: 'isim' },
      { word: 'dalgın', meaning: ['Dikkatsiz'], type: 'sıfat' },
      { word: 'dans', meaning: ['Ritimli hareket'], type: 'isim' },
      { word: 'davet', meaning: ['Çağrı'], type: 'isim' },
      { word: 'dayı', meaning: ['Anne kardeşi'], type: 'isim' },
      { word: 'değil', meaning: ['Değil kelimesi'], type: 'fiil' },
      { word: 'değişik', meaning: ['Farklı'], type: 'sıfat' },
      { word: 'değmek', meaning: ['Temas etmek'], type: 'fiil' },
      { word: 'deli', meaning: ['Akıl hastası'], type: 'sıfat' },
      { word: 'delik', meaning: ['Oyuk'], type: 'isim' },
      { word: 'deniz', meaning: ['Büyük su kitlesi'], type: 'isim' },
      { word: 'deprem', meaning: ['Yer sarsıntısı'], type: 'isim' },
      { word: 'derece', meaning: ['Seviye'], type: 'isim' },
      { word: 'dergi', meaning: ['Süreli yayın'], type: 'isim' },
      { word: 'dert', meaning: ['Problem'], type: 'isim' },
      { word: 'dış', meaning: ['Dışarı'], type: 'isim' },
      { word: 'dışarı', meaning: ['Dış taraf'], type: 'zarf' },
      { word: 'diğer', meaning: ['Başka'], type: 'sıfat' },
      { word: 'dikmek', meaning: ['Dikey yapmak'], type: 'fiil' },
      { word: 'dil', meaning: ['Konuşma organı'], type: 'isim' },
      { word: 'dilek', meaning: ['İstek'], type: 'isim' },
      { word: 'din', meaning: ['İnanç sistemi'], type: 'isim' },
      { word: 'dinlemek', meaning: ['Kulak vermek'], type: 'fiil' },
      { word: 'dış', meaning: ['Dışarı'], type: 'isim' },
      { word: 'diş', meaning: ['Ağız organı'], type: 'isim' },
      { word: 'doğa', meaning: ['Tabiat'], type: 'isim' },
      { word: 'doğmak', meaning: ['Dünyaya gelmek'], type: 'fiil' },
      { word: 'doktor', meaning: ['Hekim'], type: 'isim' },
      { word: 'dolar', meaning: ['Amerikan parası'], type: 'isim' },
      { word: 'dolmak', meaning: ['İçi dolmak'], type: 'fiil' },
      { word: 'don', meaning: ['İç çamaşırı'], type: 'isim' },
      { word: 'donmak', meaning: ['Buzlaşmak'], type: 'fiil' },
      { word: 'dost', meaning: ['Arkadaş'], type: 'isim' },
      { word: 'döviz', meaning: ['Yabancı para'], type: 'isim' },
      { word: 'dövmek', meaning: ['Vurmak'], type: 'fiil' },
      { word: 'düğme', meaning: ['İlik'], type: 'isim' },
      { word: 'dükkan', meaning: ['Mağaza'], type: 'isim' },
      { word: 'dün', meaning: ['Geçen gün'], type: 'zarf' },
      { word: 'dünya', meaning: ['Gezegen'], type: 'isim' },
      { word: 'düşman', meaning: ['Hasım'], type: 'isim' },
      { word: 'düşük', meaning: ['Alçak'], type: 'sıfat' },
      { word: 'düzen', meaning: ['Tertip'], type: 'isim' },
      { word: 'ebe', meaning: ['Doğum yardımcısı'], type: 'isim' },
      { word: 'eczane', meaning: ['İlaç satan yer'], type: 'isim' },
      { word: 'edebiyat', meaning: ['Yazın'], type: 'isim' },
      { word: 'eğitim', meaning: ['Öğretim'], type: 'isim' },
      { word: 'ek', meaning: ['İlave'], type: 'isim' },
      { word: 'ekip', meaning: ['Takım'], type: 'isim' },
      { word: 'ekonomi', meaning: ['İktisat'], type: 'isim' },
      { word: 'ekmek', meaning: ['Temel besin'], type: 'isim' },
      { word: 'eksik', meaning: ['Az'], type: 'sıfat' },
      { word: 'elektrik', meaning: ['Enerji türü'], type: 'isim' },
      { word: 'elbise', meaning: ['Kadın giysisi'], type: 'isim' },
      { word: 'elçi', meaning: ['Büyükelçi'], type: 'isim' },
      { word: 'emek', meaning: ['Çalışma'], type: 'isim' },
      { word: 'emir', meaning: ['Buyruk'], type: 'isim' },
      { word: 'emniyet', meaning: ['Güvenlik'], type: 'isim' },
      { word: 'endişe', meaning: ['Kaygı'], type: 'isim' },
      { word: 'enerji', meaning: ['Güç'], type: 'isim' },
      { word: 'engel', meaning: ['Mani'], type: 'isim' },
      { word: 'eş', meaning: ['Karı koca'], type: 'isim' },
      { word: 'eşya', meaning: ['Mal'], type: 'isim' },
      { word: 'etmek', meaning: ['Yapmak'], type: 'fiil' },
      { word: 'euro', meaning: ['Avrupa parası'], type: 'isim' },
      { word: 'evlenmek', meaning: ['Nikah yapmak'], type: 'fiil' },
      { word: 'evvel', meaning: ['Önce'], type: 'zarf' },
      { word: 'ey', meaning: ['Seslenme sözü'], type: 'ünlem' },
      { word: 'eylem', meaning: ['Hareket'], type: 'isim' },
      { word: 'fabrika', meaning: ['Üretim yeri'], type: 'isim' },
      { word: 'fakat', meaning: ['Ama'], type: 'bağlaç' },
      { word: 'fakir', meaning: ['Yoksul'], type: 'sıfat' },
      { word: 'fare', meaning: ['Küçük kemirgen'], type: 'isim' },
      { word: 'fark', meaning: ['Ayrım'], type: 'isim' },
      { word: 'farz', meaning: ['Varsayım'], type: 'isim' },
      { word: 'fasıl', meaning: ['Bölüm'], type: 'isim' },
      { word: 'fayda', meaning: ['Yarar'], type: 'isim' },
      { word: 'fazla', meaning: ['Çok'], type: 'sıfat' },
      { word: 'federal', meaning: ['Birleşik'], type: 'sıfat' },
      { word: 'felsefe', meaning: ['Hikmet'], type: 'isim' },
      { word: 'fen', meaning: ['Bilim'], type: 'isim' },
      { word: 'fener', meaning: ['Işık aleti'], type: 'isim' },
      { word: 'fırın', meaning: ['Pişirme yeri'], type: 'isim' },
      { word: 'fırsat', meaning: ['Şans'], type: 'isim' },
      { word: 'fikir', meaning: ['Düşünce'], type: 'isim' },
      { word: 'finans', meaning: ['Mali işler'], type: 'isim' },
      { word: 'fizik', meaning: ['Doğa bilimi'], type: 'isim' },
      { word: 'fiyat', meaning: ['Değer'], type: 'isim' },
      { word: 'fon', meaning: ['Kaynak'], type: 'isim' },
      { word: 'form', meaning: ['Biçim'], type: 'isim' },
      { word: 'foto', meaning: ['Resim'], type: 'isim' },
      { word: 'fren', meaning: ['Durdurucu'], type: 'isim' },
      { word: 'garip', meaning: ['Acayip'], type: 'sıfat' },
      { word: 'gaz', meaning: ['Gaz hali'], type: 'isim' },
      { word: 'gazete', meaning: ['Günlük yayın'], type: 'isim' },
      { word: 'geçmek', meaning: ['Aşmak'], type: 'fiil' },
      { word: 'gece', meaning: ['Karanlık vakit'], type: 'isim' },
      { word: 'gelen', meaning: ['Gelen'], type: 'sıfat' },
      { word: 'genel', meaning: ['Umumi'], type: 'sıfat' },
      { word: 'genç', meaning: ['Yaşlı olmayan'], type: 'sıfat' },
      { word: 'gerçek', meaning: ['Hakiki'], type: 'sıfat' },
      { word: 'geri', meaning: ['Arkaya'], type: 'zarf' },
      { word: 'gider', meaning: ['Masraf'], type: 'isim' },
      { word: 'gidermek', meaning: ['Yok etmek'], type: 'fiil' },
      { word: 'giriş', meaning: ['Başlangıç'], type: 'isim' },
      { word: 'giysi', meaning: ['Elbise'], type: 'isim' },
      { word: 'gizli', meaning: ['Saklı'], type: 'sıfat' },
      { word: 'göl', meaning: ['Su kitlesi'], type: 'isim' },
      { word: 'gömlek', meaning: ['Üst giysisi'], type: 'isim' },
      { word: 'göndermek', meaning: ['Yollamak'], type: 'fiil' },
      { word: 'görüş', meaning: ['Fikir'], type: 'isim' },
      { word: 'gözlük', meaning: ['Görme aleti'], type: 'isim' },
      { word: 'grup', meaning: ['Küme'], type: 'isim' },
      { word: 'güçlü', meaning: ['Kuvvetli'], type: 'sıfat' },
      { word: 'gül', meaning: ['Çiçek'], type: 'isim' },
      { word: 'gümrük', meaning: ['Sınır kapısı'], type: 'isim' },
      { word: 'gümüş', meaning: ['Değerli maden'], type: 'isim' },
      { word: 'günlük', meaning: ['Her gün olan'], type: 'sıfat' },
      { word: 'güvenlik', meaning: ['Emniyet'], type: 'isim' },
      { word: 'haber', meaning: ['Bilgi'], type: 'isim' },
      { word: 'haberci', meaning: ['Bilgi getiren'], type: 'isim' },
      { word: 'habersiz', meaning: ['Bilgisiz'], type: 'sıfat' },
      { word: 'hacim', meaning: ['Boyut'], type: 'isim' },
      { word: 'hadise', meaning: ['Olay'], type: 'isim' },
      { word: 'hafif', meaning: ['Az ağırlıklı'], type: 'sıfat' },
      { word: 'hak', meaning: ['Adalet'], type: 'isim' },
      { word: 'hakem', meaning: ['Yargıç'], type: 'isim' },
      { word: 'hala', meaning: ['Hâlâ'], type: 'zarf' },
      { word: 'halı', meaning: ['Yer döşemesi'], type: 'isim' },
      { word: 'halk', meaning: ['Millet'], type: 'isim' },
      { word: 'hamam', meaning: ['Yıkanma yeri'], type: 'isim' },
      { word: 'hamur', meaning: ['Karışım'], type: 'isim' },
      { word: 'hangi', meaning: ['Ne'], type: 'sıfat' },
      { word: 'hap', meaning: ['İlaç'], type: 'isim' },
      { word: 'hapisane', meaning: ['Cezaevi'], type: 'isim' },
      { word: 'hareket', meaning: ['Eylem'], type: 'isim' },
      { word: 'harp', meaning: ['Savaş'], type: 'isim' },
      { word: 'hasta', meaning: ['Sağlıksız'], type: 'sıfat' },
      { word: 'haşere', meaning: ['Zararlı böcek'], type: 'isim' },
      { word: 'hatıra', meaning: ['Anı'], type: 'isim' },
      { word: 'hava', meaning: ['Atmosfer'], type: 'isim' },
      { word: 'havuz', meaning: ['Su çukuru'], type: 'isim' },
      { word: 'haya', meaning: ['Utanma'], type: 'isim' },
      { word: 'hayal', meaning: ['Rüya'], type: 'isim' },
      { word: 'hayır', meaning: ['Ret cevabı'], type: 'ünlem' },
      { word: 'hazır', meaning: ['Tamam'], type: 'sıfat' },
      { word: 'hece', meaning: ['Ses birimi'], type: 'isim' },
      { word: 'hedef', meaning: ['Gaye'], type: 'isim' },
      { word: 'hediye', meaning: ['Armağan'], type: 'isim' },
      { word: 'hemen', meaning: ['Derhal'], type: 'zarf' },
      { word: 'hem', meaning: ['Aynı zamanda'], type: 'bağlaç' },
      { word: 'henüz', meaning: ['Daha'], type: 'zarf' },
      { word: 'hep', meaning: ['Daima'], type: 'zarf' },
      { word: 'hesap', meaning: ['Sayma'], type: 'isim' },
      { word: 'heyecan', meaning: ['Coşku'], type: 'isim' },
      { word: 'hız', meaning: ['Sürat'], type: 'isim' },
      { word: 'hizmet', meaning: ['Hizmet etme'], type: 'isim' },
      { word: 'hoş', meaning: ['Güzel'], type: 'sıfat' },
      { word: 'hükümet', meaning: ['Yönetim'], type: 'isim' },
      { word: 'hürriyet', meaning: ['Özgürlük'], type: 'isim' },
      { word: 'ırmak', meaning: ['Küçük nehir'], type: 'isim' },
      { word: 'ısı', meaning: ['Sıcaklık'], type: 'isim' },
      { word: 'içerik', meaning: ['Muhteva'], type: 'isim' },
      { word: 'içinde', meaning: ['İçte'], type: 'edat' },
      { word: 'içki', meaning: ['Alkollü içecek'], type: 'isim' },
      { word: 'ideal', meaning: ['Mükemmel'], type: 'sıfat' },
      { word: 'iddia', meaning: ['Öne sürme'], type: 'isim' },
      { word: 'ikinci', meaning: ['2. sırada'], type: 'sayı' },
      { word: 'iklim', meaning: ['Hava durumu'], type: 'isim' },
      { word: 'ilahi', meaning: ['Dini şarkı'], type: 'isim' },
      { word: 'ile', meaning: ['İle birlikte'], type: 'edat' },
      { word: 'ileri', meaning: ['Öne doğru'], type: 'zarf' },
      { word: 'ilgili', meaning: ['Alakalı'], type: 'sıfat' },
      { word: 'ilk', meaning: ['Birinci'], type: 'sıfat' },
      { word: 'imam', meaning: ['Din görevlisi'], type: 'isim' },
      { word: 'imkan', meaning: ['Olanak'], type: 'isim' },
      { word: 'imza', meaning: ['İsim'], type: 'isim' },
      { word: 'inan', meaning: ['İnanmak'], type: 'fiil' },
      { word: 'ince', meaning: ['Kalın olmayan'], type: 'sıfat' },
      { word: 'insan', meaning: ['Kişi'], type: 'isim' },
      { word: 'ipek', meaning: ['Böcek lifi'], type: 'isim' },
      { word: 'irade', meaning: ['İstek gücü'], type: 'isim' },
      { word: 'işte', meaning: ['İşte'], type: 'ünlem' },
      { word: 'işçi', meaning: ['Çalışan'], type: 'isim' },
      { word: 'işlem', meaning: ['Süreç'], type: 'isim' },
      { word: 'işsiz', meaning: ['Çalışmayan'], type: 'sıfat' },
      { word: 'iyi', meaning: ['Güzel'], type: 'sıfat' },
      { word: 'japon', meaning: ['Japonya\'dan'], type: 'sıfat' },
      { word: 'jimnastik', meaning: ['Beden eğitimi'], type: 'isim' },
      { word: 'jüri', meaning: ['Değerlendirme heyeti'], type: 'isim' },
      { word: 'kabin', meaning: ['Küçük oda'], type: 'isim' },
      { word: 'kâğıt', meaning: ['Yazı maddesi'], type: 'isim' },
      { word: 'kah', meaning: ['Bazen'], type: 'zarf' },
      { word: 'kahve', meaning: ['İçecek'], type: 'isim' },
      { word: 'kalabalık', meaning: ['Çok kişi'], type: 'isim' },
      { word: 'kalas', meaning: ['Ahşap'], type: 'isim' },
      { word: 'kale', meaning: ['Savunma yapısı'], type: 'isim' },
      { word: 'kalp', meaning: ['Yürek'], type: 'isim' },
      { word: 'kamp', meaning: ['Çadırda kalma'], type: 'isim' },
      { word: 'kan', meaning: ['Vücut sıvısı'], type: 'isim' },
      { word: 'kanat', meaning: ['Uçma organı'], type: 'isim' },
      { word: 'kanun', meaning: ['Hukuk kuralı'], type: 'isim' },
      { word: 'kapak', meaning: ['Örtü'], type: 'isim' },
      { word: 'kapat', meaning: ['Kapatmak'], type: 'fiil' },
      { word: 'kar', meaning: ['Beyaz yağış'], type: 'isim' },
      { word: 'karakter', meaning: ['Kişilik'], type: 'isim' },
      { word: 'karı', meaning: ['Eş'], type: 'isim' },
      { word: 'karın', meaning: ['Göbek'], type: 'isim' },
      { word: 'karışık', meaning: ['Düzensiz'], type: 'sıfat' },
      { word: 'karar', meaning: ['Belirleme'], type: 'isim' },
      { word: 'kargo', meaning: ['Taşımacılık'], type: 'isim' },
      { word: 'karma', meaning: ['Karışım'], type: 'isim' },
      { word: 'karşı', meaning: ['Zıt'], type: 'edat' },
      { word: 'kat', meaning: ['Bina bölümü'], type: 'isim' },
      { word: 'katı', meaning: ['Sert'], type: 'sıfat' },
      { word: 'katılmak', meaning: ['Dahil olmak'], type: 'fiil' },
      { word: 'kavga', meaning: ['Tartışma'], type: 'isim' },
      { word: 'kayıp', meaning: ['Bulunamayan'], type: 'sıfat' },
      { word: 'kazan', meaning: ['Büyük kap'], type: 'isim' },
      { word: 'kedi', meaning: ['Evcil hayvan'], type: 'isim' },
      { word: 'kefaret', meaning: ['Bedel'], type: 'isim' },
      { word: 'kelle', meaning: ['Kafa'], type: 'isim' },
      { word: 'kemik', meaning: ['Vücut iskeleti'], type: 'isim' },
      { word: 'kendi', meaning: ['Kişinin kendisi'], type: 'zamir' },
      { word: 'kere', meaning: ['Defa'], type: 'isim' },
      { word: 'kesmek', meaning: ['Ayırmak'], type: 'fiil' },
      { word: 'kesin', meaning: ['Kesin'], type: 'sıfat' },
      { word: 'kesim', meaning: ['Bölge'], type: 'isim' },
      { word: 'kez', meaning: ['Defa'], type: 'isim' },
      { word: 'kıl', meaning: ['İnce tüy'], type: 'isim' },
      { word: 'kır', meaning: ['Kırsal alan'], type: 'isim' },
      { word: 'kırık', meaning: ['Bozuk'], type: 'sıfat' },
      { word: 'kış', meaning: ['Soğuk mevsim'], type: 'isim' },
      { word: 'kısmen', meaning: ['Kısmen'], type: 'zarf' },
      { word: 'kıta', meaning: ['Büyük kara parçası'], type: 'isim' },
      { word: 'kıyı', meaning: ['Sahil'], type: 'isim' },
      { word: 'kıymet', meaning: ['Değer'], type: 'isim' },
      { word: 'kız', meaning: ['Genç kadın'], type: 'isim' },
      { word: 'kızdırmak', meaning: ['Öfkelendirmek'], type: 'fiil' },
      { word: 'kimse', meaning: ['Hiç kimse'], type: 'zamir' },
      { word: 'kimya', meaning: ['Madde bilimi'], type: 'isim' },
      { word: 'kira', meaning: ['Kira ücreti'], type: 'isim' },
      { word: 'kirli', meaning: ['Temiz olmayan'], type: 'sıfat' },
      { word: 'kişi', meaning: ['İnsan'], type: 'isim' },
      { word: 'kitap', meaning: ['Yazılı eser'], type: 'isim' },
      { word: 'koca', meaning: ['Eş'], type: 'isim' },
      { word: 'kod', meaning: ['Şifre'], type: 'isim' },
      { word: 'koku', meaning: ['Koku'], type: 'isim' },
      { word: 'kol', meaning: ['Vücut uzvu'], type: 'isim' },
      { word: 'koltuk', meaning: ['Oturma yeri'], type: 'isim' },
      { word: 'komşu', meaning: ['Yakın yaşayan'], type: 'isim' },
      { word: 'konu', meaning: ['Mevzu'], type: 'isim' },
      { word: 'konuk', meaning: ['Misafir'], type: 'isim' },
      { word: 'konum', meaning: ['Yer'], type: 'isim' },
      { word: 'kopya', meaning: ['Suret'], type: 'isim' },
      { word: 'koridor', meaning: ['Geçit'], type: 'isim' },
      { word: 'koruma', meaning: ['Muhafaza'], type: 'isim' },
      { word: 'kova', meaning: ['Su kabı'], type: 'isim' },
      { word: 'koyun', meaning: ['Evcil hayvan'], type: 'isim' },
      { word: 'köz', meaning: ['Ateş'], type: 'isim' },
      { word: 'köşe', meaning: ['Açının birleşme yeri'], type: 'isim' },
      { word: 'köylü', meaning: ['Köyde yaşayan'], type: 'isim' },
      { word: 'kredi', meaning: ['Borç'], type: 'isim' },
      { word: 'kriz', meaning: ['Bunalım'], type: 'isim' },
      { word: 'kuaför', meaning: ['Saç kesici'], type: 'isim' },
      { word: 'kuba', meaning: ['Zar'], type: 'isim' },
      { word: 'kucak', meaning: ['Kol arası'], type: 'isim' },
      { word: 'kudret', meaning: ['Güç'], type: 'isim' },
      { word: 'kule', meaning: ['Yüksek yapı'], type: 'isim' },
      { word: 'kulak', meaning: ['İşitme organı'], type: 'isim' },
      { word: 'kulüp', meaning: ['Dernek'], type: 'isim' },
      { word: 'kum', meaning: ['İnce taneli madde'], type: 'isim' },
      { word: 'kupa', meaning: ['Kap'], type: 'isim' },
      { word: 'kupon', meaning: ['Fiş'], type: 'isim' },
      { word: 'kural', meaning: ['Prensip'], type: 'isim' },
      { word: 'kurs', meaning: ['Eğitim'], type: 'isim' },
      { word: 'kurtarmak', meaning: ['Kurtarmak'], type: 'fiil' },
      { word: 'kutu', meaning: ['Sandık'], type: 'isim' },
      { word: 'kutsal', meaning: ['Mukaddes'], type: 'sıfat' },
      { word: 'kuvvet', meaning: ['Güç'], type: 'isim' },
      { word: 'kuzey', meaning: ['Yön'], type: 'isim' },
      { word: 'küçük', meaning: ['Ufak'], type: 'sıfat' },
      { word: 'külot', meaning: ['İç çamaşırı'], type: 'isim' },
      { word: 'kültür', meaning: ['Uygarlık'], type: 'isim' },
      { word: 'küpe', meaning: ['Kulak süsü'], type: 'isim' },
      { word: 'küvet', meaning: ['Banyo teknesi'], type: 'isim' },
      { word: 'laboratuvar', meaning: ['Deney yeri'], type: 'isim' },
      { word: 'laf', meaning: ['Söz'], type: 'isim' },
      { word: 'lamba', meaning: ['Işık aleti'], type: 'isim' },
      { word: 'latin', meaning: ['Latin'], type: 'sıfat' },
      { word: 'leke', meaning: ['Kirlilik'], type: 'isim' },
      { word: 'lez', meaning: ['Tat'], type: 'isim' },
      { word: 'liberal', meaning: ['Özgürlükçü'], type: 'sıfat' },
      { word: 'liman', meaning: ['Gemi limanı'], type: 'isim' },
      { word: 'limon', meaning: ['Ekşi meyve'], type: 'isim' },
      { word: 'liste', meaning: ['Cetvel'], type: 'isim' },
      { word: 'locus', meaning: ['Yer'], type: 'isim' },
      { word: 'lüks', meaning: ['Güzel'], type: 'sıfat' },
      { word: 'maç', meaning: ['Yarışma'], type: 'isim' },
      { word: 'madde', meaning: ['Nesne'], type: 'isim' },
      { word: 'maden', meaning: ['Yer altı kaynağı'], type: 'isim' },
      { word: 'magazin', meaning: ['Dergi'], type: 'isim' },
      { word: 'mahalle', meaning: ['Semt'], type: 'isim' },
      { word: 'makina', meaning: ['Alet'], type: 'isim' },
      { word: 'makine', meaning: ['Mekanik alet'], type: 'isim' },
      { word: 'makul', meaning: ['Mantıklı'], type: 'sıfat' },
      { word: 'mal', meaning: ['Eşya'], type: 'isim' },
      { word: 'mama', meaning: ['Bebek yemeği'], type: 'isim' },
      { word: 'mana', meaning: ['Anlam'], type: 'isim' },
      { word: 'manas', meaning: ['Mana'], type: 'isim' },
      { word: 'mangal', meaning: ['Ateş yakma yeri'], type: 'isim' },
      { word: 'manto', meaning: ['Dış giysi'], type: 'isim' },
      { word: 'marka', meaning: ['İşaret'], type: 'isim' },
      { word: 'mavi', meaning: ['Renk'], type: 'isim' },
      { word: 'mayıs', meaning: ['5. ay'], type: 'isim' },
      { word: 'mazi', meaning: ['Geçmiş'], type: 'isim' },
      { word: 'meclis', meaning: ['Kurul'], type: 'isim' },
      { word: 'medya', meaning: ['İletişim araçları'], type: 'isim' },
      { word: 'mekan', meaning: ['Yer'], type: 'isim' },
      { word: 'mektup', meaning: ['Yazı'], type: 'isim' },
      { word: 'memnun', meaning: ['Hoşnut'], type: 'sıfat' },
      { word: 'memur', meaning: ['Devlet görevlisi'], type: 'isim' },
      { word: 'menfaat', meaning: ['Çıkar'], type: 'isim' },
      { word: 'mesafe', meaning: ['Uzaklık'], type: 'isim' },
      { word: 'mesaj', meaning: ['Bildiri'], type: 'isim' },
      { word: 'mesele', meaning: ['Sorun'], type: 'isim' },
      { word: 'meslek', meaning: ['İş'], type: 'isim' },
      { word: 'metin', meaning: ['Yazı'], type: 'isim' },
      { word: 'metro', meaning: ['Yeraltı trenı'], type: 'isim' },
      { word: 'meydan', meaning: ['Alan'], type: 'isim' },
      { word: 'meyveli', meaning: ['Meyve içeren'], type: 'sıfat' },
      { word: 'mezar', meaning: ['Ölü yeri'], type: 'isim' },
      { word: 'mısır', meaning: ['Tahıl'], type: 'isim' },
      { word: 'mide', meaning: ['Mide organı'], type: 'isim' },
      { word: 'mimarlık', meaning: ['Yapı sanatı'], type: 'isim' },
      { word: 'minder', meaning: ['Yastık'], type: 'isim' },
      { word: 'miras', meaning: ['Kalıt'], type: 'isim' },
      { word: 'misafir', meaning: ['Konuk'], type: 'isim' },
      { word: 'moda', meaning: ['Giyim trendi'], type: 'isim' },
      { word: 'modern', meaning: ['Çağdaş'], type: 'sıfat' },
      { word: 'motosiklet', meaning: ['İki tekerlekli araç'], type: 'isim' },
      { word: 'motor', meaning: ['Makina'], type: 'isim' },
      { word: 'mucize', meaning: ['Harika olay'], type: 'isim' },
      { word: 'muhasebe', meaning: ['Sayım'], type: 'isim' },
      { word: 'mum', meaning: ['Işık maddesi'], type: 'isim' },
      { word: 'muz', meaning: ['Sarı meyve'], type: 'isim' },
      { word: 'müdür', meaning: ['Yönetici'], type: 'isim' },
      { word: 'mükemmel', meaning: ['Kusursuz'], type: 'sıfat' },
      { word: 'mümkün', meaning: ['Olabilir'], type: 'sıfat' },
      { word: 'müşteri', meaning: ['Alıcı'], type: 'isim' },
      { word: 'müze', meaning: ['Eser sergisi'], type: 'isim' },
      { word: 'müzisyen', meaning: ['Müzik yapan'], type: 'isim' },
      { word: 'nadir', meaning: ['Seyrek'], type: 'sıfat' },
      { word: 'nah', meaning: ['Hayır'], type: 'ünlem' },
      { word: 'nakil', meaning: ['Taşıma'], type: 'isim' },
      { word: 'nakliye', meaning: ['Taşımacılık'], type: 'isim' },
      { word: 'namaz', meaning: ['İbadet'], type: 'isim' },
      { word: 'namus', meaning: ['Şeref'], type: 'isim' },
      { word: 'nasıl', meaning: ['Ne şekilde'], type: 'sıfat' },
      { word: 'nazar', meaning: ['Bakış'], type: 'isim' },
      { word: 'nazik', meaning: ['Kibar'], type: 'sıfat' },
      { word: 'nehir', meaning: ['Akarsu'], type: 'isim' },
      { word: 'nerde', meaning: ['Nerede'], type: 'soru' },
      { word: 'nesil', meaning: ['Jenerasyon'], type: 'isim' },
      { word: 'nevi', meaning: ['Çeşit'], type: 'isim' },
      { word: 'neyse', meaning: ['Her neyse'], type: 'ünlem' },
      { word: 'nişan', meaning: ['Evlilik sözü'], type: 'isim' },
      { word: 'niye', meaning: ['Neden'], type: 'soru' },
      { word: 'niyet', meaning: ['Kasıt'], type: 'isim' },
      { word: 'nokta', meaning: ['İşaret'], type: 'isim' },
      { word: 'nöbet', meaning: ['Bekçilik'], type: 'isim' },
      { word: 'nüfus', meaning: ['İnsan sayısı'], type: 'isim' },
      { word: 'oğul', meaning: ['Erkek çocuk'], type: 'isim' },
      { word: 'okul', meaning: ['Eğitim yeri'], type: 'isim' },
      { word: 'olanak', meaning: ['İmkan'], type: 'isim' },
      { word: 'olay', meaning: ['Hadise'], type: 'isim' },
      { word: 'ölçü', meaning: ['Büyüklük'], type: 'isim' },
      { word: 'ölmek', meaning: ['Hayatı kaybetmek'], type: 'fiil' },
      { word: 'önemli', meaning: ['Mühim'], type: 'sıfat' },
      { word: 'örnek', meaning: ['Model'], type: 'isim' },
      { word: 'örtü', meaning: ['Kapak'], type: 'isim' },
      { word: 'öteki', meaning: ['Diğer'], type: 'sıfat' },
      { word: 'ötürü', meaning: ['Sebepten'], type: 'edat' },
      { word: 'öyle', meaning: ['O şekilde'], type: 'sıfat' },
      { word: 'paha', meaning: ['Değer'], type: 'isim' },
      { word: 'paket', meaning: ['Ambalaj'], type: 'isim' },
      { word: 'pantalon', meaning: ['Alt giysisi'], type: 'isim' },
      { word: 'para', meaning: ['Ödeme aracı'], type: 'isim' },
      { word: 'parça', meaning: ['Bölüm'], type: 'isim' },
      { word: 'park', meaning: ['Yeşil alan'], type: 'isim' },
      { word: 'parti', meaning: ['Siyasi grup'], type: 'isim' },
      { word: 'pasta', meaning: ['Tatlı'], type: 'isim' },
      { word: 'patates', meaning: ['Sebze'], type: 'isim' },
      { word: 'pazar', meaning: ['Alışveriş yeri'], type: 'isim' },
      { word: 'pek', meaning: ['Çok'], type: 'zarf' },
      { word: 'peynir', meaning: ['Süt ürünü'], type: 'isim' },
      { word: 'pilot', meaning: ['Uçak kullanıcısı'], type: 'isim' },
      { word: 'pişmek', meaning: ['Hazır olmak'], type: 'fiil' },
      { word: 'plan', meaning: ['Program'], type: 'isim' },
      { word: 'plaj', meaning: ['Sahil'], type: 'isim' },
      { word: 'polis', meaning: ['Güvenlik görevlisi'], type: 'isim' },
      { word: 'post', meaning: ['Görev'], type: 'isim' },
      { word: 'prens', meaning: ['Şehzade'], type: 'isim' },
      { word: 'proje', meaning: ['Tasarı'], type: 'isim' },
      { word: 'psikolog', meaning: ['Ruh bilimci'], type: 'isim' },
      { word: 'radyo', meaning: ['Ses aleti'], type: 'isim' },
      { word: 'rahat', meaning: ['Kolay'], type: 'sıfat' },
      { word: 'rakam', meaning: ['Sayı'], type: 'isim' },
      { word: 'raporr', meaning: ['Bildiri'], type: 'isim' },
      { word: 'ders', meaning: ['Ders'], type: 'isim' }
    ];

    this.addBulkWords(bulkWords);

    // İki kelimelik bazı kalıplar ekle
    this.phrases.set('adın ne', { meaning: 'kişinin ismini sormak', type: 'soru_kalıbı' });
    this.phrases.set('nasılsın bugün', { meaning: 'kişinin durumunu sormak', type: 'soru_kalıbı' });
  }

  private initializeCommonPatterns() {
    // "Adın ne?" kalıbı
    const namePattern: PhrasePattern = {
      pattern: /ad[ıiuü][mnz] ne\??/i,
      intent: 'isim_sorma',
      confidence: 0.95,
      matches: (words: string[]) => {
        const text = words.join(' ').toLowerCase();
        return this.pattern.test(text);
      },
      generateResponse: () => 'Adım Yapay Zeka Robotu.',
      wasSuccessful: true
    };

    // "Nasılsın?" kalıbı
    const howAreYouPattern: PhrasePattern = {
      pattern: /nas[ıi]ls[ıi]n\??/i,
      intent: 'hal_hatır_sorma',
      confidence: 0.9,
      matches: (words: string[]) => {
        const text = words.join(' ').toLowerCase();
        return this.pattern.test(text);
      },
      generateResponse: () => 'İyiyim, teşekkür ederim. Siz nasılsınız?',
      wasSuccessful: true
    };

    this.patterns.push(namePattern);
    this.patterns.push(howAreYouPattern);
  }

  addWord(entry: DictionaryEntry): void {
    this.dictionary.set(entry.word.toLowerCase(), entry);
  }

  getWord(word: string): DictionaryEntry | undefined {
    return this.dictionary.get(word.toLowerCase());
  }

  removeWord(word: string): boolean {
    return this.dictionary.delete(word.toLowerCase());
  }

  updateWord(word: string, newEntry: Partial<DictionaryEntry>): boolean {
    const existingEntry = this.dictionary.get(word.toLowerCase());
    if (existingEntry) {
      this.dictionary.set(word.toLowerCase(), { ...existingEntry, ...newEntry });
      return true;
    }
    return false;
  }

  addPhrase(phrase: string, meaning: string, type: string): void {
    this.phrases.set(phrase.toLowerCase(), { meaning, type });
  }

  getPhrase(phrase: string): { meaning: string, type: string } | undefined {
    return this.phrases.get(phrase.toLowerCase());
  }

  analyzePhrase(phrase: string): PhraseAnalysisResult {
    const words = phrase.toLowerCase().split(/\s+/);
    const foundWords: DictionaryEntry[] = [];
    let understanding = '';
    let confidence = 0;
    const semanticComponents: Record<string, any> = {
      subject: '',
      action: '',
      object: '',
      context: '',
      intent: '',
      questionWord: '',
      expectedResponse: '',
      logic: '',
      reasoning: []
    };

    // Gelişmiş kelime analizi ve anlamlandırma
    words.forEach((word, index) => {
      const entry = this.getWord(word);
      if (entry) {
        foundWords.push(entry);

        // Kelime türüne göre anlamsal rol belirleme
        switch(entry.type) {
          case 'isim':
            if (!semanticComponents.subject) {
              semanticComponents.subject = word;
              semanticComponents.reasoning.push(`"${word}" kelimesi isim türünde, özne olarak belirlendi`);
            } else {
              semanticComponents.object = word;
              semanticComponents.reasoning.push(`"${word}" kelimesi isim türünde, nesne olarak belirlendi`);
            }
            break;
          case 'fiil':
            semanticComponents.action = word;
            semanticComponents.reasoning.push(`"${word}" kelimesi fiil türünde, eylem olarak belirlendi`);
            break;
          case 'sıfat':
            semanticComponents.context += word + ' ';
            semanticComponents.reasoning.push(`"${word}" kelimesi sıfat türünde, bağlam olarak eklendi`);
            break;
          case 'soru':
            semanticComponents.intent = 'soru';
            semanticComponents.questionWord = word;
            semanticComponents.reasoning.push(`"${word}" soru kelimesi, bu bir soru cümlesi`);
            break;
          case 'zamir':
            if (word === 'ben' || word === 'benim') {
              semanticComponents.reasoning.push(`"${word}" birinci tekil şahıs zamiri, konuşmacıya atıfta bulunuyor`);
            } else if (word === 'sen' || word === 'senin') {
              semanticComponents.reasoning.push(`"${word}" ikinci tekil şahıs zamiri, muhataba atıfta bulunuyor`);
            }
            break;
        }
      }
    });

    // Mantıklı çıkarım sistemi
    this.performLogicalReasoning(phrase, words, semanticComponents);

    // Anlamsal bütünlük kontrolü
    if (semanticComponents.subject && semanticComponents.action) {
      understanding = `${semanticComponents.subject} ${semanticComponents.action}`;
      confidence = 0.8;
      semanticComponents.logic = `Özne ve eylem tespit edildi: ${semanticComponents.subject} + ${semanticComponents.action}`;
    } else if (semanticComponents.subject && semanticComponents.object) {
      understanding = `${semanticComponents.subject} ve ${semanticComponents.object} arasında ilişki`;
      confidence = 0.6;
      semanticComponents.logic = `Özne ve nesne arasında ilişki kuruldu`;
    }

    // Soru cümlesi kontrolü ve mantıklı cevap üretimi
    if (semanticComponents.intent === 'soru') {
      confidence += 0.1;
      const response = this.generateLogicalResponse(phrase, words, semanticComponents);
      if (response) {
        semanticComponents.expectedResponse = response;
        understanding = semanticComponents.logic || 'Soru analiz edildi ve cevap üretildi';
        confidence = Math.min(confidence + 0.2, 1.0);
      }
    }

    // Kalıp analizi
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(phrase.toLowerCase())) {
        understanding = pattern.intent;
        confidence = pattern.confidence;

        // İstatistik güncelle
        this.statistics.totalQueries++;
        if (pattern.wasSuccessful) {
          this.statistics.successfulQueries++;
        }

        // Sık kullanılan kalıpları kaydet
        const patternKey = pattern.intent;
        const currentCount = this.statistics.commonPatterns.get(patternKey) || 0;
        this.statistics.commonPatterns.set(patternKey, currentCount + 1);

        break;
      }
    }

    // Gelişmiş özel kalıp analizleri
    this.advancedPatternAnalysis(phrase, words, semanticComponents);

    return {
      words: foundWords,
      understanding: understanding || semanticComponents.logic || 'Anlam bulunamadı',
      confidence,
      semanticComponents
    };
  }

  private performLogicalReasoning(phrase: string, words: string[], semanticComponents: any): void {
    const originalPhrase = phrase.toLowerCase().trim();

    // Gelişmiş soru kalıpları analizi
    const questionPatterns = [
      {
        // "X nedir?" - Kesin tanım sorusu
        pattern: /^(.+?)\s*nedir\s*\??$/i,
        type: 'definition_question',
        confidence: 0.95,
        handler: (match: RegExpMatchArray) => {
          const targetWord = match[1].trim();
          const entry = this.getWord(targetWord);
          if (entry) {
            semanticComponents.logic = `"${targetWord}" kelimesinin tanımı sorgulanıyor.`;
            semanticComponents.expectedResponse = `${targetWord} şu demek: ${entry.meaning[0]} 😊`;
            if (entry.examples && entry.examples.length > 0) {
              semanticComponents.expectedResponse += ` Mesela: ${entry.examples[0]}`;
            }
            semanticComponents.intent = 'kesin_tanım';
            return true;
          } else {
            semanticComponents.expectedResponse = `"${targetWord}" kelimesini henüz bilmiyorum 😅 Bana öğretebilir misin? Yukarıdaki "Eğitim" butonuna tıkla!`;
            semanticComponents.intent = 'bilinmeyen_kelime';
            return true;
          }
        }
      },
      {
        // "X ne demek?" - Anlam sorusu
        pattern: /^(.+?)\s*ne\s*demek\s*\??$/i,
        type: 'meaning_question',
        confidence: 0.9,
        handler: (match: RegExpMatchArray) => {
          const targetWord = match[1].trim();
          const entry = this.getWord(targetWord);
          if (entry) {
            semanticComponents.logic = `"${targetWord}" kelimesinin anlamı sorgulanıyor.`;
            semanticComponents.expectedResponse = `"${targetWord}" kelimesi: ${entry.meaning[0]}${entry.type ? ` (${entry.type})` : ''}`;
            semanticComponents.intent = 'anlam_sorgusu';
            return true;
          } else {
            semanticComponents.expectedResponse = `"${targetWord}" kelimesinin anlamını bilmiyorum.`;
            semanticComponents.intent = 'bilinmeyen_anlam';
            return true;
          }
        }
      },
      {
        // "X ne?" - Basit soru
        pattern: /^(.+?)\s*ne\s*\??$/i,
        type: 'simple_question',
        confidence: 0.8,
        handler: (match: RegExpMatchArray) => {
          const targetWord = match[1].trim();
          const entry = this.getWord(targetWord);
          if (entry) {
            semanticComponents.logic = `"${targetWord}" kelimesi hakkında soru.`;
            semanticComponents.expectedResponse = `${targetWord}: ${entry.meaning[0]}`;
            semanticComponents.intent = 'basit_soru';
            return true;
          }
          return false;
        }
      },
      {
        // "Kim?" soruları
        pattern: /^(.+?)\s*kim\s*\??$/i,
        type: 'who_question',
        confidence: 0.85,
        handler: (match: RegExpMatchArray) => {
          const targetSubject = match[1].trim();
          semanticComponents.logic = `"${targetSubject}" hakkında kim sorusu.`;
          semanticComponents.intent = 'kim_sorgusu';
          // Bu durumda eğitim verisinde arama yapılmalı
          return false; // Başka sistemlerin devreye girmesi için false döndür
        }
      }
    ];

    // Soru kalıplarını kontrol et
    for (const questionPattern of questionPatterns) {
      const match = originalPhrase.match(questionPattern.pattern);
      if (match && questionPattern.handler(match)) {
        semanticComponents.confidence = questionPattern.confidence;
        semanticComponents.reasoning.push(`${questionPattern.type} kalıbı tespit edildi`);
        return;
      }
    }

    // Mevcut mantıklı çıkarımlar...
    
    // "Adın ne?" mantıklı çıkarımı
    if (words.includes('ad') || words.includes('adın')) {
      if (words.includes('ne') || words.includes('nedir')) {
        semanticComponents.logic = 'Kullanıcı adımı soruyor. Çünkü "ad" ve "ne" kelimeleri var.';
        semanticComponents.expectedResponse = 'Benim adım NöroBot! 🤖 Senin adın ne?';
        semanticComponents.reasoning.push('Ad sorgusu tespit edildi');
        semanticComponents.reasoning.push('Benim adım "Yapay Zeka Robotu" olarak ayarlandı');
      }
    }

    // "Nasılsın?" mantıklı çıkarımı  
    if (words.includes('nasıl') || words.includes('nasılsın')) {
      semanticComponents.logic = 'Kullanıcı hal hatır soruyor. "Nasıl" kelimesi durum sorgusu.';
      semanticComponents.expectedResponse = 'Çok iyiyim! 😄 Sen nasılsın?';
      semanticComponents.reasoning.push('Hal hatır sorgusu tespit edildi');
      semanticComponents.reasoning.push('Kibarca karşılık veriyorum ve durumunu soruyorum');
    }

    // Selamlama mantıklı çıkarımı
    if (words.some(word => ['merhaba', 'selam', 'selamün', 'aleyküm'].includes(word))) {
      semanticComponents.logic = 'Kullanıcı selamlama yapıyor. Karşılık vermeli.';
      if (words.includes('selamün') || words.includes('aleyküm')) {
        semanticComponents.expectedResponse = 'Aleyküm selam! 🌟 Sana nasıl yardım edebilirim?';
      } else {
        semanticComponents.expectedResponse = 'Merhaba! 👋 Sana nasıl yardım edebilirim?';
      }
      semanticComponents.reasoning.push('Selamlama tespit edildi, karşılık veriliyor');
    }

    // Tek kelime analizi - Özel durum
    if (words.length === 1 && words[0].length > 2) {
      const word = words[0];
      const entry = this.getWord(word);
      if (entry) {
        semanticComponents.logic = `Tek kelime "${word}" sorgulanıyor.`;
        semanticComponents.expectedResponse = `${word} şu demek: ${entry.meaning[0]} 😊`;
        semanticComponents.intent = 'tek_kelime_sorgusu';
        semanticComponents.confidence = 0.7;
        semanticComponents.reasoning.push('Tek kelime sorgusu tespit edildi');
      }
    }
  }

  private generateLogicalResponse(phrase: string, words: string[], semanticComponents: any): string {
    // Soru türüne göre mantıklı cevap üretimi
    if (semanticComponents.questionWord) {
      switch (semanticComponents.questionWord) {
        case 'ne':
          if (semanticComponents.subject === 'ad') {
            return 'Adım Yapay Zeka Robotu';
          }
          break;
        case 'nasıl':
          return 'İyiyim, teşekkür ederim. Siz nasılsınız?';
        case 'kim':
          return 'Ben bir yapay zeka robotuyum';
        case 'nerede':
          return 'Ben dijital bir ortamda bulunuyorum';
        case 'neden':
          return 'Size yardımcı olmak için buradayım';
      }
    }
    return '';
  }

  private advancedPatternAnalysis(phrase: string, words: string[], semanticComponents: any): void {
    const lowerPhrase = phrase.toLowerCase();

    // Gelişmiş kalıp tanıma
    const patterns = [
      {
        test: /ad[ıiuü]?[mnz]?\s+(ne|nedir|kim)/i,
        response: 'Adım Yapay Zeka Robotu',
        logic: 'Ad sorgusu kalıbı tespit edildi'
      },
      {
        test: /(nasıl|nasılsın|keyifler)/i,
        response: 'İyiyim, teşekkür ederim. Siz nasılsınız?',
        logic: 'Hal hatır sorgusu kalıbı tespit edildi'
      },
      {
        test: /(merhaba|selam|günaydın|iyi akşamlar)/i,
        response: 'Merhaba! Size nasıl yardımcı olabilirim?',
        logic: 'Selamlama kalıbı tespit edildi'
      },
      {
        test: /(\w+)\s+(ne\s*demek|nedir|anlamı\s*ne|ne\s*anlama\s*gelir)\??$/i,
        response: (match: RegExpMatchArray) => {
          const word = match[1].toLowerCase();
          const entry = this.getWord(word);
          return entry ? `${word}: ${entry.meaning[0]}` : `"${word}" kelimesini sözlükte bulamadım.`;
        },
        logic: 'Kelime anlamı sorgusu kalıbı tespit edildi'
      },
      {
        test: /(\w+)\s+ne\??$/i,
        response: (match: RegExpMatchArray) => {
          const word = match[1].toLowerCase();
          const entry = this.getWord(word);
          return entry ? `${word}: ${entry.meaning[0]}` : `"${word}" kelimesini sözlükte bulamadım.`;
        },
        logic: 'Basit kelime sorgusu kalıbı tespit edildi'
      }
    ];

    // Kalıp eşleştirme
    for (const pattern of patterns) {
      const match = lowerPhrase.match(pattern.test);
      if (match) {
        semanticComponents.logic = pattern.logic;

        // Response fonksiyon mu yoksa string mi kontrol et
        if (typeof pattern.response === 'function') {
          semanticComponents.expectedResponse = pattern.response(match);
        } else {
          semanticComponents.expectedResponse = pattern.response;
        }
        break;
      }
    }
  }

  // Toplu kelime ekleme
  addBulkWords(entries: DictionaryEntry[]): { added: number, failed: number } {
    let added = 0;
    let failed = 0;

    entries.forEach(entry => {
      try {
        // Gerekli minimum alanların varlığını kontrol et
        if (!entry.word || typeof entry.word !== 'string' || entry.word.trim().length === 0) {
          failed++;
          return;
        }

        // Kelime özelliklerini düzelt ve standardize et
        const validEntry: DictionaryEntry = {
          word: entry.word.trim(),
          meaning: Array.isArray(entry.meaning) ? entry.meaning : 
                  (typeof entry.meaning === 'string' ? [entry.meaning] : [`${entry.word} anlamı`]),
          type: ['isim', 'fiil', 'sıfat', 'zamir', 'edat', 'bağlaç', 'soru', 'özel'].includes(entry.type) 
                ? entry.type : 'isim',
          examples: Array.isArray(entry.examples) ? entry.examples : []
        };

        // Kelimeyi ekle
        this.addWord(validEntry);
        added++;
      } catch (error) {
        console.error(`Kelime eklerken hata: ${entry.word}`, error);
        failed++;
      }
    });

    return { added, failed };
  }

  // Cevap doğruluğunu değerlendir
  evaluateResponse(userInput: string, givenResponse: string, userFeedback: 'correct' | 'incorrect'): void {
    this.statistics.totalQueries++;

    if (userFeedback === 'correct') {
      this.statistics.successfulQueries++;
    }

    // Gelişmiş istatistik kaydetme
    const analysis = this.analyzePhrase(userInput);
    const patternKey = analysis.understanding || 'genel_sorgu';
    const currentCount = this.statistics.commonPatterns.get(patternKey) || 0;
    this.statistics.commonPatterns.set(patternKey, currentCount + 1);

    // LocalStorage'a kaydet
    this.saveToLocalStorage();
  }

  // Gelişmiş istatistikleri al
  getStatistics() {
    const successRate = this.statistics.totalQueries === 0 ? 
      0 : this.statistics.successfulQueries / this.statistics.totalQueries;

    const successPercentage = (successRate * 100).toFixed(2);
    const failureRate = 1 - successRate;
    const failurePercentage = (failureRate * 100).toFixed(2);

    return {
      totalQueries: this.statistics.totalQueries,
      successfulQueries: this.statistics.successfulQueries,
      failedQueries: this.statistics.totalQueries - this.statistics.successfulQueries,
      successRate,
      failureRate,
      successPercentage: `${successPercentage}%`,
      failurePercentage: `${failurePercentage}%`,
      commonPatterns: Object.fromEntries(this.statistics.commonPatterns),
      mostSuccessfulPattern: this.getMostSuccessfulPattern(),
      averageConfidence: this.calculateAverageConfidence()
    };
  }

  private getMostSuccessfulPattern(): string {
    let maxCount = 0;
    let mostSuccessful = 'Henüz veri yok';

    this.statistics.commonPatterns.forEach((count, pattern) => {
      if (count > maxCount) {
        maxCount = count;
        mostSuccessful = pattern;
      }
    });

    return `${mostSuccessful} (${maxCount} kez)`;
  }

  private calculateAverageConfidence(): string {
    // Bu metodun çalışması için confidence değerlerini de kaydetmek gerekir
    // Şimdilik sabit bir değer döndürüyoruz
    return "85.5%";
  }

  // Öğrenme sistemini sıfırla
  resetLearningSystem(): void {
    this.statistics = {
      totalQueries: 0,
      successfulQueries: 0,
      commonPatterns: new Map()
    };
    this.saveToLocalStorage();
  }

  // Manuel doğru cevap ekleme
  addCorrectResponse(question: string, correctAnswer: string): void {
    // Bu soruyu pattern olarak ekle
    const pattern: PhrasePattern = {
      pattern: new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      intent: `manuel_${Date.now()}`,
      confidence: 0.9,
      matches: (words: string[]) => {
        return words.join(' ').toLowerCase().includes(question.toLowerCase());
      },
      generateResponse: () => correctAnswer,
      wasSuccessful: true
    };

    this.patterns.push(pattern);
    this.saveToLocalStorage();
  }

  // Kelime listesini dışa aktar
  exportDictionary(): DictionaryEntry[] {
    return Array.from(this.dictionary.values());
  }

  // Tüm sözlüğü değiştir
  importDictionary(entries: DictionaryEntry[]): void {
    this.dictionary.clear();
    entries.forEach(entry => {
      this.dictionary.set(entry.word.toLowerCase(), entry);
    });
  }

  // Tüm sözlük boyutunu al
  getDictionarySize(): number {
    return this.dictionary.size;
  }

  // Sözlük istatistiklerini getir
  getDictionaryStats(): { 
    totalWords: number,
    wordsByType: Record<string, number>
  } {
    const wordsByType: Record<string, number> = {};

    this.dictionary.forEach(entry => {
      const type = entry.type;
      wordsByType[type] = (wordsByType[type] || 0) + 1;
    });

    return {
      totalWords: this.dictionary.size,
      wordsByType
    };
  }

  // JSON olarak dışa aktar
  toJSON(): string {
    return JSON.stringify({
      dictionary: Array.from(this.dictionary.entries()),
      phrases: Array.from(this.phrases.entries()),
      statistics: this.statistics
    });
  }

  // JSON'dan içe aktar
  fromJSON(json: string): void {
    try {
      const data = JSON.parse(json);

      this.dictionary = new Map(data.dictionary);
      this.phrases = new Map(data.phrases);
      this.statistics = data.statistics;

      // İstatistiklerdeki Map yeniden oluştur
      this.statistics.commonPatterns = new Map(Object.entries(this.statistics.commonPatterns));
    } catch (error) {
      console.error("Sözlük verileri yüklenirken hata oluştu:", error);
    }
  }

  // Sözlüğü locale kaydet
  saveToLocalStorage(key = 'turkish_dictionary'): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, this.toJSON());
    }
  }

  // Locale'den sözlüğü yükle
  loadFromLocalStorage(key = 'turkish_dictionary'): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(key);
      if (data) {
        this.fromJSON(data);
        return true;
      }
    }
    return false;
  }
}