import { Handler } from '@netlify/functions';
import serverless from 'serverless-http';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Basit arama endpoint'i
app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Mock arama sonuçları (gerçek bir projede burası dış API çağrısı olacak)
    const mockResults = [
      {
        title: "Örnek Sonuç 1",
        content: `${query} ile ilgili bilgiler bulundu.`,
        url: "https://example.com/1",
        relevance: 0.9,
        timestamp: Date.now()
      },
      {
        title: "Örnek Sonuç 2", 
        content: `${query} hakkında detaylı açıklama.`,
        url: "https://example.com/2",
        relevance: 0.8,
        timestamp: Date.now()
      }
    ];

    res.json({
      success: true,
      results: mockResults
    });
  } catch (error) {
    console.error('Arama hatası:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Arama sırasında hata oluştu' 
    });
  }
});

// Sohbet endpoint'i
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    // Basit yanıt oluşturucu (gerçek projede neural network burada olacak)
    const responses = [
      `"${message}" konusu hakkında bilgi verebilirim.`,
      `${message} ile ilgili yardımcı olabilirim.`,
      `Bu konuda size nasıl yardımcı olabilirim?`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    res.json({
      success: true,
      response: randomResponse,
      confidence: 0.8
    });
  } catch (error) {
    console.error('Sohbet hatası:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Sohbet sırasında hata oluştu' 
    });
  }
});

// Serverless handler with proper typing
const serverlessHandler = serverless(app);

export const handler: Handler = async (event, context) => {
  const result = await serverlessHandler(event, context);
  return result;
};