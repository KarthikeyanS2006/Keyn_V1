import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageGenerator from './components/ImageGenerator';
import { ThemeProvider } from './context/ThemeContext';
import SettingsModal from './components/SettingsModal';

const AppContent: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-orange-500/30 transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 transition-colors duration-500"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 transition-colors duration-500"></div>
      </div>
      
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <ImageGenerator />
        </div>
      </main>

      <Footer />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;