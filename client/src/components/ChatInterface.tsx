import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  confidence?: number;
  usedTraining?: any;
  notification?: string;
}

function ChatInterface() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Notification system'i neural network hook'a bağla
  useEffect(() => {
    const notificationHandler = {
      show: (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
      }
    };

    setNotificationRef(notificationHandler);

    return () => {
      setNotificationRef(null);
    };
  }, [setNotificationRef]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="bg-white text-gray-800 dark:bg-gray-800 dark:text-white min-h-screen">
        <header className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chat Interface</h1>
          {/* Theme button has been removed as per request */}
        </header>
        <main className="p-4">
          <p>This is the main content of the chat interface.</p>
        </main>
      </div>
    </div>
  );
}

export default ChatInterface;