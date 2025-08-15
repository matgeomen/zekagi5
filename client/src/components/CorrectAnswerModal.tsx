
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface CorrectAnswerModalProps {
  isOpen: boolean;
  originalQuestion?: string;
  onSubmit: (answer: string, editedQuestion?: string) => void;
  onClose: () => void;
  incorrectAnswer?: string;
}

const CorrectAnswerModal: React.FC<CorrectAnswerModalProps> = ({
  isOpen,
  originalQuestion,
  onSubmit,
  onClose,
  incorrectAnswer
}) => {
  const [answer, setAnswer] = useState('');
  const [editedQuestion, setEditedQuestion] = useState(originalQuestion || '');
  const { isDarkMode } = useTheme();
  
  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim(), editedQuestion.trim());
      setAnswer('');
      setEditedQuestion('');
    }
  };
  
  // Update edited question when originalQuestion changes
  useEffect(() => {
    setEditedQuestion(originalQuestion || '');
  }, [originalQuestion]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-xl shadow-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold">Manuel Eğitim</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Henüz bu konuda yeterli bilgim yok. Bana doğru cevabı öğretebilirsiniz.
            </p>
          </div>
          <button 
            className="p-1 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" 
            aria-label="Kapat"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {incorrectAnswer && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">❌ Hatalı Cevap:</p>
              <p className="text-sm text-red-700 dark:text-red-400">{incorrectAnswer}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Soru (düzenleyebilirsiniz):
            </label>
            <input
              type="text"
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              className="w-full p-3 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Soruyu buraya yazın..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Doğru Cevap:
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="w-full p-3 rounded-md border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Doğru cevabı buraya yazın..."
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <button
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            İptal
          </button>
          
          <button
            className="px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            Eğit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrectAnswerModal;
