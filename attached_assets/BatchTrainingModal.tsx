import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, CheckCircle2, BookText, Layers } from 'lucide-react';

export interface TrainingPair {
  input: string;
  output: string;
}

interface BatchTrainingModalProps {
  isDarkMode: boolean;
  onSubmit: (pairs: TrainingPair[]) => void;
  onClose: () => void;
}

enum TrainingMode {
  PAIR = 'pair',
  BULK = 'bulk',
  PARAGRAPH = 'paragraph'
}

const SAMPLE_PAIRS: TrainingPair[] = [
  {
    input: "Merhaba, nasılsın?",
    output: "Merhaba! Ben bir yapay zeka asistanıyım ve çok iyiyim. Size nasıl yardımcı olabilirim?"
  },
  {
    input: "Bugün hava nasıl?",
    output: "Üzgünüm, anlık hava durumunu kontrol edemiyorum. Ancak size farklı konularda yardımcı olabilirim."
  },
  {
    input: "Yapay zeka nedir?",
    output: "Yapay zeka (AI), insan zekasını taklit edebilen ve öğrenebilen, görevleri gerçekleştirebilen bilgisayar sistemlerini ifade eder. Sinir ağları, makine öğrenmesi ve derin öğrenme gibi teknolojiler yapay zekanın önemli alt alanlarıdır."
  },
  {
    input: "Sinir ağları nasıl çalışır?",
    output: "Sinir ağları, insan beynindeki nöronların yapısından ilham alır. Girdi katmanı, gizli katmanlar ve çıktı katmanından oluşur. Her katmandaki nöronlar ağırlıklar aracılığıyla birbirine bağlanır ve aktivasyon fonksiyonlarıyla bilgiyi işler. Eğitim süreci, ağırlıkların veri üzerinde optimize edilmesiyle gerçekleşir."
  },
  {
    input: "Hafıza sistemleri ne işe yarar?",
    output: "Hafıza sistemleri, yapay zeka sistemlerinin geçmiş bilgileri depolamasını ve gerektiğinde bu bilgilere erişmesini sağlar. Kısa vadeli ve uzun vadeli hafıza mekanizmaları, AI'nın tutarlı yanıtlar vermesine ve zaman içinde öğrenmesine olanak tanır."
  }
];

const SAMPLE_BULK = `Merhaba nasılsın? => İyiyim teşekkürler, size nasıl yardımcı olabilirim?
Yapay zeka nedir? => Yapay zeka, insan zekasını taklit eden ve öğrenebilen bilgisayar sistemleridir.
Türkiye'nin başkenti neresi? => Türkiye'nin başkenti Ankara'dır.
En büyük gezegen hangisi? => Güneş sistemindeki en büyük gezegen Jüpiter'dir.
Sinir ağları nasıl öğrenir? => Sinir ağları, veri üzerinde tekrarlı eğitim yaparak, ağırlıkları optimize ederek öğrenir.`;

const SAMPLE_PARAGRAPH = `Yapay zeka, bilgisayarların insan benzeri düşünme, karar verme ve öğrenme yeteneklerini simüle etmeyi amaçlayan bir bilgisayar bilimi dalıdır. Yapay zekanın temel hedefi, bilgisayarların karmaşık sorunları çözmek, tahminlerde bulunmak ve insan müdahalesi olmadan kararlar vermek için veri ve deneyimlerden öğrenmesini sağlamaktır. Yapay zekanın iki ana türü vardır: dar yapay zeka ve genel yapay zeka. Dar yapay zeka, belirli görevleri yerine getirmek üzere tasarlanmış sistemleri ifade eder. Satranç oynama, görüntü tanıma veya konuşma çevirisi gibi alanlarda uzmanlaşabilirler. Genel yapay zeka ise, insanlar gibi herhangi bir entelektüel görevi anlama ve öğrenme yeteneğine sahip olacak sistemleri ifade eder.`;

