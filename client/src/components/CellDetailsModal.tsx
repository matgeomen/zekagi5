import React from 'react';
import { X, Info, ArrowRight, Activity, BarChart2, Clock } from 'lucide-react';
import { NetworkNode, Relation } from '@/lib/NeuralNetworkUtils';

interface CellDetailsModalProps {
  isOpen: boolean;
  node: NetworkNode | null;
  relations: Relation[];
  bidirectionalRelations: Relation[];
  onClose: () => void;
}

const CellDetailsModal: React.FC<CellDetailsModalProps> = ({
  isOpen,
  node,
  relations,
  bidirectionalRelations,
  onClose
}) => {
  if (!isOpen || !node) return null;
  
  // İnsan tarafından okunabilir tarih formatı
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Sınıflandırma oranını görsel barla gösterme
  const ProgressBar = ({ value, max, color }: { value: number, max: number, color: string }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    return (
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };
  
  // İlişkiler
  const nodeRelations = relations.filter(rel => 
    rel.userWord === node.word || rel.systemWord === node.word
  );
  
  // Çift yönlü ilişkiler
  const nodeBiRelations = bidirectionalRelations.filter(rel => 
    rel.userWord === node.word || rel.systemWord === node.word
  );

  const allRelations = [...nodeRelations, ...nodeBiRelations];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold">Düğüm Detayları</h3>
          </div>
          <button 
            className="p-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" 
            aria-label="Kapat"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Kelime</h4>
                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{node.word}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Kimlik</h4>
                <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded">{node.id}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Aktivasyon Seviyesi</h4>
                <ProgressBar value={node.activation} max={1} color="bg-blue-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(node.activation * 100)}%</p>
              </div>
              
              {node.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Kategori</h4>
                  <div className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full px-2 py-0.5 text-xs">
                    {node.category}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Kullanım Sayısı</h4>
                <p>{node.count} kez</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Derinlik</h4>
                <p>{node.depth}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Bağımlılık</h4>
                <ProgressBar value={node.dependency} max={100} color="bg-green-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{node.dependency}%</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">İlişki</h4>
                <ProgressBar value={node.association} max={100} color="bg-orange-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{node.association}%</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Sıklık</h4>
                <ProgressBar value={node.frequency} max={100} color="bg-purple-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{node.frequency}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Geri Bildirim</h4>
                <ProgressBar 
                  value={node.feedback + 100} 
                  max={200} 
                  color={node.feedback >= 0 ? "bg-emerald-500" : "bg-red-500"} 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{node.feedback}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Önem</h4>
                <ProgressBar value={node.importance || 0} max={100} color="bg-yellow-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{node.importance || 0}%</p>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Oluşturulma: {formatDate(node.createdAt)}
                </div>
                <div className="flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  Son Aktivasyon: {formatDate(node.lastActivation)}
                </div>
              </div>
            </div>
          </div>
          
          {node.parentWords && node.parentWords.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Üst Kelimeler</h4>
              <div className="flex flex-wrap gap-1">
                {node.parentWords.map((word, index) => (
                  <div key={index} className="inline-block bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs">
                    {word}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {node.connections && node.connections.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Bağlantılar ({node.connections.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {node.connections.slice(0, 9).map((conn, index) => {
                  const strength = node.connectionStrengths?.[conn] || 0.5;
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                      <span className="text-xs truncate">{conn.split('-')[0]}</span>
                      <span className="text-xs text-primary-500 dark:text-primary-400">{Math.round(strength * 100)}%</span>
                    </div>
                  );
                })}
                {node.connections.length > 9 && (
                  <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">+ {node.connections.length - 9} daha</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {allRelations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">İlişkiler ({allRelations.length})</h4>
              <div className="space-y-2">
                {allRelations.slice(0, 5).map((relation, index) => {
                  const isSource = relation.userWord === node.word;
                  const otherWord = isSource ? relation.systemWord : relation.userWord;
                  
                  return (
                    <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center text-sm">
                          <span>{isSource ? node.word : otherWord}</span>
                          <ArrowRight className="h-3 w-3 mx-1" />
                          <span>{isSource ? otherWord : node.word}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {relation.bidirectional ? 'İki Yönlü' : 'Tek Yönlü'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Güç:</span> {relation.strength}%
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">İlişki:</span> {relation.association}%
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Bağımlılık:</span> {relation.dependency}%
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Öğrenme:</span> {relation.learningCount} kez
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {allRelations.length > 5 && (
                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
                    + {allRelations.length - 5} ilişki daha
                  </div>
                )}
              </div>
            </div>
          )}
          
          {node.activationHistory && node.activationHistory.length > 1 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Aktivasyon Geçmişi</h4>
              <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-md p-2 flex items-end">
                {node.activationHistory.map((value, index) => {
                  const height = `${Math.max(5, value * 100)}%`;
                  return (
                    <div 
                      key={index}
                      className="flex-1 mx-0.5 bg-primary-500 dark:bg-primary-600 rounded-t"
                      style={{ height }}
                      title={`${Math.round(value * 100)}%`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>En eski</span>
                <span>En yeni</span>
              </div>
            </div>
          )}
          
          {node.semanticVector && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <BarChart2 className="h-4 w-4 mr-1" />
                Anlamsal Vektör
              </h4>
              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                [{node.semanticVector.map(v => v.toFixed(2)).join(', ')}]
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            className="px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-white transition-colors"
            onClick={onClose}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default CellDetailsModal;
