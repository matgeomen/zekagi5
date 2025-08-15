import React, { useState } from 'react';
import { X, Database, Brain, Clock, Sparkles, Folder, Trash2 } from 'lucide-react';
import { EnhancedMemorySystem, Memory, MemoryCluster } from '@/lib/EnhancedMemorySystem';

interface MemoryPanelProps {
  memorySystem: EnhancedMemorySystem;
  isVisible: boolean;
  onClose: () => void;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memorySystem,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'short' | 'long' | 'clusters' | 'semantic'>('short');

  if (!isVisible) return null;

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

  const renderMemoryItem = (memory: Memory) => (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3 mb-3 border border-gray-100 dark:border-gray-600 relative overflow-hidden">
      <button
        onClick={() => memorySystem.removeMemory(memory.content)}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="text-sm mb-2 pr-8 dark:text-white">{memory.content}</div>
      <div className="flex text-xs text-gray-500 dark:text-gray-300 border-t border-gray-100 dark:border-gray-600 pt-2 mt-1 justify-between">
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {formatDate(memory.timestamp)}
        </div>
        <div className="flex items-center">
          <Sparkles className="h-3 w-3 mr-1" />
          İlgililik: {memory.relevance}%
        </div>
      </div>
    </div>
  );

  const renderClusterItem = (cluster: MemoryCluster) => (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3 mb-3 border border-gray-100 dark:border-gray-600">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium dark:text-white">{cluster.topic}</div>
        <div className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full px-2 py-0.5">
          {cluster.memories.length} anı
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        <div className="flex items-center mb-1">
          <Sparkles className="h-3 w-3 mr-1" />
          Güç: {cluster.strength}%
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Son erişim: {formatDate(cluster.lastAccessed)}
        </div>
      </div>

      {cluster.memories.length > 0 && (
        <div className="text-xs bg-gray-50 dark:bg-gray-800/90 rounded p-2 mt-2 max-h-20 overflow-y-auto">
          <div className="font-medium mb-1 dark:text-white">İçeriği:</div>
          {cluster.memories.slice(0, 2).map((mem, idx) => (
            <div key={idx} className="truncate text-gray-600 dark:text-gray-200">
              {mem.content}
            </div>
          ))}
          {cluster.memories.length > 2 && (
            <div className="text-primary-500 dark:text-primary-400 mt-1">
              + {cluster.memories.length - 2} daha...
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 md:p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold">Hafıza Sistemi</h3>
          </div>
          <button 
            className="p-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" 
            aria-label="Kapat"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 border-b border-gray-200 dark:border-gray-600">
          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
              activeTab === 'short'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
            }`}
            onClick={() => setActiveTab('short')}
          >
            <div className="flex items-center justify-center">
              <Database className="h-4 w-4 mr-1.5" />
              Kısa Süreli Bellek
            </div>
          </button>

          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
              activeTab === 'long'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
            }`}
            onClick={() => setActiveTab('long')}
          >
            <div className="flex items-center justify-center">
              <Brain className="h-4 w-4 mr-1.5" />
              Uzun Süreli Bellek
            </div>
          </button>

          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
              activeTab === 'clusters'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
            }`}
            onClick={() => setActiveTab('clusters')}
          >
            <div className="flex items-center justify-center">
              <Folder className="h-4 w-4 mr-1.5" />
              Bellek Kümeleri
            </div>
          </button>

          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${
              activeTab === 'semantic'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600/50'
            }`}
            onClick={() => setActiveTab('semantic')}
          >
            <div className="flex items-center justify-center">
              <Brain className="h-4 w-4 mr-1.5" />
              Anlamlandırma
            </div>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'short' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Kısa Süreli Anılar ({memorySystem.shortTerm.length})</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Kapasite: ∞ (Sınırsız)
                </div>
              </div>

              <div className="flex flex-col">
                {memorySystem.shortTerm.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Henüz kısa süreli anı oluşturulmadı.</p>
                  </div>
                ) : (
                  <div>
                    {memorySystem.shortTerm.map((memory, index) => (
                      <div key={index}>
                        {renderMemoryItem(memory)}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    if (confirm('Tüm kısa süreli anıları silmek istediğinize emin misiniz?')) {
                      memorySystem.shortTerm = [];
                      memorySystem.saveMemories();
                    }
                  }}
                  className="self-end mt-4 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                  title="Tüm kısa süreli anıları sil"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'long' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Uzun Süreli Anılar ({memorySystem.longTerm.length})</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Kapasite: ∞ (Sınırsız)
                </div>
              </div>

              <div className="flex flex-col">
                {memorySystem.longTerm.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Henüz uzun süreli anı oluşturulmadı.</p>
                  </div>
                ) : (
                  <div>
                    {memorySystem.longTerm.map((memory, index) => (
                      <div key={index}>
                        {renderMemoryItem(memory)}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    if (confirm('Tüm uzun süreli anıları silmek istediğinize emin misiniz?')) {
                      memorySystem.longTerm = [];
                      memorySystem.saveMemories();
                    }
                  }}
                  className="self-end mt-4 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                  title="Tüm uzun süreli anıları sil"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'clusters' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Bellek Kümeleri ({memorySystem.memoryClusters.length})</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Küme limiti: ∞ (Sınırsız)
                </div>
              </div>

              <div className="flex flex-col">
                {memorySystem.memoryClusters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Henüz bellek kümesi oluşturulmadı.</p>
                  </div>
                ) : (
                  <div>
                    {memorySystem.memoryClusters.map((cluster, index) => (
                      <div key={index}>
                        {renderClusterItem(cluster)}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    if (confirm('Tüm bellek kümelerini silmek istediğinize emin misiniz?')) {
                      memorySystem.memoryClusters = [];
                      memorySystem.saveMemories();
                    }
                  }}
                  className="self-end mt-4 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                  title="Tüm bellek kümelerini sil"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'semantic' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Anlamlandırma Analizi</h4>
              </div>

              <div className="flex flex-col">
                {memorySystem.shortTerm.map((memory, index) => (
                  memory.semanticAnalysis && (
                    <div key={index} className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3 mb-3 border border-gray-100 dark:border-gray-600">
                      <div className="text-sm mb-2">
                        <div className="font-medium mb-1">Girdi: {memory.content}</div>
                        <div className="text-xs text-gray-500">
                          {memory.semanticAnalysis.words.map((w, i) => (
                            <div key={i}>
                              <span className="font-medium">{w.word}</span>: {w.meaning} ({w.role})
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs border-t pt-2 mt-2">
                        <div>Amaç: {memory.semanticAnalysis.intent}</div>
                        <div>Güven: {(memory.semanticAnalysis.confidence * 100).toFixed(1)}%</div>
                        <div>Başarı Oranı: {(memory.semanticAnalysis.statistics.successRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                ))}
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

export default MemoryPanel;