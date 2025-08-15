import { useState, useEffect } from 'react';

// Mobil cihaz tespiti için hook
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // İlk render'da kontrol et
    const checkIfMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < breakpoint);
      }
    };
    
    checkIfMobile();
    
    // Ekran boyutu değişikliklerini dinle
    window.addEventListener('resize', checkIfMobile);
    
    // Temizleme fonksiyonu
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [breakpoint]);
  
  return isMobile;
}

// Geriye dönük uyumluluk için varsayılan export
export default useIsMobile;
