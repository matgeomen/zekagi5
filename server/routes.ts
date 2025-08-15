import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { EnhancedMemorySystem } from "../client/src/lib/EnhancedMemorySystem";
import { searchInternet } from "./api/search";

interface MessageRequest {
  message: string;
}

interface TrainingRequest {
  input: string;
  output: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize memory system for server-side processing (optional)
  const memorySystem = new EnhancedMemorySystem();

  // API endpoint for internet search
  app.post('/api/search', searchInternet);

  // API endpoint to process a message
  app.post('/api/chat', async (req, res) => {
    try {
      const { message } = req.body as MessageRequest;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'Geçerli bir mesaj göndermelisiniz' 
        });
      }

      // Add to memory system
      memorySystem.addMemory(message, 'short-term');
      
      // Generate questions and answers from the message
      memorySystem.extractAndLearnFromText(message);
      
      // Get relevant memories
      const contextualMemories = memorySystem.getContextualMemories(message);

      return res.json({
        success: true,
        contextualMemories,
        memoryStats: {
          shortTermCount: memorySystem.shortTerm.length,
          longTermCount: memorySystem.longTerm.length,
          clustersCount: memorySystem.memoryClusters.length
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Mesaj işlenirken bir hata oluştu' 
      });
    }
  });

  // API endpoint to train the memory system
  app.post('/api/train', async (req, res) => {
    try {
      const { input, output } = req.body as TrainingRequest;
      
      if (!input || !output || typeof input !== 'string' || typeof output !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'Geçerli eğitim verileri göndermelisiniz' 
        });
      }

      // Add to memory system
      memorySystem.addMemory(input, 'short-term');
      memorySystem.addMemory(output, 'long-term', [], input);
      
      // Generate questions and answers
      memorySystem.extractAndLearnFromText(input);
      memorySystem.extractAndLearnFromText(output);

      return res.json({
        success: true,
        memoryStats: {
          shortTermCount: memorySystem.shortTerm.length,
          longTermCount: memorySystem.longTerm.length,
          clustersCount: memorySystem.memoryClusters.length
        }
      });
    } catch (error) {
      console.error('Error training system:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Eğitim sırasında bir hata oluştu' 
      });
    }
  });

  // API endpoint to get memory system statistics
  app.get('/api/memory-stats', (req, res) => {
    try {
      return res.json({
        success: true,
        stats: {
          shortTermCount: memorySystem.shortTerm.length,
          longTermCount: memorySystem.longTerm.length,
          clustersCount: memorySystem.memoryClusters.length
        }
      });
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Bellek istatistikleri alınırken bir hata oluştu' 
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket on same HTTP server to avoid port conflicts
  // WebSocket path is different from Vite's HMR WebSocket to avoid conflicts
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  console.log('WebSocket server attached to HTTP server on path /ws');

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'chat') {
          // Process chat message
          memorySystem.extractAndLearnFromText(data.message);
          
          // Send back success message
          ws.send(JSON.stringify({
            type: 'message_processed',
            success: true
          }));
        }
        else if (data.type === 'train') {
          // Train system with provided data
          memorySystem.addMemory(data.input, 'short-term');
          memorySystem.addMemory(data.output, 'long-term', [], data.input);
          
          // Notify client of successful training
          ws.send(JSON.stringify({
            type: 'training_complete',
            success: true
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'İşlem sırasında bir hata oluştu'
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
