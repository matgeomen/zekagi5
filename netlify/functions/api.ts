import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Parse path to determine endpoint
  const path = event.path.replace('/.netlify/functions/api', '');
  
  try {
    if (path === '/search' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { query } = body;
      
      if (!query) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Query is required' })
        };
      }

      // Simüle edilmiş arama sonuçları
      const mockResults = [
        {
          title: `${query} Hakkında`,
          content: `${query} konusunda genel bilgiler bulunmaktadır. Bu konuda daha detaylı araştırma yapabilirsiniz.`,
          url: `https://example.com/${encodeURIComponent(query)}`,
          relevance: 0.85,
          timestamp: Date.now()
        },
        {
          title: `${query} - Detaylar`,
          content: `${query} ile ilgili kapsamlı bilgiler ve açıklamalar mevcuttur.`,
          url: `https://example.com/details/${encodeURIComponent(query)}`,
          relevance: 0.75,
          timestamp: Date.now()
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          results: mockResults
        })
      };
    }

    if (path === '/health' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          environment: 'netlify'
        })
      };
    }

    // 404 for unknown paths
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};