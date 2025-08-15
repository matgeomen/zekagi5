import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Varsayılan değerler oluştur
const defaultToastContext: ToastContextType = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {}
};

// Toast bağlam oluştur (varsayılan değerlerle)
const ToastContext = createContext<ToastContextType>(defaultToastContext);

// Toast sağlayıcı bileşeni
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Benzersiz kimlik oluşturma
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 9);
  };
  
  // Toast ekleme işlevi
  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000): void => {
    const id = generateId();
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Otomatik kaldırma
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);
  
  // Toast kaldırma işlevi
  const removeToast = useCallback((id: string): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  // Bağlam değerini hazırla
  const contextValue = {
    toasts,
    addToast,
    removeToast
  };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast arayüzü */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
          {toasts.map(toast => (
            <div 
              key={toast.id}
              className={`p-4 rounded-md shadow-lg text-white flex justify-between items-center animate-slide-in
                ${toast.type === 'success' ? 'bg-green-500' : 
                toast.type === 'error' ? 'bg-red-500' : 
                toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
            >
              <span>{toast.message}</span>
              <button 
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

// Custom hook
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  return context;
};
