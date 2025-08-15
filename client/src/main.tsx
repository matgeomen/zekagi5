
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { Toaster } from './components/ui/toaster'

// Global hata yakalama
window.addEventListener('unhandledrejection', (event) => {
  console.error('Yakalanmamış Promise hatası:', event.reason);
  // Event'i engellemeyerek React'ın kendi hata sınırlarının çalışmasına izin ver
});

window.addEventListener('error', (event) => {
  console.error('Genel JavaScript hatası:', event.error);
});

// Root elemanının var olduğundan emin ol
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// DOM hazır kontrolü
const startApp = () => {
  console.log('Uygulama başlatılıyor...');
  
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <ThemeProvider>
        <ToastProvider>
          <App />
          <Toaster />
        </ToastProvider>
      </ThemeProvider>
    </StrictMode>
  );
};

// DOM hazır olduğunda başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
