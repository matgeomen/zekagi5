import { useState, useEffect } from 'react';
import { TurkishDictionary } from '../lib/TurkishDictionary';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { AlertCircle, Info, Plus, Save, Trash2, Upload, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useTheme } from '../contexts/ThemeContext';

// Add this component to App.tsx to use it
export function TurkishDictionaryPanel() {
  const [dictionary] = useState(() => new TurkishDictionary());
  const [words, setWords] = useState<Array<any>>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [newWord, setNewWord] = useState({
    word: '',
    meaning: '',
    type: 'isim',
    examples: ''
  });
  const [bulkImport, setBulkImport] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('words');

  // Verileri yükle
  useEffect(() => {
    loadDictionary();
  }, []);

  const loadDictionary = () => {
    // Locale'den sözlüğü yükle
    const loaded = dictionary.loadFromLocalStorage();

    // Kelimeleri ve istatistikleri yükle
    const allWords = dictionary.exportDictionary();
    setWords(allWords);

    // İstatistikleri güncelle
    const stats = dictionary.getDictionaryStats();
    const semanticStats = dictionary.getStatistics();
    setStats({ ...stats, ...semanticStats });
  };

  const handleSaveDictionary = () => {
    dictionary.saveToLocalStorage();
    alert('Sözlük başarıyla kaydedildi!');
  };

  const handleAddWord = () => {
    try {
      const entry = {
        word: newWord.word,
        meaning: [newWord.meaning],
        type: newWord.type as any,
        examples: newWord.examples ? newWord.examples.split('\n') : []
      };

      dictionary.addWord(entry);
      setNewWord({
        word: '',
        meaning: '',
        type: 'isim',
        examples: ''
      });
      setIsAddDialogOpen(false);

      // Yeni kelime listesini güncelle
      const allWords = dictionary.exportDictionary();
      setWords(allWords);

      // İstatistikleri güncelle
      const stats = dictionary.getDictionaryStats();
      setStats(stats);
    } catch (error) {
      alert('Kelime eklenirken bir hata oluştu: ' + error);
    }
  };

  const handleUpdateWord = () => {
    if (!selectedWord) return;

    try {
      const entry = {
        word: selectedWord.word,
        meaning: selectedWord.meaning,
        type: selectedWord.type,
        examples: typeof selectedWord.examples === 'string' 
          ? selectedWord.examples.split('\n') 
          : selectedWord.examples
      };

      dictionary.updateWord(selectedWord.word, entry);
      setIsEditDialogOpen(false);

      // Kelime listesini güncelle
      const allWords = dictionary.exportDictionary();
      setWords(allWords);
    } catch (error) {
      alert('Kelime güncellenirken bir hata oluştu: ' + error);
    }
  };

  const handleDeleteWord = () => {
    if (!selectedWord) return;

    try {
      dictionary.removeWord(selectedWord.word);
      setSelectedWord(null);
      setIsDeleteDialogOpen(false);

      // Kelime listesini güncelle
      const allWords = dictionary.exportDictionary();
      setWords(allWords);

      // İstatistikleri güncelle
      const stats = dictionary.getDictionaryStats();
      setStats(stats);
    } catch (error) {
      alert('Kelime silinirken bir hata oluştu: ' + error);
    }
  };

  const handleBulkImport = () => {
    try {
      // JSON formatında toplu veri ekleme
      const trimmedInput = bulkImport.trim();
      let entries;

      try {
        entries = JSON.parse(trimmedInput);
      } catch (parseError) {
        // Basit metin formatında girdi kontrolü
        if (trimmedInput.includes('\n')) {
          // Her satır bir kelime olarak değerlendir
          const lines = trimmedInput.split('\n').filter(line => line.trim().length > 0);
          entries = lines.map(line => {
            const parts = line.split(':');
            const word = parts[0].trim();
            const meaning = parts.length > 1 ? parts[1].trim() : `${word} anlamı`;
            return {
              word,
              meaning: [meaning],
              type: 'isim' // Varsayılan tür
            };
          });
        } else {
          throw parseError;
        }
      }

      if (Array.isArray(entries)) {
        // Eksik alanları olan girişleri düzelt
        const validatedEntries = entries.map(entry => {
          return {
            word: entry.word,
            meaning: Array.isArray(entry.meaning) ? entry.meaning : [entry.meaning || `${entry.word} anlamı`],
            type: entry.type || 'isim',
            examples: entry.examples || []
          };
        });

        const result = dictionary.addBulkWords(validatedEntries);
        alert(`${result.added} kelime eklendi, ${result.failed} kelime eklenemedi.`);

        // Kelime listesini güncelle
        const allWords = dictionary.exportDictionary();
        setWords(allWords);

        // İstatistikleri güncelle
        const stats = dictionary.getDictionaryStats();
        setStats(stats);

        // Sözlüğü otomatik kaydet
        dictionary.saveToLocalStorage();

        setBulkImport('');
        setIsBulkImportDialogOpen(false);
      } else {
        alert('Geçersiz veri formatı. JSON dizisi veya satır bazlı metin bekleniyor.');
      }
    } catch (error) {
      alert('Toplu veri eklenirken bir hata oluştu: ' + error);
    }
  };

  const exportDictionary = () => {
    try {
      const dictionaryData = dictionary.exportDictionary();
      const jsonData = JSON.stringify(dictionaryData, null, 2);

      // Dosyayı indirme
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'turkish_dictionary.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Sözlük dışa aktarılırken bir hata oluştu: ' + error);
    }
  };

  const filteredWords = searchQuery 
    ? words.filter(word => 
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.meaning.some((m: string) => m.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : words;

  return (
    <div className="tab-panel-container">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Türkçe Sözlük Yönetimi</CardTitle>
          <CardDescription>
            Kelime ekleyebilir, düzenleyebilir ve silebilirsiniz. Toplu veri yükleme ve dışa aktarma işlemleri de yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="words" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="words" className="flex-1">Kelimeler</TabsTrigger>
              <TabsTrigger value="stats" className="flex-1">İstatistikler</TabsTrigger>
              <TabsTrigger value="export" className="flex-1">Dışa/İçe Aktar</TabsTrigger>
            </TabsList>

            <TabsContent value="words">
              <div className="flex mb-4 gap-2">
                <Input 
                  placeholder="Kelime ara..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  className="flex-1"
                />
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Kelime Ekle
                </Button>
              </div>

              <ScrollArea className="border rounded-md p-2 mb-4" style={{ height: '400px', maxHeight: '60vh' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kelime</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Anlam</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWords.map((word, index) => (
                      <TableRow key={index}>
                        <TableCell>{word.word}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{word.type}</Badge>
                        </TableCell>
                        <TableCell>{Array.isArray(word.meaning) ? word.meaning[0] : word.meaning}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedWord(word);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              Düzenle
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => {
                                setSelectedWord(word);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              Sil
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sözlük İstatistikleri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span>Toplam Kelime Sayısı:</span>
                        <span className="font-bold">{stats.totalWords || 0}</span>
                      </div>
                      <div className="border-t pt-2">
                        <h4 className="font-semibold mb-2">Kelime Türlerine Göre Dağılım:</h4>
                        {stats.wordsByType && Object.entries(stats.wordsByType).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span>{type}:</span>
                            <span>{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Anlamlandırma & Başarı İstatistikleri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      {/* Başarı Skoru */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 p-3 rounded-lg">
                        <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">🎯 Başarı Skoru</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>Başarı Oranı:</span>
                            <span className="font-bold text-green-600">{stats.successPercentage || '0%'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Başarısızlık Oranı:</span>
                            <span className="font-bold text-red-600">{stats.failurePercentage || '0%'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detaylı İstatistikler */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between">
                          <span>Toplam Sorgu:</span>
                          <span className="font-bold">{stats.totalQueries || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Başarılı:</span>
                          <span className="font-bold text-green-600">{stats.successfulQueries || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Başarısız:</span>
                          <span className="font-bold text-red-600">{stats.failedQueries || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ortalama Güven:</span>
                          <span className="font-bold text-blue-600">{stats.averageConfidence || '0%'}</span>
                        </div>
                      </div>

                      {/* En Başarılı Kalıp */}
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span>En Başarılı Kalıp:</span>
                          <span className="font-bold text-purple-600">{stats.mostSuccessfulPattern || 'Henüz veri yok'}</span>
                        </div>
                      </div>

                      {/* Kalıp Detayları */}
                      <div className="border-t pt-2">
                        <h4 className="font-semibold mb-2">Sık Kullanılan Kalıplar:</h4>
                        <div className="max-h-32 overflow-y-auto">
                          {stats.commonPatterns && Object.entries(stats.commonPatterns).map(([pattern, count]) => (
                            <div key={pattern} className="flex justify-between text-sm py-1">
                              <span className="truncate">{pattern}:</span>
                              <Badge variant="outline">{count as number}</Badge>
                            </div>
                          ))}
                          {(!stats.commonPatterns || Object.keys(stats.commonPatterns).length === 0) && (
                            <p className="text-gray-500 text-sm">Henüz kalıp verisi yok</p>
                          )}
                        </div>
                      </div>

                      {/* Öğrenme Sistemi Kontrolü */}
                      <div className="border-t pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            if (confirm('Öğrenme sistemini sıfırlamak istediğinizden emin misiniz?')) {
                              dictionary.resetLearningSystem();
                              loadDictionary();
                            }
                          }}
                          className="w-full"
                        >
                          📊 Öğrenme Sistemini Sıfırla
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="export">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Veri Kaydet/Yükle</CardTitle>
                    <CardDescription>
                      Mevcut sözlük verilerini kaydedin veya toplu veri yükleyin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Dikkat</AlertTitle>
                      <AlertDescription>
                        Toplu veri yükleme işlemi mevcut verileri üzerine yazmaz, ekler. Veri yüklerken doğru formatta olduğundan emin olun.
                      </AlertDescription>
                    </Alert>

                    <div className="flex flex-col gap-4">
                      <Button onClick={handleSaveDictionary} className="flex items-center">
                        <Save className="mr-2 h-4 w-4" /> Sözlüğü Kaydet
                      </Button>

                      <Button onClick={exportDictionary} variant="outline" className="flex items-center">
                        <Download className="mr-2 h-4 w-4" /> JSON Olarak İndir
                      </Button>

                      <Button onClick={() => setIsBulkImportDialogOpen(true)} variant="secondary" className="flex items-center">
                        <Upload className="mr-2 h-4 w-4" /> Toplu Veri Yükle
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Örnek Format</CardTitle>
                    <CardDescription>
                      Toplu veri yüklerken kullanılacak JSON formatı
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-secondary p-4 rounded-md overflow-auto text-xs">
{`[
  {
    "word": "kapı",
    "meaning": ["bir yere girip çıkarken geçilen ve açılıp kapanma düzeni olan duvar veya bölme açıklığı"],
    "type": "isim",
    "examples": ["kapıyı çalmak", "kapıdan geçmek"]
  },
  {
    "word": "pencere",
    "meaning": ["bir yapının duvarlarında bulunan, içeriye ışık ve hava vermek için yapılmış, çerçeveli açıklık"],
    "type": "isim",
    "examples": ["pencereden bakmak", "pencereyi açmak"]
  }
]`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="form-bottom-fixed flex justify-between">
          <div className="text-sm text-muted-foreground">
            Toplam kelime sayısı: {words.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Son güncelleme: {new Date().toLocaleString()}
          </div>
        </CardFooter>
      </Card>

      {/* Kelime Ekleme Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kelime Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="word" className="text-right">Kelime</Label>
              <Input 
                id="word" 
                value={newWord.word} 
                onChange={e => setNewWord({...newWord, word: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Tür</Label>
              <Select 
                value={newWord.type} 
                onValueChange={value => setNewWord({...newWord, type: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Kelime türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isim">İsim</SelectItem>
                  <SelectItem value="fiil">Fiil</SelectItem>
                  <SelectItem value="sıfat">Sıfat</SelectItem>
                  <SelectItem value="zamir">Zamir</SelectItem>
                  <SelectItem value="edat">Edat</SelectItem>
                  <SelectItem value="bağlaç">Bağlaç</SelectItem>
                  <SelectItem value="soru">Soru</SelectItem>
                  <SelectItem value="özel">Özel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meaning" className="text-right">Anlam</Label>
              <Textarea 
                id="meaning"
                value={newWord.meaning}
                onChange={e => setNewWord({...newWord, meaning: e.target.value})}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="examples" className="text-right">Örnekler</Label>
              <Textarea 
                id="examples"
                value={newWord.examples}
                onChange={e => setNewWord({...newWord, examples: e.target.value})}
                className="col-span-3"
                placeholder="Her satıra bir örnek yazın"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>İptal</Button>
            <Button onClick={handleAddWord}>Ekle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kelime Düzenleme Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kelime Düzenle</DialogTitle>
          </DialogHeader>
          {selectedWord && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-word" className="text-right">Kelime</Label>
                <Input 
                  id="edit-word" 
                  value={selectedWord.word} 
                  onChange={e => setSelectedWord({...selectedWord, word: e.target.value})}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">Tür</Label>
                <Select 
                  value={selectedWord.type} 
                  onValueChange={value => setSelectedWord({...selectedWord, type: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Kelime türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isim">İsim</SelectItem>
                    <SelectItem value="fiil">Fiil</SelectItem>
                    <SelectItem value="sıfat">Sıfat</SelectItem>
                    <SelectItem value="zamir">Zamir</SelectItem>
                    <SelectItem value="edat">Edat</SelectItem>
                    <SelectItem value="bağlaç">Bağlaç</SelectItem>
                    <SelectItem value="soru">Soru</SelectItem>
                    <SelectItem value="özel">Özel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-meaning" className="text-right">Anlam</Label>
                <Textarea 
                  id="edit-meaning"
                  value={Array.isArray(selectedWord.meaning) ? selectedWord.meaning[0] : selectedWord.meaning}
                  onChange={e => setSelectedWord({...selectedWord, meaning: [e.target.value]})}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-examples" className="text-right">Örnekler</Label>
                <Textarea 
                  id="edit-examples"
                  value={Array.isArray(selectedWord.examples) ? selectedWord.examples.join('\n') : selectedWord.examples}
                  onChange={e => setSelectedWord({...selectedWord, examples: e.target.value})}
                  className="col-span-3"
                  placeholder="Her satıra bir örnek yazın"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>İptal</Button>
            <Button onClick={handleUpdateWord}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kelime Silme Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kelime Sil</DialogTitle>
          </DialogHeader>
          {selectedWord && (
            <div className="py-4">
              <p className="mb-2">
                <strong>{selectedWord.word}</strong> kelimesini silmek istediğinizden emin misiniz?
              </p>
              <p className="text-muted-foreground text-sm">
                Bu işlem geri alınamaz.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDeleteWord}>Sil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toplu Veri Yükleme Dialog */}
      <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Toplu Veri Yükle</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Tabs defaultValue="json" className="mb-4">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="json">JSON Formatı</TabsTrigger>
                <TabsTrigger value="simple">Basit Metin</TabsTrigger>
              </TabsList>

              <TabsContent value="json">
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>JSON Formatı</AlertTitle>
                  <AlertDescription>
                    JSON formatında kelime listesi ekleyin. Her kelime için "word", "meaning", "type" ve isteğe bağlı olarak "examples" alanları içerebilir.
                  </AlertDescription>
                </Alert>
                <pre className="bg-secondary p-2 rounded-md overflow-auto text-xs mb-4">
{`[
  {
    "word": "örnek",
    "meaning": ["bir şeyin benzeri"],
    "type": "isim",
    "examples": ["örnek vermek", "güzel bir örnek"]
  },
  {
    "word": "kitap",
    "meaning": ["basılı veya dijital eser"],
    "type": "isim"
  }
]`}
                </pre>
              </TabsContent>

              <TabsContent value="simple">
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Basit Metin Formatı</AlertTitle>
                  <AlertDescription>
                    Her satıra bir kelime gelecek şekilde "kelime: açıklama" formatında girebilirsiniz. Açıklama yoksa sadece kelimeyi yazabilirsiniz.
                  </AlertDescription>
                </Alert>
                <pre className="bg-secondary p-2 rounded-md overflow-auto text-xs mb-4">
{`kalem: yazma aracı
defter: not almak için kullanılan kağıt tomarı
bilgisayar: elektronik hesaplama ve veri işleme aracı`}
                </pre>
              </TabsContent>
            </Tabs>

            <Textarea 
              value={bulkImport}
              onChange={e => setBulkImport(e.target.value)}
              className="min-h-[300px] font-mono"
              placeholder='[{"word": "örnek", "meaning": ["bir şeyin benzeri"], "type": "isim"}] veya her satıra "kelime: açıklama" formatında'
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(false)}>İptal</Button>
            <Button onClick={handleBulkImport}>Yükle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
