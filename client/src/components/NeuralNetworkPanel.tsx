import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, ZoomIn, ZoomOut, PenTool, Plus, BarChart2, Activity, Trash2, Mic, MicOff, PlusCircle, MinusCircle, Network, Cpu, Brain, BrainCircuit } from 'lucide-react';
import { NetworkNode, Relation } from '@/lib/NeuralNetworkUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import NeuralNetwork3D from './NeuralNetwork3D';

interface NeuralNetworkPanelProps {
  userNetworks: (NetworkNode | null)[][][];
  systemNetworks: (NetworkNode | null)[][][];
  activatedNodes: NetworkNode[];
  relations: Relation[];
  bidirectionalRelations: Relation[];
  onRefresh: () => void;
  onShowCellDetails: (node: NetworkNode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onNewTraining: () => void;
  onBatchTraining: () => void;
  onAddCell?: () => void; // Yeni hücre ekleme
  onRemoveCell?: () => void; // Hücre silme
  onToggleVoice?: () => void; // Sesli iletişimi aç/kapat
  isVoiceEnabled?: boolean; // Sesli iletişim etkin mi?
  totalNodeCount: number;
  activeRelationCount: number;
}

const visualModes = [
  { id: 'normal', name: 'Normal' },
  { id: 'relations', name: 'İlişkisel' },
  { id: '3d', name: '3D' },
  { id: 'detailed', name: 'Detaylı' },
  { id: 'simple', name: 'Basit' }
];

const NeuralNetworkPanel: React.FC<NeuralNetworkPanelProps> = ({
  userNetworks,
  systemNetworks,
  activatedNodes,
  relations,
  bidirectionalRelations,
  onRefresh,
  onShowCellDetails,
  onZoomIn,
  onZoomOut,
  onNewTraining,
  onBatchTraining,
  onAddCell,
  onRemoveCell,
  onToggleVoice,
  isVoiceEnabled = false,
  totalNodeCount,
  activeRelationCount
}) => {
  const isMobile = useIsMobile();
  const [visualMode, setVisualMode] = useState<string>('normal');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvas boyutlarını ayarla
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Canvas'ı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mod seçimine göre çizim yap
    if (visualMode === 'simple') {
      drawSimpleNetwork(ctx, canvas.width, canvas.height);
    } else if (visualMode === 'relations') {
      drawRelationNetwork(ctx, canvas.width, canvas.height);
    } else {
      drawDetailedNetwork(ctx, canvas.width, canvas.height);
    }
    
  }, [visualMode, userNetworks, systemNetworks, activatedNodes, relations]);
  
  // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandır
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const canvas = canvasRef.current;
      const container = containerRef.current;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Canvas'ı temizle ve yeniden çiz
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (visualMode === 'simple') {
        drawSimpleNetwork(ctx, canvas.width, canvas.height);
      } else if (visualMode === 'relations') {
        drawRelationNetwork(ctx, canvas.width, canvas.height);
      } else {
        drawDetailedNetwork(ctx, canvas.width, canvas.height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visualMode, userNetworks, systemNetworks, activatedNodes, relations]);
  
  // Basit ağ çizimi
  const drawSimpleNetwork = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Arkaplan
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Ağ çizimi
    const nodeRadius = 5;
    const nodeCount = Math.min(totalNodeCount, 100);
    
    for (let i = 0; i < nodeCount; i++) {
      const x = Math.random() * (width - 40) + 20;
      const y = Math.random() * (height - 40) + 20;
      
      // Düğüm çizimi
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#3b82f6' : '#10b981';
      ctx.fill();
      
      // Bağlantı çizimi (rastgele)
      if (i > 0) {
        const prevX = Math.random() * (width - 40) + 20;
        const prevY = Math.random() * (height - 40) + 20;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(prevX, prevY);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  };
  
  // İlişkisel ağ çizimi
  const drawRelationNetwork = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Arkaplan
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 50;
    
    // Sistem ve kullanıcı düğümleri için renkler
    const userColor = '#3b82f6';
    const systemColor = '#10b981';
    
    // Kullanıcı düğümleri - solda
    const userNodes: { x: number, y: number, word: string }[] = [];
    const userWords = new Set<string>();
    
    // Kullanıcı ağından benzersiz kelimeleri topla
    userNetworks.forEach(layer => {
      layer.forEach(row => {
        row.forEach(node => {
          if (node && !userWords.has(node.word)) {
            userWords.add(node.word);
          }
        });
      });
    });
    
    // En fazla 20 kullanıcı düğümü göster
    const userWordArray = Array.from(userWords).slice(0, 20);
    const userWordCount = userWordArray.length;
    
    for (let i = 0; i < userWordCount; i++) {
      const angle = (i / userWordCount) * Math.PI - Math.PI / 2;
      const x = centerX - Math.cos(angle) * (maxRadius * 0.8);
      const y = centerY + Math.sin(angle) * (maxRadius * 0.8);
      userNodes.push({ x, y, word: userWordArray[i] });
    }
    
    // Sistem düğümleri - sağda
    const systemNodes: { x: number, y: number, word: string }[] = [];
    const systemWords = new Set<string>();
    
    // Sistem ağından benzersiz kelimeleri topla
    systemNetworks.forEach(layer => {
      layer.forEach(row => {
        row.forEach(node => {
          if (node && !systemWords.has(node.word)) {
            systemWords.add(node.word);
          }
        });
      });
    });
    
    // En fazla 20 sistem düğümü göster
    const systemWordArray = Array.from(systemWords).slice(0, 20);
    const systemWordCount = systemWordArray.length;
    
    for (let i = 0; i < systemWordCount; i++) {
      const angle = (i / systemWordCount) * Math.PI + Math.PI / 2;
      const x = centerX + Math.cos(angle) * (maxRadius * 0.8);
      const y = centerY + Math.sin(angle) * (maxRadius * 0.8);
      systemNodes.push({ x, y, word: systemWordArray[i] });
    }
    
    // İlişkileri çiz
    ctx.lineWidth = 0.8;
    relations.forEach(relation => {
      const userNode = userNodes.find(n => n.word === relation.userWord);
      const systemNode = systemNodes.find(n => n.word === relation.systemWord);
      
      if (userNode && systemNode) {
        // İlişki gücüne göre çizgi kalınlığı
        const lineWidth = Math.max(0.2, Math.min(3, relation.strength / 50));
        
        // İlişki gücüne göre opaklık
        const opacity = Math.max(0.1, Math.min(0.8, relation.strength / 100));
        
        ctx.beginPath();
        ctx.moveTo(userNode.x, userNode.y);
        
        // İlişki eğrisi
        const controlX = (userNode.x + systemNode.x) / 2;
        const controlY = centerY + (Math.random() * 40 - 20);
        
        ctx.quadraticCurveTo(controlX, controlY, systemNode.x, systemNode.y);
        ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    });
    
    // Aktivasyon olan düğümleri koyu çiz
    const activatedWordSet = new Set(activatedNodes.map(n => n.word));
    
    // Düğümleri çiz
    const drawNode = (node: { x: number, y: number, word: string }, color: string, isActivated: boolean) => {
      const radius = isActivated ? 7 : 5;
      
      // Düğüm arkaplanı
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isActivated ? color : `${color}80`;
      ctx.fill();
      
      // Sadece aktif düğümlerin etiketlerini göster
      if (isActivated) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.word, node.x, node.y + radius + 12);
      }
    };
    
    // Kullanıcı düğümlerini çiz
    userNodes.forEach(node => {
      drawNode(node, userColor, activatedWordSet.has(node.word));
    });
    
    // Sistem düğümlerini çiz
    systemNodes.forEach(node => {
      drawNode(node, systemColor, activatedWordSet.has(node.word));
    });
  };
  
  // Detaylı ağ çizimi
  const drawDetailedNetwork = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Arkaplan
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Katmanları çiz
    const layers = 4; // Katman sayısı
    const layerWidth = width / (layers + 1);
    const nodeRadius = 6;
    
    // Her katmandaki düğüm sayısı
    const nodesPerLayer = [8, 12, 12, 8];
    
    // Tüm düğümleri sakla
    const allNodes: { x: number, y: number, layer: number, index: number }[] = [];
    
    // Katmanları çiz
    for (let layer = 0; layer < layers; layer++) {
      const layerX = (layer + 1) * layerWidth;
      const nodeCount = nodesPerLayer[layer];
      const layerHeight = height / (nodeCount + 1);
      
      for (let i = 0; i < nodeCount; i++) {
        const y = (i + 1) * layerHeight;
        
        // Düğüm çizimi
        ctx.beginPath();
        ctx.arc(layerX, y, nodeRadius, 0, Math.PI * 2);
        
        // Katmana göre renk belirle
        const color = layer < 2 ? '#3b82f6' : '#10b981';
        ctx.fillStyle = color;
        ctx.fill();
        
        // Düğümü kaydet
        allNodes.push({ x: layerX, y, layer, index: i });
      }
    }
    
    // Bağlantıları çiz
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    
    for (let layer = 0; layer < layers - 1; layer++) {
      const currentLayerNodes = allNodes.filter(n => n.layer === layer);
      const nextLayerNodes = allNodes.filter(n => n.layer === layer + 1);
      
      // Her düğümü bir sonraki katmandaki 2-3 düğüme bağla
      currentLayerNodes.forEach(currentNode => {
        // Kaç bağlantı yapılacak
        const connectionCount = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < connectionCount; i++) {
          // Rastgele bir hedef düğüm seç
          const targetIndex = Math.floor(Math.random() * nextLayerNodes.length);
          const targetNode = nextLayerNodes[targetIndex];
          
          // Bağlantıyı çiz
          ctx.beginPath();
          ctx.moveTo(currentNode.x, currentNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();
        }
      });
    }
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Canvas'ın X ve Y konumunu al
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Yakınlık kontrolü ve düğüm detaylarını göster
    // Not: Gerçek uygulamada burada düğüm kontrolleri yapılır
    
    // Örnek bir düğüm oluşturup detaylarını göster
    if (Math.random() > 0.5) {
      const randomNetwork = Math.random() > 0.5 ? userNetworks : systemNetworks;
      
      // Rastgele bir düğüm bul
      for (let layer = 0; layer < randomNetwork.length; layer++) {
        for (let row = 0; row < randomNetwork[layer].length; row++) {
          for (let col = 0; col < randomNetwork[layer][row].length; col++) {
            const node = randomNetwork[layer][row][col];
            if (node) {
              onShowCellDetails(node);
              return;
            }
          }
        }
      }
    }
  };
  
  return (
    <div className={`
      mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 
      dark:border-gray-700 overflow-hidden flex flex-col
      w-full [aspect-ratio>1]:w-3/5
    `}>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <BrainCircuit className="w-5 h-5 mr-2 text-purple-500" />
          <span>Sinir Ağı Görselleştirmesi</span>
          <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            {totalNodeCount} Düğüm
          </span>
        </h2>
        
        <div className="flex space-x-2">
          {/* Ses Butonları */}
          {onToggleVoice && (
            <button
              onClick={onToggleVoice}
              className={`p-2 rounded-md ${isVoiceEnabled ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-primary-500`}
              aria-label={isVoiceEnabled ? "Sesi kapat" : "Sesi aç"}
              title={isVoiceEnabled ? "Sesi kapat" : "Sesi aç"}
            >
              {isVoiceEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
          )}
          
          {/* Hücre Ekleme Butonu */}
          {onAddCell && (
            <div className="relative group">
              <button
                onClick={onAddCell}
                className="p-2 rounded-md text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 hover:shadow-md"
                aria-label="Hücre Ekle"
                title="Yeni Hücre Ekle"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
              <span className="absolute hidden group-hover:inline-block -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-10">
                Ağı Genişlet
              </span>
            </div>
          )}
          
          {/* Hücre Silme Butonu */}
          {onRemoveCell && (
            <div className="relative group">
              <button
                onClick={onRemoveCell}
                className="p-2 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 hover:shadow-md"
                aria-label="Hücre Sil"
                title="Hücre Sil"
              >
                <MinusCircle className="h-5 w-5" />
              </button>
              <span className="absolute hidden group-hover:inline-block -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-10">
                Ağı Optimize Et
              </span>
            </div>
          )}
          
          {/* Otomatik Geliştirme Butonu */}
          <div className="relative group">
            <button
              onClick={onRefresh}
              className="p-2 rounded-md text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 hover:shadow-md"
              aria-label="Otomatik Geliştir"
              title="Ağı Otomatik Geliştir"
            >
              <Activity className="h-5 w-5" />
            </button>
            <span className="absolute hidden group-hover:inline-block -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap z-10">
              Oto-Geliştirme
            </span>
          </div>
          
          {/* Yenile Butonu */}
          <button
            onClick={onRefresh}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Yenile"
            title="Yenile"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">Görünüm:</span>
          <select
            value={visualMode}
            onChange={(e) => setVisualMode(e.target.value)}
            className="text-sm rounded-md border-0 py-1 pl-2 pr-8 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
          >
            {visualModes.map((mode) => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 mr-1">Gelişim:</span>
            <select
              onChange={(e) => console.log("Gelişim modu:", e.target.value)}
              className="text-xs rounded-md border-0 py-0.5 pl-2 pr-7 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
            >
              <option value="auto">Otomatik</option>
              <option value="manuel">Manuel</option>
              <option value="supervised">Denetimli</option>
              <option value="reinforcement">Pekiştirmeli</option>
            </select>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={onZoomIn}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 focus:outline-none"
              aria-label="Yakınlaştır"
              title="Yakınlaştır"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            
            <button
              onClick={onZoomOut}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 focus:outline-none"
              aria-label="Uzaklaştır"
              title="Uzaklaştır"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onClick={handleCanvasClick}
        />
        
        {visualMode === '3d' && (
          <div className="absolute inset-0">
            <NeuralNetwork3D 
              userNetworks={userNetworks}
              systemNetworks={systemNetworks}
              relations={relations}
              bidirectionalRelations={bidirectionalRelations}
              activatedNodes={
                // activatedNodes'u uygun formata dönüştür
                activatedNodes.map(node => {
                  // Düğümün konumunu bul
                  for (let layer = 0; layer < userNetworks.length; layer++) {
                    for (let row = 0; row < userNetworks[layer].length; row++) {
                      for (let col = 0; col < userNetworks[layer][row].length; col++) {
                        if (userNetworks[layer][row][col]?.id === node.id) {
                          return { layer, row, col, type: 'user' as const };
                        }
                      }
                    }
                  }
                  
                  for (let layer = 0; layer < systemNetworks.length; layer++) {
                    for (let row = 0; row < systemNetworks[layer].length; row++) {
                      for (let col = 0; col < systemNetworks[layer][row].length; col++) {
                        if (systemNetworks[layer][row][col]?.id === node.id) {
                          return { layer, row, col, type: 'system' as const };
                        }
                      }
                    }
                  }
                  
                  // Eğer bulunamazsa varsayılan değer döndür
                  return { layer: 0, row: 0, col: 0, type: 'user' as const };
                }).filter(node => node !== undefined) as {
                  layer: number;
                  row: number;
                  col: number;
                  type: 'user' | 'system';
                }[]
              }
              onNodeClick={(node) => onShowCellDetails(node)}
            />
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center"><span className="w-28">Toplam Düğüm:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{totalNodeCount}</span></div>
            <div className="flex items-center"><span className="w-28">Aktif İlişki:</span> <span className="font-medium text-gray-700 dark:text-gray-300">{activeRelationCount}</span></div>
            <div className="flex items-center"><span className="w-28">Son Öğrenme:</span> <span className="font-medium text-green-600 dark:text-green-400">+{Math.floor(Math.random() * 15) + 1} Düğüm</span></div>
            <div className="flex items-center"><span className="w-28">Gelişim Oranı:</span> <span className="font-medium text-blue-600 dark:text-blue-400">%{Math.floor(Math.random() * 60) + 40}</span></div>
          </div>
          
          <div className="flex flex-col space-y-2 mt-2 lg:mt-0">
            <div className="flex space-x-2">
              <button
                onClick={onNewTraining}
                className="flex items-center px-3 py-2 text-xs rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition duration-300 hover:shadow-sm"
              >
                <PenTool className="h-3.5 w-3.5 mr-1" />
                <span>Manuel Eğitim</span>
              </button>
              
              <button
                onClick={onBatchTraining}
                className="flex items-center px-3 py-2 text-xs rounded bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-800/40 text-primary-700 dark:text-primary-300 transition duration-300 hover:shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Toplu Eğitim</span>
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => console.log("Kendi Kendine Öğrenme")}
                className="flex items-center px-3 py-2 text-xs rounded bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 transition duration-300 hover:shadow-sm"
              >
                <BarChart2 className="h-3.5 w-3.5 mr-1" />
                <span>Oto-Öğrenme</span>
              </button>
              
              <button
                onClick={() => console.log("Ağ Optimizasyonu")}
                className="flex items-center px-3 py-2 text-xs rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-800/40 text-amber-700 dark:text-amber-300 transition duration-300 hover:shadow-sm"
              >
                <Activity className="h-3.5 w-3.5 mr-1" />
                <span>Ağ Optimizasyonu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralNetworkPanel;