const BatchTrainingModal: React.FC<BatchTrainingModalProps> = ({
  isDarkMode,
  onSubmit,
  onClose
}) => {
  const [trainingMode, setTrainingMode] = useState<TrainingMode>(TrainingMode.PAIR);
  const [pairs, setPairs] = useState<TrainingPair[]>([
    { input: "", output: "" },
    { input: "", output: "" }
  ]);
  const [bulkInput, setBulkInput] = useState<string>("");
  const [paragraphInput, setParagraphInput] = useState<string>("");
  const [error, setError] = useState<string>('');
  const [showSamples, setShowSamples] = useState<boolean>(false);

  const handleAddPair = () => {
    setPairs([...pairs, { input: "", output: "" }]);
  };

  const handleRemovePair = (index: number) => {
    if (pairs.length <= 1) {
      setError('En az bir eğitim çifti gereklidir.');
      return;
    }
    
    const newPairs = [...pairs];
    newPairs.splice(index, 1);
    setPairs(newPairs);
  };

  const handlePairChange = (index: number, field: 'input' | 'output', value: string) => {
    const newPairs = [...pairs];
    newPairs[index][field] = value;
    setPairs(newPairs);
    
    // Giriş yapılınca hata mesajını temizle
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let validPairs: TrainingPair[] = [];
    
    if (trainingMode === TrainingMode.PAIR) {
      validPairs = pairs.filter(pair => pair.input.trim() && pair.output.trim());
      
      if (validPairs.length === 0) {
        setError('Lütfen en az bir geçerli eğitim çifti girin.');
        return;
      }
    }
    else if (trainingMode === TrainingMode.BULK) {
      if (!bulkInput.trim()) {
        setError('Lütfen toplu eğitim verisini girin.');
        return;
      }
      
      // Satır satır soru=>cevap formatında işle
      validPairs = bulkInput.split('\n')
        .map(line => {
          const parts = line.split('=>');
          if (parts.length === 2) {
            return {
              input: parts[0].trim(),
              output: parts[1].trim()
            };
          }
          return null;
        })
        .filter(pair => pair !== null && pair.input && pair.output) as TrainingPair[];
      
      if (validPairs.length === 0) {
        setError('Geçerli soru=>cevap çifti bulunamadı. Her satırın "soru => cevap" formatında olduğundan emin olun.');
        return;
      }
    }
    else if (trainingMode === TrainingMode.PARAGRAPH) {
      if (!paragraphInput.trim()) {
        setError('Lütfen eğitim için metin girin.');
        return;
      }
      
      // Paragraf öğrenme: Metin doğrudan analiz edilir,
      // ancak arayüz tutarlılığı için bir çift oluşturuyoruz
      validPairs = [{
        input: 'paragraph_learning',
        output: paragraphInput
      }];
    }
    
    // Eğitim moduna göre uygun veriyi gönder
    onSubmit(validPairs);
  };

  const handleUseSamplePairs = () => {
    setPairs(SAMPLE_PAIRS);
    setShowSamples(false);
  };
  
  const handleUseSampleBulk = () => {
    setBulkInput(SAMPLE_BULK);
    setShowSamples(false);
  };
  
  const handleUseSampleParagraph = () => {
    setParagraphInput(SAMPLE_PARAGRAPH);
    setShowSamples(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
      <div 
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg ${
          isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
        }`}
      >
        <div 
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h3 className="text-lg font-semibold">Toplu Eğitim Modelleyicisi</h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
            }`}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`p-4 ${isDarkMode ? 'bg-gray-750 border-b border-gray-700' : 'bg-gray-50 border-b border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => setTrainingMode(TrainingMode.PAIR)}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                trainingMode === TrainingMode.PAIR
                  ? 'bg-blue-500 text-white shadow-md'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Layers size={16} className="mr-1 sm:mr-2 flex-shrink-0" />
              <span>Soru-Cevap</span>
            </button>
            
            <button
              type="button"
              onClick={() => setTrainingMode(TrainingMode.BULK)}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                trainingMode === TrainingMode.BULK
                  ? 'bg-blue-500 text-white shadow-md'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText size={16} className="mr-1 sm:mr-2 flex-shrink-0" />
              <span>Toplu Giriş</span>
            </button>
            
            <button
              type="button"
              onClick={() => setTrainingMode(TrainingMode.PARAGRAPH)}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                trainingMode === TrainingMode.PARAGRAPH
                  ? 'bg-blue-500 text-white shadow-md'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookText size={16} className="mr-1 sm:mr-2 flex-shrink-0" />
              <span>Kendi Kendine</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Mod açıklamaları */}
            {trainingMode === TrainingMode.PAIR && (
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Yapay zeka modelini tekil soru-cevap çiftleriyle eğitin. Her çift, bir kullanıcı girdisi ve 
                modelin vermeyi öğreneceği yanıttan oluşur.
              </p>
            )}
            
            {trainingMode === TrainingMode.BULK && (
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Çoklu soru-cevap çiftlerini tek seferde girin. Her satır "soru {'=>'} cevap" formatında olmalıdır.
                Sistem her satırı ayrı bir eğitim çifti olarak işleyecek.
              </p>
            )}
            
            {trainingMode === TrainingMode.PARAGRAPH && (
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Uzun bir metin veya paragraf girin. Sistem, kelimeler arasındaki ilişkileri otomatik olarak
                analiz edecek ve bilgi tabanını genişletecek. Bu mod, model için kendi kendine öğrenme sağlar.
              </p>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* Örnekler ve Ekle Butonu */}
            <div className="mb-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowSamples(!showSamples)}
                className={`text-sm flex items-center ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <FileText size={16} className="mr-1" />
                <span>Örnek{trainingMode === TrainingMode.PAIR ? ' çiftleri' : ''} {showSamples ? 'gizle' : 'göster'}</span>
              </button>
              
              {trainingMode === TrainingMode.PAIR && (
                <button
                  type="button"
                  onClick={handleAddPair}
                  className={`text-sm flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  <Plus size={16} className="mr-1.5" />
                  <span>Yeni Çift Ekle</span>
                </button>
              )}
            </div>
            
            {/* Örnekler Bölümü */}
            {showSamples && (
              <div className={`mb-4 p-4 rounded-lg border ${
                isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Örnek {trainingMode === TrainingMode.PAIR ? 'Eğitim Çiftleri' : 
                           trainingMode === TrainingMode.BULK ? 'Toplu Veri' : 'Paragraf'}
                  </h4>
                  <button
                    type="button"
                    onClick={
                      trainingMode === TrainingMode.PAIR ? handleUseSamplePairs : 
                      trainingMode === TrainingMode.BULK ? handleUseSampleBulk : 
                      handleUseSampleParagraph
                    }
                    className={`text-xs flex items-center px-2 py-1 rounded transition-colors ${
                      isDarkMode
                        ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <CheckCircle2 size={12} className="mr-1" />
                    <span>Örneği Kullan</span>
                  </button>
                </div>
                
                {trainingMode === TrainingMode.PAIR && (
                  <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
                    {SAMPLE_PAIRS.map((pair, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <div className={`mb-1 font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          Girdi: {pair.input}
                        </div>
                        <div className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          Çıktı: {pair.output.length > 60 ? `${pair.output.substring(0, 60)}...` : pair.output}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {trainingMode === TrainingMode.BULK && (
                  <div className={`p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto ${
                    isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {SAMPLE_BULK}
                  </div>
                )}
                
                {trainingMode === TrainingMode.PARAGRAPH && (
                  <div className={`p-2 rounded text-xs max-h-40 overflow-y-auto ${
                    isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {SAMPLE_PARAGRAPH}
                  </div>
                )}
              </div>
            )}
            
            {/* Eğitim Modu Formları */}
            {trainingMode === TrainingMode.PAIR && (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {pairs.map((pair, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Çift #{index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemovePair(index)}
                        className={`p-1 rounded transition-colors ${
                          isDarkMode
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                            : 'text-gray-500 hover:text-red-500 hover:bg-gray-100'
                        }`}
                        aria-label="Çifti sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label 
                          htmlFor={`input-${index}`} 
                          className={`block mb-1 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Kullanıcı Girdisi
                        </label>
                        <input
                          id={`input-${index}`}
                          value={pair.input}
                          onChange={(e) => handlePairChange(index, 'input', e.target.value)}
                          placeholder="Örn: 'Merhaba, nasılsın?'"
                          className={`w-full p-2 rounded-lg text-sm border ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                          } focus:outline-none focus:ring-2 ${
                            isDarkMode ? 'focus:ring-blue-500/50' : 'focus:ring-blue-500/70'
                          } focus:border-blue-500`}
                        />
                      </div>
                      
                      <div>
                        <label 
                          htmlFor={`output-${index}`} 
                          className={`block mb-1 text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Beklenen Yanıt
                        </label>
                        <textarea
                          id={`output-${index}`}
                          value={pair.output}
                          onChange={(e) => handlePairChange(index, 'output', e.target.value)}
                          placeholder="Örn: 'Merhaba! Ben bir yapay zeka asistanıyım. Size nasıl yardımcı olabilirim?'"
                          rows={3}
                          className={`w-full p-2 rounded-lg text-sm border ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                          } focus:outline-none focus:ring-2 ${
                            isDarkMode ? 'focus:ring-blue-500/50' : 'focus:ring-blue-500/70'
                          } focus:border-blue-500 resize-none`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {trainingMode === TrainingMode.BULK && (
              <div className="mb-4">
                <label 
                  htmlFor="bulk-input" 
                  className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Toplu Eğitim Verisi (Her satıra bir soru {'=>'} cevap çifti)
                </label>
                <textarea
                  id="bulk-input"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Örn: Selam nasılsın? => İyiyim, teşekkürler.\nYapay zeka nedir? => İnsan zekasını taklit eden bilgisayar sistemleridir."
                  rows={12}
                  className={`w-full p-3 rounded-lg text-sm border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 ${
                    isDarkMode ? 'focus:ring-blue-500/50' : 'focus:ring-blue-500/70'
                  } focus:border-blue-500`}
                />
                <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Her satır "soru {'=>'} cevap" formatında olmalıdır. Boş satırlar atlanacaktır.
                </p>
              </div>
            )}
            
            {trainingMode === TrainingMode.PARAGRAPH && (
              <div className="mb-4">
                <label 
                  htmlFor="paragraph-input" 
                  className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Kendi Kendine Eğitim için Metin Girin
                </label>
                <textarea
                  id="paragraph-input"
                  value={paragraphInput}
                  onChange={(e) => setParagraphInput(e.target.value)}
                  placeholder="Buraya öğrenmesini istediğiniz metni, paragrafı veya bilgiyi yazın. Sistem bu metindeki kelimeler arasındaki ilişkileri otomatik olarak algılayacak ve gelecekteki yanıtlarında kullanacaktır."
                  rows={12}
                  className={`w-full p-3 rounded-lg text-sm border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 ${
                    isDarkMode ? 'focus:ring-blue-500/50' : 'focus:ring-blue-500/70'
                  } focus:border-blue-500`}
                />
                <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Metin ne kadar uzun ve detaylı olursa, sistem o kadar iyi öğrenecektir. İlgili terimler ve kavramlar arasındaki ilişkiler otomatik olarak analiz edilecektir.
                </p>
              </div>
            )}
          </div>

          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {trainingMode === TrainingMode.PAIR && "Not: Geçerli çiftler modelin eğitilmesi için kullanılacaktır. Her çift için hem girdi hem de çıktı gereklidir."}
              {trainingMode === TrainingMode.BULK && "Not: Girdiğiniz her satır 'soru {'=>'} cevap' formatında olmalıdır. Sistem her satırı ayrı bir eğitim çifti olarak işleyecektir."}
              {trainingMode === TrainingMode.PARAGRAPH && "Not: Sistem bu metni analiz ederek kelimeler arasındaki ilişkileri öğrenecek ve sorularınıza cevap verirken bu ilişkilerden yararlanacaktır."}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                Eğitimi Başlat
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchTrainingModal;
