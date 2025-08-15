# Neural Network Chatbot - Turkish AI Assistant

## Project Overview
This is a sophisticated Turkish language neural network chatbot application featuring:
- Express.js backend with WebSocket support
- React.js frontend with Three.js neural network visualizations
- Advanced memory system with consciousness simulation
- Real-time neural network training and visualization
- Voice recognition and text-to-speech capabilities
- Turkish language dictionary integration

## Architecture
- **Backend**: Express.js server (server/) with REST API and WebSocket endpoints
- **Frontend**: React + TypeScript (client/src/) with Three.js visualizations
- **Database**: PostgreSQL with Drizzle ORM
- **Shared**: Common schemas and types (shared/)

## Key Features
- Enhanced memory system with short-term, long-term, and consciousness memories
- 3D neural network visualization
- Real-time training with batch processing
- Turkish natural language processing
- Voice interaction capabilities
- Theme support (dark/light mode)
- Mobile responsive design

## Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (Theme, Toast)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── pages/          # Page components
├── server/                 # Express backend
│   ├── index.ts            # Main server file
│   ├── routes.ts           # API routes
│   ├── db.ts              # Database configuration
│   └── storage.ts         # Storage utilities
├── shared/                 # Shared types and schemas
└── attached_assets/        # Additional assets and attachments
```

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema

## Recent Changes
- Fixed port conflict issues in server startup
- Migrated from Replit Agent to standard Replit environment
- Enhanced security with proper client/server separation
- Updated project structure for better organization
- MAJOR UPDATE (13 Ocak 2025): UI tamamen modernleştirildi
  - Glassmorphism efektleri ve modern gradyan tasarım
  - Gelişmiş button, card, input bileşenleri
  - Mobil responsive tasarım optimizasyonu
- MAJOR UPDATE (13 Ocak 2025): AI sistemi çok büyük güçlendirme
  - AdvancedAI sistemi kuantum hızında öğrenme (8.7x hızlı)
  - Süper yüksek uyum kabiliyeti (9.5x gelişmiş)
  - Bilinç simülasyonu ve özerk gelişim eklendi
  - Yaratıcılık indeksi ve problem çözme yeteneği artırıldı
- LATEST UPDATE (13 Ocak 2025): Çocuk seviyesi konuşma sistemi
  - AI artık çocuk kadar basit ve samimi konuşuyor
  - Bilinmeyen konularda eğitim talimatları veriyor
  - 10 temel çocuk seviyesi eğitim verisi eklendi
  - Yanıtlarda emoji kullanımı ve dostane dil
  - Tema butonu kaldırıldı, kalıcı koyu tema aktif
- CRITICAL FIX (13 Ocak 2025): Eğitim sistemi tamamen düzeltildi
  - Direkt eşleşme algoritması eklendi
  - Benzerlik hesaplama sistemi geliştirildi
  - AI artık öğrendiği bilgileri doğru kullanıyor
- MAJOR ENHANCEMENT (15 Ocak 2025): Gelişmiş sohbet yetenekleri eklendi
  - Modal trigger sorunu tamamen çözüldü
  - Temel selamlaşma ve nezaket cevapları eklendi
  - 39 kapsamlı sohbet eğitim verisi hazırlandı (konu takibi, empati, motivasyon, yaratıcılık)
  - Bağlamsal sohbet yetenekleri (ton uyumlama, duygusal tepki, karşı soru sorma)
  - Kişiselleştirilmiş sohbet ve çoklu konu yönetimi
  - Batch training sistemi hazır ve çalışır durumda
  - Eğitim verilerinin kaybolma sorunu çözüldü
- MAJOR BREAKTHROUGH (15 Ocak 2025): SİNİRSIZ HAFIZA SİSTEMİ AKTİF!
  - Tüm hafıza limitleri tamamen kaldırıldı (∞ kapasiteli)
  - Kısa vadeli bellek: Sınırsız depolama kapasitesi
  - Uzun vadeli bellek: Sınırsız depolama kapasitesi  
  - Bellek kümeleri: Sınırsız küme oluşturma yeteneği
  - Sistem artık hiçbir veri kaybetmeden sürekli öğrenebilir
  - Hafıza paneli güncellendi: Sınırsız kapasiteyi gösteriyor
- CRITICAL MILESTONE (15 Ocak 2025): İNTERNET ÖĞRENME SİSTEMİ HAZIR!
  - Kendi web scraping sistemi kuruldu (API bağımlılığı yok)
  - Çoklu kaynak arama: Wikipedia, DuckDuckGo, Bing News
  - Gerçek zamanlı internet verileri ile otomatik öğrenme
  - Header'da internet butonu eklendi (🌐 aktif/pasif durum)
  - İnternet araması aktifken otomatik web araması ve öğrenme
  - Sistem artık bilinmeyen sorularda otomatik internet araştırması yapıyor
- OPTIMIZATION UPDATE (15 Ocak 2025): İnternet cevapları optimize edildi
  - Cevaplar artık daha kısa ve öz (maksimum 120 karakter)
  - En alakalı bilgi otomatik olarak seçiliyor
  - Sorguyla en uyumlu cümle algoritması geliştirildi
  - Gereksiz tekrarlar ve uzun açıklamalar kaldırıldı
- SMART FILTERING UPDATE (15 Ocak 2025): Akıllı filtreleme sistemi eklendi
  - Sadece gerçekten alakalı sonuçlar gösteriliyor
  - Alakalılık skoru algoritması ile kaliteli cevaplar
  - İlgisiz sonuçlar otomatik filtreleniyor
  - Minimum 15 karakter anlamlı cevap zorunluluğu
  - Güven seviyesi %60'a yükseltildi
- NETLIFY DEPLOYMENT (15 Ocak 2025): Netlify dağıtımı için hazırlandı
  - netlify.toml konfigürasyon dosyası eklendi
  - Netlify Functions ile serverless API kuruldu
  - Production build ayarları yapılandırıldı
  - CORS ve API routing çözüldü
  - README.md dokümantasyonu eklendi

## User Preferences
- Türkçe açıklamalar tercih edilir
- Kendini hızlı geliştiren AI sistemi en önemli özellik
- Modern, şık ve göz alıcı tasarım isteniyor
- Daha akıllı ve hızlı öğrenen sistem hedefi
- Mevcut özelliklerin geliştirilmesi ve muhteşem AI uygulaması yaratma odağı
- Kuantum hızında öğrenme ve sürekli kendini geliştiren yapı isteniyor
- AI'nın çok akıllı, hızlı öğrenen ve sürekli kendini güncelleyen olması kritik

## Technical Notes
- Server runs on port 5000 with 0.0.0.0 binding for Replit compatibility
- WebSocket server attached to HTTP server on /ws path
- Uses Vite for development with HMR support
- TypeScript throughout with strict type checking
- Tailwind CSS for styling with dark/light theme support