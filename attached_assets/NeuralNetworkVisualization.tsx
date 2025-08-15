import React, { useEffect, useState, useRef, useCallback } from 'react';
import { RefreshCw, ZoomIn, ZoomOut, Network, BrainCircuit, Nodes, Eye, EyeOff, RotateCw, ArrowLeftRight, Cpu, ArrowRightLeft, DownloadCloud, Save } from 'lucide-react';
import { NetworkNode, Relation, ACTIVATION_DECAY_RATE } from '@/lib/NeuralNetworkUtils';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface NeuralNetworkVisualizationProps {
  userNetworks: (NetworkNode | null)[][][];
  systemNetworks: (NetworkNode | null)[][][];
  relations: Relation[];
  activatedNodes: { layer: number; row: number; col: number; type: 'user' | 'system' }[];
  isAnimating: boolean;
  onReset: () => void;
  onCellClick: (cell: NetworkNode & { layer: number; row: number; col: number; type: 'user' | 'system' }) => void;
  visualMode: "simple" | "detailed" | "3d" | "relations" | "normal";
  setVisualMode: (mode: "simple" | "detailed" | "3d" | "relations" | "normal") => void;
  networkRows: number;
  networkCols: number;
  networkLayers: number;
}

const NeuralNetworkVisualization: React.FC<NeuralNetworkVisualizationProps> = ({
  userNetworks,
  systemNetworks,
  relations,
  activatedNodes,
  isAnimating,
  onReset,
  onCellClick,
  visualMode,
  setVisualMode,
  networkRows,
  networkCols,
  networkLayers
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  const [maxWidth, setMaxWidth] = useState(900);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState('2d'); // '2d' veya '3d'
  const [highlightMode, setHighlightMode] = useState<'none' | 'activation' | 'importance' | 'frequency'>('activation');
  const { isDarkMode } = useTheme();
  const isMobile = useIsMobile();
  const gradientCache = useRef<Record<string, CanvasGradient>>({});

  // Görselleştirme boyutunu ayarla ve pencere boyutu değiştiğinde güncelle
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setMaxWidth(containerWidth > 600 ? containerWidth * 0.95 : containerWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Animasyon çerçevesini temizle (componentWillUnmount)
  useEffect(() => {
    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [animationFrame]);
  
  // Renk teması
  const getColors = useCallback(() => {
    if (isDarkMode) {
      return {
        userNodeColor: 'rgba(79, 70, 229, 1)', // Indigo-600
        systemNodeColor: 'rgba(139, 92, 246, 1)', // Violet-500
        activatedNodeColor: 'rgba(234, 88, 12, 1)', // Orange-600
        connectionColor: 'rgba(139, 92, 246, 0.6)', // Violet-500 with opacity
        importanceColor: 'rgba(16, 185, 129, 1)', // Emerald-500
        frequencyColor: 'rgba(245, 158, 11, 1)', // Amber-500
        emptyNodeColor: 'rgba(55, 65, 81, 0.1)', // Gray-700 with low opacity
        backgroundColor: 'rgba(17, 24, 39, 1)', // Gray-900
        textColor: 'rgba(243, 244, 246, 1)' // Gray-100
      };
    } else {
      return {
        userNodeColor: 'rgba(79, 70, 229, 1)', // Indigo-600
        systemNodeColor: 'rgba(124, 58, 237, 1)', // Purple-600
        activatedNodeColor: 'rgba(239, 68, 68, 1)', // Red-500
        connectionColor: 'rgba(99, 102, 241, 0.6)', // Indigo-500 with opacity
        importanceColor: 'rgba(16, 185, 129, 1)', // Emerald-500
        frequencyColor: 'rgba(245, 158, 11, 1)', // Amber-500
        emptyNodeColor: 'rgba(229, 231, 235, 0.3)', // Gray-200 with opacity
        backgroundColor: 'rgba(255, 255, 255, 1)', // White
        textColor: 'rgba(17, 24, 39, 1)' // Gray-900
      };
    }
  }, [isDarkMode]);

  // Gradyan oluşturma fonksiyonu
  const createGradient = useCallback((ctx: CanvasRenderingContext2D, startColor: string, endColor: string, x: number, y: number, size: number): CanvasGradient => {
    const cacheKey = `${startColor}-${endColor}-${x}-${y}-${size}`;
    
    if (gradientCache.current[cacheKey]) {
      return gradientCache.current[cacheKey];
    }
    
    const gradient = ctx.createRadialGradient(
      x + size/2, y + size/2, 0,
      x + size/2, y + size/2, size
    );
    
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    
    gradientCache.current[cacheKey] = gradient;
    return gradient;
  }, []);
  
  // Kanvas görselleştirmesi
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getColors();

    // Boyutları ayarla
    const gapX = 10 * scale;
    const gapY = 10 * scale;
    const nodeSize = 14 * scale;
    const LAYER_GAP = 140 * scale;
    const nodeRadius = nodeSize / 2;
    
    const layerHeight = Math.max(300, networkRows * (nodeSize + gapY));
    
    // Kanvas boyutunu ayarla
    const totalWidth = (userNetworks.length + systemNetworks.length) * LAYER_GAP;
    canvas.width = Math.max(600, totalWidth);
    canvas.height = layerHeight;
    
    // Arka planı temizle ve arka plan dolgusu
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Izgara çizgileri (opsiyonel)
    if (viewMode === '2d') {
      const gridColor = isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)';
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      
      // Yatay çizgiler
      for (let i = 0; i <= networkRows; i++) {
        const y = i * (nodeSize + gapY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Dikey çizgiler
      for (let i = 0; i <= (userNetworks.length + systemNetworks.length); i++) {
        const x = i * LAYER_GAP;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    }
    
    // Önce ilişkileri çiz (alt katman)
    if (visualMode === 'relations' && relations.length > 0) {
      // İlişkileri güçlerine göre sırala (zayıf ilişkiler önce çizilecek)
      const sortedRelations = [...relations].sort((a, b) => {
        const strengthA = (a.dependency + a.association) / 2;
        const strengthB = (b.dependency + b.association) / 2;
        return strengthA - strengthB;
      });
      
      for (const relation of sortedRelations) {
        // Kaynak kelimeyi bul
        const sourceInfo = findNode(userNetworks, relation.userWord);
        if (!sourceInfo) continue;
        
        // Hedef kelimeyi bul
        const targetInfo = findNode(systemNetworks, relation.systemWord);
        if (!targetInfo) continue;
        
        const {layer: sourceLayer, row: sourceRow, col: sourceCol} = sourceInfo;
        const {layer: targetLayer, row: targetRow, col: targetCol} = targetInfo;
        
        const sourceX = sourceLayer * LAYER_GAP + sourceCol * (nodeSize + gapX) + nodeRadius;
        const sourceY = sourceRow * (nodeSize + gapY) + nodeRadius;
        
        const targetX = targetLayer * LAYER_GAP + ((userNetworks.length) * LAYER_GAP) + targetCol * (nodeSize + gapX) + nodeRadius;
        const targetY = targetRow * (nodeSize + gapY) + nodeRadius;
        
        // İlişkinin gücüne dayalı renklendirme
        const strength = (relation.dependency + relation.association) / 2;
        const normalizedStrength = Math.min(1, Math.max(0.1, strength / 100));
        
        // İlişki türüne göre renk
        let relationColor = colors.connectionColor;
        if (relation.relationType === 'semantic') {
          relationColor = 'rgba(139, 92, 246, 0.6)'; // Mor
        } else if (relation.relationType === 'causal') {
          relationColor = 'rgba(239, 68, 68, 0.6)'; // Kırmızı
        } else if (relation.relationType === 'temporal') {
          relationColor = 'rgba(59, 130, 246, 0.6)'; // Mavi
        } else if (relation.relationType === 'hierarchical') {
          relationColor = 'rgba(16, 185, 129, 0.6)'; // Yeşil
        }

        // İlişki çizgisini çiz (eğri)
        ctx.beginPath();
        
        // Control noktaları
        const cpX1 = sourceX + (targetX - sourceX) * 0.4;
        const cpY1 = sourceY;
        const cpX2 = targetX - (targetX - sourceX) * 0.4;
        const cpY2 = targetY;
        
        // Bezier eğrisi
        ctx.moveTo(sourceX, sourceY);
        ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, targetX, targetY);
        
        // İlişkinin gücüne göre renk ve kalınlık
        ctx.strokeStyle = relationColor;
        ctx.lineWidth = Math.max(0.5, normalizedStrength * 3 * scale);
        ctx.globalAlpha = Math.max(0.2, normalizedStrength);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        
        // İlişki bidirectional ise ok ucu ekle
        if (relation.bidirectional) {
          // Ok ucu
          const headLen = 5 * scale;
          const dx = targetX - cpX2;
          const dy = targetY - cpY2;
          const angle = Math.atan2(dy, dx);
          
          // Ok ucunu çiz
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
          ctx.lineTo(
            targetX - headLen * Math.cos(angle - Math.PI / 6),
            targetY - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            targetX - headLen * Math.cos(angle + Math.PI / 6),
            targetY - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = relationColor;
          ctx.fill();
          
          // Ters yönde ok ucu
          ctx.beginPath();
          ctx.moveTo(sourceX, sourceY);
          ctx.lineTo(
            sourceX + headLen * Math.cos(angle - Math.PI / 6),
            sourceY + headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            sourceX + headLen * Math.cos(angle + Math.PI / 6),
            sourceY + headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = relationColor;
          ctx.fill();
        }
      }
    }
    
    // Kullanıcı ve sistem ağlarını çiz
    for (let layerIdx = 0; layerIdx < userNetworks.length; layerIdx++) {
      const userStartX = layerIdx * LAYER_GAP;
      const systemStartX = layerIdx * LAYER_GAP + ((userNetworks.length) * LAYER_GAP);
      
      // Kullanıcı katman etiketini çiz
      ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
      ctx.font = `${Math.max(10, 12 * scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`Kullanıcı Katmanı ${layerIdx + 1}`, userStartX + (networkCols * (nodeSize + gapX)) / 2, 14);
      
      // Sistem katman etiketini çiz
      ctx.fillText(`Sistem Katmanı ${layerIdx + 1}`, systemStartX + (networkCols * (nodeSize + gapX)) / 2, 14);
      
      // Kullanıcı ve sistem ağlarını çiz
      drawNetwork(
        ctx, userNetworks[layerIdx], userStartX, 20, nodeSize, gapX, gapY, 'user', layerIdx, colors
      );
      
      drawNetwork(
        ctx, systemNetworks[layerIdx], systemStartX, 20, nodeSize, gapX, gapY, 'system', layerIdx, colors
      );
    }
    
    // Aktivasyonları göster
    if (isAnimating) {
      activatedNodes.forEach(node => {
        const nodeType = node.type;
        let startX;
        
        if (nodeType === 'user') {
          startX = node.layer * LAYER_GAP;
        } else {
          startX = node.layer * LAYER_GAP + ((userNetworks.length) * LAYER_GAP);
        }
        
        const x = startX + node.col * (nodeSize + gapX) + nodeRadius;
        const y = 20 + node.row * (nodeSize + gapY) + nodeRadius;
        
        // Pulse efekti
        const now = Date.now();
        const pulseSize = 1.5 + Math.sin(now / 200) * 0.3;
        
        // Dış halka
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius * pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = colors.activatedNodeColor;
        ctx.lineWidth = 2 * scale;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });
    }
    
    // Tıklama olayları için canvas etkileşimini ayarla
    setupCanvasInteraction(scale, nodeSize, gapX, gapY, LAYER_GAP);
    
    // Animation devam ediyorsa, bir sonraki frame'i çiz
    if (isAnimating) {
      setAnimationFrame(requestAnimationFrame(drawCanvas));
    }
  }, [
    userNetworks, systemNetworks, relations, activatedNodes, isAnimating, 
    scale, visualMode, networkRows, networkCols, isDarkMode, viewMode, 
    networkLayers, highlightMode, createGradient, getColors
  ]);
  
  // Canvas çizimini tetikle
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Kelimeyi tüm ağlar içinde bul
  const findNode = (networks: (NetworkNode | null)[][][], word: string) => {
    for (let layer = 0; layer < networks.length; layer++) {
      for (let row = 0; row < networks[layer].length; row++) {
        for (let col = 0; col < networks[layer][row].length; col++) {
          const node = networks[layer][row][col];
          if (node && node.word === word) {
            return { layer, row, col };
          }
        }
      }
    }
    return null;
  };
  
  // Bir katman ağını çiz
  const drawNetwork = (
    ctx: CanvasRenderingContext2D,
    network: (NetworkNode | null)[][],
    startX: number,
    startY: number,
    nodeSize: number,
    gapX: number,
    gapY: number,
    type: 'user' | 'system',
    layerIdx: number,
    colors: ReturnType<typeof getColors>
  ) => {
    for (let row = 0; row < network.length; row++) {
      for (let col = 0; col < network[row].length; col++) {
        const node = network[row][col];
        const x = startX + col * (nodeSize + gapX);
        const y = startY + row * (nodeSize + gapY);
        
        // Boş hücreleri çiz
        if (!node) {
          ctx.beginPath();
          if (viewMode === '2d') {
            ctx.rect(x, y, nodeSize, nodeSize);
          } else {
            ctx.arc(x + nodeSize/2, y + nodeSize/2, nodeSize/2, 0, Math.PI * 2);
          }
          ctx.fillStyle = colors.emptyNodeColor;
          ctx.fill();
          continue;
        }
        
        // Farklı vurgu modlarına göre renk belirle
        let baseColor;
        let intensity = 0;
        
        if (type === 'user') {
          baseColor = colors.userNodeColor;
        } else {
          baseColor = colors.systemNodeColor;
        }
        
        // Vurgu moduna göre değer belirle
        if (highlightMode === 'activation') {
          intensity = Math.max(0.2, node.activation);
        } else if (highlightMode === 'importance') {
          intensity = Math.max(0.2, (node.importance || 50) / 100);
        } else if (highlightMode === 'frequency') {
          intensity = Math.max(0.2, Math.min(1, node.frequency / 20));
        }
        
        // Gradyan oluştur
        let color;
        if (viewMode === '3d') {
          // Gradyan renkleri
          const startColorRGB = baseColor.replace('rgba(', '').replace(')', '').split(',');
          const startColorStr = `rgba(${startColorRGB[0]}, ${startColorRGB[1]}, ${startColorRGB[2]}, ${intensity})`;
          const endColorStr = `rgba(${startColorRGB[0]}, ${startColorRGB[1]}, ${startColorRGB[2]}, ${intensity * 0.5})`;
          
          color = createGradient(ctx, startColorStr, endColorStr, x, y, nodeSize);
        } else {
          // Düz renk
          const rgbValues = baseColor.replace('rgba(', '').replace(')', '').split(',');
          color = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${intensity})`;
        }

        // Vurgulanan nodları farklı bir renkte göster
        const isActivated = activatedNodes.some(
          n => n.layer === layerIdx && n.row === row && n.col === col && n.type === type
        );
        
        if (isActivated) {
          color = colors.activatedNodeColor;
        }
        
        // 2D veya 3D gösterim moduna göre çizim
        ctx.beginPath();
        if (viewMode === '2d') {
          // Kare çiz
          ctx.rect(x, y, nodeSize, nodeSize);
        } else {
          // Daire çiz
          ctx.arc(x + nodeSize/2, y + nodeSize/2, nodeSize/2, 0, Math.PI * 2);
        }
        ctx.fillStyle = color;
        ctx.fill();
        
        // 3D mod için gölgelendirme ekle
        if (viewMode === '3d') {
          ctx.beginPath();
          ctx.arc(x + nodeSize/2, y + nodeSize/2, nodeSize/2, 0, Math.PI * 2);
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.stroke();
        }
      }
    }
  };
  
  // Canvas etkileşimini ayarla
  const setupCanvasInteraction = (
    scale: number,
    nodeSize: number,
    gapX: number,
    gapY: number,
    layerGap: number
  ) => {
    const currentCanvas = canvasRef.current;
    if (!currentCanvas) return;
    
    // Mouse hover olayı
    currentCanvas.onmousemove = (e: MouseEvent) => {
      const rect = currentCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Tüm düğümleri kontrol et
      let foundNode = false;
      
      for (let l = 0; l < userNetworks.length; l++) {
        // Kullanıcı ağı nodları için kontrol
        const userStartX = l * layerGap;
        
        for (let row = 0; row < userNetworks[l].length; row++) {
          for (let col = 0; col < userNetworks[l][row].length; col++) {
            const node = userNetworks[l][row][col];
            if (!node) continue;
            
            const x = userStartX + col * (nodeSize + gapX);
            const y = 20 + row * (nodeSize + gapY);
            
            const isHover = viewMode === '2d'
              ? (mouseX >= x && mouseX <= x + nodeSize && mouseY >= y && mouseY <= y + nodeSize)
              : Math.sqrt(Math.pow(mouseX - (x + nodeSize/2), 2) + Math.pow(mouseY - (y + nodeSize/2), 2)) <= nodeSize/2;
            
            if (isHover) {
              setSelectedNodeInfo(`Kullanıcı: ${node.word} (L${l+1}R${row+1}C${col+1})\nAktivasyon: ${(node.activation * 100).toFixed(0)}%\nKullanım: ${node.frequency}x\nÖnem: ${node.importance || 0}`);
              foundNode = true;
              document.body.style.cursor = 'pointer';
              break;
            }
          }
        }
        
        // Sistem ağı nodları için kontrol
        const systemStartX = l * layerGap + ((userNetworks.length) * layerGap);
        
        for (let row = 0; row < systemNetworks[l].length; row++) {
          for (let col = 0; col < systemNetworks[l][row].length; col++) {
            const node = systemNetworks[l][row][col];
            if (!node) continue;
            
            const x = systemStartX + col * (nodeSize + gapX);
            const y = 20 + row * (nodeSize + gapY);
            
            const isHover = viewMode === '2d'
              ? (mouseX >= x && mouseX <= x + nodeSize && mouseY >= y && mouseY <= y + nodeSize)
              : Math.sqrt(Math.pow(mouseX - (x + nodeSize/2), 2) + Math.pow(mouseY - (y + nodeSize/2), 2)) <= nodeSize/2;
            
            if (isHover) {
              setSelectedNodeInfo(`Sistem: ${node.word} (L${l+1}R${row+1}C${col+1})\nAktivasyon: ${(node.activation * 100).toFixed(0)}%\nKullanım: ${node.frequency}x\nÖnem: ${node.importance || 0}`);
              foundNode = true;
              document.body.style.cursor = 'pointer';
              break;
            }
          }
        }
      }
      
      if (!foundNode) {
        setSelectedNodeInfo(null);
        document.body.style.cursor = 'default';
      }
    };
    
    // Mouse tıklama olayı
    currentCanvas.onclick = (e: MouseEvent) => {
      const rect = currentCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      for (let l = 0; l < userNetworks.length; l++) {
        // Kullanıcı ağı nodları için kontrol
        const userStartX = l * layerGap;
        checkNodeClick(
          mouseX, mouseY, 
          userNetworks[l], 
          userStartX, 20, 
          nodeSize, gapX, gapY, 
          'user', l, onCellClick,
          viewMode
        );
        
        // Sistem ağı nodları için kontrol
        const systemStartX = l * layerGap + ((userNetworks.length) * layerGap);
        checkNodeClick(
          mouseX, mouseY, 
          systemNetworks[l], 
          systemStartX, 20, 
          nodeSize, gapX, gapY, 
          'system', l, onCellClick,
          viewMode
        );
      }
    };
    
    // Mouse leave olayı
    currentCanvas.onmouseleave = () => {
      setSelectedNodeInfo(null);
      document.body.style.cursor = 'default';
    };
  };
  
  // Tıklama olayını işle
  const checkNodeClick = (
    mouseX: number, mouseY: number,
    network: (NetworkNode | null)[][],
    startX: number, startY: number,
    nodeSize: number, gapX: number, gapY: number,
    type: 'user' | 'system', layerIdx: number,
    callback: Function,
    viewMode: string
  ) => {
    for (let row = 0; row < network.length; row++) {
      for (let col = 0; col < network[row].length; col++) {
        const node = network[row][col];
        if (!node) continue;
        
        const x = startX + col * (nodeSize + gapX);
        const y = startY + row * (nodeSize + gapY);
        
        let isClick = false;
        
        if (viewMode === '2d') {
          isClick = mouseX >= x && mouseX <= x + nodeSize && mouseY >= y && mouseY <= y + nodeSize;
        } else {
          const centerX = x + nodeSize/2;
          const centerY = y + nodeSize/2;
          const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
          isClick = distance <= nodeSize/2;
        }
        
        if (isClick) {
          callback({
            ...node,
            layer: layerIdx,
            row,
            col,
            type
          });
        }
      }
    }
  };
  
  // Görselleştirmeyi PNG olarak kaydet
  const saveCanvasAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Canvas'ı PNG olarak al
    const image = canvas.toDataURL('image/png');
    
    // İndirme bağlantısı oluştur
    const link = document.createElement('a');
    link.href = image;
    link.download = `sinir-agi-${new Date().toISOString().slice(0,10)}.png`;
    link.click();
  };
  
  return (
    <div className="neural-network-container rounded-lg shadow-sm bg-white dark:bg-gray-800" ref={containerRef}>
      <Tabs defaultValue="visualization" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex flex-col mb-3 sm:mb-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <BrainCircuit className="hidden sm:inline" size={20} />
              Sinir Ağı Görselleştirmesi
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Yapay zeka sisteminin hafıza ve kavram ağı yapısını görselleştirir
            </p>
          </div>
          
          <TabsList className="bg-gray-100 dark:bg-gray-700">
            <TabsTrigger value="visualization" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-xs">
              <Nodes className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Görselleştirme</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-xs">
              <Cpu className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">İstatistikler</span>
            </TabsTrigger>
          </TabsList>
        </div>
      
        <TabsContent value="visualization" className="pt-0 w-full">
          <div className="p-2 sm:p-4">
            <div className="flex flex-wrap gap-2 items-center mb-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setVisualMode(visualMode === 'relations' ? 'normal' : 'relations' as any)}
                        className={cn(
                          "h-8 text-xs border-gray-200 dark:border-gray-700 shadow-sm glass-morphism", 
                          visualMode === 'relations' && "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                        )}
                      >
                        {visualMode === 'relations' ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                        <span className="hidden sm:inline">İlişkiler</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>İlişkileri {visualMode === 'relations' ? 'Gizle' : 'Göster'}</TooltipContent>
                  </Tooltip>
                
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
                        className="h-8 text-xs border-gray-200 dark:border-gray-700"
                      >
                        {viewMode === '3d' ? <ArrowLeftRight className="w-3.5 h-3.5" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{viewMode === '2d' ? '3D Görünüm' : '2D Görünüm'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <ToggleGroup type="single" value={highlightMode} onValueChange={(v) => v && setHighlightMode(v as any)}>
                  <ToggleGroupItem value="activation" size="sm" className="h-8 text-xs">Aktivasyon</ToggleGroupItem>
                  <ToggleGroupItem value="importance" size="sm" className="h-8 text-xs">Önem</ToggleGroupItem>
                  <ToggleGroupItem value="frequency" size="sm" className="h-8 text-xs">Kullanım</ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setScale(s => Math.min(1.5, s + 0.15))} 
                        className="h-8 w-8 p-0"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Yakınlaştır</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setScale(s => Math.max(0.5, s - 0.15))} 
                        className="h-8 w-8 p-0"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Uzaklaştır</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onReset} 
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sıfırla</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={saveCanvasAsImage} 
                        className="h-8 w-8 p-0"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>PNG Olarak Kaydet</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColors().userNodeColor }}></div>
                <span>Kullanıcı Ağı</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColors().systemNodeColor }}></div>
                <span>Sistem Ağı</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColors().activatedNodeColor }}></div>
                <span>Aktif Düğüm</span>
              </div>
              {visualMode === 'relations' && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColors().connectionColor }}></div>
                  <span>İlişki Bağlantısı</span>
                </div>
              )}
            </div>
          
            <div className="w-full overflow-x-auto">
              {selectedNodeInfo && (
                <div className="absolute z-10 bg-white dark:bg-gray-800 text-xs p-2 rounded shadow-md border border-gray-200 dark:border-gray-700 pointer-events-none">
                  {selectedNodeInfo.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
              
              <div className="min-w-[600px]">
                <canvas 
                  ref={canvasRef} 
                  style={{ maxWidth: '100%', height: 'auto' }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg"
                ></canvas>
              </div>
            </div>
          </div>
        </TabsContent>
      
        <TabsContent value="stats" className="pt-0 w-full">
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">TOPLAM DÜĞÜM SAYISI</h4>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {userNetworks.flat().flat().filter(Boolean).length + systemNetworks.flat().flat().filter(Boolean).length}
                  </span>
                  <Nodes className="w-8 h-8 text-indigo-500 dark:text-indigo-400 opacity-70" />
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">İLİŞKİ SAYISI</h4>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {relations.length}
                  </span>
                  <ArrowRightLeft className="w-8 h-8 text-purple-500 dark:text-purple-400 opacity-70" />
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">KATMAN SAYISI</h4>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {networkLayers}
                  </span>
                  <Cpu className="w-8 h-8 text-green-500 dark:text-green-400 opacity-70" />
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ÇİFT YÖNLÜ İLİŞKİLER</h4>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {relations.filter(r => r.bidirectional).length}
                  </span>
                  <RotateCw className="w-8 h-8 text-amber-500 dark:text-amber-400 opacity-70" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">EN ÇOK KULLANILAN DÜĞÜMLER</h4>
                <div className="space-y-2">
                  {[...userNetworks.flat().flat(), ...systemNetworks.flat().flat()]
                    .filter(Boolean)
                    .sort((a, b) => (b?.frequency || 0) - (a?.frequency || 0))
                    .slice(0, 5)
                    .map((node, i) => node && (
                      <div key={i} className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{node.word}</span>
                            <span className="text-gray-500 dark:text-gray-400">{node.frequency}x</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, node.frequency * 5)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )) || Array(5).fill(0).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">EN GÜÇLÜ İLİŞKİLER</h4>
                <div className="space-y-2">
                  {relations
                    .sort((a, b) => (b.strength) - (a.strength))
                    .slice(0, 5)
                    .map((relation, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {relation.userWord} → {relation.systemWord}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">{relation.strength.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${relation.strength}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NeuralNetworkVisualization;
