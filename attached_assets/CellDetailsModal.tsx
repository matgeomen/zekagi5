import React, { useState } from 'react';
import { X, Zap, ArrowRight, ChevronsUp, ChevronsDown } from 'lucide-react';
import { NetworkNode, Relation } from '../lib/NeuralNetworkUtils';

interface CellDetailsModalProps {
  cell: NetworkNode & { layer: number; row: number; col: number; type: 'user' | 'system' };
  relations: Relation[];
  bidirectionalRelations: Relation[];
  isDarkMode: boolean;
  onClose: () => void;
}

const CellDetailsModal: React.FC<CellDetailsModalProps> = ({
  cell,
  relations,
  bidirectionalRelations,
  isDarkMode,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'relations'>('overview');
  
  // Bu hücre ile ilgili ilişkileri filtreleme
  const relevantRelations = relations.filter(
    rel => rel.userWord === cell.word || rel.systemWord === cell.word
  );
  
  const bidirectionalRels = bidirectionalRelations.filter(
    rel => rel.userWord === cell.word || rel.systemWord === cell.word
  );
  
  // İlişkileri skorlarına göre sıralama
  const sortedRelations = [...relevantRelations].sort((a, b) => {
    const scoreA = a.dependency + a.association + a.frequency;
    const scoreB = b.dependency + b.association + b.frequency;
    return scoreB - scoreA;
  });
  
  const sortedBidirectional = [...bidirectionalRels].sort((a, b) => {
    const scoreA = a.dependency + a.association + a.frequency;
    const scoreB = b.dependency + b.association + b.frequency;
    return scoreB - scoreA;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
      <div 
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg ${
          isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
        }`}
      >
        <div 
          className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h3 className="text-lg font-medium">
            <span className={cell.type === 'user' ? 'text-blue-500' : 'text-green-500'}>
              {cell.word}
            </span> 
            <span className="ml-2 text-sm opacity-70">
              ({cell.type === 'user' ? 'Kullanıcı' : 'Sistem'} Kelimesi)
            </span>
          </h3>
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
        
        {/* Tab Bar */}
        <div 
          className={`flex border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? isDarkMode
                  ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400'
                  : 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab('relations')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'relations'
                ? isDarkMode
                  ? 'bg-gray-700 text-green-400 border-b-2 border-green-400'
                  : 'bg-green-50 text-green-600 border-b-2 border-green-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            İlişkiler ({sortedRelations.length + sortedBidirectional.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 max-h-[calc(80vh-150px)] overflow-y-auto">
          {activeTab === 'overview' ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs opacity-70 mb-1">Aktivasyon</div>
                    <div className="flex items-center">
                      <div className="mr-2">
                        <Zap 
                          size={16} 
                          className={`${cell.activation > 0.5 ? 'text-yellow-500' : 'text-gray-400'}`} 
                        />
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${cell.activation * 100}%` }}
                        ></div>
                      </div>
                      <div className="ml-2 text-sm font-medium">
                        {Math.round(cell.activation * 100)}%
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs opacity-70 mb-1">Kullanım Sayısı</div>
                    <div className="text-lg font-medium">
                      {cell.count}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs opacity-70 mb-1">Sıklık Değeri</div>
                    <div className="text-lg font-medium">
                      {cell.frequency}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs opacity-70 mb-1">Geri Bildirim Skoru</div>
                    <div className="flex items-center">
                      {cell.feedback > 0 ? (
                        <ChevronsUp size={16} className="text-green-500 mr-1" />
                      ) : cell.feedback < 0 ? (
                        <ChevronsDown size={16} className="text-red-500 mr-1" />
                      ) : null}
                      <span className="text-lg font-medium">
                        {cell.feedback > 0 ? `+${cell.feedback}` : cell.feedback}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Konum Bilgileri</h4>
                <div className={`p-3 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="opacity-70">Katman:</span> {cell.layer + 1}
                    </div>
                    <div>
                      <span className="opacity-70">Satır:</span> {cell.row + 1}
                    </div>
                    <div>
                      <span className="opacity-70">Sütun:</span> {cell.col + 1}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Bağlantılar</h4>
                {cell.connections.length > 0 ? (
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex flex-wrap gap-2">
                      {cell.connections.map((word, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-1 rounded-md text-xs ${
                            isDarkMode 
                              ? 'bg-gray-600 text-gray-200' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`p-3 rounded-lg text-sm italic ${
                    isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}>
                    Hiç bağlantı yok
                  </div>
                )}
              </div>
              
              {cell.parentWords && cell.parentWords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Üst Kelimeler</h4>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex flex-wrap gap-2">
                      {cell.parentWords.map((word, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-1 rounded-md text-xs ${
                            isDarkMode 
                              ? 'bg-blue-900/40 text-blue-300' 
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {sortedRelations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tek Yönlü İlişkiler</h4>
                  <div className="space-y-2">
                    {sortedRelations.map((relation, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {relation.userWord}
                          </div>
                          <ArrowRight size={14} className="mx-2 opacity-70" />
                          <div className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {relation.systemWord}
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="opacity-70">Bağımlılık:</span> {relation.dependency}
                          </div>
                          <div>
                            <span className="opacity-70">İlişki:</span> {relation.association}
                          </div>
                          <div>
                            <span className="opacity-70">Sıklık:</span> {relation.frequency}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {sortedBidirectional.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Çift Yönlü İlişkiler</h4>
                  <div className="space-y-2">
                    {sortedBidirectional.map((relation, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <div 
                            className={`font-medium ${
                              relation.isReversed
                                ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}
                          >
                            {relation.userWord}
                          </div>
                          <div className="mx-2 flex items-center justify-center">
                            <ArrowRight 
                              size={14} 
                              className={`${relation.isReversed ? 'rotate-180' : ''} opacity-70`} 
                            />
                          </div>
                          <div 
                            className={`font-medium ${
                              relation.isReversed
                                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                : isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}
                          >
                            {relation.systemWord}
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="opacity-70">Bağımlılık:</span> {relation.dependency}
                          </div>
                          <div>
                            <span className="opacity-70">İlişki:</span> {relation.association}
                          </div>
                          <div>
                            <span className="opacity-70">Sıklık:</span> {relation.frequency}
                          </div>
                        </div>
                        
                        {relation.ai_generated && (
                          <div className="mt-1 text-xs">
                            <span 
                              className={`px-1.5 py-0.5 rounded ${
                                isDarkMode 
                                  ? 'bg-purple-900/40 text-purple-300' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              Yapay Zeka Tarafından Oluşturuldu
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {sortedRelations.length === 0 && sortedBidirectional.length === 0 && (
                <div className={`p-4 rounded-lg text-center italic ${
                  isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  Bu kelime için hiç ilişki bulunamadı.
                </div>
              )}
            </div>
          )}
        </div>
        
        <div 
          className={`p-4 border-t flex justify-end ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default CellDetailsModal;
