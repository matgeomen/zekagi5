import React, { useState, useEffect, useRef } from "react";
import { BookText, FileText, Layers, Plus, CheckCircle2, X, Sun, Moon, RotateCcw, Database, RefreshCw, Send } from "lucide-react";
import CellDetailsModal from './components/CellDetailsModal';
import CorrectAnswerModal from './components/CorrectAnswerModal';
import BatchTrainingModal from './components/BatchTrainingModal';
import { useTheme } from './contexts/ThemeContext';
import { EnhancedMemorySystem } from './lib/EnhancedMemorySystem';
import { useIsMobile } from './hooks/use-mobile';
import {
  INITIAL_GRID_ROWS,
  INITIAL_GRID_COLS,
  INITIAL_NETWORK_LAYERS,
  LEARNING_RATE,
  createEmptyGrid,
  propagateActivation,
  generateResponse
} from './lib/NeuralNetworkUtils';

export default function App() {
  // Theme hooks
  const { isDarkMode, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  
  // Neural network state
  const [userNetworks, setUserNetworks] = useState<any[]>(
    Array(INITIAL_NETWORK_LAYERS).fill().map(() => createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS))
  );
  const [systemNetworks, setSystemNetworks] = useState<any[]>(
    Array(INITIAL_NETWORK_LAYERS).fill().map(() => createEmptyGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS))
  );
  const [relations, setRelations] = useState<any[]>([]);
  const [bidirectionalRelations, setBidirectionalRelations] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState("");
  const [activatedNodes, setActivatedNodes] = useState<any[]>([]);
  const [responseScore, setResponseScore] = useState<number | null>(null);
  const [trainHistory, setTrainHistory] = useState<any[]>([]);
  const [aiImprovements, setAiImprovements] = useState<any[]>([]);
  const [visualMode, setVisualMode] = useState("simple");
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCellDetails, setShowCellDetails] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showBatchTraining, setShowBatchTraining] = useState(false);
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [networkRows, setNetworkRows] = useState(INITIAL_GRID_ROWS);
  const [networkCols, setNetworkCols] = useState(INITIAL_GRID_COLS);
  const [networkLayers, setNetworkLayers] = useState(INITIAL_NETWORK_LAYERS);
  
  // Chat interface state
  const [messages, setMessages] = useState<{id: string; content: string; isUser: boolean; timestamp: number}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNetworkView, setShowNetworkView] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Memory system
  const memorySystem = useRef(new EnhancedMemorySystem()).current;

  const networkRef = useRef(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    const initialExamples = [
      "Merhaba nasılsın => İyiyim teşekkürler nasıl yardımcı olabilirim",
      "Bugün hava nasıl => Bugün hava güneşli ve sıcak",
      "Yardıma ihtiyacım var => Size nasıl yardımcı olabilirim",
      "Adın ne => Benim adım Yapay Zeka Asistanı",
      "Ne yapabilirsin => Size bilgi verebilir ve sorularınızı yanıtlayabilirim",
      "Türkiye'nin başkenti neresi => Ankara",
      "En büyük gezegen => Jüpiter",
      "İstanbul'un sembolleri nelerdir => Kız Kulesi, Galata Kulesi, Ayasofya ve Boğaz Köprüsü"
    ];
    
    const storedRelations = localStorage.getItem("chatbot_relations");
    const storedBidirectional = localStorage.getItem("chatbot_bidirectional");
    const storedHistory = localStorage.getItem("chatbot_history");
    const storedImprovements = localStorage.getItem("chatbot_improvements");
    
    if (storedRelations && storedHistory && storedBidirectional) {
      setRelations(JSON.parse(storedRelations));
      setBidirectionalRelations(JSON.parse(storedBidirectional));
      setTrainHistory(JSON.parse(storedHistory));
      if (storedImprovements) {
        setAiImprovements(JSON.parse(storedImprovements));
      }
    } else {
      initialExamples.forEach(example => {
        const [userInput, systemOutput] = example.split("=>").map(s => s.trim());
        trainNetwork(userInput, systemOutput, false);
      });
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (relations.length > 0) {
      localStorage.setItem("chatbot_relations", JSON.stringify(relations));
      localStorage.setItem("chatbot_bidirectional", JSON.stringify(bidirectionalRelations));
      localStorage.setItem("chatbot_history", JSON.stringify(trainHistory));
      localStorage.setItem("chatbot_improvements", JSON.stringify(aiImprovements));
    }
  }, [relations, bidirectionalRelations, trainHistory, aiImprovements]);

  // Click outside handler for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Neural network functions
  const addWordToNetwork = (networks, word, layer, row, col, activation = 1) => {
    const newNetworks = [...networks];
    const existingNode = newNetworks[layer][row][col];
    
    newNetworks[layer][row][col] = {
      word: word.toLowerCase(),
      activation: existingNode ? Math.min(1, existingNode.activation + LEARNING_RATE) : Math.min(1, LEARNING_RATE),
      count: existingNode ? existingNode.count + 1 : 1,
      connections: existingNode ? [...existingNode.connections] : [],
      dependency: existingNode ? existingNode.dependency : 0,
      association: existingNode ? existingNode.association : 0,
      frequency: existingNode ? existingNode.frequency : 0,
      order: existingNode ? existingNode.order : 0,
      feedback: existingNode ? existingNode.feedback : 0,
      depth: layer,
      parentWords: []
    };

    // Eğer üst katmanda kelime varsa ilişkiyi kur
    if (layer > 0) {
      const upperLayerWords = userNetworks[layer - 1]
        .flat()
        .filter(node => node)
        .map(node => node.word);

      newNetworks[layer][row][col].parentWords = upperLayerWords;
    }
    
    return newNetworks;
  };

  const findPositionForWord = (network, word) => {
    const lowerWord = word.toLowerCase();
    
    // First, try to find existing position
    for (let row = 0; row < networkRows; row++) {
      for (let col = 0; col < networkCols; col++) {
        if (network[row][col]?.word === lowerWord) {
          return { row, col };
        }
      }
    }
    
    // Find empty position with context awareness
    for (let row = 0; row < networkRows; row++) {
      for (let col = 0; col < networkCols; col++) {
        if (!network[row][col]) {
          // Check surrounding nodes for context
          const surroundingWords = [];
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (network[row + i]?.[col + j]?.word) {
                surroundingWords.push(network[row + i][col + j].word);
              }
            }
          }
          
          if (surroundingWords.length === 0) {
            return { row, col };
          }
        }
      }
    }
    
    // Eğer hiç pozisyon bulunamazsa varsayılan pozisyon döndür
    return {
      row: Math.floor(Math.random() * networkRows),
      col: Math.floor(Math.random() * networkCols)
    };
  };

  const trainNetwork = (userInput, systemOutput, animate = true) => {
    // Add to training history
    setTrainHistory(prev => [...prev, {
      userInput,
      systemOutput,
      timestamp: Date.now()
    }]);

    const userWords = userInput.toLowerCase().split(/\s+/);
    const systemWords = systemOutput.toLowerCase().split(/\s+/);

    // Update relations and bidirectional relations
    createBidirectionalRelations(userInput, systemOutput);

    // Add words to networks
    let newUserNetworks = [...userNetworks];
    let newSystemNetworks = [...systemNetworks];

    userWords.forEach((word, idx) => {
      // For each layer, find a position and add the word
      for (let layer = 0; layer < networkLayers; layer++) {
        const position = findPositionForWord(newUserNetworks[layer], word);
        if (position) {
          newUserNetworks = addWordToNetwork(
            newUserNetworks,
            word,
            layer,
            position.row,
            position.col
          );
        }
      }
    });

    systemWords.forEach((word, idx) => {
      // For each layer, find a position and add the word
      for (let layer = 0; layer < networkLayers; layer++) {
        const position = findPositionForWord(newSystemNetworks[layer], word);
        if (position) {
          newSystemNetworks = addWordToNetwork(
            newSystemNetworks,
            word,
            layer,
            position.row,
            position.col
          );
        }
      }
    });

    setUserNetworks(newUserNetworks);
    setSystemNetworks(newSystemNetworks);
  };

  const createBidirectionalRelations = (userInput, systemOutput) => {
    const userWords = userInput.toLowerCase().split(/\s+/);
    const systemWords = systemOutput.toLowerCase().split(/\s+/);
    let newBidirectionalRelations = [...bidirectionalRelations];
    
    systemWords.forEach((systemWord, systemIdx) => {
      userWords.forEach((userWord, userIdx) => {
        // Forward relation
        const forwardRelation = newBidirectionalRelations.find(
          rel => rel.userWord === systemWord && rel.systemWord === userWord
        );
        
        if (forwardRelation) {
          forwardRelation.frequency = Math.min(100, forwardRelation.frequency + 1);
          forwardRelation.order = Math.min(forwardRelation.order, userIdx);
          forwardRelation.dependency = Math.min(100, forwardRelation.dependency + 5);
          forwardRelation.association = Math.min(100, forwardRelation.association + 5);
        } else {
          newBidirectionalRelations.push({
            userWord: systemWord,
            systemWord: userWord,
            dependency: 50,
            association: 50,
            frequency: 1,
            order: userIdx,
            feedback: 0,
            isReversed: true
          });
        }
        
        // Backward relation
        const backwardRelation = newBidirectionalRelations.find(
          rel => rel.userWord === userWord && rel.systemWord === systemWord
        );
        
        if (backwardRelation) {
          backwardRelation.frequency = Math.min(100, backwardRelation.frequency + 1);
          backwardRelation.order = Math.min(backwardRelation.order, systemIdx);
          backwardRelation.dependency = Math.min(100, backwardRelation.dependency + 5);
          backwardRelation.association = Math.min(100, backwardRelation.association + 5);
        } else {
          newBidirectionalRelations.push({
            userWord: userWord,
            systemWord: systemWord,
            dependency: 50,
            association: 50,
            frequency: 1,
            order: systemIdx,
            feedback: 0,
            isReversed: false
          });
        }
      });
    });
    
    setBidirectionalRelations(newBidirectionalRelations);
  };

  const handleCorrectAnswer = (correctAnswer) => {
    if (!inputText) {
      alert("Lütfen önce bir soru girin.");
      return;
    }

    // Create new relations
    const userWords = inputText.toLowerCase().split(/\s+/);
    const systemWords = correctAnswer.toLowerCase().split(/\s+/);
    let newRelations = [...relations];
    
    // Eğitim geçmişine ekle - doğrudan eşleşmeler için çok önemli
    setTrainHistory(prev => {
      // Mevcut girdi var mı kontrol et
      const existingIndex = prev.findIndex(item => 
        item.userInput.toLowerCase() === inputText.toLowerCase()
      );
      
      // Varsa güncelle, yoksa ekle
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          userInput: inputText,
          systemOutput: correctAnswer,
          timestamp: Date.now()
        };
        return updated;
      } else {
        return [...prev, {
          userInput: inputText,
          systemOutput: correctAnswer,
          timestamp: Date.now()
        }];
      }
    });

    userWords.forEach((userWord, userIdx) => {
      systemWords.forEach((systemWord, systemIdx) => {
        // Check if relation already exists
        const existingRelation = newRelations.find(
          r => r.userWord === userWord && r.systemWord === systemWord
        );

        if (existingRelation) {
          // Update existing relation
          existingRelation.dependency = Math.min(100, existingRelation.dependency + 20);
          existingRelation.association = Math.min(100, existingRelation.association + 15);
          existingRelation.frequency = Math.min(100, existingRelation.frequency + 5);
        } else {
          // Create a new relation with high values
          newRelations.push({
            userWord: userWord.toLowerCase(),
            systemWord: systemWord.toLowerCase(),
            dependency: 90,
            association: 80,
            frequency: 5,
            order: systemIdx,
            feedback: 5
          });
        }
      });
    });
    

    setRelations(newRelations);
    trainNetwork(inputText, correctAnswer);
    setResponse("");
    setResponseScore(null);
    setInputText("");
  };

  const handleBatchTraining = (data) => {
    // İki farklı eğitim modu: çift listesi veya paragraf
  
    // 1. MOD: Çift dizisi (önceki işlevsellik korundu)
    if (Array.isArray(data)) {
      // Tüm çiftlerden gelen yeni ilişkileri biriktirmek için geçici bir dizi
      let accumulatedRelations = [...relations];
  
      data.forEach((pair, index) => {
        if (typeof pair.input !== 'string' || typeof pair.output !== 'string') {
          alert(`Hata: ${index + 1}. soru-cevap çifti geçerli değil. Her ikisi de metin olmalıdır.`);
          return;
        }
  
        const userWords = pair.input.toLowerCase().split(/\s+/);
        const systemWords = pair.output.toLowerCase().split(/\s+/);
  
        userWords.forEach((userWord, userIdx) => {
          systemWords.forEach((systemWord, systemIdx) => {
            const existingRelation = accumulatedRelations.find(
              rel => rel.userWord.toLowerCase() === userWord.toLowerCase() &&
                    rel.systemWord.toLowerCase() === systemWord.toLowerCase()
            );
  
            if (existingRelation) {
              // Mevcut ilişkiyi güncelle
              existingRelation.dependency = Math.min(100, existingRelation.dependency + 15);
              existingRelation.association = Math.min(100, existingRelation.association + 13);
              existingRelation.frequency = Math.min(100, existingRelation.frequency + 3);
              existingRelation.order = Math.max(0, existingRelation.order - 1);
              existingRelation.feedback = Math.max(0, existingRelation.feedback + 7);
            } else {
              // Yeni ilişki ekle
              accumulatedRelations.push({
                userWord: userWord.toLowerCase(),
                systemWord: systemWord.toLowerCase(),
                dependency: 85,
                association: 75,
                frequency: 4,
                order: systemIdx,
                feedback: 3
              });
            }
          });
        });
  
        // Her çift için ağ eğitimi yap (isteğe bağlı)
        trainNetwork(pair.input, pair.output, false);
        
        // Eğitim geçmişine de ekle
        setTrainHistory(prev => {
          const existingIndex = prev.findIndex(item => 
            item.userInput.toLowerCase() === pair.input.toLowerCase()
          );
          
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              userInput: pair.input,
              systemOutput: pair.output,
              timestamp: Date.now()
            };
            return updated;
          } else {
            return [...prev, {
              userInput: pair.input,
              systemOutput: pair.output,
              timestamp: Date.now()
            }];
          }
        });
      });
  
      // Tüm ilişkileri tek seferde güncelle
      setRelations(accumulatedRelations);
      
      // Eğitim geçmişine ekle
      setAiImprovements(prev => [...prev, {
        type: "batch_training",
        count: data.length,
        timestamp: Date.now()
      }]);
      
      alert(`${data.length} soru-cevap çifti başarıyla eğitildi!`);
    }
    // 1.5. MOD: Satır satır cümle işleme (metin dosyası formatı)
    else if (typeof data === 'string' && data.includes('=>')) {
      // Metin belgesini satırlara ayır
      const lines = data.split('\n').filter(line => line.trim().length > 0);
      
      if (lines.length === 0) {
        alert("Lütfen geçerli bir soru-cevap metni girin.");
        return;
      }
      
      let processedPairs = 0;
      let accumulatedRelations = [...relations];
      
      // Her satırı işle
      lines.forEach((line) => {
        // Sadece "=>" içeren satırları işle
        if (line.includes("=>")) {
          const [input, output] = line.split("=>").map(s => s.trim());
          
          // Geçerli bir soru-cevap çifti mi kontrol et
          if (input && output) {
            const userWords = input.toLowerCase().split(/\s+/);
            const systemWords = output.toLowerCase().split(/\s+/);
            
            // İlişkileri oluştur
            userWords.forEach((userWord, userIdx) => {
              systemWords.forEach((systemWord, systemIdx) => {
                const existingRelation = accumulatedRelations.find(
                  rel => rel.userWord.toLowerCase() === userWord.toLowerCase() &&
                        rel.systemWord.toLowerCase() === systemWord.toLowerCase()
                );
                
                if (existingRelation) {
                  // Mevcut ilişkiyi güncelle
                  existingRelation.dependency = Math.min(100, existingRelation.dependency + 15);
                  existingRelation.association = Math.min(100, existingRelation.association + 13);
                  existingRelation.frequency = Math.min(100, existingRelation.frequency + 3);
                } else {
                  // Yeni ilişki ekle
                  accumulatedRelations.push({
                    userWord: userWord.toLowerCase(),
                    systemWord: systemWord.toLowerCase(),
                    dependency: 85,
                    association: 75,
                    frequency: 4,
                    order: systemIdx,
                    feedback: 3
                  });
                }
              });
            });
            
            // Ağı eğit
            trainNetwork(input, output, false);
            
            // Eğitim geçmişine ekle
            setTrainHistory(prev => {
              const existingIndex = prev.findIndex(item => 
                item.userInput.toLowerCase() === input.toLowerCase()
              );
              
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                  userInput: input,
                  systemOutput: output,
                  timestamp: Date.now()
                };
                return updated;
              } else {
                return [...prev, {
                  userInput: input,
                  systemOutput: output,
                  timestamp: Date.now()
                }];
              }
            });
            
            processedPairs++;
          }
        }
      });
      
      // İlişkileri güncelle
      setRelations(accumulatedRelations);
      
      // Eğitim geçmişine ekle
      setAiImprovements(prev => [...prev, {
        type: "bulk_training",
        lines: processedPairs,
        timestamp: Date.now()
      }]);
      
      alert(`${processedPairs} satır başarıyla işlendi ve eğitildi!`);
    }
    // 2. MOD: Paragraf metni (kendi kendine öğrenme modu)
    else if (typeof data === 'string') {
      // Paragrafı cümlelere ayır
      const sentences = data.split(/[.!?]+/).filter(s => s.trim().length > 3);
      
      if (sentences.length < 2) {
        alert("Metin çok kısa. Lütfen daha uzun bir metin girin.");
        return;
      }
      
      // Her cümle çifti arasında ilişki kur
      let newRelations = [...relations];
      let trainedPairs = 0;
      let generatedQuestionAnswerPairs = 0;
      
      // 1) Ardışık cümleler arası ilişki ve öğrenme
      for (let i = 0; i < sentences.length - 1; i++) {
        const currentSentence = sentences[i].trim();
        const nextSentence = sentences[i + 1].trim();
        
        if (currentSentence.length > 0 && nextSentence.length > 0) {
          // Cümleler arasında ilişki kur ve eğit
          trainNetwork(currentSentence, nextSentence, false);
          
          // Ardışık cümleleri eğitim geçmişine de ekle
          setTrainHistory(prev => {
            const existingIndex = prev.findIndex(item => 
              item.userInput.toLowerCase() === currentSentence.toLowerCase()
            );
            
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                userInput: currentSentence,
                systemOutput: nextSentence,
                timestamp: Date.now()
              };
              return updated;
            } else {
              return [...prev, {
                userInput: currentSentence,
                systemOutput: nextSentence,
                timestamp: Date.now()
              }];
            }
          });
          
          trainedPairs++;
          
          // Kelimeler arası ilişkiler
          const currentWords = currentSentence.toLowerCase().split(/\s+/);
          const nextWords = nextSentence.toLowerCase().split(/\s+/);
          
          currentWords.forEach((userWord, userIdx) => {
            nextWords.forEach((systemWord, systemIdx) => {
              // İlişki varsa güncelle, yoksa yeni ilişki ekle
              const existingRelation = newRelations.find(
                rel => rel.userWord.toLowerCase() === userWord.toLowerCase() &&
                      rel.systemWord.toLowerCase() === systemWord.toLowerCase()
              );
              
              if (existingRelation) {
                existingRelation.dependency = Math.min(100, existingRelation.dependency + 10);
                existingRelation.association = Math.min(100, existingRelation.association + 8);
                existingRelation.frequency = Math.min(100, existingRelation.frequency + 2);
              } else {
                newRelations.push({
                  userWord: userWord.toLowerCase(),
                  systemWord: systemWord.toLowerCase(),
                  dependency: 70,
                  association: 65,
                  frequency: 3,
                  order: Math.min(userIdx, systemIdx),
                  feedback: 1
                });
              }
            });
          });
        }
      }
      
      // 2) Otomatik soru-cevap çiftleri oluşturma (Gelişmiş)
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (sentence.length < 10) continue; // Çok kısa cümlelerden soru oluşturma
        
        const words = sentence.split(/\s+/);
        if (words.length < 3) continue; // Çok kısa cümlelerden soru oluşturma
        
        // Türkçe soru kalıpları oluştur - Daha gelişmiş yapıda
        const questions = [];
        
        // İsim tanıma kalıbı - kişiyi bilgilerle ilişkilendirme
        const namedEntityMatch = sentence.match(/([A-Z][a-zıöüğşçİÖÜĞŞÇ]+\s[A-Z][a-zıöüğşçİÖÜĞŞÇ]+|[A-Z][a-zıöüğşçİÖÜĞŞÇ]+)/g);
        
        // Eğer metinde büyük harfle başlayan isim varsa (muhtemel kişi ismi)
        if (namedEntityMatch && namedEntityMatch.length > 0) {
          const possibleName = namedEntityMatch[0];
          
          // "Ben X. Y mesleğindeyim" kalıbı
          if (sentence.toLowerCase().includes("ben") && sentence.toLowerCase().includes(possibleName.toLowerCase())) {
            questions.push(`Ben kimim?`);
          }
          
          // Meslek tespit etmeye çalış
          const professionKeywords = ["öğretmen", "doktor", "mühendis", "avukat", "müdür", "profesör", 
                                       "işçi", "memur", "esnaf", "tüccar", "satıcı", "uzman", "teknisyen",
                                       "akademisyen", "öğrenci", "yazar", "sanatçı", "ressam", "tasarımcı"];
          
          for (const profession of professionKeywords) {
            if (sentence.toLowerCase().includes(profession)) {
              questions.push(`${possibleName} ne mesleğinde?`);
              questions.push(`${possibleName} hangi alanda çalışır?`);
              questions.push(`${possibleName} kim?`);
              
              // Eğer meslek + branş kalıbı varsa (örn: matematik öğretmeni)
              const before = sentence.split(profession)[0].trim().split(' ');
              if (before.length > 0) {
                const possibleField = before[before.length-1];
                if (possibleField.length > 3 && !possibleField.match(/[A-Z0-9]/)) {
                  questions.push(`${possibleName} hangi branşta ${profession}?`);
                  questions.push(`${possibleName} ne ${profession}i?`);
                }
              }
              break;
            }
          }
          
          // Yaş veya doğum yılı tespiti
          const ageMatch = sentence.match(/(\d+)\s*yaşında/);
          const birthYearMatch = sentence.match(/(\d{4})\s*(?:yılında)?\s*doğdu/);
          
          if (ageMatch) {
            questions.push(`${possibleName} kaç yaşında?`);
            questions.push(`${possibleName}'ın yaşı nedir?`);
          } else if (birthYearMatch) {
            questions.push(`${possibleName} hangi yılda doğdu?`);
            questions.push(`${possibleName}'ın doğum yılı nedir?`);
          }
          
          // Konum veya yer tespiti
          const locationKeywords = ["yaşıyor", "oturuyor", "ikamet ediyor", "doğdu"];
          for (const locKeyword of locationKeywords) {
            if (sentence.toLowerCase().includes(locKeyword)) {
              const parts = sentence.split(locKeyword)[0].trim().split(' ');
              const lastTwoWords = parts.slice(-2).join(' ');
              
              questions.push(`${possibleName} nerede ${locKeyword}?`);
              questions.push(`${possibleName}'ın yaşadığı yer neresi?`);
              break;
            }
          }
        }
        
        // Soru-cevap kalıpları (NLP olmadan basit kural tabanlı yaklaşım)
        if (!sentence.includes("?")) {
          // Temel soru kalıpları
          if (words.length >= 2) {
            questions.push(`${words[0]} ${words[1]} nedir?`);
          } else {
            questions.push(`${words[0]} nedir?`);
          }
          
          // "Ne hakkında" sorusu
          if (words.length > 3) {
            questions.push(`${words[0]} ${words[1]} ne hakkındadır?`);
          }
          
          // "Nasıl" sorusu 
          if (words.length > 2) {
            questions.push(`${words[0]} nasıl ${words[words.length > 3 ? 1 : words.length-1]}?`);
          }
          
          // 5N1K (Kim, Ne, Nerede, Ne zaman, Neden, Nasıl) yapısı
          // Kim sorusu
          if (sentence.match(/[A-Z][a-z]+/)) {
            questions.push(`Kim ${words.slice(1, Math.min(4, words.length)).join(' ')}?`);
          }
          
          // Nerede sorusu
          if (sentence.toLowerCase().includes("'da") || sentence.toLowerCase().includes("'de") || 
              sentence.toLowerCase().includes("içinde") || sentence.toLowerCase().includes("üzerinde")) {
            questions.push(`${words[0]} nerede ${words[1] || ''}?`);
          }
          
          // Ne zaman sorusu
          if (sentence.match(/\b\d{4}\b/) || sentence.includes("gün") || sentence.includes("ay") || 
              sentence.includes("yıl") || sentence.includes("hafta") || sentence.includes("saat")) {
            questions.push(`${words[0]} ne zaman ${words[1] || ''}?`);
          }
        }
        
        // Her oluşturulan soru için cevap ilişkisi kur
        questions.forEach(question => {
          // Soru-cevap ilişkisini kur
          trainNetwork(question, sentence, false);
          
          // Soru-cevap çiftini eğitim geçmişine ekle
          setTrainHistory(prev => {
            const existingIndex = prev.findIndex(item => 
              item.userInput.toLowerCase() === question.toLowerCase()
            );
            
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                userInput: question,
                systemOutput: sentence,
                timestamp: Date.now()
              };
              return updated;
            } else {
              return [...prev, {
                userInput: question,
                systemOutput: sentence,
                timestamp: Date.now()
              }];
            }
          });
          
          generatedQuestionAnswerPairs++;
        });
      }
      
      // İlişkileri güncelle
      setRelations(newRelations);
      
      // Eğitim geçmişine ekle
      setAiImprovements(prev => [...prev, {
        type: "self_learning",
        sentences: trainedPairs,
        generatedPairs: generatedQuestionAnswerPairs,
        timestamp: Date.now()
      }]);
      
      alert(`${trainedPairs} cümle çifti analiz edildi ve ${generatedQuestionAnswerPairs} soru-cevap çifti oluşturuldu.`);
    }
  };

  // Chat functions
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessageId = Date.now().toString();
    const newUserMessage = {
      id: userMessageId,
      content: inputText,
      isUser: true,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    memorySystem.addMemory(inputText, 'short-term');
    
    // Clear input
    const userMessage = inputText.trim();
    setInputText("");
    setIsProcessing(true);
    
    // Prepare for animation
    setIsAnimating(true);
    setResponse(""); // Clear previous response
    
    try {
      // Propagate activation through neural network
      const result = propagateActivation(
        userNetworks,
        systemNetworks,
        relations,
        userMessage.toLowerCase(),
        animationSpeed
      );
      
      if (result && result.activationPath) {
        // Set activated nodes for visualization
        const formattedActivationPath = result.activationPath.map(node => ({
          layer: node.layer,
          row: node.row,
          col: node.col,
          type: node.type,
          score: node.value * 100
        }));
        
        setActivatedNodes(formattedActivationPath);
        
        // Get contextual memories
        const memories = memorySystem.getContextualMemories(userMessage);
        
        // Eğitim geçmişinden yararlan
        const trainingPairs = trainHistory.map(item => ({
          userInput: item.userInput,
          systemOutput: item.systemOutput,
          timestamp: item.timestamp
        }));
        
        // Gelişmiş yanıt üretme algoritmasını kullan
        const response = await generateResponse(userMessage, {
          useActivation: true,
          userNetworks,
          systemNetworks,
          relations,
          activeMemories: memories.map(m => m.content),
          trainingHistory: trainingPairs
        });
        
        const aiResponse = response.text;
        
        // Add timing delay for natural feel
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add system response
        const aiMessageId = (Date.now() + 1).toString();
        const newAiMessage = {
          id: aiMessageId,
          content: aiResponse,
          isUser: false,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, newAiMessage]);
        setResponse(aiResponse);
        setResponseScore(Math.round(response.confidence * 100) || 50);
        
        // Add to memory system
        memorySystem.addMemory(aiResponse, 'short-term', [userMessage]);
      }
    } catch (error) {
      console.error("Yanıt oluştururken hata:", error);
      
      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        isUser: false,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setIsAnimating(false);
    }
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle keydown in input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Message feedback handler
  const handleFeedback = (messageId: string, isPositive: boolean) => {
    // Find message
    const message = messages.find(m => m.id === messageId);
    if (!message || message.isUser) return;
    
    // Update message with feedback
    setMessages(prev => 
      prev.map(m => 
        m.id === messageId ? 
          { ...m, feedback: isPositive ? 1 : -1 } : 
          m
      )
    );
    
    // Adjust memory strength
    memorySystem.reinforceMemory(message.content, isPositive ? 15 : -10);
    
    // Update relations if feedback is for AI response
    if (!message.isUser) {
      // Find the user message that preceded this AI response
      const msgIndex = messages.findIndex(m => m.id === messageId);
      if (msgIndex > 0) {
        const prevUserMessage = messages[msgIndex - 1];
        if (prevUserMessage && prevUserMessage.isUser) {
          // If positive feedback, add to training
          if (isPositive) {
            trainNetwork(prevUserMessage.content, message.content, false);
            
            // Eğitim geçmişine belgeyi ekleyin
            setTrainHistory(prev => {
              // Önce aynı girişin olup olmadığını kontrol edin
              const existingIndex = prev.findIndex(item => 
                item.userInput.toLowerCase() === prevUserMessage.content.toLowerCase()
              );
              
              // Varsa güncelle, yoksa ekle
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                  userInput: prevUserMessage.content,
                  systemOutput: message.content,
                  timestamp: Date.now()
                };
                return updated;
              } else {
                return [...prev, {
                  userInput: prevUserMessage.content,
                  systemOutput: message.content,
                  timestamp: Date.now()
                }];
              }
            });
          } else {
            // Negatif geri bildirim - doğru cevap istenecek
            // Soru metnini state'e kaydet (doğru cevap modalı için)
            setInputText(prevUserMessage.content);
            
            // Doğru cevap modalını aç
            setShowCorrectAnswer(true);
          }
        }
      }
    }
  };

  const handleReset = () => {
    if (window.confirm("Tüm eğitim verilerini silmek istediğinizden emin misiniz?")) {
      setUserNetworks(Array(networkLayers).fill().map(() => createEmptyGrid(networkRows, networkCols)));
      setSystemNetworks(Array(networkLayers).fill().map(() => createEmptyGrid(networkRows, networkCols)));
      setRelations([]);
      setBidirectionalRelations([]);
      setTrainHistory([]);
      setAiImprovements([]);
      setInputText("");
      setResponse("");
      setActivatedNodes([]);
      setResponseScore(null);
      setMessages([]);
      localStorage.removeItem("chatbot_relations");
      localStorage.removeItem("chatbot_bidirectional");
      localStorage.removeItem("chatbot_history");
      localStorage.removeItem("chatbot_improvements");
    }
  };

  const calculateNodeColor = (activation, type) => {
    const baseColor = type === "user" ? "rgb(99, 102, 241)" : "rgb(168, 85, 247)";
    const baseOpacity = 0.2 + (activation * 0.8);
    return baseColor.replace("rgb", "rgba").replace(")", `, ${baseOpacity})`);
  };

  const findPositionInAllLayers = (word) => {
    for (let layer = 0; layer < networkLayers; layer++) {
      for (let row = 0; row < networkRows; row++) {
        for (let col = 0; col < networkCols; col++) {
          if (systemNetworks[layer][row][col]?.word === word.toLowerCase()) {
            return { layer, row, col };
          }
        }
      }
    }
    return null;
  };

  const renderNetworkLayer = (networks, type, layerIndex) => {
    return (
      <div className="relative">
        <div className={`grid grid-cols-10 md:grid-cols-20 gap-1 rounded-lg p-2 shadow-inner ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {networks[layerIndex].flat().map((node, idx) => {
            const row = Math.floor(idx / networkCols);
            const col = idx % networkCols;
            
            const isActivated = activatedNodes.some(
              n => n.type === type && n.layer === layerIndex && n.row === row && n.col === col
            );
            
            const activatedNode = activatedNodes.find(
              n => n.type === type && n.layer === layerIndex && n.row === row && n.col === col
            );
            
            let nodeStyle = {};
            let nodeClasses = `flex items-center justify-center rounded-full transition-all duration-300 w-3 h-3 md:w-4 md:h-4 ${
              isDarkMode ? 'shadow-[0_0_10px_rgba(255,255,255,0.1)]' : ''
            }`;
            
            if (node) {
              if (isActivated) {
                nodeClasses += type === "user" ? 
                  " bg-blue-500 shadow-lg shadow-blue-300/50 scale-150 z-10" : 
                  " bg-purple-500 shadow-lg shadow-purple-300/50 scale-150 z-10";
                nodeClasses += " node-active";
              } else {
                nodeStyle.backgroundColor = calculateNodeColor(node.activation, type);
                nodeClasses += " shadow-sm hover:scale-125 transition-transform cursor-pointer";
              }
            } else {
              nodeClasses += isDarkMode ? " bg-gray-700" : " bg-gray-200";
            }
            
            return (
              <div
                key={idx}
                className={nodeClasses}
                style={nodeStyle}
                title={node ? `${node.word} (${node.count})` : ""}
                onClick={() => {
                  if (node) {
                    setSelectedCell({
                      ...node,
                      layer: layerIndex,
                      type: type
                    });
                    setShowCellDetails(true);
                  }
                }}
              >
                {isActivated && visualMode === "detailed" && node && (
                  <span className={`absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {node.word}
                    {activatedNode?.score && ` (${Math.round(activatedNode.score)})`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {visualMode === "detailed" && (
          <div className={`mt-1 text-xs text-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Katman {layerIndex + 1}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen theme-transition ${
      isDarkMode ? 'dark bg-gradient-to-br from-gray-900 to-purple-950' : 'bg-gradient-to-br from-indigo-50 to-purple-100'
    } p-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 relative">
          <button
            onClick={toggleTheme}
            className={`absolute right-0 top-0 p-3 rounded-full transition-all duration-300 shadow-md ${
              isDarkMode 
                ? 'text-yellow-400 hover:bg-gray-800/50 hover:scale-110 glass-morphism' 
                : 'text-indigo-600 hover:bg-white/70 hover:scale-110 glass-morphism'
            }`}
          >
            {isDarkMode ? <Sun size={24} className="animate-pulse" /> : <Moon size={24} />}
          </button>
          <h1 className={`text-3xl md:text-4xl font-extrabold mb-3 ${
            isDarkMode 
              ? 'text-white text-shadow-lg' 
              : 'bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600'
          }`}>
            🧠 Gelişmiş Sinir Ağı Tabanlı Sohbet Robotu
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-purple-200' : 'text-indigo-700'}`}>
            <span className="font-medium">Kendi kendini geliştiren</span> ve <span className="font-medium">kullanıcı dönütleriyle öğrenen</span>
          </p>
        </div>
        
        {/* Görünüm seçimi butonları */}
        <div className="flex flex-wrap justify-center mb-6 gap-4">
          <button
            onClick={() => setShowNetworkView(false)}
            className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 shadow-md ${
              !showNetworkView
                ? isDarkMode
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20'
                : isDarkMode
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 glass-morphism'
                  : 'bg-white/60 text-gray-700 hover:bg-white/80 glass-morphism'
            }`}
          >
            <FileText size={20} className="mr-3" />
            <span className="font-semibold">Sohbet Ara Yüzü</span>
          </button>
          <button
            onClick={() => setShowNetworkView(true)}
            className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 shadow-md ${
              showNetworkView
                ? isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-700 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                : isDarkMode
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/70 glass-morphism'
                  : 'bg-white/60 text-gray-700 hover:bg-white/80 glass-morphism'
            }`}
          >
            <Layers size={20} className="mr-3" />
            <span className="font-semibold">Sinir Ağı Görselleştirmesi</span>
          </button>
        </div>
        
        {showNetworkView ? (
          <div className={`mb-8 rounded-xl shadow-lg p-6 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
                <div className="flex-1"></div>
                <div className={`flex items-center gap-2 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span>Görünüm:</span>
                  <select
                    className={`border rounded p-1 text-sm ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white'
                    }`}
                    value={visualMode}
                    onChange={e => setVisualMode(e.target.value)}
                    disabled={isAnimating}
                  >
                    <option value="simple">Basit</option>
                    <option value="detailed">Detaylı</option>
                  </select>
                  
                  <span className="ml-2">Animasyon:</span>
                  <select
                    className={`border rounded p-1 text-sm ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white'
                    }`}
                    value={animationSpeed}
                    onChange={e => setAnimationSpeed(Number(e.target.value))}
                    disabled={isAnimating}
                  >
                    <option value="100">Çok Hızlı</option>
                    <option value="300">Hızlı</option>
                    <option value="500">Orta</option>
                    <option value="800">Yavaş</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col gap-2 w-full md:w-4/5 mb-6">
                  {/* Kullanıcı ağı */}
                  <div className="mb-3">
                    <h2 className={`text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>Kullanıcı Sinir Ağı</h2>
                    <div className="space-y-2">
                      {Array.from({ length: Math.min(3, networkLayers) }).map((_, i) => (
                        <div key={`user-${i}`}>
                          {renderNetworkLayer(userNetworks, "user", i)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sistem ağı */}
                  <div>
                    <h2 className={`text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>Sistem Sinir Ağı</h2>
                    <div className="space-y-2">
                      {Array.from({ length: Math.min(3, networkLayers) }).map((_, i) => (
                        <div key={`system-${i}`}>
                          {renderNetworkLayer(systemNetworks, "system", i)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sonuç skoru */}
                {responseScore !== null && (
                  <div className={`mb-4 px-4 py-2 rounded-full ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <span className="font-medium mr-1">Yanıt Skoru:</span>
                    <span className={
                      responseScore > 75 ? 'text-green-500' :
                      responseScore > 50 ? 'text-yellow-500' :
                      'text-red-500'
                    }>{responseScore}</span>
                  </div>
                )}

                {/* Kontrol Paneli */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <button
                    onClick={() => setShowBatchTraining(true)}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
                        : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                    }`}
                  >
                    <Database size={18} className="mr-2" />
                    <span>Toplu Eğitim</span>
                  </button>
                  
                  <button
                    onClick={() => setShowCorrectAnswer(true)}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'bg-green-700 hover:bg-green-600 text-white'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                    disabled={!inputText}
                  >
                    <RefreshCw size={18} className="mr-2" />
                    <span>Düzeltme Ekle</span>
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'bg-red-700 hover:bg-red-600 text-white'
                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                    }`}
                  >
                    <RotateCcw size={18} className="mr-2" />
                    <span>Sıfırla</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat interface
          <div className={`rounded-xl shadow-lg border overflow-hidden ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex flex-col h-[80vh]">
              {/* Header */}
              <div className={`p-4 border-b ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <span className="mr-2">💬</span> Sohbet Asistanı
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Benimle konuş, her konuşmada kendimi geliştiriyorum
                </p>
              </div>
              
              {/* Messages area */}
              <div 
                className={`flex-1 p-4 overflow-y-auto ${
                  isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
                }`}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className={`mb-2 p-3 rounded-full ${
                      isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                    }`}>
                      <BookText size={32} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                    </div>
                    <h3 className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Hoş Geldiniz!
                    </h3>
                    <p className={`text-sm max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Benimle konuşmaya başlayın. Her sohbet beni daha akıllı yapar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] md:max-w-[60%] rounded-lg px-4 py-2 ${
                          message.isUser 
                            ? isDarkMode 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-indigo-500 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-200'
                              : 'bg-white text-gray-700 border border-gray-200'
                        }`}>
                          <p>{message.content}</p>
                          {!message.isUser && (
                            <div className="flex justify-end mt-2 text-xs space-x-2">
                              <button 
                                className={`p-1 rounded hover:bg-opacity-30 ${
                                  isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                } ${message.feedback === -1 ? (isDarkMode ? 'bg-red-900 bg-opacity-50' : 'bg-red-100') : ''}`}
                                onClick={() => handleFeedback(message.id, false)}
                              >
                                <X size={14} className={`${
                                  message.feedback === -1 
                                    ? 'text-red-400' 
                                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              </button>
                              <button 
                                className={`p-1 rounded hover:bg-opacity-30 ${
                                  isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                } ${message.feedback === 1 ? (isDarkMode ? 'bg-green-900 bg-opacity-50' : 'bg-green-100') : ''}`}
                                onClick={() => handleFeedback(message.id, true)}
                              >
                                <CheckCircle2 size={14} className={`${
                                  message.feedback === 1 
                                    ? 'text-green-400' 
                                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Input area */}
              <div className={`p-4 border-t ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Bir mesaj yazın..."
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-indigo-500' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500'
                      } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                      disabled={isProcessing}
                    />
                  </div>
                  <button
                    className={`p-2 rounded-lg ${
                      isProcessing || !inputText.trim() 
                        ? isDarkMode 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                    onClick={handleSendMessage}
                    disabled={isProcessing || !inputText.trim()}
                  >
                    <Send size={20} />
                  </button>
                </div>
                
                <div className="flex justify-between mt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNetworkView(true)}
                      className={`text-xs px-2 py-1 rounded ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Layers size={12} className="inline mr-1" />
                      Ağ Görünümü
                    </button>
                    <button
                      onClick={() => setShowBatchTraining(true)}
                      className={`text-xs px-2 py-1 rounded ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Database size={12} className="inline mr-1" />
                      Toplu Eğitim
                    </button>
                  </div>
                  
                  {isProcessing && (
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Düşünüyor...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    {showCellDetails && selectedCell && (
      <CellDetailsModal
        cell={selectedCell}
        relations={relations}
        bidirectionalRelations={bidirectionalRelations}
        isDarkMode={isDarkMode}
        onClose={() => {
          setShowCellDetails(false);
          setSelectedCell(null);
        }}
      />
    )}

    {showCorrectAnswer && (
      <CorrectAnswerModal
        isDarkMode={isDarkMode}
        onSubmit={handleCorrectAnswer}
        onClose={() => setShowCorrectAnswer(false)}
      />
    )}

    {showBatchTraining && (
      <BatchTrainingModal
        isDarkMode={isDarkMode}
        onSubmit={handleBatchTraining}
        onClose={() => setShowBatchTraining(false)}
      />
    )}
    </div>
  );
}
