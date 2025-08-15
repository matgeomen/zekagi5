import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CorrectAnswerModalProps {
  isDarkMode: boolean;
  onSubmit: (answer: string) => void;
  onClose: () => void;
}

const CorrectAnswerModal: React.FC<CorrectAnswerModalProps> = ({
  isDarkMode,
  onSubmit,
  onClose
}) => {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Lütfen doğru yanıtı girin.');
      return;
    }
    
    onSubmit(answer);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
      <div 
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg ${
          isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
        }`}
      >
        <div 
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h3 className="text-lg font-semibold">Doğru Yanıtı Öğret</h3>
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

        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Yapay zeka sistemi yanlış bir yanıt verdiyse, doğru yanıtı girerek
              sistemin kendini düzeltmesine yardımcı olabilirsiniz.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label 
                htmlFor="correctAnswer" 
                className={`block mb-2 text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Doğru yanıt nedir?
              </label>
              <textarea
                id="correctAnswer"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Örn: İstanbul, Türkiye'nin en kalabalık şehridir ve ekonomik, kültürel ve tarihi açıdan büyük öneme sahiptir..."
                rows={5}
                className={`w-full p-3 rounded-lg text-sm border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                } focus:outline-none focus:ring-2 ${
                  isDarkMode ? 'focus:ring-blue-500/50' : 'focus:ring-blue-500/70'
                } focus:border-blue-500`}
              />
            </div>
          </div>

          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Not: Verdiğiniz doğru yanıt, gelecekte benzer sorulara daha iyi yanıt vermek için 
              yapay zeka modelinin eğitilmesinde kullanılacaktır.
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
                Gönder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CorrectAnswerModal;
