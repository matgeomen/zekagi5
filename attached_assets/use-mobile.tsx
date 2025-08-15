import { useState, useEffect } from 'react';

// Mobil cihazlar için ekran boyutu kontrolü yapan hook
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768); // 768px altı mobil olarak kabul edilir (Tailwind md breakpoint)
    }

    // İlk yükleme kontrolü
    handleResize();
    
    // Ekran boyutu değiştiğinde kontrol
    window.addEventListener('resize', handleResize);
    
    // Temizleme fonksiyonu
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
