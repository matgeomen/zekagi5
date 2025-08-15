import React, { useState } from 'react';
import { X, AlertCircle, Upload, FileText, PlusCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export interface TrainingPair {
  input: string;
  output: string;
}

interface BatchTrainingModalProps {
  isOpen: boolean;
  onSubmit: (pairs: TrainingPair[]) => void;
  onClose: () => void;
  isProcessing?: boolean;
  progress?: number;
}

enum TrainingMode {
  PAIR = 'pair',
  BULK = 'bulk',
  PARAGRAPH = 'paragraph'
}

const BatchTrainingModal: React.FC<BatchTrainingModalProps> = ({
  isOpen,
  onSubmit,
  onClose,
  isProcessing = false,
  progress = 0
}) => {
  const [trainingPairs, setTrainingPairs] = useState<TrainingPair[]>([
    { input: '', output: '' }
  ]);
  const [bulkText, setBulkText] = useState('');
  const [paragraphText, setParagraphText] = useState('');
  const [mode, setMode] = useState<TrainingMode>(TrainingMode.PAIR);
  const [error, setError] = useState('');
  const { isDarkMode } = useTheme();

  const handleAddPair = () => {
    setTrainingPairs([...trainingPairs, { input: '', output: '' }]);
  };

  const handleRemovePair = (index: number) => {
    const newPairs = [...trainingPairs];
    newPairs.splice(index, 1);
    setTrainingPairs(newPairs);
  };

  const handlePairChange = (index: number, field: 'input' | 'output', value: string) => {
    const newPairs = [...trainingPairs];
    newPairs[index][field] = value;
    setTrainingPairs(newPairs);
  };

  const handleSubmit = () => {
    setError('');

    if (mode === TrainingMode.PAIR) {
      // En az bir çiftin her iki alanı da dolu olmalı
      const validPairs = trainingPairs.filter(pair => pair.input.trim() && pair.output.trim());

      if (validPairs.length === 0) {
        setError('En az bir soru-cevap çifti girmelisiniz.');
        return;
      }

      onSubmit(validPairs);
    } 
    else if (mode === TrainingMode.BULK) {
      // Toplu metin formatı: soru=>cevap
      const pairs: TrainingPair[] = [];

      // Satır sonlarını standardize et (Windows ve Unix satır sonları için)
      const normalizedText = bulkText.replace(/\r\n/g, '\n');
      const lines = normalizedText.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Boş satırları atla
        if (!trimmedLine) continue;

        if (trimmedLine.includes('=>')) {
          // => işareti ile ayrılmış bir satır
          try {
            const parts = trimmedLine.split('=>');
            if (parts.length >= 2) {
              const input = parts[0].trim();
              // Birden fazla => işareti varsa, ilkinden sonraki tüm parçaları birleştir
              const output = parts.slice(1).join('=>').trim();

              if (input && output) {
                pairs.push({ input, output });
              }
            }
          } catch (error) {
            console.error('Satır işleme hatası:', error);
          }
        } 
        else if (trimmedLine.startsWith('Giriş:') || trimmedLine.startsWith('Girdi:') || trimmedLine.startsWith('Soru:')) {
          // Eski format için destek devam ediyor (Giriş/Çıkış formatı)
          const inputPart = trimmedLine.replace(/^(Giriş:|Girdi:|Soru:)\s*/, '').trim();

          // Bir sonraki satırı kontrol et
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();

            if (nextLine.startsWith('Çıkış:') || nextLine.startsWith('Çıktı:') || nextLine.startsWith('Cevap:')) {
              const outputPart = nextLine.replace(/^(Çıkış:|Çıktı:|Cevap:)\s*/, '').trim();

              if (inputPart && outputPart) {
                pairs.push({
                  input: inputPart,
                  output: outputPart
                });
              }

              // Çıkış satırını atladık, sonraki satırdan devam et
              i++;
            }
          }
        }
      }

      if (pairs.length === 0) {
        setError('Geçerli bir veri bulunamadı. Her satır için "soru=>cevap" formatında veriler girmelisiniz.');
        return;
      }

      console.log(`✅ ${pairs.length} adet veri çifti hazırlandı - sınır yok!`);

      onSubmit(pairs);
    }
    else if (mode === TrainingMode.PARAGRAPH) {
      // Paragraftan soru-cevap çiftleri çıkar
      if (!paragraphText.trim()) {
        setError('Lütfen bir metin girin.');
        return;
      }

      // Metni cümlelere ayır
      const sentences = paragraphText
        .replace(/([.!?])\s+/g, '$1|')
        .split('|')
        .filter(s => s.trim().length > 0);

      if (sentences.length < 2) {
        setError('Metin en az iki cümle içermelidir.');
        return;
      }

      // Basit soru üretme kuralları
      const pairs: TrainingPair[] = [];

      // Her cümle için birkaç soru oluştur
      for (const sentence of sentences) {
        const trimmed = sentence.trim();

        // Konu-yüklem ayır
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
          // Konuyu bul (ilk 1-2 kelime)
          const subject = parts.slice(0, Math.min(2, Math.floor(parts.length / 3))).join(' ');

          // "ne" sorusu üret
          if (subject) {
            pairs.push({
              input: `${subject} ne?`,
              output: trimmed
            });
          }

          // "ne yapıyor" sorusu üret
          if (parts.length > 3) {
            pairs.push({
              input: `${subject} ne yapıyor?`,
              output: trimmed
            });
          }

          // Kim sorusu (eğer büyük harfle başlayan bir kelime varsa)
          const properNouns = parts.filter(p => p.length > 1 && /^[A-ZĞÜŞİÖÇ]/.test(p));
          if (properNouns.length > 0) {
            pairs.push({
              input: `Kim ${parts.slice(Math.min(3, parts.length - 1)).join(' ')}?`,
              output: properNouns[0]
            });
          }
        }
      }

      // En azından paragrafı ve başlık sorusunu ekle
      pairs.push({
        input: "Bu paragrafta ne anlatılıyor?",
        output: paragraphText
      });

      if (pairs.length === 0) {
        setError('Metinden soru-cevap çiftleri üretilemedi. Lütfen daha karmaşık bir metin girin.');
        return;
      }

      onSubmit(pairs);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Toplu Eğitim</h3>
          {!isProcessing && (
            <button 
              className="p-1 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" 
              aria-label="Kapat"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {isProcessing ? (
          <div className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <h4 className="text-lg font-medium">Eğitim Sürüyor</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Veriler aşamalı olarak işleniyor, lütfen bekleyin...
              </p>
            </div>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-primary-200 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    İlerleme
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold inline-block text-primary-800 dark:text-primary-200">
                    {progress}%
                  </span>
                </div>
              </div>
              
              <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-primary-200 dark:bg-gray-700">
                <div 
                  style={{ width: `${progress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 dark:bg-primary-600 transition-all duration-500 ease-out"
                />
              </div>
              
              {/* Progress aşamaları */}
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                <span className={progress >= 10 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                  Hazırlık {progress >= 10 ? '✓' : ''}
                </span>
                <span className={progress >= 50 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                  İşleme {progress >= 50 ? '✓' : ''}
                </span>
                <span className={progress >= 95 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                  Tamamlanıyor {progress >= 95 ? '✓' : ''}
                </span>
              </div>
            </div>
            
            {/* Animasyonlu loading göstergesi */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 space-y-4">
              <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex space-x-2">
                  <button
                    className={`px-4 py-2 rounded-md ${
                      mode === TrainingMode.PAIR 
                        ? 'btn-gradient text-primary-foreground' 
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    } transition-all duration-200`}
                    onClick={() => setMode(TrainingMode.PAIR)}
                  >
                    Manuel Giriş
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${
                      mode === TrainingMode.BULK 
                        ? 'btn-gradient text-primary-foreground' 
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    } transition-all duration-200`}
                    onClick={() => setMode(TrainingMode.BULK)}
                  >
                    Toplu Metin
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${
                      mode === TrainingMode.PARAGRAPH 
                        ? 'btn-gradient text-primary-foreground' 
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    } transition-all duration-200`}
                    onClick={() => setMode(TrainingMode.PARAGRAPH)}
                  >
                    Paragraf Analizi
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                </div>
              )}

              {mode === TrainingMode.PAIR && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yapay zekanın öğrenmesi için birden fazla soru-cevap çifti ekleyebilirsiniz.
                  </p>

                  {trainingPairs.map((pair, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">{index + 1}. Soru-Cevap Çifti</h4>
                        {trainingPairs.length > 1 && (
                          <button
                            onClick={() => handleRemovePair(index)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Bu çifti sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Soru / Girdi
                        </label>
                        <input
                          type="text"
                          value={pair.input}
                          onChange={(e) => handlePairChange(index, 'input', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Örn: Türkiye'nin başkenti neresidir?"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Cevap / Çıktı
                        </label>
                        <input
                          type="text"
                          value={pair.output}
                          onChange={(e) => handlePairChange(index, 'output', e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Örn: Türkiye'nin başkenti Ankara'dır."
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddPair}
                    className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Yeni Soru-Cevap Çifti Ekle
                  </button>
                </div>
              )}

              {mode === TrainingMode.BULK && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Aşağıdaki formatta toplu metin girebilirsiniz. Her satır için <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">soru{"=>"}cevap</span> formatını kullanın:
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded p-3 text-sm text-gray-700 dark:text-gray-300">
                    <p className="whitespace-pre-wrap font-mono text-xs">
                      Merhaba nasılsın?{"=>"}İyiyim teşekkürler, size nasıl yardımcı olabilirim?{'\n'}
                      Bugün hava nasıl?{"=>"}Bugün hava güneşli ve sıcak.{'\n'}
                      Türkiye'nin başkenti neresi?{"=>"}Ankara{'\n'}
                      En büyük gezegen hangisidir?{"=>"}Jüpiter{'\n'}
                      Suyun kaynama noktası kaçtır?{"=>"}100 derece Celsius (deniz seviyesinde)
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-300">İpuçları:</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                      <li>Her satırda bir soru-cevap çifti olmalıdır</li>
                      <li>Soru ve cevap {"=>"} işareti ile ayrılmalıdır</li>
                      <li>Birden fazla satır girerek çoklu örnekler verebilirsiniz</li>
                      <li>Boş satırlar otomatik olarak atlanır</li>
                    </ul>
                  </div>

                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={10}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Soru1=>Cevap1&#10;Soru2=>Cevap2&#10;Soru3=>Cevap3"
                  />
                </div>
              )}

              {mode === TrainingMode.PARAGRAPH && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bir metin paragrafı girin. Sistem otomatik olarak bu metinden soru-cevap çiftleri üretecektir.
                  </p>

                  <textarea
                    value={paragraphText}
                    onChange={(e) => setParagraphText(e.target.value)}
                    rows={8}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Örnek: Ahmet Ankara'da yaşıyor. O bir yazılım mühendisi olarak çalışıyor. Hafta sonları kitap okumayı ve müzik dinlemeyi seviyor."
                  />

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium">Nasıl Çalışır?</p>
                    <ul className="list-disc ml-5 mt-1 space-y-1 text-xs">
                      <li>Sistem paragrafı cümlelere ayırır</li>
                      <li>Her cümle için olası sorular üretir</li>
                      <li>Örneğin, "<b>Ahmet Ankara'da yaşıyor</b>" cümlesi için, "<i>Ahmet nerede yaşıyor?</i>" gibi sorular oluşturur</li>
                      <li>Daha karmaşık metin, daha kaliteli soru-cevap çiftleri oluşturur</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded-md border border-border bg-background hover:bg-secondary text-foreground transition-all duration-200"
                onClick={onClose}
              >
                İptal
              </button>

              <button
                className="px-4 py-2 rounded-md btn-gradient text-primary-foreground hover:shadow-lg transition-all duration-200"
                onClick={handleSubmit}
              >
                Eğitimi Başlat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BatchTrainingModal;
